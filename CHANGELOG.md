# Shadow Dungeon — CHANGELOG & Project Notes

> **House rule for future runs:** every time something new is added, changed,
> or removed, append an entry to this file. Use the same headings as below.
> Tasks are marked with `!` only when they have been finished — pending work
> stays without the `!`.

---

## File-by-file overview (`main/`)

| File | Purpose | Notes |
| --- | --- | --- |
| `index.html` | App shell, all screens, modals (settings, daily, shop, etc.), nav bar. | Holds DOM ids that JS hooks into. |
| `index.css` | Full stylesheet — HUD, fight screen, level roadmap, shop, packs, modals. | Contains theme CSS variables and pack-tier theming. |
| `config.js` | Game tuning data: `UPGRADES`, `ABILITIES` (skill tree), `ENEMY_TYPES`, `SHOP_SECTIONS`, `PACK_DEFINITIONS`, `SKIN_DEFINITIONS`, `INVENTORY_CARDS`, level reward formulas. | Pure data + helper math. No DOM. |
| `render.js` | Canvas drawing for the in-game frame: enemies, projectiles, ship, HUD pills, hearts. | Runs every frame via `render()`. |
| `game.js` | Everything else — boot, save/load, screens, daily login, abilities, packs, settings, shop, loadout, audio, haptics, i18n. | Largest file, organised by feature. |
| `CHANGELOG.md` | This file. Living document of what exists and what changed. | Always update when something new lands. |

---

## Run summary (current session) — what was done

! Inventoried every file in `main/` and the 6 reference images in `data/shop layout/`.
! Switched the app default language to **English**, with a **Language** toggle in Settings (English / Deutsch). All visible strings now go through `t(key)`.
! Renamed **Prämien → Daily Login** (DE: "Täglicher Login") in the right rail and the daily overlay.
! Renamed **Flugzeuge → Equipment** (DE: "Ausrüstung") in the bottom nav and Equipment screen.
! In Equipment, every slot now shows the level it unlocks at (e.g. "Lv 30") and the screen shows the **max slot cap** (Normal: 5 base + 2 paid = 7, Legendary: 2 base + 1 paid = 3) so nobody buys phantom slot expansions.
! The level roadmap is a proper **spiral** with breathing room between nodes, a connecting line, **chest reward every 3rd level** (gold + gems + a level-appropriate pack), and a **skill unlock dot** branching off every level that unlocks a new ability.
! Each shop pack now has a **distinct visual theme** (colour family + foil + glow) keyed off its `pack_id` instead of one generic gradient.
! After each run, the result overlay shows a **"Skills used"** block listing the abilities the player picked and at what rank.
! Rail badges (`!` markers) only render when something is actually claimable / pending — empty states no longer pulse for no reason.

## Open question — haptic feedback over GitHub Pages on mobile

GitHub Pages just serves static files, so the haptic question is really
"does the browser allow this site to vibrate?". The answer is: partially.

- **Android Chrome / Edge / Samsung Internet:** `navigator.vibrate(...)` works.
  The site already calls it from `playHaptic()` in `game.js`, so a GitHub-hosted
  build vibrates fine on Android. No special permission, no install needed.
- **iOS Safari:** Apple removed the Vibration API. There is no general web
  haptic on iPhone. The only way to get haptic on iOS through a webpage is
  inside a host app that exposes its own bridge — e.g. **Telegram Mini Apps**
  (`window.Telegram.WebApp.HapticFeedback`), which the code already uses as a
  fallback. So if the site is opened inside Telegram on iOS, haptic works; if
  it's opened in plain Safari, it doesn't.
- **PWA / "Add to Home Screen":** doesn't change the answer — it's still the
  underlying browser engine, so still no Safari vibration on iOS.

Practical takeaway: the game's haptic code is already written the right way
(Telegram first, `navigator.vibrate` fallback). Hosting from GitHub Pages
doesn't block anything. The only real limitation is iOS Safari itself.

---

## Conventions

- **Strings.** Every user-facing string lives in the `I18N` dictionary in
  `game.js`. Reach for `t('key')` instead of hardcoding text.
- **Renames.** When a label changes, also rename it in the `I18N` dictionary
  (both `en` and `de`) so the German fallback stays in sync.
- **New screen / modal.** Wire it into `showScreen()` and add an entry to
  this changelog explaining what it does.
- **New pack tier.** Add `tier-<pack_id>` styles in `index.css` AND register
  the pack in `PACK_DEFINITIONS` in `config.js`.
- **New shop slot expansion.** Update `getLoadoutSlotCaps()` in `game.js`
  AND the cap copy in `renderLoadout()` so the player can see the ceiling.
