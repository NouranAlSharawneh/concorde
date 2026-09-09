"use client";

import { useLenis } from "lenis/react";
import { MagneticButton } from "@/components/ui/MagneticButton";

/** The way back: a slow scroll to the top, so the whole altitude journey replays in reverse. */
export function ReturnFlight({
  className = "mono inline-flex items-center gap-2 text-[0.62rem] tracking-[0.22em] text-[var(--ink-60)] uppercase transition-colors duration-300 hover:text-[var(--ink)]",
}: {
  className?: string;
}) {
  const lenis = useLenis();
  const go = () => {
    if (lenis) lenis.scrollTo(0, { duration: 3.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <MagneticButton onClick={go} className={className} strength={0.2} ariaLabel="Return to gate — back to the top">
      <span className="text-[var(--accent)]">↑</span> Return to gate
    </MagneticButton>
  );
}
