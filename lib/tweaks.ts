import { POSES, type Pose } from "@/lib/camera-keyframes";
import type { ChapterId } from "@/lib/flight-state";

/** Editable subset of a Pose, with aircraft rotation in degrees for humans. */
export interface TweakPose {
  cam: [number, number, number];
  look: [number, number, number];
  fov: number;
  /** pitch (+ = nose up), yaw, roll — degrees */
  rot: [number, number, number];
  pos: [number, number, number];
  nose: number;
}

export interface TweakState {
  /** When true the rig renders `pose` for `chapter` instead of the scripted keys. */
  active: boolean;
  chapter: ChapterId;
  /** Kill idle sway / bob / pointer parallax so the exact pose can be judged. */
  freeze: boolean;
  pose: TweakPose;
}

const rad2deg = (r: number): number => Math.round((r * 180) / Math.PI * 10) / 10;

export function poseToTweak(p: Pose): TweakPose {
  return {
    cam: [p.cam[0], p.cam[1], p.cam[2]],
    look: [p.look[0], p.look[1], p.look[2]],
    fov: p.fov,
    rot: [rad2deg(p.rot[0]), rad2deg(p.rot[1]), rad2deg(p.rot[2])],
    pos: [p.pos[0], p.pos[1], p.pos[2]],
    nose: p.nose,
  };
}

/** The first scripted key of a chapter, as an editable pose. */
export function defaultTweak(chapter: ChapterId): TweakPose {
  return poseToTweak(POSES[chapter][0]);
}

/** Mutable, read by CameraRig every frame — never drives React renders. */
export const tweaks: TweakState = {
  active: false,
  chapter: "hero",
  freeze: false,
  pose: defaultTweak("hero"),
};

const fmt = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return String(r); // 34 → "34", 0.15 → "0.15", -6.5 → "-6.5"
};
const vec = (v: readonly number[]): string => `[${v.map(fmt).join(", ")}]`;

/** The line to paste into lib/camera-keyframes.ts. */
export function tweakToSource(t: TweakPose): string {
  const parts = [`cam: ${vec(t.cam)}`, `look: ${vec(t.look)}`, `fov: ${fmt(t.fov)}`];
  if (t.rot.some((v) => v !== 0)) parts.push(`rot: [d(${fmt(t.rot[0])}), d(${fmt(t.rot[1])}), d(${fmt(t.rot[2])})]`);
  if (t.nose !== 0) parts.push(`nose: ${fmt(t.nose)}`);
  if (t.pos.some((v) => v !== 0)) parts.push(`pos: ${vec(t.pos)}`);
  return `pose({ ${parts.join(", ")} })`;
}

/** The equivalent `?poseChapter=…&pose=…` query string understood by CameraRig's dev override. */
export function tweakToQuery(chapter: ChapterId, t: TweakPose): string {
  const n = [...t.cam, ...t.look, t.fov, ...t.rot].map(fmt).join(",");
  return `?poseChapter=${chapter}&pose=${n}`;
}

declare global {
  interface Window {
    __tweaks?: TweakState;
  }
}
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") window.__tweaks = tweaks;
