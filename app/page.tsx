import { ConcordeCanvas } from "@/components/canvas/ConcordeCanvas";
import { TweakGate } from "@/components/dev/TweakGate";
import { AudioDirector } from "@/components/providers/AudioDirector";
import { FlightDirector } from "@/components/providers/FlightDirector";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import {
  AnatomySection,
  ArchiveSection,
  DescentSection,
  DreamSection,
  FirstFlightsSection,
  FooterSection,
  HeroSection,
  LegacySection,
  Mach2Section,
  OnlyOneSection,
  RoutesSection,
  TimelineSection,
} from "@/components/sections";
import { AltitudeRail } from "@/components/ui/AltitudeRail";
import { Cursor } from "@/components/ui/Cursor";
import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/ui/Preloader";
import { WindowFrame } from "@/components/ui/WindowFrame";

export default function Page() {
  return (
    <SmoothScroll>
      <Preloader />
      <ConcordeCanvas />
      <WindowFrame />
      <FlightDirector />
      <AudioDirector />
      <Nav />
      <AltitudeRail />
      <Cursor />
      <TweakGate />
      <main className="relative z-10">
        <HeroSection />
        <DreamSection />
        <AnatomySection />
        <FirstFlightsSection />
        <ArchiveSection />
        <Mach2Section />
        <RoutesSection />
        <OnlyOneSection />
        <DescentSection />
        <LegacySection />
        <TimelineSection />
        <FooterSection />
      </main>
    </SmoothScroll>
  );
}
