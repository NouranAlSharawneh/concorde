import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { HotspotStepper } from "@/components/sections/anatomy/HotspotStepper";
import { ANATOMY } from "@/content/chapters";

/**
 * 02 / Engineering — Anatomy of a supersonic airliner.
 * Header (unpinned) → pinned hotspot stepper (pins its own wrapper, never the Chapter)
 * → unpinned mono spec sheet.
 */
export function AnatomySection() {
  return (
    <Chapter id="anatomy" alt={[0.15, 0.3]} theme="light" label="Anatomy of a supersonic airliner" className="pt-[20vh]">
      <div className="container-x">
        <ChapterHeader
          number={ANATOMY.number}
          kicker={ANATOMY.kicker}
          title={
            <>
              {ANATOMY.title[0]}
              <br />
              {ANATOMY.title[1]}
            </>
          }
          lede={ANATOMY.lede}
          className="max-w-[52rem]"
        />
      </div>

      {/* Pinned walkthrough — the model rotates behind; the cards stay bottom-left */}
      <div className="mt-[10vh]">
        <HotspotStepper hotspots={ANATOMY.hotspots} distance="+=300%" />
      </div>

      {/* Spec sheet */}
      <div className="container-x py-[20vh]">
        <FadeIn className="mb-10 flex items-baseline justify-between gap-6">
          <p className="eyebrow">Specification · production aircraft</p>
          <p className="mono text-[0.6875rem] tracking-[0.22em] text-ink/50">{ANATOMY.number} / SPEC</p>
        </FadeIn>
        <FadeIn stagger={0.06} className="grid grid-cols-1 border-t hairline sm:grid-cols-2 lg:grid-cols-3">
          {ANATOMY.specs.map((row, i) => {
            const sm = i % 2 !== 0 ? "sm:border-l sm:pl-6" : "sm:border-l-0 sm:pl-0";
            const lg = i % 3 !== 0 ? "lg:border-l lg:pl-6" : "lg:border-l-0 lg:pl-0";
            return (
              <div
                key={row.label}
                className={`flex flex-col gap-3 border-b hairline py-6 pr-6 transition-colors duration-500 hover:border-[var(--ink-24)] ${sm} ${lg}`}
              >
                <span className="eyebrow">{row.label}</span>
                <span className="mono text-[clamp(1.125rem,1.6vw,1.5rem)] text-ink">{row.value}</span>
              </div>
            );
          })}
        </FadeIn>
      </div>
    </Chapter>
  );
}
