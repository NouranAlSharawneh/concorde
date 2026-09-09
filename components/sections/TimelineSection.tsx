import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { TimelineRail } from "./timeline/TimelineRail";
import { TIMELINE } from "./timeline/timeline-data";

/** 08 — the full timeline, 1954 → 2026. Night; altitude climbs back up toward the footer. */
export function TimelineSection() {
  return (
    <Chapter id="timeline" alt={[0.55, 0.9]} theme="dark" className="container-x py-[20vh]" label="Timeline">
      <ChapterHeader
        number="08"
        kicker="1954 — 2026"
        title={
          <>
            Every date
            <br />
            that mattered
          </>
        }
        lede="From a research study at Farnborough to the successors now flying: twenty-seven years in service, and the long before and after, on one rail."
      />
      <TimelineRail entries={TIMELINE} />
    </Chapter>
  );
}
