import type { ReactNode, CSSProperties } from "react";
import type { ChapterId, Theme } from "@/lib/flight-state";

interface Props {
  id: ChapterId;
  /** Altitude range "from:to" (0..1) this chapter spans while scrolling through it. */
  alt: readonly [number, number];
  theme: Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/** Every story section is a Chapter: it tells the FlightDirector its altitude range and theme. */
export function Chapter({ id, alt, theme, children, className = "", style, label }: Props) {
  return (
    <section
      id={id}
      data-chapter={id}
      data-alt={`${alt[0]}:${alt[1]}`}
      data-theme={theme}
      aria-label={label}
      className={`relative z-10 ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}
