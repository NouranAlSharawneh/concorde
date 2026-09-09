"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SplitFlap } from "@/components/ui/SplitFlap";
import { Credits } from "./Credits";
import { ReturnFlight } from "./ReturnFlight";
import { Wordmark } from "./Wordmark";

/**
 * The closing block: a departure-board eyebrow, a little clear sky for the climb-out, then the
 * small print, a rule, and the name the page ends under.
 */
export function FinaleStage() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !ready) return;
      ScrollTrigger.create({ trigger: el, start: "top 80%", once: true, onEnter: () => setInView(true) });
      const rule = el.querySelector<HTMLElement>("[data-rule]");
      if (!rule) return;
      if (reduced) {
        gsap.set(rule, { scaleX: 1 });
        return;
      }
      // The contrail becomes the rule the wordmark sits under; it completes exactly at the bottom of the page.
      gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 104%", scrub: 0.6 } });
    },
    { dependencies: [ready, reduced], scope: root },
  );

  return (
    <div ref={root} className="container-x flex min-h-[52svh] flex-col justify-between gap-[clamp(3rem,9vh,6rem)] pt-[clamp(3rem,7vh,5rem)] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Top: departure board left, the way back right */}
      <div className="flex items-start justify-between gap-6 lg:pr-14">
        <p className="mono flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.62rem] tracking-[0.22em] text-[var(--ink-60)] uppercase">
          <SplitFlap value="End of flight" className="text-[0.7rem]" speed={30} stagger={40} active={inView || reduced} />
          <span className="hidden sm:inline">1976 — 2003</span>
        </p>
        <ReturnFlight />
      </div>

      {/* Bottom: credits, the rule, and the name */}
      <footer className="finale-stack flex flex-col gap-4 sm:gap-5">
        <Credits className="lg:pr-14" />
        <div data-rule className="h-px w-full origin-left bg-[var(--ink)]/70" style={{ transform: "scaleX(0)" }} aria-hidden />
        <Wordmark />
      </footer>
    </div>
  );
}
