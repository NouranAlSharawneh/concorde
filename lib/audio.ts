/**
 * Tiny synthesised Web Audio engine — no audio files.
 *  - Ambience: two detuned oscillators through a lowpass whose cutoff rises with
 *    altitude, plus brown noise through a bandpass. Master gain ≤ 0.08, 1.2 s fades.
 *  - boom(): one-shot noise burst + 55 Hz thump, ~1.4 s exponential decay.
 *  - tick(): 3 ms click at ~2 kHz for UI hovers.
 * The AudioContext is created/resumed only inside enable() (user gesture).
 * Listens to window "concorde:boom" while enabled.
 */

export interface AudioEngine {
  enable(): Promise<void>;
  disable(): void;
  /** 0 = ground, 1 = 60,000 ft. */
  setAltitude(alt: number): void;
  /** 0..1 scroll speed — adds slipstream noise and lifts the engine note. */
  setSpeed(speed: number): void;
  /** 0..1 reheat — low-frequency rumble under the ambience. */
  setBurner(amount: number): void;
  boom(): void;
  /** A soft two-note chime when a new chapter takes over. */
  cue(index: number): void;
  /** Air rushing past — used when the aircraft crosses the frame. */
  whoosh(strength?: number): void;
  tick(): void;
  isEnabled(): boolean;
}

export const BOOM_EVENT = "concorde:boom";

// Measured: with the old values the whole ambience sat below 200 Hz at -22 dB, so the 200-2000 Hz
// band that phone and laptop speakers actually reproduce was at -93 dB — silence on anything
// without a subwoofer. The engine keeps its 55/110 Hz fundamentals; the lowpass simply opens far
// enough for their harmonics to carry, and the airflow band sits where a small speaker can hear it.
const MASTER_GAIN = 0.18;
const FADE_S = 1.2;
const CUTOFF_MIN = 320;
const CUTOFF_MAX = 1100;

interface Ambience {
  rumble: OscillatorNode;
  rumbleGain: GainNode;
  windGain: GainNode;
  wind: AudioBufferSourceNode;
  windFilter: BiquadFilterNode;
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  lowpass: BiquadFilterNode;
  noise: AudioBufferSourceNode;
  bandpass: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

type AudioContextCtor = typeof AudioContext;

function getContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  if (typeof AudioContext !== "undefined") return AudioContext;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return w.webkitAudioContext ?? null;
}

/** Brown (1/f²) noise: leaky integration of white noise, normalised. */
function makeBrownNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfx: GainNode | null = null;
  let ambience: Ambience | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let enabled = false;
  let altitude = 0;
  let suspendTimer: ReturnType<typeof setTimeout> | null = null;

  const onBoomEvent = () => boom();

  const cutoffFor = (alt: number) => CUTOFF_MIN + (CUTOFF_MAX - CUTOFF_MIN) * clamp01(alt);
  const bandFor = (alt: number) => 340 + 900 * clamp01(alt);

  function ensureGraph(): AudioContext {
    if (ctx && master && sfx) return ctx;
    const Ctor = getContextCtor();
    if (!Ctor) throw new Error("Web Audio is not available");
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = 1;
    sfx.connect(ctx.destination);
    noiseBuffer = makeBrownNoise(ctx, 2);
    return ctx;
  }

  function startAmbience(c: AudioContext, out: GainNode): Ambience {
    const now = c.currentTime;

    // Engine tone: sawtooth + detuned triangle, an octave apart, through a rising lowpass.
    const oscA = c.createOscillator();
    oscA.type = "sawtooth";
    oscA.frequency.value = 55;
    oscA.detune.value = -6;
    const oscB = c.createOscillator();
    oscB.type = "triangle";
    oscB.frequency.value = 110;
    oscB.detune.value = 9;

    const toneGain = c.createGain();
    toneGain.gain.value = 0.55;
    const lowpass = c.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = cutoffFor(altitude);
    lowpass.Q.value = 0.9;

    oscA.connect(toneGain);
    oscB.connect(toneGain);
    toneGain.connect(lowpass);
    lowpass.connect(out);

    // Airflow: brown noise through a bandpass, breathing slowly via an LFO.
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const bandpass = c.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = bandFor(altitude);
    bandpass.Q.value = 0.7;
    const noiseGain = c.createGain();
    noiseGain.gain.value = 0.45;

    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.13;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain);
    lfoGain.connect(noiseGain.gain);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(out);

    oscA.start(now);
    oscB.start(now);
    noise.start(now);
    lfo.start(now);

    // Reheat rumble: a very low sine, silent until setBurner() opens it.
    const rumble = c.createOscillator();
    rumble.type = "sine";
    rumble.frequency.value = 42;
    const rumbleGain = c.createGain();
    rumbleGain.gain.value = 0;
    rumble.connect(rumbleGain);
    rumbleGain.connect(out);
    rumble.start(now);

    // Slipstream: brown noise through a highpass, opened by scroll speed.
    const wind = c.createBufferSource();
    wind.buffer = makeBrownNoise(c, 3);
    wind.loop = true;
    const windFilter = c.createBiquadFilter();
    windFilter.type = "highpass";
    windFilter.frequency.value = 700;
    const windGain = c.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(out);
    wind.start(now);

    return { rumble, rumbleGain, wind, windFilter, windGain, oscA, oscB, lowpass, noise, bandpass, lfo, lfoGain };
  }

  function stopAmbience(a: Ambience, at: number) {
    try {
      a.oscA.stop(at);
      a.oscB.stop(at);
      a.noise.stop(at);
      a.lfo.stop(at);
      a.rumble.stop(at);
      a.wind.stop(at);
    } catch {
      /* already stopped */
    }
  }

  async function enable(): Promise<void> {
    if (enabled) return;
    const c = ensureGraph();
    if (suspendTimer) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    if (c.state !== "running") {
      // resume() can hang indefinitely when the call did not come from a gesture that grants user
      // activation (a wheel or scroll never does), so race it and judge the context by its state.
      await Promise.race([c.resume().catch(() => {}), new Promise((r) => setTimeout(r, 250))]);
    }
    if (c.state !== "running") throw new Error("AudioContext blocked: needs a user gesture");
    if (!master) return;
    if (!ambience) ambience = startAmbience(c, master);
    const now = c.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(MASTER_GAIN, now + FADE_S);
    enabled = true;
    window.addEventListener(BOOM_EVENT, onBoomEvent);
  }

  function disable(): void {
    if (!enabled) return;
    enabled = false;
    window.removeEventListener(BOOM_EVENT, onBoomEvent);
    if (!ctx || !master) return;
    const c = ctx;
    const now = c.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + FADE_S);
    const a = ambience;
    ambience = null;
    if (a) stopAmbience(a, now + FADE_S + 0.05);
    suspendTimer = setTimeout(() => {
      suspendTimer = null;
      if (!enabled && c.state === "running") void c.suspend();
    }, (FADE_S + 0.2) * 1000);
  }

  function setAltitude(alt: number): void {
    altitude = clamp01(alt);
    if (!ctx || !ambience || !enabled) return;
    const now = ctx.currentTime;
    ambience.lowpass.frequency.setTargetAtTime(cutoffFor(altitude), now, 0.25);
    ambience.bandpass.frequency.setTargetAtTime(bandFor(altitude), now, 0.25);
    // Engine note rises a touch with speed.
    ambience.oscA.detune.setTargetAtTime(-6 + 140 * altitude, now, 0.4);
    ambience.oscB.detune.setTargetAtTime(9 + 140 * altitude, now, 0.4);
  }

  function setSpeed(speed: number): void {
    const v = clamp01(speed);
    if (!ctx || !ambience || !enabled) return;
    const now = ctx.currentTime;
    ambience.windGain.gain.setTargetAtTime(v * 0.5, now, 0.18);
    ambience.windFilter.frequency.setTargetAtTime(700 + 900 * v, now, 0.25);
  }

  function setBurner(amount: number): void {
    const v = clamp01(amount);
    if (!ctx || !ambience || !enabled) return;
    const now = ctx.currentTime;
    ambience.rumbleGain.gain.setTargetAtTime(v * 0.42, now, 0.3);
    ambience.rumble.frequency.setTargetAtTime(38 + 16 * v, now, 0.4);
  }

  /** Two soft sine notes a fifth apart — a cabin chime, not a game sound. */
  function cue(index: number): void {
    if (!enabled || !ctx || !sfx) return;
    const c = ctx;
    const now = c.currentTime;
    const root = 523.25 * Math.pow(2, ((index % 4) - 1) / 12); // small drift per chapter
    const out = sfx;
    [0, 0.14].forEach((delay, i) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = i === 0 ? root : root * 1.5;
      const g = c.createGain();
      const t = now + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  /** Doppler-ish pass-by: filtered noise swept up then down. */
  function whoosh(strength = 1): void {
    if (!enabled || !ctx || !sfx || !noiseBuffer) return;
    const c = ctx;
    const now = c.currentTime;
    const dur = 1.1;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(320, now);
    band.frequency.exponentialRampToValueAtTime(1500, now + dur * 0.45);
    band.frequency.exponentialRampToValueAtTime(240, now + dur);
    const g = c.createGain();
    const peak = 0.28 * clamp01(strength);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(band);
    band.connect(g);
    g.connect(sfx);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  function boom(): void {
    if (!enabled || !ctx || !sfx || !noiseBuffer) return;
    const c = ctx;
    const now = c.currentTime;
    const decay = 1.4;

    // Shockwave: noise burst through a lowpass that closes as it fades.
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + decay);
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfx);

    // Thump: 55 Hz sine with a slight downward pitch bend.
    const thump = c.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(55, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + decay);
    const thumpGain = c.createGain();
    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    thump.connect(thumpGain);
    thumpGain.connect(sfx);

    noise.start(now);
    thump.start(now);
    noise.stop(now + decay + 0.05);
    thump.stop(now + decay + 0.05);
  }

  function tick(): void {
    if (!enabled || !ctx || !sfx) return;
    const c = ctx;
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 2000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.05, now);
    g.gain.linearRampToValueAtTime(0, now + 0.003);
    osc.connect(g);
    g.connect(sfx);
    osc.start(now);
    osc.stop(now + 0.004);
  }

  return {
    enable,
    disable,
    setAltitude,
    setSpeed,
    setBurner,
    boom,
    cue,
    whoosh,
    tick,
    isEnabled: () => enabled,
  };
}

let singleton: AudioEngine | null = null;

/** Shared engine instance (created lazily; creates no AudioContext until enable()). */
export function getAudio(): AudioEngine {
  if (!singleton) singleton = createAudioEngine();
  return singleton;
}
