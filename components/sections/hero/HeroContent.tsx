"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Instrument } from "./Instrument";

const CHIPS: ReadonlyArray<{ value: string; unit: string; label: string }> = [
  { value: "2.04", unit: "MACH", label: "Cruise speed" },
  { value: "60,000", unit: "FT", label: "Cruise altitude" },
  { value: "2:52:59", unit: "", label: "Fastest Atlantic crossing" },
];

/** Hero DOM layer: eyebrow, mixed-weight headline, CTAs, floating stat chips, HUD, scroll cue. */
export function HeroContent() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !ready) return;
      const h1 = el.querySelector<HTMLElement>("[data-h1]");
      const hero = el.closest<HTMLElement>("#hero");
      if (!h1 || !hero) return;
      const split = SplitText.create(h1, { type: "lines", mask: "lines", linesClass: "split-line" });
      const tl = gsap.timeline({ defaults: { ease: "climb" } });
      tl.from("[data-eyebrow]", { y: 16, opacity: 0, duration: 0.9 }, 0.2)
        .from(split.lines, { yPercent: 115, duration: 1.4, stagger: 0.1 }, 0.35)
        .from("[data-sub]", { y: 20, opacity: 0, duration: 1 }, 0.9)
        .from("[data-cta] > *", { y: 18, opacity: 0, duration: 0.9, stagger: 0.08 }, 1.05)
        .from("[data-chip], [data-chips-mobile] li", { y: 30, opacity: 0, scale: 0.96, duration: 1.1, stagger: 0.12 }, 0.8)
        .from("[data-hud]", { y: 30, opacity: 0, duration: 1.1 }, 1.1)
        .from("[data-cue]", { opacity: 0, duration: 1 }, 1.5);

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        // Parallax out as we climb.
        gsap.to("[data-hero-copy]", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 55%", scrub: 0.5 } });
        gsap.to("[data-chip]", { y: -80, opacity: 0, ease: "none", stagger: 0.04, scrollTrigger: { trigger: hero, start: "top top", end: "bottom 60%", scrub: 0.5 } });
        gsap.to("[data-cue]", { opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "20% top", scrub: 0.6 } });
        gsap.to("[data-cue-line]", { scaleY: 1, repeat: -1, yoyo: true, duration: 1.2, ease: "power2.inOut" });
      });
      return () => split.revert();
    },
    { dependencies: [ready], scope: root },
  );

  return (
    <div ref={root} className="relative flex h-full min-h-[100svh] flex-col justify-end px-[calc(var(--gutter)+0.5rem)] pb-[calc(var(--gutter)+0.75rem)] pt-[calc(var(--nav-h)+2rem)]" style={{ visibility: ready ? "visible" : "hidden" }}>
      {/* Floating stat chips, right side */}
      <ul className="pointer-events-none absolute right-[calc(var(--gutter)+4.5rem)] top-[17vh] hidden flex-col items-end gap-3 md:flex" aria-label="Key figures">
        {CHIPS.map((c, i) => (
          <li key={c.label} data-chip className="glass rounded-2xl px-5 py-4 text-right" style={{ marginRight: `${[0, 4.5, 1.5][i]}rem` }}>
            <p className="stat-value text-[2rem] text-[var(--ink)]">
              {c.value}
              {c.unit && <span className="mono ml-2 text-[0.42em] tracking-[0.2em] opacity-70">{c.unit}</span>}
            </p>
            <p className="eyebrow mt-1">{c.label}</p>
          </li>
        ))}
      </ul>

      {/* Copy block, bottom-left. On phones the airframe crosses this area, so the copy sits on a
          soft scrim that fades upward — enough separation for AA contrast without a visible panel.
          The scrim is opaque where it meets the hero's bottom edge, so it must not stop there or it
          reads as a hard white line against the transparent chapter below. The companion strip
          continues it past the boundary at exactly the same opacity and fades out over 26vh. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] md:hidden"
        style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--paper) 82%, transparent) 0%, color-mix(in oklab, var(--paper) 55%, transparent) 42%, transparent 100%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-full h-[26svh] md:hidden"
        style={{ background: "linear-gradient(to bottom, color-mix(in oklab, var(--paper) 82%, transparent) 0%, color-mix(in oklab, var(--paper) 46%, transparent) 38%, transparent 100%)" }}
        aria-hidden
      />
      <div data-hero-copy className="relative max-w-[min(92vw,52rem)]">
        <p data-eyebrow className="eyebrow mb-[clamp(0.75rem,2vh,1.5rem)] flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-current opacity-60" />
          1976 — 2003 · The only supersonic airliner
        </p>
        <h1 data-h1 className="display text-[clamp(2.55rem,min(11vw,10.5vh),9rem)] font-medium text-[var(--ink)]">
          <span className="block whitespace-nowrap font-medium opacity-90">Twice the speed</span>
          <span className="block whitespace-nowrap font-medium opacity-90">of sound.</span>
          <span className="block whitespace-nowrap font-extrabold">Once in history.</span>
        </h1>
        <p data-sub className="mt-[clamp(1rem,2.5vh,2rem)] max-w-[31rem] text-[clamp(0.9rem,min(1.1vw,1.9vh),1.15rem)] leading-[1.5] text-[var(--ink)]/80">
          For twenty-seven years a white delta crossed the Atlantic in under three and a half hours, at the edge of space, faster than the sun moves across the sky. This is how it was built, why it was first, and why it had to come down.
        </p>
        <div data-cta className="mt-[clamp(1rem,3vh,2.25rem)] flex flex-wrap items-center gap-3">
          <MagneticButton href="#dream">
            Begin the climb <span aria-hidden>↓</span>
          </MagneticButton>
          <MagneticButton href="#timeline" className="btn btn-ghost">
            Full timeline
          </MagneticButton>
        </div>
      </div>

      {/* Key figures on phones: a single hairline row instead of the floating chips */}
      <ul data-chips-mobile className="relative mt-[clamp(1.25rem,3.5vh,2rem)] flex items-stretch gap-4 border-t hairline pt-4 md:hidden" aria-label="Key figures">
        {CHIPS.map((c) => (
          <li key={c.label} className="flex-1">
            <p className="stat-value text-[clamp(1.05rem,5vw,1.5rem)] leading-none text-[var(--ink)]">
              {c.value}
              {c.unit && <span className="mono ml-1 text-[0.4em] tracking-[0.16em] opacity-70">{c.unit}</span>}
            </p>
            <p className="mono mt-1.5 text-[0.5rem] leading-[1.3] tracking-[0.16em] text-[var(--ink)]/55 uppercase">{c.label}</p>
          </li>
        ))}
      </ul>

      {/* HUD, bottom-right */}
      <div data-hud className="absolute bottom-[calc(var(--gutter)+0.75rem)] right-[calc(var(--gutter)+0.5rem)] hidden md:block">
        <Instrument />
      </div>

      {/* Scroll cue, bottom centre */}
      <div data-cue className="absolute bottom-[calc(var(--gutter)+0.5rem)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex" aria-hidden>
        <span className="eyebrow">Scroll to climb</span>
        <span className="block h-10 w-px overflow-hidden bg-[var(--ink)]/15">
          <span data-cue-line className="block h-full w-full origin-top scale-y-0 bg-[var(--ink)]" />
        </span>
      </div>
    </div>
  );
}
