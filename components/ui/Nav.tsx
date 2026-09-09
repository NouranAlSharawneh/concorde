"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { flight } from "@/lib/flight-state";
import { AudioToggle } from "./AudioToggle";
import { MagneticButton } from "./MagneticButton";

const LINKS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "dream", label: "Origins" },
  { id: "anatomy", label: "Anatomy" },
  { id: "archive", label: "Archive" },
  { id: "mach2", label: "Mach 2" },
  { id: "timeline", label: "Timeline" },
];

/** Pill nav left · wordmark centre · sound + CTA right. Hides on scroll down, returns on scroll up. */
export function Nav() {
  const ready = useUI((s) => s.ready);
  const chapter = useUI((s) => s.chapter);
  const root = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current + 4;
      const goingUp = y < lastY.current - 4;
      if (goingDown && y > 120) setHidden(true);
      else if (goingUp) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(
    () => {
      if (!ready || !root.current) return;
      gsap.from(root.current.querySelectorAll("[data-nav-item]"), { y: -24, opacity: 0, stagger: 0.06, duration: 1, ease: "climb", delay: 0.6 });
    },
    { dependencies: [ready], scope: root },
  );

  return (
    <header
      ref={root}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-6 px-[var(--gutter)] py-5 transition-transform duration-700"
      style={{ transform: hidden ? "translateY(-120%)" : "translateY(0)", transitionTimingFunction: "var(--ease-climb)", visibility: ready ? "visible" : "hidden" }}
    >
      <a data-nav-item href="#hero" className="display shrink-0 text-[1rem] font-bold tracking-[0.32em] text-[var(--ink)]" aria-label="Concorde — back to top" data-cursor="hover">
        CONCORDE
      </a>

      <nav data-nav-item className="glass absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full p-1 xl:flex" aria-label="Chapters">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            data-cursor="hover"
            className={`mono rounded-full px-3.5 py-2 text-[0.66rem] uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-300 ${chapter === l.id ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink)]/80 hover:text-[var(--ink)]"}`}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div data-nav-item className="flex shrink-0 items-center gap-3">
        <AudioToggle />
        <MagneticButton href="#dream" className="btn hidden sm:inline-flex">
          Begin the flight <span aria-hidden>↓</span>
        </MagneticButton>
      </div>
      <span className="sr-only">{`Current altitude ${Math.round(flight.alt * 60000)} feet`}</span>
    </header>
  );
}
