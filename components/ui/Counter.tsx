"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Props {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Use locale grouping (1,354). */
  group?: boolean;
  start?: string;
}

/** Animated number that counts up when scrolled into view. Tabular mono by default. */
export function Counter({ to, from = 0, decimals = 0, duration = 2, prefix = "", suffix = "", className = "", group = true, start = "top 85%" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const fmt = (n: number) => (group ? n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals));

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !ready) return;
      // The markup already renders the final value; counting up is the animation, so skip it.
      if (reduced) return;
      const obj = { v: from };
      el.textContent = `${prefix}${fmt(from)}${suffix}`;
      gsap.to(obj, {
        v: to,
        duration,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start, once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${fmt(obj.v)}${suffix}`;
        },
      });
    },
    { dependencies: [ready, to, from, decimals, duration, prefix, suffix, start, reduced], scope: ref },
  );

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {fmt(to)}
      {suffix}
    </span>
  );
}
