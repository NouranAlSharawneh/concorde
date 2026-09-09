import { Chapter } from "@/components/sections/Chapter";
import { FinaleStage } from "./footer/FinaleStage";

/**
 * End of flight. Behind it the aircraft levels off ahead of the camera, flies past one last time
 * and climbs away until its reheat is just another star. The DOM only frames it.
 */
export function FooterSection() {
  return (
    <Chapter id="footer" alt={[0.9, 1]} theme="dark" className="relative" label="End of flight">
      {/* Night falls: the sky deepens to black over the last screen, dimming the timeline's tail on the way. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[calc(100%+70vh)] bg-gradient-to-b from-transparent via-[color-mix(in_oklab,var(--night)_55%,transparent)] to-[var(--night)]" />
      <FinaleStage />
    </Chapter>
  );
}
