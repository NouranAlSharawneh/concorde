import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { Counter } from "@/components/ui/Counter";
import { FadeIn } from "@/components/ui/FadeIn";
import { Reveal } from "@/components/ui/Reveal";
import { SurvivorGrid, type Survivor } from "@/components/sections/legacy/SurvivorGrid";
import { CapInTheGap } from "@/components/sections/legacy/CapInTheGap";

/* ── Sources ─────────────────────────────────────────────────────────── */
const SRC = {
  list: "https://en.wikipedia.org/wiki/List_of_Concorde_aircraft",
  liveAid: "https://en.wikipedia.org/wiki/Live_Aid",
  queen: "https://www.airportspotting.com/the-queens-flights-queen-elizabeth-ii-in-the-air/",
  callsign: "https://www.heritageconcorde.com/air-traffic-control-of-concorde",
} as const;

/* ── Fleet headline ──────────────────────────────────────────────────── */
const FLEET = {
  built: 20,
  survive: 18,
  onDisplay: 16,
  source: SRC.list,
} as const;

/* ── The eighteen survivors ──────────────────────────────────────────── */
const SURVIVORS: readonly Survivor[] = [
  { reg: "G-BOAF", number: "216", museum: "Aerospace Bristol", city: "Filton", country: "UK", region: "UK", hours: 18257, note: "The last Concorde to fly. 5,639 supersonic cycles.", onDisplay: true, source: SRC.list },
  { reg: "G-BOAD", number: "210", museum: "Intrepid Museum", city: "New York", country: "USA", region: "USA", hours: 23397, note: "Most hours of any Concorde. Arrived by barge up the Hudson.", onDisplay: true, source: SRC.list },
  { reg: "F-BVFA", number: "205", museum: "Udvar-Hazy Center", city: "Chantilly, VA", country: "USA", region: "USA", hours: 17824, note: "Flew Air France's first commercial service, 21 January 1976.", onDisplay: true, source: SRC.list },
  { reg: "F-BTSD", number: "213", museum: "Musée de l'Air et de l'Espace", city: "Le Bourget", country: "France", region: "France", hours: 12974, note: "Holds the westbound round-the-world record.", onDisplay: true, source: SRC.list },
  { reg: "F-WTSS", number: "001", museum: "Musée de l'Air et de l'Espace", city: "Le Bourget", country: "France", region: "France", note: "Prototype 001 — the first Concorde to fly, 2 March 1969.", onDisplay: true, source: SRC.list },
  { reg: "G-BOAC", number: "204", museum: "Manchester Airport", city: "Manchester", country: "UK", region: "UK", hours: 22260, note: "The British Airways flagship.", onDisplay: true, source: SRC.list },
  { reg: "G-BOAB", number: "208", museum: "Heathrow Airport", city: "London", country: "UK", region: "UK", hours: 22296, note: "Stored airside at Heathrow; not open to the public.", onDisplay: false, source: SRC.list },
  { reg: "G-BOAE", number: "212", museum: "Grantley Adams International Airport", city: "Christ Church", country: "Barbados", region: "Barbados", hours: 23376, note: "Flew the Edinburgh round trip on the final day, 24 October 2003.", onDisplay: true, source: SRC.list },
  { reg: "G-BOAA", number: "206", museum: "National Museum of Flight", city: "East Fortune", country: "UK", region: "UK", hours: 22768, note: "Flew British Airways' first commercial service, 21 January 1976.", onDisplay: true, source: SRC.list },
  { reg: "G-AXDN", number: "101", museum: "IWM Duxford", city: "Duxford", country: "UK", region: "UK", hours: 632, note: "The fastest Concorde ever: Mach 2.23, 26 March 1974.", onDisplay: true, source: SRC.list },
  { reg: "G-BBDG", number: "202", museum: "Brooklands Museum", city: "Weybridge", country: "UK", region: "UK", hours: 1282, note: "Pre-production airframe, restored at Brooklands.", onDisplay: true, source: SRC.list },
  { reg: "F-BVFB", number: "207", museum: "Technik Museum Sinsheim", city: "Sinsheim", country: "Germany", region: "Germany", hours: 14771, note: "Displayed beside a Tupolev Tu-144 — the only place you can see both.", onDisplay: true, source: SRC.list },
  { reg: "F-WTSB", number: "201", museum: "Aeroscopia", city: "Toulouse", country: "France", region: "France", hours: 909, note: "First production-standard airframe.", onDisplay: true, source: SRC.list },
  { reg: "F-BVFC", number: "209", museum: "Aeroscopia", city: "Toulouse", country: "France", region: "France", hours: 14332, note: "Flew Air France's last ever Concorde flight, 27 June 2003.", onDisplay: true, source: SRC.list },
  { reg: "G-BOAG", number: "214", museum: "Museum of Flight", city: "Seattle", country: "USA", region: "USA", hours: 16239, note: "Flew the last commercial service, JFK to Heathrow, 24 October 2003.", onDisplay: true, source: SRC.list },
  { reg: "G-BSST", number: "002", museum: "Fleet Air Arm Museum", city: "Yeovilton", country: "UK", region: "UK", note: "British prototype 002 — first flew from Filton, 9 April 1969.", onDisplay: true, source: SRC.list },
  { reg: "F-WTSA", number: "102", museum: "Musée Delta", city: "Orly", country: "France", region: "France", note: "Pre-production airframe 102.", onDisplay: true, source: SRC.list },
  { reg: "F-BVFF", number: "215", museum: "Charles de Gaulle Airport", city: "Paris", country: "France", region: "France", note: "Kept at Charles de Gaulle; not open to the public.", onDisplay: false, source: SRC.list },
];

/* ── Three legacy facts ──────────────────────────────────────────────── */
interface LegacyFact {
  kicker: string;
  title: string;
  detail: string;
  source: string;
}

const FACTS: readonly LegacyFact[] = [
  {
    kicker: "13 July 1985",
    title: "Two continents, one day",
    detail: "Phil Collins played Live Aid at Wembley, boarded Concorde, and played Philadelphia the same evening.",
    source: SRC.liveAid,
  },
  {
    kicker: "1977 – 2003",
    title: "The Queen's aircraft of choice",
    detail: "Queen Elizabeth II flew Concorde repeatedly across twenty-six years, beginning with the flight home from her Silver Jubilee tour.",
    source: SRC.queen,
  },
  {
    kicker: "BA001 – BA004",
    title: "Speedbird Concorde One",
    detail: "Air traffic control gave it a callsign of its own, so controllers would know at once what was climbing through their sector.",
    source: SRC.callsign,
  },
];

export function LegacySection() {
  return (
    <Chapter id="legacy" alt={[0.45, 0.55]} theme="light" className="container-x py-[20vh]" label="Where they are now">
      <ChapterHeader
        number="07"
        kicker="Where they are now"
        title={
          <>
            Twenty built.
            <br />
            Eighteen survive.
          </>
        }
        lede="Only one was lost in service and one was broken up for spares. The rest went to museums on both sides of the Atlantic — and one to the island it flew to most."
      />

      {/* Fleet headline counters */}
      <FadeIn className="mt-14 grid max-w-[62rem] grid-cols-3 gap-6 border-y hairline py-8" stagger={0.1} y={20}>
        {[
          { label: "Built", value: FLEET.built },
          { label: "Survive", value: FLEET.survive },
          { label: "On display", value: FLEET.onDisplay },
        ].map((s, i) => (
          <div key={s.label}>
            <p className={`stat-value text-[clamp(2.6rem,6vw,5.5rem)] font-semibold ${i === 1 ? "text-accent" : "text-ink"}`}>
              <Counter to={s.value} duration={1.6} group={false} />
            </p>
            <p className="eyebrow mt-3">{s.label}</p>
          </div>
        ))}
      </FadeIn>

      {/* Survivor grid */}
      <div className="mt-[12vh]">
        <Reveal as="p" className="eyebrow mb-6" mode="chars" stagger={0.015}>
          The survivors &nbsp;·&nbsp; registration, airframe number, flying hours
        </Reveal>
        <SurvivorGrid survivors={SURVIVORS} />
        <p className="mono mt-4 text-[0.6875rem] tracking-[0.08em] text-ink/40">
          Hours and locations:{" "}
          <a href={FLEET.source} className="underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
            List of Concorde aircraft
          </a>
        </p>
      </div>

      {/* Easter egg */}
      <FadeIn className="mt-[16vh] rounded-2xl border hairline bg-[color-mix(in_oklab,var(--paper)_55%,transparent)] p-6 md:p-10" y={30}>
        <CapInTheGap />
      </FadeIn>

      {/* Legacy facts */}
      <div className="mt-[16vh]">
        <Reveal as="h3" className="display max-w-[40rem] text-[clamp(1.9rem,4vw,3.4rem)] font-semibold" mode="lines">
          It left more than airframes behind.
        </Reveal>
        <FadeIn className="mt-10 grid gap-4 md:grid-cols-3" stagger={0.12} y={28}>
          {FACTS.map((f) => (
            <article key={f.title} className="group rounded-xl border hairline bg-[var(--glass)] p-6 transition-[translate,border-color] duration-500 ease-[var(--ease-climb)] hover:-translate-y-1 hover:border-[var(--ink-60)]">
              <p className="eyebrow">{f.kicker}</p>
              <h4 className="display mt-4 text-[clamp(1.3rem,1.8vw,1.7rem)] font-semibold">{f.title}</h4>
              <p className="mt-3 text-[0.95rem] leading-[1.5] text-ink/70">{f.detail}</p>
              <a href={f.source} className="mono mt-5 inline-block text-[0.6875rem] tracking-[0.08em] text-ink/40 underline decoration-[var(--ink-24)] underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer" data-cursor="hover">
                Source
              </a>
            </article>
          ))}
        </FadeIn>
      </div>
    </Chapter>
  );
}
