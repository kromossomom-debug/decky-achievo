/**
 * The console-style achievement toasts (Xbox pill or PlayStation trophy card). Steam shows achievement popups in a small window of its own
 * ("notificationtoasts_uidN"); while one of ours is up, Steam's content in that window is hidden
 * and our pill is drawn in its place, so it still appears above games like Steam's does.
 */
import { t } from "./i18n";
import type { Skin } from "./settings";

const STYLE_ID = "xba-style";
const WRAP_ID = "xba-wrap";
const ACTIVE_CLASS = "xba-active";

export interface Achievement {
  name: string;
  description: string;
  image: string;
  /** % of players who have it. */
  pct: number;
  durationMs: number;
}

const TROPHY_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 4h-2V3H7v1H5a2 2 0 0 0-2 2v1a4 4 0 0 0 3.6 4A5 5 0 0 0 11 14.9V18H8v2h8v-2h-3v-3.1A5 5 0 0 0 17.4 11 4 4 0 0 0 21 7V6a2 2 0 0 0-2-2ZM5 7V6h2v3.8A2 2 0 0 1 5 7Zm14 0a2 2 0 0 1-2 2.8V6h2v1Z"/></svg>`;
const DIAMOND_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 4 9l8 13 8-13-8-7Zm0 3.2L16.9 9H7.1L12 5.2Z"/></svg>`;

const CSS = `
html.${ACTIVE_CLASS}, html.${ACTIVE_CLASS} body { background: transparent !important; }
html.${ACTIVE_CLASS} body > *:not(#${WRAP_ID}) { visibility: hidden !important; }
#${WRAP_ID} {
  --xba-w: min(330px, calc(100vw - 12px));
  --xba-h: min(64px, calc(100vh - 12px));
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  pointer-events: none; font-family: "Segoe UI", "Selawik", "Noto Sans", Arial, sans-serif;
  color: #fff; -webkit-font-smoothing: antialiased;
}
.xba-toast {
  position: relative; display: flex; align-items: center; overflow: hidden;
  height: var(--xba-h); width: var(--xba-h); border-radius: calc(var(--xba-h) / 2);
  background: rgba(24, 24, 24, 0.97); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
  animation:
    xba-pop 300ms cubic-bezier(0.2, 1.5, 0.4, 1) both,
    xba-expand 460ms cubic-bezier(0.2, 0.8, 0.2, 1) 420ms forwards,
    xba-collapse 380ms cubic-bezier(0.6, 0, 0.8, 0.2) calc(var(--xba-dur) - 820ms) forwards,
    xba-vanish 260ms ease-in calc(var(--xba-dur) - 420ms) forwards;
}
.xba-badge {
  position: relative; flex: 0 0 var(--xba-h); height: var(--xba-h); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 35% 30%, #2fbf2f, #107c10 70%);
}
.xba-badge svg { width: 48%; height: 48%; color: #fff; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35)); }
.xba-badge::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.85);
  animation: xba-ring 700ms ease-out 220ms both;
}
.xba-text {
  flex: 1; min-width: 0; padding: 0 16px 0 12px; opacity: 0;
  animation: xba-fade-in 260ms ease 700ms forwards, xba-fade-out 180ms ease calc(var(--xba-dur) - 900ms) forwards;
}
.xba-title { font-size: 14px; font-weight: 700; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.xba-sub {
  margin-top: 2px; font-size: 13px; line-height: 1.25; color: #cfcfcf;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.xba-pct { color: #8fd18f; font-weight: 600; }
.xba-pct svg { width: 11px; height: 11px; vertical-align: -1px; margin-right: 3px; }

/* Rare: purple badge, sparkles and a different heading, like the Xbox rare achievement. */
.xba-rare .xba-badge { background: radial-gradient(circle at 35% 30%, #c08cff, #7b2fd0 55%, #3b138f); }
.xba-rare .xba-pct { color: #d2b0ff; }
.xba-spark {
  position: absolute; width: 7px; height: 7px; background: #fff; border-radius: 1px;
  transform: rotate(45deg) scale(0); box-shadow: 0 0 8px #d9b8ff;
  animation: xba-spark 900ms ease-out both;
}

@keyframes xba-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes xba-expand { from { width: var(--xba-h); } to { width: var(--xba-w); } }
@keyframes xba-collapse { from { width: var(--xba-w); } to { width: var(--xba-h); } }
@keyframes xba-vanish { from { transform: scale(1); opacity: 1; } to { transform: scale(0.2); opacity: 0; } }
@keyframes xba-ring { from { transform: scale(0.7); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
@keyframes xba-fade-in { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
@keyframes xba-fade-out { to { opacity: 0; } }
@keyframes xba-spark {
  0% { transform: rotate(45deg) scale(0); opacity: 1; }
  60% { transform: translate(var(--dx), var(--dy)) rotate(45deg) scale(1); opacity: 1; }
  100% { transform: translate(calc(var(--dx) * 1.4), calc(var(--dy) * 1.4)) rotate(45deg) scale(0); opacity: 0; }
}

/* PlayStation 5: a dark rounded card with the trophy's art, its name and the trophy grade. */
.xps-card {
  position: relative; display: flex; align-items: center; gap: 12px; overflow: hidden; box-sizing: border-box;
  width: min(312px, calc(100vw - 8px)); height: min(68px, calc(100vh - 8px)); padding: 0 16px 0 8px;
  border-radius: 12px; background: rgba(30, 31, 36, 0.96); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-family: "SST", "SST Pro", "Noto Sans", Arial, sans-serif;
  animation:
    xps-in 420ms cubic-bezier(0.2, 0.9, 0.3, 1) both,
    xps-out 320ms ease-in calc(var(--xba-dur) - 340ms) forwards;
}
.xps-art {
  position: relative; flex: 0 0 52px; height: 52px; border-radius: 8px; overflow: hidden;
  background: #15161a; display: flex; align-items: center; justify-content: center; color: var(--xps-tier);
}
.xps-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.xps-art > svg { width: 60%; height: 60%; }
.xps-art::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.45) 50%, transparent 70%);
  transform: translateX(-120%); animation: xps-shine 900ms ease-out 380ms forwards;
}
.xps-text { flex: 1; min-width: 0; }
.xps-name { font-size: 14px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.xps-tier {
  display: flex; align-items: center; gap: 5px; margin-top: 3px; font-size: 12px; line-height: 1.3; color: #c9c9cf;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.xps-tier svg { flex: 0 0 13px; width: 13px; height: 13px; color: var(--xps-tier); }
.xps-tier b { color: var(--xps-tier); font-weight: 600; }
.xps-bronze { --xps-tier: #d08a55; }
.xps-silver { --xps-tier: #c4ccd6; }
.xps-gold { --xps-tier: #f0c24f; }
.xps-gold .xps-card { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(240, 194, 79, 0.35); }

@keyframes xps-in { from { opacity: 0; transform: translateY(-16px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes xps-out { to { opacity: 0; transform: translateY(-10px); } }
@keyframes xps-shine { to { transform: translateX(120%); } }

@media (prefers-reduced-motion: reduce) {
  .xba-toast { animation: none; width: var(--xba-w); }
  .xba-text { animation: none; opacity: 1; }
  .xba-badge::after, .xba-spark, .xps-art::after { display: none; }
  .xps-card { animation: none; }
}
`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function formatPct(pct: number): string {
  const digits = pct < 1 ? 1 : 0;
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

/** Steam's toast window: named "notificationtoasts_uidN", with the same N as the Steam menu window. */
function toastWindowName(): string | null {
  try {
    const nav = (window as any).SteamUIStore?.m_GamepadNavigationManager ?? (window as any).FocusNavController;
    for (const ctx of nav?.m_rgAllContexts ?? []) {
      for (const tree of ctx?.m_rgGamepadNavigationTrees ?? []) {
        const m = /^(?:MainMenu|QuickAccess)_(uid\d+)$/.exec(tree?.m_window?.document?.title ?? "");
        if (m) return `notificationtoasts_${m[1]}`;
      }
    }
  } catch {
    // fall through
  }
  return null;
}

let cachedWindow: Window | null = null;

/**
 * The toast window isn't kept anywhere reachable, but window.open with an existing window's name
 * returns that window without navigating it. If no such window exists a blank one would open, so
 * anything that isn't the toast window is closed straight away.
 */
function toastWindow(): Window | null {
  const name = toastWindowName();
  if (!name) return null;
  try {
    if (cachedWindow && !cachedWindow.closed && cachedWindow.name === name) return cachedWindow;
    const w = window.open("", name);
    if (!w) return null;
    if (w.document?.title !== name) {
      w.close();
      return null;
    }
    cachedWindow = w;
    return w;
  } catch {
    return null;
  }
}

let hideTimer: number | undefined;

function clear(doc: Document) {
  doc.getElementById(WRAP_ID)?.remove();
  doc.documentElement.classList.remove(ACTIVE_CLASS);
}

export type Tier = "bronze" | "silver" | "gold";

/** Steam has no trophy grades, so the PlayStation card grades by rarity: rare ones are gold. */
function tierFor(a: Achievement, rare: boolean): Tier {
  if (rare) return "gold";
  return a.pct < 30 ? "silver" : "bronze";
}

function xboxMarkup(a: Achievement, rare: boolean, showRarity: boolean): string {
  const sub = showRarity
    ? `<span class="xba-pct">${rare ? DIAMOND_SVG : ""}${escapeHtml(t.players(formatPct(a.pct)))}</span> · ${escapeHtml(a.name)}`
    : escapeHtml(a.name);
  const sparks = rare
    ? [
        [-26, -24],
        [28, -22],
        [-30, 18],
        [26, 24],
        [0, -32],
      ]
        .map(
          ([dx, dy], i) =>
            `<span class="xba-spark" style="left:calc(var(--xba-h)/2 - 3px);top:calc(var(--xba-h)/2 - 3px);--dx:${dx}px;--dy:${dy}px;animation-delay:${260 + i * 60}ms"></span>`,
        )
        .join("")
    : "";
  return `
    <div class="xba-toast ${rare ? "xba-rare" : ""}" role="status">
      <div class="xba-badge">${TROPHY_SVG}</div>
      ${sparks}
      <div class="xba-text">
        <div class="xba-title">${escapeHtml(rare ? t.rareUnlocked : t.unlocked)}</div>
        <div class="xba-sub">${sub}</div>
      </div>
    </div>`;
}

function playstationMarkup(a: Achievement, rare: boolean, showRarity: boolean): string {
  const tier = tierFor(a, rare);
  const art = /^(https?:|data:image\/)/.test(a.image) ? `<img src="${escapeHtml(a.image)}" alt="">` : TROPHY_SVG;
  const rarity = showRarity ? ` · ${escapeHtml(t.players(formatPct(a.pct)))}` : "";
  return `
    <div class="xps-${tier}">
      <div class="xps-card" role="status">
        <div class="xps-art">${art}</div>
        <div class="xps-text">
          <div class="xps-name">${escapeHtml(a.name)}</div>
          <div class="xps-tier">${TROPHY_SVG}<span><b>${escapeHtml(t.tiers[tier])}</b>${rarity}</span></div>
        </div>
      </div>
    </div>`;
}

/** Draws the toast. Returns false if Steam's toast window couldn't be reached (Steam's own toast then shows). */
export function showToast(a: Achievement, skin: Skin, rare: boolean, showRarity: boolean): boolean {
  const w = toastWindow();
  const doc = w?.document;
  if (!doc?.body) return false;

  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  clear(doc);

  const wrap = doc.createElement("div");
  wrap.id = WRAP_ID;
  wrap.style.setProperty("--xba-dur", `${a.durationMs}ms`);
  wrap.innerHTML = skin === "playstation" ? playstationMarkup(a, rare, showRarity) : xboxMarkup(a, rare, showRarity);
  doc.body.appendChild(wrap);
  doc.documentElement.classList.add(ACTIVE_CLASS);
  hideTimer = window.setTimeout(() => clear(doc), a.durationMs + 150);
  return true;
}

export function removeToastStyles() {
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  const doc = cachedWindow && !cachedWindow.closed ? cachedWindow.document : null;
  if (doc) {
    clear(doc);
    doc.getElementById(STYLE_ID)?.remove();
  }
  cachedWindow = null;
}
