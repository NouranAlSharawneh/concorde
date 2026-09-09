import { SRC } from "./sources";

/** Pre-formatted chip shown in the hero (no animation needed). */
export interface HeroStat {
  value: string;
  label: string;
  source: string;
}

/** Animated counter. `value` is the numeric target; prefix/suffix wrap the formatted number. */
export interface BigStat {
  id: string;
  value: number;
  decimals: number;
  prefix?: string;
  suffix?: string;
  /** Disable thousands grouping (years, Mach numbers). */
  group?: boolean;
  label: string;
  detail?: string;
  source: string;
}

export const HERO_STATS: readonly HeroStat[] = [
  { value: "Mach 2.04", label: "Cruise", source: SRC.wiki },
  { value: "60,000 ft", label: "Ceiling", source: SRC.wiki },
  { value: "2h 52m 59s", label: "Fastest Atlantic crossing", source: SRC.guinness },
];

export const BIG_STATS: readonly BigStat[] = [
  {
    id: "mach",
    value: 2.04,
    decimals: 2,
    prefix: "Mach ",
    group: false,
    label: "Cruising speed",
    detail: "1,354 mph. 2,179 km/h. Twice the speed of sound.",
    source: SRC.wiki,
  },
  {
    id: "kmh",
    value: 2179,
    decimals: 0,
    suffix: " km/h",
    label: "Over the ground",
    detail: "Twenty-three miles a minute. A mile every 2.75 seconds.",
    source: SRC.wiki,
  },
  {
    id: "ceiling",
    value: 60000,
    decimals: 0,
    suffix: " ft",
    label: "Service ceiling",
    detail: "Above 96 per cent of the atmosphere. The sky turns violet.",
    source: SRC.wiki,
  },
  {
    id: "nose-temp",
    value: 127,
    decimals: 0,
    suffix: " °C",
    label: "Nose skin at Mach 2",
    detail: "The limit for the Hiduminium RR58 alloy it was built from.",
    source: SRC.wiki,
  },
  {
    id: "stretch",
    value: 300,
    decimals: 0,
    suffix: " mm",
    label: "Fuselage growth in cruise",
    detail: "Heat stretched the airframe by up to 300 mm every flight.",
    source: SRC.wiki,
  },
  {
    id: "thrust",
    value: 38000,
    decimals: 0,
    suffix: " lbf",
    label: "Per engine, with reheat",
    detail: "Four Rolls-Royce/Snecma Olympus 593s. The only afterburning turbojets ever on an airliner.",
    source: SRC.olympus,
  },
  {
    id: "airframes",
    value: 20,
    decimals: 0,
    label: "Airframes built",
    detail: "Six for development, fourteen for passengers.",
    source: SRC.list,
  },
  {
    id: "years",
    value: 27,
    decimals: 0,
    label: "Years in service",
    detail: "21 January 1976 to 24 October 2003.",
    source: SRC.wiki,
  },
  {
    id: "passengers",
    value: 2.5,
    decimals: 1,
    suffix: " M+",
    group: false,
    label: "British Airways passengers",
    detail: "Across roughly 50,000 flights.",
    source: SRC.ba,
  },
  {
    id: "circumnavigation",
    value: 31,
    decimals: 0,
    suffix: " h 27 m",
    label: "Fastest circumnavigation",
    detail: "31 h 27 m 49 s. Air France, 15 to 16 August 1995.",
    source: SRC.guinness,
  },
];
