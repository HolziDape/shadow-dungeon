# Active Abilities & Passive Cleanup — Design Spec
Date: 2026-06-13

## Context
Shadow Dungeon is a mobile-first vanilla JS canvas top-down shooter. Controls are touch-only (drag to move, auto-fire). No keyboard shortcuts for abilities — maximum two extra gestures allowed: double-tap and release.

## Active Ability System

### Trigger: Double-Tap
- Two taps within 300ms, with no drag in between, fires the active ability
- Implemented in the existing `touchState` touch handler in `game.js`

### Player State Added
```js
player.activeAbility = null           // 'dash' | 'death_bloom' | 'shield' | 'freeze' | 'drone_strike'
player.activeCooldown = 0             // counts down, 0 = ready
player.activeMaxCooldown = 0          // set on ability definition, used for HUD arc
player.activeAbilityLevel = 1         // 1–3 via repeated card picks
player.activeAbilityReady = false     // true when cooldown = 0
```

### Unlock
- A special "Active Slot" card appears starting at ability-level 3
- Player picks one of 5 active abilities → sets `player.activeAbility`
- Picking the same active ability card again levels it up (max level 3)

### The 5 Active Abilities

| ID | Name | L1 | L2 | L3 | Cooldown L1/L2/L3 |
|----|------|----|----|----|--------------------|
| `dash` | Dash | 120px invincible dash toward aim direction | +180px, leaves damage zone | +240px, 2 dashes in sequence | 4s / 3s / 2.5s |
| `death_bloom` | Death Bloom | 250% ATK explosion, 100px radius | 350% ATK, 140px, knockback | 500% ATK, 180px, 3 rings | 8s / 7s / 5s |
| `shield` | Pulse Shield | 1.5s full damage immunity | 2.5s + reflects bullets | 3.5s + heals 1 HP on end | 12s / 10s / 8s |
| `freeze` | Time Freeze | 70% slow all enemies 2.5s | 90% slow + entry stun | Full freeze 2s + dmg boost after | 14s / 12s / 10s |
| `drone_strike` | Drone Strike | 2 targeting drones (150% ATK each) | 3 drones + AoE on impact | 5 drones, chase nearest enemy | 16s / 13s / 10s |

### HUD: Cooldown Arc
- White arc drawn around the player (radius ~r+18px)
- Fills from 0 → full as cooldown counts down
- When ready: pulsing glow + small icon above player
- On activate: burst flash ring

## Passive Ability Cleanup

### Cards Removed / Merged
- `lucky_seven` → removed (overlaps with `crit_chance`)
- `bullet_storm` → merged into `rapid_fire` as tier upgrade path (not a separate card)
- Remaining cards rebalanced for clarity: each card has one clear unique effect

### HUD Passive Icons
- Bottom-right corner, up to 8 icons (24×24px each)
- Each icon pulses/glows briefly when its ability triggers:
  - `cluster_bomb` → blinks on bomb fire
  - `frost_shot` → blinks on slow hit
  - `echo_shot` → blinks on shockwave
  - `vampire` → heart pulse on lifesteal heal
  - `phoenix_drive` → flame pulse when aura damages enemy
  - `chain_lightning` → arc flash on chain

## Files Changed
- `game.js` — double-tap detection, `triggerActiveAbility()`, `updateActiveAbility(dt)`, passive cleanup
- `config.js` — active ability definitions, remove/merge passive cards
- `render.js` — cooldown arc around player, passive HUD icons bottom-right
