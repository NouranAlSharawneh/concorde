"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";

/** Dispatched on `window` exactly once each time the scrub passes Mach 1. */
export const BOOM_EVENT = "concorde:boom";

interface Props {
  from?: number;
  to?: number;
  eyebrow: string;
  caption: string;
}

const fmt = (v: number) => `MACH ${v.toFixed(2)}`;

/**
 * Pinned ~150vh beat: a huge "MACH 1.00" counts up to "MACH 2.04" with the scroll.
 * Crossing Mach 1 fires a concentric ring shockwave once per pass and dispatches
 * `concorde:boom` for the audio engine. Reduced motion: static final state, no event.
 */
export function SonicBoom({ from = 1, to = 2.04, eyebrow, caption }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLParagraphElement>(null);
  const ringsRef = useRef<SVGSVGElement>(null);
  const ready = useUI((s) => s.ready);

  useGSAP(
    () => {
      const pin = pinRef.current;
      const value = valueRef.current;
      const rings = ringsRef.current;
      if (!ready || !pin || !value || !rings) return;
      const circles = Array.from(rings.querySelectorAll("circle"));
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const obj = { v: from };
        const pulse = gsap
          .timeline({ paused: true })
          .fromTo(
            circles,
            { scale: 0.08, opacity: 0.95, transformOrigin: "50% 50%" },
            { scale: 4.5, opacity: 0, duration: 1.8, ease: "power2.out", stagger: 0.16 },
          );
        let fired = false;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: "top top",
            end: "+=150%",
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (!fired && self.progress >= 0.12) {
                fired = true;
                pulse.restart();
                window.dispatchEvent(new CustomEvent(BOOM_EVENT));
              } else if (fired && self.progress < 0.06) {
                fired = false;
              }
            },
          },
        });
        // Hold at Mach 1 while the shockwave passes, then climb to cruise.
        // Replacing the text node of a 13rem figure forces layout and paint of the glyph run, so
        // it only happens when the formatted string actually differs.
        let shown = value.textContent;
        tl.to({}, { duration: 0.18 }).to(obj, {
          v: to,
          duration: 0.82,
          onUpdate: () => {
            const next = fmt(obj.v);
            if (next === shown) return;
            shown = next;
            value.textContent = next;
          },
        });
        return () => pulse.kill();
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        value.textContent = fmt(to);
        gsap.set(circles, { opacity: 0 });
      });

      return () => mm.revert();
    },
    { dependencies: [ready, from, to], scope },
  );

  return (
    <div ref={scope} className="relative">
      <div ref={pinRef} className="relative flex h-[100svh] items-center justify-center overflow-hidden">
        <svg
          ref={ringsRef}
          viewBox="0 0 100 100"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="12"
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.2 - i * 0.3}
              vectorEffect="non-scaling-stroke"
              opacity="0"
            />
          ))}
        </svg>

        <div className="container-x relative text-center">
          <p className="eyebrow">{eyebrow}</p>
          <p
            ref={valueRef}
            className="stat-value mt-6 whitespace-nowrap text-[clamp(3.5rem,13vw,13rem)] font-semibold"
            aria-live="off"
          >
            {fmt(from)}
          </p>
          <p className="glass mx-auto mt-10 max-w-[36rem] rounded-2xl px-6 py-4 text-[clamp(0.95rem,1.1vw,1.1rem)] leading-[1.55] text-[var(--ink)]/90">
            {caption}
          </p>
        </div>
      </div>
    </div>
  );
}
