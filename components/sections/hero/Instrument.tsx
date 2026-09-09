"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { flight } from "@/lib/flight-state";
import { altitudeToFeet, altitudeToMach } from "@/lib/altitude";

/** Live altimeter/Mach HUD chip, read straight off the shared flight state. */
export function Instrument({ className = "" }: { className?: string }) {
  const feet = useRef<HTMLSpanElement>(null);
  const mach = useRef<HTMLSpanElement>(null);
  const needle = useRef<SVGGElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let acc = 0;
    const tick = (_t: number, dt: number) => {
      acc += dt;
      if (acc < 80) return;
      acc = 0;
      const alt = flight.alt;
      const ft = altitudeToFeet(alt);
      const m = altitudeToMach(alt);
      if (feet.current) feet.current.textContent = ft.toLocaleString("en-GB");
      if (mach.current) mach.current.textContent = m.toFixed(2);
      if (needle.current) needle.current.style.transform = `rotate(${-120 + alt * 240}deg)`;
      if (ring.current) ring.current.style.strokeDashoffset = String(264 * (1 - alt));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div className={`glass flex items-center gap-4 rounded-2xl px-4 py-3 ${className}`} role="status" aria-live="off">
      <svg viewBox="0 0 100 100" className="h-14 w-14 shrink-0" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ink)" strokeOpacity="0.15" strokeWidth="2" />
        <circle ref={ring} cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="264" transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 0.2s linear" }} />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="50" y1="12" x2="50" y2={i % 3 === 0 ? "20" : "16"} stroke="var(--ink)" strokeOpacity="0.5" strokeWidth="1.5" transform={`rotate(${i * 30} 50 50)`} />
        ))}
        <g ref={needle} style={{ transformOrigin: "50px 50px", transition: "transform 0.2s linear" }}>
          <line x1="50" y1="50" x2="50" y2="18" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="50" cy="50" r="3.5" fill="var(--ink)" />
      </svg>
      <div className="leading-none">
        <p className="eyebrow mb-1">Altitude</p>
        <p className="mono text-[1.15rem] text-[var(--ink)]">
          <span ref={feet}>0</span> <span className="text-[0.6em] opacity-60">FT</span>
        </p>
        <p className="mono mt-1 text-[0.75rem] text-[var(--ink)]/70">
          MACH <span ref={mach}>0.30</span>
        </p>
      </div>
    </div>
  );
}
