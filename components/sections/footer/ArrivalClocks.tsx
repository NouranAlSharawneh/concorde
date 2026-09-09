"use client";

import { useEffect, useRef, useState } from "react";

const ZONES = [
  { label: "London", code: "LHR", tz: "Europe/London" },
  { label: "New York", code: "JFK", tz: "America/New_York" },
] as const;

function formatNow(tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}

/** Two live local clocks — the two ends of BA001 — plus the schedule that beat the clock. */
export function ArrivalClocks() {
  const [times, setTimes] = useState<readonly string[]>(() => ZONES.map(() => "--:--:--"));
  const root = useRef<HTMLDivElement>(null);

  // A 1Hz setState re-rendered this subtree forever, on screen or not — a periodic hitch inside
  // the pinned finale, for clocks nobody could see. Tick only while the block is actually visible.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let id = 0;
    const tick = () => setTimes(ZONES.map((z) => formatNow(z.tz)));
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && id === 0) {
        tick();
        id = window.setInterval(tick, 1000);
      } else if (!entry.isIntersecting && id !== 0) {
        window.clearInterval(id);
        id = 0;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (id !== 0) window.clearInterval(id);
    };
  }, []);

  return (
    <div ref={root} className="grid grid-cols-2 gap-x-[var(--gutter)] gap-y-7 lg:grid-cols-[auto_auto_1fr] lg:gap-x-[calc(var(--gutter)*1.5)]">
      {ZONES.map((z, i) => (
        <div key={z.code} className="flex flex-col gap-2">
          <p className="eyebrow">
            {z.label} <span className="text-[var(--ink-60)]">· {z.code}</span>
          </p>
          <p className="mono text-[clamp(1.75rem,8vw,3.4rem)] leading-none tabular-nums text-[var(--ink)]" suppressHydrationWarning>
            {times[i]}
          </p>
          <p className="mono text-[0.6rem] tracking-[0.2em] text-[var(--ink-60)] uppercase">Local time now</p>
        </div>
      ))}
      <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
        <p className="eyebrow">BA001 · Scheduled</p>
        {/* Three cells: side by side when there is room, stacked rows on a phone so nothing orphans. */}
        <dl className="mono grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5 text-[clamp(1.05rem,1.6vw,1.5rem)] leading-none tabular-nums text-[var(--ink)] sm:flex sm:flex-wrap sm:gap-x-5">
          <dt className="text-[0.62rem] tracking-[0.18em] text-[var(--ink-60)] uppercase sm:hidden">Dep LHR</dt>
          <dd className="sm:before:mr-2 sm:before:text-[var(--ink-60)] sm:before:content-['DEP_LHR']">10:30</dd>
          <dt className="text-[0.62rem] tracking-[0.18em] text-[var(--ink-60)] uppercase sm:hidden">Arr JFK</dt>
          <dd className="sm:before:mr-2 sm:before:text-[var(--ink-60)] sm:before:content-['ARR_JFK']">09:20</dd>
          <dt className="text-[0.62rem] tracking-[0.18em] text-[var(--ink-60)] uppercase sm:hidden">Gained</dt>
          <dd className="text-[var(--accent)]">−01:10</dd>
        </dl>
        <p className="mono text-[0.6rem] leading-[1.6] tracking-[0.2em] text-[var(--ink-60)] uppercase">
          Local times · seventy minutes
          <span className="hidden sm:inline"> before you took off</span>
        </p>
      </div>
    </div>
  );
}
