"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Hand-drawn ogival-delta planform (nose up) that draws itself in with DrawSVG
 * as it scrolls into view. Stroke only, inherits `currentColor`.
 *
 * Proportions: length 61.66 m, span 25.6 m → ~0.415, so 600 units long by 250 wide.
 */
const OUTLINE =
  "M 200 20" +
  " C 206 70 211 140 213 220" + // nose to wing root, starboard
  " C 218 300 235 380 275 450" + // inboard leading edge, steep sweep
  " C 300 495 320 530 325 552" + // outboard ogee toward the tip
  " L 325 566" + // tip chord
  " C 290 572 250 576 214 580" + // trailing edge back to the fuselage
  " L 212 600" +
  " C 211 612 207 620 200 624" + // tail cone
  " C 193 620 189 612 188 600" +
  " L 186 580" +
  " C 150 576 110 572 75 566" + // port side, mirrored
  " L 75 552" +
  " C 80 530 100 495 125 450" +
  " C 165 380 182 300 187 220" +
  " C 189 140 194 70 200 20 Z";

interface Props {
  className?: string;
}

export function BlueprintDelta({ className = "" }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || !ready || reduced) return;
      const strokes = gsap.utils.toArray<SVGGeometryElement>("[data-draw]", svg);
      const labels = gsap.utils.toArray<SVGTextElement>("[data-label]", svg);
      const tl = gsap.timeline({
        defaults: { ease: "flight" },
        scrollTrigger: { trigger: svg, start: "top 80%", once: true },
      });
      tl.from(strokes, { drawSVG: 0, duration: 2.4, stagger: 0.18 }).from(labels, { opacity: 0, y: 4, duration: 0.8, stagger: 0.1 }, "-=1.2");
    },
    { dependencies: [ready, reduced], scope: ref },
  );

  return (
    <svg
      ref={ref}
      viewBox="0 0 400 700"
      className={`block text-ink ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Planform drawing of Concorde's ogival delta wing, 61.66 m long, 25.6 m across"
      style={{ visibility: ready ? "visible" : "hidden" }}
    >
      {/* centreline */}
      <path data-draw d="M 200 4 V 640" strokeDasharray="3 7" strokeWidth="0.75" opacity="0.5" />
      {/* planform */}
      <path data-draw d={OUTLINE} />
      {/* span dimension */}
      <path data-draw d="M 75 604 V 660 M 325 604 V 660 M 75 652 H 325" strokeWidth="0.75" opacity="0.7" />
      {/* length dimension */}
      <path data-draw d="M 232 20 H 372 M 232 624 H 372 M 364 20 V 624" strokeWidth="0.75" opacity="0.7" />
      {/* fin root trace */}
      <path data-draw d="M 200 470 V 600" strokeWidth="0.75" opacity="0.6" />

      <g className="mono" fontSize="10" fill="currentColor" stroke="none" letterSpacing="0.16em">
        <text data-label x="200" y="684" textAnchor="middle">
          25.6 M
        </text>
        <text data-label x="384" y="322" textAnchor="middle" transform="rotate(90 384 322)">
          61.66 M
        </text>
        <text data-label x="12" y="20" opacity="0.7">
          FIG. 01 — OGIVAL DELTA
        </text>
      </g>
    </svg>
  );
}
