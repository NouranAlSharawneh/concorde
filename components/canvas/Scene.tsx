"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Concorde, type ConcordeHandle } from "./Concorde";
import { SkyBackdrop } from "./SkyBackdrop";
import { StarField } from "./StarField";
import { CloudDeck } from "./CloudDeck";
import { Exhaust } from "./Exhaust";
import { CameraRig } from "./CameraRig";
import { GhostWordmark } from "./GhostWordmark";
import { HeroClouds } from "./HeroClouds";
import type { DeviceTier } from "@/lib/device";
import { flight } from "@/lib/flight-state";
import { sunDirection } from "@/lib/sun";

interface Props {
  tier: DeviceTier;
  reducedMotion: boolean;
}

/** Lighting that follows altitude: bright warm daylight at the deck, cool dim starlight at 60,000 ft. */
function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const bounce = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const tmp = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const alt = flight.alt;
    const night = THREE.MathUtils.smoothstep(alt, 0.5, 0.9); // 0 day → 1 night
    const L = THREE.MathUtils.lerp;
    if (sun.current) {
      sun.current.intensity = L(2.3, 0.42, night); // at night this is the moon: cool, raking, shapes the airframe
      sun.current.color.copy(tmp.a.set("#fff3e0").lerp(tmp.b.set("#9fb4ff"), night));
      // Same direction as the sky's sun disc, so highlights and the visible sun agree.
      sun.current.position.copy(sunDirection(alt, tmpDir)).multiplyScalar(120);
    }
    if (fill.current) fill.current.intensity = L(0.7, 0.1, night);
    if (bounce.current) bounce.current.intensity = L(0.9, 0.14, night);
    if (rim.current) {
      rim.current.intensity = L(0, 2.3, night);
      rim.current.color.copy(tmp.a.set("#dfe8ff"));
    }
    if (hemi.current) {
      hemi.current.intensity = L(1.6, 0.22, night);
      hemi.current.color.copy(tmp.a.set("#ffffff").lerp(tmp.b.set("#2a3d6e"), night));
      hemi.current.groundColor.copy(tmp.a.set("#cfe2f6").lerp(tmp.b.set("#05070f"), night));
    }
    scene.environmentIntensity = L(0.55, 0.16, night); // enough for specular glints on the skin
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#cfe2f6", 1.6]} />
      <directionalLight ref={sun} position={[80, 60, -40]} intensity={2.3} color="#fff3e0" />
      <directionalLight ref={fill} position={[-60, 20, 60]} intensity={0.7} color="#bcd6ff" />
      {/* Sky bounce from below so the belly never reads as a grey slab. */}
      <directionalLight ref={bounce} position={[0, -50, -30]} intensity={0.9} color="#d9ebff" />
      {/* Night rim: cold starlight from high behind, silhouetting the airframe. */}
      <directionalLight ref={rim} position={[-30, 90, 60]} intensity={0} color="#dfe8ff" />
    </>
  );
}

/** Pauses the render loop while the tab is hidden. */
function VisibilityGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setFrameloop]);
  return null;
}

export default function Scene({ tier, reducedMotion }: Props) {
  // Dev-only layer isolation: ?debug=sky | nocloud | noexhaust
  const debug = typeof window !== "undefined" && process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("debug") : null;
  const aircraft = useRef<THREE.Group>(null);
  const handle = useRef<ConcordeHandle | null>(null);
  const burner = useMemo(() => ({ value: 0 }), []);
  const contrail = useMemo(() => ({ value: 0 }), []);
  const cloudY = useMemo(() => ({ value: -4 }), []);
  const [dpr, setDpr] = useState<number>(tier === "high" ? 1.5 : tier === "mid" ? 1.25 : 1);
  const onReady = useCallback((h: ConcordeHandle) => {
    handle.current = h;
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop="always"
      gl={{ antialias: tier !== "high", powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ position: [-12.5, -2.5, -39.5], fov: 36, near: 0.5, far: 1200 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      eventSource={undefined}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(tier === "high" ? 1.75 : tier === "mid" ? 1.25 : 1, d + 0.25))}
      />
      <VisibilityGate />
      <SkyBackdrop />
      {debug !== "nostars" && debug !== "skyonly" && <StarField count={tier === "low" ? 2000 : tier === "mid" ? 4200 : 5200} />}
      <Lights />
      {debug !== "sky" && debug !== "nostars" && debug !== "skyonly" && (
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          {/* Procedural sky: bright dome above, soft ground bounce below, warm sun to the right. */}
          <Lightformer form="ring" intensity={3} color="#fff1dc" position={[30, 20, -10]} scale={12} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.2} color="#dfefff" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
          <Lightformer form="rect" intensity={0.5} color="#9fc4ea" position={[0, -30, 0]} rotation-x={-Math.PI / 2} scale={[80, 80, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#bcd8f5" position={[-40, 5, 0]} rotation-y={Math.PI / 2} scale={[60, 30, 1]} />
        </Environment>
        <GhostWordmark />
        <Concorde ref={aircraft} onReady={onReady}>
          {debug !== "noexhaust" && <Exhaust burner={burner} contrail={contrail} />}
        </Concorde>
        {debug !== "nocloud" && <CloudDeck tier={tier} cloudY={cloudY} />}
        {debug !== "nocloud" && <HeroClouds tier={tier} />}
      </Suspense>
      )}
      <CameraRig aircraft={aircraft} handle={handle} burner={burner} contrail={contrail} cloudY={cloudY} reducedMotion={reducedMotion} />
      {tier === "high" && (
        <EffectComposer multisampling={4}>
          <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.15} intensity={0.5} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.35} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
