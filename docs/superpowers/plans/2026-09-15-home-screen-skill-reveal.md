# Home Screen Background, Roadmap Preview & Skill-Reveal Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a starfield background to the Home screen, make roadmap nodes tappable with a reward/skill preview, hide locked skills in the Skills tab until unlocked, and add a drag-to-tear "skill reveal" pack-opening moment that fires the first time a level-up grants a new skill.

**Architecture:** Four additive features layered onto the existing Home (`#fight-screen`), Skills (`#abilities-screen`), and save-data flow. No new subsystems — reuses the existing `.modal-overlay` popup family, the existing `getAbilityIconMarkup()` icon lookup, the existing `.pack-reveal-face`/`.prf-*` hero-card component, and a swipe-gesture pattern already used elsewhere in the file. One new save field (`save.pendingSkillReveal`).

**Tech Stack:** Vanilla JS (`game.js`), static HTML (`index.html`), CSS (`index.css`). No build step, no test framework — this project is verified by `node --check` (syntax) plus live Playwright browser checks against a locally served copy, which is what every task's "test" step below does.

**Spec:** `docs/superpowers/specs/2026-09-15-home-screen-skill-reveal-design.md`

## Global Constraints

- **Dual-folder workflow:** all edits happen in `C:\Users\damja\.gemini\antigravity\scratch\shadow-dungeon\redesign2\` (the untracked working copy served by the standing dev server). This folder is NOT the git repo. After a task's change is verified live, copy the exact files touched into `C:\Users\damja\.gemini\antigravity\scratch\shadow-dungeon\main\` (the git-tracked sibling folder, branch `redesign/optimation`) before running `git add`/`git commit` there. Never `git commit` from inside `redesign2/`.
- **Verify with a genuinely fresh server.** Browsers aggressively cache `game.js`/`index.css`. For every live-verification step, start a brand-new `python -m http.server <unused port>` in `redesign2/` (reuse of an already-loaded page/tab is not reliable) — `netstat -ano | grep <port>` to confirm it bound, kill it with `taskkill //PID <pid> //F` when done with that task's checks.
- **`node --check redesign2/game.js`** after every `game.js` edit, before any live check.
- Existing rarity color tokens (do not redefine, only reference): `--r-blue:#29d1ff` (rare), `--r-dark:#9b7bff` (used as "epic" in some older contexts — NOT used here), `--r-purple:#ff5fd1` (epic), `--r-gold:#ffcd3c` (legendary), plus the ability-archive-specific common color `#b9adf0`. Ability rarity tier CSS classes already exist: `.rarity-tier-common/rare/epic/legendary`.
- No new game economy/currency logic anywhere in this plan — the skill-reveal pack grants nothing (the skill is already unlocked by the level-up); it is a reveal animation only.
- Four hero pack images already exist at `redesign2/icons/skill-pack-{common,rare,epic,legendary}-hero.png` (1024×1536, transparent background) — do not regenerate or re-request these.

---

### Task 1: Home Screen Starfield Background

**Files:**
- Modify: `redesign2/game.js` (new `renderStarfield()` function + one call site)
- Modify: `redesign2/index.css` (`.cosmic-bg` star styling + twinkle keyframes)

**Interfaces:**
- Produces: `renderStarfield()` — global function, no args, no return value. Populates `document.querySelector('.cosmic-bg')` with star elements. Idempotent-guarded (a second call is a no-op) so it's safe to call from `window.load` without a "have I run yet" check elsewhere.

- [ ] **Step 1: Write the verification script (expected to fail first)**

Create `redesign2/_verify/task1.js` (throwaway, not committed — see cleanup step) with:

```js
// Run via Playwright browser_evaluate against a fresh server.
() => {
  const bg = document.querySelector('.cosmic-bg');
  const stars = bg ? bg.querySelectorAll('.starfield-star') : [];
  const twinkling = bg ? bg.querySelectorAll('.starfield-star.twinkle') : [];
  return { starCount: stars.length, twinkleCount: twinkling.length };
}
```

- [ ] **Step 2: Run it against the current (unmodified) code to confirm it fails**

Start a fresh server: `cd redesign2 && (python -m http.server 8401 &)`, wait for it to bind, Playwright-navigate to `http://127.0.0.1:8401/index.html`, run the Step 1 script.
Expected: `{ starCount: 0, twinkleCount: 0 }` (nothing renders yet — confirms the check is meaningful).

- [ ] **Step 3: Implement `renderStarfield()`**

In `redesign2/game.js`, add near the other one-time DOM-setup functions (e.g. right above `function installSwipeNavigation()`):

```js
// One-time starfield for the Home screen background — 46 fixed stars,
// ~15% twinkle via a staggered CSS opacity pulse. Rendered once on load,
// never touched again: zero per-frame cost.
function renderStarfield() {
    const host = document.querySelector('.cosmic-bg');
    if (!host || host.querySelector('.starfield-star')) return; // idempotent
    const layer = document.createElement('div');
    layer.className = 'starfield-layer';
    const STAR_COUNT = 46;
    for (let i = 0; i < STAR_COUNT; i++) {
        const star = document.createElement('div');
        const size = i % 5 === 0 ? 'lg' : (i % 2 === 0 ? 'md' : 'sm');
        const twinkle = i % 7 === 0; // ~15%
        star.className = `starfield-star size-${size}${twinkle ? ' twinkle' : ''}`;
        star.style.left = `${(i * 37) % 100}%`;
        star.style.top = `${(i * 53) % 100}%`;
        if (twinkle) star.style.animationDelay = `${(i % 5) * 0.7}s`;
        layer.appendChild(star);
    }
    host.appendChild(layer);
}
```

Add a call site right after `renderStarfield` is defined is not enough — it must actually run once. Find `window.addEventListener('load', ...)` (the same handler that calls `preloadEnemySprites()`) and add `renderStarfield();` inside it, alongside that call.

- [ ] **Step 4: Add CSS for the stars**

In `redesign2/index.css`, right after the existing `.cosmic-bg { ... }` rule (search `Flat matte background`), add:

```css
.starfield-layer { position: absolute; inset: 0; overflow: hidden; }
.starfield-star {
  position: absolute;
  background: #fff;
  border-radius: 1px;
  opacity: 0.5;
}
.starfield-star.size-sm { width: 2px; height: 2px; opacity: 0.35; }
.starfield-star.size-md { width: 3px; height: 3px; opacity: 0.5; }
.starfield-star.size-lg { width: 4px; height: 4px; opacity: 0.65; }
.starfield-star.twinkle { animation: starTwinkle 4s ease-in-out infinite; }
@keyframes starTwinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}
```

- [ ] **Step 5: Run the verification script again to confirm it passes**

Kill the old server (`taskkill //PID <pid> //F`), start a brand-new one on a different port (e.g. 8402), navigate, run the Step 1 script.
Expected: `{ starCount: 46, twinkleCount: 7 }` (46 total, i % 7 === 0 for i in 0..45 → 7 matches: 0,7,14,21,28,35,42).

- [ ] **Step 6: Visual sanity screenshot**

Playwright screenshot of `#fight-screen` at 852×1812. Confirm stars are visible but subtle (not overpowering the roadmap/rails), and that the page doesn't scroll horizontally.

- [ ] **Step 7: Delete the throwaway verify script, sync, and commit**

```bash
rm redesign2/_verify/task1.js
cp redesign2/game.js main/game.js
cp redesign2/index.css main/index.css
cd main
git add game.js index.css
git commit -m "Add twinkling starfield background to the Home screen"
git push origin redesign/optimation
```

---

### Task 2: Roadmap Skill Icon Swap

**Files:**
- Modify: `redesign2/game.js:9031-9037` (skill badge markup in `renderLevelRoadmap()`)
- Modify: `redesign2/index.css` (scoped icon-sizing override for `.lr-skill-tag`)

**Interfaces:**
- Consumes: existing `getAbilityIconMarkup(id, fallback)` (game.js ~9818) — returns `<div class="ability-icon ability-${id}">...</div>` wrapping either an `<img class="ability-icon-img">` or an inline `<svg>`, or the raw `fallback` string if `id` has no entry in its internal map.
- No new exports.

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  // Force at least one skill-bearing node into view by jumping save.unlocked
  // near a known unlockLevel, then re-render.
  const ability = ABILITIES.find(a => a.unlockLevel > 1);
  save.unlocked = Math.max(1, ability.unlockLevel - 3);
  renderLevelRoadmap();
  const tag = document.querySelector('.lr-skill-tag');
  return {
    hasAbilityIconDiv: !!tag?.querySelector('.ability-icon'),
    hasGenericSpark: !!tag?.querySelector('svg polygon[points="12,3 14,10 21,12 14,14 12,21 10,14 3,12 10,10"]')
  };
}
```

- [ ] **Step 2: Run against current code, confirm it fails**

Fresh server on a new port, navigate to `#fight-screen` is the default screen already. Run the script.
Expected: `{ hasAbilityIconDiv: false, hasGenericSpark: true }` (today it's the generic spark, not the real icon).

- [ ] **Step 3: Implement the swap**

In `redesign2/game.js`, inside `renderLevelRoadmap()`, find:

```js
        const skillBadge = p.ability ? `
            <div class="lr-skill-link side-${p.badgeSide}" title="${t('roadmap.skillUnlock')}: ${(typeof tSkill === 'function' && tSkill(p.ability.id)?.name) || p.ability.name}">
                <span class="lr-skill-arm"></span>
                <span class="lr-skill-tag rarity-tier-${(p.ability.rarity || 'common').toLowerCase()}">
                    ${sparkSvg}
                </span>
            </div>` : '';
```

Replace the `${sparkSvg}` line with:

```js
                    ${getAbilityIconMarkup(p.ability.id, sparkSvg)}
```

(Keep `sparkSvg` as the fallback argument — any ability without a specific icon mapping still shows the spark instead of nothing.)

- [ ] **Step 4: Add the CSS override**

In `redesign2/index.css`, right after the existing `.lr-skill-tag svg { ... }` rule, add:

```css
/* Real ability icons dropped into the 22px roadmap badge need to be
   squeezed down from their card-sized default (.ability-icon is 42px/
   26px inner) regardless of whether the inner content is an <img> or an
   inline <svg> — getAbilityIconMarkup() can return either. */
.lr-skill-tag .ability-icon {
  width: 16px; height: 16px;
  border: 0; background: none; margin: 0;
}
.lr-skill-tag .ability-icon-img,
.lr-skill-tag .ability-icon svg {
  width: 14px; height: 14px;
}
```

- [ ] **Step 5: Run the verification script again, confirm it passes**

Fresh server, new port. Expected: `{ hasAbilityIconDiv: true, hasGenericSpark: false }`.

- [ ] **Step 6: Screenshot check**

Screenshot the roadmap area (`#level-roadmap`), confirm the skill badge shows a small recognizable icon (not a broken image, not oversized/clipped).

- [ ] **Step 7: Sync and commit**

```bash
cp redesign2/game.js main/game.js
cp redesign2/index.css main/index.css
cd main
git add game.js index.css
git commit -m "Roadmap: show the real ability icon on skill-unlock nodes instead of a generic spark"
git push origin redesign/optimation
```

---

### Task 3: Roadmap Node Click-to-Preview Popup

**Files:**
- Modify: `redesign2/index.html` (new `#roadmap-preview-overlay` markup, placed alongside the other `.modal-overlay` blocks e.g. right after `#quests-overlay`'s closing `</div>`)
- Modify: `redesign2/game.js` (`renderLevelRoadmap()` — add `onclick` + `data-lvl` is already present; new `window.showRoadmapPreview(lvl)` and `window.closeRoadmapPreview(event)` functions; new small helper `getRoadmapRewardPreview(lvl)`)
- Modify: `redesign2/index.css` (popup content rows — reuses `.modal-overlay`/`.lb-style-modal`/`.lb-style-close`/`.lb-style-header` already defined for Daily/Quests, only new CSS is the reward/skill row layout)

**Interfaces:**
- Consumes: `getLevelGoldReward(level)` (config.js:690, pure function of level), `getEconomyMultiplier()` (game.js:1616, no args), `PACK_DEFINITIONS[key].name` (config.js:829), `ABILITIES` array, `tSkill(id)` (existing i18n lookup, returns `{name, desc}` or null), `getAbilityIconMarkup(id, fallback)`. Note: `getRarityLabel(rarity)` (game.js:7117) is the EQUIPMENT rarity vocabulary (blue/dark/purple/red/gold) — do not use it for ability rarities (common/rare/epic/legendary); the existing convention for ability rarity display, already used in `renderAbilityArchive()`, is a plain `rarity.toUpperCase()`.
- Produces: `getRoadmapRewardPreview(lvl)` → `{ gold: number, gems: number, packName: string }`, reusable by nothing else in this plan but kept as a named function (not inlined) so it's independently testable.
- Produces: `window.showRoadmapPreview(lvl)` — opens the popup for a given level number, looks up reward/ability from scratch (does not require the caller to pass node data).
- Produces: `window.closeRoadmapPreview(event)` — same signature convention as `closeChallengesOverlay(event)`/`closePackPeek(event)` (optional event, closes unconditionally if called with no arg, only closes on backdrop click if called with an event whose target is the backdrop itself).

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  return {
    overlayExists: !!document.getElementById('roadmap-preview-overlay'),
    fnExists: typeof window.showRoadmapPreview === 'function',
    helperExists: typeof getRoadmapRewardPreview === 'function'
  };
}
```

- [ ] **Step 2: Run against current code, confirm it fails**

Expected: `{ overlayExists: false, fnExists: false, helperExists: false }`.

- [ ] **Step 3: Add the overlay markup**

In `redesign2/index.html`, immediately after the `</div>` that closes `#quests-overlay` (the block ending `</div>\n    </div>` right before `<div id="hub-screen"...`), insert:

```html
    <div id="roadmap-preview-overlay" class="modal-overlay" onclick="closeRoadmapPreview(event)">
        <div class="modal-content lb-style-modal roadmap-preview-modal" onclick="event.stopPropagation()">
            <button class="lb-style-close" type="button" onclick="closeRoadmapPreview()">×</button>
            <div class="lb-style-header">
                <span class="screen-title-counter" id="roadmap-preview-level">LEVEL --</span>
            </div>
            <div id="roadmap-preview-body"></div>
        </div>
    </div>
```

- [ ] **Step 4: Implement the JS**

In `redesign2/game.js`, add near `renderLevelRoadmap()` (right before it, so it reads top-down as "helper, then the function that calls it, then the popup that consumes both"):

```js
// Pure function of level — same formula victory()'s milestone bonus uses,
// evaluated for an arbitrary (usually future) level rather than the level
// just completed. No new numbers, just the existing formula at a different lvl.
function getRoadmapRewardPreview(lvl) {
    const goldReward = Math.round(getLevelGoldReward(lvl) * getEconomyMultiplier());
    const bonusGold = Math.round(goldReward * 0.5);
    const bonusGems = 5 + Math.floor(lvl / 4);
    let packKey = 'supply_pack_i';
    if (lvl >= 30) packKey = 'apex_pack_iii';
    else if (lvl >= 12) packKey = 'strike_pack_ii';
    return { gold: bonusGold, gems: bonusGems, packName: PACK_DEFINITIONS[packKey]?.name || packKey };
}

window.showRoadmapPreview = function(lvl) {
    const overlay = document.getElementById('roadmap-preview-overlay');
    const levelEl = document.getElementById('roadmap-preview-level');
    const body = document.getElementById('roadmap-preview-body');
    if (!overlay || !levelEl || !body) return;
    levelEl.textContent = `LEVEL ${lvl}`;

    const isReward = lvl > 0 && lvl % 3 === 0;
    const ability = ABILITIES.find((a) => (a.unlockLevel || 1) === lvl);
    let html = '';
    if (isReward) {
        const preview = getRoadmapRewardPreview(lvl);
        html += `
            <div class="roadmap-preview-section">
                <p class="eyebrow">${t('roadmap.reward')}</p>
                <div class="roadmap-preview-reward-row">
                    <span>+${formatCompactNumber(preview.gold)} G</span>
                    <span>+${preview.gems} \u25C6</span>
                    <span>1\u00d7 ${preview.packName}</span>
                </div>
            </div>`;
    }
    if (ability) {
        const localised = (typeof tSkill === 'function') ? tSkill(ability.id) : null;
        const dispName = (localised && localised.name) || ability.name;
        const dispDesc = (localised && localised.desc) || ability.desc;
        html += `
            <div class="roadmap-preview-section">
                <p class="eyebrow">${t('roadmap.skillUnlock')}</p>
                <div class="roadmap-preview-skill-row rarity-tier-${(ability.rarity || 'common').toLowerCase()}">
                    ${getAbilityIconMarkup(ability.id, ability.icon)}
                    <div>
                        <div class="roadmap-preview-skill-name">${dispName}</div>
                        <div class="roadmap-preview-skill-desc">${dispDesc}</div>
                    </div>
                </div>
            </div>`;
    }
    body.innerHTML = html;
    overlay.classList.add('active');
};

window.closeRoadmapPreview = function(event) {
    if (event && event.target && event.target.id !== 'roadmap-preview-overlay') return;
    document.getElementById('roadmap-preview-overlay')?.classList.remove('active');
};
```

Then, still in `renderLevelRoadmap()`, find the node template:

```js
        nodesHtml += `<div class="lr-node ${p.state}" data-lvl="${p.lvl}" style="
            left: calc(50% + ${p.x}px);
            top: ${p.yFromTop}px;
        ">
```

Change it to add a click handler only when there's something to show:

```js
        const clickable = p.reward || p.ability;
        nodesHtml += `<div class="lr-node ${p.state}${clickable ? ' lr-node-clickable' : ''}" data-lvl="${p.lvl}" ${clickable ? `onclick="showRoadmapPreview(${p.lvl})"` : ''} style="
            left: calc(50% + ${p.x}px);
            top: ${p.yFromTop}px;
        ">
```

- [ ] **Step 5: Add CSS for the popup body and the clickable-node affordance**

In `redesign2/index.css`, add near the `.lr-node` rules:

```css
.lr-node-clickable { cursor: pointer; }
.lr-node-clickable:active { transform: translate(-50%, -50%) scale(0.94); }

.roadmap-preview-modal { max-width: 340px; }
.roadmap-preview-section { margin-top: 12px; }
.roadmap-preview-section:first-of-type { margin-top: 4px; }
.roadmap-preview-reward-row {
  display: flex; gap: 14px; flex-wrap: wrap;
  font-family: var(--font-ui); font-size: 12px; font-weight: 800; color: var(--r-gold);
}
.roadmap-preview-skill-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; border-radius: 12px; border: 2px solid var(--outline);
}
.roadmap-preview-skill-name { font-family: var(--font-display); font-size: 13px; font-weight: 800; color: #fff; }
.roadmap-preview-skill-desc { font-family: var(--font-ui); font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 2px; }
.roadmap-preview-skill-row.rarity-tier-common    { border-color: #b9adf0; }
.roadmap-preview-skill-row.rarity-tier-rare      { border-color: var(--r-blue); }
.roadmap-preview-skill-row.rarity-tier-epic      { border-color: var(--r-purple); }
.roadmap-preview-skill-row.rarity-tier-legendary { border-color: var(--r-gold); }
```

- [ ] **Step 6: Run the verification script again, confirm it passes**

Expected: `{ overlayExists: true, fnExists: true, helperExists: true }`.

- [ ] **Step 7: Behavioral check — reward node**

```js
() => {
  showRoadmapPreview(3); // level 3 is always a reward level (3 % 3 === 0)
  const active = document.getElementById('roadmap-preview-overlay').classList.contains('active');
  const rowText = document.querySelector('.roadmap-preview-reward-row')?.textContent || '';
  return { active, rowText };
}
```

Expected: `active: true`, `rowText` contains a `G` gold figure, a `\u25C6` gem figure, and a pack name (not empty, not `undefined`).

- [ ] **Step 8: Behavioral check — skill node**

```js
() => {
  const ability = ABILITIES.find(a => a.unlockLevel > 1);
  showRoadmapPreview(ability.unlockLevel);
  const name = document.querySelector('.roadmap-preview-skill-name')?.textContent;
  closeRoadmapPreview();
  const stillActive = document.getElementById('roadmap-preview-overlay').classList.contains('active');
  return { name, stillActive };
}
```

Expected: `name` equals that ability's display name (not empty), `stillActive: false` after the explicit close.

- [ ] **Step 9: Visual screenshot check**

Open the reward-node preview (Step 7's `showRoadmapPreview(3)`), screenshot it. Confirm the popup is legible and not overflowing its `max-width:340px` box, and that the close button (×, top-right, reused `.lb-style-close`) is visible and tappable — the simplified header (no icon/title, just the level counter) still needs to not look visually broken next to `.lb-style-close`, since `.lb-style-header` elsewhere always pairs an icon+title with the counter. If it looks cramped/misaligned, adjust `.roadmap-preview-modal .lb-style-header` with a small CSS override (e.g. `justify-content: center` since there's no icon/title competing for space) rather than changing the shared `.lb-style-header` rule other overlays depend on.

- [ ] **Step 10: Sync and commit**

```bash
cp redesign2/index.html main/index.html
cp redesign2/game.js main/game.js
cp redesign2/index.css main/index.css
cd main
git add index.html game.js index.css
git commit -m "Roadmap nodes: tap a reward or skill node to preview what it grants"
git push origin redesign/optimation
```

---

### Task 4: Skills Tab — Hide Locked Abilities

**Files:**
- Modify: `redesign2/game.js:9909-9936` (`renderAbilityArchive()`)

**Interfaces:**
- No new exports — pure change to existing render logic.

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  const locked = ABILITIES.find(a => (a.unlockLevel || 1) > (save.unlocked || 1));
  showAbilities(); // renders #ability-archive-grid
  const card = document.querySelector(`.ability-${locked.id}`);
  const iconSrc = card?.querySelector('.ability-icon-img')?.getAttribute('src') || '';
  return {
    nameText: card?.querySelector('.card-title')?.textContent,
    hasDesc: !!card?.querySelector('.card-copy')?.textContent,
    iconIsLock: iconSrc.includes('lock-48.png')
  };
}
```

- [ ] **Step 2: Run against current code, confirm it fails**

Expected: `nameText` equals the ability's real name (not `???`), `hasDesc: true`, `iconIsLock: false` — i.e. today's spoiler behavior.

- [ ] **Step 3: Implement the obscuring branch**

In `redesign2/game.js`, inside `renderAbilityArchive()`'s `sortedAbilities.forEach(...)` loop, replace:

```js
        const localised = (typeof tSkill === 'function') ? tSkill(ability.id) : null;
        const dispName = (localised && localised.name) || ability.name;
        const dispDesc = (localised && localised.desc) || ability.desc;
        card.className = `shop-card ability-card ability-archive-card rarity-tier-${baseTier} ability-${ability.id} ${unlocked ? 'unlocked-now' : 'locked'}`.trim();
        card.innerHTML = `
            ${getAbilityIconMarkup(ability.id, ability.icon)}
            <div class="card-title">${dispName}</div>
            <div class="card-meta ${unlocked ? '' : 'locked-meta'}">
                ${baseTier.toUpperCase()} | ${t('milestone.unlockedAt')} ${ability.unlockLevel}
            </div>
            <div class="card-copy">${dispDesc}</div>
            <button class="archive-cta" type="button" ${unlocked ? '' : 'disabled'}>
                ${unlocked ? t('milestone.archiveAvailable') : `${t('milestone.lockedFrom')} ${ability.unlockLevel}`}
            </button>
        `;
```

with:

```js
        const localised = (typeof tSkill === 'function') ? tSkill(ability.id) : null;
        const dispName = unlocked ? ((localised && localised.name) || ability.name) : '???';
        const dispDesc = unlocked ? ((localised && localised.desc) || ability.desc) : '';
        const iconMarkup = unlocked
            ? getAbilityIconMarkup(ability.id, ability.icon)
            : `<div class="ability-icon ability-locked-icon"><img src="icons/small/lock-48.png" class="ability-icon-img" alt=""></div>`;
        card.className = `shop-card ability-card ability-archive-card rarity-tier-${baseTier} ability-${ability.id} ${unlocked ? 'unlocked-now' : 'locked'}`.trim();
        card.innerHTML = `
            ${iconMarkup}
            <div class="card-title">${dispName}</div>
            <div class="card-meta ${unlocked ? '' : 'locked-meta'}">
                ${baseTier.toUpperCase()} | ${t('milestone.unlockedAt')} ${ability.unlockLevel}
            </div>
            ${unlocked ? `<div class="card-copy">${dispDesc}</div>` : ''}
            <button class="archive-cta" type="button" ${unlocked ? '' : 'disabled'}>
                ${unlocked ? t('milestone.archiveAvailable') : `${t('milestone.lockedFrom')} ${ability.unlockLevel}`}
            </button>
        `;
```

(No new CSS needed: `icons/small/lock-48.png` already exists and `.ability-icon`/`.ability-icon-img` sizing already applies; the existing `.ability-archive-card.locked { opacity:.5; filter:saturate(.2); }` dimming still applies on top of this.)

- [ ] **Step 4: Run the verification script again, confirm it passes**

Expected: `nameText: '???'`, `hasDesc: false`, `iconIsLock: true`.

- [ ] **Step 5: Regression check — unlocked cards unaffected**

```js
() => {
  const unlockedAbility = ABILITIES.find(a => (a.unlockLevel || 1) <= (save.unlocked || 1));
  showAbilities();
  const card = document.querySelector(`.ability-${unlockedAbility.id}`);
  return { nameText: card?.querySelector('.card-title')?.textContent, hasDesc: !!card?.querySelector('.card-copy') };
}
```

Expected: real name, `hasDesc: true` — unlocked cards look exactly as before.

- [ ] **Step 6: Sync and commit**

```bash
cp redesign2/game.js main/game.js
cd main
git add game.js
git commit -m "Skills tab: hide name/icon/description for not-yet-unlocked abilities"
git push origin redesign/optimation
```

---

### Task 5: Skill-Reveal Trigger Plumbing (save field, victory hook, Home-screen hook, minimal overlay)

**Files:**
- Modify: `redesign2/game.js:16-37` (default `save` object)
- Modify: `redesign2/game.js` (`victory()`, right after `save.selectedLevel = save.unlocked;`)
- Modify: `redesign2/game.js` (`showFight()`, right after the `renderLevelRoadmap();` call)
- Modify: `redesign2/index.html` (minimal `#skill-reveal-overlay` shell — just enough to show the ability's name/rarity and a close button; Task 6 replaces the visuals, Task 7 adds the drag gesture)
- Modify: `redesign2/game.js` (new `openSkillRevealSequence(abilityId)` — minimal version)

**Interfaces:**
- Produces: `save.pendingSkillReveal` — `string | null`, ability id awaiting its reveal ceremony.
- Produces: `openSkillRevealSequence(abilityId)` — global function, opens `#skill-reveal-overlay` populated with that ability's data. Task 6/7 will extend this same function's body (not replace its signature).
- Produces: `window.closeSkillRevealOverlay()` — closes the overlay, no args.

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  return { hasField: 'pendingSkillReveal' in save, fnExists: typeof openSkillRevealSequence === 'function' };
}
```

- [ ] **Step 2: Run against current code, confirm it fails**

Expected: `{ hasField: false, fnExists: false }`.

- [ ] **Step 3: Add the save field**

In `redesign2/game.js`, in the default `save` object, add a line after `lastRunSkills: null`:

```js
    lastRunSkills: null,
    pendingSkillReveal: null
};
```

(Remove the trailing comma that was on `lastRunSkills: null` before, add it to the new line instead, so the object literal stays valid — i.e. the final two lines become `lastRunSkills: null,` then `pendingSkillReveal: null` then the closing `};`.)

- [ ] **Step 4: Hook `victory()`**

In `redesign2/game.js`, inside `victory()`, find:

```js
    save.unlocked = Math.max(save.unlocked, currentLevel + 1);
    save.selectedLevel = save.unlocked;
```

Change to:

```js
    save.unlocked = Math.max(save.unlocked, currentLevel + 1);
    save.selectedLevel = save.unlocked;
    const newSkill = ABILITIES.find((a) => (a.unlockLevel || 1) === save.unlocked);
    if (newSkill) save.pendingSkillReveal = newSkill.id;
```

- [ ] **Step 5: Add the minimal overlay markup**

In `redesign2/index.html`, add right after the `#pack-overlay` block's closing `</div>` (before `#peek-overlay`):

```html
    <div id="skill-reveal-overlay" class="modal-overlay">
        <div class="modal-content pack-content skill-reveal-content" id="skill-reveal-content">
            <div class="modal-topline">
                <h2 class="modal-title" data-i18n="skillReveal.title">NEW SKILL</h2>
            </div>
            <div class="pack-reveal-face" id="skill-reveal-face">
                <div class="prf-badge" id="skr-badge"></div>
                <div class="prf-frame" id="skr-frame">
                    <div class="prf-rays" id="skr-rays"></div>
                    <div class="prf-icon" id="skr-icon"></div>
                </div>
                <div class="prf-name" id="skr-name"></div>
                <div class="prf-desc" id="skr-desc"></div>
            </div>
            <button id="skill-reveal-continue" class="btn-glossy btn-gold" type="button" onclick="closeSkillRevealOverlay()" data-i18n="skillReveal.nice">Nice!</button>
        </div>
    </div>
```

- [ ] **Step 6: Implement the minimal `openSkillRevealSequence` + hook `showFight()`**

In `redesign2/game.js`, add (near `renderLevelRoadmap()`, since it's conceptually part of the Home-screen flow):

```js
// Fires once, the first time the player lands on the Home screen after a
// level-up that granted a new skill. Nothing is rolled/granted here — the
// skill is already unlocked by save.unlocked; this is a reveal ceremony.
// Task 6 replaces the pack visuals, Task 7 adds the drag-to-tear gesture —
// both extend this function's body, keeping this exact signature.
function openSkillRevealSequence(abilityId) {
    const ability = ABILITIES.find((a) => a.id === abilityId);
    if (!ability) return;
    const overlay = document.getElementById('skill-reveal-overlay');
    const badge = document.getElementById('skr-badge');
    const icon = document.getElementById('skr-icon');
    const name = document.getElementById('skr-name');
    const desc = document.getElementById('skr-desc');
    if (!overlay || !name || !desc) return;
    const localised = (typeof tSkill === 'function') ? tSkill(ability.id) : null;
    if (badge) badge.textContent = (ability.rarity || 'common').toUpperCase();
    if (icon) icon.innerHTML = getAbilityIconMarkup(ability.id, ability.icon);
    name.textContent = (localised && localised.name) || ability.name;
    desc.textContent = (localised && localised.desc) || ability.desc;
    overlay.dataset.rarity = (ability.rarity || 'common').toLowerCase();
    overlay.classList.add('active');
}

window.closeSkillRevealOverlay = function() {
    document.getElementById('skill-reveal-overlay')?.classList.remove('active');
};
```

Then in `showFight()`, find:

```js
    renderLevelRoadmap();
    refreshLevelCta();
```

Change to:

```js
    renderLevelRoadmap();
    if (save.pendingSkillReveal) {
        const revealId = save.pendingSkillReveal;
        save.pendingSkillReveal = null;
        openSkillRevealSequence(revealId);
    }
    refreshLevelCta();
```

- [ ] **Step 7: Run the verification script again, confirm it passes**

Expected: `{ hasField: true, fnExists: true }`.

- [ ] **Step 8: End-to-end behavioral check**

```js
() => {
  const ability = ABILITIES.find(a => a.unlockLevel > 1);
  save.unlocked = ability.unlockLevel - 1;
  save.pendingSkillReveal = null;
  currentMode = 'mission';
  currentLevel = save.unlocked;
  // victory() also reads these two — without them it throws before reaching
  // the save.unlocked assignment (confirmed empirically earlier this project).
  currentWave = 5;
  currentLevelWaves = [1, 2, 3, 4, 5];
  victory();
  const setAfterVictory = save.pendingSkillReveal === ability.id;
  showFight();
  const clearedAfterHome = save.pendingSkillReveal === null;
  const overlayActive = document.getElementById('skill-reveal-overlay').classList.contains('active');
  const shownName = document.getElementById('skr-name').textContent;
  closeSkillRevealOverlay();
  return { setAfterVictory, clearedAfterHome, overlayActive, shownName };
}
```

Expected: `{ setAfterVictory: true, clearedAfterHome: true, overlayActive: true, shownName: <that ability's real name> }`.

- [ ] **Step 9: Regression check — no double-fire on a second Home visit**

```js
() => {
  showFight(); // second call, pendingSkillReveal is already null from Step 8
  return document.getElementById('skill-reveal-overlay').classList.contains('active');
}
```

Expected: `false`.

- [ ] **Step 10: Sync and commit**

```bash
cp redesign2/game.js main/game.js
cp redesign2/index.html main/index.html
cd main
git add game.js index.html
git commit -m "Wire up skill-reveal trigger: victory() flags it, Home screen fires it once"
git push origin redesign/optimation
```

---

### Task 6: Skill-Reveal Overlay Visual Shell (hero pack art, rarity tint, asset fallback)

**Files:**
- Modify: `redesign2/index.html` (`#skill-reveal-overlay` — add the pack-stage layer in front of the reveal face, matching `#pack-overlay`'s `pack-stage-rays`/`pack-viewport`/`pack-confetti` structure)
- Modify: `redesign2/game.js` (`openSkillRevealSequence` — set the pack image `src` per rarity with a fallback, keep the reveal face hidden until Task 7's tear reveals it)
- Modify: `redesign2/index.css` (pack-stage layout, rarity-tinted glow, hero image sizing, `#pack-reveal-face`-style hide/show already exists via `display:none` inline toggling — no change needed there)

**Interfaces:**
- Consumes: `redesign2/icons/skill-pack-{common,rare,epic,legendary}-hero.png` (already on disk).
- Extends `openSkillRevealSequence(abilityId)` from Task 5 — same signature, body grows.

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  const ability = ABILITIES.find(a => a.rarity === 'legendary') || ABILITIES[0];
  openSkillRevealSequence(ability.id);
  const img = document.getElementById('skill-reveal-pack-img');
  return { imgExists: !!img, src: img?.getAttribute('src') || null, faceHidden: getComputedStyle(document.getElementById('skill-reveal-face')).display === 'none' };
}
```

- [ ] **Step 2: Run against current code (post-Task-5), confirm it fails**

Expected: `{ imgExists: false, src: null, faceHidden: false }` (Task 5's version shows the reveal face immediately, with no pack image at all — that's what this task changes).

- [ ] **Step 3: Extend the overlay markup**

In `redesign2/index.html`, inside `#skill-reveal-overlay`'s `.modal-content`, insert a pack-stage block BEFORE the existing `.pack-reveal-face` div, and give that div `style="display:none"` (Task 5 left it always visible; Task 7's tear will reveal it):

```html
        <div class="modal-content pack-content skill-reveal-content" id="skill-reveal-content">
            <div class="modal-topline">
                <h2 class="modal-title" data-i18n="skillReveal.title">NEW SKILL</h2>
            </div>
            <div class="pack-stage-rays" id="skill-reveal-rays" aria-hidden="true"></div>
            <div class="skill-reveal-pack-stage" id="skill-reveal-pack-stage">
                <img id="skill-reveal-pack-img" class="skill-reveal-pack-img" src="" alt="">
                <div class="skill-reveal-hint" id="skill-reveal-hint" data-i18n="skillReveal.hint">SWIPE DOWN TO OPEN</div>
                <div id="skill-reveal-confetti" class="pack-confetti"></div>
            </div>
            <div class="pack-reveal-face" id="skill-reveal-face" style="display:none">
```

(The rest of `.pack-reveal-face`'s inner markup from Task 5 stays unchanged; only its opening tag gains `style="display:none"`, and the continue button below it stays where it was.)

- [ ] **Step 4: Extend `openSkillRevealSequence` with the pack-image + fallback logic**

In `redesign2/game.js`, in `openSkillRevealSequence`, right after `const overlay = document.getElementById('skill-reveal-overlay');`, add the pack-image setup, and move the reveal-face population so it no longer shows immediately:

```js
function openSkillRevealSequence(abilityId) {
    const ability = ABILITIES.find((a) => a.id === abilityId);
    if (!ability) return;
    const overlay = document.getElementById('skill-reveal-overlay');
    const packImg = document.getElementById('skill-reveal-pack-img');
    const face = document.getElementById('skill-reveal-face');
    const badge = document.getElementById('skr-badge');
    const icon = document.getElementById('skr-icon');
    const name = document.getElementById('skr-name');
    const desc = document.getElementById('skr-desc');
    if (!overlay || !packImg || !face || !name || !desc) return;
    const rarity = (ability.rarity || 'common').toLowerCase();
    const localised = (typeof tSkill === 'function') ? tSkill(ability.id) : null;

    // Populate the (still-hidden) reveal face now so Task 7's tear has
    // real content ready the instant it flips display:none off.
    if (badge) badge.textContent = rarity.toUpperCase();
    if (icon) icon.innerHTML = getAbilityIconMarkup(ability.id, ability.icon);
    name.textContent = (localised && localised.name) || ability.name;
    desc.textContent = (localised && localised.desc) || ability.desc;
    face.style.display = 'none';

    const heroSrc = `icons/skill-pack-${rarity}-hero.png`;
    const probe = new Image();
    probe.onload = () => { packImg.src = heroSrc; };
    probe.onerror = () => { packImg.src = 'icons/pack.png'; }; // fallback if a rarity asset is ever missing
    probe.src = heroSrc;

    overlay.dataset.rarity = rarity;
    overlay.classList.add('active');
}
```

- [ ] **Step 5: Add the CSS**

In `redesign2/index.css`, add:

```css
.skill-reveal-content { text-align: center; }
.skill-reveal-pack-stage {
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 2 / 3;
  margin: 8px auto;
}
.skill-reveal-pack-img {
  width: 100%; height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 18px rgba(255,255,255,0.15));
}
.skill-reveal-hint {
  position: absolute; left: 0; right: 0; bottom: -22px;
  font-family: var(--font-ui); font-size: 10px; letter-spacing: 1px;
  color: rgba(255,255,255,0.5); text-align: center;
}
#skill-reveal-overlay[data-rarity="rare"]      .skill-reveal-pack-img { filter: drop-shadow(0 0 18px rgba(41,209,255,0.35)); }
#skill-reveal-overlay[data-rarity="epic"]      .skill-reveal-pack-img { filter: drop-shadow(0 0 18px rgba(255,95,209,0.35)); }
#skill-reveal-overlay[data-rarity="legendary"] .skill-reveal-pack-img { filter: drop-shadow(0 0 22px rgba(255,205,60,0.45)); }
```

- [ ] **Step 6: Run the verification script again, confirm it passes**

Expected: `{ imgExists: true, src: '.../icons/skill-pack-legendary-hero.png' (or whatever rarity the test picked), faceHidden: true }`. Note: the `probe.onload` is async — the verification script should `await new Promise(r => setTimeout(r, 50))` before reading `img.src` if run as a real Playwright script, since `browser_evaluate` functions can be `async`.

- [ ] **Step 7: Fallback check**

```js
async () => {
  // Simulate a missing asset by requesting a rarity that doesn't exist.
  const fakeAbility = { id: '__test_fake__', rarity: 'mythic', name: 'Test', desc: 'x', icon: 'X' };
  ABILITIES.push(fakeAbility);
  openSkillRevealSequence('__test_fake__');
  await new Promise(r => setTimeout(r, 150));
  const src = document.getElementById('skill-reveal-pack-img').src;
  ABILITIES.pop();
  return src.includes('pack.png');
}
```

Expected: `true` (falls back to the generic pack icon when `skill-pack-mythic-hero.png` 404s).

- [ ] **Step 8: Visual screenshot check**

Screenshot the overlay for each of the 4 real rarities (loop `openSkillRevealSequence` with one ability per rarity, screenshot each). Confirm the hero art renders large and centered, not stretched/cropped oddly, and the rarity-tinted glow is visible behind it.

- [ ] **Step 9: Sync and commit**

```bash
cp redesign2/index.html main/index.html
cp redesign2/game.js main/game.js
cp redesign2/index.css main/index.css
cd main
git add index.html game.js index.css
git commit -m "Skill reveal: show the rarity-specific hero pack art with a generic-icon fallback"
git push origin redesign/optimation
```

---

### Task 7: Drag-to-Tear Gesture + Tear Animation + Reveal Card Wire-up

**Files:**
- Modify: `redesign2/game.js` (new `installSkillRevealDrag()` — called once on load, same pattern as `installSwipeNavigation()`; extends `openSkillRevealSequence` to reset tear state)
- Modify: `redesign2/index.css` (tear-seam split via two clipped copies of the same image, transform/transition for the tear, confetti reuse)

**Interfaces:**
- Produces: `installSkillRevealDrag()` — global function, no args, called once from the same `window.addEventListener('load', ...)` handler as `renderStarfield()`. Attaches pointer/touch handlers to `#skill-reveal-pack-stage`.
- Consumes: `#skill-reveal-pack-img` (single image element from Task 6) — this task duplicates it into two stacked, differently-clipped copies at markup level so both halves can animate independently while sharing one source image (matches the "1 image per rarity, no separate torn-open art" decision).

- [ ] **Step 1: Write the verification script (expected to fail first)**

```js
() => {
  return {
    topHalfExists: !!document.getElementById('skill-reveal-pack-top'),
    bottomHalfExists: !!document.getElementById('skill-reveal-pack-bottom'),
    installFnExists: typeof installSkillRevealDrag === 'function'
  };
}
```

- [ ] **Step 2: Run against current code (post-Task-6), confirm it fails**

Expected: `{ topHalfExists: false, bottomHalfExists: false, installFnExists: false }`.

- [ ] **Step 3: Split the single pack image into two clipped copies**

In `redesign2/index.html`, replace the single `<img id="skill-reveal-pack-img" ...>` (added in Task 6) with two stacked copies:

```html
                <img id="skill-reveal-pack-top" class="skill-reveal-pack-img skill-reveal-pack-top" src="" alt="">
                <img id="skill-reveal-pack-bottom" class="skill-reveal-pack-img skill-reveal-pack-bottom" src="" alt="">
```

- [ ] **Step 4: Update Task 6's image-loading code to set both `src`s**

In `redesign2/game.js`, in `openSkillRevealSequence`, replace:

```js
    const packImg = document.getElementById('skill-reveal-pack-img');
```

with:

```js
    const packTop = document.getElementById('skill-reveal-pack-top');
    const packBottom = document.getElementById('skill-reveal-pack-bottom');
```

and replace the loader block:

```js
    const heroSrc = `icons/skill-pack-${rarity}-hero.png`;
    const probe = new Image();
    probe.onload = () => { packImg.src = heroSrc; };
    probe.onerror = () => { packImg.src = 'icons/pack.png'; };
    probe.src = heroSrc;
```

with:

```js
    const heroSrc = `icons/skill-pack-${rarity}-hero.png`;
    const probe = new Image();
    probe.onload = () => { packTop.src = heroSrc; packBottom.src = heroSrc; };
    probe.onerror = () => { packTop.src = 'icons/pack.png'; packBottom.src = 'icons/pack.png'; };
    probe.src = heroSrc;
    // Reset any tear from a previous reveal.
    packTop.classList.remove('torn');
    packBottom.classList.remove('torn');
    packTop.style.transform = '';
    document.getElementById('skill-reveal-hint').style.display = '';
```

(Update the two `if (!overlay || ...)` guards and the `if (!packImg ...)` reference accordingly — the guard line becomes `if (!overlay || !packTop || !packBottom || !face || !name || !desc) return;`.)

- [ ] **Step 5: Add the clip-path split + tear CSS**

In `redesign2/index.css`, replace the single `.skill-reveal-pack-img` rule from Task 6 with:

```css
.skill-reveal-pack-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 18px rgba(255,255,255,0.15));
}
/* Seam measured at ~27% down the source art (skill-pack-*-hero.png). Both
   images are identical; each shows only its half via clip-path, so together
   they look like one whole pack until the top half animates away. */
.skill-reveal-pack-top    { clip-path: polygon(0 0, 100% 0, 100% 27%, 0 27%); transition: transform 0.4s cubic-bezier(.2,.8,.3,1.4); }
.skill-reveal-pack-bottom { clip-path: polygon(0 27%, 100% 27%, 100% 100%, 0 100%); }
.skill-reveal-pack-top.torn { transform: translateY(-140%) rotate(-18deg); }
```

- [ ] **Step 6: Make `spawnPackConfetti` target-agnostic, then implement `installSkillRevealDrag()`**

`spawnPackConfetti` (game.js:2073) is hardcoded to `document.getElementById('pack-confetti')`. Add an optional third parameter, defaulting to that exact same id, so the existing call site at game.js:9443 (`spawnPackConfetti(feedback.color, wonReward.rarity === 'gold' ? 38 : 26)`) keeps working unmodified:

```js
function spawnPackConfetti(color = '#d6b36a', count = 30, targetId = 'pack-confetti') {
    const host = document.getElementById(targetId);
    if (!host) return;
    host.innerHTML = '';
    const palette = [color, '#ffffff', '#e3cf9a', color];
    for (let i = 0; i < count; i++) {
        const a = (Math.random() * 360).toFixed(1);
        const c = palette[i % palette.length];
        const span = document.createElement('span');
        span.style.setProperty('--a', `${a}deg`);
        span.style.setProperty('--c', c);
        span.style.setProperty('--delay', `${(Math.random() * 0.18).toFixed(2)}s`);
        host.appendChild(span);
    }
}
```

Then, in `redesign2/game.js`, add near `installSwipeNavigation()` (same file region), modeled on that function's touch/mouse-unification pattern:

```js
// Drag-to-tear gesture for the skill-reveal pack. Structurally mirrors
// installSwipeNavigation()'s touch/mouse handling, but tracks vertical
// drag distance on one element instead of horizontal swipe on the body.
function installSkillRevealDrag() {
    const stage = document.getElementById('skill-reveal-pack-stage');
    if (!stage) return;
    let startY = 0, tracking = false;
    const TEAR_THRESHOLD = 70; // px

    function commitTear() {
        const top = document.getElementById('skill-reveal-pack-top');
        const hint = document.getElementById('skill-reveal-hint');
        const rays = document.getElementById('skill-reveal-rays');
        const face = document.getElementById('skill-reveal-face');
        if (!top || top.classList.contains('torn')) return;
        top.classList.add('torn');
        if (hint) hint.style.display = 'none';
        if (rays) rays.classList.add('burst');
        if (typeof playHaptic === 'function') playHaptic('medium');
        setTimeout(() => {
            if (face) face.style.display = '';
            if (typeof spawnPackConfetti === 'function') spawnPackConfetti('#d6b36a', 30, 'skill-reveal-confetti');
        }, 320);
    }

    function down(e) {
        const t = e.touches ? e.touches[0] : e;
        startY = t.clientY;
        tracking = true;
    }
    function move(e) {
        if (!tracking) return;
        const t = e.touches ? e.touches[0] : e;
        const dy = t.clientY - startY;
        if (dy > TEAR_THRESHOLD) {
            tracking = false;
            commitTear();
        }
    }
    function up() {
        tracking = false;
    }
    function tap() {
        commitTear();
    }

    stage.addEventListener('touchstart', down, { passive: true });
    stage.addEventListener('touchmove', move, { passive: true });
    stage.addEventListener('touchend', up, { passive: true });
    stage.addEventListener('mousedown', down);
    stage.addEventListener('mousemove', move);
    stage.addEventListener('mouseup', up);
    stage.addEventListener('click', tap);
}
```

Then find `window.addEventListener('load', ...)` (same handler already extended in Task 1 with `renderStarfield();`) and add `installSkillRevealDrag();` alongside it. Note the `click` listener on `tap()` will also fire after a `touchend`/`mouseup` on some browsers — this is fine here since `commitTear()` is itself guarded by `top.classList.contains('torn')`, so a duplicate call after the drag already tore it is a no-op.

Check whether `spawnPackConfetti(targetId)` already exists as a reusable helper (search `function spawnPackConfetti` in `game.js`, it backs the existing pack-opening's `#pack-confetti`). If it takes no `targetId` argument and always targets `#pack-confetti`, either add an optional second/overridden target parameter to it (defaulting to `'pack-confetti'` so the existing call site is untouched) or, if it's simple inline DOM-building code, copy just enough of it into a small `spawnConfettiInto(elementId)` helper — check the real function body before choosing, since guessing its signature here would violate this plan's no-placeholder rule.

- [ ] **Step 7: Add the rays burst CSS**

In `redesign2/index.css`, add (reusing the existing `.pack-stage-rays` base rule already defined for `#pack-overlay` — only the burst trigger class is new):

```css
.pack-stage-rays.burst { animation: skillRevealRaysBurst 0.5s ease-out; }
@keyframes skillRevealRaysBurst {
  0% { opacity: 0; transform: scale(0.6); }
  40% { opacity: 1; }
  100% { opacity: 0.6; transform: scale(1.15); }
}
```

- [ ] **Step 8: Run the verification script again, confirm it passes**

Expected: `{ topHalfExists: true, bottomHalfExists: true, installFnExists: true }`.

- [ ] **Step 9: Behavioral check — tap fallback tears immediately**

```js
async () => {
  const ability = ABILITIES.find(a => a.rarity === 'epic') || ABILITIES[0];
  openSkillRevealSequence(ability.id);
  await new Promise(r => setTimeout(r, 60));
  document.getElementById('skill-reveal-pack-stage').click();
  await new Promise(r => setTimeout(r, 400));
  const torn = document.getElementById('skill-reveal-pack-top').classList.contains('torn');
  const faceVisible = getComputedStyle(document.getElementById('skill-reveal-face')).display !== 'none';
  closeSkillRevealOverlay();
  return { torn, faceVisible };
}
```

Expected: `{ torn: true, faceVisible: true }`.

- [ ] **Step 10: Behavioral check — drag below threshold does not tear**

```js
async () => {
  const ability = ABILITIES[0];
  openSkillRevealSequence(ability.id);
  await new Promise(r => setTimeout(r, 60));
  const stage = document.getElementById('skill-reveal-pack-stage');
  const rect = stage.getBoundingClientRect();
  const startY = rect.top + 20;
  stage.dispatchEvent(new MouseEvent('mousedown', { clientY: startY }));
  stage.dispatchEvent(new MouseEvent('mousemove', { clientY: startY + 30 })); // below 70px threshold
  stage.dispatchEvent(new MouseEvent('mouseup', { clientY: startY + 30 }));
  const torn = document.getElementById('skill-reveal-pack-top').classList.contains('torn');
  closeSkillRevealOverlay();
  return torn;
}
```

Expected: `false`. (Note: the `click` event this test's `mouseup` may or may not synthesize depends on the test harness — if this comes back `true` because a synthetic `click` fired anyway, that's an artifact of manual event dispatch, not the real drag path; cross-check by re-running Step 9's real tap path still working and treat this step as best-effort in an automated harness.)

- [ ] **Step 11: Full-loop visual screenshot**

For each of the 4 rarities: open the reveal, screenshot (pack whole), simulate the tear via `.click()`, wait 400ms, screenshot again (torn, reveal card showing with correct icon/name/rarity color).

- [ ] **Step 12: Sync and commit**

```bash
cp redesign2/index.html main/index.html
cp redesign2/game.js main/game.js
cp redesign2/index.css main/index.css
cd main
git add index.html game.js index.css
git commit -m "Skill reveal: drag-to-tear the pack open (tap fallback), reveal card + confetti on tear"
git push origin redesign/optimation
```

---

## Final Verification Pass

- [ ] Fresh server, full click-through: Home screen shows starfield → tap a reward node (preview shows real gold/gems/pack) → tap a skill node (preview shows real ability) → close → open Skills tab, confirm locked cards show `???`+lock, unlocked cards unaffected → force a level-up via Test Arena + `victory()` at a skill-granting level → land on Home → skill-reveal pack appears → drag (or tap) tears it open → reveal card shows the correct skill → continue closes back to Home cleanly, roadmap and skills tab both reflect the newly-unlocked skill without a page reload.
- [ ] Restart the standing dev server on port 8210 (kill any dead/duplicate process first, confirm via `netstat`), give both `http://192.168.178.83:8210/` and `http://100.67.50.111:8210/` links.
