"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "high" | "mid" | "low";

function detect(): DeviceTier {
  if (typeof window === "undefined") return "high";
  // Manual override for testing: ?tier=low|mid|high
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "low" || forced === "mid" || forced === "high") return forced;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 820;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if ((coarse && narrow) || mem <= 2 || cores <= 2) return "low";
  if (coarse || narrow || mem <= 4 || cores <= 4) return "mid";
  return "high";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, detect, () => "high");
}

export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}
