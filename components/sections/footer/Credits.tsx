const link = "text-[var(--ink)] underline decoration-[var(--ink-24)] underline-offset-[0.3em] transition-colors duration-300 hover:decoration-[var(--ink)]";

/** The one row of small print. */
export function Credits({ className = "" }: { className?: string }) {
  return (
    <p className={`mono flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 text-[0.6rem] leading-[1.7] tracking-[0.18em] text-[var(--ink-60)] uppercase sm:text-[0.62rem] ${className}`}>
      <span>
        Photographs · Wikimedia Commons contributors, credited in the{" "}
        <a href="#archive" className={link} data-cursor="hover">
          archive
        </a>
      </span>
      <span>© 2026 · A study of Concorde</span>
    </p>
  );
}
