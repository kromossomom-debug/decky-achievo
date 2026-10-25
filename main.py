import base64
import json
import os

import decky

SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
SOUND_TYPES = {".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".flac": "audio/flac"}
MAX_SOUND_BYTES = 3 * 1024 * 1024


class Plugin:
    async def get_settings(self) -> dict:
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except Exception as e:
            decky.logger.error(f"Could not read settings: {e}")
            return {}

    async def set_settings(self, settings: dict) -> bool:
        try:
            os.makedirs(decky.DECKY_PLUGIN_SETTINGS_DIR, exist_ok=True)
            tmp = SETTINGS_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2)
            os.replace(tmp, SETTINGS_FILE)
            return True
        except Exception as e:
            decky.logger.error(f"Could not save settings: {e}")
            return False

    async def read_sound(self, path: str) -> dict | None:
        """The player's own achievement sound, as base64, so the UI can play it from memory."""
        mime = SOUND_TYPES.get(os.path.splitext(path)[1].lower())
        if not mime:
            return None
        try:
            if os.path.getsize(path) > MAX_SOUND_BYTES:
                return None
            with open(path, "rb") as f:
                return {"mime": mime, "data": base64.b64encode(f.read()).decode("ascii")}
        except OSError as e:
            decky.logger.error(f"Could not read sound {path}: {e}")
            return None

    async def _main(self):
        decky.logger.info("Xbox Achievements loaded")

    async def _unload(self):
        decky.logger.info("Xbox Achievements unloaded")
