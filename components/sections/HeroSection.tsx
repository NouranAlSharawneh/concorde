import { Chapter } from "@/components/sections/Chapter";
import { HeroContent } from "./hero/HeroContent";

export function HeroSection() {
  return (
    <Chapter id="hero" alt={[0, 0.05]} theme="light" className="h-[100svh] min-h-[640px]" label="Concorde — Twice the speed of sound. Once in history.">
      <HeroContent />
    </Chapter>
  );
}
