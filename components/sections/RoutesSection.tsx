import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { RouteGlobeClient } from "./routes/RouteGlobeClient";
import { ROUTE_SRC } from "./routes/routes-data";

interface RouteCard {
  date: string;
  title: string;
  detail: string;
  source: string;
}

const CARDS: readonly RouteCard[] = [
  {
    date: "21 Jan 1976",
    title: "London–Bahrain · Paris–Dakar–Rio",
    detail: "The first two scheduled services pushed back at the same minute, 11:40, one from each capital.",
    source: ROUTE_SRC.firstServices,
  },
  {
    date: "24 May 1976",
    title: "Washington Dulles",
    detail: "The first North American destination. British Airways and Air France touched down within a minute of each other.",
    source: ROUTE_SRC.firstServices,
  },
  {
    date: "22 Nov 1977",
    title: "New York JFK",
    detail: "The route that defined it: about three and a half hours, up to twice a day, for twenty-six years.",
    source: ROUTE_SRC.history,
  },
  {
    date: "15–16 Aug 1995",
    title: "Round the world",
    detail: "Air France, eastbound from New York via Toulouse, Dubai, Bangkok, Guam, Honolulu and Acapulco: 31 h 27 m 49 s.",
    source: ROUTE_SRC.guinness,
  },
];

/** Where it flew: a dotted globe with the network drawn on it and a miniature aircraft riding LHR→JFK. */
export function RoutesSection() {
  return (
    <Chapter id="routes" alt={[0.95, 0.98]} theme="dark" label="Where it flew" className="relative min-h-[260vh]">
      <RouteGlobeClient>
        <p className="mono pointer-events-none absolute bottom-[calc(var(--gutter)*0.8)] right-[var(--gutter)] hidden text-[0.65rem] tracking-[0.2em] text-[var(--ink)]/60 lg:block">
          <span className="text-[var(--accent)]">●</span> Scheduled route &nbsp;&nbsp; <span>○</span> Record flight
        </p>
      </RouteGlobeClient>

      {/* Copy scrolls over the held globe */}
      <div className="container-x relative z-10 -mt-[100svh] flex min-h-[260vh] flex-col justify-between py-[18vh]">
        <div className="glass max-w-[30rem] rounded-[1.5rem] p-8 md:p-10">
          <ChapterHeader
            number="06"
            kicker="The network"
            title={
              <>
                Where
                <br />
                it flew
              </>
            }
            lede="Two cities in Europe, a handful in the Americas and the Gulf — and, twice, all the way round."
          />
        </div>

        <ol className="flex max-w-[30rem] flex-col gap-4">
          {CARDS.map((c, i) => (
            <FadeIn key={c.title} delay={i * 0.05}>
              <li className="glass rounded-[1.25rem] p-6 transition-transform duration-500 ease-[var(--ease-climb)] hover:-translate-y-1" data-cursor="hover">
                <p className="eyebrow mb-2">{c.date}</p>
                <p className="display text-[clamp(1.2rem,1.8vw,1.6rem)] font-semibold text-[var(--ink)]">{c.title}</p>
                <p className="mt-2 text-[0.95rem] leading-[1.5] text-[var(--ink)]/80">{c.detail}</p>
                <a href={c.source} target="_blank" rel="noreferrer" className="mono mt-3 inline-block text-[0.6rem] tracking-[0.18em] text-[var(--ink)]/50 underline-offset-4 hover:underline">
                  SOURCE ↗
                </a>
              </li>
            </FadeIn>
          ))}
        </ol>
      </div>
    </Chapter>
  );
}
