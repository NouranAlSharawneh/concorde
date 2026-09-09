"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** Stagger direct children instead of animating the wrapper. */
  stagger?: number;
  start?: string;
}

/** Scroll-triggered fade + rise for blocks (cards, images, chips). */
export function FadeIn({ children, className = "", delay = 0, y = 40, stagger, start = "top 85%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !ready) return;
      // gsap.from() means the markup already sits at its final state, so opting out is a no-op.
      if (reduced) return;
      // A staggered wrapper taller than the viewport plays most of its stagger off-screen: by the
      // time you scroll to card 8 it settled long ago. Past ~1.25 screens, give each child its own
      // trigger and let the scroll itself provide the rhythm.
      const children = Array.from(el.children);
      if (stagger !== undefined && children.length > 3 && el.offsetHeight > window.innerHeight * 1.25) {
        children.forEach((child) => {
          gsap.from(child, { y, opacity: 0, duration: 1.1, ease: "climb", scrollTrigger: { trigger: child, start, once: true } });
        });
        return;
      }
      const targets = stagger !== undefined ? children : el;
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 1.3,
        ease: "climb",
        delay,
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { dependencies: [ready, delay, y, stagger, start, reduced], scope: ref },
  );
  return (
    <div ref={ref} className={className} style={{ visibility: ready ? "visible" : "hidden" }}>
      {children}
    </div>
  );
}
