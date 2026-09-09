"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";

export interface Racer {
  name: string;
  detail: string;
  kmh: number;
  /** Concorde's bar — the single accent element in this block. */
  accent?: boolean;
  source: string;
}

interface Props {
  racers: readonly Racer[];
  className?: string;
}

/** `--w` is the bar's final width; `--p` (0..1) is scrubbed by ScrollTrigger. */
type RowVars = CSSProperties & { "--p": number; "--w": string };

const fmt = (n: number) => Math.round(n).toLocaleString("en-GB");

/**
 * Four horizontal speed bars that grow from zero as the block scrolls through the
 * viewport. Both the bar and its marker are driven from one CSS variable per row, applied
 * through `transform` only: scrubbing `width` and `left` instead reflowed the whole block
 * on every frame of the scroll. Reduced motion: final state.
 */
export function SpeedRace({ racers, className = "" }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const max = Math.max(...racers.map((r) => r.kmh));

  useGSAP(
    () => {
      const root = scope.current;
      if (!root || !ready) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-row]", root);
        const tl = gsap.timeline({
          defaults: { ease: "none", duration: 1 },
          scrollTrigger: { trigger: root, start: "top 70%", end: "bottom 55%", scrub: 1 },
        });
        rows.forEach((row, i) => {
          const value = row.querySelector<HTMLElement>("[data-value]");
          const kmh = Number(row.dataset.kmh ?? 0);
          const obj = { v: 0 };
          let last = "";
          tl.fromTo(row, { "--p": 0 }, { "--p": 1 }, i * 0.12);
          if (value) {
            tl.to(
              obj,
              {
                v: kmh,
                onUpdate: () => {
                  const next = fmt(obj.v);
                  if (next !== last) {
                    last = next;
                    value.textContent = next;
                  }
                },
              },
              i * 0.12,
            );
          }
        });
      });
      return () => mm.revert();
    },
    { dependencies: [ready], scope },
  );

  return (
    <div ref={scope} className={`flex flex-col gap-8 ${className}`}>
      {racers.map((r) => {
        const vars: RowVars = { "--p": 1, "--w": `${(r.kmh / max) * 100}%` };
        // On a phone a three-column row left the bar — the whole point of the block — about 140px
        // of track. Below md the name and figure share the first line and the bar gets the full
        // width underneath.
        return (
          <div
            key={r.name}
            data-row
            data-kmh={r.kmh}
            style={vars}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 gap-y-3 md:grid-cols-[minmax(7rem,11rem)_1fr_auto] md:items-center md:gap-x-8 md:gap-y-0"
          >
            <div className="order-1 md:order-none">
              <p className="mono text-[0.75rem] uppercase tracking-[0.16em]">{r.name}</p>
              <p className="mono mt-1 text-[0.6rem] tracking-[0.12em] text-[var(--ink)]/50">{r.detail}</p>
            </div>

            <div className="relative order-3 col-span-2 h-px self-center bg-[var(--ink-12)] md:order-none md:col-span-1">
              <div className="absolute left-0 top-1/2 h-3 -translate-y-1/2" style={{ width: "var(--w)" }}>
                <div
                  className="h-full w-full origin-left rounded-full"
                  style={{
                    transform: "scaleX(var(--p))",
                    background: r.accent ? "var(--accent)" : "color-mix(in oklab, var(--ink) 30%, transparent)",
                  }}
                />
              </div>
              {/* The wrapper spans the whole track, so a percentage translate resolves against the
                  track width — the marker rides the bar without either of them touching layout. */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0" style={{ transform: "translateX(calc(var(--w) * var(--p)))" }} aria-hidden>
                <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                {r.accent ? (
                  <svg viewBox="0 0 32 10" width="32" height="10" className="translate-x-3 fill-[var(--accent)]">
                    <path d="M32 5 12 1.4 0 .2 6.5 5 0 9.8 12 8.6Z" />
                  </svg>
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-[var(--ink)]" />
                )}
                </div>
              </div>
            </div>

            <p className="mono order-2 whitespace-nowrap text-[0.8rem] tabular-nums md:order-none">
              <span data-value>{fmt(r.kmh)}</span>
              <span className="text-[var(--ink)]/50"> km/h</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
