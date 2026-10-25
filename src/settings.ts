import { callable } from "@decky/api";
import { useEffect, useState } from "react";

export type SoundMode = "chime" | "custom" | "steam" | "none";

/** Where the toast shows: vertical (top / middle / bottom) + horizontal (left / center / right). */
export type Position = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

export interface Settings {
  enabled: boolean;
  sound: SoundMode;
  /** Path of the player's own sound file, for sound = "custom". */
  customPath: string;
  /** 0–100. */
  volume: number;
  /** Achievements unlocked by fewer than this % of players get the rare toast. */
  rareThreshold: number;
  showRarity: boolean;
  position: Position;
  /** Gap between the toast and the screen edge, in px. */
  edgeGap: number;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  sound: "chime",
  customPath: "",
  volume: 80,
  rareThreshold: 10,
  showRarity: true,
  position: "bc",
  edgeGap: 24,
};

const loadSettings = callable<[], Partial<Settings>>("get_settings");
const saveSettings = callable<[settings: Settings], boolean>("set_settings");

let current: Settings = DEFAULT_SETTINGS;
const listeners = new Set<(s: Settings) => void>();

export const getSettings = () => current;

export async function initSettings() {
  try {
    current = { ...DEFAULT_SETTINGS, ...((await loadSettings()) ?? {}) };
  } catch (e) {
    console.error("[xbox-achievements] load failed", e);
  }
  listeners.forEach((fn) => fn(current));
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  listeners.forEach((fn) => fn(current));
  saveSettings(current).catch((e) => console.error("[xbox-achievements] save failed", e));
}

export function useSettings(): Settings {
  const [s, setS] = useState(current);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}
