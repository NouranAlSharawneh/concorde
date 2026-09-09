"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/lib/flight-state";
import { getAudio } from "@/lib/audio";

const BAR_DELAYS = [0, 0.18, 0.36, 0.09];

const EQ_CSS = `
@keyframes concorde-eq {
  0%, 100% { transform: scaleY(0.28); }
  50% { transform: scaleY(1); }
}
.concorde-eq-bar {
  transform-origin: 50% 100%;
  transform: scaleY(0.28);
  transition: transform 0.5s var(--ease-climb);
}
.concorde-eq[data-on="true"] .concorde-eq-bar {
  animation: concorde-eq 0.9s ease-in-out infinite;
}
/* Sound is meant to be on, but the browser will not start an AudioContext until the page has had
   a real interaction. Rather than sit there looking switched off, the button quietly asks for it. */
@keyframes concorde-armed {
  0%   { transform: scale(1);    opacity: 0.5; }
  70%  { transform: scale(1.45); opacity: 0; }
  100% { transform: scale(1.45); opacity: 0; }
}
.concorde-eq[data-armed="true"]::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  pointer-events: none;
  animation: concorde-armed 2.6s ease-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .concorde-eq[data-armed="true"]::after { animation: none; opacity: 0.4; }
}
`;

interface Props {
  className?: string;
}

/**
 * Round glass sound toggle with a 4-bar equaliser. Enables the synthesised
 * ambience on click (user gesture) and feeds the live `--alt` into the engine.
 */
export function AudioToggle({ className = "" }: Props) {
  const enabled = useUI((s) => s.audioEnabled);
  const setEnabled = useUI((s) => s.setAudioEnabled);
  // An AudioContext cannot start without a gesture that grants user activation, and scrolling
  // never grants one. The button used to render its "on" state from the stored intent, so on a
  // fresh page it claimed sound was on while the engine had never started — and gave no reason
  // to click it. It now shows whether sound is actually playing.
  const running = useUI((s) => s.audioRunning);
  const setRunning = useUI((s) => s.setAudioRunning);
  const [busy, setBusy] = useState(false);

  // Keep the engine in step if the store is flipped off elsewhere.
  useEffect(() => {
    if (!enabled && getAudio().isEnabled()) {
      getAudio().disable();
      setRunning(false);
    }
  }, [enabled, setRunning]);

  const toggle = async () => {
    if (busy) return;
    const audio = getAudio();
    if (audio.isEnabled()) {
      audio.disable();
      setEnabled(false);
      setRunning(false);
      return;
    }
    setBusy(true);
    try {
      await audio.enable();
      setEnabled(true);
      setRunning(true);
      audio.tick();
    } catch {
      setEnabled(false);
      setRunning(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style href="concorde-audio-toggle" precedence="default">
        {EQ_CSS}
      </style>
      <button
        type="button"
        data-audio-toggle
        onClick={toggle}
        onMouseEnter={() => {
          if (running) getAudio().tick();
        }}
        aria-pressed={running}
        aria-label={running ? "Sound on" : "Turn sound on"}
        title={running ? "Sound on" : enabled ? "Tap for sound" : "Turn sound on"}
        data-cursor="hover"
        className={`concorde-eq glass inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] transition-transform duration-500 ease-[var(--ease-climb)] hover:-translate-y-[2px] ${className}`}
        data-on={running}
        data-armed={enabled && !running}
      >
        <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
          {BAR_DELAYS.map((d, i) => (
            <span
              key={i}
              className="concorde-eq-bar block h-full w-[2px] rounded-full bg-current"
              style={{ animationDelay: `${d}s`, opacity: running ? 1 : 0.6 }}
            />
          ))}
        </span>
      </button>
    </>
  );
}
