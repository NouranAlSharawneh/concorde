"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { flight } from "@/lib/flight-state";
import { sunDirection } from "@/lib/sun";
import { samplePalette } from "@/lib/altitude";

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uHaze;
  uniform float uSun; uniform float uAlt; uniform float uTime; uniform vec2 uRes; uniform vec2 uPointer;
  uniform vec2 uSunPos; uniform float uSunVis;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    // Horizon curvature grows with altitude: at 60,000 ft you can see the Earth bend.
    float curve = (uv.x - 0.5) * (uv.x - 0.5) * 0.35 * uAlt;
    float h = uv.y + curve;
    float g = smoothstep(0.0, 1.0, h);
    g = pow(g, mix(0.9, 1.6, uAlt));
    vec3 col = mix(uBottom, uTop, g);

    // Sun: a fixed WORLD direction projected onto the screen each frame (uSunPos), so it stays
    // where it belongs as the camera moves and disappears when the camera looks away (uSunVis).
    vec2 sunPos = uSunPos + uPointer * 0.01;
    vec2 d = (uv - sunPos) * vec2(aspect, 1.0);
    float dist = length(d);
    float disc = smoothstep(0.05, 0.012, dist) * 0.8;
    float glow = exp(-dist * 7.0) * 0.42 + exp(-dist * 2.4) * 0.14;
    // Higher up the air is thin: the sun's glow tightens and turns white-blue instead of warm.
    vec3 sunCol = mix(mix(uHaze, vec3(1.0), 0.35), vec3(0.92, 0.96, 1.0), uAlt);
    // The sun sets below the horizon as we reach the edge of space.
    float sunUp = 1.0 - smoothstep(0.78, 0.93, uAlt);
    float sunAmt = uSun * sunUp * uSunVis;
    col += sunCol * glow * mix(0.85, 0.4, uAlt) * sunAmt;
    col = mix(col, vec3(1.0, 0.98, 0.93), disc * 0.9 * sunAmt);

    // Thin haze band along the horizon, strongest at low altitude; cools off as we climb.
    float haze = exp(-abs(h - 0.2) * 10.0) * (1.0 - smoothstep(0.0, 0.5, uAlt));
    vec3 hazeCol = mix(uHaze, uBottom, 0.35);
    col = mix(col, hazeCol, haze * 0.3);

    // Very soft high cirrus drift
    float cir = fbm(vec2(uv.x * 3.0 + uTime * 0.01, uv.y * 6.0)) * smoothstep(0.3, 0.75, h);
    col += cir * 0.06 * (1.0 - uAlt);

    // Dither to kill banding
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function SkyBackdrop() {
  const size = useThree((s) => s.size);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uHaze: { value: new THREE.Color() },
      uSun: { value: 1 },
      uAlt: { value: 0 },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uSunPos: { value: new THREE.Vector2(0.78, 0.62) },
      uSunVis: { value: 1 },
    }),
    [],
  );
  const sun = useMemo(() => ({ dir: new THREE.Vector3(), p: new THREE.Vector3(), fwd: new THREE.Vector3() }), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __sky?: unknown }).__sky = uniforms;
  }, [uniforms]);

  useFrame((state, dt) => {
    const p = samplePalette(flight.alt);
    // Project the world sun direction to screen space. Points behind the camera mirror under
    // projection, so gate on the forward dot and fade the disc as it leaves the frame.
    const cam = state.camera;
    sunDirection(flight.alt, sun.dir);
    cam.getWorldDirection(sun.fwd);
    const facing = sun.fwd.dot(sun.dir);
    if (facing > 0.05) {
      sun.p.copy(cam.position).addScaledVector(sun.dir, 5000).project(cam);
      uniforms.uSunPos.value.set(sun.p.x * 0.5 + 0.5, sun.p.y * 0.5 + 0.5);
      uniforms.uSunVis.value = THREE.MathUtils.smoothstep(facing, 0.05, 0.25);
    } else {
      uniforms.uSunVis.value = 0;
    }
    // Palette values are sRGB; the shader works in linear, and the renderer encodes back to sRGB on output.
    uniforms.uTop.value.setRGB(p.skyTop[0], p.skyTop[1], p.skyTop[2], THREE.SRGBColorSpace);
    uniforms.uBottom.value.setRGB(p.skyBottom[0], p.skyBottom[1], p.skyBottom[2], THREE.SRGBColorSpace);
    uniforms.uHaze.value.setRGB(p.haze[0], p.haze[1], p.haze[2], THREE.SRGBColorSpace);
    uniforms.uSun.value = p.sun;
    uniforms.uAlt.value = flight.alt;
    uniforms.uTime.value += dt;
    uniforms.uRes.value.set(size.width, size.height);
    uniforms.uPointer.value.lerp({ x: flight.pointer.x, y: -flight.pointer.y } as THREE.Vector2, 0.05);
  });

  // Own the material: R3F clones a `uniforms` prop, which would detach the scalar uniforms updated above.
  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, depthWrite: false, depthTest: false }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh frustumCulled={false} renderOrder={-100} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
