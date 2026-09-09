"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SRC } from "@/content/sources";

const STORY = {
  source: SRC.wiki,
  stretchMm: 300,
  mach: 2.04,
  tempC: 127,
  engineer: "Trevor Norcott",
  reg: "G-BOAG",
  year: 2003,
} as const;

/** Drawing units. The gap opens between the console (right edge) and the bulkhead (left edge). */
const GAP_X = 300; // console right edge / closed bulkhead left edge
const GAP_MAX = 34; // how far the bulkhead travels at Mach 2
const FLOOR_Y = 250;

interface Props {
  className?: string;
}

/**
 * Easter egg, drawn as a general-arrangement section: hold to fly Mach 2 and the airframe heats,
 * the dimension between console and bulkhead grows to 300 mm, and a cap drops into the gap. Let go
 * and it cools, the dimension returns to zero — and the cap is still in there.
 */
export function CapInTheGap({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const openTl = useRef<gsap.core.Timeline | null>(null);
  const capTween = useRef<gsap.core.Tween | null>(null);
  const trappedRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const [trapped, setTrapped] = useState(false);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
      const bulkhead = q<SVGGElement>("[data-bulkhead]");
      const cap = q<SVGGElement>("[data-cap]");
      const label = q<SVGGElement>("[data-trapped-label]");
      const dimValue = q<SVGTextElement>("[data-dim-value]");
      const dimGroup = q<SVGGElement>("[data-dim]");
      const heat = q<SVGRectElement>("[data-heat]");
      const dimExt = q<SVGLineElement>("[data-dim-ext2]");
      const machEl = q<HTMLElement>("[data-mach]");
      const stretchEl = q<HTMLElement>("[data-stretch]");
      const tempEl = q<HTMLElement>("[data-temp]");
      if (!bulkhead || !cap || !label || !dimValue || !dimGroup || !heat || !dimExt || !machEl || !stretchEl || !tempEl) return;

      const d = (s: number) => (reduced ? 0.01 : s);
      const t = { mach: 0.3, stretch: 0, temp: 20 };
      const write = () => {
        machEl.textContent = t.mach.toFixed(2);
        stretchEl.textContent = String(Math.round(t.stretch));
        tempEl.textContent = String(Math.round(t.temp));
        dimValue.textContent = `${Math.round(t.stretch)} mm`;
        const half = (t.stretch / STORY.stretchMm) * (GAP_MAX / 2);
        dimValue.setAttribute("x", String(GAP_X + half));
      };
      write();

      gsap.set(cap, { y: -120, opacity: 0 });
      gsap.set(label, { opacity: 0 });
      gsap.set(dimGroup, { opacity: 0.25 });
      gsap.set(heat, { scaleX: 0, transformOrigin: "left center" });

      capTween.current = gsap.fromTo(
        cap,
        { y: -120, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: d(0.7),
          ease: "climb",
          paused: true,
          onComplete: () => {
            trappedRef.current = true;
            setTrapped(true);
          },
        },
      );

      openTl.current = gsap
        .timeline({
          paused: true,
          defaults: { ease: "flight" },
          onComplete: () => {
            if (trappedRef.current) gsap.to(cap, { opacity: 1, duration: d(0.4), ease: "climb" });
            else capTween.current?.play();
          },
          onReverseComplete: () => {
            if (!trappedRef.current) return;
            gsap.to(label, { opacity: 1, duration: d(0.6), ease: "climb" });
            // Sealed in: the cap now reads as something inside the structure, not on top of it.
            gsap.to(cap, { opacity: 0.5, duration: d(0.6), ease: "climb" });
          },
        })
        .to([bulkhead, dimExt], { x: GAP_MAX, duration: d(1.3) }, 0)
        .to(dimGroup, { opacity: 1, duration: d(0.5) }, 0)
        .to(heat, { scaleX: 1, duration: d(1.3), ease: "none" }, 0)
        .to(t, { mach: STORY.mach, stretch: STORY.stretchMm, temp: STORY.tempC, duration: d(1.3), onUpdate: write }, 0);

      return () => {
        openTl.current?.kill();
        capTween.current?.kill();
        openTl.current = null;
        capTween.current = null;
      };
    },
    { dependencies: [reduced], scope: ref },
  );

  const hold = () => {
    setHolding(true);
    openTl.current?.play();
  };
  const release = () => {
    setHolding(false);
    openTl.current?.reverse();
    const cap = capTween.current;
    if (cap && !trappedRef.current && cap.progress() > 0) cap.reverse();
  };
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    hold();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      hold();
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") release();
  };

  const status = trapped
    ? holding
      ? "Back at Mach 2. There it is, where he left it."
      : "The airframe cooled and the gap closed. The cap is still in there."
    : holding
      ? "Mach 2. The skin is hot, the fuselage is long, the gap is open."
      : "Press and hold. The fuselage warms, stretches, and a gap opens.";

  return (
    <div ref={ref} className={`grid gap-x-[var(--gutter)] gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-end ${className}`}>
      {/* ── Drawing ───────────────────────────────────────────────── */}
      <figure className="relative">
        <svg
          viewBox="0 0 620 340"
          className="h-auto w-full text-ink"
          role="img"
          aria-label="Section through the flight deck: the gap between the flight engineer's console and the rear bulkhead, dimensioned in millimetres"
        >
          <defs>
            {/* ISO section hatching: 45°, thin, widely spaced */}
            <pattern id="cap-hatch" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
            </pattern>
            <pattern id="cap-hatch-dense" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeOpacity="0.33" strokeWidth="1" />
            </pattern>
            <clipPath id="cap-gap-clip">
              <rect x={GAP_X - 1} y="96" width={GAP_MAX + 2} height={FLOOR_Y - 96} />
            </clipPath>
            {/* BS 8888 dimension terminator: filled, closed, 3:1 length-to-width */}
            <marker id="cap-arrow" viewBox="0 0 12 4" refX="11" refY="2" markerWidth="9" markerHeight="3" orient="auto-start-reverse">
              <path d="M 0 0 L 12 2 L 0 4 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Datum floor line + centre line */}
          <g stroke="currentColor" strokeWidth="1">
            <line x1="24" y1={FLOOR_Y} x2="596" y2={FLOOR_Y} strokeOpacity="0.45" strokeWidth="0.75" />
            <line x1="24" y1="96" x2="596" y2="96" strokeOpacity="0.16" strokeWidth="0.75" strokeDasharray="24 3 4 3" />
          </g>

          {/* Cap, drawn under the panels so the closing gap swallows it */}
          <g clipPath="url(#cap-gap-clip)">
            {/* Static placement lives on the OUTER group: GSAP rewrites the transform of the element
                it animates, which would otherwise discard this offset. */}
            <g transform={`translate(${GAP_X + GAP_MAX / 2} ${FLOOR_Y - 84})`}>
              <g data-cap>
                {/* The one object in the drawing that is not structure: filled, so it reads at a glance */}
                <g fill="var(--accent)" fillOpacity="0.9" stroke="var(--ink)" strokeOpacity="0.75" strokeWidth="1" strokeLinejoin="round">
                <path d="M -11 5 L -11 -4 A 11 9 0 0 1 11 -4 L 11 5 Z" />
                <path d="M -15 5 Q 0 12 15 5 L 15 8.5 Q 0 15.5 -15 8.5 Z" />
                </g>
              </g>
            </g>
          </g>

          {/* Flight engineer's console — sectioned solid */}
          <g>
            <path
              d={`M 60 ${FLOOR_Y} L 60 132 L 196 132 L 214 108 L ${GAP_X} 108 L ${GAP_X} ${FLOOR_Y} Z`}
              fill="url(#cap-hatch)"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* panel face, indicated not illustrated */}
            <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.75" fill="none">
              <line x1="222" y1="126" x2="292" y2="126" />
              <line x1="222" y1="140" x2="292" y2="140" />
              <line x1="222" y1="154" x2="270" y2="154" />
            </g>
          </g>

          {/* Rear bulkhead — slides aft as the fuselage grows */}
          <g data-bulkhead>
            <path
              d={`M ${GAP_X} ${FLOOR_Y} L ${GAP_X} 108 L 360 88 L 560 88 L 560 ${FLOOR_Y} Z`}
              fill="url(#cap-hatch-dense)"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" fill="none">
              <line x1="380" y1="118" x2="540" y2="118" />
              <line x1="380" y1="150" x2="540" y2="150" />
              <line x1="380" y1="182" x2="540" y2="182" />
            </g>
          </g>

          {/* Dimension: extension lines + arrows + live value */}
          <g data-dim>
            <g stroke="var(--accent)" strokeWidth="0.75">
              {/* Extension lines run 8d past the dimension line (ISO 129-1) */}
              <line x1={GAP_X} y1="74" x2={GAP_X} y2="112" />
              <line data-dim-ext2 x1={GAP_X + GAP_MAX} y1="74" x2={GAP_X + GAP_MAX} y2="112" />
              <line x1={GAP_X - 24} y1="88" x2={GAP_X + GAP_MAX + 24} y2="88" markerStart="url(#cap-arrow)" markerEnd="url(#cap-arrow)" />
            </g>
            <text
              data-dim-value
              x={GAP_X}
              y="68"
              textAnchor="middle"
              fill="var(--accent)"
              fontSize="11"
              letterSpacing="1.5"
              fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            >
              0 mm
            </text>
          </g>

          {/* Leader-line callouts. BS 8888 leaders: thin line, no arrowhead onto a surface, label
              flush at the end. Left label reads left-to-right, right label is right-aligned, and the
              two sit on different baselines so they can never collide at any viewport width. */}
          <g fontSize="9" letterSpacing="1.1" fontFamily="var(--font-jetbrains), ui-monospace, monospace" fill="currentColor" fillOpacity="0.55" stroke="none">
            <g stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.75" fill="none">
              <path d="M 120 190 L 120 286 L 138 286" />
              <path d="M 470 150 L 470 312 L 452 312" />
            </g>
            <text x="144" y="289">FLIGHT ENGINEER&apos;S CONSOLE</text>
            <text x="446" y="315" textAnchor="end">REAR BULKHEAD</text>
          </g>

          {/* Skin temperature scale */}
          <g fontSize="8.5" letterSpacing="1.1" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
            <text x="24" y="46" fill="currentColor" fillOpacity="0.45">
              SKIN TEMPERATURE
            </text>
            <rect x="24" y="54" width="180" height="3" fill="currentColor" fillOpacity="0.12" />
            <rect data-heat x="24" y="54" width="180" height="3" fill="var(--accent)" />
            <text x="210" y="59" fill="currentColor" fillOpacity="0.55">
              20 → {STORY.tempC} °C
            </text>
          </g>

          {/* Title block */}
          <g fontSize="8" letterSpacing="1.1" fontFamily="var(--font-jetbrains), ui-monospace, monospace" fill="currentColor" fillOpacity="0.4">
            <line x1="24" y1="326" x2="596" y2="326" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.75" />
            <text x="24" y="338">FIG. 01 — FLIGHT DECK, LOOKING TO PORT</text>
            <text x="596" y="338" textAnchor="end">
              EFFECTIVITY {STORY.reg} · {STORY.year} · REV. C
            </text>
          </g>

          {/* Trapped callout */}
          <g data-trapped-label fontSize="9" letterSpacing="1.1" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
            <line x1={GAP_X + 4} y1={FLOOR_Y - 84} x2={GAP_X + 4} y2="30" stroke="var(--accent)" strokeWidth="0.75" />
            <circle cx={GAP_X + 4} cy={FLOOR_Y - 84} r="2.5" fill="var(--accent)" />
            <text x={GAP_X + 12} y="28" fill="var(--accent)">
              CAP · STILL INSIDE
            </text>
          </g>
        </svg>
      </figure>

      {/* ── Story and controls ────────────────────────────────────── */}
      <div className="lg:pb-6">
        <p className="eyebrow mb-4">The cap in the gap</p>
        <p className="max-w-[30rem] text-[0.95rem] leading-[1.6] text-ink/75">
          At Mach 2 the skin ran to {STORY.tempC} °C and the fuselage grew by up to {STORY.stretchMm} mm. On the flight deck it showed as a
          gap opening between the flight engineer&apos;s console and the rear bulkhead. On the last supersonic flights the engineers slid
          their caps into it, and as the airframe cooled it closed on them.
        </p>
        <p className="mt-5 max-w-[30rem] text-[0.95rem] leading-[1.6] text-ink">
          {STORY.engineer} did so aboard {STORY.reg} in {STORY.year}. His cap is still there.
        </p>

        <div className="mt-8 border-t hairline pt-6">
          <button
            type="button"
            className={`btn w-full touch-none select-none justify-center sm:w-auto ${holding ? "" : "btn-ghost"}`}
            onPointerDown={onPointerDown}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={release}
            onContextMenu={(e) => e.preventDefault()}
            aria-pressed={holding}
            data-cursor="hover"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${holding ? "bg-accent" : "bg-current opacity-40"}`} aria-hidden />
            Hold to fly Mach 2
          </button>

          <dl className="mono mt-6 grid grid-cols-3 gap-4 text-[0.6rem] tracking-[0.2em] text-ink/50 uppercase">
            <div>
              <dt>Mach</dt>
              <dd data-mach className="mt-1 text-[1.05rem] tracking-normal tabular-nums text-ink">
                0.30
              </dd>
            </div>
            <div>
              <dt>Stretch</dt>
              <dd className="mt-1 text-[1.05rem] tracking-normal tabular-nums text-ink">
                <span data-stretch>0</span> <span className="text-[0.62rem] text-ink/50">mm</span>
              </dd>
            </div>
            <div>
              <dt>Skin</dt>
              <dd className="mt-1 text-[1.05rem] tracking-normal tabular-nums text-ink">
                <span data-temp>20</span> <span className="text-[0.62rem] text-ink/50">°C</span>
              </dd>
            </div>
          </dl>

          <p className="mono mt-6 min-h-[3em] max-w-[26rem] text-[0.7rem] leading-[1.6] tracking-[0.04em] text-ink/60" aria-live="polite">
            {status}
          </p>
          <p className="mt-4">
            <a
              href={STORY.source}
              className="mono text-[0.62rem] tracking-[0.12em] text-ink/40 uppercase underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink"
              target="_blank"
              rel="noreferrer"
              data-cursor="hover"
            >
              Source · Wikipedia
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
