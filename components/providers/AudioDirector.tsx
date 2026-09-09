"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { flight, useUI, type ChapterId } from "@/lib/flight-state";
import { altitudeToMach } from "@/lib/altitude";
import { getAudio } from "@/lib/audio";

/**
 * Ties the synthesised engine to the story: ambience follows altitude, slipstream follows scroll
 * speed, reheat rumble follows the afterburner, a cabin chime marks each new chapter, and the
 * sonic boom fires the first time the aircraft crosses Mach 1 on the way up.
 */
export function AudioDirector() {
  const enabled = useUI((s) => s.audioEnabled);
  const setRunning = useUI((s) => s.setAudioRunning);
  // Re-runs the start attempt once the preloader hands off, which is a second chance to catch a
  // gesture the user made while the loader was still up.
  const ready = useUI((s) => s.ready);
  const state = useRef({ chapter: "" as ChapterId | "", supersonic: false, speed: 0 });

  // Sound is on by default and should be playing as early as the browser will allow. Try straight
  // away — for a returning visitor, or where autoplay is permitted, the ambience comes up before
  // the loader clears. Otherwise an AudioContext may only start from a gesture that grants user
  // activation (wheel and scroll never do), so we stay armed for the first real pointer or key
  // input. Gestures on the toggle are left alone: that button starts the engine itself, and racing
  // it here would turn the user's first click into an immediate on-then-off.
  useEffect(() => {
    if (!enabled) return;
    const audio = getAudio();
    if (audio.isEnabled()) return;
    void audio.enable().then(() => setRunning(true), () => {});
    const events = ["pointerdown", "pointerup", "click", "keydown", "touchstart", "touchend"] as const;
    let armed = true;
    const stop = () => {
      armed = false;
      events.forEach((e) => window.removeEventListener(e, start, true));
    };
    function start(event: Event) {
      if (!armed) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-audio-toggle]")) return;
      // Stay armed until the engine actually starts — a blocked attempt must not burn the listener.
      void audio.enable().then(() => {
        stop();
        setRunning(true);
      }, () => {});
    }
    events.forEach((e) => window.addEventListener(e, start, { capture: true, passive: true }));
    return stop;
  }, [enabled, ready, setRunning]);

  useEffect(() => {
    if (!enabled) return;
    const audio = getAudio();
    let acc = 0;
    const tick = (_t: number, dt: number) => {
      // Slipstream tracks scroll speed every frame so it feels physical.
      const target = Math.min(1, Math.abs(flight.velocity) / 55);
      state.current.speed += (target - state.current.speed) * (1 - Math.pow(0.02, dt / 1000));
      audio.setSpeed(state.current.speed);

      acc += dt;
      if (acc < 90) return;
      acc = 0;
      audio.setAltitude(flight.alt);
      audio.setBurner(flight.burner);

      const mach = altitudeToMach(flight.alt);
      if (!state.current.supersonic && mach >= 1) {
        state.current.supersonic = true;
        audio.boom();
      } else if (state.current.supersonic && mach < 0.94) {
        state.current.supersonic = false; // re-arm on the way back down
      }

      if (flight.chapter !== state.current.chapter) {
        const first = state.current.chapter === "";
        state.current.chapter = flight.chapter;
        if (!first) audio.cue(flight.chapter.length);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      audio.setSpeed(0);
      audio.setBurner(0);
    };
  }, [enabled]);

  return null;
}
