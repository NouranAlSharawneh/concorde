"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { NOZZLES } from "./Concorde";
import { flight } from "@/lib/flight-state";

const trailVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const trailFrag = /* glsl */ `
  varying vec2 vUv; uniform float uTime; uniform float uAmount; uniform vec3 uColor; uniform float uNight;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
  void main(){
    float along = vUv.y;            // 0 at nozzle → 1 at far end
    float across = (vUv.x - 0.5) * 2.0;
    // The plume starts as a tight core and diffuses into a wide, soft cloud toward the tail.
    float width = mix(0.10, 1.0, pow(along, 0.55));
    float n = noise(vec2(vUv.x * 2.0, along * 9.0 - uTime * 1.6)) * 0.5 + noise(vec2(vUv.x * 5.0, along * 26.0 - uTime * 3.0)) * 0.5;
    float wobble = (n - 0.5) * 0.35 * along;
    float x = (across + wobble) / max(width, 1e-3);
    float body = exp(-x * x * 2.2);                      // gaussian cross-section: no hard edges
    float density = (1.0 - along) * (1.0 - along);       // thins out quadratically with length
    density *= smoothstep(0.0, 0.05, along);
    float a = body * density * (0.7 + 0.3 * n) * uAmount;
    // Contrails are lit by the sky: bright white by day, a faint cool veil at night.
    vec3 col = mix(uColor, vec3(0.62, 0.70, 0.9), uNight);
    gl_FragColor = vec4(col, a * mix(0.75, 0.32, uNight));
  }
`;

interface Props {
  burner: { value: number };
  contrail: { value: number };
}

/** Afterburner glow sprites at the four Olympus 593 nozzles + long contrails at altitude. */
export function Exhaust({ burner, contrail }: Props) {
  const glowRefs = useRef<THREE.Sprite[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);

  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,248,230,1)");
      g.addColorStop(0.18, "rgba(255,205,110,0.95)");
      g.addColorStop(0.45, "rgba(255,130,50,0.55)");
      g.addColorStop(0.75, "rgba(255,90,30,0.18)");
      g.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Plume texture: bright at the nozzle (left), tapering to transparent orange at the tip (right).
  const plumeTex = useMemo(() => {
    const w = 128;
    const h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (ctx) {
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = x / (w - 1); // along the plume
          const v = (y / (h - 1) - 0.5) * 2; // across, -1..1
          const core = Math.exp(-v * v * (10 + 26 * u)); // narrows toward the tip
          const along = Math.pow(1 - u, 1.35);
          const a = core * along;
          const i = (y * w + x) * 4;
          // white-hot → amber → deep orange along the length
          img.data[i] = 255;
          img.data[i + 1] = Math.round(245 - 120 * u);
          img.data[i + 2] = Math.round(215 - 190 * u);
          img.data[i + 3] = Math.round(255 * Math.min(1, a));
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const plumeRefs = useRef<THREE.Mesh[]>([]);
  // Unit-length plane anchored at x = 0 so scaling x grows the plume aft from the nozzle.
  const plumeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1.5, 1, 1);
    g.translate(0.5, 0, 0);
    return g;
  }, []);
  useEffect(() => () => plumeGeo.dispose(), [plumeGeo]);
  const coreRefs = useRef<THREE.Sprite[]>([]);
  const trailRefs = useRef<THREE.Mesh[]>([]);

  const trailUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmount: { value: 0 }, uColor: { value: new THREE.Color("#ffffff") }, uNight: { value: 0 } }),
    [],
  );

  const trailMaterial = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: trailVert, fragmentShader: trailFrag, uniforms: trailUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    [trailUniforms],
  );
  useEffect(() => () => trailMaterial.dispose(), [trailMaterial]);

  useFrame((state, dt) => {
    trailUniforms.uTime.value += dt;
    trailUniforms.uAmount.value = contrail.value;
    trailUniforms.uNight.value = THREE.MathUtils.smoothstep(flight.alt, 0.55, 0.95);
    const flicker = 0.85 + Math.sin(state.clock.elapsedTime * 37) * 0.08 + Math.sin(state.clock.elapsedTime * 61) * 0.07;
    const b = burner.value * flicker;
    // Everything the burner drives is hidden outright when it is off, so the cold chapters (hero,
    // anatomy, legacy) do not rasterise eight additive sprites and eight plume planes of nothing.
    const lit = b > 0.01;
    coreRefs.current.forEach((s, i) => {
      if (!s) return;
      s.visible = lit;
      if (!lit) return;
      const f = 1 + Math.sin(state.clock.elapsedTime * 61 + i * 1.7) * 0.08;
      s.scale.setScalar((1.1 + b * 0.9) * f);
      (s.material as THREE.SpriteMaterial).opacity = Math.min(1, b * 1.4);
    });
    plumeRefs.current.forEach((m, i) => {
      if (!m) return;
      const f = 1 + Math.sin(state.clock.elapsedTime * 47 + i * 2.3) * 0.1;
      m.scale.set((0.4 + b * 4.8) * f, 1, 1); // length runs along local x (anchored at the nozzle)
      (m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, b * 1.2) * 0.9;
      m.visible = b > 0.02;
    });
    glowRefs.current.forEach((s, i) => {
      if (!s) return;
      s.visible = lit;
      if (!lit) return;
      // Wide, faint halo only — the heat is carried by the core + plume.
      s.scale.setScalar(2.4 + b * 2.6 + Math.sin(state.clock.elapsedTime * 50 + i) * 0.2 * b);
      (s.material as THREE.SpriteMaterial).opacity = Math.min(1, b * 1.1) * 0.32;
    });
    if (lightRef.current) lightRef.current.intensity = burner.value * 48;
    // Likewise the four double-sided contrail planes: large, transparent, and empty until there is a contrail.
    const trailing = contrail.value > 0.01;
    trailRefs.current.forEach((m) => {
      if (m) m.visible = trailing;
    });
  });

  return (
    <group position={[0, -2.9, 1.6]}>
      {NOZZLES.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) glowRefs.current[i] = el;
          }}
          position={[p[0], p[1], p[2] + 1.2]}
        >
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} toneMapped={false} />
        </sprite>
      ))}
      {NOZZLES.map((p, i) => (
        <sprite
          key={`c${i}`}
          ref={(el) => {
            if (el) coreRefs.current[i] = el;
          }}
          position={[p[0], p[1], p[2] + 0.6]}
        >
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} toneMapped={false} color="#fff6dc" />
        </sprite>
      ))}
      {/* Directional plume: two crossed planes per nozzle, length along +z (aft), additive, flickering. */}
      {NOZZLES.map((p, i) => (
        <group key={`p${i}`} position={[p[0], p[1], p[2] + 0.4]} rotation={[0, -Math.PI / 2, 0]}>
          {[0, Math.PI / 2].map((rx, k) => (
            <mesh
              key={k}
              ref={(el) => {
                if (el) plumeRefs.current[i * 2 + k] = el;
              }}
              geometry={plumeGeo}
              rotation={[rx, 0, 0]}
              renderOrder={9}
            >
              <meshBasicMaterial map={plumeTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} opacity={0} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight ref={lightRef} position={[0, 0.6, 15]} color="#ffb070" intensity={0} distance={44} decay={2} />
      {NOZZLES.map((p, i) => (
        <mesh
          key={`t${i}`}
          ref={(el) => {
            if (el) trailRefs.current[i] = el;
          }}
          position={[p[0], p[1], p[2] + 110]}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={10}
          material={trailMaterial}
        >
          <planeGeometry args={[9, 220, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
