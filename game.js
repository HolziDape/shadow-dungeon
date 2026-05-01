window.ctx = null;
window.canvas = null;
window.GW = window.innerWidth;
window.GH = window.innerHeight;

let save = {
    gold: 0,
    gems: 0,
    unlocked: 1,
    selectedLevel: 1,
    stats: { dmg: 0, atkSpd: 0, speed: 0 },
    reviveCharges: 0,
    rerollTokens: 0,
    bonusAbilityXp: 0,
    bossRevive: 0,
    packs: [],
    skins: ['stock'],
    equippedSkin: 'stock',
    equippedCards: [],
    premium: { noAds: false, neonTrail: false },
    inventory: [],
    lastLogin: 0,
    settings: { sfx: 0.7, music: 0.35, haptics: false },
    metaSlots: { normalExtra: 0, legendaryExtra: 0 }
};

let currentLevel = 1;
let currentWave = 0;
let currentMode = 'mission';
let gameRunning = false;
let abilityPicking = false;
let levelClearHandled = false;
let player = null;
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];
let hazards = [];
let fxTexts = [];
let lightningBolts = [];
let keys = {};
let lastTime = 0;
let currentLevelWaves = [];
let touchState = { active: false, x: 0, y: 0, lastX: 0, lastY: 0, dragVX: 0, dragVY: 0 };
let activeAbilityChoices = [];
let lastUpgradeId = '';
let nextEnemyId = 1;
let nextProjectileId = 1;
let nextHazardId = 1;
let nextOrbiterId = 1;
let screenShake = 0;
let powerPulse = 0;
let killStreak = 0;
let killStreakTimer = 0;
let resultPrimaryAction = null;
let resultSecondaryAction = null;
let audioContext = null;
let musicGain = null;
let musicNodesStarted = false;
let packOpeningState = null;
let packTickTimer = null;
let packAnimationFrame = null;
let endlessWaveRewardGold = 0;
let arena = { width: window.innerWidth, height: window.innerHeight, top: 150 };
let camera = { x: 0, y: 0 };
let runRerollCredits = 0;

function getUnlockedAbilities(level = save.unlocked) {
    return ABILITIES.filter((ability) => (ability.unlockLevel || 1) <= level);
}

function getMilestoneBonuses(level) {
    const bonuses = {
        damageMultiplier: 0,
        fireRateMultiplier: 0,
        pierce: 0,
        magnet: 0,
        runRerolls: 0,
        title: ''
    };

    LEVEL_MILESTONES.forEach((milestone) => {
        if (level < milestone.level) return;
        bonuses.title = milestone.title;
        if (milestone.level === 15) {
            bonuses.damageMultiplier += 0.08;
            bonuses.fireRateMultiplier += 0.06;
        } else if (milestone.level === 35) {
            bonuses.damageMultiplier += 0.12;
            bonuses.runRerolls += 1;
        } else if (milestone.level === 70) {
            bonuses.pierce += 1;
            bonuses.magnet += 24;
        } else if (milestone.level === 110) {
            bonuses.damageMultiplier += 0.10;
            bonuses.fireRateMultiplier += 0.14;
        }
    });

    return bonuses;
}

function getNextMilestone(level = save.unlocked) {
    return LEVEL_MILESTONES.find((milestone) => milestone.level > level) || null;
}

function configureArena() {
    const safeTop = window.GH > window.GW ? 150 : 118;
    arena.top = safeTop;
    arena.width = Math.max(760, Math.round(window.GW * 1.42));
    arena.height = Math.max(1040, Math.round(window.GH * 1.5));
}

function getArenaSpawnPoint() {
    return {
        x: arena.width * 0.5,
        y: Math.min(arena.height - 180, Math.max(arena.top + 220, arena.height * 0.72))
    };
}

function clampCamera() {
    const deadzoneX = Math.min(164, window.GW * 0.22);
    const deadzoneTop = Math.min(142, window.GH * 0.19);
    const deadzoneBottom = Math.min(188, window.GH * 0.25);
    const viewLeft = camera.x;
    const viewRight = camera.x + window.GW;
    const viewTop = camera.y;
    const viewBottom = camera.y + window.GH;
    const leftLimit = viewLeft + deadzoneX;
    const rightLimit = viewRight - deadzoneX;
    const topLimit = viewTop + deadzoneTop;
    const bottomLimit = viewBottom - deadzoneBottom;
    let targetX = camera.x;
    let targetY = camera.y;

    if (player.x < leftLimit) {
        targetX -= leftLimit - player.x;
    } else if (player.x > rightLimit) {
        targetX += player.x - rightLimit;
    }

    if (player.y < topLimit) {
        targetY -= topLimit - player.y;
    } else if (player.y > bottomLimit) {
        targetY += player.y - bottomLimit;
    }

    targetX = Math.max(0, Math.min(arena.width - window.GW, targetX));
    targetY = Math.max(0, Math.min(arena.height - window.GH, targetY));
    camera.x += (targetX - camera.x) * 0.18;
    camera.y += (targetY - camera.y) * 0.18;
}

function getArenaSpawnEdgePoint() {
    const spawnMargin = 80;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
        x = Math.random() * arena.width;
        y = arena.top - spawnMargin;
    } else if (side === 1) {
        x = arena.width + spawnMargin;
        y = arena.top + Math.random() * Math.max(120, arena.height - arena.top - 120);
    } else if (side === 2) {
        x = Math.random() * arena.width;
        y = arena.height + spawnMargin;
    } else {
        x = -spawnMargin;
        y = arena.top + Math.random() * Math.max(120, arena.height - arena.top - 120);
    }

    return {
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60
    };
}

function getSfxVolume() {
    return Math.max(0, Math.min(1, save.settings?.sfx | 0.7));
}

function triggerHaptic(pattern) {
    if (!save.settings?.haptics || !navigator.vibrate) return;
    navigator.vibrate(pattern);
}

function ensureMusicEngine() {
    if (musicNodesStarted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    musicGain = audioContext.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(audioContext.destination);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.4;
    filter.connect(musicGain);

    [
        { freq: 110, type: 'triangle', gain: 0.3 },
        { freq: 164.81, type: 'sine', gain: 0.18 },
        { freq: 220, type: 'triangle', gain: 0.12 }
    ].forEach((voice) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = voice.type;
        osc.frequency.value = voice.freq;
        gain.gain.value = voice.gain;
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
    });

    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 110;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    musicNodesStarted = true;
    syncMusicVolume();
}

function syncMusicVolume() {
    if (!musicGain) return;
    const target = Math.max(0, Math.min(1, save.settings?.music | 0.35)) * 0.055;
    const now = audioContext ? audioContext.currentTime : 0;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.linearRampToValueAtTime(target, now + 0.18);
}

function playSfx(kind, intensity = 1) {
    ensureMusicEngine();
    if (!audioContext) return;
    const volume = getSfxVolume();
    if (volume <= 0.01) return;

    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';

    let startFreq = 300;
    let endFreq = 180;
    let duration = 0.08;
    let type = 'triangle';
    let cutoff = 1400;
    let peak = 0.04;

    if (kind === 'shoot') {
        startFreq = 760;
        endFreq = 330;
        duration = 0.045;
        type = 'square';
        cutoff = 2200;
        peak = 0.016;
    } else if (kind === 'tornado') {
        startFreq = 440;
        endFreq = 180;
        duration = 0.12;
        type = 'sawtooth';
        cutoff = 1200;
        peak = 0.03;
    } else if (kind === 'hit') {
        startFreq = 180;
        endFreq = 110;
        duration = 0.07;
        type = 'triangle';
        cutoff = 900;
        peak = 0.03;
    } else if (kind === 'chain') {
        startFreq = 980;
        endFreq = 420;
        duration = 0.1;
        type = 'sawtooth';
        cutoff = 2600;
        peak = 0.028;
    } else if (kind === 'pickup') {
        startFreq = 620;
        endFreq = 920;
        duration = 0.08;
        type = 'triangle';
        cutoff = 2400;
        peak = 0.018;
    } else if (kind === 'upgrade') {
        startFreq = 420;
        endFreq = 760;
        duration = 0.11;
        type = 'triangle';
        cutoff = 1800;
        peak = 0.025;
    } else if (kind === 'death') {
        startFreq = 240;
        endFreq = 70;
        duration = 0.22;
        type = 'sawtooth';
        cutoff = 700;
        peak = 0.04;
    } else if (kind === 'win') {
        startFreq = 420;
        endFreq = 980;
        duration = 0.18;
        type = 'triangle';
        cutoff = 2600;
        peak = 0.03;
    } else if (kind === 'ability') {
        startFreq = 520;
        endFreq = 820;
        duration = 0.12;
        type = 'triangle';
        cutoff = 2000;
        peak = 0.024;
    } else if (kind === 'caseTick') {
        startFreq = 1480;
        endFreq = 920;
        duration = 0.028;
        type = 'square';
        cutoff = 3200;
        peak = 0.024;
    } else if (kind === 'caseOpen') {
        startFreq = 420;
        endFreq = 1320;
        duration = 0.26;
        type = 'triangle';
        cutoff = 2800;
        peak = 0.038;
    } else if (kind === 'caseRare') {
        startFreq = 680;
        endFreq = 1520;
        duration = 0.34;
        type = 'triangle';
        cutoff = 3000;
        peak = 0.048;
    } else if (kind === 'jackpot') {
        startFreq = 840;
        endFreq = 2200;
        duration = 0.52;
        type = 'sine';
        cutoff = 3200;
        peak = 0.07;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    filter.frequency.setValueAtTime(cutoff, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * volume * intensity), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
}

function addLightningBolt(x1, y1, x2, y2, color = '#00f2ff', life = 0.18, width = 3) {
    const points = [{ x: x1, y: y1 }];
    const segments = 6;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;

    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const spread = (1 - Math.abs(0.5 - t) * 1.6) * 22;
        const offset = (Math.random() - 0.5) * spread;
        points.push({
            x: x1 + dx * t + px * offset,
            y: y1 + dy * t + py * offset
        });
    }

    points.push({ x: x2, y: y2 });
    lightningBolts.push({ points, color, life, maxLife: life, width });
}

window.startCurrentLevel = function() {
    currentMode = 'mission';
    currentLevel = Math.max(1, save.unlocked);
    currentLevelWaves = getLevelWaves(currentLevel);
    startLevel();
};

window.startEndlessMode = function() {
    currentMode = 'endless';
    currentLevel = Math.max(1, save.unlocked);
    currentLevelWaves = [];
    startLevel();
};

window.rerollAbilities = function() {
    if (!abilityPicking) return;

    if (save.rerollTokens > 0) {
        save.rerollTokens -= 1;
    } else if (save.gems >= 5) {
        save.gems -= 5;
    } else {
        showToast('Need 5 gems or one reroll token.');
        return;
    }

    saveSave();
    drawAbilityChoices();
    updateMetaHud();
};

window.addP = function(x, y, color, count = 5, speed = 100, life = 0.5, radius = 4) {
    const scaledCount = Math.max(1, Math.round(count * 3));
    const scaledLife = life * 1.18;
    const scaledSpeed = speed * 1.08;
    const scaledRadius = radius * 1.22;

    for (let i = 0; i < scaledCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * scaledSpeed;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,
            life: scaledLife,
            maxLife: scaledLife,
            color,
            r: Math.random() * scaledRadius + 1
        });
    }
};

window.addFxText = function(x, y, text, color = '#ffffff', life = 0.55, size = 18) {
    fxTexts.push({
        x,
        y,
        text,
        color,
        life,
        maxLife: life,
        vy: -48,
        size
    });
};

function loadSave() {
    try {
        const raw = localStorage.getItem('sd_save_v7');
        const legacy = localStorage.getItem('sd_save_v6') || localStorage.getItem('sd_save_v5') || localStorage.getItem('sd_save_v4');
        if (raw) {
            save = Object.assign(save, JSON.parse(raw));
        } else if (legacy) {
            save = Object.assign(save, JSON.parse(legacy));
        }
    } catch (error) {
        console.warn('Save load failed', error);
    }

    save.unlocked = Math.max(1, save.unlocked || 1);
    save.selectedLevel = Math.max(1, save.unlocked || 1);
    save.stats = Object.assign({ dmg: 0, atkSpd: 0, speed: 0 }, save.stats || {});
    save.premium = Object.assign({ noAds: false, neonTrail: false, neonTrailEnabled: true }, save.premium || {});
    save.inventory = Array.isArray(save.inventory) ? save.inventory : [];
    save.packs = Array.isArray(save.packs) ? save.packs : [];
    save.skins = Array.isArray(save.skins) && save.skins.length ? save.skins : ['stock'];
    save.equippedSkin = SKIN_DEFINITIONS[save.equippedSkin] ? save.equippedSkin : (save.skins[0] || 'stock');
    save.equippedCards = Array.isArray(save.equippedCards) ? save.equippedCards : [];
    save.metaSlots = Object.assign({ normalExtra: 0, legendaryExtra: 0 }, save.metaSlots || {});
    save.settings = Object.assign({ sfx: 0.7, music: 0.35, haptics: false }, save.settings || {});
    if (typeof save.settings.sfx !== 'number' && typeof save.settings.vfx === 'number') {
        save.settings.sfx = save.settings.vfx;
    }

    grantDailyLoginBonus();
    updateMetaHud();
    syncSettingsUi();
}

function grantDailyLoginBonus() {
    const now = new Date();
    const todayKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    if (save.lastLogin !== todayKey) {
        save.gold += 600;
        save.lastLogin = todayKey;
        saveSave();
        showToast('Daily login: +600 Gold');
    }
}

function saveSave() {
    localStorage.setItem('sd_save_v7', JSON.stringify(save));
}

function syncSettingsUi() {
    const sfxSlider = document.getElementById('settings-sfx');
    const sfxValue = document.getElementById('settings-sfx-value');
    const musicSlider = document.getElementById('settings-music');
    const musicValue = document.getElementById('settings-music-value');
    const hapticsToggle = document.getElementById('settings-haptics');

    if (sfxSlider) sfxSlider.value = Math.round((save.settings?.sfx | 0.7) * 100);
    if (sfxValue) sfxValue.textContent = `${Math.round((save.settings?.sfx | 0.7) * 100)}%`;
    if (musicSlider) musicSlider.value = Math.round((save.settings?.music | 0.35) * 100);
    if (musicValue) musicValue.textContent = `${Math.round((save.settings?.music | 0.35) * 100)}%`;
    if (hapticsToggle) hapticsToggle.checked = !!save.settings?.haptics;
}

function getInventoryBonuses() {
    return save.equippedCards.reduce((acc, cardId) => {
        const card = INVENTORY_CARDS[cardId];
        if (!card) return acc;
        acc.damageMultiplier += card.effect.damageMultiplier || 0;
        acc.speedMultiplier += card.effect.speedMultiplier || 0;
        acc.attackSpeedMultiplier += card.effect.attackSpeedMultiplier || 0;
        acc.magnetFlat += card.effect.magnetFlat || 0;
        return acc;
    }, { damageMultiplier: 0, speedMultiplier: 0, attackSpeedMultiplier: 0, magnetFlat: 0 });
}

function getCardSellValue(cardId) {
    const card = INVENTORY_CARDS[cardId];
    if (!card) return 0;
    const values = { blue: 28, dark: 54, purple: 110, red: 230, gold: 520 };
    return values[card.rarity] || 20;
}

function isLegendaryCard(cardId) {
    const card = INVENTORY_CARDS[cardId];
    return !!card && (card.rarity === 'red' || card.rarity === 'gold');
}

function getLoadoutSlotCaps() {
    const baseNormal = Math.min(5, 1 + Math.floor(save.unlocked / 15));
    const baseLegendary = save.unlocked >= 60 ? 2 : save.unlocked >= 30 ? 1 : 0;
    const normal = Math.min(7, baseNormal + (save.metaSlots.normalExtra || 0));
    const legendary = Math.min(3, baseLegendary + (save.metaSlots.legendaryExtra || 0));
    return { normal, legendary, baseNormal, baseLegendary };
}

function getEquippedCounts() {
    return save.equippedCards.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {});
}

function getUpgradeBonus(statConfig, level) {
    if (!level || level <= 0) {
        return 0;
    }

    if (Array.isArray(statConfig.steps)) {
        const baseSteps = statConfig.steps;
        const baseBonus = baseSteps.reduce((sum, value) => sum + value, 0);

        if (level <= baseSteps.length) {
            return baseSteps.slice(0, level).reduce((sum, value) => sum + value, 0);
        }

        const extraLevels = level - baseSteps.length;
        let extraBonus = 0;

        if (statConfig.name === 'Damage') {
            const earlyExtra = Math.min(extraLevels, 10);
            const lateExtra = Math.max(0, extraLevels - 10);
            extraBonus += earlyExtra * 0.7;
            extraBonus += lateExtra * 1.45;
        } else if (statConfig.name === 'Fire Rate') {
            const earlyExtra = Math.min(extraLevels, 10);
            const lateExtra = Math.max(0, extraLevels - 10);
            extraBonus += earlyExtra * 0.06;
            extraBonus += lateExtra * 0.11;
        } else if (statConfig.name === 'Speed') {
            const earlyExtra = Math.min(extraLevels, 10);
            const lateExtra = Math.max(0, extraLevels - 10);
            extraBonus += earlyExtra * 10;
            extraBonus += lateExtra * 16;
        }

        return baseBonus + extraBonus;
    }

    return level * (statConfig.inc || 0);
}

function updateMetaHud() {
    const goldNode = document.getElementById('hud-gold');
    const gemsNode = document.getElementById('hud-gems');
    const levelNode = document.getElementById('hud-level');
    const waveNode = document.getElementById('hud-wave');
    const label = document.getElementById('selected-level-label');
    const desc = document.getElementById('selected-level-desc');
    const difficulty = document.getElementById('selected-level-difficulty');
    const modePill = document.getElementById('selected-mode-pill');
    const battleButton = document.getElementById('battle-button');
    const endlessButton = document.getElementById('endless-button');
    const rerollButton = document.getElementById('ability-reroll');

    save.selectedLevel = save.unlocked;

    if (goldNode) goldNode.textContent = save.gold;
    if (gemsNode) gemsNode.textContent = save.gems;
    if (levelNode) levelNode.textContent = `LEVEL ${save.unlocked}`;

    if (waveNode) {
        if (gameRunning) {
            waveNode.textContent = currentMode === 'endless'
                ? `WAVE ${currentWave + 1}/∞`
                : `WAVE ${Math.min(currentWave + 1, currentLevelWaves.length)}/${currentLevelWaves.length}`;
        } else {
            waveNode.textContent = currentMode === 'endless'
                ? 'WAVES ∞'
                : `WAVES ${getLevelWaves(save.unlocked).length}`;
        }
    }

    if (label) label.textContent = currentMode === 'endless' ? `Endless Lv ${save.unlocked}` : `Level ${save.unlocked}`;
    if (desc) {
        const previewDrone = formatCompactNumber(getEnemyLevelStats('drone', save.unlocked).hp);
        const waves = getLevelWaves(save.unlocked).length;
        desc.textContent = currentMode === 'endless'
            ? `Infinite waves with almost no gold payout. Starts around Level ${save.unlocked}. Drone HP: ${previewDrone}.`
            : `Early kills are faster, late-game slows down. ${waves} waves. Drone HP: ${previewDrone}.`;
    }
    if (difficulty) {
        if (currentMode === 'endless') difficulty.textContent = 'Threat Endless';
        else if (save.unlocked < 4) difficulty.textContent = 'Threat Low';
        else if (save.unlocked < 9) difficulty.textContent = 'Threat Medium';
        else difficulty.textContent = 'Threat High';
    }
    if (modePill) modePill.textContent = currentMode === 'endless' ? 'Endless' : 'Mission';
    if (battleButton) battleButton.textContent = `Fight Mission ${save.unlocked}`;
    if (endlessButton) endlessButton.textContent = currentMode === 'endless' ? 'Endless Ready' : 'Endless';
    if (rerollButton) rerollButton.textContent = save.rerollTokens > 0 ? `Reroll ${save.rerollTokens}` : 'Reroll 5 Gems';
}

function setActiveNav(id) {
    document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('active'));
    const button = document.getElementById(id);
    if (button) button.classList.add('active');
}

window.openSettings = function() {
    ensureMusicEngine();
    syncSettingsUi();
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.add('active');
};

window.closeSettings = function() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.updateSfxSetting = function(value) {
    save.settings.sfx = Math.max(0, Math.min(1, Number(value) / 100));
    saveSave();
    syncSettingsUi();
};

window.updateMusicSetting = function(value) {
    ensureMusicEngine();
    save.settings.music = Math.max(0, Math.min(1, Number(value) / 100));
    saveSave();
    syncSettingsUi();
    syncMusicVolume();
};

window.toggleHaptics = function(enabled) {
    save.settings.haptics = !!enabled;
    saveSave();
    syncSettingsUi();
    if (enabled) triggerHaptic(12);
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (window.canvas) {
        window.canvas.style.display = id === 'game-canvas' ? 'block' : 'none';
    }
}

window.buildRoadmap = function() {
    const container = document.getElementById('roadmap-container');
    const fill = document.getElementById('road-progress');
    if (!container) return;

    container.querySelectorAll('.node').forEach((node) => node.remove());
    const visibleCount = 10;
    const startLevel = Math.max(1, save.unlocked - 3);
    const endLevel = startLevel + visibleCount - 1;
    const topStart = 36;
    const topStep = 118;
    const totalHeight = topStart + ((visibleCount - 1) * topStep) + 110;
    container.scrollTop = 0;
    container.style.minHeight = `${Math.max(420, totalHeight)}px`;

    for (let i = startLevel; i <= endLevel; i++) {
        const node = document.createElement('button');
        const isUnlocked = i <= save.unlocked;
        const isCurrent = i === save.unlocked;
        const offset = Math.sin(i * 0.72) * 90;
        const localIndex = i - startLevel;

        node.type = 'button';
        node.className = `node ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`.trim();
        node.style.top = `${topStart + localIndex * topStep}px`;
        node.style.left = `calc(50% + ${offset}px)`;
        node.innerHTML = `<strong>${i}</strong><span>${isUnlocked ? 'ready' : 'locked'}</span>`;
        node.disabled = true;

        container.appendChild(node);
    }

    if (fill) {
        const progressIndex = Math.min(visibleCount, Math.max(1, save.unlocked - startLevel + 1));
        fill.style.height = `${8 + ((progressIndex - 1) / Math.max(1, visibleCount - 1)) * 86}%`;
    }

    const currentNode = container.querySelector('.node.current');
    if (currentNode) {
        const desired = Math.max(0, currentNode.offsetTop - (container.clientHeight * 0.35));
        container.scrollTop = Math.min(desired, Math.max(0, container.scrollHeight - container.clientHeight));
    }
};

function createPlayer() {
    const inventory = getInventoryBonuses();
    const spawn = getArenaSpawnPoint();
    const earlyDamageBoost = save.unlocked <= 10 ? 1.18 : save.unlocked <= 20 ? 1.08 : 1;
    const damageUpgrade = getUpgradeBonus(PLAYER_STATS.dmg, save.stats.dmg);
    const fireRateUpgrade = getUpgradeBonus(PLAYER_STATS.atkSpd, save.stats.atkSpd);
    const speedUpgrade = getUpgradeBonus(PLAYER_STATS.speed, save.stats.speed);
    const baseDamage = (PLAYER_STATS.dmg.base + damageUpgrade) * Math.max(0.18, 1 + inventory.damageMultiplier) * earlyDamageBoost;
    const speed = (PLAYER_STATS.speed.base + speedUpgrade) * (1 + inventory.speedMultiplier);
    const magnet = PLAYER_STATS.magnet.base + inventory.magnetFlat;
    const atkSpeedMult = Math.max(0.35, (PLAYER_STATS.atkSpd.base + fireRateUpgrade) * (1 + inventory.attackSpeedMultiplier));

    return {
        x: spawn.x,
        y: spawn.y,
        r: 20,
        angle: 0,
        hp: PLAYER_STATS.hearts.base,
        maxHp: PLAYER_STATS.hearts.base,
        invulnerable: 0,
        dmg: baseDamage,
        damageMultiplier: 1,
        spd: speed,
        atkCooldown: 0.82 / atkSpeedMult,
        shootTimer: 0,
        range: PLAYER_STATS.range.base,
        multishot: 1,
        pierce: 0,
        magnet,
        reviveUsed: false,
        bossReviveUsed: false,
        orbiters: [],
        abilityXp: save.bonusAbilityXp || 0,
        nextAbilityXp: 12,
        abilityLevel: 1,
        abilityRanks: {},
        chainLightning: false,
        tornadoShot: false,
        echoShot: false,
        ionRound: false,
        shockNova: false,
        shockNovaCounter: 0,
        shotCounter: 0,
        trailPoints: [],
        trailBudget: 0
    };
}

function startLevel() {
    gameRunning = true;
    abilityPicking = false;
    levelClearHandled = false;
    currentWave = 0;
    endlessWaveRewardGold = 0;
    enemies = [];
    projectiles = [];
    pickups = [];
    particles = [];
    hazards = [];
    fxTexts = [];
    lightningBolts = [];
    keys = {};
    save.bonusAbilityXp = 0;

    window.canvas = document.getElementById('game-canvas');
    if (!window.canvas) return;
    window.ctx = window.canvas.getContext('2d');
    document.body.classList.add('in-run');

    resizeCanvas();
    configureArena();
    player = createPlayer();
    clampCamera();
    attachPointerControls();
    showScreen('game-canvas');
    if (currentMode === 'endless') {
        spawnEndlessWave(0);
    } else {
        spawnWave(0);
    }
    updateMetaHud();
    saveSave();
    lastTime = performance.now();
    requestAnimationFrame(loop);
}

function resizeCanvas() {
    if (!window.canvas) return;
    window.GW = window.innerWidth;
    window.GH = window.innerHeight;
    window.canvas.width = window.GW;
    window.canvas.height = window.GH;
    if (gameRunning) {
        configureArena();
        if (player) {
            player.x = Math.min(arena.width - WALL - player.r, player.x);
            player.y = Math.min(arena.height - WALL - player.r, player.y);
            clampCamera();
        }
    }
}

function attachPointerControls() {
    if (!window.canvas || window.canvas.dataset.controlsBound === '1') return;
    window.canvas.dataset.controlsBound = '1';
    window.canvas.addEventListener('pointerdown', handlePointerDown);
    window.canvas.addEventListener('pointermove', handlePointerMove);
    window.canvas.addEventListener('pointerup', handlePointerUp);
    window.canvas.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerDown(event) {
    ensureMusicEngine();
    touchState.active = true;
    touchState.x = event.clientX;
    touchState.y = event.clientY;
    touchState.lastX = event.clientX;
    touchState.lastY = event.clientY;
    touchState.dragVX = 0;
    touchState.dragVY = 0;
}

function handlePointerMove(event) {
    if (!touchState.active) return;
    const dx = event.clientX - touchState.lastX;
    const dy = event.clientY - touchState.lastY;

    touchState.x = event.clientX;
    touchState.y = event.clientY;
    touchState.lastX = event.clientX;
    touchState.lastY = event.clientY;

    const boostDrag = (delta) => {
        if (!delta) return 0;
        const sign = Math.sign(delta);
        const magnitude = Math.abs(delta);
        return sign * Math.pow(magnitude, 1.08) * 2.05;
    };

    touchState.dragVX += boostDrag(dx);
    touchState.dragVY += boostDrag(dy);
}

function handlePointerUp() {
    touchState.active = false;
    touchState.dragVX = 0;
    touchState.dragVY = 0;
}

function createEnemy(type, x, y) {
    return {
        ...type,
        id: nextEnemyId++,
        x,
        y,
        hp: type.hp,
        maxHp: type.hp,
        alive: true,
        hitFlash: 0,
        aiClock: Math.random() * 2,
        sprintCooldown: 1.8 + Math.random(),
        sprintTime: 0,
        sprintDirX: 0,
        sprintDirY: 0,
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        abilityCooldown: type.isBoss ? 4 : 0,
        lastHitBy: 0
    };
}

function spawnWave(index) {
    if (index >= currentLevelWaves.length) return;
    currentWave = index;
    const wave = currentLevelWaves[index];

    wave.forEach((entry) => {
        const scaledType = getEnemyLevelStats(entry.t, currentLevel);
        for (let i = 0; i < entry.n; i++) {
            const spawn = getArenaSpawnEdgePoint();
            enemies.push(createEnemy(scaledType, spawn.x, spawn.y));
        }
    });

    updateMetaHud();
}

function spawnEndlessWave(index) {
    currentWave = index;
    const scaledLevel = Math.max(1, save.unlocked + Math.floor(index / 3));
    currentLevel = scaledLevel;
    const waveSet = getLevelWaves(scaledLevel);
    const templateWave = waveSet[index % waveSet.length] || waveSet[0] || [{ t: 'drone', n: 8 }];
    const wave = templateWave.map((entry) => ({ ...entry }));

    wave.forEach((entry) => {
        const scaledType = getEnemyLevelStats(entry.t, scaledLevel);
        const count = entry.t === 'boss' ? entry.n : Math.max(1, Math.floor(entry.n * (1 + Math.min(0.45, index * 0.02))));
        for (let i = 0; i < count; i++) {
            const spawn = getArenaSpawnEdgePoint();
            enemies.push(createEnemy(scaledType, spawn.x, spawn.y));
        }
    });

    endlessWaveRewardGold += Math.max(1, Math.floor(Math.min(6, 1 + (index * 0.15))));
    updateMetaHud();
}

function loop(time) {
    if (!gameRunning) return;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (!abilityPicking) {
        update(dt);
    } else {
        updateParticles(dt);
    }

    render();
    requestAnimationFrame(loop);
}

function update(dt) {
    updatePlayerMovement(dt);
    updateAutoFire(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateOrbiters(dt);
    updateHazards(dt);
    updateLightningBolts(dt);
    updateFxTexts(dt);
    updateParticles(dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    screenShake = Math.max(0, screenShake - dt * 3.2);
    powerPulse = Math.max(0, powerPulse - dt * 1.6);
    killStreakTimer = Math.max(0, killStreakTimer - dt);
    if (killStreakTimer <= 0) killStreak = 0;
    checkWaveProgress();
}

function updateLightningBolts(dt) {
    lightningBolts.forEach((bolt) => {
        bolt.life -= dt;
    });
    lightningBolts = lightningBolts.filter((bolt) => bolt.life > 0);
}

function updatePlayerMovement(dt) {
    const prevX = player.x;
    const prevY = player.y;
    let vx = 0;
    let vy = 0;

    if (keys.KeyW || keys.ArrowUp) vy -= 1;
    if (keys.KeyS || keys.ArrowDown) vy += 1;
    if (keys.KeyA || keys.ArrowLeft) vx -= 1;
    if (keys.KeyD || keys.ArrowRight) vx += 1;

    if (touchState.active) {
        player.x += touchState.dragVX;
        player.y += touchState.dragVY;

        if (Math.abs(touchState.dragVX) > 0.1 || Math.abs(touchState.dragVY) > 0.1) {
            player.angle = Math.atan2(touchState.dragVY, touchState.dragVX) + Math.PI / 2;
        }

        touchState.dragVX *= 0.18;
        touchState.dragVY *= 0.18;
    }

    const magnitude = Math.hypot(vx, vy);
    if (magnitude > 0) {
        const nx = vx / magnitude;
        const ny = vy / magnitude;
        player.x += nx * player.spd * dt;
        player.y += ny * player.spd * dt;
        player.angle = Math.atan2(ny, nx) + Math.PI / 2;
    }

    const topBoundary = arena.top;
    player.x = Math.max(WALL + player.r, Math.min(arena.width - WALL - player.r, player.x));
    player.y = Math.max(topBoundary + player.r, Math.min(arena.height - WALL - player.r, player.y));
    updatePlayerTrail(prevX, prevY, dt);
    clampCamera();
}

function updatePlayerTrail(prevX, prevY, dt) {
    if (!player) return;
    const moved = Math.hypot(player.x - prevX, player.y - prevY);
    const trail = player.trailPoints || (player.trailPoints = []);
    const maxLength = 92;

    player.trailBudget = (player.trailBudget || 0) + moved;
    if (moved > 0.5 && (trail.length === 0 || player.trailBudget >= 4.5)) {
        trail.unshift({
            x: player.x,
            y: player.y,
            life: 1,
            width: Math.min(1.18, 0.62 + (moved / 22))
        });
        player.trailBudget = 0;
    } else if (trail.length === 0) {
        trail.unshift({ x: player.x, y: player.y, life: 1, width: 0.62 });
    } else {
        trail[0].x = player.x;
        trail[0].y = player.y;
        trail[0].width = Math.min(1.18, 0.62 + (moved / 22));
    }

    let total = 0;
    for (let i = 0; i < trail.length; i++) {
        trail[i].life = Math.max(0, trail[i].life - dt * 1.35);
        if (i > 0) {
            total += Math.hypot(trail[i - 1].x - trail[i].x, trail[i - 1].y - trail[i].y);
            if (total > maxLength) {
                trail.length = i + 1;
                break;
            }
        }
    }

    player.trailPoints = trail.filter((point, index) => point.life > 0.08 && index < 16);
}

function updateAutoFire(dt) {
    player.shootTimer = Math.max(0, player.shootTimer - dt);
    const nearest = findNearestEnemy(player.range);
    if (!nearest) return;

    player.angle = Math.atan2(nearest.y - player.y, nearest.x - player.x) + Math.PI / 2;
    if (player.shootTimer > 0) return;

    player.shootTimer = player.atkCooldown;
    player.shotCounter += 1;

    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    const spreadStep = 0.14;
    const start = -spreadStep * (player.multishot - 1) / 2;

    for (let i = 0; i < player.multishot; i++) {
        addP(player.x, player.y - 12, '#00f2ff', 5, 140, 0.18, 2);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + start + (spreadStep * i),
            speed: 760,
            life: 1.1,
            radius: 5,
            damage: player.dmg * player.damageMultiplier,
            pierce: player.pierce,
            canChain: player.chainLightning,
            color: '#f5fbff'
        });
    }

    playSfx('shoot', Math.min(1.2, 0.7 + player.multishot * 0.08));

    if (player.echoShot && player.shotCounter % 4 === 0) {
        const echoRank = getAbilityRank('echo_shot');
        addP(player.x, player.y - 12, '#7be8ff', 8, 170, 0.2, 2);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle,
            speed: 860,
            life: 1.25,
            radius: 6,
            damage: player.dmg * player.damageMultiplier * (0.52 + (echoRank * 0.08)),
            pierce: player.pierce + 1,
            canChain: false,
            color: '#7be8ff'
        });
        playSfx('ability', 0.8);
    }

    if (player.ionRound && player.shotCounter % 5 === 0) {
        const ionRank = getAbilityRank('ion_round');
        addP(player.x, player.y - 12, '#ffcf4d', 10, 210, 0.2, 3);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle,
            speed: 940,
            life: 1.18,
            radius: 8,
            damage: player.dmg * player.damageMultiplier * (1.45 + (ionRank * 0.25)),
            pierce: player.pierce + 1,
            canChain: true,
            color: '#ffcf4d'
        });
        playSfx('ability', 1);
    }

    if (player.tornadoShot && player.shotCounter % 3 === 0) {
        powerPulse = Math.min(1.5, powerPulse + 0.45);
        screenShake = Math.min(1.5, screenShake + 0.22);
        spawnTornadoVolley(baseAngle, getAbilityRank('tornado_shot'));
        playSfx('tornado', 1);
    }

    screenShake = Math.min(1.5, screenShake + 0.08);
}

function spawnProjectile(config) {
    projectiles.push({
        id: nextProjectileId++,
        x: config.x,
        y: config.y,
        vx: Math.cos(config.angle) * config.speed,
        vy: Math.sin(config.angle) * config.speed,
        dmg: config.damage,
        life: config.life,
        r: config.radius,
        pierce: config.pierce,
        canChain: config.canChain,
        tornado: !!config.tornado,
        spin: 0,
        color: config.color || '#f5fbff'
    });
}

function spawnTornadoVolley(baseAngle, rank = 1) {
    const extra = Math.max(0, rank - 1);
    const total = 3 + extra;
    const start = -((total - 1) * 0.22) / 2;

    for (let i = 0; i < total; i++) {
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + start + i * 0.22,
            speed: 340,
            life: 1.5,
            radius: 11,
            damage: player.dmg * player.damageMultiplier * (0.66 + rank * 0.08),
            pierce: 99,
            canChain: false,
            tornado: true,
            color: '#bc13fe'
        });
    }
}

function updateProjectiles(dt) {
    projectiles.forEach((projectile) => {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        projectile.spin += dt * 10;

        if (projectile.tornado) {
            addP(projectile.x, projectile.y, '#bc13fe', 2, 40, 0.12, 2);
        } else if (Math.random() < 0.45) {
            addP(projectile.x, projectile.y, projectile.color, 1, 20, 0.1, 1);
        }

        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
            if (distance >= enemy.r + projectile.r) continue;
            if (projectile.tornado && enemy.lastHitBy === projectile.id) continue;

            enemy.hp -= projectile.dmg * (projectile.tornado ? dt * 8 : 1);
            enemy.hitFlash = 0.08;
            enemy.lastHitBy = projectile.id;
            addP(projectile.x, projectile.y, enemy.glow, projectile.tornado ? 4 : 3, 90, 0.16, 2);

            if (projectile.canChain) {
                triggerChainLightning(enemy, projectile.dmg * 0.45);
                projectile.canChain = false;
            }

            if (!projectile.tornado) {
                projectile.pierce -= 1;
            }

            if (enemy.hp <= 0) triggerKill(enemy);
            if (!projectile.tornado && projectile.pierce < 0) {
                projectile.life = 0;
                break;
            }
        }
    });

    projectiles = projectiles.filter((projectile) => projectile.life > 0);
}

function triggerChainLightning(origin, damage) {
    const rank = Math.max(1, getAbilityRank('chain_lightning'));
    const maxTargets = 1 + ((rank - 1) * 2);
    const chainDamage = damage * (0.9 + (rank - 1) * 0.25);
    const targets = enemies
        .filter((enemy) => enemy.alive && enemy.id !== origin.id)
        .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - origin.x, enemy.y - origin.y) }))
        .filter((entry) => entry.distance < 170 + (rank * 12))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxTargets);

    targets.forEach(({ enemy }) => {
        enemy.hp -= chainDamage;
        enemy.hitFlash = 0.12;
        addLightningBolt(origin.x, origin.y, enemy.x, enemy.y, '#7be8ff', 0.16, 3.6 + rank * 0.35);
        addP(enemy.x, enemy.y, '#00f2ff', 14, 150, 0.28, 2);
        addFxText(enemy.x, enemy.y - 18, 'ARC', '#00f2ff', 0.32, 16);
        if (enemy.hp <= 0) triggerKill(enemy);
    });
    if (targets.length) playSfx('chain', 0.95);
}

function updateEnemies(dt) {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
        enemy.aiClock += dt;
        enemy.sprintCooldown -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.max(0.001, Math.hypot(dx, dy));
        const nx = dx / distance;
        const ny = dy / distance;
        const px = -ny;
        const py = nx;

        let moveX = nx;
        let moveY = ny;
        let speed = enemy.spd * 70;

        if (enemy.ai === 'strafe') {
            moveX = nx * 0.72 + px * (distance < 140 ? 0.82 : 0.45) * enemy.strafeDir;
            moveY = ny * 0.72 + py * (distance < 140 ? 0.82 : 0.45) * enemy.strafeDir;
        } else if (enemy.ai === 'sprint') {
            if (enemy.sprintTime > 0) {
                enemy.sprintTime -= dt;
                moveX = enemy.sprintDirX;
                moveY = enemy.sprintDirY;
                speed *= 2.2;
            } else if (enemy.sprintCooldown <= 0 && distance > 110) {
                enemy.sprintCooldown = 2.2 + Math.random();
                enemy.sprintTime = 0.35;
                enemy.sprintDirX = nx;
                enemy.sprintDirY = ny;
                addP(enemy.x, enemy.y, enemy.glow, 8, 110, 0.35, 2);
            } else {
                moveX = nx * 0.88 + px * 0.28 * Math.sin(enemy.aiClock * 4);
                moveY = ny * 0.88 + py * 0.28 * Math.sin(enemy.aiClock * 4);
            }
        } else if (enemy.ai === 'heavy') {
            moveX = nx + px * 0.18 * Math.cos(enemy.aiClock * 1.7);
            moveY = ny + py * 0.18 * Math.cos(enemy.aiClock * 1.7);
            speed *= 0.84;
        } else if (enemy.ai === 'boss') {
            updateBossBehavior(enemy, dt, nx, ny, px, py);
            moveX = enemy.moveX;
            moveY = enemy.moveY;
            speed = enemy.moveSpeed;
        }

        const moveMag = Math.max(0.001, Math.hypot(moveX, moveY));
        enemy.x += (moveX / moveMag) * speed * dt;
        enemy.y += (moveY / moveMag) * speed * dt;

        resolveEnemyClumping(enemy);
        enemy.x = Math.max(WALL + enemy.r, Math.min(arena.width - WALL - enemy.r, enemy.x));
        enemy.y = Math.max(arena.top + enemy.r, Math.min(arena.height - WALL - enemy.r, enemy.y));
        if (distance < enemy.r + player.r) {
            damagePlayer(enemy.isBoss ? 'boss' : 'enemy');
        }
    });
}

function updateBossBehavior(enemy, dt, nx, ny, px, py) {
    enemy.abilityCooldown -= dt;
    enemy.moveX = nx * 0.62 + px * 0.28 * Math.sin(enemy.aiClock * 2.2);
    enemy.moveY = ny * 0.62 + py * 0.28 * Math.sin(enemy.aiClock * 2.2);
    enemy.moveSpeed = enemy.spd * 70;

    if (enemy.sprintTime > 0) {
        enemy.sprintTime -= dt;
        enemy.moveX = enemy.sprintDirX;
        enemy.moveY = enemy.sprintDirY;
        enemy.moveSpeed = enemy.spd * 175;
        return;
    }

    if (enemy.abilityCooldown > 0) return;
    enemy.abilityCooldown = 4.2;

    const options = ['dash', 'nova', 'summon'];
    const choice = options[Math.floor(Math.random() * options.length)];

    if (choice === 'dash') {
        enemy.sprintTime = 0.5;
        enemy.sprintDirX = nx;
        enemy.sprintDirY = ny;
        addP(enemy.x, enemy.y, '#ff375f', 16, 180, 0.45, 4);
    } else if (choice === 'nova') {
        hazards.push({
            id: nextHazardId++,
            type: 'ring',
            x: enemy.x,
            y: enemy.y,
            radius: 12,
            maxRadius: 210,
            speed: 220,
            life: 1.2,
            color: '#ff375f',
            hit: false
        });
    } else {
        const spawnAngles = [-0.45, 0.45];
        spawnAngles.forEach((offset) => {
            const sx = enemy.x + Math.cos(enemy.aiClock + offset) * 80;
            const sy = enemy.y + Math.sin(enemy.aiClock + offset) * 80;
            enemies.push(createEnemy(getEnemyLevelStats('chaser', currentLevel), sx, sy));
        });
        addP(enemy.x, enemy.y, '#bc13fe', 14, 140, 0.45, 3);
    }
}

function formatCompactNumber(value) {
    const units = [
        { limit: 1e12, suffix: 'T' },
        { limit: 1e9, suffix: 'B' },
        { limit: 1e6, suffix: 'M' },
        { limit: 1e3, suffix: 'K' }
    ];

    for (const unit of units) {
        if (value >= unit.limit) {
            const compact = value / unit.limit;
            return `${compact >= 100 ? compact.toFixed(0) : compact >= 10 ? compact.toFixed(1) : compact.toFixed(2)}${unit.suffix}`;
        }
    }

    return `${Math.round(value)}`;
}

function resolveEnemyClumping(enemy) {
    for (const other of enemies) {
        if (other === enemy || !other.alive) continue;
        const odx = enemy.x - other.x;
        const ody = enemy.y - other.y;
        const odist = Math.max(0.001, Math.hypot(odx, ody));
        const minDist = enemy.r + other.r;
        if (odist < minDist) {
            const push = (minDist - odist) * 0.45;
            enemy.x += (odx / odist) * push;
            enemy.y += (ody / odist) * push;
        }
    }
}

function updatePickups(dt) {
    pickups.forEach((pickup) => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.max(0.001, Math.hypot(dx, dy));
        pickup.spin += dt * 5;
        if (Math.random() < 0.08) {
            addP(pickup.x, pickup.y, '#00ff9d', 1, 18, 0.1, 1);
        }

        if (distance < player.magnet) {
            const pull = (1 - distance / player.magnet) * 820;
            pickup.x += (dx / distance) * pull * dt;
            pickup.y += (dy / distance) * pull * dt;
        }

        if (distance < player.r + 10) {
            save.gold += pickup.gold;
            pickup.alive = false;
            addFxText(pickup.x, pickup.y, `+${pickup.gold}`, '#00ff9d', 0.5, 17);
            powerPulse = Math.min(1.5, powerPulse + 0.08);
            playSfx('pickup', 0.8);
            updateMetaHud();
        }
    });

    pickups = pickups.filter((pickup) => pickup.alive);
}

function updateOrbiters(dt) {
    player.orbiters.forEach((orbiter, index) => {
        orbiter.angle += dt * (1.8 + index * 0.08);
        orbiter.x = player.x + Math.cos(orbiter.angle) * orbiter.distance;
        orbiter.y = player.y + Math.sin(orbiter.angle) * orbiter.distance;

        enemies.forEach((enemy) => {
            if (!enemy.alive) return;
            const distance = Math.hypot(enemy.x - orbiter.x, enemy.y - orbiter.y);
            if (distance < enemy.r + orbiter.r) {
                enemy.hp -= orbiter.damage * dt;
                enemy.hitFlash = 0.04;
                if (enemy.hp <= 0) triggerKill(enemy);
            }
        });
    });
}

function updateHazards(dt) {
    hazards.forEach((hazard) => {
        hazard.life -= dt;
        if (hazard.type === 'ring') {
            hazard.radius += hazard.speed * dt;
            const distance = Math.hypot(player.x - hazard.x, player.y - hazard.y);
            if (!hazard.hit && Math.abs(distance - hazard.radius) < 14) {
                hazard.hit = true;
                damagePlayer('boss');
            }
        }
    });
    hazards = hazards.filter((hazard) => hazard.life > 0 && hazard.radius < hazard.maxRadius);
}

function updateFxTexts(dt) {
    fxTexts.forEach((text) => {
        text.y += text.vy * dt;
        text.life -= dt;
    });
    fxTexts = fxTexts.filter((text) => text.life > 0);
}

function updateParticles(dt) {
    particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);
}

function checkWaveProgress() {
    if (enemies.some((enemy) => enemy.alive)) return;
    if (currentMode === 'endless') {
        spawnEndlessWave(currentWave + 1);
        return;
    }
    if (currentWave < currentLevelWaves.length - 1) {
        spawnWave(currentWave + 1);
        return;
    }
    if (!levelClearHandled) {
        levelClearHandled = true;
        victory();
    }
}

function triggerKill(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    const killGold = currentMode === 'endless' ? (enemy.isBoss ? 2 : 0) : (enemy.isBoss ? 10 : 1);
    addP(enemy.x, enemy.y, enemy.glow, enemy.isBoss ? 42 : 18, enemy.isBoss ? 260 : 210, 0.8, enemy.isBoss ? 7 : 4);
    addP(enemy.x, enemy.y, '#ffffff', enemy.isBoss ? 16 : 6, enemy.isBoss ? 180 : 120, 0.26, enemy.isBoss ? 4 : 2);
    if (killGold > 0) {
        pickups.push({ x: enemy.x, y: enemy.y, gold: killGold, alive: true, spin: 0 });
    }
    grantAbilityXp(enemy.exp);
    if (enemy.isBoss) save.gems += 2;
    if (player.shockNova) {
        player.shockNovaCounter += 1;
        const shockRank = Math.max(1, getAbilityRank('shock_nova'));
        const triggerEvery = Math.max(6, 12 - ((shockRank - 1) * 2));
        if (player.shockNovaCounter >= triggerEvery) {
            player.shockNovaCounter = 0;
            releaseShockNova();
        }
    }
    killStreak += 1;
    killStreakTimer = 2.2;
    screenShake = Math.min(2.9, screenShake + (enemy.isBoss ? 1.05 : 0.28));
    powerPulse = Math.min(2.3, powerPulse + (enemy.isBoss ? 0.88 : 0.2));
    if (enemy.isBoss) triggerHaptic([18, 24, 30]);
    addFxText(enemy.x, enemy.y - enemy.r - 12, enemy.isBoss ? 'BOSS DOWN' : `+${enemy.exp} XP`, enemy.isBoss ? '#ff9d00' : '#ffffff', enemy.isBoss ? 0.85 : 0.45, enemy.isBoss ? 24 : 16);
    updateMetaHud();
}

function releaseShockNova() {
    const rank = Math.max(1, getAbilityRank('shock_nova'));
    addP(player.x, player.y, '#7be8ff', 46, 290, 0.52, 5);
    addP(player.x, player.y, '#ffffff', 18, 170, 0.22, 3);
    addFxText(player.x, player.y - 26, 'NOVA', '#7be8ff', 0.42, 22);
    playSfx('chain', 1.15);
    powerPulse = Math.min(2.4, powerPulse + 0.5);
    screenShake = Math.min(3, screenShake + 0.45);
    triggerHaptic([12, 14, 18]);

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance > 170 + rank * 16) return;
        enemy.hp -= player.dmg * player.damageMultiplier * (0.36 + rank * 0.12);
        enemy.hitFlash = 0.14;
        addLightningBolt(player.x, player.y, enemy.x, enemy.y, '#7be8ff', 0.16, 3);
        if (enemy.hp <= 0) triggerKill(enemy);
    });
}

function grantAbilityXp(amount) {
    player.abilityXp += amount;
    while (player.abilityXp >= player.nextAbilityXp) {
        player.abilityXp -= player.nextAbilityXp;
        player.abilityLevel += 1;
        player.nextAbilityXp = Math.floor(player.nextAbilityXp * 1.24);
        openAbilityDraft();
        if (abilityPicking) break;
    }
}

function openAbilityDraft() {
    abilityPicking = true;
    const overlay = document.getElementById('ability-overlay');
    if (overlay) overlay.classList.add('active');
    drawAbilityChoices();
}

function getAbilityRank(id) {
    return player?.abilityRanks?.[id] || 0;
}

function getAbilityEvolutionText(id, rank) {
    const nextRank = rank + 1;
    switch (id) {
        case 'damage_boost':
            return `Rank ${nextRank}: +22% total weapon damage`;
        case 'rapid_fire':
            return `Rank ${nextRank}: +14% faster firing`;
        case 'multi':
            return `Rank ${nextRank}: +1 projectile per volley`;
        case 'pierce':
            return `Rank ${nextRank}: +1 extra pierce`;
        case 'chain_lightning':
            return `Rank ${nextRank}: ${1 + (rank * 2)} chain targets, stronger arcs`;
        case 'tornado_shot':
            return `Rank ${nextRank}: more tornado blades and impact`;
        case 'echo_shot':
            return `Rank ${nextRank}: more frequent echo volleys`;
        case 'ion_round':
            return `Rank ${nextRank}: heavier ion burst and chain power`;
        case 'shock_nova':
            return `Rank ${nextRank}: nova triggers faster and hits harder`;
        case 'heal_heart':
            return rank > 0 ? `Rank ${nextRank}: heal and gain a burst of power` : 'Restore one heart';
        case 'orbiter':
            return `Rank ${nextRank}: add another orbit drone`;
        default:
            return '';
    }
}

function getAbilityIconMarkup(id, fallback) {
    const icons = {
        damage_boost: '<div class="ability-symbol fist"><span></span><span></span><span></span></div>',
        rapid_fire: '<div class="ability-symbol barrage"><span></span><span></span><span></span></div>',
        multi: '<div class="ability-symbol volley"><span></span><span></span><span></span></div>',
        pierce: '<div class="ability-symbol pierce"><span></span><span></span></div>',
        chain_lightning: '<div class="ability-symbol lightning"><span></span><span></span><span></span></div>',
        tornado_shot: '<div class="ability-symbol tornado"><span></span><span></span><span></span></div>',
        echo_shot: '<div class="ability-symbol echo"><span></span><span></span><span></span></div>',
        ion_round: '<div class="ability-symbol ion"><span></span><span></span></div>',
        shock_nova: '<div class="ability-symbol nova"><span></span><span></span><span></span></div>',
        heal_heart: '<div class="ability-symbol heart"><span></span></div>',
        orbiter: '<div class="ability-symbol orbit"><span></span><span></span><span></span></div>'
    };
    return icons[id] || fallback;
}

function drawAbilityChoices() {
    const cards = document.getElementById('ability-cards');
    if (!cards) {
        abilityPicking = false;
        return;
    }

    cards.innerHTML = '';
    activeAbilityChoices = [...ABILITIES].sort(() => Math.random() - 0.5).slice(0, 3);
    activeAbilityChoices.forEach((ability) => {
        const rank = getAbilityRank(ability.id);
        const card = document.createElement('div');
        card.className = 'shop-card ability-card';
        card.innerHTML = `
            <div class="card-icon ability-icon ability-${ability.id}">${getAbilityIconMarkup(ability.id, ability.icon)}</div>
            <div class="card-title">${ability.name}</div>
            <div class="card-meta">${rank > 0 ? `Owned Lv ${rank}` : ability.rarity.toUpperCase()}</div>
            <div class="card-copy">${getAbilityEvolutionText(ability.id, rank)}</div>
            <button class="inline-button" type="button">${rank > 0 ? 'Evolve' : 'Select'}</button>
        `;
        card.querySelector('button').onclick = () => {
            applyAbility(ability.id);
            abilityPicking = false;
            const overlay = document.getElementById('ability-overlay');
            if (overlay) overlay.classList.remove('active');
        };
        cards.appendChild(card);
    });
    updateMetaHud();
}

function applyAbility(id) {
    player.abilityRanks[id] = (player.abilityRanks[id] || 0) + 1;
    const rank = player.abilityRanks[id];
    const ability = ABILITIES.find((entry) => entry.id === id);

    switch (id) {
        case 'damage_boost':
            player.damageMultiplier *= 1.22;
            break;
        case 'rapid_fire':
            player.atkCooldown *= 0.86;
            break;
        case 'multi':
            player.multishot += 1;
            break;
        case 'pierce':
            player.pierce += 1;
            break;
        case 'chain_lightning':
            player.chainLightning = true;
            break;
        case 'tornado_shot':
            player.tornadoShot = true;
            break;
        case 'echo_shot':
            player.echoShot = true;
            break;
        case 'ion_round':
            player.ionRound = true;
            break;
        case 'shock_nova':
            player.shockNova = true;
            break;
        case 'heal_heart':
            player.hp = Math.min(player.maxHp, player.hp + 1);
            if (rank > 1) {
                player.damageMultiplier *= 1.08;
                player.atkCooldown *= 0.95;
            }
            break;
        case 'orbiter':
            player.orbiters.push({
                id: nextOrbiterId++,
                angle: Math.random() * Math.PI * 2,
                distance: 50 + player.orbiters.length * 12,
                r: 7,
                damage: 18,
                x: player.x,
                y: player.y
            });
            break;
        default:
            break;
    }
    playSfx('ability', ability?.rarity === 'epic' ? 1.25 : 1);
    powerPulse = Math.min(2.2, powerPulse + (ability?.rarity === 'epic' ? 0.58 : 0.32));
    screenShake = Math.min(2.7, screenShake + (ability?.rarity === 'epic' ? 0.42 : 0.18));
    triggerHaptic(ability?.rarity === 'epic' ? [14, 18, 24] : 12);
}

function findNearestEnemy(range) {
    let nearest = null;
    let minDist = range;
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance < minDist) {
            minDist = distance;
            nearest = enemy;
        }
    });
    return nearest;
}

function damagePlayer(source) {
    if (player.invulnerable > 0) return;
    player.hp -= 1;
    player.invulnerable = 0.9;
    addP(player.x, player.y, source === 'boss' ? '#ff375f' : '#ffffff', 16, 160, 0.35, 3);
    addFxText(player.x, player.y - 20, '-1', '#ff375f', 0.48, 22);
    screenShake = Math.min(2.5, screenShake + 0.5);
    playSfx('hit', source === 'boss' ? 1.15 : 1);
    triggerHaptic(source === 'boss' ? [18, 20, 22] : 14);

    if (player.hp > 0) return;

    if (source === 'boss' && !player.bossReviveUsed && save.bossRevive > 0) {
        save.bossRevive -= 1;
        player.bossReviveUsed = true;
        player.hp = 1;
        player.invulnerable = 1.2;
        saveSave();
        updateMetaHud();
        return;
    }

    if (!player.reviveUsed && save.reviveCharges > 0) {
        save.reviveCharges -= 1;
        player.reviveUsed = true;
        player.hp = 1;
        player.invulnerable = 1.2;
        saveSave();
        updateMetaHud();
        return;
    }

    gameOver();
}

function closeMission() {
    gameRunning = false;
    abilityPicking = false;
    const overlay = document.getElementById('ability-overlay');
    if (overlay) overlay.classList.remove('active');
    if (window.canvas) window.canvas.style.display = 'none';
    document.body.classList.remove('in-run');
    touchState.active = false;
    showFight();
    buildRoadmap();
    updateMetaHud();
}

function hideResultOverlay() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showResultOverlay({ loss = false, title, copy, stats, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
    const overlay = document.getElementById('result-overlay');
    const badge = document.getElementById('result-badge');
    const titleNode = document.getElementById('result-title');
    const copyNode = document.getElementById('result-copy');
    const statsNode = document.getElementById('result-stats');
    const primary = document.getElementById('result-primary');
    const secondary = document.getElementById('result-secondary');
    if (!overlay || !badge || !titleNode || !copyNode || !statsNode || !primary || !secondary) return;

    badge.textContent = loss ? 'Defeat' : 'Victory';
    badge.classList.toggle('loss', loss);
    titleNode.textContent = title;
    copyNode.textContent = copy;
    statsNode.innerHTML = stats.map((entry) => `<div class="result-line"><span>${entry.label}</span><strong>${entry.value}</strong></div>`).join('');
    primary.textContent = primaryLabel;
    secondary.textContent = secondaryLabel;
    resultPrimaryAction = onPrimary;
    resultSecondaryAction = onSecondary;
    overlay.classList.add('active');
}

function gameOver() {
    saveSave();
    closeMission();
    playSfx('death', 1.1);
    triggerHaptic([40, 35, 40]);
    if (currentMode === 'endless') {
        const endlessGold = endlessWaveRewardGold;
        const endlessGems = Math.floor(currentWave / 12);
        save.gold += endlessGold;
        save.gems += endlessGems;
        saveSave();
        showResultOverlay({
            loss: true,
            title: 'Endless Run Over',
            copy: 'Endless is for pushing builds, not for farming money.',
            stats: [
                { label: 'Waves Survived', value: `${currentWave + 1}` },
                { label: 'Scaled Level', value: `${currentLevel}` },
                { label: 'Gold Earned', value: `+${formatCompactNumber(endlessGold)}` },
                { label: 'Gems Earned', value: `+${endlessGems}` }
            ],
            primaryLabel: 'Run Endless',
            secondaryLabel: 'Map',
            onPrimary: () => window.startEndlessMode(),
            onSecondary: () => {
                hideResultOverlay();
                currentMode = 'mission';
                showFight();
            }
        });
        return;
    }
    showResultOverlay({
        loss: true,
        title: 'Mission Failed',
        copy: 'One hit costs one full heart. Upgrade and push again.',
        stats: [
            { label: 'Mission', value: `Level ${currentLevel}` },
            { label: 'Best Reach', value: `Wave ${Math.min(currentWave + 1, Math.max(1, currentLevelWaves.length))}/${Math.max(1, currentLevelWaves.length)}` },
            { label: 'Gold Bank', value: formatCompactNumber(save.gold) }
        ],
        primaryLabel: 'Retry',
        secondaryLabel: 'Map',
        onPrimary: () => window.startCurrentLevel(),
        onSecondary: () => {
            hideResultOverlay();
            showFight();
        }
    });
}

function victory() {
    if (currentMode === 'endless') return;
    const goldReward = getLevelGoldReward(currentLevel);
    const gemReward = 1 + Math.floor(currentLevel / 6);
    save.unlocked = Math.max(save.unlocked, currentLevel + 1);
    save.selectedLevel = save.unlocked;
    save.gems += gemReward;
    save.gold += goldReward;
    saveSave();
    closeMission();
    playSfx('win', 1);
    triggerHaptic([18, 20, 28]);
    showResultOverlay({
        title: `Level ${currentLevel} Clear`,
        copy: 'Rewards paid out. The next mission is live.',
        stats: [
            { label: 'Gold Earned', value: `+${formatCompactNumber(goldReward)}` },
            { label: 'Gems Earned', value: `+${gemReward}` },
            { label: 'Next Mission', value: `Level ${save.unlocked}` }
        ],
        primaryLabel: 'Next Fight',
        secondaryLabel: 'Map',
        onPrimary: () => window.startCurrentLevel(),
        onSecondary: () => {
            hideResultOverlay();
            showFight();
        }
    });
}

function updateHubVisualization(focusId) {
    const holder = document.getElementById('hub-ring-progress');
    const readout = document.getElementById('hub-stats-readout');
    if (!holder || !readout) return;

    holder.innerHTML = '';
    const sizes = [300, 220, 150];
    UPGRADES.forEach((upgrade, index) => {
        const level = save.stats[upgrade.id] || 0;
        const ratio = level / upgrade.max;
        const scaledSize = sizes[index] + (ratio * (34 - (index * 6)));
        const arc = document.createElement('div');
        arc.className = 'ring-progress';
        arc.style.width = `${scaledSize}px`;
        arc.style.height = `${scaledSize}px`;
        arc.style.borderWidth = `${5 + Math.round(ratio * 6)}px`;
        arc.style.opacity = `${0.4 + (ratio * 0.6)}`;
        arc.style.setProperty('--ring-color', upgrade.color);
        arc.style.transform = `translate(-50%, -50%) rotate(${(-90 + ratio * 300)}deg)`;
        holder.appendChild(arc);
    });

    const focused = UPGRADES.find((entry) => entry.id === (focusId || lastUpgradeId)) || UPGRADES[0];
    const current = getUpgradePreviewValue(focused.id, save.stats[focused.id] || 0);
    const next = getUpgradePreviewValue(focused.id, Math.min(focused.max, (save.stats[focused.id] || 0) + 1));
    readout.textContent = `${focused.name}: ${current} > ${next}`;
}

function getUpgradePreviewValue(id, level) {
    if (id === 'dmg') return (PLAYER_STATS.dmg.base + getUpgradeBonus(PLAYER_STATS.dmg, level)).toFixed(1);
    if (id === 'atkSpd') return (PLAYER_STATS.atkSpd.base + getUpgradeBonus(PLAYER_STATS.atkSpd, level)).toFixed(2);
    if (id === 'speed') return Math.round(PLAYER_STATS.speed.base + getUpgradeBonus(PLAYER_STATS.speed, level));
    return level;
}

function renderHub() {
    const grid = document.getElementById('hub-grid');
    if (!grid) return;
    grid.innerHTML = '';

    UPGRADES.forEach((upgrade) => {
        const level = save.stats[upgrade.id] || 0;
        const cost = getUpgradeCost(upgrade, level);
        const card = document.createElement('div');
        card.className = `shop-card ${lastUpgradeId === upgrade.id ? 'upgraded' : ''}`.trim();
        card.innerHTML = `
            <div class="card-icon" style="color:${upgrade.color}; border-color:${upgrade.color}55;">${upgrade.icon}</div>
            <div class="card-title">${upgrade.name}</div>
            <div class="card-meta">Level ${level}/${upgrade.max}</div>
            <div class="card-copy">${upgrade.desc}</div>
            <button class="inline-button" type="button" ${level >= upgrade.max ? 'disabled' : ''}>${level >= upgrade.max ? 'MAXED' : `BUY ${cost} GOLD`}</button>
        `;
        card.onmouseenter = () => updateHubVisualization(upgrade.id);
        card.onclick = () => buyUpgrade(upgrade.id);
        grid.appendChild(card);
    });

    updateHubVisualization();
}

function renderShop() {
    renderCardPackStoreColumn();
    renderSkinStoreColumn();
    renderStoreColumn('shop-gems', SHOP_SECTIONS.gemItems, 'gems');
    renderRealMoneyColumn();
}

function renderSkinStoreColumn() {
    const grid = document.getElementById('shop-skins');
    if (!grid) return;
    grid.innerHTML = '';

    const items = [
        ...SHOP_SECTIONS.skinPacks,
        ...SHOP_SECTIONS.realMoney.filter((item) => item.reward?.packKey && PACK_DEFINITIONS[item.reward.packKey]?.rewardType === 'skin')
    ];

    items.forEach((item) => {
        const packDef = item.reward?.packKey ? PACK_DEFINITIONS[item.reward.packKey] : null;
        const premium = !item.currency;
        const card = document.createElement('div');
        card.className = `shop-card pack-offer ${packDef ? `rarity-${packDef.rarity}` : ''}`.trim();
        card.innerHTML = getPackOfferMarkup(item, packDef, premium);
        card.querySelector('button').onclick = () => {
            if (premium) buyPremiumPack(item.id);
            else buyShopItem(item.id);
        };
        grid.appendChild(card);
    });
}

function renderCardPackStoreColumn() {
    const grid = document.getElementById('shop-gold');
    if (!grid) return;
    grid.innerHTML = '';

    const items = [
        ...SHOP_SECTIONS.goldPacks,
        ...SHOP_SECTIONS.realMoney.filter((item) => item.reward?.packKey && PACK_DEFINITIONS[item.reward.packKey] && PACK_DEFINITIONS[item.reward.packKey].rewardType !== 'skin')
    ];

    items.forEach((item) => {
        const packDef = item.reward?.packKey ? PACK_DEFINITIONS[item.reward.packKey] : null;
        const premium = !item.currency;
        const card = document.createElement('div');
        card.className = `shop-card pack-offer ${packDef ? `rarity-${packDef.rarity}` : ''}`.trim();
        card.innerHTML = getPackOfferMarkup(item, packDef, premium);
        card.querySelector('button').onclick = () => {
            if (premium) buyPremiumPack(item.id);
            else buyShopItem(item.id);
        };
        grid.appendChild(card);
    });
}

function getRarityLabel(rarity) {
    const labels = {
        blue: 'Blue',
        dark: 'Dark Blue',
        purple: 'Purple',
        red: 'Red',
        gold: 'Gold'
    };
    return labels[rarity] || rarity;
}

function getCardVisualMarkup(cardId, compact = false) {
    const variants = {
        damage_chip: 'art-blade',
        magnet_chip: 'art-orbit',
        stability_chip: 'art-scan',
        rpm_chip: 'art-barrels',
        overcharge_core: 'art-core',
        arc_battery: 'art-lightning',
        siege_loader: 'art-anvil',
        apex_emblem: 'art-crown',
        minigun_protocol: 'art-minigun',
        vortex_array: 'art-vortex',
        solar_crown: 'art-sun',
        crimson_zero: 'art-crimson'
    };
    return `
        <div class="card-visual ${variants[cardId] || 'art-core'} ${compact ? 'compact' : ''}">
            <span></span><span></span><span></span><span></span>
        </div>
    `;
}

function getPackOfferMarkup(item, packDef, premium = false) {
    const title = packDef ? packDef.name : item.name;
    const price = premium ? item.price : `${item.cost} ${item.currency.toUpperCase()}`;
    const odds = packDef ? formatPackOdds(packDef) : item.bonus;
    const badge = premium ? 'Premium' : packDef ? getRarityLabel(packDef.rarity) : item.currency.toUpperCase();
    const priceClass = premium ? '' : item.currency === 'gems' ? 'price-gems' : 'price-gold';

    return `
        <div class="pack-shell ${packDef ? `rarity-${packDef.rarity}` : ''}">
            <div class="pack-shell-art">
                <div class="pack-case ${packDef ? `rarity-${packDef.rarity}` : ''}">
                    <div class="pack-case-glow"></div>
                    <div class="pack-case-weapon weapon-${item.icon.toLowerCase()}">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="pack-top-badge">${badge}</div>
                </div>
            </div>
            <div class="pack-shell-body">
                <div class="card-title">${title}</div>
                <div class="card-copy odds-copy">${odds}</div>
                <div class="pack-shell-footer">
                    <div class="mini-price ${priceClass}">${price}</div>
                    <button class="${premium ? 'money-button' : 'inline-button'}" type="button">${packDef ? 'Get Pack' : 'Buy'}</button>
                </div>
            </div>
        </div>
    `;
}

function renderStoreColumn(id, items) {
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = '';

    items.forEach((item) => {
        const owned = (
            (item.reward.inventoryCard && save.inventory.includes(item.reward.inventoryCard)) ||
            (item.reward.neonTrail && save.premium.neonTrail)
        );
        const packDef = item.reward.packKey ? PACK_DEFINITIONS[item.reward.packKey] : null;
        const card = document.createElement('div');
        card.className = `shop-card ${packDef ? `pack-offer rarity-${packDef.rarity}` : ''}`.trim();
        card.innerHTML = packDef ? getPackOfferMarkup(item, packDef, false) : `
            <div class="card-icon">${item.icon}</div>
            <div class="card-title">${item.name}</div>
            <div class="mini-price ${item.currency === 'gems' ? 'price-gems' : 'price-gold'}">${item.cost} ${item.currency.toUpperCase()}</div>
            <div class="card-copy">${item.bonus}</div>
            <button class="inline-button" type="button" ${owned ? 'disabled' : ''}>${owned ? 'OWNED' : 'BUY'}</button>
        `;
        card.querySelector('button').onclick = () => buyShopItem(item.id);
        grid.appendChild(card);
    });
}

function renderRealMoneyColumn() {
    const grid = document.getElementById('shop-real');
    if (!grid) return;
    grid.innerHTML = '';

    SHOP_SECTIONS.realMoney.filter((item) => !item.reward?.packKey).forEach((item) => {
        const packDef = item.reward?.packKey ? PACK_DEFINITIONS[item.reward.packKey] : null;
        const card = document.createElement('div');
        card.className = `shop-card ${packDef ? `pack-offer rarity-${packDef.rarity}` : ''}`.trim();
        card.innerHTML = packDef ? getPackOfferMarkup(item, packDef, true) : `
            <div class="card-icon">${item.icon}</div>
            <div class="card-title">${item.name}</div>
            <div class="mini-price ${item.reward?.gold ? 'price-gold' : item.reward?.gems ? 'price-gems' : ''}">${item.price}</div>
            <div class="card-copy">${item.bonus}</div>
            <button class="money-button" type="button">Premium Offer</button>
        `;
        card.querySelector('button').onclick = () => {
            if (item.reward?.packKey) {
                buyPremiumPack(item.id);
                return;
            }
            if (item.reward?.extraNormalSlots || item.reward?.extraLegendarySlots || item.id === 'no_ads') {
                buyPremiumOffer(item.id);
                return;
            }
            showToast(`Placeholder for ${item.name} checkout.`);
        };
        grid.appendChild(card);
    });
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (save.inventory.length === 0 && save.packs.length === 0 && (!save.skins || save.skins.length <= 1)) {
        const empty = document.createElement('div');
        empty.className = 'shop-card';
        empty.innerHTML = `<div class="card-title">No Inventory Yet</div><div class="card-copy">Buy card packs or skin packs in the market and open them here.</div>`;
        grid.appendChild(empty);
        return;
    }

    const packCounts = save.packs.reduce((acc, packKey) => {
        acc[packKey] = (acc[packKey] || 0) + 1;
        return acc;
    }, {});
    const packEntries = Object.entries(packCounts).sort((a, b) => {
        const packA = PACK_DEFINITIONS[a[0]];
        const packB = PACK_DEFINITIONS[b[0]];
        const typeA = packA?.rewardType === 'skin' ? 1 : 0;
        const typeB = packB?.rewardType === 'skin' ? 1 : 0;
        if (typeA !== typeB) return typeA - typeB;
        const rarityOrder = { blue: 0, dark: 1, purple: 2, red: 3, gold: 4 };
        return (rarityOrder[packA?.rarity] ?? 0) - (rarityOrder[packB?.rarity] ?? 0);
    });

    if (packEntries.length) {
        grid.appendChild(createInventorySection('Stored Packs', 'Open card packs and skin packs here.'));
    }

    packEntries.forEach(([packKey, count]) => {
        const pack = PACK_DEFINITIONS[packKey];
        if (!pack) return;
        const box = document.createElement('div');
        box.className = `shop-card pack-offer rarity-${pack.rarity}`;
        box.innerHTML = `
            <div class="pack-shell rarity-${pack.rarity}">
                <div class="pack-shell-art">
                    <div class="pack-case rarity-${pack.rarity}">
                        <div class="pack-case-glow"></div>
                        <div class="pack-case-weapon weapon-box">
                            <span></span><span></span><span></span>
                        </div>
                        <div class="pack-top-badge">Stored</div>
                    </div>
                </div>
                <div class="pack-shell-body">
                    <div class="card-title">${pack.name}${count > 1 ? ` x${count}` : ''}</div>
                    <div class="card-copy odds-copy">${formatPackOdds(pack)}</div>
                    <div class="pack-shell-footer">
                        <div class="mini-price">${getRarityLabel(pack.rarity)}</div>
                        <button class="inline-button" type="button">OPEN</button>
                    </div>
                </div>
            </div>
        `;
        box.querySelector('button').onclick = () => openStoredPack(packKey);
        grid.appendChild(box);
    });

    if (save.premium?.neonTrail) {
        grid.appendChild(createInventorySection('Trail Toggle', 'Turn the premium neon trail on or off whenever you want.'));
        const trailBox = document.createElement('div');
        trailBox.className = `shop-card ${save.premium.neonTrailEnabled === false ? '' : 'rarity-purple'}`.trim();
        const enabled = save.premium.neonTrailEnabled !== false;
        trailBox.innerHTML = `
            <div class="skin-visual">
                <span class="skin-visual-aura"></span>
                <span class="skin-visual-trail"></span>
                <span class="skin-visual-ship"></span>
                <span class="skin-visual-core"></span>
            </div>
            <div class="card-title">Neon Trail</div>
            <div class="card-meta">PREMIUM VFX</div>
            <div class="card-copy">Extra trail effect behind your ship.</div>
            <button class="inline-button" type="button">${enabled ? 'DISABLE' : 'ENABLE'}</button>
        `;
        trailBox.querySelector('button').onclick = () => toggleNeonTrail();
        grid.appendChild(trailBox);
    }

    const ownedSkins = (save.skins || []).filter((skinId) => skinId !== 'stock');
    const skinEntries = ownedSkins
        .map((skinId) => [skinId, SKIN_DEFINITIONS[skinId]])
        .filter(([, skin]) => !!skin)
        .sort((a, b) => {
            const rarityOrder = { blue: 0, dark: 1, purple: 2, red: 3, gold: 4 };
            const equippedBias = a[0] === save.equippedSkin ? -1 : b[0] === save.equippedSkin ? 1 : 0;
            if (equippedBias !== 0) return equippedBias;
            const rarityDelta = (rarityOrder[a[1].rarity] ?? 0) - (rarityOrder[b[1].rarity] ?? 0);
            if (rarityDelta !== 0) return rarityDelta;
            return a[1].name.localeCompare(b[1].name);
        });

    if (skinEntries.length) {
        grid.appendChild(createInventorySection('Owned Skins', 'Equip skins to swap ship glow, trail and pulse VFX.'));
    }

    skinEntries.forEach(([skinId, skin]) => {
        const box = document.createElement('div');
        box.className = `shop-card rarity-${skin.rarity}`;
        const equipped = save.equippedSkin === skinId;
        box.innerHTML = `
            ${getSkinVisualMarkup(skinId)}
            <div class="card-title">${skin.name}</div>
            <div class="card-meta">${getRarityLabel(skin.rarity).toUpperCase()} SKIN</div>
            <div class="card-copy">${skin.sigil} | ${skin.desc}</div>
            <button class="inline-button" type="button" ${equipped ? 'disabled' : ''}>${equipped ? 'EQUIPPED' : 'EQUIP SKIN'}</button>
        `;
        box.querySelector('button').onclick = () => equipSkin(skinId);
        grid.appendChild(box);
    });

    const counts = save.inventory.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {});
    const sortedCards = Object.entries(counts).sort((a, b) => {
        const cardA = INVENTORY_CARDS[a[0]];
        const cardB = INVENTORY_CARDS[b[0]];
        const rarityOrder = { blue: 0, dark: 1, purple: 2, red: 3, gold: 4 };
        const rarityDelta = (rarityOrder[cardA?.rarity] ?? 0) - (rarityOrder[cardB?.rarity] ?? 0);
        if (rarityDelta !== 0) return rarityDelta;
        const tierDelta = (cardA?.tier ?? 0) - (cardB?.tier ?? 0);
        if (tierDelta !== 0) return tierDelta;
        return (cardA?.name || '').localeCompare(cardB?.name || '');
    });

    if (sortedCards.length) {
        grid.appendChild(createInventorySection('Cards', 'Tap cards to flip them. Sell extra copies for gold.'));
    }

    sortedCards.forEach(([cardId, count]) => {
        const card = INVENTORY_CARDS[cardId];
        if (!card) return;
        const equippedCount = getEquippedCounts()[cardId] || 0;
        const sellable = Math.max(0, count - equippedCount);
        const box = document.createElement('div');
        box.className = `shop-card rarity-${card.rarity} inventory-card`;
        box.innerHTML = `
            <div class="inventory-card-inner">
                <div class="inventory-card-face inventory-card-front">
                    ${getCardVisualMarkup(cardId)}
                    <div class="card-title">${card.name}${count > 1 ? ` x${count}` : ''}</div>
                    <div class="card-meta">${getRarityLabel(card.rarity).toUpperCase()} - Tier ${card.tier}</div>
                    <div class="card-copy">${card.sigil}</div>
                    <button class="inline-button" type="button" ${sellable <= 0 ? 'disabled' : ''}>${sellable <= 0 ? 'LOCKED IN LOADOUT' : `SELL ${getCardSellValue(cardId)} GOLD`}</button>
                </div>
                <div class="inventory-card-face inventory-card-back">
                    <div class="card-meta">CARD INFO</div>
                    <div class="card-title">${card.name}</div>
                    <div class="card-copy">${card.desc}</div>
                    <div class="card-meta">Tap again to flip back</div>
                </div>
            </div>
        `;
        box.onclick = (event) => {
            if (event.target.closest('button')) return;
            box.classList.toggle('flipped');
        };
        box.querySelector('button').onclick = (event) => {
            event.stopPropagation();
            sellInventoryCard(cardId);
        };
        grid.appendChild(box);
    });
}

window.equipSkin = function(skinId) {
    if (!save.skins.includes(skinId) || !SKIN_DEFINITIONS[skinId]) return;
    save.equippedSkin = skinId;
    saveSave();
    renderInventory();
    playSfx('upgrade', 0.9);
    showToast(`${SKIN_DEFINITIONS[skinId].name} equipped.`);
};

window.toggleNeonTrail = function() {
    if (!save.premium?.neonTrail) return;
    save.premium.neonTrailEnabled = save.premium.neonTrailEnabled === false;
    saveSave();
    renderInventory();
    playSfx('upgrade', 0.75);
    showToast(save.premium.neonTrailEnabled === false ? 'Neon Trail disabled.' : 'Neon Trail enabled.');
};

function renderLoadout() {
    const summary = document.getElementById('loadout-summary');
    const normal = document.getElementById('loadout-normal');
    const legendary = document.getElementById('loadout-legendary');
    const cardsGrid = document.getElementById('loadout-cards');
    if (!summary || !normal || !legendary || !cardsGrid) return;

    const caps = getLoadoutSlotCaps();
    const normalEquipped = save.equippedCards.filter((cardId) => !isLegendaryCard(cardId));
    const legendaryEquipped = save.equippedCards.filter((cardId) => isLegendaryCard(cardId));

    summary.innerHTML = `
        <p class="eyebrow">Slot Progression</p>
        <h2>Normal ${normalEquipped.length}/${caps.normal} | Legendary ${legendaryEquipped.length}/${caps.legendary}</h2>
        <p>Level 30 unlocks the first legendary slot. Premium purchases can extend slots to the cap.</p>
    `;

    normal.innerHTML = `<p class="eyebrow">Normal Slots</p><div class="loadout-slots">${buildSlotMarkup('normal', caps.normal, normalEquipped)}</div>`;
    legendary.innerHTML = `<p class="eyebrow">Legendary Slots</p><div class="loadout-slots">${buildSlotMarkup('legendary', caps.legendary, legendaryEquipped)}</div>`;

    cardsGrid.innerHTML = '';
    const counts = save.inventory.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {});
    const equippedCounts = getEquippedCounts();

    Object.entries(counts).forEach(([cardId, count]) => {
        const card = INVENTORY_CARDS[cardId];
        if (!card) return;
        const freeCopies = count - (equippedCounts[cardId] || 0);
        const canEquip = freeCopies > 0 && canEquipCard(cardId);
        const box = document.createElement('div');
        box.className = `shop-card rarity-${card.rarity}`;
        box.innerHTML = `
            ${getCardVisualMarkup(cardId)}
            <div class="card-title">${card.name}${count > 1 ? ` x${count}` : ''}</div>
            <div class="card-meta">${getRarityLabel(card.rarity).toUpperCase()} | Free ${Math.max(0, freeCopies)}</div>
            <div class="card-copy">${card.sigil}</div>
            <button class="inline-button" type="button" ${canEquip ? '' : 'disabled'}>${canEquip ? 'EQUIP' : 'NO SLOT'}</button>
        `;
        box.querySelector('button').onclick = () => equipCard(cardId);
        cardsGrid.appendChild(box);
    });
}

function buildSlotMarkup(type, total, equipped) {
    if (total <= 0) {
        return `<div class="loadout-slot empty locked-slot">Unlock later</div>`;
    }

    const slots = [];
    for (let i = 0; i < total; i++) {
        const cardId = equipped[i];
        if (!cardId) {
            slots.push(`<div class="loadout-slot empty">Empty</div>`);
            continue;
        }
        const card = INVENTORY_CARDS[cardId];
        slots.push(`<button class="loadout-slot rarity-${card.rarity}" type="button" onclick="unequipCard('${type}', ${i})"><strong>${card.icon}</strong><span>${card.name}</span></button>`);
    }
    return slots.join('');
}

function canEquipCard(cardId) {
    const caps = getLoadoutSlotCaps();
    const targetLegendary = isLegendaryCard(cardId);
    const equippedPool = save.equippedCards.filter((id) => targetLegendary ? isLegendaryCard(id) : !isLegendaryCard(id));
    return equippedPool.length < (targetLegendary ? caps.legendary : caps.normal);
}

window.equipCard = function(cardId) {
    const owned = save.inventory.filter((id) => id === cardId).length;
    const equipped = getEquippedCounts()[cardId] || 0;
    if (owned <= equipped || !canEquipCard(cardId)) return;
    save.equippedCards.push(cardId);
    saveSave();
    renderLoadout();
    renderInventory();
    playSfx('upgrade', 0.75);
    showToast(`${INVENTORY_CARDS[cardId].name} equipped.`);
};

window.unequipCard = function(type, index) {
    const pool = save.equippedCards
        .map((cardId, originalIndex) => ({ cardId, originalIndex }))
        .filter((entry) => type === 'legendary' ? isLegendaryCard(entry.cardId) : !isLegendaryCard(entry.cardId));
    const target = pool[index];
    if (!target) return;
    save.equippedCards.splice(target.originalIndex, 1);
    saveSave();
    renderLoadout();
    renderInventory();
    showToast(`${INVENTORY_CARDS[target.cardId].name} removed from loadout.`);
};

window.sellInventoryCard = function(cardId) {
    const inventoryIndex = save.inventory.findIndex((id) => id === cardId);
    const owned = save.inventory.filter((id) => id === cardId).length;
    const equipped = getEquippedCounts()[cardId] || 0;
    if (inventoryIndex === -1 || owned <= equipped) return;
    save.inventory.splice(inventoryIndex, 1);
    save.gold += getCardSellValue(cardId);
    saveSave();
    renderInventory();
    renderLoadout();
    updateMetaHud();
    playSfx('pickup', 0.8);
    showToast(`${INVENTORY_CARDS[cardId].name} sold.`);
};

function showToast(text) {
    const toast = document.getElementById('upgrade-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 1700);
}

window.showFight = function() {
    showScreen('fight-screen');
    setActiveNav('nav-fight');
    buildRoadmap();
    updateMetaHud();
};

window.showHub = function() {
    showScreen('hub-screen');
    setActiveNav('nav-hub');
    renderHub();
    updateMetaHud();
};

window.showShop = function() {
    showScreen('shop-screen');
    setActiveNav('nav-shop');
    renderShop();
    updateMetaHud();
};

window.showInventory = function() {
    showScreen('inventory-screen');
    setActiveNav('nav-inventory');
    renderInventory();
    updateMetaHud();
};

window.showLoadout = function() {
    showScreen('loadout-screen');
    setActiveNav('nav-loadout');
    renderLoadout();
    updateMetaHud();
};

function getPackPool(packDef, rarity) {
    if (packDef.rewardType === 'skin') {
        return Object.entries(SKIN_DEFINITIONS).filter(([, skin]) => {
            if (skin.name === 'Stock White') return false;
            if (skin.rarity !== rarity) return false;
            if (skin.exclusive && !packDef.allowExclusive) return false;
            return true;
        });
    }
    return Object.entries(INVENTORY_CARDS).filter(([, card]) => {
        if (card.rarity !== rarity) return false;
        if (card.exclusive && !packDef.allowExclusive) return false;
        return true;
    });
}

function formatPackOdds(packDef) {
    return `B ${packDef.odds.blue}% | DB ${packDef.odds.dark}% | P ${packDef.odds.purple}% | R ${packDef.odds.red}% | G ${packDef.odds.gold}%`;
}

function choosePackRarity(packDef) {
    const total = Object.values(packDef.odds).reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    for (const [rarity, chance] of Object.entries(packDef.odds)) {
        roll -= chance;
        if (roll <= 0) return rarity;
    }
    return 'blue';
}

function choosePackReward(packKey) {
    const packDef = PACK_DEFINITIONS[packKey];
    const rarity = choosePackRarity(packDef);
    const pool = getPackPool(packDef, rarity).map(([id, card]) => ({ id, card, weight: card.weight ?? 1 }));
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    if (!pool.length || total <= 0) {
        const fallback = getPackPool(packDef, 'blue').map(([id, card]) => ({ id, card, weight: card.weight ?? 1 }));
        if (!fallback.length) return packDef.rewardType === 'skin' ? 'stock' : Object.keys(INVENTORY_CARDS)[0];
        return fallback[0].id;
    }
    let roll = Math.random() * total;
    for (const entry of pool) {
        roll -= entry.weight;
        if (roll <= 0) return entry.id;
    }
    return pool[pool.length - 1].id;
}

function createPackCardMarkup(cardId) {
    const card = INVENTORY_CARDS[cardId];
    return `
        <div class="pack-card rarity-${card.rarity}">
            ${getCardVisualMarkup(cardId, true)}
            <div class="pack-tier">${getRarityLabel(card.rarity).toUpperCase()}</div>
            <div class="pack-name">${card.name}</div>
            <div class="pack-desc">${card.sigil}</div>
        </div>
    `;
}

function getSkinVisualMarkup(skinId, compact = false) {
    const skin = SKIN_DEFINITIONS[skinId] || SKIN_DEFINITIONS.stock;
    const style = skin.style;
    return `
        <div class="skin-visual ${compact ? 'compact' : ''}" style="--skin-ship:${style.ship}; --skin-core:${style.core}; --skin-trail:${style.trail}; --skin-pulse:${style.pulse};">
            <span class="skin-visual-aura"></span>
            <span class="skin-visual-trail"></span>
            <span class="skin-visual-ship"></span>
            <span class="skin-visual-core"></span>
        </div>
    `;
}

function createInventorySection(title, copy = '') {
    const box = document.createElement('div');
    box.className = 'inventory-section';
    box.innerHTML = `
        <div class="inventory-section-title">${title}</div>
        ${copy ? `<div class="inventory-section-copy">${copy}</div>` : ''}
    `;
    return box;
}

function createSkinPackMarkup(skinId) {
    const skin = SKIN_DEFINITIONS[skinId];
    return `
        <div class="pack-card rarity-${skin.rarity}">
            ${getSkinVisualMarkup(skinId, true)}
            <div class="pack-tier">${getRarityLabel(skin.rarity).toUpperCase()}</div>
            <div class="pack-name">${skin.name}</div>
            <div class="pack-desc">${skin.sigil}</div>
        </div>
    `;
}

function getPackRevealFeedback(rarity) {
    const feedback = {
        blue: { sfx: 'caseOpen', intensity: 0.9, haptic: [12, 16], shake: 0.25, pulse: 0.2, color: '#2b96ff', burst: 22 },
        dark: { sfx: 'caseOpen', intensity: 1.05, haptic: [12, 18, 16], shake: 0.35, pulse: 0.3, color: '#2452ff', burst: 28 },
        purple: { sfx: 'caseRare', intensity: 1, haptic: [14, 18, 22], shake: 0.55, pulse: 0.45, color: '#bc13fe', burst: 36 },
        red: { sfx: 'jackpot', intensity: 1.05, haptic: [18, 22, 24, 32], shake: 1.1, pulse: 0.7, color: '#ff375f', burst: 52 },
        gold: { sfx: 'jackpot', intensity: 1.28, haptic: [24, 26, 36, 44], shake: 1.45, pulse: 0.95, color: '#ffd14d', burst: 66 }
    };
    return feedback[rarity] || feedback.blue;
}

function openPackSequence(packKey) {
    const packDef = PACK_DEFINITIONS[packKey];
    const winnerId = choosePackReward(packKey);
    const rewardPool = packDef.rewardType === 'skin' ? SKIN_DEFINITIONS : INVENTORY_CARDS;
    const poolIds = Object.keys(rewardPool).filter((id) => {
        const reward = rewardPool[id];
        if (packDef.rewardType === 'skin' && id === 'stock') return false;
        if (reward.exclusive && !packDef.allowExclusive) return false;
        return true;
    });
    const reel = [];
    for (let i = 0; i < 42; i++) {
        reel.push(poolIds[Math.floor(Math.random() * poolIds.length)]);
    }
    const winnerIndex = 35;
    reel[winnerIndex] = winnerId;

    const overlay = document.getElementById('pack-overlay');
    const track = document.getElementById('pack-track');
    const result = document.getElementById('pack-result');
    const claimButton = document.getElementById('pack-claim-button');
    const subtitle = document.getElementById('pack-subtitle');
    if (!overlay || !track || !result || !claimButton || !subtitle) return;

    packOpeningState = { winnerId, packKey, claimed: false, claimReady: false };
    subtitle.textContent = `${packDef.name} | ${formatPackOdds(packDef)}`;
    result.textContent = 'Opening pack...';
    result.className = 'pack-result';
    claimButton.disabled = true;
    track.style.transform = 'translateX(0px)';
    track.innerHTML = reel.map((rewardId) => packDef.rewardType === 'skin' ? createSkinPackMarkup(rewardId) : createPackCardMarkup(rewardId)).join('');
    overlay.classList.add('active');

    window.cancelAnimationFrame(packAnimationFrame);
    const cardWidth = 122;
    const targetOffset = (winnerIndex * cardWidth) - 226;
    const duration = 8600;
    let startTime = 0;
    let lastIndex = -1;
    let lastOffset = 0;
    let lastTickTime = 0;

    const finishOpening = () => {
        const wonReward = packDef.rewardType === 'skin' ? SKIN_DEFINITIONS[winnerId] : INVENTORY_CARDS[winnerId];
        if (packDef.rewardType === 'skin') {
            if (!save.skins.includes(winnerId)) save.skins.push(winnerId);
            if (!save.equippedSkin) save.equippedSkin = winnerId;
        } else {
            save.inventory.push(winnerId);
        }
        saveSave();
        renderInventory();
        const feedback = getPackRevealFeedback(wonReward.rarity);
        packOpeningState.claimReady = true;
        result.textContent = `Unlocked: ${wonReward.name} | ${getRarityLabel(wonReward.rarity)}`;
        result.className = `pack-result rarity-${wonReward.rarity} ${(wonReward.rarity === 'red' || wonReward.rarity === 'gold') ? 'pack-jackpot' : ''}`.trim();
        playSfx(feedback.sfx, feedback.intensity);
        triggerHaptic(feedback.haptic);
        screenShake = Math.min(3.4, screenShake + feedback.shake);
        powerPulse = Math.min(2.6, powerPulse + feedback.pulse);
        addP(window.GW * 0.5, window.GH * 0.42, feedback.color, feedback.burst, 310, 0.95, 7);
        claimButton.disabled = false;
    };

    const animateReel = (timestamp) => {
        if (!startTime) {
            startTime = timestamp;
            lastTickTime = timestamp;
        }
        const t = Math.min(1, (timestamp - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 4.1);
        const offset = targetOffset * eased;
        track.style.transform = `translateX(-${offset}px)`;

        const currentIndex = Math.floor((offset + 226) / cardWidth);
        if (currentIndex > lastIndex) {
            const deltaOffset = Math.max(1, offset - lastOffset);
            const deltaTime = Math.max(1, timestamp - lastTickTime) / 1000;
            const speed = deltaOffset / deltaTime;
            const intensity = Math.max(0.55, Math.min(1.18, speed / 850));
            for (let i = lastIndex + 1; i <= currentIndex; i++) {
                playSfx('caseTick', intensity);
            }
            lastIndex = currentIndex;
            lastTickTime = timestamp;
        }

        lastOffset = offset;

        if (t < 1) {
            packAnimationFrame = window.requestAnimationFrame(animateReel);
            return;
        }

        packAnimationFrame = null;
        finishOpening();
    };

    packAnimationFrame = window.requestAnimationFrame(animateReel);
}

window.openStoredPack = function(packKey) {
    const index = save.packs.indexOf(packKey);
    if (index === -1) return;
    save.packs.splice(index, 1);
    saveSave();
    renderInventory();
    updateMetaHud();
    openPackSequence(packKey);
};

window.claimPackReward = function() {
    if (!packOpeningState || !packOpeningState.claimReady) return;
    const packDef = PACK_DEFINITIONS[packOpeningState.packKey];
    const rewardPool = packDef?.rewardType === 'skin' ? SKIN_DEFINITIONS : INVENTORY_CARDS;
    const wonCard = rewardPool[packOpeningState.winnerId];
    packOpeningState = null;
    closePackOverlay();
    renderShop();
    updateMetaHud();
    showToast(packDef?.rewardType === 'skin' ? `${wonCard.name} skin unlocked.` : `${wonCard.name} added to inventory.`);
};

window.closePackOverlay = function() {
    if (packOpeningState && !packOpeningState.claimReady) return;
    const overlay = document.getElementById('pack-overlay');
    if (overlay) overlay.classList.remove('active');
    window.clearInterval(packTickTimer);
    window.cancelAnimationFrame(packAnimationFrame);
    packTickTimer = null;
    packAnimationFrame = null;
};

window.buyUpgrade = function(id) {
    const upgrade = UPGRADES.find((entry) => entry.id === id);
    if (!upgrade) return;

    const level = save.stats[id] || 0;
    const cost = getUpgradeCost(upgrade, level);
    if (level >= upgrade.max || save.gold < cost) return;

    save.gold -= cost;
    save.stats[id] = level + 1;
    lastUpgradeId = id;
    saveSave();
    renderHub();
    updateMetaHud();
    playSfx('upgrade', 0.8);
    triggerHaptic(10);
    showToast(`${upgrade.name} upgraded.`);
};

window.buyShopItem = function(id) {
    const item = [...SHOP_SECTIONS.goldPacks, ...SHOP_SECTIONS.skinPacks, ...SHOP_SECTIONS.gemItems].find((entry) => entry.id === id);
    if (!item) return;

    const pool = item.currency === 'gems' ? save.gems : save.gold;
    if (pool < item.cost) {
        showToast(`Need more ${item.currency}.`);
        return;
    }

    if (item.currency === 'gems') save.gems -= item.cost;
    else save.gold -= item.cost;

    if (item.reward.packKey) {
        save.packs.push(item.reward.packKey);
        saveSave();
        renderInventory();
        updateMetaHud();
        showToast(`${PACK_DEFINITIONS[item.reward.packKey].name} stored in inventory.`);
        return;
    }

    if (item.reward.inventoryCard && !save.inventory.includes(item.reward.inventoryCard)) {
        save.inventory.push(item.reward.inventoryCard);
    }
    if (item.reward.rerollTokens) save.rerollTokens += item.reward.rerollTokens;
    if (item.reward.bonusAbilityXp) save.bonusAbilityXp += item.reward.bonusAbilityXp;
    if (item.reward.bossRevive) save.bossRevive += item.reward.bossRevive;
    if (item.reward.neonTrail) {
        save.premium.neonTrail = true;
        save.premium.neonTrailEnabled = true;
    }

    saveSave();
    renderShop();
    renderInventory();
    updateMetaHud();
    playSfx('upgrade', 0.7);
    triggerHaptic(12);
    showToast(`${item.name} purchased.`);
};

window.buyPremiumPack = function(id) {
    const item = SHOP_SECTIONS.realMoney.find((entry) => entry.id === id);
    if (!item || !item.reward?.packKey) return;
    save.packs.push(item.reward.packKey);
    saveSave();
    renderInventory();
    updateMetaHud();
    playSfx('upgrade', 0.9);
    showToast(`${PACK_DEFINITIONS[item.reward.packKey].name} added to inventory. Premium checkout simulated.`);
};

window.buyPremiumOffer = function(id) {
    const item = SHOP_SECTIONS.realMoney.find((entry) => entry.id === id);
    if (!item) return;

    if (item.reward?.gold) {
        save.gold += item.reward.gold;
        saveSave();
        renderShop();
        updateMetaHud();
        playSfx('upgrade', 0.9);
        showToast(`${formatCompactNumber(item.reward.gold)} gold added. Premium checkout simulated.`);
        return;
    }

    if (item.reward?.gems) {
        save.gems += item.reward.gems;
        saveSave();
        renderShop();
        updateMetaHud();
        playSfx('upgrade', 0.9);
        showToast(`${item.reward.gems} gems added. Premium checkout simulated.`);
        return;
    }

    if (item.id === 'no_ads') {
        save.premium.noAds = true;
    }

    if (item.reward?.extraNormalSlots) {
        if ((save.metaSlots.normalExtra || 0) >= 2) {
            showToast('Normal extra slot cap reached.');
            return;
        }
        save.metaSlots.normalExtra += item.reward.extraNormalSlots;
    }

    if (item.reward?.extraLegendarySlots) {
        if ((save.metaSlots.legendaryExtra || 0) >= 1) {
            showToast('Legendary extra slot cap reached.');
            return;
        }
        save.metaSlots.legendaryExtra += item.reward.extraLegendarySlots;
    }

    saveSave();
    renderLoadout();
    renderShop();
    playSfx('upgrade', 0.9);
    showToast(`${item.name} applied. Premium checkout simulated.`);
};

window.handleResultPrimary = function() {
    if (!resultPrimaryAction) return;
    hideResultOverlay();
    const action = resultPrimaryAction;
    resultPrimaryAction = null;
    resultSecondaryAction = null;
    action();
};

window.handleResultSecondary = function() {
    if (!resultSecondaryAction) return;
    hideResultOverlay();
    const action = resultSecondaryAction;
    resultPrimaryAction = null;
    resultSecondaryAction = null;
    action();
};

window.rerollAbilities = function() {
    if (!abilityPicking) return;

    if (runRerollCredits > 0) {
        runRerollCredits -= 1;
    } else if (save.rerollTokens > 0) {
        save.rerollTokens -= 1;
    } else if (save.gems >= 5) {
        save.gems -= 5;
    } else {
        showToast('Need 5 gems or one reroll token.');
        return;
    }

    saveSave();
    drawAbilityChoices();
    updateMetaHud();
};

function createPlayer() {
    const inventory = getInventoryBonuses();
    const spawn = getArenaSpawnPoint();
    const milestone = getMilestoneBonuses(currentLevel || save.unlocked);
    const earlyDamageBoost = currentLevel <= 10 ? 1.26 : currentLevel <= 20 ? 1.1 : 1;
    const damageUpgrade = getUpgradeBonus(PLAYER_STATS.dmg, save.stats.dmg);
    const fireRateUpgrade = getUpgradeBonus(PLAYER_STATS.atkSpd, save.stats.atkSpd);
    const speedUpgrade = getUpgradeBonus(PLAYER_STATS.speed, save.stats.speed);
    const baseDamage = (PLAYER_STATS.dmg.base + damageUpgrade) * Math.max(0.18, 1 + inventory.damageMultiplier + milestone.damageMultiplier) * earlyDamageBoost;
    const speed = (PLAYER_STATS.speed.base + speedUpgrade) * (1 + inventory.speedMultiplier);
    const magnet = PLAYER_STATS.magnet.base + inventory.magnetFlat + milestone.magnet;
    const atkSpeedMult = Math.max(0.35, (PLAYER_STATS.atkSpd.base + fireRateUpgrade) * (1 + inventory.attackSpeedMultiplier + milestone.fireRateMultiplier));

    runRerollCredits = milestone.runRerolls;

    return {
        x: spawn.x,
        y: spawn.y,
        r: 20,
        angle: 0,
        hp: PLAYER_STATS.hearts.base,
        maxHp: PLAYER_STATS.hearts.base,
        invulnerable: 0,
        dmg: baseDamage,
        damageMultiplier: 1,
        spd: speed,
        atkCooldown: 0.82 / atkSpeedMult,
        shootTimer: 0,
        range: PLAYER_STATS.range.base,
        multishot: 1,
        pierce: milestone.pierce,
        magnet,
        reviveUsed: false,
        bossReviveUsed: false,
        orbiters: [],
        abilityXp: save.bonusAbilityXp || 0,
        nextAbilityXp: 12,
        abilityLevel: 1,
        abilityRanks: {},
        chainLightning: false,
        tornadoShot: false,
        echoShot: false,
        ionRound: false,
        shockNova: false,
        phoenixDrive: false,
        singularity: false,
        phoenixCooldown: 0,
        singularityCounter: 0,
        shockNovaCounter: 0,
        shotCounter: 0,
        trailPoints: [],
        trailBudget: 0
    };
}

function getAbilityEvolutionText(id, rank) {
    const nextRank = rank + 1;
    switch (id) {
        case 'damage_boost': return `Rank ${nextRank}: +22% total weapon damage`;
        case 'rapid_fire': return `Rank ${nextRank}: +14% faster firing`;
        case 'multi': return `Rank ${nextRank}: +1 projectile per volley`;
        case 'pierce': return `Rank ${nextRank}: +1 extra pierce`;
        case 'chain_lightning': return `Rank ${nextRank}: ${1 + (rank * 2)} chain targets, stronger arcs`;
        case 'tornado_shot': return `Rank ${nextRank}: more tornado blades and impact`;
        case 'echo_shot': return `Rank ${nextRank}: more frequent echo volleys`;
        case 'ion_round': return `Rank ${nextRank}: heavier ion burst and chain power`;
        case 'shock_nova': return `Rank ${nextRank}: nova triggers faster and hits harder`;
        case 'heal_heart': return rank > 0 ? `Rank ${nextRank}: heal and gain a burst of power` : 'Restore one heart';
        case 'orbiter': return `Rank ${nextRank}: add another orbit drone`;
        case 'phoenix_drive': return `Rank ${nextRank}: stronger heart-loss explosion and shorter cooldown`;
        case 'singularity': return `Rank ${nextRank}: stronger pull and wider singularity field`;
        default: return '';
    }
}

function getAbilityIconMarkup(id, fallback) {
    const icons = {
        damage_boost: '<div class="ability-symbol fist"><span></span><span></span><span></span></div>',
        rapid_fire: '<div class="ability-symbol barrage"><span></span><span></span><span></span></div>',
        multi: '<div class="ability-symbol volley"><span></span><span></span><span></span></div>',
        pierce: '<div class="ability-symbol pierce"><span></span><span></span></div>',
        chain_lightning: '<div class="ability-symbol lightning"><span></span><span></span><span></span></div>',
        tornado_shot: '<div class="ability-symbol tornado"><span></span><span></span><span></span></div>',
        echo_shot: '<div class="ability-symbol echo"><span></span><span></span><span></span></div>',
        ion_round: '<div class="ability-symbol ion"><span></span><span></span></div>',
        shock_nova: '<div class="ability-symbol nova"><span></span><span></span><span></span></div>',
        heal_heart: '<div class="ability-symbol heart"><span></span></div>',
        orbiter: '<div class="ability-symbol orbit"><span></span><span></span><span></span></div>',
        phoenix_drive: '<div class="ability-symbol nova"><span></span><span></span><span></span></div>',
        singularity: '<div class="ability-symbol orbit"><span></span><span></span><span></span></div>'
    };
    return icons[id] || fallback;
}

function drawAbilityChoices() {
    const cards = document.getElementById('ability-cards');
    if (!cards) {
        abilityPicking = false;
        return;
    }

    const unlocked = getUnlockedAbilities(save.unlocked);
    cards.innerHTML = '';
    activeAbilityChoices = [...unlocked].sort(() => Math.random() - 0.5).slice(0, Math.min(3, unlocked.length));
    activeAbilityChoices.forEach((ability) => {
        const rank = getAbilityRank(ability.id);
        const card = document.createElement('div');
        card.className = 'shop-card ability-card';
        card.innerHTML = `
            <div class="card-icon ability-icon ability-${ability.id}">${getAbilityIconMarkup(ability.id, ability.icon)}</div>
            <div class="card-title">${ability.name}</div>
            <div class="card-meta">${rank > 0 ? `Owned Lv ${rank}` : `${ability.rarity.toUpperCase()} | Lv ${ability.unlockLevel || 1}`}</div>
            <div class="card-copy">${getAbilityEvolutionText(ability.id, rank)}</div>
            <button class="inline-button" type="button">${rank > 0 ? 'Evolve' : 'Select'}</button>
        `;
        card.querySelector('button').onclick = () => {
            applyAbility(ability.id);
            abilityPicking = false;
            const overlay = document.getElementById('ability-overlay');
            if (overlay) overlay.classList.remove('active');
        };
        cards.appendChild(card);
    });
    updateMetaHud();
}

function applyAbility(id) {
    player.abilityRanks[id] = (player.abilityRanks[id] || 0) + 1;
    const rank = player.abilityRanks[id];
    const ability = ABILITIES.find((entry) => entry.id === id);

    switch (id) {
        case 'damage_boost': player.damageMultiplier *= 1.22; break;
        case 'rapid_fire': player.atkCooldown *= 0.86; break;
        case 'multi': player.multishot += 1; break;
        case 'pierce': player.pierce += 1; break;
        case 'chain_lightning': player.chainLightning = true; break;
        case 'tornado_shot': player.tornadoShot = true; break;
        case 'echo_shot': player.echoShot = true; break;
        case 'ion_round': player.ionRound = true; break;
        case 'shock_nova': player.shockNova = true; break;
        case 'phoenix_drive': player.phoenixDrive = true; break;
        case 'singularity': player.singularity = true; break;
        case 'heal_heart':
            player.hp = Math.min(player.maxHp, player.hp + 1);
            if (rank > 1) {
                player.damageMultiplier *= 1.08;
                player.atkCooldown *= 0.95;
            }
            break;
        case 'orbiter':
            player.orbiters.push({
                id: nextOrbiterId++,
                angle: Math.random() * Math.PI * 2,
                distance: 50 + player.orbiters.length * 12,
                r: 7,
                damage: 18,
                x: player.x,
                y: player.y
            });
            break;
        default:
            break;
    }

    playSfx('ability', ability?.rarity === 'epic' ? 1.25 : 1);
    powerPulse = Math.min(2.2, powerPulse + (ability?.rarity === 'epic' ? 0.58 : 0.32));
    screenShake = Math.min(2.7, screenShake + (ability?.rarity === 'epic' ? 0.42 : 0.18));
    triggerHaptic(ability?.rarity === 'epic' ? [14, 18, 24] : 12);
}

function update(dt) {
    updatePlayerMovement(dt);
    updateAutoFire(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateOrbiters(dt);
    updateHazards(dt);
    updateLightningBolts(dt);
    updateFxTexts(dt);
    updateParticles(dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.phoenixCooldown = Math.max(0, (player.phoenixCooldown || 0) - dt);
    screenShake = Math.max(0, screenShake - dt * 3.2);
    powerPulse = Math.max(0, powerPulse - dt * 1.6);
    killStreakTimer = Math.max(0, killStreakTimer - dt);
    if (killStreakTimer <= 0) killStreak = 0;
    checkWaveProgress();
}

function updateAutoFire(dt) {
    player.shootTimer = Math.max(0, player.shootTimer - dt);
    const nearest = findNearestEnemy(player.range);
    if (!nearest) return;

    player.angle = Math.atan2(nearest.y - player.y, nearest.x - player.x) + Math.PI / 2;
    if (player.shootTimer > 0) return;

    player.shootTimer = player.atkCooldown;
    player.shotCounter += 1;

    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    const spreadStep = 0.14;
    const start = -spreadStep * (player.multishot - 1) / 2;

    for (let i = 0; i < player.multishot; i++) {
        addP(player.x, player.y - 12, '#00f2ff', 5, 140, 0.18, 2);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + start + (spreadStep * i),
            speed: 760,
            life: 1.1,
            radius: 5,
            damage: player.dmg * player.damageMultiplier,
            pierce: player.pierce,
            canChain: player.chainLightning,
            color: '#f5fbff'
        });
    }

    playSfx('shoot', Math.min(1.2, 0.7 + player.multishot * 0.08));

    if (player.echoShot && player.shotCounter % 4 === 0) {
        const echoRank = getAbilityRank('echo_shot');
        addP(player.x, player.y - 12, '#7be8ff', 8, 170, 0.2, 2);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle,
            speed: 860,
            life: 1.25,
            radius: 6,
            damage: player.dmg * player.damageMultiplier * (0.52 + (echoRank * 0.08)),
            pierce: player.pierce + 1,
            canChain: false,
            color: '#7be8ff'
        });
        playSfx('ability', 0.8);
    }

    if (player.ionRound && player.shotCounter % 5 === 0) {
        const ionRank = getAbilityRank('ion_round');
        addP(player.x, player.y - 12, '#ffcf4d', 10, 210, 0.2, 3);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle,
            speed: 940,
            life: 1.18,
            radius: 8,
            damage: player.dmg * player.damageMultiplier * (1.45 + (ionRank * 0.25)),
            pierce: player.pierce + 1,
            canChain: true,
            color: '#ffcf4d'
        });
        playSfx('ability', 1);
    }

    if (player.tornadoShot && player.shotCounter % 3 === 0) {
        powerPulse = Math.min(1.5, powerPulse + 0.45);
        screenShake = Math.min(1.5, screenShake + 0.22);
        spawnTornadoVolley(baseAngle, getAbilityRank('tornado_shot'));
        playSfx('tornado', 1);
    }

    if (player.singularity && player.shotCounter % 8 === 0) {
        releaseSingularity(nearest.x, nearest.y, getAbilityRank('singularity'));
    }

    screenShake = Math.min(1.5, screenShake + 0.08);
}

function releasePhoenixBurst() {
    const rank = Math.max(1, getAbilityRank('phoenix_drive'));
    addP(player.x, player.y, '#ff9d00', 54, 300, 0.58, 5);
    addP(player.x, player.y, '#ff375f', 28, 220, 0.32, 3);
    addFxText(player.x, player.y - 24, 'PHOENIX', '#ff9d00', 0.45, 22);
    powerPulse = Math.min(2.5, powerPulse + 0.6);
    screenShake = Math.min(3.2, screenShake + 0.55);
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance > 130 + rank * 18) return;
        enemy.hp -= player.dmg * player.damageMultiplier * (0.9 + rank * 0.22);
        enemy.hitFlash = 0.16;
        if (enemy.hp <= 0) triggerKill(enemy);
    });
}

function releaseSingularity(x, y, rank) {
    hazards.push({
        id: nextHazardId++,
        type: 'gravity',
        x,
        y,
        radius: 24,
        maxRadius: 110 + rank * 10,
        speed: 0,
        life: 1.5 + rank * 0.18,
        color: '#7be8ff',
        rank
    });
    addP(x, y, '#7be8ff', 24, 180, 0.36, 3);
    addFxText(x, y - 18, 'VOID', '#7be8ff', 0.36, 18);
    playSfx('ability', 0.95);
}

function updateHazards(dt) {
    hazards.forEach((hazard) => {
        hazard.life -= dt;
        if (hazard.type === 'ring') {
            hazard.radius += hazard.speed * dt;
            const distance = Math.hypot(player.x - hazard.x, player.y - hazard.y);
            if (!hazard.hit && Math.abs(distance - hazard.radius) < 14) {
                hazard.hit = true;
                damagePlayer('boss');
            }
            return;
        }

        if (hazard.type === 'gravity') {
            hazard.radius = Math.min(hazard.maxRadius, hazard.radius + dt * 80);
            enemies.forEach((enemy) => {
                if (!enemy.alive) return;
                const dx = hazard.x - enemy.x;
                const dy = hazard.y - enemy.y;
                const dist = Math.max(0.001, Math.hypot(dx, dy));
                if (dist > hazard.radius) return;
                const pull = (1 - dist / hazard.radius) * (170 + hazard.rank * 24);
                enemy.x += (dx / dist) * pull * dt;
                enemy.y += (dy / dist) * pull * dt;
                enemy.hp -= dt * player.dmg * player.damageMultiplier * (0.18 + hazard.rank * 0.04);
                enemy.hitFlash = 0.08;
                if (enemy.hp <= 0) triggerKill(enemy);
            });
        }
    });
    hazards = hazards.filter((hazard) => hazard.life > 0 && (hazard.type !== 'ring' || hazard.radius < hazard.maxRadius));
}

function damagePlayer(source) {
    if (player.invulnerable > 0) return;
    player.hp -= 1;
    player.invulnerable = 0.9;
    addP(player.x, player.y, source === 'boss' ? '#ff375f' : '#ffffff', 16, 160, 0.35, 3);
    addFxText(player.x, player.y - 20, '-1', '#ff375f', 0.48, 22);
    screenShake = Math.min(2.5, screenShake + 0.5);
    playSfx('hit', source === 'boss' ? 1.15 : 1);
    triggerHaptic(source === 'boss' ? [18, 20, 22] : 14);

    if (player.phoenixDrive && player.phoenixCooldown <= 0) {
        player.phoenixCooldown = Math.max(4, 7 - getAbilityRank('phoenix_drive'));
        releasePhoenixBurst();
    }

    if (player.hp > 0) return;

    if (source === 'boss' && !player.bossReviveUsed && save.bossRevive > 0) {
        save.bossRevive -= 1;
        player.bossReviveUsed = true;
        player.hp = 1;
        player.invulnerable = 1.2;
        saveSave();
        updateMetaHud();
        return;
    }

    if (!player.reviveUsed && save.reviveCharges > 0) {
        save.reviveCharges -= 1;
        player.reviveUsed = true;
        player.hp = 1;
        player.invulnerable = 1.2;
        saveSave();
        updateMetaHud();
        return;
    }

    gameOver();
}

window.showAbilities = function() {
    showScreen('abilities-screen');
    setActiveNav('nav-abilities');
    renderAbilityArchive();
    updateMetaHud();
};

function renderAbilityArchive() {
    const grid = document.getElementById('ability-archive-grid');
    const milestones = document.getElementById('ability-milestones');
    if (!grid || !milestones) return;

    milestones.innerHTML = LEVEL_MILESTONES.map((milestone) => `
        <div class="milestone-card ${save.unlocked >= milestone.level ? 'unlocked' : 'locked'}">
            <div class="milestone-topline">
                <span class="milestone-title">${milestone.title}</span>
                <span class="milestone-level">Lv ${milestone.level}</span>
            </div>
            <div class="milestone-copy">${milestone.statLine}. ${milestone.desc}</div>
        </div>
    `).join('');

    grid.innerHTML = '';
    ABILITIES.forEach((ability) => {
        const unlocked = (ability.unlockLevel || 1) <= save.unlocked;
        const ownedRank = save.equippedCards ? 0 : 0;
        const currentRank = player?.abilityRanks?.[ability.id] || 0;
        const card = document.createElement('div');
        card.className = `shop-card ability-card ability-archive-card ${unlocked ? '' : 'locked'}`.trim();
        card.innerHTML = `
            <div class="card-icon ability-icon ability-${ability.id}">${getAbilityIconMarkup(ability.id, ability.icon)}</div>
            <div class="card-title">${ability.name}</div>
            <div class="card-meta ${unlocked ? '' : 'locked-meta'}">${unlocked ? `${ability.rarity.toUpperCase()} | ${currentRank > 0 ? `Owned Lv ${currentRank}` : 'Unlocked'}` : `LOCKED UNTIL LV ${ability.unlockLevel}`}</div>
            <div class="card-copy">${unlocked ? ability.desc : 'Hidden until you reach the unlock level.'}</div>
            ${unlocked ? `<div class="lock-badge">${currentRank > 0 ? `LV ${currentRank}` : 'READY'}</div>` : `<div class="lock-badge">LOCKED</div>`}
        `;
        grid.appendChild(card);
    });
}

function updateMetaHud() {
    const goldNode = document.getElementById('hud-gold');
    const gemsNode = document.getElementById('hud-gems');
    const levelNode = document.getElementById('hud-level');
    const waveNode = document.getElementById('hud-wave');
    const label = document.getElementById('selected-level-label');
    const desc = document.getElementById('selected-level-desc');
    const difficulty = document.getElementById('selected-level-difficulty');
    const modePill = document.getElementById('selected-mode-pill');
    const battleButton = document.getElementById('battle-button');
    const endlessButton = document.getElementById('endless-button');
    const rerollButton = document.getElementById('ability-reroll');
    const archiveStatus = document.getElementById('ability-archive-status');
    const nextMilestone = getNextMilestone(save.unlocked);

    save.selectedLevel = save.unlocked;

    if (goldNode) goldNode.textContent = save.gold;
    if (gemsNode) gemsNode.textContent = save.gems;
    if (levelNode) levelNode.textContent = `LEVEL ${save.unlocked}`;

    if (waveNode) {
        if (gameRunning) {
            waveNode.textContent = currentMode === 'endless'
                ? `WAVE ${currentWave + 1}/INF`
                : `WAVE ${Math.min(currentWave + 1, currentLevelWaves.length)}/${currentLevelWaves.length}`;
        } else {
            waveNode.textContent = currentMode === 'endless'
                ? 'WAVES INF'
                : `WAVES ${getLevelWaves(save.unlocked).length}`;
        }
    }

    if (label) label.textContent = currentMode === 'endless' ? `Endless Lv ${save.unlocked}` : `Level ${save.unlocked}`;
    if (desc) {
        const previewDrone = formatCompactNumber(getEnemyLevelStats('drone', save.unlocked).hp);
        const waves = getLevelWaves(save.unlocked).length;
        desc.textContent = currentMode === 'endless'
            ? `Infinite waves with almost no gold payout. Starts around Level ${save.unlocked}. Drone HP: ${previewDrone}.`
            : `Level 1-10 flies by, then progression slows down. ${waves} waves. Drone HP: ${previewDrone}.${nextMilestone ? ` Next power spike: Lv ${nextMilestone.level}.` : ''}`;
    }
    if (difficulty) {
        if (currentMode === 'endless') difficulty.textContent = 'Threat Endless';
        else if (save.unlocked < 4) difficulty.textContent = 'Threat Low';
        else if (save.unlocked < 12) difficulty.textContent = 'Threat Medium';
        else difficulty.textContent = 'Threat High';
    }
    if (modePill) modePill.textContent = currentMode === 'endless' ? 'Endless' : 'Mission';
    if (battleButton) battleButton.textContent = `Fight Mission ${save.unlocked}`;
    if (endlessButton) endlessButton.textContent = currentMode === 'endless' ? 'Endless Ready' : 'Endless';
    if (rerollButton) {
        const availableRerolls = save.rerollTokens + runRerollCredits;
        rerollButton.textContent = availableRerolls > 0 ? `Reroll ${availableRerolls}` : 'Reroll 5 Gems';
    }
    if (archiveStatus) {
        archiveStatus.textContent = `${getUnlockedAbilities(save.unlocked).length}/${ABILITIES.length} unlocked${nextMilestone ? ` | next spike Lv ${nextMilestone.level}` : ''}`;
    }
}

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

window.addEventListener('load', () => {
    loadSave();
    buildRoadmap();
    showFight();
    document.addEventListener('pointerdown', ensureMusicEngine, { once: true });
    window.addEventListener('resize', resizeCanvas);
});
