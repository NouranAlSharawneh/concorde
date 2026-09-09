import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { Reveal } from "@/components/ui/Reveal";
import { FadeIn } from "@/components/ui/FadeIn";
import { BlueprintDelta } from "@/components/sections/dream/BlueprintDelta";
import { DREAM } from "@/content/chapters";

/**
 * 01 / Take-off — the 1956 committee, the 1962 treaty, the cost, the name.
 * DOM stays in the left ~55% on desktop; the right column is empty above the
 * archival cards so the aircraft pitching up behind has room to breathe.
 */
export function DreamSection() {
  const { estimate, final, multiple } = DREAM.cost;

  return (
    <Chapter id="dream" alt={[0.05, 0.15]} theme="light" label="The dream" className="container-x py-[20vh]" style={{ minHeight: "160vh" }}>
      <div className="grid gap-y-24 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-x-[6vw]">
        {/* ── Left: headline, copy, cost ledger, blueprint ── */}
        <div className="max-w-[38rem]">
          <ChapterHeader
            number={DREAM.number}
            kicker={DREAM.kicker}
            title={
              <>
                {DREAM.title[0]}
                <br />
                {DREAM.title[1]}
              </>
            }
            lede={DREAM.lede}
          />

          <div className="mt-[12vh] flex flex-col gap-7 text-[clamp(1rem,1.15vw,1.125rem)] leading-[1.55] text-ink/80">
            {DREAM.body.map((paragraph, i) => (
              <Reveal key={i} as="p" mode="lines" delay={i * 0.05}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          {/* Cost ledger */}
          <FadeIn stagger={0.1} className="mt-[10vh] grid grid-cols-3 border-t hairline">
            {[estimate, final, multiple].map((cell, i) => (
              <div key={cell.label} className={`py-5 ${i > 0 ? "border-l hairline pl-5" : "pr-5"}`}>
                <p className="eyebrow">{cell.label}</p>
                <p className={`stat-value mt-3 text-[clamp(1.5rem,2.6vw,2.5rem)] ${i === 2 ? "text-accent" : ""}`}>{cell.value}</p>
              </div>
            ))}
          </FadeIn>

          {/* Blueprint */}
          <div className="mt-[10vh] flex items-end gap-8">
            <BlueprintDelta className="w-[clamp(9rem,16vw,14rem)] shrink-0" />
            <FadeIn className="mb-6 max-w-[16rem]">
              <p className="eyebrow">Partners</p>
              <dl className="mono mt-4 flex flex-col gap-3 text-[0.75rem] uppercase tracking-[0.12em] text-ink/75">
                {DREAM.partners.map((p) => (
                  <div key={p.label} className="flex flex-col gap-1 border-t hairline pt-3">
                    <dt className="text-ink/50">{p.label}</dt>
                    <dd>
                      {p.value}
                      {p.detail && <span className="block text-ink/50">{p.detail}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          </div>
        </div>

        {/* ── Right: empty sky above, archival record cards pinned to the bottom ── */}
        <aside className="flex flex-col justify-end lg:pt-[55vh]">
          <FadeIn stagger={0.12} className="flex flex-col gap-4 lg:ml-auto lg:w-full lg:max-w-[24rem]">
            {DREAM.cards.map((card) => (
              <article
                key={card.date}
                className="glass group rounded-2xl p-6 transition-[transform,border-color] duration-500 ease-[var(--ease-climb)] hover:-translate-y-1 hover:border-[var(--ink-24)]"
              >
                <p className="mono text-[0.6875rem] tracking-[0.22em] text-accent">{card.date}</p>
                <h3 className="display mt-4 text-[1.375rem] font-semibold">{card.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-[1.5] text-ink/70">{card.line}</p>
              </article>
            ))}
          </FadeIn>
        </aside>
      </div>
    </Chapter>
  );
}
