"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useDeviceTier, hasWebGL } from "@/lib/device";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Poster } from "./Poster";

const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

/** Mounts the WebGL scene (or a static poster when WebGL/motion isn't available). */
export function ConcordeCanvas() {
  const tier = useDeviceTier();
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(
    () => () => {},
    () => (hasWebGL() ? "yes" : "no"),
    () => "unknown",
  );

  if (webgl === "unknown") return null;
  if (webgl === "no" || reduced) return <Poster />;
  return <Scene tier={tier} reducedMotion={reduced} />;
}
