"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { flight, useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Hotspot } from "@/content/chapters";

/** Hermite smoothstep of x over [a, b]; the one thing this file used `three` for. */
function smoothstep(x: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

interface Props {
  hotspots: readonly Hotspot[];
  /** Scroll distance the stepper stays pinned for, as a ScrollTrigger `end` string. */
  distance?: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Pinned hotspot walkthrough. The wrapper (not the Chapter) pins for `distance`
 * while the cards cross-fade one at a time, driven by a scrubbed timeline.
 * The card stack sits bottom-left so the rotating model owns the rest of the viewport.
 * Reduced motion: nothing pins; all cards render stacked.
 */
export function HotspotStepper({ hotspots, distance = "+=300%" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();
  const count = hotspots.length;

  useGSAP(
    () => {
      const el = wrap.current;
      if (!el || !ready || reduced || count === 0) return;

      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);
      const bar = el.querySelector<HTMLElement>("[data-bar]");
      const index = el.querySelector<HTMLElement>("[data-index]");
      const dots = gsap.utils.toArray<HTMLElement>("[data-dot]", el);

      gsap.set(cards, { autoAlpha: 0, y: 28 });
      gsap.set(cards[0], { autoAlpha: 1, y: 0 });

      // Called on every scrub frame; the index only changes a handful of times per pin, and each
      // write here is a style invalidation, so identical calls are dropped.
      let activeIdx = -1;
      const setActive = (i: number) => {
        if (i === activeIdx) return;
        activeIdx = i;
        if (index) index.textContent = pad(i + 1);
        dots.forEach((d, j) => d.setAttribute("data-active", j === i ? "true" : "false"));
      };
      setActive(0);

      // The stepper owns the whole chapter's camera progress so there is no hand-off jump:
      // header region → establishing key [0, 1/(count+1)], then the pin → hotspot keys.
      const chapter = el.closest<HTMLElement>("[data-chapter]");
      if (chapter) {
        ScrollTrigger.create({
          trigger: chapter,
          start: "top 60%",
          endTrigger: el,
          end: "top top",
          refreshPriority: -1,
          onUpdate: (self) => {
            flight.trackActive = true;
            flight.chapter = "anatomy";
            flight.chapterProgress = self.progress / (count + 1);
          },
          onToggle: (self) => {
            if (self.isActive) flight.trackActive = true;
            else if (self.direction < 0) flight.trackActive = false; // scrolled back above the chapter: release
          },
        });
      }

      const tl = gsap.timeline({
        defaults: { ease: "flight" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: distance,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActive(Math.min(count - 1, Math.floor(self.progress * count)));
            flight.trackActive = true;
            flight.chapter = "anatomy";
            // Hotspot keys span [1, count]/(count+1). The pin stops at the HOLD point of the last
            // segment so the camera stays on the final hotspot while its card is up; the move into
            // the next chapter happens after the pin (post trigger below), never inside it.
            // Hold the camera ON the active hotspot for most of its card, then move during the
            // last 40% — which is exactly when the cards cross-fade — so shot and card stay in sync.
            const u = self.progress * count;
            const i = Math.min(count - 1, Math.floor(u));
            const frac = u - i;
            const e = smoothstep(frac, 0.6, 1);
            const move = i >= count - 1 ? 0 : e; // the last hotspot holds; the post-pin trigger takes over
            flight.chapterProgress = (1 + i + move) / (count + 1);
          },
          onEnterBack: () => {
            flight.trackActive = true;
          },
        },
      });

      // Post-pin (spec table etc.): finish the last segment — last hotspot → next chapter's first key.
      const pinST = tl.scrollTrigger;
      if (chapter && pinST) {
        ScrollTrigger.create({
          trigger: chapter,
          start: () => pinST.end,
          endTrigger: chapter,
          end: "bottom 60%",
          refreshPriority: -2,
          onUpdate: (self) => {
            flight.trackActive = true;
            flight.chapter = "anatomy";
            flight.chapterProgress = (count + self.progress) / (count + 1);
          },
        });
      }

      // One unit of timeline time per card: hold, then cross-fade into the next.
      for (let i = 1; i < count; i++) {
        tl.to(cards[i - 1], { autoAlpha: 0, y: -28, duration: 0.35 }, i - 0.35).fromTo(
          cards[i],
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.35 },
          i - 0.1,
        );
      }
      // Hold the last card, and run the progress bar across the whole scrub.
      tl.to({}, { duration: 1 }, count - 1);
      if (bar) tl.fromTo(bar, { scaleX: 1 / count }, { scaleX: 1, ease: "none", duration: tl.duration() }, 0);
    },
    { dependencies: [ready, reduced, count, distance], scope: wrap },
  );

  return (
    <div ref={wrap} className={reduced ? "relative" : "relative h-[100svh]"}>
      <div className={reduced ? "container-x py-[10vh]" : "container-x absolute inset-x-0 bottom-0 pb-[8vh]"}>
        <div className="glass w-full max-w-[26rem] rounded-2xl p-7 md:p-8">
          {/* progress header */}
          <div className="mono flex items-center justify-between text-[0.6875rem] tracking-[0.22em] text-ink/70">
            <span>
              <span data-index className="text-ink">
                01
              </span>
              <span className="px-2">—</span>
              <span>{pad(count)}</span>
            </span>
            <span className="flex items-center gap-1.5" aria-hidden>
              {hotspots.map((h, i) => (
                <span
                  key={h.id}
                  data-dot
                  data-active={reduced || i === 0 ? "true" : "false"}
                  className="h-1 w-1 rounded-full bg-ink/25 transition-colors duration-300 data-[active=true]:bg-accent"
                />
              ))}
            </span>
          </div>
          <div className="mt-4 h-px w-full overflow-hidden bg-ink/12" aria-hidden>
            <div data-bar className="h-full w-full origin-left bg-accent" style={{ transform: reduced ? undefined : "scaleX(0)" }} />
          </div>

          {/* cards */}
          <div className={reduced ? "mt-6 flex flex-col gap-8" : "relative mt-6 min-h-[17rem] md:min-h-[16rem]"}>
            {hotspots.map((h, i) => (
              <article
                key={h.id}
                data-card
                className={reduced ? "border-t hairline pt-6 first:border-t-0 first:pt-0" : "absolute inset-0"}
                style={!reduced && i > 0 ? { visibility: "hidden", opacity: 0 } : undefined}
              >
                <p className="eyebrow">{h.title}</p>
                <p className="stat-value mt-3 text-[clamp(1.75rem,3vw,2.5rem)] text-ink">{h.value}</p>
                <p className="mt-4 text-[0.9375rem] leading-[1.55] text-ink/75">{h.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
