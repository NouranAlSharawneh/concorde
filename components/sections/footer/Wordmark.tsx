"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const STEP = 2; // device px between particles: dense enough to read as solid type at rest
const RADIUS = 130; // css px: how far from the cursor the word reacts
const NIGHT = [5, 7, 15] as const;
/** --ink per theme (globals.css). Read by name rather than computed style: mid-crossfade the computed value is a blend. */
const INK = { light: [14, 27, 43], dark: [238, 242, 255] } as const;

/**
 * The name, set as tall as the page is wide and — on a device with a cursor — made of particles:
 * tens of thousands of points sampled from the letter shapes, resting as solid type. Near the
 * cursor they brighten and scatter, then spring back. On touch and under reduced motion it is
 * ordinary gradient text.
 */
export function Wordmark() {
  const clip = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useUI((s) => s.ready);
  const theme = useUI((s) => s.theme);
  const reduced = useReducedMotion();

  // Fit to width. Font metrics differ between the fallback and the real face, so the size is
  // measured rather than guessed, and re-measured when fonts land or the row changes width.
  useLayoutEffect(() => {
    const el = clip.current;
    const word = el?.querySelector<HTMLElement>("[data-word]");
    if (!el || !word) return;
    const fit = () => {
      const target = el.clientWidth;
      const width = word.getBoundingClientRect().width;
      if (target === 0 || width === 0) return;
      const current = parseFloat(getComputedStyle(el).fontSize);
      const next = Math.floor(current * (target / width) * 100) / 100;
      if (Math.abs(next - current) > 0.5) el.style.fontSize = `${next}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  // Scroll reveal: the word rises into place as the aircraft leaves.
  useGSAP(
    () => {
      const el = clip.current;
      const stage = el?.querySelector<HTMLElement>("[data-stage]");
      if (!el || !stage || !ready) return;
      if (reduced) {
        gsap.set(stage, { yPercent: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(stage, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom 104%", scrub: 0.8 } });
    },
    { dependencies: [ready, reduced], scope: clip },
  );

  // The particle system. Fine pointers only: on touch there is nothing to hover, so the DOM text stays.
  useEffect(() => {
    const el = clip.current;
    const cv = canvas.current;
    const word = el?.querySelector<HTMLElement>("[data-word]");
    if (!el || !cv || !word || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    let w = 0; // device px
    let h = 0;
    let count = 0;
    let hx = new Float32Array(0); // home
    let hy = new Float32Array(0);
    let px = new Float32Array(0); // position
    let py = new Float32Array(0);
    let vx = new Float32Array(0); // velocity
    let vy = new Float32Array(0);
    let base = new Uint32Array(0); // resting colour per particle (gradient by height)
    let pixels: ImageData | null = null;
    let buf = new Uint32Array(0);
    let mx = -1e9; // cursor, device px; far away = no cursor
    let my = -1e9;
    let raf = 0;
    let alive = false;
    let disposed = false;
    const ink = INK[theme];

    const sample = async () => {
      dpr = Math.min(1.25, window.devicePixelRatio || 1);
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw === 0 || ch === 0) return;
      w = Math.round(cw * dpr);
      h = Math.round(ch * dpr);
      cv.width = w;
      cv.height = h;
      const style = getComputedStyle(word);
      const size = parseFloat(style.fontSize) * dpr;
      const font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
      try {
        await document.fonts.load(font);
      } catch {
        /* fall through: the fallback face still samples fine */
      }
      if (disposed) return;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const oc = off.getContext("2d", { willReadFrequently: true });
      if (!oc) return;
      oc.font = font;
      // Chrome/Safari honour these (wdth 75 and the CSS tracking); Firefox ignores them, and the
      // horizontal scale below fits the ink to the box either way.
      if ("fontStretch" in oc) oc.fontStretch = "condensed";
      if ("letterSpacing" in oc) oc.letterSpacing = "-0.015em";
      oc.textBaseline = "alphabetic";
      oc.fillStyle = "#fff";
      const m = oc.measureText("CONCORDE");
      const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const target = w - 2 * Math.round(0.05 * size); // same side padding the DOM word has
      const sx = target / inkW; // scale so the ink runs edge to edge whatever face rendered
      const x0 = Math.round(0.05 * size) + m.actualBoundingBoxLeft * sx;
      const y0 = (h - inkH) / 2 + m.actualBoundingBoxAscent;
      oc.setTransform(sx, 0, 0, 1, x0, y0);
      oc.fillText("CONCORDE", 0, 0);
      oc.setTransform(1, 0, 0, 1, 0, 0);
      const data = oc.getImageData(0, 0, w, h).data;
      // Count then fill, so the typed arrays are allocated once.
      let n = 0;
      for (let y = 1; y < h; y += STEP) for (let x = 1; x < w; x += STEP) if (data[(y * w + x) * 4 + 3] > 128) n++;
      count = n;
      hx = new Float32Array(n);
      hy = new Float32Array(n);
      px = new Float32Array(n);
      py = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      base = new Uint32Array(n);
      let i = 0;
      const top = (h - inkH) / 2;
      for (let y = 1; y < h; y += STEP) {
        // Gradient by height: ink at the cap line, sinking toward the night at the baseline.
        const t = Math.min(1, Math.max(0, (y - top) / inkH));
        const k = t < 0.6 ? 0 : (t - 0.6) / 0.4;
        const r = Math.round(ink[0] + (NIGHT[0] - ink[0]) * 0.58 * k);
        const g = Math.round(ink[1] + (NIGHT[1] - ink[1]) * 0.58 * k);
        const b = Math.round(ink[2] + (NIGHT[2] - ink[2]) * 0.58 * k);
        const colour = (255 << 24) | (b << 16) | (g << 8) | r;
        for (let x = 1; x < w; x += STEP) {
          if (data[(y * w + x) * 4 + 3] > 128) {
            hx[i] = px[i] = x;
            hy[i] = py[i] = y;
            base[i] = colour;
            i++;
          }
        }
      }
      pixels = ctx.createImageData(w, h);
      buf = new Uint32Array(pixels.data.buffer);
      draw();
    };

    const draw = () => {
      if (!pixels) return;
      buf.fill(0);
      const bright = (255 << 24) | (255 << 16) | (255 << 8) | 255;
      for (let i = 0; i < count; i++) {
        const x = px[i] | 0;
        const y = py[i] | 0;
        if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) continue;
        const dx = px[i] - hx[i];
        const dy = py[i] - hy[i];
        const disp = Math.sqrt(dx * dx + dy * dy);
        // Displaced particles glow: the further from home, the whiter.
        const c = disp < 1.5 ? base[i] : disp > 14 ? bright : mix(base[i], bright, (disp - 1.5) / 12.5);
        const o = y * w + x;
        buf[o] = c;
        buf[o + 1] = c;
        buf[o + w] = c;
        buf[o + w + 1] = c;
      }
      ctx.putImageData(pixels, 0, 0);
    };

    const mix = (a: number, b: number, t: number) => {
      const ar = a & 255, ag = (a >> 8) & 255, ab = (a >> 16) & 255;
      const br = b & 255, bg = (b >> 8) & 255, bb = (b >> 16) & 255;
      return (255 << 24) | ((ab + (bb - ab) * t) << 16) | ((ag + (bg - ag) * t) << 8) | (ar + (br - ar) * t);
    };

    const step = () => {
      const R = RADIUS * dpr;
      const R2 = R * R;
      const strength = 2.6 * dpr;
      let energy = 0;
      for (let i = 0; i < count; i++) {
        let ax = (hx[i] - px[i]) * 0.045;
        let ay = (hy[i] - py[i]) * 0.045;
        const ddx = px[i] - mx;
        const ddy = py[i] - my;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.01;
          const f = 1 - d / R;
          const push = (f * f * strength) / d;
          ax += ddx * push;
          ay += ddy * push;
        }
        vx[i] = (vx[i] + ax) * 0.84;
        vy[i] = (vy[i] + ay) * 0.84;
        px[i] += vx[i];
        py[i] += vy[i];
        energy += Math.abs(vx[i]) + Math.abs(vy[i]);
      }
      return energy;
    };

    const loop = () => {
      const energy = step();
      draw();
      const hovering = mx > -1e8;
      if (hovering || energy > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        // Settle exactly home and stop; nothing runs until the cursor comes back.
        for (let i = 0; i < count; i++) {
          px[i] = hx[i];
          py[i] = hy[i];
          vx[i] = 0;
          vy[i] = 0;
        }
        draw();
        alive = false;
        raf = 0;
      }
    };
    const wake = () => {
      if (!alive) {
        alive = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = (e.clientX - r.left) * dpr;
      my = (e.clientY - r.top) * dpr;
      wake();
    };
    const onLeave = () => {
      mx = -1e9;
      my = -1e9;
      wake();
    };

    el.classList.add("has-particles");
    el.addEventListener("pointerenter", onMove);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => void sample());
    ro.observe(el);
    void sample();
    return () => {
      disposed = true;
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.classList.remove("has-particles");
      el.removeEventListener("pointerenter", onMove);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, theme]);

  return (
    <div ref={clip} className="finale-wordmark-clip" aria-hidden data-cursor="hover">
      <div data-stage className="relative">
        <span data-word className="finale-wordmark display">
          CONCORDE
        </span>
        <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
