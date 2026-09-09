"use client";

import { useLayoutEffect, useMemo, useRef, forwardRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";

export const MODEL_URL = "/models/concorde.glb";

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.MeshStandardMaterial>;
};

/** Meshes that belong to the landing gear (hidden when gear is up). */
const GEAR_NODES = new Set(["Object_27", "Object_29", "Object_31", "Object_57", "Object_59"]); // legs, wheels + bay doors

/** Droop-nose hinge in model space (just ahead of the cockpit windscreen). */
const NOSE_PIVOT = new THREE.Vector2(2.6, -21.6); // (y, z)
export const NOSE_MAX_RAD = (12.5 * Math.PI) / 180;

/** Engine nozzle positions in model space for afterburner glow + contrails. */
/** Olympus 593 nozzle exit centres, measured from the model's nozzle discs (Object_21). */
export const NOZZLES: ReadonlyArray<readonly [number, number, number]> = [
  [-5.85, 0.61, 13.4],
  [-4.55, 0.61, 13.4],
  [4.55, 0.61, 13.4],
  [5.85, 0.61, 13.4],
];

/** Model centre so the aircraft pivots around its own middle. */
export const MODEL_OFFSET: readonly [number, number, number] = [0, -2.9, 1.6];

export interface ConcordeUniforms {
  uDroop: { value: number };
  uHeat: { value: number };
  uTime: { value: number };
}

export interface ConcordeHandle {
  group: THREE.Group;
  uniforms: ConcordeUniforms;
  /** 0 = retracted, 1 = fully extended — continuous so it can be damped. */
  setGear: (amount: number) => void;
  /** 0 = fully visible, 1 = hidden (faded out). */
  setHidden: (amount: number) => void;
}

interface Props {
  onReady?: (handle: ConcordeHandle) => void;
  /** Effects that must move with the airframe (exhaust, contrails). */
  children?: React.ReactNode;
}

/**
 * The aircraft. All materials get a vertex-shader droop-nose (vertices forward of the
 * hinge rotate down by uDroop) and a subtle Mach-2 heat shimmer.
 */
export const Concorde = forwardRef<THREE.Group, Props>(function Concorde({ onReady, children }, ref) {
  const { scene } = useGLTF(MODEL_URL, false, true) as unknown as GLTFResult;
  const inner = useRef<THREE.Group>(null);

  const uniforms = useMemo<ConcordeUniforms>(
    () => ({ uDroop: { value: 0 }, uHeat: { value: 0 }, uTime: { value: 0 } }),
    [],
  );

  const prepared = useMemo(() => {
    const source = scene.clone(true);
    source.updateMatrixWorld(true);
    // Bake every node transform into its geometry so all meshes share ONE aircraft space.
    // The droop-nose vertex shader hinges around a point in that space; without this each
    // mesh (which ships with its own offset/scale) would bend around a different hinge and tear.
    const root = new THREE.Group();
    const gearGroup = new THREE.Group();
    gearGroup.name = "gear";
    root.add(gearGroup);
    const gear: THREE.Mesh[] = [];
    const seen = new Set<THREE.Material>();
    const meshes: THREE.Mesh[] = [];
    source.traverse((obj) => {
      if (obj instanceof THREE.Mesh) meshes.push(obj);
    });
    meshes.forEach((src) => {
      // Positions/normals ship quantised (int16, dequantised by the node transform). Promote them
      // to float32 first, otherwise baking would clamp the transformed values back into int16 range.
      const geometry = src.geometry.clone();
      (["position", "normal", "tangent"] as const).forEach((name) => {
        const attr = geometry.getAttribute(name);
        if (!attr || !(attr instanceof THREE.BufferAttribute) && !(attr instanceof THREE.InterleavedBufferAttribute)) return;
        const size = attr.itemSize;
        const out = new Float32Array(attr.count * size);
        for (let i = 0; i < attr.count; i++) {
          out[i * size] = attr.getX(i);
          if (size > 1) out[i * size + 1] = attr.getY(i);
          if (size > 2) out[i * size + 2] = attr.getZ(i);
          if (size > 3) out[i * size + 3] = attr.getW(i);
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(out, size));
      });
      geometry.applyMatrix4(src.matrixWorld);
      const obj = new THREE.Mesh(geometry, src.material);
      obj.name = src.name;
      (GEAR_NODES.has(obj.name) ? gearGroup : root).add(obj);
    });
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.frustumCulled = false;
      if (GEAR_NODES.has(obj.name)) gear.push(obj);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial) || seen.has(m)) return;
        seen.add(m);
        m.envMapIntensity = 1.1;
        if (m.name === "Glass") {
          // Cockpit glazing: dark tinted, glossy — never a white blow-out.
          m.color.set("#0b1624");
          m.transparent = true;
          m.opacity = 0.92;
          m.roughness = 0.12;
          m.metalness = 0.85;
          m.envMapIntensity = 0.8;
        }
        if (m.name !== "Glass") {
          // The export ships fully metallic maps, which turn the white livery into a dark mirror
          // of the environment. Painted aluminium: mostly dielectric, slightly glossy.
          m.metalnessMap = null;
          m.roughnessMap = null;
          m.metalness = m.name === "Fuselage" ? 0.12 : 0.25;
          m.roughness = m.name === "Fuselage" ? 0.42 : 0.5;
          m.envMapIntensity = 0.9;
        }
        m.onBeforeCompile = (shader) => {
          shader.uniforms.uDroop = uniforms.uDroop;
          shader.uniforms.uHeat = uniforms.uHeat;
          shader.uniforms.uTime = uniforms.uTime;
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              `#include <common>
               uniform float uDroop; uniform float uHeat; uniform float uTime;
               const vec2 NOSE_PIVOT = vec2(${NOSE_PIVOT.x.toFixed(2)}, ${NOSE_PIVOT.y.toFixed(2)});
               vec3 droopNose(vec3 p) {
                 float ahead = smoothstep(0.0, -3.0, p.z - NOSE_PIVOT.y);
                 if (ahead <= 0.0) return p;
                 float a = uDroop * ahead;
                 float c = cos(a), s = sin(a);
                 vec2 r = p.yz - NOSE_PIVOT;
                 // rotate in the y/z plane so the tip goes down (+y is up, nose is -z)
                 vec2 q = vec2(r.x * c + r.y * s, -r.x * s + r.y * c);
                 return vec3(p.x, q + NOSE_PIVOT);
               }`,
            )
            .replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
               // Apply droop in object space before any world transform.
               vec3 dp = droopNose(transformed);
               dp.x += uHeat * 0.02 * sin(uTime * 9.0 + dp.z * 0.8);
               transformed = dp;`,
            )
            .replace(
              "#include <beginnormal_vertex>",
              `#include <beginnormal_vertex>
               {
                 float ahead = smoothstep(0.0, -3.0, position.z - NOSE_PIVOT.y);
                 float a = uDroop * ahead; float c = cos(a), s = sin(a);
                 objectNormal = vec3(objectNormal.x, objectNormal.y * c + objectNormal.z * s, -objectNormal.y * s + objectNormal.z * c);
               }`,
            );
        };
        m.needsUpdate = true;
      });
    });
    const materials = Array.from(seen);
    return { root, gear, gearGroup, materials };
  }, [scene, uniforms]);

  useLayoutEffect(() => {
    if (!inner.current) return;
    const { gearGroup, materials } = prepared;
    // Gear retracts by compressing toward the belly line while fading out, so that from
    // beneath no flattened tyre or door is ever left lying on the fuselage.
    const GEAR_PIVOT_Y = 0.4;
    const GEAR_MATS = new Set(["nosegear", "main_gear", "wheel"]);
    let lastHidden = -1;
    let gearAlpha = 1;
    let hiddenAmt = 0;
    const applyGearMaterials = () => {
      const a = gearAlpha * (1 - hiddenAmt);
      materials.forEach((m) => {
        if (!GEAR_MATS.has(m.name)) return;
        m.transparent = a < 0.999;
        m.opacity = a;
        m.depthWrite = a > 0.5;
      });
    };
    const handle: ConcordeHandle = {
      group: inner.current,
      uniforms,
      setGear: (amount) => {
        const g = THREE.MathUtils.clamp(amount, 0, 1);
        const e = g * g * (3 - 2 * g);
        gearAlpha = THREE.MathUtils.smoothstep(g, 0.04, 0.4);
        gearGroup.visible = gearAlpha > 0.002;
        // Compress toward the pivot (never above the fuselage) and shrink the footprint as it goes.
        const xz = 0.35 + 0.65 * e;
        gearGroup.scale.set(xz, 0.04 + 0.96 * e, xz);
        gearGroup.position.y = GEAR_PIVOT_Y * (1 - gearGroup.scale.y);
        applyGearMaterials();
      },
      setHidden: (amount) => {
        const h = THREE.MathUtils.clamp(amount, 0, 1);
        if (Math.abs(h - lastHidden) < 0.002) return;
        lastHidden = h;
        const visible = h < 0.995;
        if (inner.current) inner.current.visible = visible;
        hiddenAmt = h;
        materials.forEach((m) => {
          if (GEAR_MATS.has(m.name)) return; // gear composes its own alpha below
          const glass = m.name === "Glass";
          m.transparent = glass || h > 0.001;
          m.opacity = (glass ? 0.92 : 1) * (1 - h);
          m.depthWrite = h < 0.5;
        });
        applyGearMaterials();
      },
    };
    handle.setGear(0);
    handle.setHidden(0);
    onReady?.(handle);
  }, [onReady, prepared, uniforms]);

  return (
    <group ref={ref}>
      <group ref={inner} position={MODEL_OFFSET}>
        <primitive object={prepared.root} />
      </group>
      {children}
    </group>
  );
});

useGLTF.preload(MODEL_URL, false, true);
