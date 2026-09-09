"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Landing {
  reg: string;
  from: string;
  detail: string;
  /** Mono tag shown once the aircraft is on the runway. */
  landed: string;
}

const SOURCE = "https://en.wikipedia.org/wiki/Concorde_operational_history";

/** Order of arrival at Heathrow, 24 October 2003. */
const LANDINGS: readonly Landing[] = [
  { reg: "G-BOAE", from: "from Edinburgh", detail: "Round trip from Edinburgh", landed: "Landed 1st" },
  { reg: "G-BOAF", from: "Bay of Biscay loop", detail: "Supersonic loop over the Bay of Biscay", landed: "Landed 2nd" },
  { reg: "G-BOAG", from: "from New York JFK", detail: "Last commercial service, Captain Mike Bannister", landed: "Landed 3rd · 16:05" },
];

/* SVG geometry (viewBox units). */
const W = 1000;
const H = 420;
const RUNWAY_Y = 346;
const RUNWAY_X0 = 60;
const RUNWAY_X1 = 940;
const STARTS = [64, 136, 208] as const; // y of each glide-path origin
const TOUCHDOWNS = [470, 660, 850] as const; // x where each wheel meets the runway

function glidePath(y0: number, x1: number): string {
  const c1x = RUNWAY_X0 + (x1 - RUNWAY_X0) * 0.45;
  const c2x = RUNWAY_X0 + (x1 - RUNWAY_X0) * 0.82;
  return `M ${RUNWAY_X0} ${y0} C ${c1x} ${y0}, ${c2x} ${RUNWAY_Y}, ${x1} ${RUNWAY_Y} L ${x1 + 70} ${RUNWAY_Y}`;
}

/**
 * The three-ship arrival, drawn as glide paths. Scrubbed by scroll: each line
 * draws in sequence (DrawSVG) while its tag rides the tip and settles on the
 * runway baseline.
 */
export function LastLanding() {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !ready) return;
      const paths = gsap.utils.toArray<SVGPathElement>("path[data-glide]", root);
      const tags = gsap.utils.toArray<SVGGElement>("g[data-tag]", root);
      const stamps = gsap.utils.toArray<SVGTextElement>("text[data-landed]", root);

      // getPointAtLength() resolves the path's geometry every call, and it was running for all
      // three paths on every scrub frame. Each glide path is sampled once into 64 points; the tag
      // then rides an interpolation of those, which is indistinguishable on a curve this gentle.
      const SAMPLES = 64;
      const samples = paths.map((path) => {
        const len = path.getTotalLength();
        return Array.from({ length: SAMPLES + 1 }, (_, k) => path.getPointAtLength((len * k) / SAMPLES));
      });
      const placeTag = (i: number, p: number) => {
        const pts = samples[i];
        const tag = tags[i];
        if (!pts || !tag) return;
        const u = Math.min(SAMPLES, Math.max(0, p * SAMPLES));
        const k = Math.min(SAMPLES - 1, Math.floor(u));
        const t = u - k;
        const a = pts[k];
        const b = pts[k + 1];
        // A CSS transform on the <g> is composited; setAttribute("transform") is a repaint.
        tag.style.transform = `translate(${a.x + (b.x - a.x) * t}px, ${a.y + (b.y - a.y) * t}px)`;
      };

      if (reduced) {
        gsap.set(paths, { drawSVG: "100%" });
        paths.forEach((_, i) => placeTag(i, 1));
        gsap.set(stamps, { opacity: 1 });
        return;
      }

      gsap.set(paths, { drawSVG: "0%" });
      gsap.set(stamps, { opacity: 0 });
      paths.forEach((_, i) => placeTag(i, 0));

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top 65%",
          end: "bottom 100%",
          scrub: 1,
        },
      });

      paths.forEach((path, i) => {
        const at = i * 1.15;
        const state = { p: 0 };
        tl.to(path, { drawSVG: "100%", duration: 1 }, at);
        tl.to(state, { p: 1, duration: 1, onUpdate: () => placeTag(i, state.p) }, at);
        tl.to(stamps[i], { opacity: 1, duration: 0.15 }, at + 0.92);
      });
    },
    { dependencies: [ready, reduced], scope: ref },
  );

  return (
    <div ref={ref} className="relative h-[170vh]">
      <div className="sticky top-[10vh] max-w-[64rem]">
        <p className="eyebrow mb-5">24 October 2003 &nbsp;·&nbsp; London Heathrow</p>
        <h3 className="display max-w-[40rem] text-[clamp(1.9rem,4vw,3.4rem)] font-semibold">
          Three came home, one after another.
        </h3>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-10 h-auto w-full text-ink" role="img" aria-label="Three glide paths landing in sequence at Heathrow">
          {/* Altitude gridlines */}
          {STARTS.map((y) => (
            <line key={y} x1={RUNWAY_X0} y1={y} x2={RUNWAY_X1} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 8" />
          ))}

          {/* Runway baseline */}
          <line x1={RUNWAY_X0} y1={RUNWAY_Y} x2={RUNWAY_X1} y2={RUNWAY_Y} stroke="currentColor" strokeOpacity="0.45" />
          <line x1={RUNWAY_X0} y1={RUNWAY_Y + 14} x2={RUNWAY_X1} y2={RUNWAY_Y + 14} stroke="currentColor" strokeOpacity="0.18" strokeDasharray="18 14" />
          <text x={RUNWAY_X1} y={RUNWAY_Y + 42} textAnchor="end" fill="currentColor" fillOpacity="0.5" fontSize="11" letterSpacing="3" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
            LHR
          </text>
          <text x={RUNWAY_X0} y={RUNWAY_Y + 42} fill="currentColor" fillOpacity="0.5" fontSize="11" letterSpacing="3" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
            RUNWAY
          </text>

          {/* Glide paths */}
          {LANDINGS.map((l, i) => (
            <path key={l.reg} data-glide d={glidePath(STARTS[i], TOUCHDOWNS[i])} fill="none" stroke={i === 2 ? "var(--accent)" : "currentColor"} strokeOpacity={i === 2 ? 1 : 0.7} strokeWidth="1.25" strokeLinecap="round" />
          ))}

          {/* Landed stamps sit on the baseline at each touchdown */}
          {LANDINGS.map((l, i) => (
            <text key={l.reg} data-landed x={TOUCHDOWNS[i] + 70} y={RUNWAY_Y - 8} textAnchor="end" fill="currentColor" fillOpacity="0.6" fontSize="10" letterSpacing="2" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
              {l.landed.toUpperCase()}
            </text>
          ))}

          {/* Tags ride the tip of each path */}
          {LANDINGS.map((l, i) => (
            <g key={l.reg} data-tag transform={`translate(${RUNWAY_X0} ${STARTS[i]})`}>
              <circle r="3.5" fill={i === 2 ? "var(--accent)" : "currentColor"} />
              <text x="0" y="-22" fill="currentColor" fontSize="15" fontWeight="600" letterSpacing="-0.5" fontFamily="var(--font-archivo), var(--font-inter-tight), sans-serif">
                {l.reg}
              </text>
              <text x="0" y="-9" fill="currentColor" fillOpacity="0.6" fontSize="9.5" letterSpacing="1.5" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
                {l.from.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>

        {/* Legible legend for small screens and screen readers */}
        <ol className="mt-8 grid gap-4 border-t hairline pt-6 sm:grid-cols-3">
          {LANDINGS.map((l, i) => (
            <li key={l.reg} className="flex gap-4">
              <span className="mono pt-1 text-[0.6875rem] text-ink/45">0{i + 1}</span>
              <div>
                <p className="display text-[1.2rem] font-semibold">{l.reg}</p>
                <p className="mono mt-1 text-[0.6875rem] uppercase tracking-[0.14em] text-ink/60">{l.detail}</p>
                <p className="mono mt-1 text-[0.6875rem] uppercase tracking-[0.14em] text-ink/40">{l.landed}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mono mt-4 text-[0.6875rem] tracking-[0.08em] text-ink/40">
          <a href={SOURCE} className="underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
            CNN, 24 October 2003
          </a>
        </p>
      </div>
    </div>
  );
}
