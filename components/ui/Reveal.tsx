"use client";

import { useRef, type ReactNode, type RefObject } from "react";

type RevealTag = "div" | "p" | "h1" | "h2" | "h3" | "h4" | "span" | "li" | "blockquote" | "figcaption" | "dt" | "dd";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/lib/flight-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Mode = "lines" | "words" | "chars";

interface Props {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  mode?: Mode;
  /** Delay (s) after the element enters the viewport. */
  delay?: number;
  stagger?: number;
  /** "scroll" reveals once when scrolled into view; "mount" reveals as soon as the site is ready (hero). */
  trigger?: "scroll" | "mount";
  start?: string;
}

/**
 * Masked text reveal (SplitText). Lines/words/chars slide up from behind a mask.
 * Waits for the preloader (`ready`) so nothing animates behind the loader.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  mode = "lines",
  delay = 0,
  stagger,
  trigger = "scroll",
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const ready = useUI((s) => s.ready);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !ready) return;
      // Splitting text into hundreds of spans and sliding them is exactly what reduced motion asks
      // us not to do — and the global CSS override cannot stop it, because GSAP writes inline styles.
      if (reduced) return;
      let enter: ScrollTrigger | undefined;
      const split = SplitText.create(el, {
        type: mode === "lines" ? "lines" : mode === "words" ? "lines,words" : "lines,chars",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) => {
          // autoSplit re-runs this on a width change; without killing the previous trigger every
          // re-split orphans one that keeps evaluating on every scroll update.
          enter?.kill();
          const targets = mode === "lines" ? self.lines : mode === "words" ? self.words : self.chars;
          const st = stagger ?? (mode === "lines" ? 0.09 : mode === "words" ? 0.035 : 0.012);
          const tween = gsap.from(targets, {
            yPercent: 115,
            rotate: mode === "chars" ? 4 : 0,
            duration: mode === "chars" ? 0.9 : 1.2,
            ease: "climb",
            stagger: st,
            delay,
            paused: trigger === "scroll",
          });
          if (trigger === "scroll") {
            enter = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tween.play() });
          }
          return tween;
        },
      });
      return () => {
        enter?.kill();
        split.revert();
      };
    },
    { dependencies: [ready, mode, delay, stagger, trigger, start, reduced], scope: ref },
  );

  // All allowed tags share the HTMLElement ref contract; narrow once so JSX typechecks.
  const Element = Tag as "div";
  return (
    <Element ref={ref as RefObject<HTMLDivElement>} className={className} style={{ visibility: ready ? "visible" : "hidden" }}>
      {children}
    </Element>
  );
}
