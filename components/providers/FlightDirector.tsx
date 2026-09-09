"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { flight, useUI, type ChapterId, type Theme } from "@/lib/flight-state";
import { samplePalette, rgbToCss } from "@/lib/altitude";
import { prefersReducedMotion } from "@/lib/use-reduced-motion";

type Rgb = [number, number, number];
/** Must match the :root / html[data-theme="dark"] values in globals.css. */
const THEME_COLOURS: Record<Theme, { ink: Rgb; paper: Rgb }> = {
  light: { ink: [14, 27, 43], paper: [255, 255, 255] },
  dark: { ink: [238, 242, 255], paper: [7, 11, 26] },
};
const THEME_FADE = 0.7; // seconds
const THEME_WRITE_MS = 48; // ~20 writes/s: each one restyles the whole document

/**
 * Reads every <section data-chapter data-alt="from:to" data-theme> on the page and
 * drives the single altitude number + CSS variables + theme flips from scroll.
 * Mount once, after the sections exist.
 */
export function FlightDirector() {
  const ready = useUI((s) => s.ready);
  const setTheme = useUI((s) => s.setTheme);
  const setChapter = useUI((s) => s.setChapter);

  // Chapter extents in document space, cached. Re-measuring 12 elements 8x a second forced a
  // synchronous layout every time; the geometry only actually changes on a ScrollTrigger refresh.
  const bounds = useRef<ReadonlyArray<{ top: number; bottom: number; theme: Theme }>>([]);
  // The ink/paper crossfade in flight, and the colours currently on screen (so a flip that
  // interrupts another starts from where it actually is, not from the previous theme's end).
  const themeTween = useRef<gsap.core.Tween | null>(null);
  const shown = useRef<{ ink: Rgb; paper: Rgb }>({ ink: [...THEME_COLOURS.light.ink], paper: [...THEME_COLOURS.light.paper] });

  const crossfadeTheme = useCallback((to: Theme) => {
    const root = document.documentElement.style;
    const target = THEME_COLOURS[to];
    themeTween.current?.kill();
    if (prefersReducedMotion()) {
      root.removeProperty("--ink");
      root.removeProperty("--paper");
      shown.current = { ink: [...target.ink], paper: [...target.paper] };
      return;
    }
    const from = { ink: [...shown.current.ink] as Rgb, paper: [...shown.current.paper] as Rgb };
    const state = { t: 0 };
    let lastWrite = -Infinity;
    const css = (c: Rgb) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
    themeTween.current = gsap.to(state, {
      t: 1,
      duration: THEME_FADE,
      ease: "flight",
      onUpdate: () => {
        const now = performance.now();
        if (state.t < 1 && now - lastWrite < THEME_WRITE_MS) return;
        lastWrite = now;
        const cur = shown.current;
        for (let i = 0; i < 3; i++) {
          cur.ink[i] = from.ink[i] + (target.ink[i] - from.ink[i]) * state.t;
          cur.paper[i] = from.paper[i] + (target.paper[i] - from.paper[i]) * state.t;
        }
        root.setProperty("--ink", css(cur.ink));
        root.setProperty("--paper", css(cur.paper));
      },
      onComplete: () => {
        // Hand back to the stylesheet: html[data-theme] carries exactly these end values.
        root.removeProperty("--ink");
        root.removeProperty("--paper");
        shown.current = { ink: [...target.ink], paper: [...target.paper] };
        themeTween.current = null;
      },
    });
  }, []);

  const measureChapters = useCallback(() => {
    const y = window.scrollY;
    bounds.current = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"), (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + y, bottom: r.bottom + y, theme: (el.dataset.theme === "dark" ? "dark" : "light") as Theme };
    });
  }, []);

  /** The theme of whichever chapter owns the middle of the viewport — the single source of truth. */
  const syncTheme = useCallback(() => {
    const list = bounds.current;
    if (list.length === 0) return;
    const mid = window.scrollY + window.innerHeight / 2;
    let bestTheme: Theme = "light";
    let bestDist = Infinity;
    for (const c of list) {
      const dist = c.top <= mid && c.bottom >= mid ? 0 : Math.min(Math.abs(c.top - mid), Math.abs(c.bottom - mid));
      if (dist < bestDist) {
        bestDist = dist;
        bestTheme = c.theme;
      }
      if (bestDist === 0) break;
    }
    if (document.documentElement.dataset.theme !== bestTheme) {
      document.documentElement.dataset.theme = bestTheme;
      crossfadeTheme(bestTheme);
      setTheme(bestTheme);
    }
  }, [setTheme, crossfadeTheme]);

  useGSAP(
    () => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-chapter]");
      sections.forEach((el) => {
        const [from, to] = (el.dataset.alt ?? "0:0").split(":").map(Number);
        const id = el.dataset.chapter as ChapterId;
        const first = el === sections[0];
        const last = el === sections[sections.length - 1];
        ScrollTrigger.create({
          trigger: el,
          // The first chapter is already on screen at scroll 0, so its progress must start there.
          start: first ? "top top" : "top 60%",
          // The last chapter must reach progress 1 at the very bottom of the page.
          end: last ? "bottom bottom" : "bottom 60%",
          refreshPriority: -1,
          onUpdate: (self) => {
            flight.altTarget = from + (to - from) * self.progress;
            if (flight.chapter === id) {
              if (flight.trackActive) return; // a pinned track inside this chapter owns the shot progress
            } else {
              flight.trackActive = false; // entering a new chapter always releases a previous chapter's track
            }
            flight.chapter = id;
            flight.chapterProgress = self.progress;
          },
          onLeaveBack: () => {
            // Scrolled back above this chapter: park at its floor (0 ft for the hero).
            flight.altTarget = from;
            if (first) {
              flight.trackActive = false;
              flight.chapter = id;
              flight.chapterProgress = 0;
            }
          },
          onToggle: (self) => {
            if (self.isActive) {
              setChapter(id);
              syncTheme();
            }
          },
        });
      });
      // A ScrollTrigger.refresh() (fired by lazy sections mounting, or a resize) re-evaluates every
      // trigger and can toggle several in one go — including a light chapter that is nowhere near the
      // viewport, which used to flash the whole page white for a frame. So the theme is never set
      // from a toggle directly: it is resolved from whichever chapter actually owns the viewport.
      measureChapters();
      const onRefresh = () => {
        measureChapters();
        syncTheme();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          flight.scroll = self.progress;
        },
      });
      return () => ScrollTrigger.removeEventListener("refresh", onRefresh);
    },
    { dependencies: [ready, setTheme, setChapter, syncTheme, measureChapters] },
  );

  // Per-frame: damp altitude and push palette into CSS variables (no React renders).
  useEffect(() => {
    const root = document.documentElement.style;
    let last = -1;
    let lastStep = -1;
    let lastAccent = "";
    let lastSkyTop = "";
    let lastSkyBottom = "";
    let themeAcc = 0;
    // The browser tints its own chrome (iOS URL bar, Android status bar) from this meta tag.
    // Left static it stayed pale while the page climbed into night, putting a hard bright band
    // above and below the content that no CSS could soften.
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const tick = (_t: number, dt: number) => {
      // Resolve the theme from the viewport a few times a second. Trigger toggles alone are not
      // enough: a chapter starts at "top 60%", so at the moment it toggles the viewport centre is
      // still inside the previous chapter and the ink colour would stay behind by a whole section.
      themeAcc += dt;
      if (themeAcc >= 120) {
        themeAcc = 0;
        syncTheme();
      }
      const k = 1 - Math.pow(0.0008, dt / 1000);
      flight.alt += (flight.altTarget - flight.alt) * k;
      // Snap when close enough, so the readout actually reaches 0 FT at the top of the page
      // instead of asymptotically parking a few dozen feet above it.
      if (Math.abs(flight.altTarget - flight.alt) < 0.0004) flight.alt = flight.altTarget;
      if (flight.alt === last) return;
      last = flight.alt;
      // Writing a custom property on :root invalidates style for every element that could
      // inherit it — the whole document. Doing that 60x a second was costing ~5x the frame
      // budget on a phone. So: quantise the altitude to 400 steps for the whole page, and
      // write each property only when its resolved string actually changes. Anything with
      // no CSS consumer (--alt, --haze, --feet, --mach) is not written at all; the JS
      // readouts take their values from `flight` directly instead of round-tripping
      // through getComputedStyle.
      const step = Math.round(flight.alt * 400);
      if (step === lastStep) return;
      lastStep = step;
      const p = samplePalette(flight.alt);
      const accent = rgbToCss(p.accent);
      if (accent !== lastAccent) {
        lastAccent = accent;
        root.setProperty("--accent", accent);
      }
      const skyTop = rgbToCss(p.skyTop);
      if (skyTop !== lastSkyTop) {
        lastSkyTop = skyTop;
        root.setProperty("--sky-top", skyTop);
        if (themeMeta) themeMeta.content = skyTop;
      }
      const skyBottom = rgbToCss(p.skyBottom);
      if (skyBottom !== lastSkyBottom) {
        lastSkyBottom = skyBottom;
        root.setProperty("--sky-bottom", skyBottom);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [syncTheme]);

  // Dev handle for inspecting the flight state from the console.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __flight?: unknown }).__flight = flight;
  }, []);

  // Pointer for parallax, normalized -1..1
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      flight.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Refresh triggers once fonts are in (layout shifts) and when preloader hands off.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);
  useEffect(() => {
    if (ready) requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [ready]);

  return null;
}
