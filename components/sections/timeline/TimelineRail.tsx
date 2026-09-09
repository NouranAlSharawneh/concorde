"use client";

import { useRef } from "react";
import { ConcordeSilhouette } from "@/components/ui/ConcordeSilhouette";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { ERA_LABEL, type TimelineEntry } from "./timeline-data";

interface Props {
  entries: readonly TimelineEntry[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Vertical timeline: a sticky year counter + travelling rail on the left (desktop),
 * collapsing to a sticky inline label on mobile; hairline entry rows on the right.
 * The entry under the viewport centre gets `.is-active`.
 */
export function TimelineRail({ entries }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();

  const first = entries[0]?.year ?? 1954;
  const last = entries[entries.length - 1]?.year ?? 2026;

  useGSAP(
    () => {
      const listEl = list.current;
      const trackEl = track.current;
      const dotEl = dot.current;
      const fillEl = fill.current;
      if (!listEl || !trackEl || !dotEl || !fillEl || !ready) return;

      const rows = gsap.utils.toArray<HTMLElement>("[data-tl-row]", listEl);
      const yearEls = gsap.utils.toArray<HTMLElement>("[data-tl-year]", root.current);
      const years = rows.map((r) => Number(r.dataset.tlRowYear));
      if (rows.length === 0) return;

      // ── Year counter: tween an object toward the interpolated year, snapped to integers.
      const obj = { year: years[0] };
      let shown = years[0];
      const render = () => {
        const txt = String(Math.round(obj.year));
        for (const el of yearEls) el.textContent = txt;
      };
      const setYear = (target: number) => {
        const t = Math.round(target);
        if (t === shown) return;
        shown = t;
        if (reduced) {
          obj.year = t;
          render();
          return;
        }
        gsap.to(obj, { year: t, duration: 0.55, ease: "power2.out", overwrite: true, snap: { year: 1 }, onUpdate: render });
      };

      // ── Rail dot + fill follow list progress.
      const dotTo = gsap.quickTo(dotEl, "y", { duration: reduced ? 0 : 0.45, ease: "power3" });
      const fillTo = gsap.quickTo(fillEl, "scaleY", { duration: reduced ? 0 : 0.45, ease: "power3" });

      // Row centres in list coordinates, measured on every ScrollTrigger refresh.
      let centres: number[] = [];
      let trackH = 0;
      const measure = () => {
        trackH = trackEl.offsetHeight;
        const top = listEl.getBoundingClientRect().top;
        centres = rows.map((r) => {
          const b = r.getBoundingClientRect();
          return b.top - top + b.height / 2;
        });
      };

      ScrollTrigger.create({
        trigger: listEl,
        start: "top center",
        end: "bottom center",
        onRefresh: measure,
        onUpdate: (self) => {
          const span = self.end - self.start;
          const y = self.progress * span;
          const n = centres.length;
          if (n === 0) return;
          let target = years[0];
          if (y >= centres[n - 1]) {
            target = years[n - 1];
          } else if (y > centres[0]) {
            let i = 0;
            while (i < n - 2 && y > centres[i + 1]) i++;
            const t = clamp01((y - centres[i]) / Math.max(1, centres[i + 1] - centres[i]));
            target = years[i] + (years[i + 1] - years[i]) * t;
          }
          setYear(target);
          dotTo(self.progress * trackH);
          fillTo(self.progress);
        },
      });
      measure();

      // ── Active row: the one straddling the viewport centre (ranges butt up to the next row).
      rows.forEach((row, i) => {
        const next = rows[i + 1];
        ScrollTrigger.create({
          trigger: row,
          start: "top center",
          endTrigger: next ?? row,
          end: next ? "top center" : "bottom center",
          toggleClass: { targets: row, className: "is-active" },
        });
      });
    },
    { dependencies: [ready, reduced, entries], scope: root },
  );

  const yearClass = "stat-value tabular-nums text-[var(--ink)]";

  return (
    <div ref={root} className="mt-[10vh] grid grid-cols-1 gap-x-[var(--gutter)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* Sticky year + rail (desktop) / sticky inline label (mobile) */}
      <div className="sticky top-[calc(var(--nav-h)+0.75rem)] z-20 self-start lg:top-[22vh]">
        {/* Mobile: a sticky bar the entries pass under. As a floating glass pill it sat on top of
            each row and hid the first words of the title; it also meant a 48px backdrop blur held
            on screen for the ten-odd screens the timeline lasts. */}
        <div className="glass flex w-full items-baseline gap-3 rounded-xl px-4 py-2.5 lg:hidden">
          <span className="eyebrow">Year</span>
          <span data-tl-year className={`${yearClass} text-[1.6rem] leading-none`}>
            {first}
          </span>
        </div>
        {/* Desktop: huge year + travelling rail */}
        <div className="hidden lg:block">
          <p className="eyebrow mb-4">Year</p>
          <p data-tl-year className={`${yearClass} text-[clamp(5.5rem,11vw,11rem)]`} aria-live="off">
            {first}
          </p>
          <div className="mt-10 flex items-start gap-5">
            <div ref={track} className="relative h-[38vh] w-px bg-[var(--ink-12)]" aria-hidden>
              <span ref={fill} className="absolute inset-x-0 top-0 h-full origin-top bg-[var(--ink)]" style={{ transform: "scaleY(0)" }} />
              {/* Travelling marker: a small Concorde planform, nose down the rail, riding its own contrail (the fill). */}
              <span ref={dot} className="absolute -left-[9px] -top-[14px] block h-[28px] w-[19px] text-[var(--ink)]">
                <ConcordeSilhouette className="h-full w-full rotate-180 drop-shadow-[0_0_6px_var(--ink-24)]" style={{ strokeWidth: 7 }} aria-hidden />
              </span>
            </div>
            <div className="mono flex h-[38vh] flex-col justify-between text-[0.6875rem] tracking-[0.18em] text-[var(--ink-60)]">
              <span>{first}</span>
              <span>{last}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Entries */}
      <ol ref={list} className="relative mt-10 border-b hairline lg:mt-0">
        {entries.map((e, i) => {
          const eraStart = i === 0 || entries[i - 1].era !== e.era;
          const key = `${e.year}-${e.date ?? ""}-${i}`;
          return (
            <li key={key}>
              {eraStart && (
                <p className={`eyebrow ${i === 0 ? "pb-5" : "pb-5 pt-16"}`} aria-hidden>
                  {ERA_LABEL[e.era]}
                </p>
              )}
              <FadeIn y={28}>
                <article
                  data-tl-row
                  data-tl-row-year={e.year}
                  className="group relative grid grid-cols-[5.25rem_minmax(0,1fr)] gap-x-5 border-t hairline py-7 pl-6 opacity-45 transition-opacity duration-500 ease-[var(--ease-flight)] md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-8 md:py-9 [&.is-active]:opacity-100"
                >
                  <span
                    className="absolute left-0 top-[2.35rem] h-2 w-2 scale-0 rounded-full bg-[var(--accent)] transition-transform duration-500 ease-[var(--ease-climb)] md:top-[2.85rem] [.is-active_&]:scale-100"
                    aria-hidden
                  />
                  <div className="mono flex flex-col gap-1 pt-1 text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--ink-60)]">
                    <time dateTime={String(e.year)} className="text-[var(--ink)]">
                      {e.year}
                    </time>
                    {e.date && <span>{e.date}</span>}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`display font-semibold ${
                        e.highlight ? "text-[clamp(2.1rem,4.2vw,4.25rem)]" : "text-[clamp(1.4rem,2.4vw,2.35rem)]"
                      }`}
                    >
                      {e.title}
                    </h3>
                    <p className="mt-3 max-w-[38rem] text-[0.95rem] leading-[1.5] text-[var(--ink)]/75">{e.detail}</p>
                    <a
                      href={e.source}
                      target="_blank"
                      rel="noreferrer"
                      className="mono mt-3 inline-block text-[0.625rem] uppercase tracking-[0.22em] text-[var(--ink-60)] transition-colors hover:text-[var(--accent)]"
                      data-cursor="hover"
                    >
                      Source ↗
                    </a>
                  </div>
                </article>
              </FadeIn>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
