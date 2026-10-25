# Changelog

All notable changes to Achievo. Versions are alphas: install the ZIP from each release
with Decky's **Developer → Install Plugin from ZIP**.

## [0.0.3-alpha] - 2026-10-25

### Changed
- **The plugin is now called Achievo**, since it does both Xbox and PlayStation styles. The ZIP is
  `achievo.zip` and the repository moved to `kromossomom-debug/decky-achievo` (the old link redirects).
  If you installed an earlier version, uninstall “Xbox Achievement Toast” in Decky first; settings start
  fresh under `~/homebrew/settings/achievo/`.

## [0.0.2-alpha] - 2026-10-25

### Added
- **PlayStation 5 style.** Pick **Style → PlayStation 5** in the panel for a trophy card instead of the
  Xbox pill: a dark rounded card that drops in with the achievement's art, its name and a trophy grade
  (**Gold** for rare achievements, **Silver** under 30% of players, **Bronze** otherwise).
- An original PlayStation-style chime: a soft bell “ting”, two notes for gold trophies.
- Each style has its usual spot: bottom center for Xbox, top right for PlayStation. Switching style moves
  the toast there, unless you had chosen another spot.

## [0.0.1-alpha] - 2026-10-25

### Added
- **Xbox-style achievement toast**: the round green badge pops in with a ring pulse, the dark pill slides
  open with “Achievement unlocked”, the % of players and the achievement's name, then folds back up.
- **Rare achievements** (below 10% of players by default, adjustable): “Rare achievement unlocked”,
  purple badge, diamond icon and sparkles.
- **Position**: 9 spots on the screen (top, middle or bottom; left, center or right) and the distance
  from the edge. Bottom center by default, like on Xbox.
- **Sound**: an original Xbox-style chime (three notes for rare ones), your own MP3 / OGG / WAV / FLAC
  file, Steam's sound or none, with a volume slider.
- **Test buttons** for a normal and a rare toast, using a game you played recently.
- English and Portuguese, following Steam's language.
- Buy Me a Coffee button in the panel.
