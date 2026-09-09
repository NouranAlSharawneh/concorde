"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:→.-/";

interface Props {
  value: string;
  /** Fixed number of cells (pads with spaces). */
  length?: number;
  className?: string;
  /** ms per flap step */
  speed?: number;
  /** Stagger per cell in ms */
  stagger?: number;
  /** Start flipping only when true (e.g. in view / ready). */
  active?: boolean;
  /** Also start when an ancestor gains data-reached="true" (lets pinned sections avoid React state). */
  activateOnAttr?: boolean;
}

/**
 * Airport departure-board split-flap display. Each cell flips through the
 * alphabet until it lands on its target character.
 */
export function SplitFlap({ value, length, className = "", speed = 38, stagger = 45, active = true, activateOnAttr = false }: Props) {
  const target = (length ? value.padEnd(length, " ").slice(0, length) : value).toUpperCase();
  const cellEls = useRef<Array<HTMLSpanElement | null>>([]);
  const frame = useRef<number>(0);
  const root = useRef<HTMLSpanElement>(null);
  const [attrActive, setAttrActive] = useState(false);

  useEffect(() => {
    if (!activateOnAttr || attrActive) return;
    const host = root.current?.closest<HTMLElement>("[data-panel]") ?? root.current?.parentElement ?? null;
    if (!host) return;
    if (host.getAttribute("data-reached") === "true") {
      setAttrActive(true);
      return;
    }
    const mo = new MutationObserver(() => {
      if (host.getAttribute("data-reached") === "true") setAttrActive(true);
    });
    mo.observe(host, { attributes: true, attributeFilter: ["data-reached"] });
    return () => mo.disconnect();
  }, [activateOnAttr, attrActive]);

  // The board used to setState once per animation frame — for an 18-cell display that is ~140
  // React renders of 18 spans each, and there are two boards on the same panel. The cells are
  // static markup; only their characters change, so they are written straight into the DOM, and
  // only when the character actually differs from what is already showing.
  useEffect(() => {
    if (!(active || attrActive)) return;
    const startAt = performance.now();
    const shown: string[] = target.split("").map(() => "");
    const tick = (now: number) => {
      let settled = true;
      for (let i = 0; i < target.length; i++) {
        const elapsed = now - startAt - i * stagger;
        let next: string;
        if (elapsed < 0) {
          next = " ";
          settled = false;
        } else {
          const idx = CHARS.indexOf(target[i]);
          const safeIdx = idx < 0 ? 0 : idx;
          const steps = Math.floor(elapsed / speed);
          if (steps >= safeIdx) {
            next = target[i];
          } else {
            next = CHARS[steps % CHARS.length];
            settled = false;
          }
        }
        if (next !== shown[i]) {
          shown[i] = next;
          const el = cellEls.current[i];
          if (el) el.textContent = next === " " ? " " : next;
        }
      }
      if (!settled) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, active, attrActive, speed, stagger]);

  return (
    <span ref={root} className={`inline-flex gap-[0.12em] ${className}`} aria-label={value} role="img">
      {target.split("").map((_, i) => (
        <span
          key={i}
          className="mono relative inline-flex h-[1.5em] w-[1em] items-center justify-center overflow-hidden rounded-[0.12em] leading-none"
          style={{ background: "var(--flap-bg, var(--ink))", color: "var(--flap-fg, var(--paper))" }}
          aria-hidden
        >
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30" />
          <span
            ref={(el) => {
              cellEls.current[i] = el;
            }}
          >
            {" "}
          </span>
        </span>
      ))}
    </span>
  );
}
