import * as THREE from "three";

/**
 * World-space sun direction (unit vector pointing *toward* the sun) as a function of altitude.
 * Shared by the sky shader (disc + glow) and the key light so they always agree. Low and warm in the
 * hero (front-right-above of the opening camera), sinking toward the horizon as we climb.
 */
export function sunDirection(alt: number, out: THREE.Vector3): THREE.Vector3 {
  const elev = THREE.MathUtils.lerp(0.22, 0.03, THREE.MathUtils.clamp(alt, 0, 1));
  return out.set(0.39, elev, 0.9).normalize();
}
