/**
 * Timeline of Concorde, 1954 → 2026. Every entry carries the URL it was checked against.
 * Kept local to the timeline section (content/* is owned elsewhere).
 */

export type TimelineEra =
  | "origins"
  | "test-flights"
  | "service"
  | "records"
  | "tragedy"
  | "retirement"
  | "successors";

export interface TimelineEntry {
  readonly year: number;
  /** Day + month, e.g. "2 Mar". Omitted when only the year is certain. */
  readonly date?: string;
  readonly title: string;
  readonly detail: string;
  readonly era: TimelineEra;
  readonly source: string;
  /** Landmark moment — rendered with a larger title. */
  readonly highlight?: boolean;
}

export const ERA_LABEL: Record<TimelineEra, string> = {
  origins: "Origins",
  "test-flights": "Test flights",
  service: "Into service",
  records: "Records",
  tragedy: "Gonesse",
  retirement: "Retirement",
  successors: "After Concorde",
};

const W = "https://en.wikipedia.org/wiki/Concorde";
const L = "https://en.wikipedia.org/wiki/List_of_Concorde_aircraft";
const OH = "https://en.wikipedia.org/wiki/Concorde_operational_history";
const HC = "https://www.heritageconcorde.com";
const AF4590 = "https://en.wikipedia.org/wiki/Air_France_Flight_4590";
const GWR = "https://www.guinnessworldrecords.com";
const TU144 = "https://en.wikipedia.org/wiki/Tupolev_Tu-144";
const XB1 = "https://en.wikipedia.org/wiki/Boom_XB-1";
const X59 = "https://en.wikipedia.org/wiki/Lockheed_Martin_X-59_Quesst";
const FAA = "https://www.faa.gov/newsroom";

export const TIMELINE: readonly TimelineEntry[] = [
  {
    year: 1954,
    title: "A study at Farnborough",
    detail: "The Royal Aircraft Establishment begins looking seriously at a supersonic transport aircraft.",
    era: "origins",
    source: W,
  },
  {
    year: 1956,
    date: "1 Oct",
    title: "STAC is formed",
    detail: "Britain sets up the Supersonic Transport Aircraft Committee to decide whether an airliner could fly faster than sound — and pay for itself.",
    era: "origins",
    source: W,
  },
  {
    year: 1959,
    title: "The STAC report",
    detail: "The committee recommends two designs, one of them a slender-delta Mach 2 transatlantic airliner. The shape of Concorde is on paper.",
    era: "origins",
    source: W,
  },
  {
    year: 1962,
    date: "29 Nov",
    title: "Two nations sign",
    detail: "Britain and France sign an international treaty — not a contract — to build the aircraft together, sharing cost and work equally. Neither can walk away.",
    era: "origins",
    source: W,
  },
  {
    year: 1965,
    title: "Metal is cut",
    detail: "Construction of the two prototypes begins, 001 in Toulouse and 002 at Filton near Bristol.",
    era: "origins",
    source: W,
  },
  {
    year: 1967,
    title: "Concorde, with an e",
    detail: "Tony Benn settles the spelling: the French form, with an “e” for excellence, England, Europe and entente cordiale.",
    era: "origins",
    source: W,
  },
  {
    year: 1968,
    date: "31 Dec",
    title: "The Tu-144 flies first",
    detail: "The Soviet Tupolev Tu-144 beats Concorde into the air by two months. It will never match its service record.",
    era: "test-flights",
    source: TU144,
  },
  {
    year: 1969,
    date: "2 Mar",
    title: "001 lifts off at Toulouse",
    detail: "Prototype F-WTSS flies for the first time from Toulouse with André Turcat at the controls.",
    era: "test-flights",
    source: L,
    highlight: true,
  },
  {
    year: 1969,
    date: "9 Apr",
    title: "002 flies from Filton",
    detail: "The British prototype G-BSST follows five weeks later, Brian Trubshaw in command.",
    era: "test-flights",
    source: L,
  },
  {
    year: 1969,
    date: "1 Oct",
    title: "Supersonic",
    detail: "Concorde 001 passes Mach 1 for the first time.",
    era: "test-flights",
    source: W,
  },
  {
    year: 1970,
    date: "Nov",
    title: "Mach 2",
    detail: "The prototype reaches twice the speed of sound — the cruise it was designed for.",
    era: "test-flights",
    source: W,
  },
  {
    year: 1971,
    date: "4 Sep",
    title: "Across the Atlantic",
    detail: "001 makes Concorde’s first transatlantic crossing.",
    era: "test-flights",
    source: W,
  },
  {
    year: 1971,
    date: "17 Dec",
    title: "Pre-production 101",
    detail: "G-AXDN, the first pre-production aircraft, flies from Filton. It will become the fastest Concorde of all.",
    era: "test-flights",
    source: L,
  },
  {
    year: 1973,
    date: "27 Apr",
    title: "America closes its skies",
    detail: "The United States bans civil supersonic flight over land (14 CFR 91.817). Concorde’s market shrinks to the oceans.",
    era: "test-flights",
    source: W,
  },
  {
    year: 1973,
    date: "3 Jun",
    title: "Tu-144 crashes at Paris",
    detail: "The Soviet rival breaks up in front of the crowd at the Paris Air Show. Concorde flies the same afternoon.",
    era: "test-flights",
    source: TU144,
  },
  {
    year: 1974,
    date: "26 Mar",
    title: "Mach 2.23",
    detail: "G-AXDN sets the highest speed any Concorde will ever record — about 2,370 km/h.",
    era: "test-flights",
    source: W,
  },
  {
    year: 1976,
    date: "21 Jan",
    title: "Into service, together",
    detail: "At 11:40 BA300 (G-BOAA, London–Bahrain) and AF025 (F-BVFA, Paris–Rio via Dakar) push back at the same moment. Supersonic travel is open for business.",
    era: "service",
    source: HC,
    highlight: true,
  },
  {
    year: 1976,
    date: "24 May",
    title: "Washington Dulles",
    detail: "British Airways and Air France land in the United States for the first time, side by side at Dulles.",
    era: "service",
    source: OH,
  },
  {
    year: 1977,
    date: "22 Nov",
    title: "New York at last",
    detail: "After the ban is lifted on 17 October, Concorde begins scheduled service to JFK — the route it was built for.",
    era: "service",
    source: OH,
  },
  {
    year: 1978,
    title: "The rival retires",
    detail: "Tu-144 passenger service ends after 55 flights. Braniff agrees to fly Concordes subsonically between Dallas and Washington from the following January.",
    era: "service",
    source: OH,
  },
  {
    year: 1985,
    date: "13 Jul",
    title: "Live Aid, twice",
    detail: "Phil Collins plays Wembley, boards Concorde and plays Philadelphia the same evening.",
    era: "service",
    source: W,
  },
  {
    year: 1985,
    date: "24 Dec",
    title: "Four in formation",
    detail: "Four British Airways Concordes fly in formation — a sight never repeated.",
    era: "service",
    source: OH,
  },
  {
    year: 1992,
    title: "Westbound around the world",
    detail: "An Air France Concorde circles the globe westbound from Lisbon, setting a circumnavigation record.",
    era: "records",
    source: W,
  },
  {
    year: 1995,
    date: "15–16 Aug",
    title: "Around the world in 31 h 27 m 49 s",
    detail: "An Air France Concorde sets the fastest circumnavigation of the world by a passenger aircraft.",
    era: "records",
    source: GWR,
  },
  {
    year: 1996,
    date: "7 Feb",
    title: "New York to London in 2 h 52 m 59 s",
    detail: "G-BOAD sets the fastest-ever Atlantic crossing by a passenger aircraft. The record still stands.",
    era: "records",
    source: GWR,
    highlight: true,
  },
  {
    year: 2000,
    date: "25 Jul",
    title: "Gonesse",
    detail: "Air France 4590, F-BTSC, runs over a titanium strip on take-off at Charles de Gaulle; a burst tyre ruptures a fuel tank. All 109 aboard and 4 on the ground die.",
    era: "tragedy",
    source: AF4590,
    highlight: true,
  },
  {
    year: 2001,
    date: "7 Nov",
    title: "Return to service",
    detail: "After fifteen months grounded, with Kevlar-lined tanks and Michelin NZG tyres certified on 5 September, Concorde flies passengers again.",
    era: "tragedy",
    source: HC,
  },
  {
    year: 2002,
    title: "The BEA final report",
    detail: "France’s accident bureau publishes its findings on Flight 4590: a 435 mm wear strip shed by a preceding DC-10 cut the tyre.",
    era: "tragedy",
    source: AF4590,
  },
  {
    year: 2003,
    date: "10 Apr",
    title: "Retirement announced",
    detail: "British Airways and Air France announce the end together: Airbus is withdrawing support, premium traffic has slumped since 9/11, maintenance costs keep climbing.",
    era: "retirement",
    source: HC,
  },
  {
    year: 2003,
    date: "31 May",
    title: "Air France bows out",
    detail: "AF001 from New York is Air France’s last commercial Concorde flight.",
    era: "retirement",
    source: OH,
  },
  {
    year: 2003,
    date: "24 Oct",
    title: "Three land at Heathrow",
    detail: "G-BOAE from Edinburgh, G-BOAF from a Bay of Biscay loop and G-BOAG from New York land in sequence. British Airways’ last commercial day.",
    era: "retirement",
    source: OH,
  },
  {
    year: 2003,
    date: "26 Nov",
    title: "The last flight",
    detail: "G-BOAF flies from Heathrow to Filton, where it was built, and shuts down for good. More than 20,000 people watch.",
    era: "retirement",
    source: OH,
    highlight: true,
  },
  {
    year: 2025,
    date: "28 Jan",
    title: "XB-1 goes supersonic",
    detail: "Boom’s XB-1 demonstrator breaks the sound barrier — the first civil jet to do so since Concorde.",
    era: "successors",
    source: XB1,
  },
  {
    year: 2025,
    date: "28 Oct",
    title: "X-59 flies",
    detail: "NASA’s quiet-supersonic X-59 makes its first flight, built to turn the boom into a thump.",
    era: "successors",
    source: X59,
  },
  {
    year: 2026,
    date: "5 Jun",
    title: "X-59 passes Mach 1",
    detail: "The X-59 flies supersonic for the first time.",
    era: "successors",
    source: X59,
  },
  {
    year: 2026,
    date: "2 Jul",
    title: "A door reopens",
    detail: "The FAA proposes lifting the 1973 ban on overland supersonic flight. Concorde never got to use it.",
    era: "successors",
    source: FAA,
  },
];
