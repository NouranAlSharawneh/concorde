"use client";

import { create } from "zustand";

/**
 * Mutable, allocation-free state read inside requestAnimationFrame / useFrame.
 * Written by ScrollTriggers, never by React renders. Do not put this in React state.
 */
export interface FlightState {
  alt: number; // damped altitude 0..1
  altTarget: number;
  scroll: number; // 0..1 document progress
  velocity: number; // lenis velocity (px/frame)
  burner: number; // afterburner 0..1, written by the camera rig
  chapter: ChapterId;
  chapterProgress: number; // 0..1 within current chapter
  trackActive: boolean; // a pinned sub-section is overriding chapterProgress (e.g. anatomy hotspots)
  pointer: { x: number; y: number }; // -1..1
}

export type ChapterId =
  | "hero"
  | "dream"
  | "anatomy"
  | "first-flights"
  | "archive"
  | "mach2"
  | "routes"
  | "only-one"
  | "descent"
  | "legacy"
  | "timeline"
  | "footer";

export const flight: FlightState = {
  alt: 0,
  altTarget: 0,
  scroll: 0,
  velocity: 0,
  burner: 0,
  chapter: "hero",
  chapterProgress: 0,
  trackActive: false,
  pointer: { x: 0, y: 0 },
};

export type Theme = "light" | "dark";

interface UIState {
  launched: boolean; // preloader wipe has started — hero entrance may begin
  ready: boolean; // preloader finished
  theme: Theme;
  chapter: ChapterId;
  audioEnabled: boolean; // the user's intent; on by default
  audioRunning: boolean; // whether the AudioContext is actually producing sound right now
  setLaunched: (launched: boolean) => void;
  setReady: (ready: boolean) => void;
  setTheme: (theme: Theme) => void;
  setChapter: (chapter: ChapterId) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setAudioRunning: (running: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  launched: false,
  ready: false,
  theme: "light",
  chapter: "hero",
  audioEnabled: true,
  audioRunning: false,
  setLaunched: (launched) => set({ launched }),
  setReady: (ready) => set({ ready }),
  setTheme: (theme) => set({ theme }),
  setChapter: (chapter) => set({ chapter }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setAudioRunning: (audioRunning) => set({ audioRunning }),
}));
