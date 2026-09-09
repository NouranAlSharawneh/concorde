"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { flight } from "@/lib/flight-state";
import { prefersReducedMotion } from "@/lib/use-reduced-motion";

/** Keeps ScrollTrigger in sync with Lenis' virtual scroll position. */
function ScrollSync() {
  useLenis((lenis) => {
    flight.velocity = lenis.velocity;
    ScrollTrigger.update();
  });
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const ref = useRef<LenisRef>(null);

  useEffect(() => {
    // Drive Lenis from GSAP's ticker so there is exactly one rAF loop. Look the instance up on
    // every tick: ReactLenis creates it asynchronously, so capturing it once can miss it.
    const update = (time: number) => ref.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={ref}
      options={{
        autoRaf: false,
        lerp: prefersReducedMotion() ? 1 : 0.085,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      }}
    >
      <ScrollSync />
      {children}
    </ReactLenis>
  );
}
