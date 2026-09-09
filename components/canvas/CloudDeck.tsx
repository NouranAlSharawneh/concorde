"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { flight } from "@/lib/flight-state";
import type { DeviceTier } from "@/lib/device";

/** drei fetches its default cloud sprite from a third-party CDN at runtime, on the preloader's critical path. Self-hosted instead. */
const CLOUD_TEXTURE = "/textures/cloud.png";

interface Props {
  tier: DeviceTier;
  cloudY: { value: number };
}

interface Volume {
  seed: number;
  position: readonly [number, number, number];
  bounds: readonly [number, number, number];
  volume: number;
  opacity: number;
  speed: number;
}

/**
 * Sixteen cloud volumes spread on a wide ring (radius ~75–170) plus four nearer ones, at
 * varied heights, so the deck reads as scattered cumulus from every chapter camera rather
 * than one clump behind the aircraft. Order matters: low tiers render only the first N.
 */
const VOLUMES: readonly Volume[] = [
  { seed: 69, position: [-30, -26, -31], bounds: [51, 10, 60], volume: 46, opacity: 0.80, speed: 0.09 },
  { seed: 11, position: [89, -16, -5], bounds: [66, 10, 70], volume: 48, opacity: 0.64, speed: 0.06 },
  { seed: 31, position: [-89, -12, 53], bounds: [98, 10, 59], volume: 53, opacity: 0.76, speed: 0.08 },
  { seed: 47, position: [9, -11, -169], bounds: [76, 10, 65], volume: 54, opacity: 0.64, speed: 0.06 },
  { seed: 23, position: [11, -25, 86], bounds: [104, 10, 56], volume: 53, opacity: 0.79, speed: 0.05 },
  { seed: 39, position: [-129, -13, -49], bounds: [91, 10, 82], volume: 46, opacity: 0.80, speed: 0.07 },
  { seed: 61, position: [40, -21, 33], bounds: [54, 10, 42], volume: 37, opacity: 0.68, speed: 0.07 },
  { seed: 55, position: [92, -19, -73], bounds: [106, 10, 81], volume: 59, opacity: 0.70, speed: 0.05 },
  { seed: 27, position: [-42, -32, 69], bounds: [72, 10, 75], volume: 50, opacity: 0.71, speed: 0.07 },
  { seed: 43, position: [-56, -10, -104], bounds: [110, 10, 68], volume: 54, opacity: 0.65, speed: 0.07 },
  { seed: 15, position: [109, -32, 41], bounds: [68, 10, 66], volume: 59, opacity: 0.66, speed: 0.04 },
  { seed: 65, position: [-25, -40, 22], bounds: [60, 10, 46], volume: 43, opacity: 0.82, speed: 0.08 },
  { seed: 35, position: [-102, -7, -8], bounds: [69, 10, 66], volume: 57, opacity: 0.67, speed: 0.06 },
  { seed: 51, position: [34, -32, -79], bounds: [101, 10, 55], volume: 45, opacity: 0.73, speed: 0.08 },
  { seed: 19, position: [76, -18, 146], bounds: [82, 10, 86], volume: 42, opacity: 0.84, speed: 0.05 },
  { seed: 73, position: [24, -38, -28], bounds: [66, 10, 39], volume: 36, opacity: 0.67, speed: 0.05 },
];

/**
 * Volumetric cloud deck. It sinks (cloudY) as we climb so the aircraft rises out of it,
 * and thins with altitude. Lower tiers render fewer volumes with fewer billboards each.
 */
export function CloudDeck({ tier, cloudY }: Props) {
  const group = useRef<THREE.Group>(null);
  const count = tier === "high" ? VOLUMES.length : tier === "mid" ? 12 : 7;
  const segments = tier === "high" ? 6 : tier === "mid" ? 5 : 4;
  const lastFade = useRef(-1);

  useFrame((state, dt) => {
    if (!group.current) return;
    const g = group.current;
    g.position.y += (cloudY.value - g.position.y) * (1 - Math.pow(0.001, dt));
    const fade = 1 - THREE.MathUtils.smoothstep(flight.alt, 0.4, 0.74);
    g.visible = fade > 0.01;
    // The opacity walk touches every mesh; only do it when the fade has actually moved.
    if (Math.abs(fade - lastFade.current) > 0.004) {
      lastFade.current = fade;
      g.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material instanceof THREE.Material) o.material.opacity = fade;
      });
    }
    g.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 4 + flight.pointer.x * -3;
  });

  return (
    // Starts where the deck currently belongs, so a remount mid-climb does not sink in from the hero height.
    <group ref={group} position={[0, cloudY.value, 0]}>
      <Clouds material={THREE.MeshBasicMaterial} limit={400} range={400} texture={CLOUD_TEXTURE}>
        {VOLUMES.slice(0, count).map((v) => (
          <Cloud
            key={v.seed}
            seed={v.seed}
            segments={segments}
            bounds={[v.bounds[0], v.bounds[1], v.bounds[2]]}
            volume={v.volume}
            color="#ffffff"
            opacity={v.opacity}
            speed={v.speed}
            fade={40}
            position={[v.position[0], v.position[1], v.position[2]]}
            growth={12}
            concentrate="random"
          />
        ))}
      </Clouds>
    </group>
  );
}
