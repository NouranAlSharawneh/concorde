"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { flight, useUI, type ChapterId } from "@/lib/flight-state";
import { altitudeToFeet, altitudeToMach } from "@/lib/altitude";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const CHAPTERS: ReadonlyArray<{ id: ChapterId; label: string }> = [
  { id: "hero", label: "In the clouds" },
  { id: "dream", label: "The dream" },
  { id: "anatomy", label: "Anatomy" },
  { id: "first-flights", label: "First flights" },
  { id: "archive", label: "Archive" },
  { id: "mach2", label: "Mach 2" },
  { id: "routes", label: "Where it flew" },
  { id: "only-one", label: "The only one" },
  { id: "descent", label: "Descent" },
  { id: "legacy", label: "Legacy" },
  { id: "timeline", label: "Timeline" },
  { id: "footer", label: "Boarding" },
];

const EVEN = CHAPTERS.map((_, i) => i / (CHAPTERS.length - 1));

const fmtFeet = (ft: number) => `${Math.round(ft).toLocaleString("en-GB")} FT`;
const fmtMach = (m: number) => `M ${m.toFixed(2)}`;

/** Measure where each chapter starts as a fraction of the scrollable document. */
function measureChapters(): number[] {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return EVEN;
  return CHAPTERS.map((c, i) => {
    const el = document.querySelector<HTMLElement>(`[data-chapter="${c.id}"]`);
    if (!el) return EVEN[i];
    const top = el.getBoundingClientRect().top + window.scrollY;
    return Math.min(1, Math.max(0, top / max));
  });
}

/**
 * Fixed right-edge altitude instrument (≥ 1024px): FT / MACH readout, a track with a
 * scroll-progress dot, and ten chapter ticks that double as anchor navigation.
 */
export function AltitudeRail() {
  const track = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const feetEl = useRef<HTMLSpanElement>(null);
  const machEl = useRef<HTMLSpanElement>(null);
  const chapter = useUI((s) => s.chapter);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const [positions, setPositions] = useState<number[]>(EVEN);

  // Chapter tick positions follow the real layout; re-measured on every ScrollTrigger refresh.
  useEffect(() => {
    const update = () =>
      setPositions((prev) => {
        const next = measureChapters();
        return next.every((v, i) => Math.abs(v - prev[i]) < 0.001) ? prev : next;
      });
    update();
    ScrollTrigger.addEventListener("refresh", update);
    return () => {
      ScrollTrigger.removeEventListener("refresh", update);
    };
  }, [ready]);

  // Dot follows document scroll; readout updates at ~12 Hz from the shared flight state.
  useEffect(() => {
    const trackEl = track.current;
    const dotEl = dot.current;
    if (!trackEl || !dotEl) return;
    const moveDot = gsap.quickTo(dotEl, "y", { duration: reduced ? 0 : 0.35, ease: "power3" });
    let acc = 0;
    let lastFeet = "";
    let lastMach = "";
    // The rail is `hidden lg:flex`, so on a phone this element is display:none — reading
    // offsetHeight from it every frame forced a synchronous layout for a readout nobody
    // could see. Measure once per refresh instead, and skip the whole tick when hidden.
    let trackH = 0;
    const measure = () => {
      trackH = trackEl.offsetParent === null ? 0 : trackEl.offsetHeight;
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("resize", measure, { passive: true });
    const tick = (_t: number, dt: number) => {
      if (trackH === 0) return;
      moveDot(flight.scroll * trackH);
      acc += dt;
      if (acc < 1000 / 12) return;
      acc = 0;
      const alt = flight.alt;
      if (feetEl.current) {
        const s = fmtFeet(altitudeToFeet(alt));
        if (s !== lastFeet) {
          lastFeet = s;
          feetEl.current.textContent = s;
        }
      }
      if (machEl.current) {
        const s = fmtMach(altitudeToMach(alt));
        if (s !== lastMach) {
          lastMach = s;
          machEl.current.textContent = s;
        }
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("resize", measure);
    };
  }, [reduced]);

  return (
    <aside
      aria-label="Altitude and chapters"
      className="pointer-events-none fixed right-[calc(var(--gutter)/2)] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-5 text-[var(--ink)] lg:flex"
    >
      <div className="mono flex flex-col items-end text-[0.625rem] uppercase tracking-[0.2em]">
        <span ref={feetEl} className="tabular-nums">
          0 FT
        </span>
        <span ref={machEl} className="tabular-nums text-[var(--ink-60)]">
          M 0.30
        </span>
      </div>

      <div ref={track} className="pointer-events-auto relative h-[34vh] w-px bg-[var(--ink-12)]">
        {/* travelling dot */}
        <span
          ref={dot}
          aria-hidden
          className="absolute -left-[2.5px] -top-[3px] h-[6px] w-[6px] rounded-full bg-[var(--ink)] shadow-[0_0_0_3px_var(--ink-06)]"
        />
        {/* chapter ticks */}
        {CHAPTERS.map((c, i) => {
          const active = c.id === chapter;
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-label={c.label}
              aria-current={active ? "true" : undefined}
              data-cursor="hover"
              className="group absolute right-0 flex h-4 -translate-y-1/2 items-center"
              style={{ top: `${positions[i] * 100}%` }}
            >
              <span
                className={`mono pointer-events-none absolute right-full mr-4 whitespace-nowrap text-[0.625rem] uppercase tracking-[0.2em] transition-all duration-300 ease-[var(--ease-climb)] ${
                  active ? "translate-x-1 text-[var(--accent)] opacity-0 group-hover:translate-x-0 group-hover:opacity-100" : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {c.label}
              </span>
              <span
                aria-hidden
                className={`block h-px transition-all duration-300 ease-[var(--ease-climb)] ${
                  active ? "w-4 bg-[var(--accent)]" : "w-2 bg-[var(--ink-24)] group-hover:w-3 group-hover:bg-[var(--ink)]"
                }`}
              />
            </a>
          );
        })}
      </div>

      <div className="mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--ink-60)]">
        <span className="text-[var(--ink)]">{String(Math.max(0, CHAPTERS.findIndex((c) => c.id === chapter)) + 1).padStart(2, "0")}</span>
        <span> / {String(CHAPTERS.length).padStart(2, "0")}</span>
      </div>
    </aside>
  );
}
