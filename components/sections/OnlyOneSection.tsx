import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Reveal } from "@/components/ui/Reveal";
import { Ticker } from "@/components/sections/only-one/Ticker";

/* ── Sources ─────────────────────────────────────────────────────────── */
const SRC = {
  tu144: "https://en.wikipedia.org/wiki/Tupolev_Tu-144",
  ban: "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-91/subpart-I/section-91.817",
  xb1: "https://en.wikipedia.org/wiki/Boom_XB-1",
  x59: "https://www.nasa.gov/aeronautics/x-59-first-supersonic-flight/",
  faa: "https://www.faa.gov/newsroom",
} as const;

/* ── Tu-144 vs Concorde ledger ───────────────────────────────────────── */
interface LedgerRow {
  label: string;
  tu144: string;
  concorde: string;
  note?: string;
  source: string;
}

const LEDGER: readonly LedgerRow[] = [
  { label: "First flight", tu144: "31 Dec 1968", concorde: "2 Mar 1969", source: SRC.tu144 },
  { label: "Passenger flights", tu144: "55", concorde: "~50,000", note: "British Airways alone", source: SRC.tu144 },
  { label: "Passenger service", tu144: "7 months", concorde: "27 years", note: "Nov 1977 – Jun 1978 vs 1976 – 2003", source: SRC.tu144 },
  { label: "Recorded failures", tu144: "226+ in 102 flights", concorde: "—", source: SRC.tu144 },
  { label: "Fatal crashes", tu144: "2", concorde: "1", source: SRC.tu144 },
];

/* ── US overland ban ─────────────────────────────────────────────────── */
const BAN = {
  date: "27 April 1973",
  rule: "14 CFR 91.817",
  summary:
    "The United States banned civil supersonic flight over land. No Mach 1 over American soil meant no coast-to-coast market — and without it, nobody could make the numbers work on a second generation.",
  source: SRC.ban,
} as const;

/* ── Successors ticker ───────────────────────────────────────────────── */
interface TickerItem {
  text: string;
  source: string;
}

const SUCCESSORS: readonly TickerItem[] = [
  { text: "BOOM XB-1 — SUPERSONIC 28 JAN 2025", source: SRC.xb1 },
  { text: "NASA X-59 — FIRST FLIGHT 28 OCT 2025", source: SRC.x59 },
  { text: "X-59 — SUPERSONIC 5 JUN 2026", source: SRC.x59 },
  { text: "FAA — OVERLAND BAN PROPOSED LIFTED 2 JUL 2026", source: SRC.faa },
  { text: "BOOM OVERTURE — FIRST FLIGHT NOT BEFORE 2027", source: SRC.xb1 },
];

/** Sonic-boom cone with the overland carpet struck through: the 1973 rule in one glyph. */
function NoOverlandGlyph() {
  return (
    <svg viewBox="0 0 360 220" className="h-auto w-full max-w-[22rem] text-ink" role="img" aria-label="Sonic boom cone over land, struck through">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Mach cone */}
        <path d="M44 42 L300 130" opacity="0.9" />
        <path d="M44 42 L300 22" opacity="0.35" />
        <path d="M44 42 L300 58" opacity="0.5" />
        <path d="M44 42 L300 94" opacity="0.7" />
        {/* Aircraft: a tiny delta */}
        <path d="M28 42 L46 36 L46 48 Z" fill="currentColor" stroke="none" />
        {/* Ground */}
        <path d="M16 172 H344" />
        {/* Boom carpet hatch on the ground */}
        {Array.from({ length: 17 }, (_, i) => (
          <path key={i} d={`M${60 + i * 15} 172 l-8 12`} opacity="0.5" />
        ))}
        {/* Shockwave hitting the ground */}
        <path d="M300 130 Q 318 154 330 172" opacity="0.9" />
        {/* Prohibition badge */}
        <circle cx="262" cy="104" r="38" stroke="var(--accent)" strokeWidth="1.5" fill="var(--paper)" fillOpacity="0.12" />
        <path d="M235 77 L289 131" stroke="var(--accent)" strokeWidth="1.5" />
      </g>
      <text x="262" y="206" textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="2" opacity="0.7" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
        NO SUPERSONIC OVER LAND
      </text>
      <text x="16" y="206" fill="currentColor" fontSize="9" letterSpacing="2" opacity="0.5" fontFamily="var(--font-jetbrains), ui-monospace, monospace">
        14 CFR 91.817 · 27 APR 1973
      </text>
    </svg>
  );
}

export function OnlyOneSection() {
  return (
    <Chapter id="only-one" alt={[0.98, 1]} theme="dark" className="container-x py-[20vh]" label="Why it stayed the only one">
      <ChapterHeader
        number="05"
        kicker="Why it stayed the only one"
        title={
          <>
            Twenty-seven years.
            <br />
            Never replaced.
          </>
        }
        lede="Concorde carried passengers from January 1976 to October 2003 and no airliner has flown as fast since. It was not for want of rivals — the one that beat it into the air lasted seven months in service."
      />

      {/* ── Ledger ─────────────────────────────────────────────────── */}
      <div className="mt-[14vh] max-w-[62rem]">
        {/* Column headers only exist on the wide layout; on phones each cell carries its own label. */}
        <div className="mono hidden grid-cols-[1.4fr_1fr_1.2fr] gap-x-6 border-b hairline pb-3 text-[0.6875rem] tracking-[0.22em] text-ink/60 uppercase md:grid">
          <span>Ledger</span>
          <span>Tupolev Tu-144</span>
          <span className="text-ink">Concorde</span>
        </div>
        <FadeIn stagger={0.08} y={24}>
          {LEDGER.map((row) => (
            <div
              key={row.label}
              className="grid gap-y-3 border-b hairline py-5 md:grid-cols-[1.4fr_1fr_1.2fr] md:items-baseline md:gap-x-6 md:gap-y-0 md:py-6"
            >
              <div>
                <span className="text-[0.95rem] text-ink/80 md:text-base">{row.label}</span>
                {row.note && <span className="mono mt-1 block text-[0.625rem] leading-[1.55] tracking-[0.06em] text-ink/45 md:text-[0.6875rem] md:tracking-[0.08em]">{row.note}</span>}
              </div>
              {/* On phones the two figures sit side by side under the label; on md+ the wrappers
                  dissolve (display: contents) and the cells rejoin the three-column table. */}
              <div className="grid grid-cols-2 items-baseline gap-x-5 md:contents">
                <div className="md:contents">
                  <span className="mono mb-1 block text-[0.5rem] tracking-[0.2em] text-ink/40 uppercase md:hidden">Tu-144</span>
                  <span className="mono text-[0.9rem] text-ink/55 md:text-base">{row.tu144}</span>
                </div>
                <div className="md:contents">
                  <span className="mono mb-1 block text-[0.5rem] tracking-[0.2em] text-ink/40 uppercase md:hidden">Concorde</span>
                  <span className="display text-[clamp(1.3rem,5.2vw,2.4rem)] font-semibold text-ink">{row.concorde}</span>
                </div>
              </div>
            </div>
          ))}
        </FadeIn>
        <p className="mono mt-3 text-[0.6875rem] tracking-[0.08em] text-ink/40">
          Tu-144 figures:{" "}
          <a href={SRC.tu144} className="underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
            Wikipedia
          </a>
        </p>
      </div>

      {/* ── The ban ────────────────────────────────────────────────── */}
      <div className="mt-[18vh] grid max-w-[62rem] gap-10 md:grid-cols-[1fr_minmax(0,22rem)] md:items-center">
        <div>
          <Reveal as="p" className="eyebrow mb-5" mode="chars" stagger={0.015}>
            {BAN.date} &nbsp;·&nbsp; {BAN.rule}
          </Reveal>
          <Reveal as="h3" className="display text-[clamp(1.9rem,4vw,3.4rem)] font-semibold" mode="lines">
            The sky closed over America.
          </Reveal>
          <Reveal as="p" className="mt-6 max-w-[38rem] text-[1.05rem] leading-[1.5] text-ink/75" mode="lines" delay={0.15}>
            {BAN.summary}
          </Reveal>
          <p className="mono mt-5 text-[0.6875rem] tracking-[0.08em] text-ink/40">
            <a href={BAN.source} className="underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
              eCFR § 91.817 — Civil aircraft sonic boom
            </a>
          </p>
        </div>
        <FadeIn className="glass rounded-2xl p-6 md:justify-self-end" y={30}>
          <NoOverlandGlyph />
        </FadeIn>
      </div>

      {/* ── Successors ─────────────────────────────────────────────── */}
      <div className="mt-[18vh]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <Reveal as="p" className="eyebrow" mode="chars" stagger={0.015}>
            Successors &nbsp;·&nbsp; 2025 —
          </Reveal>
          <p className="mono text-[0.6875rem] tracking-[0.08em] text-ink/40">
            {SUCCESSORS.map((s, i) => (
              <span key={s.text}>
                {i > 0 && " · "}
                <a href={s.source} className="underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
                  [{i + 1}]
                </a>
              </span>
            ))}
          </p>
        </div>
        <Ticker items={SUCCESSORS.map((s) => s.text)} label="Supersonic successors, 2025 onwards" />
        <Reveal as="p" className="serif mt-10 max-w-[34rem] text-[clamp(1.3rem,2vw,1.8rem)] leading-[1.25] text-ink/80" mode="lines" delay={0.1}>
          Half a century on, the question is no longer whether an airliner can fly at Mach 2 — it is whether anyone is allowed to hear it.
        </Reveal>
      </div>
    </Chapter>
  );
}
