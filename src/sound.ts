/**
 * Achievement sounds. The default is an original chime synthesized on the fly for each style (Xbox: a
 * bright two-note "bling", three notes for rare ones; PlayStation: a soft bell "ting", two notes for
 * gold), so the plugin ships no third-party audio. Players can
 * pick their own file instead; it is read by the backend and played from memory.
 */
import { callable } from "@decky/api";

import type { Skin } from "./settings";

const readSound = callable<[path: string], { mime: string; data: string } | null>("read_sound");

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Chime {
  notes: number[];
  rareNotes: number[];
  gapS: number;
  lengthS: number;
  /** Oscillators per note: wave, frequency multiple, level. */
  partials: [OscillatorType, number, number][];
}

const CHIMES: Record<Skin, Chime> = {
  // E6 → B6, plus E7 for rare achievements; a sine body with an octave-up triangle sparkle.
  xbox: {
    notes: [1318.51, 1975.53],
    rareNotes: [1318.51, 1975.53, 2637.02],
    gapS: 0.085,
    lengthS: 1.1,
    partials: [
      ["sine", 1, 0.8],
      ["triangle", 2, 0.12],
    ],
  },
  // A6, plus D7 for gold; inharmonic overtones make it ring like a small bell.
  playstation: {
    notes: [1760],
    rareNotes: [1760, 2349.32],
    gapS: 0.12,
    lengthS: 0.9,
    partials: [
      ["sine", 1, 0.7],
      ["sine", 2.76, 0.16],
      ["sine", 5.4, 0.05],
    ],
  },
};

export function playChime(skin: Skin, rare: boolean, volume: number) {
  const chime = CHIMES[skin] ?? CHIMES.xbox;
  const ac = audioContext();
  const now = ac.currentTime + 0.02;
  const master = ac.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume / 100)) * 0.45;

  // A short feedback echo gives the chime its "shine" without a reverb impulse file.
  const echo = ac.createDelay(1);
  echo.delayTime.value = 0.11;
  const feedback = ac.createGain();
  feedback.gain.value = 0.28;
  const tone = ac.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 5200;
  echo.connect(feedback).connect(tone).connect(echo);
  master.connect(ac.destination);
  tone.connect(master);

  (rare ? chime.rareNotes : chime.notes).forEach((freq, i) => {
    const start = now + i * chime.gapS;
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(1, start + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, start + chime.lengthS);
    env.connect(master);
    env.connect(echo);
    for (const [type, mult, level] of chime.partials) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      g.gain.value = level;
      osc.connect(g).connect(env);
      osc.start(start);
      osc.stop(start + chime.lengthS + 0.05);
    }
  });
}

let custom: { path: string; url: string } | null = null;

/** Loads (and caches) the player's sound file; returns false if it can't be read. */
export async function loadCustomSound(path: string): Promise<boolean> {
  if (!path) return false;
  if (custom?.path === path) return true;
  try {
    const res = await readSound(path);
    if (!res) return false;
    custom = { path, url: `data:${res.mime};base64,${res.data}` };
    return true;
  } catch (e) {
    console.error("[achievo] read_sound failed", e);
    return false;
  }
}

export async function playCustom(path: string, volume: number): Promise<boolean> {
  if (!(await loadCustomSound(path)) || !custom) return false;
  const audio = new Audio(custom.url);
  audio.volume = Math.max(0, Math.min(1, volume / 100));
  try {
    await audio.play();
    return true;
  } catch (e) {
    console.error("[achievo] custom sound failed", e);
    return false;
  }
}

export function closeAudio() {
  void ctx?.close();
  ctx = null;
  custom = null;
}
