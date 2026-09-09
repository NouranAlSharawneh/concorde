"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { Reveal } from "@/components/ui/Reveal";
import { FadeIn } from "@/components/ui/FadeIn";
import { ArrivalClocks } from "./ArrivalClocks";

const RECORD = "2 h 52 m 59 s";

function formatElapsed(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${m} m ${sec} s`;
  if (m > 0) return `${m} m ${sec} s`;
  return `${sec} s`;
}

/**
 * The closing screen. Sticky for the length of its wrapper while, behind it, the aircraft flies
 * past one last time and climbs away until its reheat is just another star.
 */
export function FinaleStage() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const [journey, setJourney] = useState<string | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      const wrap = el?.parentElement;
      if (!el || !wrap || !ready) return;
      const rule = el.querySelector<HTMLElement>("[data-rule]");
      if (rule) {
        gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: wrap, start: "top 45%", end: "bottom bottom", scrub: 0.6 } });
      }
      // How long this visit took, frozen the moment the finale comes into view.
      ScrollTrigger.create({ trigger: wrap, start: "top 70%", once: true, onEnter: () => setJourney(formatElapsed(performance.now())) });
    },
    { dependencies: [ready], scope: root },
  );

  return (
    <div ref={root} className="sticky top-0 flex h-[100svh] flex-col justify-between overflow-hidden pt-[max(12vh,calc(var(--nav-h)+2rem))] pb-[4vh]">
      {/* Top: eyebrow left, live status right */}
      <div className="container-x flex shrink-0 items-start justify-between gap-6">
        <Reveal as="p" className="eyebrow" mode="chars" stagger={0.015}>
          Speedbird Concorde One &nbsp;/&nbsp; BA001 &nbsp;/&nbsp; Arriving
        </Reveal>
        <FadeIn className="mono hidden items-center gap-2.5 text-[0.62rem] tracking-[0.22em] text-[var(--ink-60)] uppercase sm:flex" y={10}>
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
          </span>
          Arrived 09:20 local
        </FadeIn>
      </div>

      {/* Middle: the last line, then the two clocks */}
      <div className="container-x flex min-h-0 flex-1 flex-col justify-center gap-[clamp(1.25rem,4vh,5vh)]">
        <Reveal as="h2" className="display text-[clamp(2.6rem,10vw,10.5rem)] leading-[0.86] font-semibold tracking-[-0.045em] text-[var(--ink)]" mode="words" stagger={0.06}>
          Arrive before
          <br />
          you leave.
        </Reveal>
        <FadeIn y={24} delay={0.15}>
          <ArrivalClocks />
        </FadeIn>
        <p className="mono flex min-h-[1.6em] flex-wrap items-baseline gap-x-10 gap-y-1 text-[0.68rem] tracking-[0.2em] text-[var(--ink-60)] uppercase" aria-live="polite">
          {journey ? (
            <>
              <span>
                Your crossing<span className="ml-3 text-[var(--ink)] tabular-nums">{journey}</span>
              </span>
              <span>
                Concorde<span className="ml-3 text-[var(--ink)] tabular-nums">{RECORD}</span>
              </span>
            </>
          ) : (
            <span>&nbsp;</span>
          )}
        </p>
      </div>

      {/* Bottom: the contrail becomes the rule under which the name sits */}
      <div className="container-x flex shrink-0 flex-col gap-3 sm:gap-5">
        <div className="mono flex flex-wrap items-center justify-between gap-x-8 gap-y-1 pr-0 text-[0.55rem] leading-[1.6] tracking-[0.16em] text-[var(--ink-60)] uppercase sm:text-[0.62rem] sm:tracking-[0.2em] lg:pr-14">
          <span>27 years · 2.5 M passengers · 718 flights from seat 9A · 0 replaced</span>
          <span>1976 — 2003</span>
        </div>
        <div data-rule className="h-px w-full origin-left bg-[var(--ink)]/70" style={{ transform: "scaleX(0)" }} aria-hidden />
        <svg viewBox="0 0 1000 150" className="finale-wordmark block h-auto w-full" aria-hidden preserveAspectRatio="xMidYMax meet">
          <text
            x="500"
            y="138"
            textAnchor="middle"
            textLength="996"
            lengthAdjust="spacingAndGlyphs"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.2"
            style={{ fontFamily: "var(--font-archivo), sans-serif", fontWeight: 800, fontSize: 168, fontVariationSettings: '"wdth" 118', letterSpacing: "-0.02em" }}
          >
            CONCORDE
          </text>
        </svg>
      </div>
    </div>
  );
}
