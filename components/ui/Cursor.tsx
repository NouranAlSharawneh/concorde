"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const FINE = "(pointer: fine)";
const DOT = 10;
const RING = 40;
const RING_HOVER = 64;

function subscribeFine(onChange: () => void): () => void {
  const mql = window.matchMedia(FINE);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

type Mode = "default" | "hover" | "drag";

function modeFor(target: EventTarget | null): Mode {
  if (!(target instanceof Element)) return "default";
  const el = target.closest<HTMLElement>("[data-cursor], a, button");
  if (!el) return "default";
  const kind = el.dataset.cursor;
  if (kind === "drag") return "drag";
  return "hover";
}

/**
 * Custom cursor for fine pointers: an instant 10px dot and a lagging 40px ring,
 * drawn in white with `mix-blend-mode: difference` so it reads at every altitude.
 */
export function Cursor() {
  const fine = useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia(FINE).matches,
    () => false,
  );
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dotEl = dot.current;
    const ringEl = ring.current;
    const labelEl = label.current;
    if (!fine || !dotEl || !ringEl || !labelEl) return;

    gsap.set([dotEl, ringEl], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(dotEl, { width: DOT, height: DOT });
    gsap.set(ringEl, { width: RING, height: RING });
    gsap.set(labelEl, { autoAlpha: 0 });

    const dotX = gsap.quickSetter(dotEl, "x", "px");
    const dotY = gsap.quickSetter(dotEl, "y", "px");
    const lag = reduced ? 0 : 0.32;
    const ringX = gsap.quickTo(ringEl, "x", { duration: lag, ease: "power3" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: lag, ease: "power3" });

    let shown = false;
    let mode: Mode = "default";

    const applyMode = (next: Mode) => {
      if (next === mode) return;
      mode = next;
      const d = reduced ? 0 : 0.45;
      if (next === "drag") {
        gsap.to(ringEl, { width: RING_HOVER, height: RING_HOVER, borderWidth: 1, duration: d, ease: "climb" });
        gsap.to(dotEl, { scale: 0, duration: d, ease: "climb" });
        gsap.to(labelEl, { autoAlpha: 1, duration: d * 0.6 });
      } else if (next === "hover") {
        gsap.to(ringEl, { width: RING_HOVER, height: RING_HOVER, borderWidth: 1, duration: d, ease: "climb" });
        gsap.to(dotEl, { scale: 0.4, duration: d, ease: "climb" });
        gsap.to(labelEl, { autoAlpha: 0, duration: d * 0.4 });
      } else {
        gsap.to(ringEl, { width: RING, height: RING, borderWidth: 1, duration: d, ease: "climb" });
        gsap.to(dotEl, { scale: 1, duration: d, ease: "climb" });
        gsap.to(labelEl, { autoAlpha: 0, duration: d * 0.4 });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      dotX(e.clientX);
      dotY(e.clientY);
      if (!shown) {
        shown = true;
        gsap.set(ringEl, { x: e.clientX, y: e.clientY });
        gsap.to([dotEl, ringEl], { autoAlpha: 1, duration: 0.4 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
    };
    const onOver = (e: PointerEvent) => applyMode(modeFor(e.target));
    const onDown = () => gsap.to(ringEl, { scale: 0.85, duration: 0.25, ease: "power3.out" });
    const onUp = () => gsap.to(ringEl, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        shown = false;
        gsap.to([dotEl, ringEl], { autoAlpha: 0, duration: 0.3 });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [fine, reduced]);

  if (!fine) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference">
      <div ref={dot} className="absolute left-0 top-0 rounded-full bg-white opacity-0" style={{ width: DOT, height: DOT }} />
      <div
        ref={ring}
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-white opacity-0"
        style={{ width: RING, height: RING }}
      >
        <span ref={label} className="mono text-[0.5625rem] uppercase tracking-[0.22em] text-white opacity-0">
          Drag
        </span>
      </div>
    </div>
  );
}
