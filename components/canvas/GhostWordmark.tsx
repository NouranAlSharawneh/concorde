"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { flight } from "@/lib/flight-state";

/** Giant "CONCORDE" floating in the sky behind the aircraft during the hero. */
export function GhostWordmark() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const fwd = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    // Always centred in view, far behind the aircraft, whatever the hero camera does.
    state.camera.getWorldDirection(fwd);
    up.set(0, 1, 0).applyQuaternion(state.camera.quaternion);
    // Centred horizontally, sitting in the upper third of the frame above the headline.
    const cam = state.camera as THREE.PerspectiveCamera;
    const dist = 150;
    // Fit to the frame: on a narrow (portrait) viewport the word is far wider than the visible
    // width at this distance, so it would crop. Scale it to sit just inside the frame instead.
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * dist;
    const visibleW = halfH * 2 * (state.size.width / state.size.height);
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    const naturalW = bb ? bb.max.x - bb.min.x : 90;
    const fit = naturalW > 0 ? Math.min(1, (visibleW * 0.94) / naturalW) : 1;
    m.scale.setScalar(fit);
    const lift = 23 * fit + (1 - fit) * 12; // keep it clear of the headline once it shrinks
    m.position.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(up, lift + Math.sin(state.clock.elapsedTime * 0.3) * 0.8);
    m.lookAt(cam.position);
    const vis = (1 - THREE.MathUtils.smoothstep(flight.alt, 0.02, 0.1)) * (flight.chapter === "hero" ? 1 : 0);
    if (mat.current) mat.current.opacity += (vis * 0.34 - mat.current.opacity) * (1 - Math.pow(0.01, dt));
    m.visible = (mat.current?.opacity ?? 0) > 0.005;
  });

  return (
    <Text
      ref={ref}
      font="/fonts/archivo-expanded-800.ttf"
      fontSize={15.5}
      letterSpacing={-0.02}
      anchorX="center"
      anchorY="middle"
      renderOrder={-10}
    >
      CONCORDE
      <meshBasicMaterial ref={mat} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
    </Text>
  );
}
