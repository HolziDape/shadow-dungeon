# Home Screen Background, Roadmap Preview & Skill-Reveal Pack — Design Spec
Date: 2026-09-15

## Context
Shadow Dungeon's Home screen (`#fight-screen`, shown via `window.showFight()`) shows a spiral level roadmap (`renderLevelRoadmap()` in `game.js`) against a flat, undecorated background (`.cosmic-bg` — deliberately stripped of an earlier soft-glow nebula treatment to match the flat pixel-art direction). Note: `#hub-screen`/`showHub()` is a different screen (the Upgrades tab) — not to be confused with the Home/Fight screen this spec targets. Two problems with the roadmap today:

1. The reward marker (every 3rd level) is a generic chest icon that doesn't say what's inside.
2. The skill-unlock marker is a generic sparkle icon (`sparkSvg`), not the actual ability's icon — you can't tell what you're unlocking without a hover tooltip (which doesn't work on touch).

Separately, the Skills tab (`renderAbilityArchive()`) shows full name/icon/description for locked abilities — no mystery/progression tension. And there's no ceremony when a level-up actually grants a new skill; it just silently becomes available.

This spec covers four connected changes: a background for the Home screen, a tap-to-preview interaction on roadmap nodes, hiding locked skills until unlocked, and a new drag-to-tear pack-opening reveal that fires the first time the player reaches a level that grants a new skill.

## 1. Home Screen Background

Static starfield in `.cosmic-bg`: ~40-60 pixel stars (2-3 fixed sizes), scattered positions, rendered once (CSS `box-shadow` trick or a handful of absolutely-positioned `<div>`s — no canvas, no JS per frame). A subset (~15%) gets a slow `opacity` `@keyframes` pulse (3-5s, staggered `animation-delay`) for a twinkle effect. No parallax, no scroll coupling — zero per-frame JS cost.

## 2. Roadmap Node Redesign

- **Skill badge**: replace `sparkSvg` with the real ability icon via the existing `getAbilityIconMarkup(id, fallback)` helper, sized down (~16px) to fit the badge pill. Same icon the player already recognizes from the in-run ability picker and the Skills tab.
- **Reward chest**: visual unchanged (stays a chest icon), but becomes tappable.
- **Node tap → preview popup**: any `.lr-node` with `reward` and/or `ability` set gets `onclick`. Reuses the existing `.modal-overlay` centered-card pattern (same family as Daily Rewards / Challenges). Content:
  - Reward present → gold amount, gem amount, pack name, computed for that node's specific level by applying the exact same formula `victory()`'s milestone bonus already uses (`getLevelGoldReward(lvl)` × `getEconomyMultiplier()` × 0.5 for gold, `5 + floor(lvl/4)` for gems, the same `packKey` level thresholds) — not a live run variable, since the node being previewed is usually a future level, not the level just completed. No new numbers invented, just the existing formula evaluated at a different level.
  - Ability present → icon, name, rarity, description (from `ABILITIES`, via `tSkill()` for i18n like the archive already does).
  - Both present → both sections stacked in one popup.
- Nodes with neither stay non-interactive (nothing to show).

## 3. Skills Tab: Hide Locked Abilities

In `renderAbilityArchive()`, for `!unlocked` cards:
- Icon slot renders a lock silhouette (`icons/small/lock-48.png`) instead of `getAbilityIconMarkup(...)`.
- Name renders as `???` instead of `dispName`.
- Description is omitted entirely (not rendered, not just visually hidden — no spoiler in the DOM).
- Border/rarity color and the existing `"Locked from Lv X"` meta line stay exactly as today, so progression info (how many skills remain, at what levels) is still visible.
- No new state: this is a pure render-time branch on the same `unlocked` boolean already computed. Cards already re-render automatically whenever `save.unlocked` changes (via existing call sites), so a card flips from `???` to real content the moment its level is reached — no reload needed.

## 4. Skill-Reveal Pack (Drag-to-Tear)

### Trigger
In `victory()`, right after `save.unlocked = Math.max(save.unlocked, currentLevel + 1)`, check `ABILITIES.find(a => (a.unlockLevel || 1) === save.unlocked)`. If found, set `save.pendingSkillReveal = ability.id` (new save field, default `null`). Victory/result flow is otherwise unchanged.

The reveal does **not** fire inside the Result overlay. On the next `showFight()` call (landing back on the Home screen — this already fires from the Victory/Death "Home" buttons, the nav rail, and every other path back to Home), check `save.pendingSkillReveal`: if set, launch the reveal sequence after the roadmap renders, then clear the field. This guarantees the pack opens exactly once, on the Home screen, regardless of how the player navigates there.

### Asset
Four hero-scale foil-pack illustrations (one per ability rarity: common/rare/epic/legendary), 1024×1536px portrait, matching the game's flat pixel-art style — user is generating these in the existing "Shadow Dungeon pixel icons" Claude Design project. Filenames: `icons/skill-pack-common-hero.png`, `-rare-`, `-epic-`, `-legendary-hero.png`. Each shows a closed, foil-wrapped pack with a shallow-diagonal tear-seam across the top third and a thin light leak along the seam — no separate "torn open" art; the tear itself is animated.

**Fallback while assets don't exist yet:** if the rarity-specific hero file 404s (checked via `Image.onerror` before first paint), fall back to the existing `icons/pack.png` at reduced/centered size with a CSS rarity-colored border glow, so the feature is fully functional before final art lands.

### Reveal Sequence (`openSkillRevealSequence(abilityId)`)
New function, new overlay markup (`#skill-reveal-overlay`), separate from `#pack-overlay` — this does not touch `save.packs`/`save.inventory`/the gacha reel, since nothing is being rolled; the skill is already unlocked, this is pure ceremony.

1. Overlay opens, hero pack image centered (~50% viewport height), tear-seam visible, ambient light-leak glow along the seam (CSS, matches rarity color).
2. Input: pointer/touch drag handler on the pack element, structurally modeled on the existing swipe-gesture pattern in `game.js` (`down`/`move`/`up` with `touchstart`/`touchmove`/`touchend` + mouse fallback, distance + time thresholds). Dragging down past a threshold (or a plain tap, as a no-drag fallback) commits the tear; dragging less than the threshold snaps back with a small spring transition.
3. On commit: top portion of the pack image transforms away (CSS `transform: translateY/rotate` + `clip-path` split along the seam line), light bursts through the gap — reuses the existing pack system's ray/particle DOM pieces (`pack-stage-rays`, `pack-confetti`) rather than building new ones.
4. The ability's own card (icon via `getAbilityIconMarkup`, name, rarity color, description) scales/fades in, matching the visual language of the in-run ability-pick diamonds.
5. A single "NICE" / continue button closes the overlay back to the Home screen. No claim/currency step — nothing to collect, the unlock already happened.

### New Save State
Only one field: `save.pendingSkillReveal` (string ability id, or `null`), added to the default `save` object alongside the other flags at the top of `game.js`.

## Files Changed
- `game.js` — `renderLevelRoadmap()` (skill icon swap, node click handler, preview popup render), `renderAbilityArchive()` (locked-card obscuring), `victory()` (set `pendingSkillReveal`), `showFight()` (consume `pendingSkillReveal` → trigger reveal), new `openSkillRevealSequence(abilityId)` + drag-gesture handler, default `save` object (+`pendingSkillReveal`).
- `index.html` — starfield container markup (or generated via JS into `.cosmic-bg`), new `#skill-reveal-overlay` markup (pack image, tear-seam layer, reveal card, continue button) reusing `#pack-stage-rays`/`#pack-confetti` structure.
- `index.css` — starfield stars + twinkle keyframes, `.lr-node` click affordance, roadmap preview popup styling (reuses `.modal-overlay` family), locked-ability-card styling (reuses lock-icon pattern from locked Loadout slots), `#skill-reveal-overlay` + tear-seam/drag transform styles per rarity tier.
- New assets (user-provided via Claude Design): `icons/skill-pack-{common,rare,epic,legendary}-hero.png`.
