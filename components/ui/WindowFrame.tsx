"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";

/**
 * The "cabin window": during the hero the sky is framed as an inset rounded card on a
 * pale page; as you start to climb the frame opens out to full-bleed.
 */
export function WindowFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);

  useGSAP(
    () => {
      const hero = document.getElementById("hero");
      if (!ref.current || !hero) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const frame = Math.round(Math.min(18, Math.max(10, window.innerWidth * 0.012)));
        const radius = Math.round(Math.min(32, Math.max(18, window.innerWidth * 0.022)));
        gsap.fromTo(
          ref.current,
          { "--frame": `${frame}px`, "--radius": `${radius}px`, "--frame-op": 1 },
          {
            "--frame": "0px",
            "--radius": "0px",
            "--frame-op": 0,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom 40%", scrub: 0.6, invalidateOnRefresh: true },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(ref.current, { "--frame": "0px", "--radius": "0px", "--frame-op": 0 });
      });
      return () => mm.revert();
    },
    { dependencies: [ready], scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed z-[5]"
      style={{
        ["--frame" as string]: "14px",
        ["--radius" as string]: "28px",
        ["--frame-op" as string]: "1",
        inset: "var(--frame)",
        borderRadius: "var(--radius)",
        // Both shadow layers must retire with the frame. The inset highlight used to survive the
        // scrub, leaving a permanent 1px white hairline pinned to the viewport edge — against the
        // night sky it read as a hard line at whatever section boundary happened to be passing.
        boxShadow:
          "0 0 0 200px color-mix(in oklab, var(--page) calc(var(--frame-op) * 100%), transparent), inset 0 0 0 1px rgb(255 255 255 / calc(0.45 * var(--frame-op)))",
      }}
    />
  );
}
