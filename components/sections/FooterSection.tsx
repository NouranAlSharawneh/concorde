import { Chapter } from "@/components/sections/Chapter";
import { FinaleStage } from "./footer/FinaleStage";
import { ReturnFlight } from "./footer/ReturnFlight";

const LINKS = [
  { id: "dream", label: "Origins" },
  { id: "anatomy", label: "Anatomy" },
  { id: "archive", label: "Archive" },
  { id: "mach2", label: "Mach 2" },
  { id: "timeline", label: "Timeline" },
] as const;

/** Arrival. The page has been flight BA001; this is touchdown at JFK, seventy minutes before departure. */
export function FooterSection() {
  return (
    <Chapter id="footer" alt={[0.9, 1]} theme="dark" className="relative" label="Arrival">
      <div className="relative h-[200vh]">
        <FinaleStage />
      </div>

      {/* Bottom bar */}
      <footer className="container-x border-t hairline py-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="mono text-[0.62rem] leading-[1.8] tracking-[0.14em] whitespace-nowrap text-[var(--ink-60)] uppercase">© 2026 · A study of Concorde</p>
          <nav aria-label="Chapters" className="mono flex flex-wrap gap-x-5 gap-y-2 text-[0.62rem] tracking-[0.2em] uppercase">
            {LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`} data-cursor="hover" className="text-[var(--ink-60)] transition-colors duration-300 hover:text-[var(--ink)]">
                <span className="text-[var(--accent)]">/</span> {l.label}
              </a>
            ))}
          </nav>
          <ReturnFlight />
        </div>
      </footer>
    </Chapter>
  );
}
