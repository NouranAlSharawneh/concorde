/**
 * The whole site is driven by one number: altitude (0 = ground among the clouds,
 * 1 = 60,000 ft at Mach 2). Palette stops are interpolated from it both for the
 * DOM (CSS variables) and for the WebGL sky shader.
 */

export type RGB = readonly [number, number, number];

export interface PaletteStop {
  readonly alt: number;
  readonly skyTop: RGB;
  readonly skyBottom: RGB;
  readonly haze: RGB;
  readonly ink: RGB;
  readonly paper: RGB;
  readonly accent: RGB;
  readonly sun: number; // 0..1 strength of the sun disc/bloom
  readonly stars: number; // 0..1 star visibility
}

const hex = (h: string): RGB => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const PALETTE: readonly PaletteStop[] = [
  { alt: 0.0,  skyTop: hex("#3F8FDE"), skyBottom: hex("#D9EBFA"), haze: hex("#FFE0B5"), ink: hex("#0E1B2B"), paper: hex("#FFFFFF"), accent: hex("#FF6A3D"), sun: 1.0, stars: 0 },
  { alt: 0.18, skyTop: hex("#2F7FD6"), skyBottom: hex("#BBDAF5"), haze: hex("#FFE3C2"), ink: hex("#0E1B2B"), paper: hex("#FFFFFF"), accent: hex("#FF7A45"), sun: 0.9, stars: 0 },
  { alt: 0.4,  skyTop: hex("#1B59B2"), skyBottom: hex("#5C9FE0"), haze: hex("#FFD9B0"), ink: hex("#F4F7FB"), paper: hex("#0E1B2B"), accent: hex("#FFD166"), sun: 0.7, stars: 0 },
  { alt: 0.6,  skyTop: hex("#0F326E"), skyBottom: hex("#2B6FC0"), haze: hex("#F9C74F"), ink: hex("#F4F7FB"), paper: hex("#0B1830"), accent: hex("#F9C74F"), sun: 0.45, stars: 0.42 },
  { alt: 0.8,  skyTop: hex("#03050E"), skyBottom: hex("#143C7A"), haze: hex("#FFB703"), ink: hex("#EEF2FF"), paper: hex("#070B1A"), accent: hex("#FFB703"), sun: 0.2, stars: 1 },
  { alt: 1.0,  skyTop: hex("#02030A"), skyBottom: hex("#0B1833"), haze: hex("#FFB703"), ink: hex("#EEF2FF"), paper: hex("#05070F"), accent: hex("#FFB703"), sun: 0.1, stars: 1.2 },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function samplePalette(alt: number): PaletteStop {
  const a = Math.min(1, Math.max(0, alt));
  let i = 0;
  while (i < PALETTE.length - 2 && a > PALETTE[i + 1].alt) i++;
  const s0 = PALETTE[i];
  const s1 = PALETTE[i + 1];
  const t = (a - s0.alt) / (s1.alt - s0.alt);
  const e = t * t * (3 - 2 * t); // smoothstep between stops
  return {
    alt: a,
    skyTop: lerpRGB(s0.skyTop, s1.skyTop, e),
    skyBottom: lerpRGB(s0.skyBottom, s1.skyBottom, e),
    haze: lerpRGB(s0.haze, s1.haze, e),
    ink: lerpRGB(s0.ink, s1.ink, e),
    paper: lerpRGB(s0.paper, s1.paper, e),
    accent: lerpRGB(s0.accent, s1.accent, e),
    sun: lerp(s0.sun, s1.sun, e),
    stars: lerp(s0.stars, s1.stars, e),
  };
}

export const rgbToCss = (c: RGB): string =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

export const altitudeToFeet = (alt: number): number => Math.round(Math.min(1, Math.max(0, alt)) * 60000);
export const altitudeToMach = (alt: number): number => {
  const a = Math.min(1, Math.max(0, alt));
  if (a < 0.15) return 0.3 + (a / 0.15) * 0.55; // rolling → climb
  if (a < 0.55) return 0.85 + ((a - 0.15) / 0.4) * 0.15; // subsonic climb to transonic
  return 1.0 + ((a - 0.55) / 0.45) * 1.04; // accelerate to 2.04
};
