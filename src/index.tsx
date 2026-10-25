import { definePlugin, openFilePicker, toaster } from "@decky/api";
import {
  ButtonItem,
  DropdownItem,
  Navigation,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
  staticClasses,
} from "@decky/ui";
import { FaCoffee, FaTrophy } from "react-icons/fa";

import { t } from "./i18n";
import { place, removePlacement, unplace } from "./place";
import { DEFAULT_SETTINGS, Position, SoundMode, getSettings, initSettings, updateSettings, useSettings } from "./settings";
import { closeAudio, loadCustomSound, playChime, playCustom } from "./sound";
import { Achievement, removeToastStyles, showToast } from "./toast";

/** Steam's notification type for achievements (EClientUINotificationType.Achievement). */
const ACHIEVEMENT_TYPE = 5;
const DEFAULT_DURATION_MS = 5000;
const DONATE_URL = "https://buymeacoffee.com/kromossomoc";
/** FileSelectionType.FILE from @decky/api (a const enum, so it can't be imported at runtime). */
const FILE_SELECTION = 0;

declare const NotificationStore: any;
declare const collectionStore: any;

/** Set by the test buttons so one test toast can show the normal or the rare version on purpose. */
let forceRare: boolean | null = null;

function readAchievement(toast: any): (Achievement & { rare: boolean }) | null {
  if (toast?.eType !== ACHIEVEMENT_TYPE) return null;
  const d = toast.data;
  const get = (name: string) => {
    try {
      return d?.[name]?.();
    } catch {
      return undefined;
    }
  };
  // Progress updates ("3/10") come through the same type, unachieved; Steam keeps those.
  if (!get("achieved")) return null;
  const pct = Number(get("global_achieved_pct") ?? 100);
  const rare = forceRare ?? pct < getSettings().rareThreshold;
  return {
    name: String(get("name") ?? ""),
    description: String(get("description") ?? ""),
    image: String(get("image_url") ?? ""),
    pct,
    durationMs: toast.nToastDurationMS || DEFAULT_DURATION_MS,
    rare,
  };
}

const POSITIONS: Position[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
/** Time after our toast ends before Steam's toast spot goes back to its corner. */
const UNPLACE_DELAY_MS = 300;

function onToast(toast: any) {
  const s = getSettings();
  // The current toast goes back to null right after Steam queues it, so only ours are acted on.
  const a = s.enabled ? readAchievement(toast) : null;
  if (!a) return;
  if (showToast(a, a.rare, s.showRarity)) {
    place(s.position, s.edgeGap);
    unplace(a.durationMs + UNPLACE_DELAY_MS);
  }
  forceRare = null;
}

let originalPlaySound: ((n: any) => void) | undefined;

/** Steam picks the toast sound in PlayNotificationSound; achievements get ours instead. */
function patchSound() {
  if (originalPlaySound || typeof NotificationStore?.PlayNotificationSound !== "function") return;
  originalPlaySound = NotificationStore.PlayNotificationSound;
  NotificationStore.PlayNotificationSound = function (n: any) {
    const s = getSettings();
    const a = s.enabled ? readAchievement(n) : null;
    if (!a || s.sound === "steam") return originalPlaySound!.call(this, n);
    if (s.sound === "chime") playChime(a.rare, s.volume);
    else if (s.sound === "custom") {
      playCustom(s.customPath, s.volume).then((ok) => {
        if (!ok) playChime(a.rare, s.volume);
      });
    }
  };
}

function unpatchSound() {
  if (originalPlaySound && NotificationStore) {
    // The override is an own property; deleting it exposes Steam's prototype method again.
    delete NotificationStore.PlayNotificationSound;
  }
  originalPlaySound = undefined;
}

/** A game the player has played recently, so the test can use one of its real achievements. */
function testAppId(): number | undefined {
  try {
    const recent = collectionStore.recentAppsCollection?.visibleApps ?? [];
    return recent.find((a: any) => a.app_type === 1)?.appid ?? collectionStore.myGamesCollection?.visibleApps?.[0]?.appid;
  } catch {
    return undefined;
  }
}

function runTest(rare: boolean) {
  const appid = testAppId();
  if (!appid) {
    toaster.toast({ title: t.testSection, body: t.testNeedsGame });
    return;
  }
  forceRare = rare;
  Navigation.CloseSideMenus();
  // Steam's own test hook builds a real achievement notification for that game.
  void NotificationStore?.TestAchievement?.(appid);
}

async function pickSoundFile() {
  try {
    const res = await openFilePicker(FILE_SELECTION as any, "/home/deck", true, true, undefined, ["mp3", "ogg", "wav", "flac"]);
    if (!res?.realpath) return;
    if (await loadCustomSound(res.realpath)) updateSettings({ customPath: res.realpath, sound: "custom" });
    else toaster.toast({ title: t.soundSection, body: t.fileError });
  } catch {
    // Picker closed.
  }
}

function Content() {
  const st = useSettings();
  const change = updateSettings;
  const fileName = st.customPath ? st.customPath.split("/").pop() : t.noFile;

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <ToggleField label={t.enableLabel} description={t.enableDesc} checked={st.enabled} onChange={(enabled) => change({ enabled })} />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t.soundSection}>
        <PanelSectionRow>
          <DropdownItem
            label={t.soundLabel}
            rgOptions={[
              { data: "chime", label: t.soundChime },
              { data: "custom", label: t.soundCustom },
              { data: "steam", label: t.soundSteam },
              { data: "none", label: t.soundNone },
            ]}
            selectedOption={st.sound}
            onChange={(o) => change({ sound: o.data as SoundMode })}
          />
        </PanelSectionRow>
        {st.sound === "custom" && (
          <PanelSectionRow>
            <ButtonItem layout="below" description={`${fileName} · ${t.fileHint}`} onClick={pickSoundFile}>
              {t.pickFile}
            </ButtonItem>
          </PanelSectionRow>
        )}
        {(st.sound === "chime" || st.sound === "custom") && (
          <PanelSectionRow>
            <SliderField label={t.volume} value={st.volume} min={0} max={100} step={5} showValue onChange={(volume) => change({ volume })} />
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title={t.positionSection}>
        <PanelSectionRow>
          <DropdownItem
            label={t.positionLabel}
            rgOptions={POSITIONS.map((p) => ({ data: p, label: t.positions[p] }))}
            selectedOption={st.position}
            onChange={(o) => change({ position: o.data as Position })}
          />
        </PanelSectionRow>
        {st.position !== "mc" && (
          <PanelSectionRow>
            <SliderField
              label={t.edgeGap}
              value={st.edgeGap}
              min={0}
              max={120}
              step={4}
              showValue
              valueSuffix=" px"
              onChange={(edgeGap) => change({ edgeGap })}
            />
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title={t.rareSection}>
        <PanelSectionRow>
          <SliderField
            label={t.rareLabel}
            description={t.rareDesc}
            value={st.rareThreshold}
            min={1}
            max={25}
            step={1}
            showValue
            valueSuffix="%"
            onChange={(rareThreshold) => change({ rareThreshold })}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label={t.showRarity} checked={st.showRarity} onChange={(showRarity) => change({ showRarity })} />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t.testSection}>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => runTest(false)}>
            {t.testNormal}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => runTest(true)}>
            {t.testRare}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t.supportSection}>
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "6px" }}>{t.supportText}</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Navigation.CloseSideMenus();
              Navigation.NavigateToExternalWeb(DONATE_URL);
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <FaCoffee /> Buy Me a Coffee
            </span>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => change({ ...DEFAULT_SETTINGS, customPath: st.customPath })}>
            {t.reset}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

export default definePlugin(() => {
  let subscription: any;
  initSettings().finally(() => {
    patchSound();
    try {
      subscription = NotificationStore?.m_valueCurrentToast?.Subscribe?.(onToast);
    } catch (e) {
      console.error("[xbox-achievements] subscribe failed", e);
    }
  });

  return {
    name: "Xbox Achievement Toast",
    titleView: <div className={staticClasses.Title}>Xbox Achievement Toast</div>,
    content: <Content />,
    icon: <FaTrophy />,
    onDismount() {
      try {
        subscription?.Unsubscribe?.();
      } catch {
        // already gone
      }
      unpatchSound();
      removeToastStyles();
      removePlacement();
      closeAudio();
    },
  };
});
