"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useDeviceTier } from "@/lib/device";
import type { Photo } from "@/content/photos";

/* ───────────────────────────── shaders ───────────────────────────── */

const vert = /* glsl */ `
  uniform float uTime; uniform float uWind; uniform float uBend; uniform vec2 uMouse; uniform float uHover; uniform float uPinned;
  varying vec2 vUv; varying float vLift;
  void main() {
    vUv = uv;
    vec3 p = position;
    // A print pinned at its top edge, breathing in the wind: more travel toward the bottom corners.
    float fromTop = 1.0 - uv.y;
    float edge = smoothstep(0.0, 1.0, abs(uv.x - 0.5) * 2.0);
    float w = sin(uTime * 1.4 + uv.x * 4.0 + uv.y * 2.0) * 0.5 + sin(uTime * 2.3 + uv.y * 6.0 - uv.x * 3.0) * 0.3;
    float lift = w * uWind * (0.07 + 0.42 * fromTop * fromTop) * (0.45 + 0.55 * edge);
    // Scroll velocity bends the whole sheet like a card being dragged through air.
    lift += uBend * (uv.x - 0.5) * (uv.x - 0.5) * 0.9;
    // Cursor presses into the sheet.
    float d = distance(uv, uMouse);
    float press = smoothstep(0.42, 0.0, d) * uHover;
    lift -= press * 0.22;
    p.z += lift * uPinned;
    vLift = lift + press;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap; uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform float uGrain; uniform float uReveal;
  varying vec2 vUv; varying float vLift;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  void main() {
    // Slight chromatic split that follows the cursor, like a loupe over a print.
    vec2 dir = (vUv - uMouse);
    float d = length(dir);
    vec3 col;
    if (uHover > 0.002) {
      float ca = smoothstep(0.5, 0.0, d) * uHover * 0.0028;
      vec2 off = normalize(dir + 1e-5) * ca;
      col = vec3(texture2D(uMap, vUv + off).r, texture2D(uMap, vUv).g, texture2D(uMap, vUv - off).b);
    } else {
      col = texture2D(uMap, vUv).rgb;
    }
    // Paper-like shading from the cloth displacement.
    col *= 1.0 + vLift * 0.35;
    // Archival grain.
    float n = hash(vUv * 900.0 + fract(uTime)) - 0.5;
    col += n * uGrain;
    // Reveal wipe from the bottom as the print enters.
    float a = smoothstep(0.0, 0.08, uReveal - (1.0 - vUv.y) * 0.9);
    gl_FragColor = vec4(col, a);
  }
`;

/* ───────────────────────────── scene ───────────────────────────── */

interface Shared {
  progress: number; // 0..1 along the wall
  velocity: number; // px/frame from lenis
  mouse: THREE.Vector2; // NDC
  pointerDown: boolean;
  /** Pointer hover effects are mouse-only; a finger has no hover state to track. */
  hover: boolean;
  /** Plane tessellation, dropped on phones — the wind displacement is very low frequency. */
  segs: readonly [number, number];
  /** Use the 900px texture set: 11 x 1800px prints is ~127 MB of VRAM, enough to lose the context. */
  lowRes: boolean;
  setActive: (i: number) => void; // called with the print actually centred in view
}

const CAM_Z = 4.6;
const CAM_FOV = 40;
/** Visible world height at the camera distance — the frame the wall has to fit inside. */
const VIS_H = 2 * Math.tan((CAM_FOV * Math.PI) / 360) * CAM_Z; // ~3.35
const H_MAX = 2.15; // world height of a print on a wide screen
const GAP_RATIO = 0.42 / H_MAX;
const Y = 0.28; // prints sit slightly above centre to leave room for captions

/**
 * Print height, gap and total wall width for a given viewport aspect. A fixed world height
 * only works while the viewport is wider than it is tall: in portrait a landscape print sized
 * by height is far wider than the frame, so the photograph was cropped off both edges and no
 * single image was ever fully visible. Sizing by the widest aspect keeps a common top edge
 * (they hang like prints on a wall) while guaranteeing every one of them fits.
 */
function wallMetrics(aspect: number, photos: readonly Photo[]): { h: number; gap: number; total: number } {
  const visW = VIS_H * aspect;
  let maxAr = 1;
  for (const p of photos) maxAr = Math.max(maxAr, p.width / p.height);
  // Portrait runs the prints nearly edge to edge; there is no room to be precious about margins.
  const fill = aspect < 1 ? 1 : 0.94;
  const h = Math.min(H_MAX, (visW * fill) / maxAr, VIS_H * 0.68);
  const gap = h * GAP_RATIO;
  let total = 0;
  for (const p of photos) total += (p.width / p.height) * h + gap;
  return { h, gap, total };
}

function Print({ photo, x, h: H, shared, index }: { photo: Photo; x: number; h: number; shared: Shared; index: number }) {
  const tex = useTexture(shared.lowRes ? photo.small : photo.src);
  const mesh = useRef<THREE.Mesh>(null);
  const w = (photo.width / photo.height) * H;
  const uniforms = useMemo(
    () => ({
      uMap: { value: tex },
      uTime: { value: index * 7.3 },
      uWind: { value: 0.25 },
      uBend: { value: 0 },
      uMouse: { value: new THREE.Vector2(-10, -10) },
      uHover: { value: 0 },
      uGrain: { value: 0.05 },
      uReveal: { value: 0 },
      uPinned: { value: 1 },
    }),
    [tex, index],
  );
  const { camera, size } = useThree();
  const hit = useMemo(() => ({ ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), uv: new THREE.Vector2(-10, -10) }), []);

  // Runs during render, before the texture is ever uploaded. Doing this in an effect and then
  // setting needsUpdate re-uploaded all eleven 1800px images a frame after mount.
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = shared.hover ? 4 : 1;
  }, [tex, shared.hover]);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    uniforms.uTime.value += dt;
    // Bend & wind respond to how fast the user is scrolling.
    const v = THREE.MathUtils.clamp(shared.velocity / 40, -1, 1);
    uniforms.uBend.value += (v - uniforms.uBend.value) * (1 - Math.pow(0.002, dt));
    uniforms.uWind.value += (0.25 + Math.abs(v) * 0.8 - uniforms.uWind.value) * (1 - Math.pow(0.01, dt));
    // Reveal when the print is within the viewport.
    const sx = m.position.x - state.camera.position.x;
    const visible = Math.abs(sx) < (size.width / size.height) * 6;
    uniforms.uReveal.value += ((visible ? 1.9 : 0) - uniforms.uReveal.value) * (1 - Math.pow(0.02, dt));
    // Cursor → uv on this print. Skipped entirely on touch: it is eleven mesh raycasts per frame
    // for an effect a finger cannot produce, and shared.mouse would stay parked under the last tap.
    if (shared.hover) {
      hit.ray.setFromCamera(shared.mouse, camera);
      const inter = hit.ray.intersectObject(m, false)[0];
      const hover = inter?.uv ? 1 : 0;
      if (inter?.uv) uniforms.uMouse.value.lerp(inter.uv, 0.25);
      uniforms.uHover.value += (hover * (shared.pointerDown ? 1.6 : 1) - uniforms.uHover.value) * (1 - Math.pow(0.01, dt));
    }
    // Subtle float + tilt toward the cursor.
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, (uniforms.uMouse.value.x - 0.5) * -0.12 * uniforms.uHover.value + v * 0.08, 0.1);
    m.position.y = Y + Math.sin(uniforms.uTime.value * 0.6) * 0.03;
  });

  // Own the material so the uniform objects mutated in useFrame are exactly the ones the GPU reads.
  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, side: THREE.DoubleSide }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh ref={mesh} position={[x + w / 2, Y, 0]} material={material}>
      <planeGeometry args={[w, H, shared.segs[0], shared.segs[1]]} />
    </mesh>
  );
}

function Wall({ photos, shared }: { photos: readonly Photo[]; shared: Shared }) {
  const { camera, size } = useThree();
  const { h: H, gap: GAP } = useMemo(() => wallMetrics(size.width / size.height, photos), [size.width, size.height, photos]);
  const xs = useMemo(() => {
    let x = 0;
    return photos.map((p) => {
      const start = x;
      x += (p.width / p.height) * H + GAP;
      return start;
    });
  }, [photos, H, GAP]);
  // Centre of each print in world space — the caption follows whichever of these the camera is nearest,
  // so text and image can never drift apart (prints have unequal widths, and the camera eases).
  const centres = useMemo(() => photos.map((p, i) => xs[i] + ((p.width / p.height) * H) / 2), [photos, xs, H]);
  useFrame((_, dt) => {
    const first = centres[0];
    // Both ends centre a print, so the first and last are fully in frame rather than half past the edge.
    const last = centres[centres.length - 1];
    const target = THREE.MathUtils.lerp(first, Math.max(first, last), shared.progress);
    camera.position.x += (target - camera.position.x) * (1 - Math.pow(0.001, dt));
    let nearest = 0;
    for (let i = 1; i < centres.length; i++) {
      if (Math.abs(centres[i] - camera.position.x) < Math.abs(centres[nearest] - camera.position.x)) nearest = i;
    }
    shared.setActive(nearest);
  });
  return (
    <>
      {photos.map((p, i) => (
        <Print key={p.slug} photo={p} x={xs[i]} h={H} shared={shared} index={i} />
      ))}
    </>
  );
}

/* ───────────────────────────── DOM wrapper ───────────────────────────── */

interface Props {
  photos: readonly Photo[];
}

/**
 * A wall of archival prints rendered in WebGL. The section pins; scrolling slides the wall,
 * bends the prints with your scroll speed, and the cursor presses into them.
 */
export function PhotoWall({ photos }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const activeRef = useRef(0);
  const drag = useRef({ on: false, pending: false, lastX: 0, startX: 0, startY: 0, moved: 0, start: 0, end: 0 });
  // The wall is a pinned, position:fixed element; reading its rect inside pointermove flushed
  // style+layout on every single move event. Its geometry only changes on resize/refresh.
  const rect = useRef<DOMRect | null>(null);
  const measure = useCallback(() => {
    const r = wrap.current?.getBoundingClientRect() ?? null;
    rect.current = r;
    if (r && r.height > 0) setAspect(r.width / r.height);
    return r;
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, [measure]);
  const setActive = useCallback((i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    const el = wrap.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>("[data-caption]").forEach((c, j) => c.setAttribute("data-active", j === i ? "true" : "false"));
    el.querySelectorAll<HTMLElement>("[data-ghost-year]").forEach((c, j) => c.setAttribute("data-active", j === i ? "true" : "false"));
    el.querySelectorAll<HTMLElement>("[data-frame-tick]").forEach((c, j) => c.setAttribute("data-active", j <= i ? "true" : "false"));
    const counter = el.querySelector<HTMLElement>("[data-counter]");
    if (counter) counter.textContent = String(i + 1).padStart(2, "0");
  }, []);
  const tier = useDeviceTier();
  const coarse = tier !== "high";
  const [visible, setVisible] = useState(false);
  const shared = useMemo<Shared>(
    () => ({
      progress: 0,
      velocity: 0,
      mouse: new THREE.Vector2(-10, -10),
      pointerDown: false,
      hover: !coarse,
      segs: coarse ? ([12, 8] as const) : ([48, 32] as const),
      lowRes: coarse,
      setActive,
    }),
    [setActive, coarse],
  );

  // The wall used to render every frame for the entire 53,000px document, even while it was
  // 40,000px offscreen — a second full WebGL scene competing with the sky canvas.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "40% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [aspect, setAspect] = useState(16 / 9);
  const total = useMemo(() => wallMetrics(aspect, photos).total, [aspect, photos]);

  useGSAP(
    () => {
      const el = wrap.current;
      if (!el || !ready) return;
      if (reduced) {
        shared.progress = 0;
        return;
      }
      const obj = { p: 0 };
      let lastY = 0;
      gsap.to(obj, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: `+=${Math.round(photos.length * 55 + 25)}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            drag.current.start = self.start;
            drag.current.end = self.end;
            measure();
          },
          onUpdate: (self) => {
            // The camera eases toward its target, so hold at the end of the wall for the last stretch
            // of scroll — otherwise the pin releases before the final print has settled into frame.
            shared.progress = Math.min(1, obj.p / 0.88);
            shared.velocity = (self.scroll() - lastY) * 0.6;
            lastY = self.scroll();
          },
        },
      });
      return () => ScrollTrigger.getAll().forEach((t) => t.trigger === el && t.kill());
    },
    { dependencies: [ready, reduced, photos.length, measure], scope: wrap },
  );

  const onMove = (e: React.PointerEvent) => {
    const r = rect.current ?? measure();
    if (!r) return;
    const d = drag.current;
    if (shared.hover) shared.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    // A finger that has not yet committed to a direction: let the browser have the vertical pan,
    // and only take over once the gesture is decisively horizontal. Engaging on every touchmove
    // meant a couple of pixels of thumb wobble drove lenis.scrollTo() against the native scroll,
    // and the two fought each other for the whole swipe.
    if (d.pending) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dy) > 10) d.pending = false;
      else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        d.pending = false;
        d.on = true;
        d.lastX = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
    // Drag → scrub the pinned scroll, so wheel, scrollbar and drag all stay in sync.
    if (d.on && d.end > d.start) {
      const dx = e.clientX - d.lastX;
      d.lastX = e.clientX;
      d.moved += Math.abs(dx);
      const viewW = VIS_H * (r.width / r.height); // world units visible
      const wallPx = (total / viewW) * r.width; // the whole wall, in screen pixels
      const scrollPerPx = (d.end - d.start) / Math.max(1, wallPx - r.width);
      const target = window.scrollY - dx * scrollPerPx;
      if (lenis) lenis.scrollTo(target, { immediate: true });
      else window.scrollTo(0, target);
    }
  };
  const onLeave = () => {
    shared.mouse.set(-10, -10);
    shared.pointerDown = false;
    drag.current.on = false;
    drag.current.pending = false;
  };
  const onDown = (e: React.PointerEvent) => {
    const d = drag.current;
    shared.pointerDown = true;
    d.moved = 0;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.lastX = e.clientX;
    if (e.pointerType === "touch") {
      // Wait for a direction before claiming the gesture.
      d.pending = true;
      d.on = false;
      return;
    }
    d.pending = false;
    d.on = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onUp = (e: React.PointerEvent) => {
    shared.pointerDown = false;
    drag.current.on = false;
    drag.current.pending = false;
    // pointerleave is unreliable for touch, so without this the last tap position stayed live
    // and every print kept reporting a hover for the rest of the session.
    shared.mouse.set(-10, -10);
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={wrap}
      className="relative h-[100svh] w-full overflow-hidden"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      data-cursor="drag"
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      {/* Backdrop behind the prints: ghost year of the active photo, drifting cirrus, contact-sheet rail. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="archive-cirrus" style={{ top: "22%", animationDuration: "92s" }} />
        <div className="archive-cirrus" style={{ top: "58%", animationDuration: "128s", animationDelay: "-40s", opacity: 0.5 }} />
        <div className="archive-cirrus" style={{ top: "78%", animationDuration: "110s", animationDelay: "-75s", opacity: 0.7 }} />
        <div className="absolute inset-0 flex items-center justify-center">
          {photos.map((p, i) => (
            <span
              key={p.slug}
              data-ghost-year
              data-active={i === 0 ? "true" : "false"}
              className="display text-stroke absolute text-[clamp(9rem,26vw,24rem)] leading-none font-extrabold tracking-[-0.04em] text-transparent transition-[opacity,transform] duration-1000 ease-[var(--ease-climb)] data-[active=false]:translate-y-6 data-[active=false]:opacity-0 data-[active=false]:duration-500"
              style={{ WebkitTextStrokeColor: "color-mix(in oklab, var(--ink) 34%, transparent)", fontVariationSettings: '"wdth" 118' }}
            >
              {p.year ?? "—"}
            </span>
          ))}
        </div>
        {/* contact-sheet rail */}
        <div className="mono absolute inset-x-[var(--gutter)] top-[calc(var(--gutter)*0.9)] flex items-end justify-between text-[0.55rem] tracking-[0.22em] text-[var(--ink)]/45 uppercase">
          <span className="whitespace-nowrap">Archive · Contact sheet</span>
          <span className="hidden items-end gap-[0.9rem] sm:flex">
            {photos.map((p, i) => (
              <span key={p.slug} data-frame-tick data-active={i === 0 ? "true" : "false"} className="flex flex-col items-center gap-1">
                <span className="h-2 w-px bg-current opacity-40 transition-opacity duration-500 data-[active=true]:opacity-100" />
                <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="absolute inset-x-[var(--gutter)] top-[calc(var(--gutter)*0.9+1.6rem)] h-px bg-[var(--ink)]/12" />
      </div>
      <Canvas
        dpr={tier === "low" ? 1 : tier === "mid" ? [1, 1.25] : [1, 1.75]}
        frameloop={visible ? "always" : "demand"}
        gl={{ alpha: true, antialias: !coarse, powerPreference: "high-performance", stencil: false, depth: false }}
        camera={{ position: [0, 0, 4.6], fov: 40, near: 0.1, far: 50 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Wall photos={photos} shared={shared} />
        </Suspense>
      </Canvas>

      {/* Captions: all rendered once, the active one is switched via data-active (no React re-render inside the pin). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-[calc(var(--gutter)*0.8)]">
        <div className="relative min-h-[11rem] max-w-[34rem] sm:min-h-[9.5rem]">
          {photos.map((p, i) => (
            <div
              key={p.slug}
              data-caption
              data-active={i === 0 ? "true" : "false"}
              className="absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-700 ease-[var(--ease-climb)] data-[active=false]:translate-y-3 data-[active=false]:opacity-0 data-[active=false]:duration-300"
            >
              <p className="eyebrow mb-2">
                {p.year ?? "—"} · {p.place ?? "Unknown"}
              </p>
              <p className="display text-[clamp(1.15rem,5vw,2rem)] leading-[1.15] font-semibold text-[var(--ink)]">{p.title}</p>
              <p className="mt-2 max-w-[30rem] text-[0.8rem] leading-[1.45] text-[var(--ink)]/80 sm:text-[0.95rem] sm:leading-[1.5]">{p.caption}</p>
              <p className="mono mt-2.5 pr-16 text-[0.55rem] leading-[1.5] tracking-[0.1em] text-[var(--ink)]/55 sm:mt-3 sm:pr-0 sm:text-[0.6rem] sm:tracking-[0.12em]">
                © {p.author} · {p.license}
              </p>
            </div>
          ))}
        </div>
        <p className="mono absolute bottom-[calc(var(--gutter)*0.8)] right-[var(--gutter)] text-[0.75rem] tracking-[0.2em] text-[var(--ink)]/70">
          <span data-counter>01</span> <span className="opacity-50">/ {String(photos.length).padStart(2, "0")}</span>
        </p>
      </div>
    </div>
  );
}
