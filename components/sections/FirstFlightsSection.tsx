import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { HorizontalStrip, type Milestone } from "@/components/sections/first-flights/HorizontalStrip";

const SRC = {
  list: "https://en.wikipedia.org/wiki/List_of_Concorde_aircraft",
  wiki: "https://en.wikipedia.org/wiki/Concorde",
  heritage: "https://www.heritageconcorde.com/concorde-first-scheduled-services",
  ops: "https://en.wikipedia.org/wiki/Concorde_operational_history",
} as const;

const MILESTONES: readonly Milestone[] = [
  {
    iso: "1969-03-02",
    date: "2 MAR 1969",
    tick: "MAR 69",
    place: "Toulouse",
    tag: "F-WTSS · 001",
    tag2: "André Turcat",
    detail:
      "Prototype 001 lifts off from Toulouse-Blagnac with André Turcat in command — the first Concorde to fly, just over six years after the treaty that created it.",
    source: SRC.list,
  },
  {
    iso: "1969-04-09",
    date: "9 APR 1969",
    tick: "APR 69",
    place: "Filton",
    tag: "G-BSST · 002",
    tag2: "Brian Trubshaw",
    detail:
      "Thirty-eight days later the British prototype follows, flown by Brian Trubshaw from Filton to RAF Fairford, where the UK flight-test programme would be based.",
    source: SRC.list,
  },
  {
    iso: "1969-10-01",
    date: "1 OCT 1969",
    tick: "OCT 69",
    place: "Supersonic",
    tag: "F-WTSS · 001",
    tag2: "Mach 1",
    detail:
      "Seven months after its maiden flight, 001 pushes through the sound barrier for the first time. Mach 2 would follow in November 1970.",
    source: SRC.wiki,
  },
  {
    iso: "1976-01-21",
    date: "21 JAN 1976",
    tick: "JAN 76",
    place: "London & Paris",
    tag: "G-BOAA · F-BVFA",
    tag2: "11:40",
    detail:
      "Scheduled service begins with a choreographed tie: BA300 to Bahrain and AF025 to Rio de Janeiro via Dakar push back at the same minute, 11:40, in London and Paris.",
    source: SRC.heritage,
    boards: [
      { carrier: "British Airways · Heathrow", value: "LHR→BAH BA300 1140" },
      { carrier: "Air France · Charles de Gaulle", value: "CDG→GIG AF025 1140" },
    ],
  },
  {
    iso: "1977-11-22",
    date: "22 NOV 1977",
    tick: "NOV 77",
    place: "New York",
    tag: "JFK",
    tag2: "Ban lifted 17 Oct 1977",
    detail:
      "After a long fight over noise, the Port Authority's ban on Concorde falls on 17 October 1977. Five weeks later the route it was built for — London and Paris to New York — opens.",
    source: SRC.ops,
  },
];

export function FirstFlightsSection() {
  return (
    <Chapter id="first-flights" alt={[0.3, 0.45]} theme="light" label="First flights" className="py-[20vh]">
      <div className="container-x">
        <ChapterHeader
          number="03"
          kicker="First flights"
          title={
            <>
              Two nations,
              <br />
              two first flights
            </>
          }
          lede="Thirty-eight days apart, the French and British prototypes took to the air. Seven years of testing later, two airliners pushed back at the same minute in London and Paris."
        />
      </div>
      <div className="mt-[12vh]">
        <HorizontalStrip milestones={MILESTONES} />
      </div>
    </Chapter>
  );
}
