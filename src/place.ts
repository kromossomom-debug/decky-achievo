/**
 * Where the toast shows. In Game Mode Steam draws toasts in a small browser view that follows a
 * placeholder element in its main window (bottom right by default), so moving that placeholder moves
 * the toast. The new place only applies while one of our toasts is up; Steam's other notifications
 * keep their usual spot.
 */
import { findModule } from "@decky/ui";

import type { Position } from "./settings";

const STYLE_ID = "xba-place-style";
/** An attribute, not a class: Steam rewrites the main window's class list. */
const PLACED_ATTR = "data-xba-placed";
/** The browser view's size: Steam's placeholder box is 320 × 80. */
const VIEW_W = 320;
const VIEW_H = 80;

let placeholderClass: string | null | undefined;

function placeholder(): string | null {
  if (placeholderClass === undefined) {
    try {
      placeholderClass = findModule((m: any) => typeof m === "object" && m?.GamepadToastPlaceholder && m?.PositionTop)?.GamepadToastPlaceholder ?? null;
    } catch {
      placeholderClass = null;
    }
  }
  return placeholderClass ?? null;
}

function mainDocument(): Document | null {
  try {
    return (window as any).SteamUIStore?.WindowStore?.GamepadUIMainWindowInstance?.BrowserWindow?.document ?? null;
  } catch {
    return null;
  }
}

function css(cls: string, pos: Position, gap: number): string {
  const vertical = pos[0] === "t" ? `top: ${gap}px` : pos[0] === "m" ? `top: calc(50% - ${VIEW_H / 2}px)` : `bottom: ${gap}px`;
  const horizontal = pos[1] === "l" ? `left: ${gap}px` : pos[1] === "c" ? `left: calc(50% - ${VIEW_W / 2}px)` : `right: ${gap}px`;
  return `
html[${PLACED_ATTR}] .${cls} {
  top: auto !important; bottom: auto !important; left: auto !important; right: auto !important;
  width: ${VIEW_W}px !important; height: ${VIEW_H}px !important; padding: 0 !important; margin: 0 !important;
  box-sizing: border-box !important;
  ${vertical} !important; ${horizontal} !important;
}`;
}

let unplaceTimer: number | undefined;

/** Moves Steam's toast spot to the chosen place until `unplace` runs. */
export function place(pos: Position, gap: number) {
  const cls = placeholder();
  const doc = mainDocument();
  if (!cls || !doc?.head) return;
  if (unplaceTimer !== undefined) window.clearTimeout(unplaceTimer);
  unplaceTimer = undefined;
  let style = doc.getElementById(STYLE_ID);
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = css(cls, pos, gap);
  doc.documentElement.setAttribute(PLACED_ATTR, "");
}

/** Puts the spot back after `delayMs`, once Steam has hidden the toast view. */
export function unplace(delayMs = 0) {
  if (unplaceTimer !== undefined) window.clearTimeout(unplaceTimer);
  unplaceTimer = window.setTimeout(() => {
    unplaceTimer = undefined;
    mainDocument()?.documentElement.removeAttribute(PLACED_ATTR);
  }, delayMs);
}

export function removePlacement() {
  if (unplaceTimer !== undefined) window.clearTimeout(unplaceTimer);
  unplaceTimer = undefined;
  const doc = mainDocument();
  doc?.documentElement.removeAttribute(PLACED_ATTR);
  doc?.getElementById(STYLE_ID)?.remove();
}
