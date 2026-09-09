import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { Counter } from "@/components/ui/Counter";
import { FadeIn } from "@/components/ui/FadeIn";
import { Reveal } from "@/components/ui/Reveal";
import { SpeedRace, type Racer } from "@/components/sections/mach2/SpeedRace";
import { SonicBoom } from "@/components/sections/mach2/SonicBoom";

const SRC = {
  wiki: "https://en.wikipedia.org/wiki/Concorde",
  sound: "https://en.wikipedia.org/wiki/Speed_of_sound",
  b747: "https://en.wikipedia.org/wiki/Boeing_747",
  shinkansen: "https://en.wikipedia.org/wiki/Shinkansen",
  arrive: "https://en.wikipedia.org/wiki/Concorde",
  ba: "https://www.britishairways.com/en-gb/information/about-ba/history-and-heritage/celebrating-concorde",
  heritage: "https://www.heritageconcorde.com",
} as const;

const RACERS: readonly Racer[] = [
  { name: "Concorde", detail: "Mach 2.04 cruise", kmh: 2179, accent: true, source: SRC.wiki },
  { name: "Speed of sound", detail: "Mach 1 · sea level", kmh: 1235, source: SRC.sound },
  { name: "Boeing 747", detail: "Mach 0.85 cruise", kmh: 900, source: SRC.b747 },
  { name: "Shinkansen", detail: "Line speed limit", kmh: 320, source: SRC.shinkansen },
];

interface ClockFace {
  eyebrow: string;
  city: string;
  hour: number;
  minute: number;
  zone: string;
  source: string;
}

const CLOCKS: readonly [ClockFace, ClockFace] = [
  { eyebrow: "Depart", city: "London Heathrow", hour: 10, minute: 30, zone: "GMT", source: SRC.arrive },
  { eyebrow: "Arrive", city: "New York JFK", hour: 9, minute: 20, zone: "EST · same day", source: SRC.arrive },
];

interface Stat {
  label: string;
  /** Animated value — omit to render `display` statically. */
  value?: number;
  suffix?: string;
  display?: string;
  note: string;
  source: string;
}

const STATS: readonly Stat[] = [
  { label: "Passengers", value: 2_500_000, suffix: "+", note: "British Airways, 1976–2003", source: SRC.ba },
  { label: "Flights", value: 50_000, note: "British Airways fleet total", source: SRC.ba },
  { label: "Bottles of champagne", value: 1_000_000, suffix: "+", note: "Poured in the cabin", source: SRC.heritage },
  { label: "Flights by Fred Finn", value: 718, note: "Always seat 9A", source: SRC.heritage },
  { label: "Fastest crossing", display: "2:52:59", note: "New York → London, 7 Feb 1996, G-BOAD", source: SRC.wiki },
  { label: "Nose temperature", value: 127, suffix: " °C", note: "Kinetic heating at Mach 2", source: SRC.wiki },
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Analogue clock; hands are plain CSS rotations on SVG lines. */
function Clock({ hour, minute }: { hour: number; minute: number }) {
  const hourDeg = ((hour % 12) + minute / 60) * 30;
  const minuteDeg = minute * 6;
  const hand = (deg: number) => ({ transform: `rotate(${deg}deg)`, transformOrigin: "50px 50px", transformBox: "view-box" as const });
  return (
    <svg viewBox="0 0 100 100" className="h-36 w-36 md:h-44 md:w-44" role="img" aria-label={`${pad(hour)}:${pad(minute)}`}>
      <circle cx="50" cy="50" r="47" fill="none" stroke="var(--ink-24)" strokeWidth="0.75" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="5"
          x2="50"
          y2={i % 3 === 0 ? 10 : 7.5}
          stroke="var(--ink)"
          strokeWidth={i % 3 === 0 ? 1.25 : 0.6}
          style={hand(i * 30)}
        />
      ))}
      <line x1="50" y1="50" x2="50" y2="26" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" style={hand(hourDeg)} />
      <line x1="50" y1="50" x2="50" y2="14" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" style={hand(minuteDeg)} />
      <circle cx="50" cy="50" r="2" fill="var(--ink)" />
    </svg>
  );
}

function SourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--ink)]/45 transition-colors hover:text-[var(--ink)]"
      data-cursor="hover"
    >
      Source ↗
    </a>
  );
}

export function Mach2Section() {
  return (
    <Chapter id="mach2" alt={[0.5, 0.95]} theme="dark" label="Faster than the sun" className="py-[20vh]">
      {/* a. Headline + lede */}
      <div className="container-x">
        <ChapterHeader
          number="04"
          kicker="Faster than the sun"
          title={
            <>
              Twice as high,
              <br />
              twice the speed of sound
            </>
          }
          lede="Concorde cruised at Mach 2.04 — 2,179 km/h — at 60,000 feet, twice the altitude of other airliners. Westbound, it outran the sun: leave London after breakfast, land in New York before it."
        />
        <FadeIn className="mt-[12vh] grid gap-10 md:grid-cols-[14rem_1fr] md:gap-16" stagger={0.1}>
          <p className="eyebrow md:pt-2">The view from 60,000 ft</p>
          <div className="max-w-[38rem] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-[1.45] text-[var(--ink)]/80">
            <p>
              Twenty-three miles a minute. Up here, above 96% of the atmosphere, the sky through the small windows turned
              violet and the horizon bent visibly into the curvature of the Earth.
            </p>
          </div>
        </FadeIn>
      </div>

      {/* b. Speed race */}
      <div className="container-x mt-[24vh]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div>
            <Reveal as="p" className="eyebrow" mode="chars" stagger={0.02}>
              Speed race
            </Reveal>
            <Reveal as="h3" className="display mt-5 text-[clamp(2rem,4vw,3.75rem)] font-semibold" mode="lines">
              Nothing carrying passengers has come close since.
            </Reveal>
          </div>
          {/* pr clears the fixed altitude rail, which otherwise overlaps the km/h column. */}
          <SpeedRace racers={RACERS} className="lg:pr-14 lg:pt-3" />
        </div>
      </div>

      {/* c. Arrive before you leave */}
      <div className="container-x mt-[24vh]">
        <div className="max-w-[62rem]">
          <Reveal as="p" className="eyebrow" mode="chars" stagger={0.02}>
            Arrive before you leave
          </Reveal>
          <Reveal as="h3" className="display mt-5 text-[clamp(2rem,4.6vw,4.5rem)] font-semibold" mode="lines">
            Land seventy minutes
            <br />
            before you took off.
          </Reveal>
        </div>
        <FadeIn className="mt-14 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]" stagger={0.12}>
          {/* grid: card, arrow, card — explicit order so stagger reads left→right */}
          <ClockCard face={CLOCKS[0]} />
          <div className="hidden items-center justify-center md:flex" aria-hidden>
            <svg viewBox="0 0 64 16" width="64" height="16" className="fill-none stroke-[var(--accent)]" strokeWidth="1.5">
              <path d="M0 8h60M52 1.5 60 8l-8 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <ClockCard face={CLOCKS[1]} />
        </FadeIn>
        <FadeIn className="mt-14 max-w-[44rem]">
          <p className="text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.55] text-[var(--ink)]/85">
            Block time London → New York was about 3 h 30 min; New York&rsquo;s clocks run five hours behind London&rsquo;s. Depart
            10:30 GMT, arrive 09:20 local — a net gain of 1 h 10 min on the watch. The subsonic 747 took roughly eight hours.
          </p>
          <div className="mt-3 flex gap-6">
            <SourceLink href={SRC.arrive} />
            <SourceLink href={SRC.wiki} />
          </div>
        </FadeIn>
      </div>

      {/* d. Sonic boom */}
      <div className="mt-[20vh]">
        <SonicBoom
          eyebrow="Reheat on · over the Atlantic"
          caption="Concorde went supersonic only over water. Westbound out of Heathrow the reheats were lit past waypoint UPGAS, and the boom rolled back over the Cornish coast."
        />
      </div>

      {/* e. Big counters */}
      <div className="container-x mt-[16vh]">
        <Reveal as="p" className="eyebrow" mode="chars" stagger={0.02}>
          Twenty-seven years in numbers
        </Reveal>
        <FadeIn className="mt-12 grid gap-x-10 gap-y-16 sm:grid-cols-2 xl:grid-cols-3" stagger={0.08}>
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-4 border-t border-[var(--ink-12)] pt-6">
              <p className="stat-value min-w-0 text-[clamp(2.4rem,4.6vw,5.25rem)] font-semibold [overflow-wrap:anywhere]">
                {s.value !== undefined ? <Counter to={s.value} suffix={s.suffix} /> : <span className="mono tracking-[-0.02em]">{s.display}</span>}
              </p>
              <div>
                <p className="eyebrow">{s.label}</p>
                <p className="mt-2 text-[0.85rem] text-[var(--ink)]/60">{s.note}</p>
              </div>
              <SourceLink href={s.source} />
            </div>
          ))}
        </FadeIn>
      </div>
    </Chapter>
  );
}

function ClockCard({ face }: { face: ClockFace }) {
  return (
    <div
      className="glass flex flex-col items-center gap-6 rounded-[1.25rem] px-8 py-10 text-center transition-transform duration-500 ease-[var(--ease-climb)] hover:-translate-y-1"
      data-cursor="hover"
    >
      <p className="eyebrow">
        {face.eyebrow} · {face.city}
      </p>
      <Clock hour={face.hour} minute={face.minute} />
      <div>
        <p className="stat-value text-[clamp(2.5rem,5vw,4.5rem)] font-semibold">
          {pad(face.hour)}:{pad(face.minute)}
        </p>
        <p className="mono mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--ink)]/60">{face.zone}</p>
      </div>
    </div>
  );
}
