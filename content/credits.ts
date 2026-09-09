import { SRC } from "./sources";

/** Exact attribution required by the model's CC-BY-4.0 licence. Must appear verbatim in the footer. */
export const MODEL_CREDIT =
  'This work is based on "Concorde 3D Model" (https://sketchfab.com/3d-models/concorde-3d-model-d2222f34152d4850afff0124872fc9ba) by thomas333 (https://sketchfab.com/thomas333) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)';

/** Structured version of the same credit for rendering with links. */
export const MODEL = {
  title: "Concorde 3D Model",
  url: "https://sketchfab.com/3d-models/concorde-3d-model-d2222f34152d4850afff0124872fc9ba",
  author: "thomas333",
  authorUrl: "https://sketchfab.com/thomas333",
  license: "CC-BY-4.0",
  licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
} as const;

export interface ImageAttribution {
  /** Path under /public, e.g. "/images/concorde-planview.jpg". */
  file: string;
  title: string;
  author: string;
  /** e.g. "CC BY-SA 3.0" or "Public domain". */
  license: string;
  licenseUrl?: string;
  /** Wikimedia Commons (or other) page the file came from. */
  source: string;
}

/** Populate as images are added to /public/images. Rendered in the footer. */
export const IMAGE_ATTRIBUTIONS: readonly ImageAttribution[] = [];

export interface SourceRef {
  id: string;
  label: string;
  url: string;
}

/** Sources cited across content/*.ts, in the order they appear in the footer. */
export const SOURCES: readonly SourceRef[] = [
  { id: "wiki", label: "Concorde — Wikipedia", url: SRC.wiki },
  { id: "list", label: "List of Concorde aircraft — Wikipedia", url: SRC.list },
  { id: "ops", label: "Concorde operational history — Wikipedia", url: SRC.ops },
  { id: "olympus", label: "Rolls-Royce/Snecma Olympus 593 — Wikipedia", url: SRC.olympus },
  { id: "af4590", label: "Air France Flight 4590 — Wikipedia", url: SRC.af4590 },
  { id: "tu144", label: "Tupolev Tu-144 — Wikipedia", url: SRC.tu144 },
  { id: "heritage", label: "Heritage Concorde", url: SRC.heritage },
  { id: "ba", label: "British Airways — Celebrating Concorde", url: SRC.ba },
  { id: "guinness", label: "Guinness World Records", url: SRC.guinness },
  { id: "cfr", label: "14 CFR 91.817 — Civil aircraft sonic boom", url: SRC.cfr91817 },
  { id: "retirement", label: "Heritage Concorde — Retirement, 2003", url: SRC.retirement },
  { id: "liveaid", label: "Live Aid — Wikipedia", url: SRC.liveAid },
  { id: "xb1", label: "Boom XB-1 — Wikipedia", url: SRC.xb1 },
  { id: "x59", label: "Lockheed Martin X-59 — Wikipedia", url: SRC.x59 },
  { id: "faa", label: "FAA newsroom — supersonic overland rulemaking", url: SRC.faaSupersonic },
  { id: "b747", label: "Boeing 747 — Wikipedia", url: SRC.b747 },
  { id: "shinkansen", label: "Shinkansen — Wikipedia", url: SRC.shinkansen },
  { id: "sound", label: "Speed of sound — Wikipedia", url: SRC.speedOfSound },
];
