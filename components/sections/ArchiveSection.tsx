import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
import { PhotoWallClient } from "@/components/sections/archive/PhotoWallClient";
import { PHOTOS } from "@/content/photos";
import type { ChapterId } from "@/lib/flight-state";

/** Real photographs of the aircraft, between the first flights and Mach 2. */
export function ArchiveSection() {
  return (
    <Chapter id={"archive" as ChapterId} alt={[0.45, 0.5]} theme="light" label="Archive" className="pt-[20vh]">
      <div className="container-x">
        <ChapterHeader
          number="04"
          kicker="Archive"
          title={
            <>
              The real
              <br />
              thing
            </>
          }
          lede="Photographs of the aircraft, from its first flight in 1969 to the last landing in 2003 — and the airframes that remain."
        />
      </div>
      <div className="mt-[10vh]">
        <PhotoWallClient photos={PHOTOS} />
      </div>
    </Chapter>
  );
}
