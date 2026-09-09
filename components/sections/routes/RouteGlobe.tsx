"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { flight, useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useDeviceTier } from "@/lib/device";
import { MODEL_OFFSET, MODEL_URL } from "@/components/canvas/Concorde";
import { AIRPORTS, PLANE_ROUTE_ID, ROUTES, latLonToVector3, makeArc, type AirportCode, type RouteKind } from "./routes-data";

/* ── Tuning ──────────────────────────────────────────────────────────── */
const DEG = Math.PI / 180;
/** three.js example texture (MIT): dark = land, light = water. */
const LAND_MASK_URL = "/textures/earth-spec.jpg";
const DOT_COUNT = 14_000;
const DOT_SIZE_PX = 2.2;
const FOV = 35;
/** Camera azimuth (= longitude facing the camera) at scroll start / end. */
const START_LON = -35;
const END_LON = 140;
/** Camera elevation above the equator so the northern routes read well. */
const TILT = 0.32;
const SPIN_RATE = 0.04; // rad/s
const PARALLAX = 0.08; // rad
const PLANE_SCALE = 0.0022;
const PLANE_LIFT = 0.012;
const LOOP_RATE = 0.05; // progress/s once the scrub has passed the end
const LOOP_HOLD = 0.3; // extra progress "parked" at the destination before looping
/** The aircraft leg is drawn by the aircraft itself over this share of the scroll. */
const PLANE_SCROLL_SHARE = 0.5;
const TRAIL_POINTS = 64;
const TRAIL_STRIDE = 0.0035;
const GEAR_NODES = new Set(["Object_27", "Object_29", "Object_31"]);

/* ── Shaders ─────────────────────────────────────────────────────────── */
const dotsVert = /* glsl */ `
  uniform float uSize; uniform float uPixelRatio;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Unit sphere: the position is the normal. View-space z tells front from back.
    vFacing = normalize(normalMatrix * position).z;
    gl_PointSize = uSize * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;
const dotsFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying float vFacing;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.32, 0.5, d);
    float side = mix(0.10, 1.0, smoothstep(0.05, 0.45, vFacing));
    float a = disc * side * uOpacity;
    if (a < 0.005) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
const rimVert = /* glsl */ `
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const rimFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    // Back faces of a slightly larger sphere: brightest where they meet the globe's edge,
    // fading to nothing at the outer silhouette.
    float d = abs(dot(normalize(vNormal), normalize(vView)));
    float rim = pow(smoothstep(0.0, 0.34, d), 1.6);
    gl_FragColor = vec4(uColor, rim * uOpacity);
    #include <colorspace_fragment>
  }
`;
const trailVert = /* glsl */ `
  attribute float aAlpha;
  varying float vA;
  void main() {
    vA = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const trailFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying float vA;
  void main() {
    gl_FragColor = vec4(uColor, vA * uOpacity);
    #include <colorspace_fragment>
  }
`;

/* ── Types ───────────────────────────────────────────────────────────── */
/** Written by the ScrollTrigger scrub, read inside useFrame. Never React state. */
interface Drive {
  progress: number;
}

interface Palette {
  ink: THREE.Color;
  paper: THREE.Color;
  accent: THREE.Color;
}

interface Leg {
  kind: RouteKind;
  from: AirportCode;
  to: AirportCode;
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;
  fullIndexCount: number;
  /** Scroll window in which the leg draws in. */
  start: number;
  duration: number;
  reveal: number;
}

interface Marker {
  code: AirportCode;
  kind: RouteKind;
  pulse: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  mark: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  phase: number;
  legs: Leg[];
}

interface Trail {
  line: THREE.Line<THREE.BufferGeometry, THREE.ShaderMaterial>;
  positions: Float32Array;
  last: THREE.Vector3;
  primed: boolean;
}

interface Globe {
  root: THREE.Group;
  dots: THREE.ShaderMaterial;
  rim: THREE.ShaderMaterial;
  tint: THREE.MeshBasicMaterial;
  legs: Leg[];
  planeCurve: THREE.CatmullRomCurve3;
  markers: Marker[];
  trail: Trail;
  /** Colour slots to refresh from the CSS variables. */
  slots: Record<keyof Palette, THREE.Color[]>;
  palette: Palette;
  probe: CanvasRenderingContext2D | null;
  disposables: Array<{ dispose: () => void }>;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
/** Scratch objects for the frame loop (only ever used within one synchronous callback). */
const _pos = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3();
const _look = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Resolve any CSS colour string (hex, rgb(), color(), oklab()…) through a 2D canvas. */
function readCssColor(name: string, probe: CanvasRenderingContext2D, out: THREE.Color): void {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = raw;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  out.setRGB(d[0] / 255, d[1] / 255, d[2] / 255, THREE.SRGBColorSpace);
}

function refreshPalette(g: Globe): void {
  if (!g.probe) return;
  readCssColor("--ink", g.probe, g.palette.ink);
  readCssColor("--paper", g.probe, g.palette.paper);
  readCssColor("--accent", g.probe, g.palette.accent);
  (Object.keys(g.slots) as Array<keyof Palette>).forEach((key) => {
    const c = g.palette[key];
    g.slots[key].forEach((slot) => slot.copy(c));
  });
}

interface LandMask {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function sampleMask(img: HTMLImageElement): LandMask | null {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}

/** Fibonacci sphere, keeping only the points that land on land. */
function buildDots(count: number, mask: LandMask | null): THREE.BufferGeometry {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const kept: number[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    if (mask) {
      const lat = Math.asin(y) / DEG;
      const lon = Math.atan2(x, z) / DEG;
      const px = Math.min(mask.width - 1, Math.floor(((lon + 180) / 360) * mask.width));
      const py = Math.min(mask.height - 1, Math.floor(((90 - lat) / 180) * mask.height));
      if (mask.data[(py * mask.width + px) * 4] > 110) continue; // water
    }
    kept.push(x, y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(kept), 3));
  return geometry;
}

function loadLandDots(count: number): Promise<THREE.BufferGeometry> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(buildDots(count, sampleMask(img)));
    // No mask → a plain dotted sphere rather than nothing.
    img.onerror = () => resolve(buildDots(count, null));
    img.src = LAND_MASK_URL;
  });
}

function setTubeReveal(leg: Leg, reveal: number): void {
  const segments = leg.mesh.geometry.parameters.tubularSegments;
  const radial = leg.mesh.geometry.parameters.radialSegments;
  const shown = Math.floor(reveal * segments) * radial * 6;
  leg.mesh.geometry.setDrawRange(0, Math.min(leg.fullIndexCount, shown));
  leg.mesh.visible = shown > 0;
}

/** Everything except the land dots (which arrive asynchronously) and the aircraft. */
function buildGlobe(): Globe {
  const root = new THREE.Group();
  const disposables: Globe["disposables"] = [];
  const palette: Palette = { ink: new THREE.Color("#eef2ff"), paper: new THREE.Color("#070b1a"), accent: new THREE.Color("#ff6a3d") };
  const slots: Globe["slots"] = { ink: [], paper: [], accent: [] };

  // Tint sphere: writes depth so far-side arcs and the aircraft are hidden; dims the interior.
  const tintGeo = new THREE.SphereGeometry(0.995, 64, 48);
  const tint = new THREE.MeshBasicMaterial({ color: palette.paper, transparent: true, opacity: 0.35, depthWrite: true });
  const tintMesh = new THREE.Mesh(tintGeo, tint);
  tintMesh.renderOrder = 0;
  root.add(tintMesh);
  slots.paper.push(tint.color);
  disposables.push(tintGeo, tint);

  // Atmosphere rim.
  const rimGeo = new THREE.SphereGeometry(1.055, 64, 48);
  const rim = new THREE.ShaderMaterial({
    vertexShader: rimVert,
    fragmentShader: rimFrag,
    uniforms: { uColor: { value: palette.accent.clone() }, uOpacity: { value: 0.25 } },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rim);
  rimMesh.renderOrder = 0.5;
  root.add(rimMesh);
  slots.accent.push(rim.uniforms.uColor.value as THREE.Color);
  disposables.push(rimGeo, rim);

  // Land dots material (the geometry is attached once the mask has been sampled).
  const dots = new THREE.ShaderMaterial({
    vertexShader: dotsVert,
    fragmentShader: dotsFrag,
    uniforms: {
      uColor: { value: palette.ink.clone() },
      uOpacity: { value: 0.85 },
      uSize: { value: DOT_SIZE_PX },
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  slots.ink.push(dots.uniforms.uColor.value as THREE.Color);
  disposables.push(dots);

  // Route arcs, in drawing order.
  const legs: Leg[] = [];
  let planeCurve: THREE.CatmullRomCurve3 | null = null;
  let scheduledIndex = 0;
  let recordIndex = 0;
  ROUTES.forEach((route) => {
    for (let i = 0; i < route.via.length - 1; i++) {
      const from = route.via[i];
      const to = route.via[i + 1];
      const a = latLonToVector3(AIRPORTS[from].lat, AIRPORTS[from].lon, 1.003);
      const b = latLonToVector3(AIRPORTS[to].lat, AIRPORTS[to].lon, 1.003);
      const curve = makeArc(a, b);
      const isPlaneLeg = route.id === PLANE_ROUTE_ID;
      const record = route.kind === "record";
      const geometry = new THREE.TubeGeometry(curve, 80, record ? 0.0022 : 0.0045, 6, false);
      const material = new THREE.MeshBasicMaterial({
        color: record ? palette.ink : palette.accent,
        transparent: true,
        opacity: record ? 0.5 : 0.95,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 2;
      mesh.visible = false;
      root.add(mesh);
      slots[record ? "ink" : "accent"].push(material.color);
      disposables.push(geometry, material);

      let start: number;
      let duration: number;
      if (isPlaneLeg) {
        start = 0;
        duration = PLANE_SCROLL_SHARE;
        planeCurve = curve;
      } else if (record) {
        start = 0.48 + recordIndex * 0.055;
        duration = 0.11;
        recordIndex++;
      } else {
        start = 0.06 + scheduledIndex * 0.075;
        duration = 0.15;
        scheduledIndex++;
      }
      legs.push({ kind: route.kind, from, to, curve, mesh, fullIndexCount: geometry.index?.count ?? 0, start, duration, reveal: -1 });
    }
  });
  if (!planeCurve) throw new Error(`RouteGlobe: route "${PLANE_ROUTE_ID}" not found`);

  // Endpoint markers: filled dot for scheduled airports, hollow ring for record-only stops,
  // plus a pulsing ring on every one.
  const ringGeo = new THREE.RingGeometry(0.011, 0.016, 40);
  const dotGeo = new THREE.CircleGeometry(0.0065, 24);
  const hollowGeo = new THREE.RingGeometry(0.0045, 0.0072, 32);
  disposables.push(ringGeo, dotGeo, hollowGeo);
  const markers: Marker[] = [];
  (Object.keys(AIRPORTS) as AirportCode[]).forEach((code, index) => {
    const touching = legs.filter((leg) => leg.from === code || leg.to === code);
    if (touching.length === 0) return;
    const kind: RouteKind = touching.some((leg) => leg.kind === "scheduled") ? "scheduled" : "record";
    const pos = latLonToVector3(AIRPORTS[code].lat, AIRPORTS[code].lon, 1.006);
    const outward = pos.clone().multiplyScalar(2);

    const pulseMat = new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const pulse = new THREE.Mesh(ringGeo, pulseMat);
    pulse.position.copy(pos);
    pulse.lookAt(outward);
    pulse.renderOrder = 2;
    root.add(pulse);

    const markMat = new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const mark = new THREE.Mesh(kind === "scheduled" ? dotGeo : hollowGeo, markMat);
    mark.position.copy(pos);
    mark.lookAt(outward);
    mark.renderOrder = 2;
    root.add(mark);

    slots[kind === "scheduled" ? "accent" : "ink"].push(pulseMat.color, markMat.color);
    disposables.push(pulseMat, markMat);
    markers.push({ code, kind, pulse, mark, phase: (index * 0.37) % 1, legs: touching });
  });

  // Aircraft trail: a hairline that fades towards its tail, in the same space as the globe.
  const trailGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(TRAIL_POINTS * 3);
  const alphas = new Float32Array(TRAIL_POINTS);
  for (let i = 0; i < TRAIL_POINTS; i++) alphas[i] = Math.pow(i / (TRAIL_POINTS - 1), 1.5);
  trailGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  trailGeo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  const trailMat = new THREE.ShaderMaterial({
    vertexShader: trailVert,
    fragmentShader: trailFrag,
    uniforms: { uColor: { value: palette.ink.clone() }, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
  });
  const line = new THREE.Line(trailGeo, trailMat);
  line.frustumCulled = false;
  line.renderOrder = 2;
  root.add(line);
  slots.ink.push(trailMat.uniforms.uColor.value as THREE.Color);
  disposables.push(trailGeo, trailMat);

  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = 1;
  probeCanvas.height = 1;

  return {
    root,
    dots,
    rim,
    tint,
    legs,
    planeCurve,
    markers,
    trail: { line, positions, last: new THREE.Vector3(), primed: false },
    slots,
    palette,
    probe: probeCanvas.getContext("2d", { willReadFrequently: true }),
    disposables,
  };
}

/* ── Scene pieces ────────────────────────────────────────────────────── */
interface SceneProps {
  driveRef: RefObject<Drive>;
  reduced: boolean;
}

/** Orbits the camera around the fixed globe: scroll → longitude, slow spin, pointer parallax. */
function CameraRig({ driveRef, reduced }: SceneProps) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const rig = useRef({ distance: 3.4, spin: 0, px: 0, py: 0 });

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / size.height;
    const landscape = aspect >= 1;
    const halfV = (FOV / 2) * DEG;
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    // Fit the globe with margin to spare: the view offset below nudges it, so leave headroom
    // or the silhouette gets clipped flat by the canvas edge.
    // Portrait: fill more of the (narrow) width — 0.92 of the horizontal half-angle instead of 0.82
    // — so the globe reads as the subject rather than a small marble in a tall empty frame.
    rig.current.distance = 1 / Math.sin((landscape ? 0.86 : 0.92) * (landscape ? halfV : halfH));
    camera.fov = FOV;
    camera.near = 0.1;
    camera.far = 30;
    camera.setViewOffset(
      size.width,
      size.height,
      landscape ? -0.13 * size.width : 0,
      // …and sit high in the frame, leaving the lower third for the copy that scrolls over it.
      landscape ? -0.02 * size.height : 0.17 * size.height,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, dtRaw) => {
    const r = rig.current;
    const dt = Math.min(dtRaw, 0.1);
    const p = reduced ? 0 : driveRef.current.progress;
    const lon = START_LON + (END_LON - START_LON) * easeInOut(clamp01((p - 0.3) / 0.7));
    if (!reduced) {
      r.spin += dt * SPIN_RATE;
      const k = 1 - Math.exp(-dt * 4);
      r.px += (flight.pointer.x * PARALLAX - r.px) * k;
      r.py += (flight.pointer.y * PARALLAX - r.py) * k;
    }
    const azimuth = lon * DEG + r.spin + r.px;
    const elevation = TILT - r.py;
    camera.position.setFromSphericalCoords(r.distance, Math.PI / 2 - elevation, azimuth);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Publishes the canvas' `invalidate` so the ScrollTrigger can paint a single frame while the
 * frameloop is on demand. It must never call `setFrameloop`: <Canvas> re-runs `configure()` on
 * every render and stamps the `frameloop` prop back over any imperative change, so the prop is
 * the only durable source of truth (see the `active` state in RouteGlobe).
 */
function Invalidator({ invalidateRef }: { invalidateRef: RefObject<(() => void) | null> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidateRef.current = invalidate;
    invalidate();
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);
  return null;
}

interface MiniConcordeProps {
  planeRef: RefObject<THREE.Group | null>;
  globeRef: RefObject<Globe | null>;
}

/** The same cached glb as the hero aircraft, ~0.13 units long, in a single ink-coloured material. */
function MiniConcorde({ planeRef, globeRef }: MiniConcordeProps) {
  const { scene } = useGLTF(MODEL_URL, false, true);
  const holder = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    const h = holder.current;
    if (!h) return;
    const model = scene.clone(true);
    // Own material: the shared glb materials carry the hero's droop-nose shader and env-map tuning.
    const material = new THREE.MeshStandardMaterial({ color: "#eef2ff", roughness: 0.55, metalness: 0.05, transparent: true });
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.material = material;
      obj.frustumCulled = false;
      obj.renderOrder = 3;
      if (GEAR_NODES.has(obj.name)) obj.visible = false;
    });
    h.add(model);
    materialRef.current = material;
    return () => {
      h.remove(model);
      material.dispose();
      materialRef.current = null;
    };
  }, [scene]);

  useFrame(() => {
    const m = materialRef.current;
    const g = globeRef.current;
    if (m && g) m.color.copy(g.palette.ink);
  });

  return (
    <group ref={planeRef}>
      {/* Scale first, then the model-space offset inside the scaled frame so the aircraft pivots on its centre. */}
      <group scale={PLANE_SCALE}>
        <group ref={holder} position={MODEL_OFFSET} />
      </group>
    </group>
  );
}

function GlobeScene({ driveRef, reduced }: SceneProps) {
  const root = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Group>(null);
  const globeRef = useRef<Globe | null>(null);
  const anim = useRef({ loopT: 0, looping: false, time: 0, paletteAt: -1 });

  useEffect(() => {
    const g = root.current;
    if (!g) return;
    const globe = buildGlobe();
    g.add(globe.root);
    globeRef.current = globe;
    let alive = true;
    let points: THREE.Points | null = null;
    loadLandDots(DOT_COUNT).then((geometry) => {
      if (!alive) {
        geometry.dispose();
        return;
      }
      points = new THREE.Points(geometry, globe.dots);
      points.frustumCulled = false;
      points.renderOrder = 1;
      globe.root.add(points);
    });
    return () => {
      alive = false;
      g.remove(globe.root);
      points?.geometry.dispose();
      globe.disposables.forEach((d) => d.dispose());
      globeRef.current = null;
    };
  }, []);

  useFrame((state, dtRaw) => {
    const g = globeRef.current;
    if (!g) return;
    const a = anim.current;
    const dt = Math.min(dtRaw, 0.1);
    // Our own clock, not state.clock.elapsedTime: R3F zeroes that on every setFrameloop — which
    // now happens each time the globe scrolls in or out of view — and the throttles below would
    // then sit in the future for as long as the old clock had been running, freezing the palette
    // on whatever chapter's colours happened to be live at the reset.
    a.time += dt;
    const time = a.time;

    // Colours follow the altitude/theme variables (they transition between chapters).
    if (time - a.paletteAt > 0.25) {
      a.paletteAt = time;
      refreshPalette(g);
    }
    g.dots.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    const p = reduced ? 1 : driveRef.current.progress;

    // Arcs draw in on their scroll windows (the aircraft leg draws under the aircraft).
    g.legs.forEach((leg) => {
      const reveal = reduced ? 1 : clamp01((p - leg.start) / leg.duration);
      if (reveal !== leg.reveal) {
        leg.reveal = reveal;
        setTubeReveal(leg, reveal);
      }
    });

    // Endpoint markers appear with their legs; the ring pulses outward.
    g.markers.forEach((marker) => {
      let alpha = 0;
      marker.legs.forEach((leg) => {
        const own = leg.from === marker.code ? (leg.reveal > 0.001 ? 1 : 0) : smoothstep(0.85, 1, leg.reveal);
        alpha = Math.max(alpha, own);
      });
      const k = reduced ? 0.35 : (time * 0.55 + marker.phase) % 1;
      const s = 1 + 1.8 * k;
      marker.pulse.scale.setScalar(s);
      marker.pulse.material.opacity = (1 - k) * (1 - k) * 0.7 * alpha;
      marker.mark.material.opacity = alpha * (marker.kind === "scheduled" ? 0.95 : 0.6);
      marker.pulse.visible = alpha > 0;
      marker.mark.visible = alpha > 0;
    });

    // Aircraft: scrubbed along its leg, then a slow loop once the scrub has passed the end.
    const scrollT = reduced ? 1 : clamp01(p / PLANE_SCROLL_SHARE);
    let t: number;
    let wrapped = false;
    if (reduced) {
      t = 1;
    } else if (scrollT < 1) {
      a.looping = false;
      t = scrollT;
    } else {
      if (!a.looping) {
        a.looping = true;
        a.loopT = 1; // start parked at the destination, then loop
      }
      a.loopT += dt * LOOP_RATE;
      if (a.loopT >= 1 + LOOP_HOLD) {
        a.loopT -= 1 + LOOP_HOLD;
        wrapped = true;
      }
      t = Math.min(1, a.loopT);
    }

    const plane = planeRef.current;
    if (plane) {
      const curve = g.planeCurve;
      curve.getPointAt(t, _pos);
      curve.getTangentAt(t, _tangent);
      _up.copy(_pos).normalize();
      _pos.addScaledVector(_up, PLANE_LIFT);
      plane.position.copy(_pos);
      // Model nose points to -Z; Matrix4.lookAt aims -Z at the target.
      _m.lookAt(_pos, _look.copy(_pos).add(_tangent), _up);
      plane.quaternion.setFromRotationMatrix(_m);
      plane.quaternion.multiply(_q.setFromAxisAngle(Z_AXIS, -0.22 * Math.sin(Math.PI * t)));

      // Trail: shift in a new sample once the aircraft has moved a stride; the head always follows.
      const tr = g.trail;
      const pos = tr.positions;
      const n = TRAIL_POINTS;
      if (wrapped || !tr.primed) {
        for (let i = 0; i < n; i++) _pos.toArray(pos, i * 3);
        tr.primed = true;
        tr.last.copy(_pos);
      } else if (_pos.distanceTo(tr.last) >= TRAIL_STRIDE) {
        pos.copyWithin(0, 3);
        tr.last.copy(_pos);
      }
      _pos.toArray(pos, (n - 1) * 3);
      tr.line.geometry.getAttribute("position").needsUpdate = true;
      tr.line.material.uniforms.uOpacity.value = reduced ? 0 : 0.7;
    }
  });

  return (
    <group ref={root}>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#1b2540", 1.3]} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={2.2} />
      <Suspense fallback={null}>
        <MiniConcorde planeRef={planeRef} globeRef={globeRef} />
      </Suspense>
    </group>
  );
}

/* ── Public component ────────────────────────────────────────────────── */
interface Props {
  /** Overlay content pinned with the globe (e.g. a legend). */
  children?: ReactNode;
}

/**
 * Dotted globe the miniature Concorde flies over. Lives in its own transparent canvas inside a
 * sticky 100vh container; the chapter around it is taller so the globe holds while copy scrolls.
 * Scroll progress through the chapter drives the arcs, the aircraft and the camera longitude.
 */
export default function RouteGlobe({ children }: Props) {
  const tier = useDeviceTier();
  const coarse = tier !== "high";
  const container = useRef<HTMLDivElement>(null);
  const driveRef = useRef<Drive>({ progress: 0 });
  const invalidateRef = useRef<(() => void) | null>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  // Drives the `frameloop` prop, and so has to be React state: <Canvas> re-runs `configure()` on
  // every render and re-applies that prop, which would undo any imperative setFrameloop the moment
  // anything above re-rendered (`ready` flipping, for one) — leaving the globe frozen mid-chapter.
  const [active, setActive] = useState(false);

  // Only run the loop while the chapter is near the viewport; "demand" (not "never") elsewhere so
  // a stray invalidate can still paint, and the globe can never end up stuck on a stale frame.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "30% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = container.current;
      if (!el || !ready) return;
      const section = el.closest<HTMLElement>("[data-chapter]") ?? el.parentElement;
      if (!section) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          driveRef.current,
          { progress: 0 },
          {
            progress: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: () => invalidateRef.current?.(), // paint even if the frameloop is on demand
              onRefresh: () => invalidateRef.current?.(),
            },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        driveRef.current.progress = 1;
      });
      // The globe deliberately overflows the bottom of its sticky canvas; once the sticky releases
      // that edge would show as a hard crop, so fade the whole canvas out as it scrolls away.
      gsap.fromTo(
        el,
        { opacity: 1 },
        { opacity: 0, ease: "none", scrollTrigger: { trigger: section, start: "bottom bottom", end: "bottom 72%", scrub: 0.6, invalidateOnRefresh: true } },
      );
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(raf);
        mm.revert();
      };
    },
    { dependencies: [ready], scope: container },
  );

  return (
    <div ref={container} className="sticky top-0 h-[100svh] w-full overflow-hidden">
      <Canvas
        flat
        dpr={tier === "low" ? 1 : tier === "mid" ? [1, 1.25] : [1, 1.75]}
        frameloop={active ? "always" : "demand"}
        gl={{ alpha: true, antialias: !coarse, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: FOV, near: 0.1, far: 30, position: [0, 0, 3.4] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        eventSource={undefined}
        aria-hidden
      >
        <Invalidator invalidateRef={invalidateRef} />
        <CameraRig driveRef={driveRef} reduced={reduced} />
        <GlobeScene driveRef={driveRef} reduced={reduced} />
      </Canvas>
      {children}
    </div>
  );
}
