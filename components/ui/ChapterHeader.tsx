import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface Props {
  number: string; // "01"
  kicker: string; // "Take-off"
  title: ReactNode; // big headline
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Numbered chapter heading used by every story section: 01 / KICKER, huge display title, lede. */
export function ChapterHeader({ number, kicker, title, lede, align = "left", className = "" }: Props) {
  return (
    <header className={`${align === "center" ? "mx-auto text-center" : ""} max-w-[62rem] ${className}`}>
      <Reveal as="p" className="chapter-num mb-6" mode="chars" stagger={0.02}>
        {number} &nbsp;/&nbsp; {kicker.toUpperCase()}
      </Reveal>
      <Reveal as="h2" className="display text-[clamp(2.75rem,7.4vw,7.5rem)] font-semibold" mode="lines">
        {title}
      </Reveal>
      {lede && (
        <Reveal as="p" className={`mt-8 max-w-[38rem] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-[1.45] text-[var(--ink)]/80 ${align === "center" ? "mx-auto" : ""}`} mode="lines" delay={0.2}>
          {lede}
        </Reveal>
      )}
    </header>
  );
}
