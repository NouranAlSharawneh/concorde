/** Canonical source URLs shared by every content module. Every fact cites one of these. */
export const SRC = {
  wiki: "https://en.wikipedia.org/wiki/Concorde",
  list: "https://en.wikipedia.org/wiki/List_of_Concorde_aircraft",
  ops: "https://en.wikipedia.org/wiki/Concorde_operational_history",
  heritage: "https://www.heritageconcorde.com",
  heritageIntake: "https://www.heritageconcorde.com/air-in-take-system",
  heritageFuel: "https://www.heritageconcorde.com/fuel-transfer",
  olympus: "https://en.wikipedia.org/wiki/Rolls-Royce/Snecma_Olympus_593",
  af4590: "https://en.wikipedia.org/wiki/Air_France_Flight_4590",
  guinness: "https://www.guinnessworldrecords.com",
  ba: "https://www.britishairways.com/en-gb/information/about-ba/history-and-heritage/celebrating-concorde",
  tu144: "https://en.wikipedia.org/wiki/Tupolev_Tu-144",
  cfr91817: "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-91/subpart-I/section-91.817",
  xb1: "https://en.wikipedia.org/wiki/Boom_XB-1",
  x59: "https://en.wikipedia.org/wiki/Lockheed_Martin_X-59_Quesst",
  /** FAA's 2026 proposal to lift the overland ban (the rulemaking docket itself is on some networks blocked). */
  faaSupersonic: "https://www.faa.gov/newsroom",
  liveAid: "https://en.wikipedia.org/wiki/Live_Aid",
  retirement: "https://www.heritageconcorde.com/concorde-retirement-2003",
  b747: "https://en.wikipedia.org/wiki/Boeing_747",
  shinkansen: "https://en.wikipedia.org/wiki/Shinkansen",
  speedOfSound: "https://en.wikipedia.org/wiki/Speed_of_sound",
} as const;

export type SourceKey = keyof typeof SRC;
