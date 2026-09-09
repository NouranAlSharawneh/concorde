import type { SVGProps } from "react";

/** Top-down ogival-delta planform of Concorde, as a single stroked path (viewBox 400×620, nose at top). */
export const CONCORDE_PLANFORM =
  "M200 14 C202 62 204 112 207 156 C211 210 219 272 233 334 C243 378 257 422 275 462 C290 496 307 528 326 556 L332 570 L332 582 L209 574 C210 586 210 596 205 606 L200 610 L195 606 C190 596 190 586 191 574 L68 582 L68 570 L74 556 C93 528 110 496 125 462 C143 422 157 378 167 334 C181 272 189 210 193 156 C196 112 198 62 200 14 Z";

export function ConcordeSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 400 620" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d={CONCORDE_PLANFORM} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Olympus 593 nacelles, two per wing */}
      <path d="M232 486 L258 496 L262 576 L236 574 Z M168 486 L142 496 L138 576 L164 574 Z" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
      {/* Fin, seen edge-on */}
      <path d="M191 574 C193 540 196 512 200 486 C204 512 207 540 209 574" stroke="currentColor" strokeWidth="1.1" opacity="0.45" />
      {/* Droop-nose hinge */}
      <path d="M193 156 C196 162 204 162 207 156" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}
