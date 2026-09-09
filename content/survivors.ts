import { SRC } from "./sources";

export interface Airframe {
  /** Registration, e.g. "G-BOAF". */
  reg: string;
  /** Constructor's number: 001–002 prototypes, 101–102 pre-production, 201–216 production. */
  number: string;
  /** Museum or site. */
  location: string;
  city: string;
  country: string;
  /** Total flying hours. */
  hours?: number;
  note?: string;
  source: string;
}

/** The eighteen airframes that survive, in constructor's-number order. */
export const SURVIVORS: readonly Airframe[] = [
  {
    reg: "F-WTSS",
    number: "001",
    location: "Musée de l'Air et de l'Espace",
    city: "Le Bourget",
    country: "France",
    hours: 812,
    note: "The first to fly. 2 March 1969, André Turcat.",
    source: SRC.list,
  },
  {
    reg: "G-BSST",
    number: "002",
    location: "Fleet Air Arm Museum",
    city: "Yeovilton",
    country: "United Kingdom",
    hours: 836,
    note: "The British prototype. 9 April 1969, Brian Trubshaw.",
    source: SRC.list,
  },
  {
    reg: "G-AXDN",
    number: "101",
    location: "Imperial War Museum Duxford",
    city: "Duxford",
    country: "United Kingdom",
    hours: 632,
    note: "The fastest. Mach 2.23 on 26 March 1974.",
    source: SRC.list,
  },
  {
    reg: "F-WTSA",
    number: "102",
    location: "Musée Delta",
    city: "Athis-Mons, Paris",
    country: "France",
    hours: 656,
    source: SRC.list,
  },
  {
    reg: "F-WTSB",
    number: "201",
    location: "Aeroscopia",
    city: "Toulouse",
    country: "France",
    hours: 909,
    source: SRC.list,
  },
  {
    reg: "G-BBDG",
    number: "202",
    location: "Brooklands Museum",
    city: "Weybridge",
    country: "United Kingdom",
    hours: 1282,
    note: "A development aircraft. Never entered airline service.",
    source: SRC.list,
  },
  {
    reg: "G-BOAC",
    number: "204",
    location: "Runway Visitor Park, Manchester Airport",
    city: "Manchester",
    country: "United Kingdom",
    hours: 22260,
    note: "The British Airways flagship.",
    source: SRC.list,
  },
  {
    reg: "F-BVFA",
    number: "205",
    location: "Steven F. Udvar-Hazy Center",
    city: "Chantilly, Virginia",
    country: "United States",
    hours: 17824,
    note: "Flew the first Air France service to Rio on 21 January 1976.",
    source: SRC.list,
  },
  {
    reg: "G-BOAA",
    number: "206",
    location: "National Museum of Flight",
    city: "East Fortune",
    country: "United Kingdom",
    hours: 22768,
    note: "Flew the first British Airways service to Bahrain on 21 January 1976.",
    source: SRC.list,
  },
  {
    reg: "F-BVFB",
    number: "207",
    location: "Technik Museum Sinsheim",
    city: "Sinsheim",
    country: "Germany",
    hours: 14771,
    note: "Displayed beside a Tu-144. The only place both stand together.",
    source: SRC.list,
  },
  {
    reg: "G-BOAB",
    number: "208",
    location: "Heathrow Airport",
    city: "London",
    country: "United Kingdom",
    hours: 22296,
    note: "Stored airside. Not on public display.",
    source: SRC.list,
  },
  {
    reg: "F-BVFC",
    number: "209",
    location: "Aeroscopia",
    city: "Toulouse",
    country: "France",
    hours: 14332,
    note: "Flew the last Air France flight, Paris to Toulouse, 27 June 2003.",
    source: SRC.list,
  },
  {
    reg: "G-BOAD",
    number: "210",
    location: "Intrepid Museum",
    city: "New York",
    country: "United States",
    hours: 23397,
    note: "The most hours of any Concorde. Holds the Atlantic record. Arrived by barge up the Hudson.",
    source: SRC.list,
  },
  {
    reg: "G-BOAE",
    number: "212",
    location: "Barbados Concorde Experience, Grantley Adams International",
    city: "Christ Church",
    country: "Barbados",
    hours: 23376,
    note: "Flew the Edinburgh leg of the final day, 24 October 2003.",
    source: SRC.list,
  },
  {
    reg: "F-BTSD",
    number: "213",
    location: "Musée de l'Air et de l'Espace",
    city: "Le Bourget",
    country: "France",
    hours: 12974,
    note: "Holds both round-the-world records.",
    source: SRC.list,
  },
  {
    reg: "G-BOAG",
    number: "214",
    location: "Museum of Flight",
    city: "Seattle",
    country: "United States",
    hours: 16239,
    note: "Flew the last transatlantic service, BA002, 24 October 2003.",
    source: SRC.list,
  },
  {
    reg: "F-BVFF",
    number: "215",
    location: "Charles de Gaulle Airport",
    city: "Paris",
    country: "France",
    hours: 12421,
    note: "Displayed outdoors at the airport.",
    source: SRC.list,
  },
  {
    reg: "G-BOAF",
    number: "216",
    location: "Aerospace Bristol",
    city: "Filton",
    country: "United Kingdom",
    hours: 18257,
    note: "The last built, the last to fly. 26 November 2003. 5,639 supersonic cycles.",
    source: SRC.list,
  },
];

/** The two production airframes that no longer exist. */
export const LOST: readonly Airframe[] = [
  {
    reg: "F-BTSC",
    number: "203",
    location: "Destroyed at Gonesse",
    city: "Gonesse",
    country: "France",
    hours: 11989,
    note: "Air France 4590, 25 July 2000.",
    source: SRC.af4590,
  },
  {
    reg: "F-BVFD",
    number: "211",
    location: "Scrapped",
    city: "Le Bourget",
    country: "France",
    hours: 5814,
    note: "Used for spares and broken up in 1994. A fuselage section survives at Le Bourget.",
    source: SRC.list,
  },
];
