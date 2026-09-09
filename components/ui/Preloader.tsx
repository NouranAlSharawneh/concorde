"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useLenis } from "lenis/react";
import { gsap, DrawSVGPlugin, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { SplitFlap } from "./SplitFlap";
import { CONCORDE_PLANFORM } from "./ConcordeSilhouette";

const MIN_MS = 2600;
const MAX_MS = 9000;
const CLEARANCE: ReadonlyArray<readonly [string, string]> = [
  ["Flight", "BA001"],
  ["Route", "LHR — JFK"],
  ["Cruise", "MACH 2.04"],
  ["Level", "FL600"],
];

/**
 * Cinematic preloader: a departure board flips through the flight plan while an
 * altimeter counts real asset progress (0 → 60,000 ft). Hands off with a clip-path wipe.
 */
export function Preloader() {
  const { progress, active } = useProgress();
  const lenis = useLenis();
  const setReady = useUI((s) => s.setReady);
  const setLaunched = useUI((s) => s.setLaunched);
  const root = useRef<HTMLDivElement>(null);
  const feet = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const plan = useRef<SVGSVGElement>(null);
  const [boardIdx, setBoardIdx] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef<number>(0);
  const shown = useRef({ v: 0 });
  const peak = useRef(0);
  const vel = useRef(0);
  /** Once the closing tween owns `shown`, the climb loop must let go of it. */
  const handoff = useRef(false);

  // An altimeter reads in tens of feet, not single feet. Without this the eased tail of the climb
  // ticked 59,993 → 59,997 → 59,999 → 60,000, which reads as the counter breaking rather than levelling.
  const render = useCallback(() => {
    const ft = Math.round((shown.current.v / 100) * 60000 / 25) * 25;
    if (feet.current) feet.current.textContent = ft.toLocaleString("en-GB");
    if (bar.current) bar.current.style.transform = `scaleX(${shown.current.v / 100})`;
  }, []);

  useEffect(() => {
    started.current = performance.now();
    const flip = setInterval(() => setBoardIdx((i) => Math.min(CLEARANCE.length, i + 1)), 420);
    return () => clearInterval(flip);
  }, []);

  // Lock scrolling through Lenis (not overflow:hidden) so the scrollbar never appears/disappears
  // and the layout doesn't shift when the loader hands off.
  useEffect(() => {
    if (!lenis || done) return;
    lenis.stop();
    window.scrollTo(0, 0);
  }, [lenis, done]);

  // Keep the real load progress in a ref; the altimeter reads it from the climb loop below.
  useEffect(() => {
    peak.current = Math.max(peak.current, progress);
  }, [progress]);

  // The altimeter is a CLIMB, not a progress bar. Assets typically finish in a couple of bursts,
  // which used to park the number at ~53,000 ft and then jump to 60,000 at the hand-off. Instead
  // it climbs continuously at a bounded rate: it chases real progress, never overtakes it by much,
  // and never stalls — so the last thousands of feet are counted, not skipped.
  useEffect(() => {
    render();
    const tick = (_t: number, dt: number) => {
      // The hand-off tween writes `shown` too. While both ran, GSAP interpolated from the value it
      // captured at the start while the loop kept adding to it, so the readout stepped backwards.
      if (handoff.current) return;
      const secs = Math.min(0.05, dt / 1000);
      const elapsed = performance.now() - started.current;
      // A gentle time-based floor keeps the needle moving while the network is quiet…
      const floor = Math.min(92, (elapsed / MIN_MS) * 92);
      // …but it can never run past what has actually loaded by more than a sliver.
      const ceiling = Math.min(99, Math.max(peak.current, 8) + 6);
      const target = Math.max(8, Math.min(Math.max(floor, peak.current), ceiling));
      const gap = target - shown.current.v;
      // Setting the rate straight from the gap made the needle lurch every time a batch of assets
      // landed — consecutive frames could differ by 50 ft or 1,200 ft. Ease the RATE instead, so
      // the climb accelerates and slows over about a quarter of a second and the increments stay
      // in the same ballpark frame to frame.
      const desired = gap > 0.01 ? Math.min(30, Math.max(5, gap * 2.2)) : 0;
      vel.current += (desired - vel.current) * (1 - Math.pow(0.02, secs));
      if (vel.current > 0.01 && gap > 0) {
        shown.current.v = Math.min(target, shown.current.v + vel.current * secs);
        render();
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [render]);

  // Decide when to hand off: assets loaded (or timeout) AND minimum dwell. The loader never waits
  // for input; audio is unlocked by AudioDirector on the first gesture after hand-off.
  useEffect(() => {
    const loaded = progress >= 100 && !active;
    const elapsed = performance.now() - started.current;
    const wait = Math.max(0, MIN_MS - elapsed);
    const t = window.setTimeout(() => setDone(true), loaded ? wait : Math.max(wait, MAX_MS - elapsed));
    return () => window.clearTimeout(t);
  }, [progress, active]);

  useGSAP(
    () => {
      if (path.current) {
        gsap.set(path.current, { drawSVG: "0%" });
        // Faded up slowly rather than switched on. A phone lays the page out at the browser's
        // default width for the first few hundred ms before the viewport meta constrains it, and
        // anything centred in that window lands off to one side and then jumps. By the time the
        // planform is perceptible the layout has long since settled, so the jump is never seen.
        gsap.fromTo(plan.current, { opacity: 0 }, { opacity: 0.55, duration: 1.4, ease: "power1.inOut" });
        gsap.to(path.current, { drawSVG: "100%", duration: 2.4, ease: "power2.inOut" });
      }
      gsap.to("[data-row]", { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out", delay: 0.25 });
      gsap.from("[data-row]", { y: 14, duration: 0.5, stagger: 0.12, ease: "power2.out", delay: 0.25 });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!done || !root.current) return;
      handoff.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          lenis?.start();
          setReady(true);
          root.current?.remove();
        },
      });
      // The closing climb runs at a steady perceived rate: the further there is to go, the longer
      // it takes (0.55 s minimum, 2.2 s for a full-scale climb), so it never reads as a jump.
      const remaining = Math.max(0, 100 - shown.current.v);
      tl.to(shown.current, {
        v: 100,
        duration: gsap.utils.clamp(0.55, 2.2, (remaining / 100) * 2.2),
        // power2.inOut spent its last quarter-second crawling. A mild ease-out levels off without
        // the readout appearing to stall short of cruise.
        ease: "power1.out",
        onUpdate: render,
      })
        // Hold on 60,000 ft for a beat before anything moves, so the climb is seen to finish.
        .to(".pre-inner > *", { yPercent: -30, opacity: 0, stagger: 0.05, duration: 0.7, ease: "power3.in" }, "+=0.25")
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.15, ease: "climb", onStart: () => setLaunched(true) }, "-=0.35");
    },
    { dependencies: [done, setReady, setLaunched, lenis, render], scope: root },
  );

  return (
    <div
      ref={root}
      aria-busy={!done}
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden"
      style={{
        clipPath: "inset(0 0 0% 0)",
        background: "linear-gradient(180deg, #cfe4f8 0%, #eef6ff 55%, #fff6ea 100%)",
        color: "#0e1b2b",
      }}
    >
      <div className="pre-inner flex h-full flex-col justify-between p-[var(--gutter)]">
        {/* Header strip */}
        <div className="flex items-start justify-between gap-6">
          <p className="eyebrow">Speedbird Concorde One</p>
          <p className="mono flex items-center gap-2.5 text-[0.62rem] tracking-[0.24em] uppercase">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#c2410c] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c2410c]" />
            </span>
            Cleared for departure
          </p>
        </div>

        {/* Planform, drawn as if on a drafting table. It starts invisible on purpose: until GSAP
            initialises, the path is fully stroked, and on a phone the layout viewport is still the
            browser default for the first few hundred ms — so a finished planform appeared off to
            one side, then jumped to centre and started drawing itself. Nothing shows until the
            animation owns it and the layout has settled. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg ref={plan} viewBox="0 0 400 620" className="h-[min(58vh,540px)] w-auto" fill="none" aria-hidden style={{ opacity: 0 }}>
            <path ref={path} d={CONCORDE_PLANFORM} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Clearance rows: label left, split-flap value right */}
        <div className="relative mx-auto w-full max-w-[min(92vw,34rem)]">
          <div className="flex flex-col" style={{ ["--flap-bg" as string]: "#0e1b2b", ["--flap-fg" as string]: "#fff6ea" }}>
            {CLEARANCE.map(([label, value], i) => (
              <div
                key={label}
                data-row
                className="flex items-center justify-between gap-6 border-b border-[#0e1b2b]/12 py-3 first:border-t first:border-t-[#0e1b2b]/12"
                style={{ opacity: 0 }}
              >
                <span className="mono text-[0.6rem] tracking-[0.24em] text-[#0e1b2b]/55 uppercase">{label}</span>
                <SplitFlap value={value} length={9} className="text-[clamp(0.85rem,1.7vw,1.15rem)]" speed={26} stagger={34} active={boardIdx >= i} />
              </div>
            ))}
          </div>
        </div>

        {/* Altimeter + progress */}
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow mb-2">Altitude</p>
            <p className="stat-value text-[clamp(3rem,9vw,8rem)] leading-none">
              <span ref={feet} className="tabular-nums">0</span>
              <span className="ml-3 align-top text-[0.3em] tracking-[0.2em]">FT</span>
            </p>
          </div>
          <div className="mb-4 w-[min(38vw,420px)]">
            <p className="mono mb-3 text-right text-[0.6rem] tracking-[0.22em] text-[#0e1b2b]/55 uppercase">
              Climbing to cruise
            </p>
            <div className="h-px w-full bg-[#0e1b2b]/15">
              <div ref={bar} className="h-full w-full origin-left bg-[#0e1b2b]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep the plugin referenced so tree-shaking can't drop its registration.
void DrawSVGPlugin;
