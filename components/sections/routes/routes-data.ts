import * as THREE from "three";

/* ── Sources ─────────────────────────────────────────────────────────── */
export const ROUTE_SRC = {
  firstServices: "https://www.heritageconcorde.com/concorde-first-scheduled-services",
  history: "https://en.wikipedia.org/wiki/Concorde_operational_history",
  guinness: "https://www.guinnessworldrecords.com/world-records/fastest-circumnavigation-by-passenger-aircraft",
} as const;

/* ── Airports ────────────────────────────────────────────────────────── */
export interface Airport {
  code: string;
  city: string;
  lat: number;
  lon: number;
}

export const AIRPORTS = {
  LHR: { code: "LHR", city: "London Heathrow", lat: 51.47, lon: -0.46 },
  CDG: { code: "CDG", city: "Paris Charles de Gaulle", lat: 49.01, lon: 2.55 },
  JFK: { code: "JFK", city: "New York JFK", lat: 40.64, lon: -73.78 },
  IAD: { code: "IAD", city: "Washington Dulles", lat: 38.95, lon: -77.46 },
  BGI: { code: "BGI", city: "Barbados", lat: 13.07, lon: -59.49 },
  BAH: { code: "BAH", city: "Bahrain", lat: 26.27, lon: 50.63 },
  DKR: { code: "DKR", city: "Dakar", lat: 14.74, lon: -17.49 },
  GIG: { code: "GIG", city: "Rio de Janeiro", lat: -22.81, lon: -43.25 },
  TLS: { code: "TLS", city: "Toulouse", lat: 43.63, lon: 1.37 },
  DXB: { code: "DXB", city: "Dubai", lat: 25.25, lon: 55.36 },
  BKK: { code: "BKK", city: "Bangkok", lat: 13.69, lon: 100.75 },
  GUM: { code: "GUM", city: "Guam", lat: 13.48, lon: 144.8 },
  HNL: { code: "HNL", city: "Honolulu", lat: 21.32, lon: -157.92 },
  ACA: { code: "ACA", city: "Acapulco", lat: 16.76, lon: -99.75 },
} as const satisfies Record<string, Airport>;

export type AirportCode = keyof typeof AIRPORTS;

/* ── Routes ──────────────────────────────────────────────────────────── */
export type RouteKind = "scheduled" | "record";

export interface Route {
  id: string;
  kind: RouteKind;
  /** Waypoints in flying order; consecutive pairs become arcs. */
  via: readonly AirportCode[];
  label: string;
  source: string;
}

/** Drawn in this order as the chapter scrolls (roughly chronological). */
export const ROUTES: readonly Route[] = [
  { id: "lhr-jfk", kind: "scheduled", via: ["LHR", "JFK"], label: "London – New York, from 22 Nov 1977", source: ROUTE_SRC.history },
  { id: "lhr-bah", kind: "scheduled", via: ["LHR", "BAH"], label: "London – Bahrain, 21 Jan 1976", source: ROUTE_SRC.firstServices },
  { id: "cdg-dkr-gig", kind: "scheduled", via: ["CDG", "DKR", "GIG"], label: "Paris – Dakar – Rio, 21 Jan 1976", source: ROUTE_SRC.firstServices },
  { id: "lhr-iad", kind: "scheduled", via: ["LHR", "IAD"], label: "London – Washington Dulles, 24 May 1976", source: ROUTE_SRC.history },
  { id: "cdg-jfk", kind: "scheduled", via: ["CDG", "JFK"], label: "Paris – New York, from 22 Nov 1977", source: ROUTE_SRC.history },
  { id: "lhr-bgi", kind: "scheduled", via: ["LHR", "BGI"], label: "London – Barbados", source: ROUTE_SRC.history },
  {
    id: "rtw-1995",
    kind: "record",
    via: ["JFK", "TLS", "DXB", "BKK", "GUM", "HNL", "ACA", "JFK"],
    label: "Round the world, 15–16 Aug 1995, 31 h 27 min 49 s",
    source: ROUTE_SRC.guinness,
  },
];

/** The leg the miniature aircraft flies (and draws as it goes). */
export const PLANE_ROUTE_ID = "lhr-jfk";

/* ── Geometry helpers ────────────────────────────────────────────────── */
const DEG = Math.PI / 180;

/**
 * Lat/lon → unit-sphere position. Longitude 0 faces +Z, east is +X, so a camera
 * orbiting at azimuth φ (from +Z towards +X) looks straight at longitude φ with
 * east on its right — the same handedness as a map.
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new THREE.Vector3()): THREE.Vector3 {
  const phi = lat * DEG;
  const theta = lon * DEG;
  const c = Math.cos(phi);
  return target.set(radius * c * Math.sin(theta), radius * Math.sin(phi), radius * c * Math.cos(theta));
}

/** Arc apex height above the surface as a fraction of the chord length. */
export const ARC_LIFT = 0.18;

/**
 * Great-circle-ish arc from `a` to `b`, lifted above the surface. A quadratic Bézier
 * gives the shape; its samples are clamped to a minimum radius and re-fitted with a
 * Catmull-Rom so long legs never dip below the globe near their ends.
 */
export function makeArc(a: THREE.Vector3, b: THREE.Vector3, lift = ARC_LIFT): THREE.CatmullRomCurve3 {
  const chord = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const apex = mid.clone().normalize().multiplyScalar(1 + lift * chord);
  // Quadratic Bézier passes through (a + 2c + b) / 4 at t = 0.5 → solve for the control point.
  const ctrl = apex.multiplyScalar(2).sub(mid);
  const bezier = new THREE.QuadraticBezierCurve3(a, ctrl, b);
  const samples = bezier.getPoints(24).map((p) => {
    const r = p.length();
    return r < 1.004 ? p.multiplyScalar(1.004 / r) : p;
  });
  return new THREE.CatmullRomCurve3(samples, false, "centripetal");
}
