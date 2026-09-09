import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Reveal } from "@/components/ui/Reveal";
import { LastLanding } from "@/components/sections/descent/LastLanding";

/* ── Sources ─────────────────────────────────────────────────────────── */
const SRC = {
  af4590: "https://en.wikipedia.org/wiki/Air_France_Flight_4590",
  mods: "https://www.heritageconcorde.com/caa-and-dgac-modifications-2001",
  retirement: "https://www.heritageconcorde.com/concorde-retirement-2003",
  lastDay: "https://www.heritageconcorde.com/concorde-retirement-2003",
  opHistory: "https://en.wikipedia.org/wiki/Concorde_operational_history",
} as const;

/* ── 25 July 2000 ────────────────────────────────────────────────────── */
const GONESSE = {
  date: "25 July 2000",
  flight: "Air France 4590",
  reg: "F-BTSC",
  place: "Gonesse, France",
  lives: 113,
  breakdown: "one hundred passengers, nine crew, and four people on the ground",
  source: SRC.af4590,
} as const;

interface ChainStep {
  title: string;
  detail: string;
  source: string;
}

/** The causal chain, in order, from the BEA findings. */
const CHAIN: readonly ChainStep[] = [
  {
    title: "A strip of titanium on the runway",
    detail: "A 435 mm wear strip had fallen from a Continental Airlines DC-10 that departed minutes earlier.",
    source: SRC.af4590,
  },
  {
    title: "A tyre bursts at take-off speed",
    detail: "Concorde ran over the strip at roughly 185 mph. The left main-gear tyre was cut and failed.",
    source: SRC.af4590,
  },
  {
    title: "4.5 kg of rubber hits the wing",
    detail: "A fragment struck the underside of the wing at around 140 m/s — not a puncture, but a pressure shock through the full fuel tank.",
    source: SRC.af4590,
  },
  {
    title: "Tank 5 ruptures",
    detail: "Fuel streamed out, ignited, and the aircraft could neither climb away nor return. It came down on a hotel in Gonesse within two minutes of take-off.",
    source: SRC.af4590,
  },
];

/* ── Grounding and return ────────────────────────────────────────────── */
const GROUNDING = {
  grounded: "August 2000 – November 2001",
  fixes: [
    { what: "Kevlar-aramid liners", why: "fitted inside the fuel tanks so a shock could no longer split them" },
    { what: "Michelin NZG tyres", why: "near-zero-growth radials that shed far smaller pieces if they fail" },
  ],
  returned: "7 November 2001",
  source: SRC.mods,
} as const;

/* ── 10 April 2003 ───────────────────────────────────────────────────── */
const RETIREMENT = {
  date: "10 April 2003",
  reasons: [
    { title: "Airbus withdrew support", detail: "The manufacturer would no longer keep supplying the parts and engineering that kept the type certified." },
    { title: "Premium travel collapsed", detail: "After 11 September 2001 the transatlantic business traffic that filled the cabin never came back." },
    { title: "Maintenance costs rose", detail: "An ageing, one-of-a-kind fleet cost more every year to keep airworthy." },
  ],
  source: SRC.retirement,
} as const;

/* ── 26 November 2003 ────────────────────────────────────────────────── */
const LAST_FLIGHT = {
  date: "26 November 2003",
  reg: "G-BOAF",
  route: "Heathrow → Filton",
  duration: "1 h 30",
  crowd: "20,000",
  source: SRC.opHistory,
} as const;

function SourceLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="mono text-[0.6875rem] tracking-[0.08em] text-ink/40 underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
      {children}
    </a>
  );
}

export function DescentSection() {
  return (
    <Chapter id="descent" alt={[1, 0.45]} theme="dark" className="container-x min-h-[200vh] py-[20vh]" label="Why it had to come down">
      <ChapterHeader
        number="06"
        kicker="Why it had to come down"
        title={
          <>
            Why it had
            <br />
            to come down
          </>
        }
        lede="For twenty-four years Concorde flew without losing a single passenger. Then one afternoon outside Paris, that ended."
      />

      {/* (a) Gonesse */}
      <div className="mt-[22vh] max-w-[62rem]">
        <Reveal as="p" className="eyebrow mb-8" mode="chars" stagger={0.012}>
          {GONESSE.date} &nbsp;·&nbsp; {GONESSE.flight} &nbsp;·&nbsp; {GONESSE.reg} &nbsp;·&nbsp; {GONESSE.place}
        </Reveal>
        <Reveal as="p" className="stat-value text-[clamp(7rem,24vw,22rem)] font-semibold text-ink" mode="chars" stagger={0.08}>
          {String(GONESSE.lives)}
        </Reveal>
        <Reveal as="p" className="serif mt-6 max-w-[34rem] text-[clamp(1.4rem,2.2vw,2rem)] leading-[1.2] text-ink/80" mode="lines" delay={0.3}>
          {`lives — ${GONESSE.breakdown}.`}
        </Reveal>
        <p className="mt-6">
          <SourceLink href={GONESSE.source}>BEA findings via Wikipedia</SourceLink>
        </p>
      </div>

      {/* (b) Chain of events */}
      <div className="mt-[22vh] max-w-[46rem]">
        <Reveal as="p" className="eyebrow mb-6" mode="chars" stagger={0.015}>
          The chain of events
        </Reveal>
        <ol className="border-t hairline">
          {CHAIN.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-x-5 border-b hairline py-8 sm:grid-cols-[4.5rem_1fr] sm:py-10">
              <Reveal as="span" className="mono pt-2 text-[0.75rem] tracking-[0.2em] text-ink/45" mode="chars" delay={i * 0.1}>
                {`0${i + 1}`}
              </Reveal>
              <div>
                <Reveal as="h3" className="display text-[clamp(1.4rem,2.6vw,2.3rem)] font-semibold" mode="lines" delay={i * 0.1}>
                  {step.title}
                </Reveal>
                <Reveal as="p" className="mt-3 max-w-[38rem] text-[1rem] leading-[1.5] text-ink/70" mode="lines" delay={i * 0.1 + 0.12}>
                  {step.detail}
                </Reveal>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* (c) Grounding and fixes */}
      <div className="mt-[22vh] grid max-w-[62rem] gap-10 md:grid-cols-[14rem_1fr]">
        <div className="mono text-[0.75rem] uppercase tracking-[0.2em] text-ink/55">
          <FadeIn stagger={0.1} y={16}>
            <p>Grounded</p>
            <p className="mt-1 text-ink">{GROUNDING.grounded}</p>
            <p className="mt-6">Back in service</p>
            <p className="mt-1 text-ink">{GROUNDING.returned}</p>
          </FadeIn>
        </div>
        <div>
          <Reveal as="h3" className="display text-[clamp(1.6rem,3.2vw,2.8rem)] font-semibold" mode="lines">
            Fifteen months on the ground, and two fixes.
          </Reveal>
          <FadeIn className="mt-8 space-y-6" stagger={0.12} y={20}>
            {GROUNDING.fixes.map((f) => (
              <div key={f.what} className="border-l hairline pl-5">
                <p className="text-[1.05rem] text-ink">{f.what}</p>
                <p className="mt-1 max-w-[34rem] text-[0.95rem] leading-[1.5] text-ink/65">{f.why}</p>
              </div>
            ))}
          </FadeIn>
          <p className="mt-6">
            <SourceLink href={GROUNDING.source}>Heritage Concorde — CAA and DGAC modifications, 2001</SourceLink>
          </p>
        </div>
      </div>

      {/* (d) 10 April 2003 */}
      <div className="mt-[22vh] max-w-[62rem]">
        <Reveal as="p" className="eyebrow mb-6" mode="chars" stagger={0.015}>
          {RETIREMENT.date}
        </Reveal>
        <Reveal as="h3" className="display max-w-[40rem] text-[clamp(1.9rem,4vw,3.4rem)] font-semibold" mode="lines">
          British Airways and Air France announced the end on the same day.
        </Reveal>
        <FadeIn className="mt-10 grid gap-8 border-t hairline pt-8 md:grid-cols-3" stagger={0.1} y={24}>
          {RETIREMENT.reasons.map((r, i) => (
            <div key={r.title}>
              <p className="mono text-[0.6875rem] tracking-[0.2em] text-ink/45">0{i + 1}</p>
              <p className="mt-3 text-[1.05rem] text-ink">{r.title}</p>
              <p className="mt-2 max-w-[20rem] text-[0.95rem] leading-[1.5] text-ink/65">{r.detail}</p>
            </div>
          ))}
        </FadeIn>
        <p className="mt-6">
          <SourceLink href={RETIREMENT.source}>Heritage Concorde — retirement, 2003</SourceLink>
        </p>
      </div>

      {/* (e) The last day */}
      <div className="mt-[22vh]">
        <LastLanding />
      </div>

      {/* (f) 26 November 2003 */}
      <div className="mt-[16vh] max-w-[62rem]">
        <Reveal as="p" className="eyebrow mb-6" mode="chars" stagger={0.015}>
          {LAST_FLIGHT.date} &nbsp;·&nbsp; {LAST_FLIGHT.reg} &nbsp;·&nbsp; {LAST_FLIGHT.route}
        </Reveal>
        <Reveal as="p" className="serif max-w-[36rem] text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.15] text-ink" mode="lines">
          One hour and thirty minutes from Heathrow to Filton, where it was built. Twenty thousand people watched. It was the last Concorde flight there will ever be.
        </Reveal>
        <p className="mt-6">
          <SourceLink href={LAST_FLIGHT.source}>Concorde operational history</SourceLink>
        </p>
      </div>
    </Chapter>
  );
}
