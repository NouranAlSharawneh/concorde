import { SRC } from "./sources";

/* ──────────────────────────────────────────────────────────────
   Shared shapes
   ────────────────────────────────────────────────────────────── */

export interface Sourced {
  source: string;
}

export interface Fact extends Sourced {
  label: string;
  value: string;
  detail?: string;
}

export interface ArchiveCard extends Sourced {
  /** Mono date label, e.g. "29 NOV 1962". */
  date: string;
  title: string;
  line: string;
}

/* ──────────────────────────────────────────────────────────────
   01 · Take-off — The dream
   ────────────────────────────────────────────────────────────── */

export const DREAM = {
  number: "01",
  kicker: "Take-off",
  title: ["A dream signed", "in two languages"],
  lede: "In 1956 a British committee asked whether an airliner could cruise at twice the speed of sound. Six years later two governments signed a treaty to build one. It was meant to cost £70 million. It cost more than £1.5 billion.",
  body: [
    "The Supersonic Transport Aircraft Committee first met on 1 October 1956. By 1959 it had settled on a slender delta for Mach 2. Neither Britain nor France could afford to build it alone.",
    "On 29 November 1962 the two governments signed an international treaty rather than a commercial contract. It had no exit clause. The British Aircraft Corporation and Sud Aviation shared the airframe; Rolls-Royce and Snecma shared the engine.",
    "Twenty airframes were built, six for development and fourteen for passengers. The name was settled in December 1967, when Tony Benn kept the French spelling: e for excellence, England, Europe and entente.",
  ],
  cost: {
    estimate: { label: "Estimate, 1962", value: "£70 M", source: SRC.wiki },
    final: { label: "Final bill, 1976 money", value: "£1.5 bn+", source: SRC.wiki },
    multiple: { label: "Overrun", value: "×20", source: SRC.wiki },
  },
  cards: [
    {
      date: "01 OCT 1956",
      title: "STAC convenes",
      line: "The Supersonic Transport Aircraft Committee begins work at Farnborough.",
      source: SRC.wiki,
    },
    {
      date: "29 NOV 1962",
      title: "The treaty",
      line: "Britain and France sign a treaty, not a contract. There is no way out.",
      source: SRC.wiki,
    },
    {
      date: "11 DEC 1967",
      title: "Concorde, with an e",
      line: "Prototype 001 rolls out at Toulouse. Tony Benn confirms the spelling.",
      source: SRC.wiki,
    },
  ] satisfies readonly ArchiveCard[],
  partners: [
    { label: "Airframe", value: "BAC · Sud Aviation", source: SRC.wiki },
    { label: "Engine", value: "Rolls-Royce · Snecma", source: SRC.olympus },
    { label: "Airframes built", value: "20", detail: "6 development, 14 production", source: SRC.list },
  ] satisfies readonly Fact[],
} as const;

/* ──────────────────────────────────────────────────────────────
   02 · Anatomy
   ────────────────────────────────────────────────────────────── */

export interface Hotspot extends Sourced {
  id: string;
  title: string;
  /** Short headline figure shown large. */
  value: string;
  detail: string;
}

export interface SpecRow extends Sourced {
  label: string;
  value: string;
}

export const ANATOMY = {
  number: "02",
  kicker: "Engineering",
  title: ["Anatomy of a", "supersonic airliner"],
  lede: "Nothing on Concorde was borrowed. The wing, the engines, the nose, even the way it carried fuel were answers to a single question: how do you keep a hundred people comfortable at Mach 2 for three hours.",
  hotspots: [
    {
      id: "delta-wing",
      title: "Ogival delta wing",
      value: "No flaps. No slats.",
      detail:
        "The slender ogee delta makes lift two ways: conventionally at speed, and from vortices that roll over the leading edge at high angles of attack. That is how it landed nose-high with no high-lift devices at all.",
      source: SRC.wiki,
    },
    {
      id: "olympus-593",
      title: "Olympus 593",
      value: "4 × 38,000 lbf",
      detail:
        "Four Rolls-Royce/Snecma turbojets — the only turbojets with reheat ever to power a commercial aircraft. Reheat lit for take-off and again to push through Mach 1, then shut down for the cruise.",
      source: SRC.olympus,
    },
    {
      id: "intakes",
      title: "Variable intakes",
      value: "63% of thrust",
      detail:
        "Moving ramps slowed the air from Mach 2 to about half the speed of sound before it reached the compressor. At cruise the intakes produced 63 per cent of the thrust, the nozzles 29, the engines themselves 8. The first full-authority digital control on a passenger aircraft ran them.",
      source: SRC.olympus,
    },
    {
      id: "droop-nose",
      title: "Droop nose",
      value: "5° · 12.5°",
      detail:
        "A long pointed nose hides the runway on approach, so it hinged down: 5° for taxi and take-off, 12.5° for landing. A glazed visor rose to streamline it again at Mach 2.",
      source: SRC.wiki,
    },
    {
      id: "fuel-trim",
      title: "Fuel as ballast",
      value: "20 t pumped aft",
      detail:
        "Lift moves rearward as an aircraft goes supersonic. Rather than fight it with drag, Concorde pumped around 20 tonnes of fuel aft through the transonic range, shifting its centre of gravity about 1.8 m.",
      source: SRC.heritageFuel,
    },
    {
      id: "rr58-skin",
      title: "RR58 skin",
      value: "127 °C · +300 mm",
      detail:
        "Friction heated the nose to 127 °C, the limit for the Hiduminium alloy. The airframe stretched by up to 300 mm in cruise. On the flight deck, a gap opened beside the engineer's console and closed again on descent.",
      source: SRC.wiki,
    },
    {
      id: "fly-by-wire",
      title: "Fly-by-wire",
      value: "First on an airliner",
      detail:
        "Pilot inputs were carried to the powered controls as electrical signals, with mechanical back-up. No passenger aircraft had flown that way before.",
      source: SRC.wiki,
    },
  ] satisfies readonly Hotspot[],
  specs: [
    { label: "Length", value: "61.66 m", source: SRC.wiki },
    { label: "Wingspan", value: "25.6 m", source: SRC.wiki },
    { label: "Height", value: "12.2 m", source: SRC.wiki },
    { label: "Max take-off weight", value: "185,070 kg", source: SRC.wiki },
    { label: "Fuel capacity", value: "119,600 L", source: SRC.wiki },
    { label: "Range", value: "7,222 km", source: SRC.wiki },
    { label: "Cruise", value: "Mach 2.04", source: SRC.wiki },
    { label: "Ceiling", value: "60,000 ft", source: SRC.wiki },
    { label: "Engines", value: "4 × Olympus 593 · 38,000 lbf", source: SRC.olympus },
  ] satisfies readonly SpecRow[],
} as const;

/* ──────────────────────────────────────────────────────────────
   03 · First flights
   ────────────────────────────────────────────────────────────── */

export interface Milestone extends Sourced {
  id: string;
  date: string;
  year: number;
  place: string;
  pilot?: string;
  aircraft?: string;
  title: string;
  detail: string;
}

export const FIRST_FLIGHTS = {
  number: "03",
  kicker: "First flights",
  title: ["Seven years from", "first flight to first fare"],
  lede: "Two prototypes, two countries, one runway each. Then the long wait for New York.",
  milestones: [
    {
      id: "001",
      date: "2 Mar 1969",
      year: 1969,
      place: "Toulouse-Blagnac",
      pilot: "André Turcat",
      aircraft: "001 · F-WTSS",
      title: "The big bird flies",
      detail: "Gear down, nose drooped, 001 lifts off for the first time.",
      source: SRC.list,
    },
    {
      id: "002",
      date: "9 Apr 1969",
      year: 1969,
      place: "Filton",
      pilot: "Brian Trubshaw",
      aircraft: "002 · G-BSST",
      title: "Britain answers",
      detail: "Five weeks later the British prototype flies from Filton to RAF Fairford.",
      source: SRC.list,
    },
    {
      id: "supersonic",
      date: "1 Oct 1969",
      year: 1969,
      place: "Toulouse",
      aircraft: "001 · F-WTSS",
      title: "Mach 1",
      detail: "001 goes supersonic for the first time. Mach 2 follows in 1970.",
      source: SRC.wiki,
    },
    {
      id: "service",
      date: "21 Jan 1976",
      year: 1976,
      place: "London · Paris",
      aircraft: "G-BOAA · F-BVFA",
      title: "11:40, both cities",
      detail: "BA300 for Bahrain and AF025 for Rio via Dakar push back at the same minute.",
      source: SRC.heritage,
    },
    {
      id: "jfk",
      date: "22 Nov 1977",
      year: 1977,
      place: "New York JFK",
      title: "New York, finally",
      detail: "The ban ends on 17 October when the Supreme Court declines to act. Scheduled service begins five weeks later.",
      source: SRC.ops,
    },
  ] satisfies readonly Milestone[],
} as const;

/* ──────────────────────────────────────────────────────────────
   04 · Mach 2
   ────────────────────────────────────────────────────────────── */

export interface SpeedRow extends Sourced {
  id: string;
  label: string;
  kmh: number;
  note?: string;
}

export const MACH2 = {
  number: "04",
  kicker: "Mach 2",
  title: ["Faster than", "the sun"],
  lede: "Westbound, Concorde outran the rotation of the Earth. Leave London at 10:30, land in New York at 09:20. Outside the window, minus 50 degrees and a violet sky.",
  speeds: [
    { id: "concorde", label: "Concorde", kmh: 2179, note: "Mach 2.04 cruise", source: SRC.wiki },
    { id: "sound", label: "Speed of sound", kmh: 1235, note: "Sea level, 20 °C", source: SRC.speedOfSound },
    { id: "747", label: "Boeing 747", kmh: 900, note: "Mach 0.85 cruise", source: SRC.b747 },
    { id: "shinkansen", label: "Shinkansen E5", kmh: 320, note: "Line speed", source: SRC.shinkansen },
  ] satisfies readonly SpeedRow[],
  clocks: {
    depart: { label: "Depart London", value: "10:30", source: SRC.wiki },
    arrive: { label: "Arrive New York", value: "09:20", source: SRC.wiki },
    concorde: { label: "JFK – LHR, Concorde", value: "≈ 3 h 30", source: SRC.wiki },
    subsonic: { label: "JFK – LHR, subsonic", value: "≈ 8 h", source: SRC.wiki },
  },
  facts: [
    { label: "A mile every", value: "2.75 s", detail: "Twenty-three miles a minute.", source: SRC.wiki },
    { label: "Fuel burn at Mach 2", value: "≈ 18,000 L/h", source: SRC.wiki },
    { label: "Passenger-miles per gallon", value: "15.8", detail: "Against 46.4 for a 747.", source: SRC.wiki },
    { label: "Return fare, early 1990s", value: "≈ $12,000", source: SRC.heritage },
    { label: "Cabin", value: "100 seats, 2 – 2", detail: "Three flight crew, six cabin crew.", source: SRC.wiki },
    { label: "Window glass", value: "Warm to the touch", detail: "Outside air, −50 °C.", source: SRC.heritage },
  ] satisfies readonly Fact[],
  counters: [
    { id: "passengers", value: 2.5, decimals: 1, suffix: " M+", group: false, label: "British Airways passengers", source: SRC.ba },
    { id: "flights", value: 50000, decimals: 0, prefix: "≈ ", label: "British Airways flights", source: SRC.ba },
    { id: "champagne", value: 1000000, decimals: 0, suffix: "+", label: "Bottles of champagne", source: SRC.heritage },
    { id: "fred-finn", value: 718, decimals: 0, label: "Flights by Fred Finn, always seat 9A", source: SRC.heritage },
  ],
} as const;

/* ──────────────────────────────────────────────────────────────
   05 · Only one
   ────────────────────────────────────────────────────────────── */

export interface ComparisonPair extends Sourced {
  label: string;
  concorde: string;
  tu144: string;
}

export interface Successor extends Sourced {
  id: string;
  name: string;
  date: string;
  detail: string;
}

export const ONLY_ONE = {
  number: "05",
  kicker: "The only one",
  title: ["Fifty years on,", "still unrivalled"],
  lede: "One rival flew first and failed. One rule kept the boom off land. No successor ever carried a paying passenger.",
  comparison: [
    { label: "First flight", concorde: "2 Mar 1969", tu144: "31 Dec 1968", source: SRC.tu144 },
    { label: "Passenger flights", concorde: "≈ 50,000 (BA alone)", tu144: "55", source: SRC.ba },
    { label: "Passenger service", concorde: "27 years", tu144: "7 months", source: SRC.tu144 },
    { label: "Recorded failures", concorde: "—", tu144: "226 in 102 flights", source: SRC.tu144 },
    { label: "Hull losses", concorde: "1", tu144: "2", source: SRC.tu144 },
  ] satisfies readonly ComparisonPair[],
  ban: {
    date: "27 Apr 1973",
    rule: "14 CFR 91.817",
    detail: "The United States banned civil supersonic flight over land. Concorde could only fly flat out over water. The rule is still in force.",
    source: SRC.cfr91817,
  },
  successors: [
    {
      id: "xb-1",
      name: "Boom XB-1",
      date: "28 Jan 2025",
      detail: "The first privately developed civil jet to go supersonic. Boom's Overture airliner is not expected to fly before 2027.",
      source: SRC.xb1,
    },
    {
      id: "x-59",
      name: "NASA X-59",
      date: "28 Oct 2025 · 5 Jun 2026",
      detail: "First flight, then first supersonic flight. Shaped so the boom reaches the ground as a thump.",
      source: SRC.x59,
    },
    {
      id: "faa",
      name: "FAA proposal",
      date: "2 Jul 2026",
      detail: "The FAA proposes lifting the 1973 overland ban. Fifty-three years after it grounded the idea.",
      source: SRC.faaSupersonic,
    },
  ] satisfies readonly Successor[],
} as const;

/* ──────────────────────────────────────────────────────────────
   06 · Descent
   ────────────────────────────────────────────────────────────── */

export interface ChainLink extends Sourced {
  id: string;
  title: string;
  detail: string;
}

export interface SequenceStep extends Sourced {
  date: string;
  title: string;
  detail: string;
}

export interface LandingShip extends Sourced {
  reg: string;
  flight?: string;
  from: string;
  detail: string;
}

export const DESCENT = {
  number: "06",
  kicker: "Descent",
  title: ["Why it", "came down"],
  lede: "One strip of metal on a runway. Then a world that no longer paid for speed.",
  gonesse: {
    date: "25 Jul 2000",
    flight: "Air France 4590",
    aircraft: "F-BTSC",
    dead: 113,
    breakdown: "100 passengers, 9 crew, 4 on the ground",
    source: SRC.af4590,
  },
  chain: [
    {
      id: "strip",
      title: "The strip",
      detail: "A 435 mm titanium wear strip falls from a Continental DC-10 that departed just before it.",
      source: SRC.af4590,
    },
    {
      id: "tyre",
      title: "The tyre",
      detail: "At take-off speed a left main tyre runs over it and bursts.",
      source: SRC.af4590,
    },
    {
      id: "tank",
      title: "The tank",
      detail: "A 4.5 kg piece of rubber strikes tank 5 at around 140 m/s. The shock ruptures it from inside.",
      source: SRC.af4590,
    },
    {
      id: "fire",
      title: "The fire",
      detail: "Leaking fuel ignites. Two engines lose thrust. The aircraft cannot climb.",
      source: SRC.af4590,
    },
    {
      id: "gonesse",
      title: "Gonesse",
      detail: "Moments after take-off it falls onto a hotel at Gonesse. 113 people die.",
      source: SRC.af4590,
    },
  ] satisfies readonly ChainLink[],
  fixes: [
    { date: "Aug 2000", title: "Grounded", detail: "Certificates of airworthiness are withdrawn.", source: SRC.af4590 },
    { date: "5 Sep 2001", title: "Modified", detail: "Kevlar liners inside the tanks. Michelin NZG tyres that shed no heavy fragments.", source: SRC.heritage },
    { date: "7 Nov 2001", title: "Return", detail: "Passenger service resumes, eight weeks after 11 September.", source: SRC.ops },
  ] satisfies readonly SequenceStep[],
  reasons: [
    {
      label: "Support",
      value: "Airbus withdraws",
      detail: "Without the manufacturer there are no spares, and eventually no certificate.",
      source: SRC.heritage,
    },
    { label: "Demand", value: "Premium travel collapses", detail: "After 11 September the front of the cabin empties.", source: SRC.heritage },
    { label: "Cost", value: "Maintenance climbs", detail: "An ageing fleet of twelve hand-built aircraft.", source: SRC.heritage },
  ] satisfies readonly Fact[],
  retirement: [
    { date: "10 Apr 2003", title: "Announced", detail: "British Airways and Air France announce retirement on the same day.", source: SRC.heritage },
    { date: "31 May 2003", title: "Air France, last fare", detail: "AF001 from New York lands at Paris.", source: SRC.ops },
    { date: "27 Jun 2003", title: "Air France, last flight", detail: "F-BVFC flies to Toulouse, where 001 first flew.", source: SRC.ops },
    { date: "24 Oct 2003", title: "British Airways, last day", detail: "Three aircraft land at Heathrow in sequence.", source: SRC.retirement },
    { date: "26 Nov 2003", title: "The last flight", detail: "G-BOAF, Heathrow to Filton, before more than 20,000 people.", source: SRC.ops },
  ] satisfies readonly SequenceStep[],
  landing: [
    { reg: "G-BOAE", from: "Edinburgh", detail: "A round trip for competition winners.", source: SRC.retirement },
    { reg: "G-BOAF", from: "Bay of Biscay", detail: "A supersonic loop for invited guests.", source: SRC.retirement },
    {
      reg: "G-BOAG",
      flight: "BA002",
      from: "New York JFK",
      detail: "Captain Mike Bannister. The last scheduled service. Touchdown 16:05.",
      source: SRC.retirement,
    },
  ] satisfies readonly LandingShip[],
} as const;

/* ──────────────────────────────────────────────────────────────
   07 · Legacy
   ────────────────────────────────────────────────────────────── */

export interface EasterEgg extends Sourced {
  id: string;
  title: string;
  detail: string;
}

export const LEGACY = {
  number: "07",
  kicker: "Legacy",
  title: ["Eighteen still", "stand"],
  lede: "Twenty were built. Two are gone. The rest wait in museums on three continents, noses drooped, as if ready for the approach.",
  survivorsNote: { label: "Surviving", value: "18", detail: "16 on public display", source: SRC.list },
  eggs: [
    {
      id: "cap-in-the-gap",
      title: "The cap in the gap",
      detail:
        "At Mach 2 a gap opened beside the flight engineer's console. On the last flights, crews slid their caps into it. As the airframe cooled, the gap closed. The caps are still there.",
      source: SRC.heritage,
    },
    {
      id: "curvature",
      title: "The curve of the Earth",
      detail: "At 60,000 ft the aircraft was above 96 per cent of the atmosphere. The sky went violet and the horizon bent.",
      source: SRC.wiki,
    },
    {
      id: "speedbird",
      title: "Speedbird Concorde One",
      detail: "The flagship callsign. British Airways flew it as BA001 to BA004.",
      source: SRC.heritage,
    },
    {
      id: "upgas",
      title: "UPGAS",
      detail: "The waypoint off Cornwall where westbound flights lit the reheat and accelerated. Cornwall heard the boom for 27 years.",
      source: SRC.heritage,
    },
    {
      id: "the-queen",
      title: "Royal passenger",
      detail: "Queen Elizabeth II flew Concorde in 1977, 1979, 1983, 1987, 1991 and 2003.",
      source: SRC.heritage,
    },
    {
      id: "ebay",
      title: "$60,000 for two seats",
      detail: "A couple bought seats on the final flight at auction on eBay.",
      source: SRC.heritage,
    },
  ] satisfies readonly EasterEgg[],
} as const;
