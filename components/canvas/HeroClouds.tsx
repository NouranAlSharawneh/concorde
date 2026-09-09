"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { flight } from "@/lib/flight-state";
import type { DeviceTier } from "@/lib/device";

interface Props {
  tier: DeviceTier;
}

/**
 * Foreground cloud in the bottom corners of the hero frame. The group follows the camera
 * (with a little lag, so it drifts rather than sticking to the lens) and fades as we climb.
 */
export function HeroClouds({ tier }: Props) {
  const group = useRef<THREE.Group>(null);
  const segments = tier === "high" ? 12 : tier === "mid" ? 8 : 5;
  const targetQ = useMemo(() => new THREE.Quaternion(), []);
  const fade = useRef(0);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const cam = state.camera;
    const k = 1 - Math.pow(0.02, dt);
    g.position.lerp(cam.position, k);
    targetQ.copy(cam.quaternion);
    g.quaternion.slerp(targetQ, k);
    const vis = (1 - THREE.MathUtils.smoothstep(flight.alt, 0.015, 0.08)) * (flight.chapter === "hero" ? 1 : 0);
    fade.current += (vis - fade.current) * (1 - Math.pow(0.01, dt));
    g.visible = fade.current > 0.01;
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.Material) o.material.opacity = fade.current;
    });
  });

  // Camera space: -z forward. At ~48 units with a 36° lens the frame corners sit near (±25, ±15.5).
  return (
    <group ref={group}>
      <Clouds material={THREE.MeshBasicMaterial} limit={200} range={200}>
        <Cloud seed={5} segments={segments} bounds={[36, 9, 24]} volume={38} color="#ffffff" opacity={0.85} speed={0.12} fade={60} position={[-30, -19, -50]} growth={9} concentrate="outside" />
        <Cloud seed={9} segments={segments} bounds={[40, 10, 26]} volume={40} color="#fbfdff" opacity={0.8} speed={0.1} fade={70} position={[30, -20, -48]} growth={9} concentrate="outside" />
        <Cloud seed={13} segments={Math.round(segments * 0.5)} bounds={[22, 6, 16]} volume={16} color="#ffffff" opacity={0.28} speed={0.14} fade={50} position={[4, -26, -60]} growth={8} />
      </Clouds>
    </group>
  );
}
