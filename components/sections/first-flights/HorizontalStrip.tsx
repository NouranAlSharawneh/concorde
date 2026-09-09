"use client";

import { useRef, useSyncExternalStore, type CSSProperties } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SplitFlap } from "@/components/ui/SplitFlap";

export interface DepartureBoard {
  carrier: string;
  /** Board text, e.g. "LHR→BAH BA300 1140" (split-flap alphabet only). */
  value: string;
}

export interface Milestone {
  /** ISO date for the <time> element. */
  iso: string;
  /** Huge display date, e.g. "2 MAR 1969". */
  date: string;
  /** Short label under the rail tick, e.g. "MAR 69". */
  tick: string;
  place: string;
  /** Aircraft registration (or route) shown as a chip. */
  tag: string;
  /** Secondary chip, e.g. the pilot. */
  tag2?: string;
  detail: string;
  source: string;
  boards?: readonly DepartureBoard[];
}

interface Props {
  milestones: readonly Milestone[];
}

/** Horizontal strip only on wide, fine-pointer, motion-tolerant devices; everything else stacks. */
const STRIP_QUERY =
  "(min-width: 820px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribeStrip(onChange: () => void): () => void {
  const mql = window.matchMedia(STRIP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useStripMode(): boolean {
  return useSyncExternalStore(
    subscribeStrip,
    () => window.matchMedia(STRIP_QUERY).matches,
    () => false,
  );
}

type FlapVars = CSSProperties & Record<"--flap-bg" | "--flap-fg", string>;
const BOARD_VARS: FlapVars = { "--flap-bg": "var(--night)", "--flap-fg": "var(--gold)" };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Pinned horizontal-scroll strip of first-flight milestones. The inner wrapper
 * pins, the track translates on x, and a dot travels a hairline rail along the
 * bottom. Falls back to a plain vertical stack on touch / narrow / reduced motion.
 */
export function HorizontalStrip({ milestones }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const strip = useStripMode();
  const reduced = useReducedMotion();
  /** Highest panel index that has entered view (drives the split-flap boards) — kept out of React state so the pinned tree never re-renders. */
  const reachedRef = useRef(-1);
  const total = milestones.length;

  useGSAP(
    () => {
      if (!ready) return;
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", scope.current);
      const mark = (i: number) => {
        if (i <= reachedRef.current) return;
        reachedRef.current = i;
        panels.forEach((panel, j) => {
          if (j <= i) panel.setAttribute("data-reached", "true");
        });
      };

      if (!strip) {
        panels.forEach((panel, i) => {
          ScrollTrigger.create({ trigger: panel, start: "top 75%", once: true, onEnter: () => mark(i) });
        });
        return;
      }

      const pin = pinRef.current;
      const track = trackRef.current;
      const rail = railRef.current;
      const dot = dotRef.current;
      if (!pin || !track || !rail || !dot) return;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pin,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => "+=" + track.scrollWidth,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(track, { x: () => -(track.scrollWidth - pin.clientWidth) }, 0).to(dot, { x: () => rail.clientWidth }, 0);

      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          containerAnimation: tl,
          start: "left 60%",
          once: true,
          onEnter: () => mark(i),
        });
      });
    },
    { dependencies: [ready, strip], scope },
  );

  const panels = milestones.map((m, i) => (
    <article
      key={m.iso}
      data-panel
      className={
        strip
          ? "container-x flex h-full w-full shrink-0 flex-col justify-center pb-28"
          : "container-x flex min-h-[70vh] flex-col justify-center py-[8vh]"
      }
    >
      <p className="eyebrow">
        {pad(i + 1)} &nbsp;/&nbsp; {pad(total)}
      </p>
      <time dateTime={m.iso} className="stat-value mt-6 block text-[clamp(3rem,9vw,9rem)] font-semibold">
        {m.date}
      </time>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h3 className="display text-[clamp(1.5rem,3vw,2.75rem)] font-medium">{m.place}</h3>
        <span className="mono rounded-full border border-[var(--ink-24)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em]">
          {m.tag}
        </span>
        {m.tag2 && (
          <span className="mono rounded-full border border-[var(--ink-12)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--ink)]/70">
            {m.tag2}
          </span>
        )}
      </div>
      <p className="mt-6 max-w-[38rem] text-[clamp(1rem,1.2vw,1.2rem)] leading-[1.45] text-[var(--ink)]/80">{m.detail}</p>
      {m.boards && (
        <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6" style={BOARD_VARS}>
          {m.boards.map((b) => (
            <div key={b.value}>
              <p className="eyebrow mb-3">{b.carrier}</p>
              <SplitFlap
                value={b.value}
                length={18}
                active={reduced}
                activateOnAttr
                className="text-[clamp(0.8rem,1.5vw,1.4rem)]"
              />
            </div>
          ))}
        </div>
      )}
      <a
        href={m.source}
        target="_blank"
        rel="noreferrer"
        className="mono mt-8 self-start text-[0.6rem] uppercase tracking-[0.2em] text-[var(--ink)]/50 transition-colors hover:text-[var(--ink)]"
        data-cursor="hover"
      >
        Source ↗
      </a>
    </article>
  ));

  if (!strip) {
    return (
      <div ref={scope} className="relative">
        <div className="flex flex-col divide-y divide-[var(--ink-12)]">{panels}</div>
      </div>
    );
  }

  return (
    <div ref={scope} className="relative">
      <div ref={pinRef} className="relative h-[100svh] overflow-hidden">
        <div ref={trackRef} className="flex h-full will-change-transform">
          {panels}
        </div>

        {/* Timeline rail */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-10">
          <div ref={railRef} className="relative h-px bg-[var(--ink-12)]">
            {milestones.map((m, i) => (
              <div
                key={m.iso}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(i / Math.max(total - 1, 1)) * 100}%` }}
              >
                <span className="block h-2 w-px bg-[var(--ink-24)]" />
                <span className="mono absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[0.6rem] tracking-[0.2em] text-[var(--ink)]/60">
                  {m.tick}
                </span>
              </div>
            ))}
            <div
              ref={dotRef}
              className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
