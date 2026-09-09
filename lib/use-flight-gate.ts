"use client";

import { useEffect, useState } from "react";
import { gsap } from "@/lib/gsap";
import { flight } from "@/lib/flight-state";

/**
 * A boolean derived from the live flight state, sampled a few times a second off the GSAP ticker.
 * Use it to mount and unmount scene objects that can only be seen in part of the climb — setting
 * `visible = false` does not stop their per-frame work, unmounting does. The predicate should
 * include its own hysteresis so the gate does not flicker at the boundary.
 */
export function useFlightGate(predicate: (alt: number, wasOpen: boolean) => boolean): boolean {
  const [open, setOpen] = useState(() => predicate(flight.alt, false));
  useEffect(() => {
    let acc = 0;
    let current = predicate(flight.alt, open);
    const tick = (_t: number, dt: number) => {
      acc += dt;
      if (acc < 120) return;
      acc = 0;
      const next = predicate(flight.alt, current);
      if (next !== current) {
        current = next;
        setOpen(next);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
    // The predicate is a stable module-level function in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return open;
}
