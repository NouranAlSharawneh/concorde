"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Props {
  items: readonly string[];
  /** Scroll speed in px/s. */
  speed?: number;
  label?: string;
  className?: string;
}

/**
 * Infinite horizontal marquee. The item list is rendered twice and the track
 * slides by exactly half its width (`xPercent: -50`) so the loop is seamless.
 * Slows on hover, pauses off-screen, and stands still under reduced motion.
 */
export function Ticker({ items, speed = 70, label = "Successors", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      const el = track.current;
      if (!root || !el || !ready || reduced) return;

      const half = el.scrollWidth / 2;
      const tween = gsap.to(el, {
        xPercent: -50,
        repeat: -1,
        ease: "none",
        duration: Math.max(12, half / speed),
      });

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => tween.paused(!self.isActive),
      });

      const slow = () => gsap.to(tween, { timeScale: 0.25, duration: 0.6, ease: "power2.out" });
      const fast = () => gsap.to(tween, { timeScale: 1, duration: 0.8, ease: "power2.out" });
      root.addEventListener("pointerenter", slow);
      root.addEventListener("pointerleave", fast);
      return () => {
        root.removeEventListener("pointerenter", slow);
        root.removeEventListener("pointerleave", fast);
        st.kill();
      };
    },
    { dependencies: [ready, reduced, speed], scope: ref },
  );

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="mono flex items-center whitespace-nowrap text-[0.75rem] uppercase tracking-[0.18em] text-ink/80">
          <span className="px-8">{item}</span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={ref} className={`relative overflow-hidden border-y hairline py-5 ${className}`} aria-label={label}>
      <div ref={track} className="flex w-max will-change-transform">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
