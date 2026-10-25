/**
 * Achievement sounds. The default is an original chime synthesized on the fly (a bright two-note
 * "bling", three notes for rare achievements), so the plugin ships no third-party audio. Players can
 * pick their own file instead; it is read by the backend and played from memory.
 */
import { callable } from "@decky/api";

const readSound = callable<[path: string], { mime: string; data: string } | null>("read_sound");

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** E6 → B6, plus E7 for rare achievements. */
const NOTES = [1318.51, 1975.53];
const RARE_NOTES = [1318.51, 1975.53, 2637.02];
const NOTE_GAP_S = 0.085;
const NOTE_LENGTH_S = 1.1;

export function playChime(rare: boolean, volume: number) {
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

  (rare ? RARE_NOTES : NOTES).forEach((freq, i) => {
    const start = now + i * NOTE_GAP_S;
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(1, start + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, start + NOTE_LENGTH_S);
    env.connect(master);
    env.connect(echo);
    // A sine for the body and a quiet octave-up triangle for the sparkle.
    for (const [type, mult, level] of [
      ["sine", 1, 0.8],
      ["triangle", 2, 0.12],
    ] as const) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      g.gain.value = level;
      osc.connect(g).connect(env);
      osc.start(start);
      osc.stop(start + NOTE_LENGTH_S + 0.05);
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
    console.error("[xbox-achievements] read_sound failed", e);
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
    console.error("[xbox-achievements] custom sound failed", e);
    return false;
  }
}

export function closeAudio() {
  void ctx?.close();
  ctx = null;
  custom = null;
}
