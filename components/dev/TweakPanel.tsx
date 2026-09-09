"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import { CHAPTER_ORDER } from "@/lib/camera-keyframes";
import type { ChapterId } from "@/lib/flight-state";
import { defaultTweak, tweakToQuery, tweakToSource, tweaks, type TweakPose } from "@/lib/tweaks";

type Vec3Key = "cam" | "look" | "rot" | "pos";
type Axis = 0 | 1 | 2;

const STORAGE = "concorde:tweaks";
const AXES = ["x", "y", "z"] as const;

function loadSaved(chapter: ChapterId): TweakPose | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE}:${chapter}`);
    return raw ? (JSON.parse(raw) as TweakPose) : null;
  } catch {
    return null;
  }
}

function distance(p: TweakPose): number {
  const dx = p.cam[0] - p.look[0];
  const dy = p.cam[1] - p.look[1];
  const dz = p.cam[2] - p.look[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

interface RowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Row({ label, value, min, max, step, onChange }: RowProps) {
  return (
    <label className="grid grid-cols-[2.4rem_1fr_4.2rem] items-center gap-2">
      <span className="text-white/55">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 w-full accent-[#ffb703]" />
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-right text-white tabular-nums outline-none focus:border-[#ffb703]"
      />
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
      <legend className="pr-2 text-[0.6rem] tracking-[0.22em] text-[#ffb703]/90 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Dev tweak panel (open with `#tweaks` in the URL). Edits the camera + aircraft pose of one
 * chapter live, and prints the `pose({...})` line to paste into lib/camera-keyframes.ts.
 */
export default function TweakPanel() {
  const lenis = useLenis();
  const [chapter, setChapter] = useState<ChapterId>("hero");
  const [pose, setPoseState] = useState<TweakPose>(() => loadSaved("hero") ?? defaultTweak("hero"));
  const [freeze, setFreeze] = useState(false);
  const [copied, setCopied] = useState<"pose" | "url" | null>(null);

  // Push every change into the mutable store the rig reads per frame, and persist it.
  const setPose = useCallback(
    (next: TweakPose) => {
      setPoseState(next);
      tweaks.pose = next;
      try {
        window.localStorage.setItem(`${STORAGE}:${chapter}`, JSON.stringify(next));
      } catch {
        /* private mode */
      }
    },
    [chapter],
  );

  useEffect(() => {
    tweaks.active = true;
    tweaks.chapter = chapter;
    tweaks.pose = pose;
    return () => {
      tweaks.active = false;
    };
    // mount/unmount only — later changes are pushed from the handlers below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectChapter = (id: ChapterId) => {
    const initial = loadSaved(id) ?? defaultTweak(id);
    setChapter(id);
    setPoseState(initial);
    tweaks.chapter = id;
    tweaks.pose = initial;
  };

  useEffect(() => {
    tweaks.freeze = freeze;
  }, [freeze]);

  const setAxis = (key: Vec3Key, axis: Axis, v: number) => {
    const next: TweakPose = { ...pose, [key]: pose[key].map((n, i) => (i === axis ? v : n)) as [number, number, number] };
    setPose(next);
  };

  const setDistance = (dist: number) => {
    const cur = distance(pose) || 1;
    const s = dist / cur;
    const cam: [number, number, number] = [
      pose.look[0] + (pose.cam[0] - pose.look[0]) * s,
      pose.look[1] + (pose.cam[1] - pose.look[1]) * s,
      pose.look[2] + (pose.cam[2] - pose.look[2]) * s,
    ];
    setPose({ ...pose, cam: cam.map((n) => Math.round(n * 10) / 10) as [number, number, number] });
  };

  const source = useMemo(() => tweakToSource(pose), [pose]);
  const query = useMemo(() => tweakToQuery(chapter, pose), [chapter, pose]);

  const copy = async (kind: "pose" | "url") => {
    const text = kind === "pose" ? source : `${window.location.origin}${window.location.pathname}${query}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      /* clipboard blocked — the textarea below is selectable */
    }
  };

  const reset = () => {
    try {
      window.localStorage.removeItem(`${STORAGE}:${chapter}`);
    } catch {
      /* ignore */
    }
    const d = defaultTweak(chapter);
    setPoseState(d);
    tweaks.pose = d;
  };

  const goToChapter = () => {
    const el = document.getElementById(chapter);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 1, immediate: true });
    else el.scrollIntoView();
  };

  return (
    <aside
      data-lenis-prevent
      className="fixed top-[5.5rem] right-4 z-[1000] flex max-h-[calc(100vh-7rem)] w-[21rem] flex-col gap-3 overflow-y-auto rounded-xl border border-white/12 bg-[#070b1a]/88 p-4 font-mono text-[0.72rem] text-white shadow-2xl backdrop-blur-xl"
      style={{ cursor: "auto" }}
    >
      <header className="flex items-center justify-between">
        <span className="text-[0.6rem] tracking-[0.28em] text-white/50 uppercase">Tweaks · #tweaks</span>
        <select
          value={chapter}
          onChange={(e) => selectChapter(e.target.value as ChapterId)}
          className="rounded border border-white/15 bg-[#0b1124] px-1.5 py-0.5 text-white outline-none"
        >
          {CHAPTER_ORDER.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </header>

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-white/70">
          <input type="checkbox" checked={freeze} onChange={(e) => setFreeze(e.target.checked)} className="accent-[#ffb703]" />
          Freeze idle motion
        </label>
        <button type="button" onClick={goToChapter} className="rounded border border-white/15 px-2 py-0.5 text-white/80 hover:bg-white/10">
          Go to chapter
        </button>
      </div>

      <Group title="Camera position">
        {AXES.map((a, i) => (
          <Row key={a} label={a} value={pose.cam[i]} min={-160} max={160} step={0.5} onChange={(v) => setAxis("cam", i as Axis, v)} />
        ))}
        <Row label="dist" value={Math.round(distance(pose) * 10) / 10} min={4} max={220} step={0.5} onChange={setDistance} />
      </Group>

      <Group title="Look at">
        {AXES.map((a, i) => (
          <Row key={a} label={a} value={pose.look[i]} min={-100} max={100} step={0.5} onChange={(v) => setAxis("look", i as Axis, v)} />
        ))}
      </Group>

      <Group title="Lens">
        <Row label="fov" value={pose.fov} min={10} max={90} step={0.5} onChange={(v) => setPose({ ...pose, fov: v })} />
      </Group>

      <Group title="Aircraft rotation (deg)">
        <Row label="pitch" value={pose.rot[0]} min={-180} max={180} step={0.5} onChange={(v) => setAxis("rot", 0, v)} />
        <Row label="yaw" value={pose.rot[1]} min={-180} max={180} step={0.5} onChange={(v) => setAxis("rot", 1, v)} />
        <Row label="roll" value={pose.rot[2]} min={-180} max={180} step={0.5} onChange={(v) => setAxis("rot", 2, v)} />
      </Group>

      <Group title="Aircraft offset">
        {AXES.map((a, i) => (
          <Row key={a} label={a} value={pose.pos[i]} min={-120} max={120} step={0.5} onChange={(v) => setAxis("pos", i as Axis, v)} />
        ))}
        <Row label="nose" value={pose.nose} min={0} max={1} step={0.01} onChange={(v) => setPose({ ...pose, nose: v })} />
      </Group>

      <Group title="Output">
        <textarea readOnly value={source} rows={3} className="w-full resize-none rounded border border-white/15 bg-black/40 p-2 text-[0.68rem] leading-snug text-[#ffe9b8] outline-none" onFocus={(e) => e.currentTarget.select()} />
        <div className="flex gap-2">
          <button type="button" onClick={() => copy("pose")} className="flex-1 rounded bg-[#ffb703] px-2 py-1 font-semibold text-black hover:brightness-110">
            {copied === "pose" ? "Copied" : "Copy pose()"}
          </button>
          <button type="button" onClick={() => copy("url")} className="flex-1 rounded border border-white/20 px-2 py-1 text-white/85 hover:bg-white/10">
            {copied === "url" ? "Copied" : "Copy URL"}
          </button>
          <button type="button" onClick={reset} className="rounded border border-white/20 px-2 py-1 text-white/60 hover:bg-white/10">
            Reset
          </button>
        </div>
        <p className="text-[0.62rem] leading-snug text-white/40">
          Axes: nose points −z, +y up, +x right. Pitch + = nose up. Values persist per chapter in this browser.
        </p>
      </Group>
    </aside>
  );
}
