# Concorde site — build brief for contributors/agents

Single-page storytelling site about Concorde. Next.js 16 App Router, React 19, Tailwind v4, GSAP 3.15 (all plugins free), Lenis, React Three Fiber. **Strict TypeScript — the type `any` is forbidden.** Run `npx tsc --noEmit` and `npm run lint` before finishing.

## Mental model

- A fixed full-screen WebGL canvas (`components/canvas/*`) sits behind the DOM at z-0: sky shader, clouds, stars and the 3D Concorde. **DOM sections scroll over it** (z-10) and are mostly transparent so the sky shows through; use `.glass` panels for legibility.
- One number drives the whole look: **altitude** (0 = ground among clouds, 1 = 60,000 ft). `components/providers/FlightDirector.tsx` reads every `<Chapter>` (`data-chapter`, `data-alt="from:to"`, `data-theme`) and writes CSS variables every frame: `--alt`, `--sky-top`, `--sky-bottom`, `--ink`, `--paper`, `--accent`, `--haze`, `--feet`, `--mach`. **Always colour with `var(--ink)` / `var(--paper)` / `var(--accent)`** (or Tailwind `text-ink`, `bg-paper`, `text-accent`) so sections work in both light and dark altitudes. Never hardcode black/white text.
- Camera choreography per chapter lives in `lib/camera-keyframes.ts` (`SHOTS[chapterId]`). Don't edit it unless your task says so.
- Chapter ids (fixed): `hero, dream, anatomy, first-flights, mach2, only-one, descent, legacy, timeline, footer`.

## Section skeleton

```tsx
import { Chapter } from "@/components/sections/Chapter";
import { ChapterHeader } from "@/components/ui/ChapterHeader";
export function DreamSection() {
  return (
    <Chapter
      id="dream"
      alt={[0.05, 0.2]}
      theme="light"
      className="container-x py-[20vh]"
    >
      <ChapterHeader
        number="01"
        kicker="Take-off"
        title={
          <>
            A dream signed
            <br />
            in two languages
          </>
        }
        lede="..."
      />
      ...
    </Chapter>
  );
}
```

The section component must be a **server component unless it needs hooks**; animation lives in the UI primitives or in a small `"use client"` child.

## UI primitives (reuse, don't reinvent) — `components/ui/`

- `Reveal` — masked SplitText reveal; `mode="lines|words|chars"`, `trigger="scroll|mount"`, `as="h2"`.
- `FadeIn` — fade+rise for blocks; `stagger={0.08}` staggers children.
- `Counter` — animated number; `to`, `decimals`, `prefix`, `suffix`.
- `MagneticButton` — magnetic CTA; `className="btn"` or `"btn btn-ghost"`.
- `SplitFlap` — airport departure-board text; `value`, `length`, `active`.
- `ChapterHeader` — numbered chapter heading.
- CSS classes in `app/globals.css`: `.display` (Archivo expanded), `.mono` (JetBrains Mono, tabular), `.serif` (Instrument Serif italic), `.eyebrow`, `.glass`, `.chapter-num`, `.btn`, `.btn-ghost`, `.stat-value`, `.hairline`, `.text-stroke`, `.container-x`.
- GSAP: `import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap"` (already registered; custom eases `"flight"` and `"climb"`). Use `useGSAP(() => {...}, { scope: ref })`. Gate animations on `useUI((s) => s.ready)` so nothing animates under the preloader. For pinned/scrubbed sections use `ScrollTrigger` with `scrub: 1` and `pin: true` on the section's inner wrapper; **keep `<Chapter>` itself unpinned** (FlightDirector measures it).
- Respect `prefers-reduced-motion` via `gsap.matchMedia()` or `useReducedMotion()` from `@/lib/use-reduced-motion` — reduced → final states, no scrub.

## Design language

- Light → dark altitude shift. Hero is bright, airy, cloud-filled; Mach 2 chapter is night with stars; footer is night.
- Type: huge display headlines (`.display`, tracking −0.045em, line-height 0.9, `clamp(2.75rem,7.4vw,7.5rem)`), small tracked mono eyebrows, numbers in `.stat-value`/`.mono`. Serif italic only for pull-quotes.
- Numbered chapters `01 / KICKER`. Frosted `.glass` panels, 1px hairlines, generous whitespace (`py-[20vh]`), ragged-right copy max-width 38rem.
- Motion: every headline reveals with `Reveal`; blocks with `FadeIn`; numbers with `Counter`; one shared ease. Subtle, layered, never gratuitous. Hover states on cards (lift 4px, hairline brightens).
- Accent usage: sparing — one accent element per viewport.

## Content

All facts must come from `content/*.ts` (typed, with `source` URLs). The verified research digest is in the plan file: `/Users/nuranalsharawneh/.claude/plans/we-are-going-to-cozy-russell.md` (section "Research digest — Concorde facts"). Do not invent numbers.

## Credits

The 3D model attribution (CC-BY-4.0, thomas333) lives in `README.md`; the footer deliberately carries no model credit. Photo attributions render under each print in the archive chapter.
