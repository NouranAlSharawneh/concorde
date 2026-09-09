"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Counter } from "@/components/ui/Counter";

export type Region = "UK" | "France" | "USA" | "Germany" | "Barbados";
export type Filter = "All" | Region;

export interface Survivor {
  reg: string;
  /** Airframe number, e.g. "216". */
  number: string;
  museum: string;
  city: string;
  country: string;
  region: Region;
  /** Total flying hours where known. */
  hours?: number;
  note?: string;
  onDisplay: boolean;
  source: string;
}

const FILTERS: readonly Filter[] = ["All", "UK", "France", "USA", "Germany", "Barbados"];

interface Props {
  survivors: readonly Survivor[];
  className?: string;
}

/**
 * Eighteen hairline cards, one per surviving airframe. A pill row filters by
 * country: matching cards lift to full opacity, the rest dim and shrink in
 * place (no reflow), so the shape of the whole fleet stays visible.
 */
export function SurvivorGrid({ survivors, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("All");
  const applied = useRef<Filter>("All");
  const shown = filter === "All" ? survivors.length : survivors.filter((s) => s.region === filter).length;

  // Intro: cards rise in once when scrolled into view.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !ready) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-region]", root);
      gsap.from(cards, {
        y: reduced ? 0 : 32,
        opacity: 0,
        duration: 1.1,
        ease: "climb",
        stagger: reduced ? 0 : 0.035,
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });
    },
    { dependencies: [ready, reduced], scope: ref },
  );

  // Filter: animate opacity/scale per card whenever the active pill changes.
  useGSAP(
    () => {
      const root = ref.current;
      // Skip the initial mount so the scroll-triggered intro owns the first paint.
      if (!root || applied.current === filter) return;
      applied.current = filter;
      const cards = gsap.utils.toArray<HTMLElement>("[data-region]", root);
      const on = cards.filter((c) => filter === "All" || c.dataset.region === filter);
      const off = cards.filter((c) => !on.includes(c));
      const d = reduced ? 0 : 0.55;
      gsap.to(on, { opacity: 1, scale: 1, duration: d, ease: "climb", stagger: reduced ? 0 : 0.02, overwrite: "auto" });
      gsap.to(off, { opacity: 0.16, scale: 0.965, duration: d, ease: "flight", overwrite: "auto" });
      on.forEach((c) => c.removeAttribute("inert"));
      off.forEach((c) => c.setAttribute("inert", ""));
    },
    { dependencies: [filter, reduced], scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ visibility: ready ? "visible" : "hidden" }}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by country">
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                data-cursor="hover"
                className={`mono rounded-full border px-4 py-2 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-300 ${
                  active ? "border-ink bg-ink text-paper" : "hairline text-ink/70 hover:border-[var(--ink-60)] hover:text-ink"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <p className="mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink/50" aria-live="polite">
          {shown} of {survivors.length} airframes
        </p>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {survivors.map((s) => (
          <li
            key={s.reg}
            data-region={s.region}
            className="group relative flex min-h-[11rem] flex-col justify-between rounded-xl border hairline bg-[var(--glass)] p-5 transition-[translate,border-color,box-shadow] duration-500 ease-[var(--ease-climb)] hover:-translate-y-1 hover:border-[var(--ink-60)] focus-within:-translate-y-1 focus-within:border-[var(--ink-60)]"
            data-cursor="hover"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="display text-[clamp(1.5rem,2vw,1.9rem)] font-semibold leading-none">{s.reg}</p>
              <p className="mono text-[0.6875rem] tracking-[0.18em] text-ink/45">No. {s.number}</p>
            </div>

            <div className="mt-6">
              <p className="mono text-[0.72rem] uppercase tracking-[0.12em] text-ink/85">{s.museum}</p>
              <p className="mono mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink/50">
                {s.city}, {s.country}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-3 border-t hairline pt-3">
                {s.hours !== undefined ? (
                  <p className="mono text-[0.72rem] text-ink/70">
                    <Counter to={s.hours} duration={1.6} className="text-ink" /> <span className="text-ink/45">h</span>
                  </p>
                ) : (
                  <p className="mono text-[0.72rem] text-ink/40" aria-label="Flying hours not listed">
                    — <span className="text-ink/45">h</span>
                  </p>
                )}
                {!s.onDisplay && <p className="mono text-[0.6rem] uppercase tracking-[0.18em] text-accent">Not on display</p>}
              </div>
            </div>

            {s.note && (
              <p className="mono mt-0 max-h-0 overflow-hidden text-[0.6875rem] leading-[1.5] tracking-[0.04em] text-ink/75 opacity-0 transition-[max-height,opacity,margin] duration-500 ease-[var(--ease-climb)] group-hover:mt-3 group-hover:max-h-12 group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:max-h-12 group-focus-within:opacity-100">
                {s.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
