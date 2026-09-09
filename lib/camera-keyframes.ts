import type { ChapterId } from "@/lib/flight-state";

export type Vec3 = readonly [number, number, number];

/** One pose of the camera + aircraft. Model units ≈ metres; aircraft is ~60 m long, nose toward -Z, origin at its centre. */
export interface Pose {
  readonly cam: Vec3; // camera position
  readonly look: Vec3; // camera look-at
  readonly fov: number;
  readonly rot: Vec3; // aircraft euler (pitch x [+ = nose up], yaw y, roll z) in radians
  readonly nose: number; // 0 = raised, 1 = full 12.5° droop
  readonly gear: number; // 0 = up, 1 = down
  readonly burner: number; // afterburner glow 0..1
  readonly contrail: number; // 0..1
  readonly cloudY: number; // vertical offset of the cloud deck
  readonly hide: number; // 0 = aircraft visible, 1 = faded out (unused by default — prefer flyout)
  readonly pos: Vec3; // aircraft world offset
  /** This key parks the aircraft off-frame. Entering it flies the aircraft out at the END of the segment; leaving it flies the aircraft in at the START. */
  readonly flyout: boolean;
}

const d = (deg: number): number => (deg * Math.PI) / 180;

const base: Pose = { cam: [0, 0, 0], look: [0, 0, 0], fov: 32, rot: [0, 0, 0], nose: 0, gear: 0, burner: 0, contrail: 0, cloudY: 0, hide: 0, pos: [0, 0, 0], flyout: false };
const pose = (p: Partial<Pose>): Pose => ({ ...base, ...p });

export const CHAPTER_ORDER: readonly ChapterId[] = ["hero", "dream", "anatomy", "first-flights", "archive", "mach2", "routes", "only-one", "descent", "legacy", "timeline", "footer"];

/**
 * Continuous camera choreography. Each chapter lists the poses it passes through, in order;
 * the rig interpolates through them with the chapter's scroll progress and then on into the
 * FIRST pose of the next chapter, so the path never jumps at a chapter boundary.
 */
export const POSES: Record<ChapterId, readonly Pose[]> = {
  hero: [
    // Front three-quarter from just below: the nose comes at the viewer, big, left of centre-right;
    // the fuselage runs off the right edge. A hint of climb and bank so it reads as flying, not parked.
    // Pitched 17° about the NOSE (pos compensates the centre rotation) so the rear sweeps into the bottom-right.
    pose({ cam: [-12.5, -2.5, -39.5], look: [0.35, -0.4, -23.6], fov: 36, rot: [d(17), 0, d(-6)], pos: [0, -5.2, 0.45], nose: 0.15, cloudY: -30 }),
  ],
  dream: [
    // Roll and rotate: gear down, nose 5°, reheat lit, pitch up…
    pose({ cam: [-30, -16, -26], look: [2, 2, -12], fov: 32, rot: [d(6), d(12), d(-8)], nose: 0.4, gear: 1, burner: 0.55, cloudY: -26 }),
    // Swing round the nose at a wide radius so the aircraft stays right of the copy.
    pose({ cam: [-8, -6, -74], look: [12, 3, -10], fov: 30, rot: [d(12), d(10), d(4)], nose: 0.25, gear: 1, burner: 0.9, cloudY: -18 }),
    // …then climb out over the cloud deck, gear tucked away.
    pose({ cam: [34, 8, -46], look: [-8, 3, 4], fov: 32, rot: [d(15), d(-38), d(4)], nose: 0.1, gear: 0, burner: 1, cloudY: -26 }),
  ],
  anatomy: [
    // Establishing shot under the chapter headline: the whole aircraft, three-quarter from above.
    pose({ cam: [74, 36, -62], look: [-14, -2, 4], fov: 32, cloudY: -32 }),
    // Then one close-up per hotspot card (order = content/chapters.ts ANATOMY.hotspots).
    pose({ cam: [26, 22, 4], look: [6, 0, 3], fov: 34, cloudY: -34 }), // delta wing from above, whole wing in frame
    pose({ cam: [11, 3.5, 30], look: [4, 0.5, 9], fov: 32, burner: 0.35, cloudY: -36 }), // Olympus 593 nozzles
    pose({ cam: [12, -2.5, -20], look: [4, 0.2, -4], fov: 32, cloudY: -38 }), // intake ramps
    pose({ cam: [-11, 1.5, -45], look: [0, 2.4, -25], fov: 30, nose: 1, cloudY: -40 }), // droop nose
    pose({ cam: [-44, 4, -2], look: [0, 1.2, 0], fov: 34, cloudY: -40 }), // fuel trim — full side profile
    pose({ cam: [-17, 7, -20], look: [0, 2, 10], fov: 32, cloudY: -42 }), // RR58 skin, raking along the fuselage
    pose({ cam: [-9, 5.5, -32], look: [0, 2.8, -22], fov: 32, cloudY: -42 }), // fly-by-wire — cockpit
  ],
  "first-flights": [
    // Entry: banks in from the upper left, further away, as the chapter header appears…
    pose({ cam: [-40, 44, -118], look: [-12, 6, -8], fov: 32, rot: [d(4), d(18), d(-30)], pos: [-34, 10, 14], nose: 0.4, contrail: 0.25, cloudY: -40 }),
    // …settles on the front-high shot for the strip, creeping toward the camera…
    pose({ cam: [0, 30, -92], look: [9, 1, 0], fov: 30, nose: 0.6, contrail: 0.3, cloudY: -44 }),
    pose({ cam: [0, 30, -92], look: [9, 1, 0], fov: 30, pos: [1, -1.5, -6], nose: 0.6, contrail: 0.35, cloudY: -44 }),
    pose({ cam: [0, 30, -92], look: [9, 1, 0], fov: 30, pos: [2, -4, -14], nose: 0.6, contrail: 0.45, cloudY: -45 }),
    // …then dives past and under the camera, out of the bottom of the frame, before the photographs.
    pose({ cam: [0, 30, -92], look: [9, 1, 0], fov: 30, rot: [d(-10), 0, d(-4)], pos: [6, -44, -135], nose: 0.5, contrail: 0.85, cloudY: -46 }),
  ],
  archive: [
    // The real photographs take the stage: the model fades out and drifts off frame.
    // The camera tilts up to the open sky: the aircraft slides out of the bottom of the frame.
    // Meanwhile the aircraft is parked far off to the right (flyout), so Mach 2 can sweep it in
    // from the upper right — never rising from the bottom over the last photograph.
    pose({ cam: [0, 30, -92], look: [0, 140, 60], fov: 30, nose: 0.6, cloudY: -44, pos: [0, 40, 320], flyout: true }),
    pose({ cam: [-20, 28, -90], look: [-10, 150, 40], fov: 30, cloudY: -50, pos: [0, 40, 320], flyout: true }),
  ],
  mach2: [
    pose({ cam: [-96, 16, -34], look: [8, 0, 0], fov: 32, rot: [0, d(20), d(-8)], contrail: 0.4, cloudY: -56 }),
    // Rear three-quarter, afterburners, long contrails, stars coming out.
    pose({ cam: [24, 6, 76], look: [0, 1, -12], fov: 38, rot: [d(-2), d(6), d(2)], burner: 1, contrail: 1, cloudY: -86 }),
  ],
  routes: [
    // The globe owns this chapter: the aircraft accelerates away, climbing out of the top-left of frame…
    pose({ cam: [20, 8, 78], look: [0, 2, -16], fov: 34, burner: 1, contrail: 1, cloudY: -90, pos: [-170, 125, -250], flyout: true }),
    // …then waits far astern (the direction it flies from) so the next chapter sees it approach
    // nose-first from a long way off — a slow cruise-by, not a whoosh across the headline.
    pose({ cam: [10, 70, 40], look: [-10, 0, -10], fov: 32, contrail: 1, cloudY: -90, pos: [10, 4, 460], flyout: true }),
  ],
  "only-one": [
    // Side-on from the left, slightly ahead: the aircraft slides in from the RIGHT edge (it is parked
    // far astern) and settles right of the ledger. Same camera family as Descent, so no big orbit follows.
    pose({ cam: [-64, 18, -26], look: [4, 0, -10], fov: 30, rot: [0, 0, d(-4)], contrail: 1, cloudY: -90 }),
  ],
  descent: [
    pose({ cam: [-46, 8, -40], look: [0, 1, 0], fov: 34, rot: [d(-4), d(28), d(3)], nose: 0.6, contrail: 0.3, cloudY: -60 }),
    // Flare: nose fully drooped, gear down, seen from below.
    pose({ cam: [-34, -4, -52], look: [0, 2, 4], fov: 36, rot: [d(6), d(20), 0], nose: 1, gear: 1, cloudY: -24 }),
  ],
  legacy: [
    // Parked upper-right, small, gear down and nose drooped: the museum piece.
    pose({ cam: [-16, 16, -118], look: [30, -8, 0], fov: 30, rot: [d(2), d(10), 0], nose: 0.9, gear: 1, cloudY: -20 }),
    pose({ cam: [-30, 14, -112], look: [32, -10, 2], fov: 30, rot: [d(2), d(16), 0], nose: 0.9, gear: 1, cloudY: -20 }),
  ],
  timeline: [
    // "Overflight": the camera lies back and looks up; a distant Concorde crosses the star field at a
    // steady pace (LINEAR chapter), dark silhouette and long contrail — what people on the ground saw.
    // The final segment (into the footer) dives it down and banks it round into the closing shot.
    pose({ cam: [0, -8, 250], look: [-20, 360, -10], fov: 40, rot: [0, d(-113), d(-6)], pos: [-170, 380, -60], contrail: 1, cloudY: -40 }),
    pose({ cam: [0, -8, 250], look: [-7, 360, -3], fov: 40, rot: [0, d(-113), d(-6)], pos: [-57, 380, -20], contrail: 1, cloudY: -40 }),
    pose({ cam: [0, -8, 250], look: [7, 360, 3], fov: 40, rot: [0, d(-113), d(-6)], pos: [57, 380, 20], contrail: 1, cloudY: -40 }),
    pose({ cam: [0, -8, 250], look: [20, 360, 10], fov: 40, rot: [0, d(-113), d(-6)], pos: [170, 380, 60], contrail: 1, cloudY: -40 }),
  ],
  footer: [
    // Arrival. Out of the timeline's dive the aircraft levels off just ahead of a static camera…
    pose({ cam: [18, -6, 40], look: [-6, 8, -30], fov: 34, rot: [d(4), d(-8), d(-6)], burner: 0.9, contrail: 1, cloudY: -60 }),
    // …and flies on past, climbing away up-left…
    pose({ cam: [18, -6, 40], look: [-6, 8, -30], fov: 34, rot: [d(6), d(-8), d(-4)], pos: [-30, 76, -260], burner: 0.7, contrail: 1, cloudY: -60 }),
    // …until its reheat is indistinguishable from the stars.
    pose({ cam: [18, -6, 40], look: [-6, 8, -30], fov: 34, rot: [d(6), d(-8), d(-2)], pos: [-60, 190, -560], burner: 0.15, contrail: 0.8, cloudY: -60 }),
  ],
};

/** Fraction of each key-to-key segment spent holding the pose before moving on (anatomy lingers on each close-up). */
/** Per-chapter share of each segment spent holding before the move (the stepper handles anatomy itself). */
export const HOLD: Partial<Record<ChapterId, number>> = {};

/** Chapters whose keys are traversed at constant speed (no ease per segment): steady overflights. */
export const LINEAR: Partial<Record<ChapterId, boolean>> = { timeline: true };

/** Fraction of a chapter's opening over which a parked aircraft sweeps back in (default 0.18). */
export const ENTER: Partial<Record<ChapterId, number>> = { "only-one": 0.55 };

/** Keys to interpolate for a chapter: its own poses followed by the next chapter's first pose. */
/**
 * Portrait overrides. On a tall, narrow viewport the landscape framing puts the airframe straight
 * through the copy; these keys pull the camera back and aim it lower, which lifts the aircraft into
 * the upper half of the frame and leaves clear sky for the text. Chapters not listed here use POSES.
 */
export const PORTRAIT_POSES: Partial<Record<ChapterId, readonly Pose[]>> = {
  hero: [pose({ cam: [-18, 8, -74], look: [0, -12, -18], fov: 36, rot: [d(17), 0, d(-6)], pos: [0, -5.2, 0.45], nose: 0.15, cloudY: -30 })],
  dream: [
    pose({ cam: [-34, -14, -30], look: [0, -6, -12], fov: 40, rot: [d(6), d(12), d(-8)], nose: 0.4, gear: 1, burner: 0.55, cloudY: -26 }),
    pose({ cam: [-10, -4, -84], look: [10, -5, -10], fov: 38, rot: [d(12), d(10), d(4)], nose: 0.25, gear: 1, burner: 0.9, cloudY: -18 }),
    pose({ cam: [40, 12, -52], look: [-8, -6, 4], fov: 40, rot: [d(15), d(-38), d(4)], burner: 1, cloudY: -26 }),
  ],
  mach2: [
    pose({ cam: [-104, 20, -38], look: [8, -8, 0], fov: 40, rot: [0, d(20), d(-8)], contrail: 0.4, cloudY: -56 }),
    pose({ cam: [28, 8, 84], look: [0, -7, -12], fov: 46, rot: [d(-2), d(6), d(2)], burner: 1, contrail: 1, cloudY: -86 }),
  ],
  "only-one": [pose({ cam: [-70, 22, -30], look: [4, -8, -10], fov: 38, rot: [0, 0, d(-4)], contrail: 1, cloudY: -90 })],
};

function set(chapter: ChapterId, portrait: boolean): readonly Pose[] {
  return (portrait && PORTRAIT_POSES[chapter]) || POSES[chapter];
}

export function keysFor(chapter: ChapterId, portrait = false): readonly Pose[] {
  const own = set(chapter, portrait);
  const i = CHAPTER_ORDER.indexOf(chapter);
  const next = CHAPTER_ORDER[i + 1];
  return next ? [...own, set(next, portrait)[0]] : own;
}
