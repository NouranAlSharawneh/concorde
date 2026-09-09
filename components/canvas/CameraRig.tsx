"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { flight, useUI } from "@/lib/flight-state";
import { CHAPTER_ORDER, ENTER, HOLD, LINEAR, keysFor, type Pose } from "@/lib/camera-keyframes";

/** Dev-only: ?pose=cx,cy,cz,lx,ly,lz,fov,pitchDeg,yawDeg,rollDeg overrides the hero pose for tuning. */
function devHeroPose(): Partial<Pose> | null {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return null;
  const raw = new URLSearchParams(window.location.search).get("pose");
  if (!raw) return null;
  const n = raw.split(",").map(Number);
  if (n.length < 10 || n.some((v) => Number.isNaN(v))) return null;
  const d = (deg: number) => (deg * Math.PI) / 180;
  return { cam: [n[0], n[1], n[2]], look: [n[3], n[4], n[5]], fov: n[6], rot: [d(n[7]), d(n[8]), d(n[9])] };
}
import { NOSE_MAX_RAD, type ConcordeHandle } from "./Concorde";
import { tweaks } from "@/lib/tweaks";
import { gsap } from "@/lib/gsap";

const D2R = Math.PI / 180;

interface Props {
  aircraft: React.RefObject<THREE.Group | null>;
  handle: React.RefObject<ConcordeHandle | null>;
  burner: { value: number };
  contrail: { value: number };
  cloudY: { value: number };
  reducedMotion: boolean;
}

const ease = (t: number): number => t * t * (3 - 2 * t);

/** Interpolates the chapter shots and damps camera + aircraft toward them every frame. */
export function CameraRig({ aircraft, handle, burner, contrail, cloudY, reducedMotion }: Props) {
  const target = useMemo(
    () => ({
      cam: new THREE.Vector3(),
      look: new THREE.Vector3(),
      rot: new THREE.Euler(),
      pos: new THREE.Vector3(),
      fov: 35,
      nose: 0,
      gear: 0,
    }),
    [],
  );
  const current = useMemo(
    () => ({
      cam: new THREE.Vector3(-12.5, -2.5, -39.5),
      look: new THREE.Vector3(0.35, -0.4, -23.6),
      rot: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      fov: 34,
      nose: 0.15,
      gear: 0,
      hide: 0,
    }),
    [],
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const devPose = useMemo(() => devHeroPose(), []);
  const devChapter = useMemo(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("poseChapter") ?? "hero" : "hero"),
    [],
  );

  // Entrance: once the preloader hands off, the aircraft comes in from far right, growing as it
  // approaches the viewer, and parks on the hero pose. `t` is tweened 0→1; 1 = no offset.
  const launched = useUI((s) => s.launched);
  const intro = useMemo(() => ({ t: 0 }), []);
  const introBasis = useMemo(() => ({ right: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3() }), []);
  useEffect(() => {
    if (!launched) return;
    if (reducedMotion) {
      intro.t = 1;
      return;
    }
    const tween = gsap.to(intro, { t: 1, duration: 4.6, ease: "power3.out" });
    return () => {
      tween.kill();
    };
  }, [launched, reducedMotion, intro]);

  useFrame((state, dt) => {
    const portrait = state.size.width / state.size.height < 0.88;
    let keys = keysFor(flight.chapter, portrait);
    if (devPose && flight.chapter === devChapter) keys = [{ ...keys[0], ...devPose }, { ...keys[0], ...devPose }];
    const tweaking = tweaks.active && flight.chapter === tweaks.chapter;
    if (tweaking) {
      // #tweaks panel: hold the chapter on the edited pose so it can be judged live.
      const tp = tweaks.pose;
      const edited: Pose = {
        ...keys[0],
        cam: tp.cam,
        look: tp.look,
        fov: tp.fov,
        rot: [tp.rot[0] * D2R, tp.rot[1] * D2R, tp.rot[2] * D2R],
        pos: tp.pos,
        nose: tp.nose,
        flyout: false,
      };
      keys = [edited, edited];
    }
    const p = THREE.MathUtils.clamp(flight.chapterProgress, 0, 0.99999);
    const segs = Math.max(1, keys.length - 1);
    const seg = Math.min(segs - 1, Math.floor(p * segs));
    const hold = HOLD[flight.chapter] ?? 0;
    const local = p * segs - seg;
    const segT = THREE.MathUtils.clamp((local - hold) / (1 - hold), 0, 1);
    const t = keys.length < 2 ? 0 : LINEAR[flight.chapter] ? segT : ease(segT);
    const a: Pose = keys[seg];
    const b: Pose = keys[Math.min(keys.length - 1, seg + 1)];
    const L = THREE.MathUtils.lerp;

    target.cam.set(L(a.cam[0], b.cam[0], t), L(a.cam[1], b.cam[1], t), L(a.cam[2], b.cam[2], t));
    target.look.set(L(a.look[0], b.look[0], t), L(a.look[1], b.look[1], t), L(a.look[2], b.look[2], t));
    // Aircraft position. Normal keys blend. Entering a fly-out key flies the aircraft out fast at
    // the END of the segment; a fly-out key holds it parked; and when a chapter follows a parked
    // chapter, the aircraft sweeps in during that chapter's OPENING (never over the previous one).
    let tPos = t;
    if (b.flyout && !a.flyout) {
      // Depart only at the very end, accelerating all the way out (no slow-down in view).
      // Window ends at 0.82 so the aircraft is gone before the next section's DOM (e.g. the globe) scrolls in.
      const u = THREE.MathUtils.clamp((local - 0.5) / 0.32, 0, 1);
      tPos = u * u * u;
    }
    else if (a.flyout && !b.flyout) tPos = 0; // stay parked until the next chapter takes over
    else if (a.flyout && b.flyout) tPos = local < 0.5 ? 0 : 1; // teleport while off-frame
    target.pos.set(L(a.pos[0], b.pos[0], tPos), L(a.pos[1], b.pos[1], tPos), L(a.pos[2], b.pos[2], tPos));
    if (seg === 0 && !a.flyout && !tweaking) {
      const prevId = CHAPTER_ORDER[CHAPTER_ORDER.indexOf(flight.chapter) - 1];
      const prevKeys = prevId ? keysFor(prevId, portrait) : undefined;
      const prevLast = prevKeys ? prevKeys[prevKeys.length - 2] : undefined;
      if (prevLast?.flyout) {
        const enter = THREE.MathUtils.smoothstep(local, 0.0, ENTER[flight.chapter] ?? 0.18);
        target.pos.set(L(prevLast.pos[0], target.pos.x, enter), L(prevLast.pos[1], target.pos.y, enter), L(prevLast.pos[2], target.pos.z, enter));
      }
    }
    target.rot.set(L(a.rot[0], b.rot[0], t), L(a.rot[1], b.rot[1], t), L(a.rot[2], b.rot[2], t));
    target.fov = L(a.fov, b.fov, t);
    target.nose = L(a.nose, b.nose, t);
    target.gear = L(a.gear, b.gear, t);

    const k = reducedMotion ? 1 : 1 - Math.pow(0.004, dt); // ~ smooth dolly
    current.cam.lerp(target.cam, k);
    current.look.lerp(target.look, k);
    const offFrame = a.flyout && b.flyout;
    current.pos.lerp(target.pos, offFrame ? Math.min(1, k * 2.5) : k); // brisk but never a visible pop
    current.rot.x += (target.rot.x - current.rot.x) * k;
    current.rot.y += (target.rot.y - current.rot.y) * k;
    current.rot.z += (target.rot.z - current.rot.z) * k;
    current.fov += (target.fov - current.fov) * k;
    current.nose += (target.nose - current.nose) * k * 0.6;
    current.gear += (target.gear - current.gear) * k * 0.45;
    // Visibility is not something to blend across a chapter: decide it by the nearer key and fade fast.
    const hideTarget = t > 0.92 ? b.hide : a.hide;
    current.hide += (hideTarget - current.hide) * Math.min(1, k * 3);
    burner.value += (L(a.burner, b.burner, t) - burner.value) * k;
    flight.burner = burner.value;
    contrail.value += (L(a.contrail, b.contrail, t) - contrail.value) * k;
    cloudY.value = L(a.cloudY, b.cloudY, t);

    // Idle life: the aircraft is always flying. A slow orbital sway of the camera around the
    // aim point, a gentle bob and bank on the airframe, and pointer parallax — all off for reduced motion.
    const el = state.clock.elapsedTime;
    const idle = reducedMotion || (tweaking && tweaks.freeze) ? 0 : 1;
    const px = flight.pointer.x * 2.5 * idle;
    const py = flight.pointer.y * 1.5 * idle;

    const cam = state.camera as THREE.PerspectiveCamera;
    tmp.copy(current.cam).sub(current.look);
    // Sway: rotate the camera offset around the vertical axis through the aim point (±6°), slowly.
    const sway = Math.sin(el * 0.11) * 0.105 * idle;
    const cs = Math.cos(sway);
    const sn = Math.sin(sway);
    const sx = tmp.x * cs - tmp.z * sn;
    const sz = tmp.x * sn + tmp.z * cs;
    tmp.set(sx, tmp.y, sz).add(current.look);
    tmp.x += px + Math.sin(el * 0.35) * 0.9 * idle;
    tmp.y += -py + Math.sin(el * 0.5) * 0.8 * idle;
    cam.position.copy(tmp);
    cam.lookAt(current.look);
    if (Math.abs(cam.fov - current.fov) > 0.01) {
      cam.fov = current.fov;
      cam.updateProjectionMatrix();
    }

    const ac = aircraft.current;
    if (ac) {
      ac.position.copy(current.pos);
      ac.position.y += Math.sin(el * 0.8) * 0.5 * idle;
      ac.position.x += Math.sin(el * 0.27) * 0.6 * idle;
      ac.rotation.set(
        current.rot.x + Math.sin(el * 0.6) * 0.015 * idle,
        current.rot.y + Math.sin(el * 0.21) * 0.02 * idle,
        current.rot.z + Math.sin(el * 0.45) * 0.035 * idle + flight.velocity * -0.0006,
      );
      const it = 1 - intro.t;
      if (it > 0.0005) {
        // Screen-relative offset: starts far away on the right (small), flies toward the viewer
        // and decelerates into the parked pose, straightening out of a gentle bank.
        const q = cam.quaternion;
        introBasis.right.set(1, 0, 0).applyQuaternion(q);
        introBasis.up.set(0, 1, 0).applyQuaternion(q);
        introBasis.fwd.set(0, 0, -1).applyQuaternion(q);
        ac.position.addScaledVector(introBasis.fwd, 190 * it).addScaledVector(introBasis.right, 48 * it).addScaledVector(introBasis.up, 14 * it);
        const rt = it * it * (3 - 2 * it); // rotation settles a touch after position
        // Nose pivot: level when far away, lifting into the parked pitch as it closes in.
        ac.rotation.x += (-current.rot.x - 0.03) * rt;
        ac.rotation.y += -0.2 * rt;
        ac.rotation.z += -0.3 * rt;
      }
    }

    const h = handle.current;
    if (h) {
      h.uniforms.uDroop.value = current.nose * NOSE_MAX_RAD;
      h.uniforms.uTime.value = el;
      h.uniforms.uHeat.value = THREE.MathUtils.smoothstep(flight.alt, 0.6, 0.9) * 0.6;
      h.setGear(current.gear);
      h.setHidden(current.hide);
    }
  });

  return null;
}
