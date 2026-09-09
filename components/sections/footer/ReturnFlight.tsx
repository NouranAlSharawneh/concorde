"use client";

import { useLenis } from "lenis/react";
import { MagneticButton } from "@/components/ui/MagneticButton";

/** The return leg: a slow scroll back to the top, so the whole altitude journey replays in reverse. */
export function ReturnFlight({ className = "btn btn-ghost" }: { className?: string }) {
  const lenis = useLenis();
  const go = () => {
    if (lenis) lenis.scrollTo(0, { duration: 3.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <MagneticButton onClick={go} className={className} ariaLabel="Return flight — back to the top">
      Return flight · BA002 ↑
    </MagneticButton>
  );
}
