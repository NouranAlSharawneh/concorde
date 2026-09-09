"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { flight } from "@/lib/flight-state";
import { samplePalette } from "@/lib/altitude";

const vert = /* glsl */ `
  attribute float aSize; attribute float aPhase;
  uniform float uTime; uniform float uOpacity; uniform float uPixelRatio;
  varying float vA;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 6.28);
    vA = uOpacity * tw;
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vA;
    gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), a);
  }
`;

export function StarField({ count = 2600 }: { count?: number }) {
  const { geometry, uniforms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Hemisphere dome above the aircraft
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(1 - v * 0.95);
      const r = 420 + Math.random() * 80;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) - 40;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      size[i] = 0.7 + Math.pow(Math.random(), 3) * 3.2;
      phase[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return {
      geometry: g,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: 1 } },
    };
  }, [count]);

  useFrame((state, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uOpacity.value = samplePalette(flight.alt).stars;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-50} />;
}
