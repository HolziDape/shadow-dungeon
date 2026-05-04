window.ctx = null;
window.canvas = null;
window.GW = window.innerWidth;
window.GH = window.innerHeight;

let save = {
    gold: 0,
    gems: 0,
    unlocked: 1,
    selectedLevel: 1,
    stats: { dmg: 0, atkSpd: 0, economy: 0 },
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
    daily: { streak: 0, cycleDay: 0, lastClaimKey: '' },
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
let musicNodes = null;
let musicBassGain = null;
let musicBassFreqs = null;
let musicPluckGain = null;
let musicPluckFilter = null;
let musicPluckFreqs = null;
let musicProgression = null;
let musicStep = 0;
let musicBar = 0;
let musicSchedulerInterval = null;
let packOpeningState = null;
let packTickTimer = null;
let packAnimationFrame = null;
let endlessWaveRewardGold = 0;
let arena = { width: window.innerWidth, height: window.innerHeight, top: 150 };
let camera = { x: 0, y: 0 };
let runRerollCredits = 0;
let lastHapticAt = {};

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
    return Math.max(0, Math.min(1, save.settings?.sfx ?? 0.7));
}

function triggerHaptic(pattern, options = {}) {
    if (!save.settings?.haptics) return;

    const preset = typeof options === 'string' ? options : options.preset;
    const channel = typeof options === 'object' && options.channel ? options.channel : (preset || 'default');
    const minInterval = typeof options === 'object' && options.minInterval ? options.minInterval : 0;
    const now = performance.now();
    if (minInterval && now - (lastHapticAt[channel] || 0) < minInterval) return;
    lastHapticAt[channel] = now;

    const feedback = window.Telegram?.WebApp?.HapticFeedback;
    if (feedback && preset) {
        if (preset === 'soft') feedback.impactOccurred('light');
        else if (preset === 'medium') feedback.impactOccurred('medium');
        else if (preset === 'hard') feedback.impactOccurred('heavy');
        else if (preset === 'success') feedback.notificationOccurred('success');
    }

    if (navigator.vibrate) navigator.vibrate(pattern);
}

function playHaptic(type) {
    const map = {
        soft: { pattern: 6, preset: 'soft', channel: 'soft', minInterval: 18 },
        medium: { pattern: 10, preset: 'medium', channel: 'medium', minInterval: 28 },
        hard: { pattern: [16, 18, 18], preset: 'hard', channel: 'hard', minInterval: 90 },
        success: { pattern: [12, 22, 18], preset: 'success', channel: 'success', minInterval: 100 },
        packTick: { pattern: 5, preset: 'soft', channel: 'packTick', minInterval: 40 },
        // Mobile gambling-feel patterns
        tap: { pattern: 6, preset: 'soft', channel: 'tap', minInterval: 12 },
        packRip: { pattern: [50, 30, 60, 30, 80], preset: 'hard', channel: 'rip', minInterval: 200 },
        revealCommon: { pattern: 24, preset: 'soft', channel: 'reveal', minInterval: 120 },
        revealRare: { pattern: [40, 30, 40], preset: 'medium', channel: 'reveal', minInterval: 160 },
        revealEpic: { pattern: [70, 30, 70, 30, 70], preset: 'hard', channel: 'reveal', minInterval: 220 },
        revealLegendary: { pattern: [200, 80, 200, 80, 200, 80, 320], preset: 'success', channel: 'reveal', minInterval: 400 },
        peek: { pattern: 12, preset: 'soft', channel: 'peek', minInterval: 80 }
    };
    const entry = map[type];
    if (!entry) return;
    triggerHaptic(entry.pattern, entry);
}

function getTodayKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

function getYesterdayKey(date = new Date()) {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() - 1);
    return getTodayKey(copy);
}

function applyDailyReward(reward) {
    if (!reward) return;
    if (reward.gold) save.gold += reward.gold;
    if (reward.gems) save.gems += reward.gems;
    if (reward.packKey) save.packs.push(reward.packKey);
}

function getUpgradeDefinition(id) {
    return UPGRADES.find((entry) => entry.id === id);
}

function hasAffordableUpgrade() {
    return UPGRADES.some((upgrade) => {
        const level = save.stats[upgrade.id] || 0;
        const cost = getUpgradeCost(upgrade, level);
        return cost !== null && save.gold >= cost;
    });
}

function updateUpgradeNotifier() {
    const dot = document.getElementById('upgrade-nav-dot');
    if (!dot) return;
    const show = hasAffordableUpgrade();
    dot.classList.toggle('visible', show);
}

function getEconomyMultiplier() {
    return 1 + getUpgradeBonus(PLAYER_STATS.economy, save.stats.economy, 'economy');
}

function getUpgradeCardMeta(upgrade, level) {
    const tier = getUpgradeTierInfo(upgrade, level);
    return {
        tier,
        phaseLabel: tier.isMajor ? 'Core Boost' : `Step ${Math.min(tier.step, tier.cycleSize)}/${tier.cycleSize}`,
        surgeLabel: `Surge ${tier.surge}`,
        buttonLabel: tier.isMajor ? 'BIG UPGRADE' : 'UPGRADE'
    };
}

function renderDailyLoginPanel() {
    const title = document.getElementById('daily-login-title');
    const streak = document.getElementById('daily-login-streak');
    const copy = document.getElementById('daily-login-copy');
    const grid = document.getElementById('daily-login-grid');
    if (!title || !streak || !copy || !grid) return;

    const cycleDay = Math.max(1, save.daily?.cycleDay || 1);
    const claimedToday = save.daily?.lastClaimKey === getTodayKey();
    title.textContent = claimedToday ? `Tag ${cycleDay} abgeholt` : `Tag ${cycleDay} bereit`;
    streak.textContent = `Streak ${save.daily?.streak || 0}`;
    copy.textContent = claimedToday
        ? 'Heute ist eingesammelt. Die naechsten Tage sind schon sichtbar.'
        : 'Heute kannst du den aktuellen Reward holen. Bereits eingesammelte Tage bleiben markiert.';

    grid.innerHTML = DAILY_LOGIN_REWARDS.map((reward, index) => {
        const day = index + 1;
        const status = day < cycleDay ? 'claimed' : day === cycleDay ? (claimedToday ? 'claimed today' : 'today') : 'upcoming';
        const statusText = day < cycleDay ? 'Done' : day === cycleDay ? (claimedToday ? 'Heute' : 'Jetzt') : 'Spaeter';
        return `
            <div class="daily-card ${status}">
                <div class="daily-day">Tag ${day}</div>
                <div class="daily-reward">${reward.label}</div>
                <div class="daily-status">${statusText}</div>
            </div>
        `;
    }).join('');
}

function ensureMusicEngine() {
    if (musicNodesStarted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    // master music bus
    musicGain = audioContext.createGain();
    musicGain.gain.value = 0;

    // gentle compressor on the bus to glue layers
    const comp = audioContext.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 28;
    comp.ratio.value = 6;
    comp.attack.value = 0.04;
    comp.release.value = 0.18;
    comp.connect(musicGain);
    musicGain.connect(audioContext.destination);

    // ── PAD layer (lush triangle stack with slow filter sweep) ───
    const padFilter = audioContext.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 720;
    padFilter.Q.value = 1.4;
    const padGain = audioContext.createGain();
    padGain.gain.value = 0.55;
    padFilter.connect(padGain);
    padGain.connect(comp);

    // chord: A minor 9 (A2, E3, A3, C4, E4) — moody, future-bass-friendly
    const padVoices = [
        { freq: 110.00, type: 'triangle', gain: 0.18 },  // A2
        { freq: 164.81, type: 'sine',     gain: 0.12 },  // E3
        { freq: 220.00, type: 'triangle', gain: 0.10 },  // A3
        { freq: 261.63, type: 'sine',     gain: 0.07 },  // C4
        { freq: 329.63, type: 'sine',     gain: 0.06 }   // E4
    ];
    musicNodes = musicNodes || [];
    padVoices.forEach((v) => {
        const osc = audioContext.createOscillator();
        const g = audioContext.createGain();
        osc.type = v.type;
        osc.frequency.value = v.freq;
        // gentle detune so it breathes
        osc.detune.value = (Math.random() - 0.5) * 6;
        g.gain.value = v.gain;
        osc.connect(g); g.connect(padFilter);
        osc.start();
        musicNodes.push(osc);
    });

    // slow filter LFO on the pad (pulse)
    const padLfo = audioContext.createOscillator();
    const padLfoGain = audioContext.createGain();
    padLfo.type = 'sine';
    padLfo.frequency.value = 0.14;
    padLfoGain.gain.value = 320;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start();

    // ── BASS layer (deep sine with rhythm) ──────────────────────
    const bassGain = audioContext.createGain();
    bassGain.gain.value = 0.32;
    bassGain.connect(comp);
    musicBassGain = bassGain;

    // ── PLUCK arpeggio (light, 8th notes) ───────────────────────
    const pluckGain = audioContext.createGain();
    pluckGain.gain.value = 0.20;
    const pluckFilter = audioContext.createBiquadFilter();
    pluckFilter.type = 'lowpass';
    pluckFilter.frequency.value = 2400;
    pluckGain.connect(comp);
    musicPluckGain = pluckGain;
    musicPluckFilter = pluckFilter;

    // Chord progression Am → F → C → G (vi-IV-I-V) — the classic uplifting loop
    // 4 bars × 32 sixteenths = 128 step loop
    musicProgression = [
        // Am (root A2=55, 5th E3=82.4, 7th G3=98)
        { bassRoots: [55, 55, 41.2, 55], plucks: [220.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63] },
        // F  (root F2=43.65, 3rd A2, 5th C3)
        { bassRoots: [43.65, 43.65, 32.7, 43.65], plucks: [174.61, 220.00, 261.63, 349.23, 440.00, 349.23, 261.63, 220.00] },
        // C  (root C2=32.7, 3rd E2, 5th G2)
        { bassRoots: [32.7, 32.7, 49.0, 32.7], plucks: [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63] },
        // G  (root G2=49.0, 3rd B2, 5th D3)
        { bassRoots: [49.0, 49.0, 36.7, 49.0], plucks: [196.00, 246.94, 293.66, 392.00, 493.88, 392.00, 293.66, 246.94] }
    ];

    // ── Tempo clock (88 BPM = chiller) ──────────────────────────
    const bpm = 88;
    const sixteenth = 60 / bpm / 4;
    musicStep = 0;
    musicBar = 0;
    musicSchedulerInterval = window.setInterval(() => {
        if (!audioContext) return;
        const now = audioContext.currentTime;
        for (let i = 0; i < 8; i++) {
            const stepTime = now + i * sixteenth;
            const step = (musicStep + i) % 16;
            const bar = (musicBar + Math.floor((musicStep + i) / 16)) % 4;
            scheduleBeat(step, stepTime, sixteenth, bar);
        }
        const advance = musicStep + 8;
        musicBar = (musicBar + Math.floor(advance / 16)) % 4;
        musicStep = advance % 16;
    }, sixteenth * 8 * 1000 * 0.9);

    musicNodesStarted = true;
    syncMusicVolume();
}

function scheduleBeat(step, when, dur, bar = 0) {
    if (!audioContext) return;
    const chord = musicProgression && musicProgression[bar];
    if (!chord) return;

    // Bass plays on each quarter beat (4 per bar). Pattern: root, root, octave-down, root.
    if (step % 4 === 0) {
        const idx = (step / 4) % chord.bassRoots.length;
        const freq = chord.bassRoots[idx];
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        const o2 = audioContext.createOscillator();
        o2.type = 'triangle';
        o2.frequency.value = freq * 0.5;
        const g2 = audioContext.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.5, when + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur * 3.6);
        g2.gain.setValueAtTime(0.0001, when);
        g2.gain.exponentialRampToValueAtTime(0.22, when + 0.022);
        g2.gain.exponentialRampToValueAtTime(0.0001, when + dur * 3.8);
        o.connect(g); o2.connect(g2);
        g.connect(musicBassGain); g2.connect(musicBassGain);
        o.start(when); o2.start(when);
        o.stop(when + dur * 4); o2.stop(when + dur * 4);

        // Soft kick on beat 1 of each bar
        if (step === 0) {
            const noise = createNoiseSource(audioContext, dur);
            if (noise) {
                const f = audioContext.createBiquadFilter();
                f.type = 'lowpass'; f.frequency.value = 180;
                const kg = audioContext.createGain();
                kg.gain.setValueAtTime(0.0001, when);
                kg.gain.exponentialRampToValueAtTime(0.18, when + 0.005);
                kg.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
                noise.connect(f); f.connect(kg); kg.connect(musicBassGain);
            }
        }
    }

    // Pluck arpeggio on every 8th note, follows the current chord's pluck pattern
    if (step % 2 === 0) {
        const idx = (step / 2) % chord.plucks.length;
        const freq = chord.plucks[idx];
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        // detune slightly between bars for organic feel
        o.detune.value = (bar % 2 ? 4 : -3);
        const accent = (step === 0 || step === 8) ? 1.5 : (step === 4 ? 1.2 : 0.85);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.30 * accent, when + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur * 2.4);
        o.connect(g); g.connect(musicPluckFilter);
        musicPluckFilter.connect(musicPluckGain);
        o.start(when); o.stop(when + dur * 2.6);
    }

    // Hi-hat tick on the off-beats (steps 2, 6, 10, 14)
    if (step % 4 === 2) {
        const noise = createNoiseSource(audioContext, dur * 1.5);
        if (!noise) return;
        const f = audioContext.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 6800;
        const g = audioContext.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.07, when + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
        noise.connect(f); f.connect(g); g.connect(musicBassGain);
    }

    // Snare-ish noise hit on step 8 (backbeat)
    if (step === 8) {
        const noise = createNoiseSource(audioContext, dur * 2);
        if (!noise) return;
        const f = audioContext.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
        const g = audioContext.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.10, when + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.10);
        noise.connect(f); f.connect(g); g.connect(musicBassGain);
    }
}

function syncMusicVolume() {
    if (!musicGain) return;
    const target = Math.max(0, Math.min(1, save.settings?.music ?? 0.35)) * 0.18;
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
    } else if (kind === 'packRipLow') {
        // tearing low end thump
        startFreq = 240;
        endFreq = 70;
        duration = 0.32;
        type = 'sawtooth';
        cutoff = 700;
        peak = 0.08;
    } else if (kind === 'packRipHi') {
        // sharp paper tear
        startFreq = 3400;
        endFreq = 1900;
        duration = 0.18;
        type = 'sawtooth';
        cutoff = 4800;
        peak = 0.045;
    } else if (kind === 'packReveal') {
        // whoosh that lifts the curtain
        startFreq = 240;
        endFreq = 1480;
        duration = 0.32;
        type = 'triangle';
        cutoff = 2400;
        peak = 0.05;
    } else if (kind === 'revealCommon') {
        startFreq = 500;
        endFreq = 720;
        duration = 0.18;
        type = 'sine';
        cutoff = 1800;
        peak = 0.035;
    } else if (kind === 'revealRare') {
        startFreq = 700;
        endFreq = 1280;
        duration = 0.34;
        type = 'triangle';
        cutoff = 2600;
        peak = 0.05;
    } else if (kind === 'revealEpic') {
        startFreq = 600;
        endFreq = 1820;
        duration = 0.55;
        type = 'sawtooth';
        cutoff = 3000;
        peak = 0.06;
    } else if (kind === 'revealLegendary') {
        startFreq = 880;
        endFreq = 2640;
        duration = 0.78;
        type = 'sine';
        cutoff = 3400;
        peak = 0.085;
    } else if (kind === 'coinClink') {
        startFreq = 1860;
        endFreq = 2300;
        duration = 0.06;
        type = 'square';
        cutoff = 4600;
        peak = 0.03;
    } else if (kind === 'tap') {
        startFreq = 880;
        endFreq = 540;
        duration = 0.04;
        type = 'sine';
        cutoff = 2400;
        peak = 0.024;
    } else if (kind === 'tapAccent') {
        startFreq = 660;
        endFreq = 1240;
        duration = 0.08;
        type = 'triangle';
        cutoff = 2600;
        peak = 0.034;
    } else if (kind === 'peekOpen') {
        startFreq = 320;
        endFreq = 880;
        duration = 0.22;
        type = 'triangle';
        cutoff = 2200;
        peak = 0.04;
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

// Layered "rip the pack open" sound — low body + paper tear + sparkle tail
function playPackRip() {
    playSfx('packRipLow', 1.0);
    setTimeout(() => playSfx('packRipHi', 0.95), 30);
    setTimeout(() => playSfx('packReveal', 0.85), 240);
}

// Casino-style build-up: rising sweep + filter open over `seconds`
function playBuildUp(seconds = 2.4) {
    if (!audioContext) {
        ensureMusicEngine();
        if (!audioContext) return null;
    }
    const volume = getSfxVolume();
    if (volume <= 0.01) return null;
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const sub = audioContext.createOscillator();
    const noise = createNoiseSource(audioContext, seconds + 0.4);
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + seconds);
    filter.Q.value = 6;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + seconds);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(220, now + seconds);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06 * volume, now + seconds * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds + 0.18);

    osc.connect(filter);
    sub.connect(filter);
    if (noise) noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    sub.start(now);
    osc.stop(now + seconds + 0.25);
    sub.stop(now + seconds + 0.25);

    return { osc, sub, noise, gain, filter, ends: now + seconds + 0.3 };
}

// Brief noise generator helper (white noise burst)
function createNoiseSource(ctx, seconds) {
    try {
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.start();
        return src;
    } catch (e) { return null; }
}

// Fanfare burst on jackpot — three layered tones with detune
function playJackpotFanfare() {
    if (!audioContext) {
        ensureMusicEngine();
        if (!audioContext) return;
    }
    const volume = getSfxVolume();
    if (volume <= 0.01) return;
    const base = audioContext.currentTime;
    const notes = [880, 1320, 1760, 2640];
    notes.forEach((freq, i) => {
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        const f = audioContext.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 4200;
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(freq, base + i * 0.09);
        g.gain.setValueAtTime(0.0001, base + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.075 * volume, base + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, base + i * 0.09 + 0.55);
        o.connect(f); f.connect(g); g.connect(audioContext.destination);
        o.start(base + i * 0.09);
        o.stop(base + i * 0.09 + 0.6);
    });
    // shimmer tail
    setTimeout(() => playSfx('revealLegendary', 1.1), 280);
}

// 1-HP danger flair driver. Pulses strong red when entering danger,
// keeps a faint pulse while at 1 HP, fades out when HP recovers or run ends.
let _hpDangerActive = false;
let _hpDangerPulseTimer = null;
function syncHpDangerFlair() {
    const inDanger = !!(gameRunning && player && player.alive !== false && player.hp === 1);
    if (inDanger && !_hpDangerActive) {
        _hpDangerActive = true;
        document.body.classList.add('danger-hp', 'danger-pulse');
        if (_hpDangerPulseTimer) clearTimeout(_hpDangerPulseTimer);
        // Pulse class is one-shot; remove after the burst so dangerBreath takes over alone
        _hpDangerPulseTimer = setTimeout(() => {
            document.body.classList.remove('danger-pulse');
            _hpDangerPulseTimer = null;
        }, 900);
    } else if (!inDanger && _hpDangerActive) {
        _hpDangerActive = false;
        document.body.classList.remove('danger-hp', 'danger-pulse');
        if (_hpDangerPulseTimer) { clearTimeout(_hpDangerPulseTimer); _hpDangerPulseTimer = null; }
    }
}
function clearHpDangerFlair() {
    _hpDangerActive = false;
    document.body.classList.remove('danger-hp', 'danger-pulse');
    if (_hpDangerPulseTimer) { clearTimeout(_hpDangerPulseTimer); _hpDangerPulseTimer = null; }
}

// Confetti DOM rays burst from center of #pack-confetti
function spawnPackConfetti(color = '#ffd14d', count = 30) {
    const host = document.getElementById('pack-confetti');
    if (!host) return;
    host.innerHTML = '';
    const palette = [color, '#ffffff', '#ffe698', color];
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
    playHaptic('medium');
    startLevel();
};

window.startEndlessMode = function() {
    currentMode = 'endless';
    // Endless ALWAYS starts at level 1 difficulty regardless of player progression.
    // Difficulty scales solely by elapsed waves inside spawnEndlessWave.
    currentLevel = 1;
    currentLevelWaves = [];
    playHaptic('medium');
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
    const migratedEconomy = save.stats?.economy ?? save.stats?.speed ?? 0;
    save.stats = Object.assign({ dmg: 0, atkSpd: 0, economy: migratedEconomy }, save.stats || {});
    save.premium = Object.assign({ noAds: false, neonTrail: false, neonTrailEnabled: true }, save.premium || {});
    save.inventory = Array.isArray(save.inventory) ? save.inventory : [];
    save.packs = Array.isArray(save.packs) ? save.packs : [];
    save.skins = Array.isArray(save.skins) && save.skins.length ? save.skins : ['stock'];
    save.equippedSkin = SKIN_DEFINITIONS[save.equippedSkin] ? save.equippedSkin : (save.skins[0] || 'stock');
    save.equippedCards = Array.isArray(save.equippedCards) ? save.equippedCards : [];
    save.metaSlots = Object.assign({ normalExtra: 0, legendaryExtra: 0 }, save.metaSlots || {});
    save.daily = Object.assign({ streak: 0, cycleDay: 0, lastClaimKey: '' }, save.daily || {});
    save.settings = Object.assign({ sfx: 0.7, music: 0.35, haptics: false }, save.settings || {});
    // Permanent micro-boosts trickled in from pack drops (small but persistent)
    save.permanentBoosts = Object.assign({ damageMultiplier: 0, attackSpeedMultiplier: 0, magnetFlat: 0, packsOpened: 0 }, save.permanentBoosts || {});
    save.abilityRanks = Object.assign({}, save.abilityRanks || {});
    save.leaderboardSeed = save.leaderboardSeed || (Math.floor(Math.random() * 99999) + 1);
    if (typeof save.settings.sfx !== 'number' && typeof save.settings.vfx === 'number') {
        save.settings.sfx = save.settings.vfx;
    }

    grantDailyLoginBonus();
    updateMetaHud();
    syncSettingsUi();
}

function grantDailyLoginBonus() {
    const now = new Date();
    const todayKey = getTodayKey(now);
    const yesterdayKey = getYesterdayKey(now);
    save.daily = Object.assign({ streak: 0, cycleDay: 0, lastClaimKey: '' }, save.daily || {});

    if (save.daily.lastClaimKey !== todayKey) {
        const continued = save.daily.lastClaimKey === yesterdayKey;
        save.daily.streak = continued ? (save.daily.streak || 0) + 1 : 1;
        save.daily.cycleDay = continued ? ((save.daily.cycleDay || 0) % DAILY_LOGIN_REWARDS.length) + 1 : 1;
        save.daily.lastClaimKey = todayKey;
        save.lastLogin = todayKey;
        applyDailyReward(DAILY_LOGIN_REWARDS[(save.daily.cycleDay || 1) - 1]);
        saveSave();
        showToast(`Daily login: ${DAILY_LOGIN_REWARDS[(save.daily.cycleDay || 1) - 1].label}`);
        playHaptic('success');
    }

    renderDailyLoginPanel();
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

    if (sfxSlider) sfxSlider.value = Math.round((save.settings?.sfx ?? 0.7) * 100);
    if (sfxValue) sfxValue.textContent = `${Math.round((save.settings?.sfx ?? 0.7) * 100)}%`;
    if (musicSlider) musicSlider.value = Math.round((save.settings?.music ?? 0.35) * 100);
    if (musicValue) musicValue.textContent = `${Math.round((save.settings?.music ?? 0.35) * 100)}%`;
    if (hapticsToggle) hapticsToggle.checked = !!save.settings?.haptics;
}

function getInventoryBonuses() {
    const bonuses = save.equippedCards.reduce((acc, cardId) => {
        const card = INVENTORY_CARDS[cardId];
        if (!card) return acc;
        acc.damageMultiplier += card.effect.damageMultiplier || 0;
        acc.speedMultiplier += card.effect.speedMultiplier || 0;
        acc.attackSpeedMultiplier += card.effect.attackSpeedMultiplier || 0;
        acc.magnetFlat += card.effect.magnetFlat || 0;
        return acc;
    }, { damageMultiplier: 0, speedMultiplier: 0, attackSpeedMultiplier: 0, magnetFlat: 0 });
    // Permanent trickle from pack drops (tiny but stacks; capped soft via diminishing returns later)
    const p = save.permanentBoosts || {};
    bonuses.damageMultiplier      += p.damageMultiplier      || 0;
    bonuses.attackSpeedMultiplier += p.attackSpeedMultiplier || 0;
    bonuses.magnetFlat            += p.magnetFlat            || 0;
    return bonuses;
}

// Tiny permanent trickle when a pack drop is collected. Higher rarity = more.
function trickleBoostFromReward(rewardRarity) {
    save.permanentBoosts = save.permanentBoosts || { damageMultiplier: 0, attackSpeedMultiplier: 0, magnetFlat: 0, packsOpened: 0 };
    const trickle = {
        blue:   { damageMultiplier: 0.003, attackSpeedMultiplier: 0.002, magnetFlat: 0.4 },
        dark:   { damageMultiplier: 0.006, attackSpeedMultiplier: 0.004, magnetFlat: 0.8 },
        purple: { damageMultiplier: 0.012, attackSpeedMultiplier: 0.008, magnetFlat: 1.4 },
        red:    { damageMultiplier: 0.022, attackSpeedMultiplier: 0.014, magnetFlat: 2.4 },
        gold:   { damageMultiplier: 0.040, attackSpeedMultiplier: 0.025, magnetFlat: 4.0 }
    };
    const t = trickle[rewardRarity] || trickle.blue;
    save.permanentBoosts.damageMultiplier      += t.damageMultiplier;
    save.permanentBoosts.attackSpeedMultiplier += t.attackSpeedMultiplier;
    save.permanentBoosts.magnetFlat            += t.magnetFlat;
    save.permanentBoosts.packsOpened          = (save.permanentBoosts.packsOpened || 0) + 1;
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

function getUpgradeBonus(statConfig, level, upgradeId) {
    if (!level || level <= 0 || !statConfig?.progression) {
        return 0;
    }

    const upgrade = getUpgradeDefinition(upgradeId);
    if (!upgrade) return 0;

    let total = 0;
    for (let i = 0; i < level; i++) {
        const tier = getUpgradeTierInfo(upgrade, i);
        if (tier.isMajor) {
            total += statConfig.progression.majorBase * Math.pow(statConfig.progression.majorGrowth, tier.blockIndex);
        } else {
            const localProgress = Math.max(0, tier.step - 1);
            total += statConfig.progression.minorBase * Math.pow(statConfig.progression.minorGrowth, tier.blockIndex + (localProgress * 0.22));
        }
    }
    return total;
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

    if (label) label.textContent = currentMode === 'endless' ? `Endless · Wave ${currentWave + 1}` : `Level ${save.unlocked}`;
    if (desc) {
        const previewDrone = formatCompactNumber(getEnemyLevelStats('drone', save.unlocked).hp);
        const waves = getLevelWaves(save.unlocked).length;
        desc.textContent = currentMode === 'endless'
            ? `Infinite waves. Always starts at Level 1 — difficulty climbs with every wave you survive.`
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
    // Support both legacy .nav-btn and new .nav-tab
    document.querySelectorAll('.nav-btn, .nav-tab').forEach((button) => button.classList.remove('active'));
    const button = document.getElementById(id);
    if (button) button.classList.add('active');
}

// ─────────────────────── SWIPE NAVIGATION ──────────────────
// Swipe horizontally on the active screen to switch to neighbouring tab.
const NAV_ORDER = [
    { id: 'nav-shop',      open: () => window.showShop && window.showShop() },
    { id: 'nav-loadout',   open: () => window.showLoadout && window.showLoadout() },
    { id: 'nav-fight',     open: () => window.showFight && window.showFight() },
    { id: 'nav-hub',       open: () => window.showHub && window.showHub() },
    { id: 'nav-inventory', open: () => window.showInventory && window.showInventory() }
];
function getCurrentNavIndex() {
    const active = document.querySelector('.nav-tab.active, .nav-btn.active');
    if (!active) return 2;
    return Math.max(0, NAV_ORDER.findIndex((n) => n.id === active.id));
}
function navigateRelative(delta, opts = {}) {
    if (gameRunning) return;
    const cur = getCurrentNavIndex();
    const next = cur + delta;
    if (next < 0 || next >= NAV_ORDER.length) return;
    // Animate slide-out current, then load next + slide-in
    const oldScreen = document.querySelector('.screen.active');
    const dir = delta > 0 ? 1 : -1;
    if (oldScreen && !opts.skipAnim) {
        oldScreen.classList.remove('screen-slide-in-l', 'screen-slide-in-r');
        oldScreen.classList.add(dir > 0 ? 'screen-slide-out-l' : 'screen-slide-out-r');
        setTimeout(() => {
            NAV_ORDER[next].open();
            const newScreen = document.querySelector('.screen.active');
            if (newScreen) {
                newScreen.classList.remove('screen-slide-out-l', 'screen-slide-out-r');
                newScreen.classList.add(dir > 0 ? 'screen-slide-in-r' : 'screen-slide-in-l');
                setTimeout(() => newScreen.classList.remove('screen-slide-in-r', 'screen-slide-in-l'), 320);
            }
        }, 180);
    } else {
        NAV_ORDER[next].open();
    }
    if (typeof playHaptic === 'function') playHaptic('tap');
}

function installSwipeNavigation() {
    let startX = 0, startY = 0, startT = 0, tracking = false;
    let committed = false; // once horizontal direction is locked we commit
    const root = document.body;

    function down(e) {
        if (gameRunning) return;
        const overlayOpen = !!document.querySelector('.modal-overlay.active');
        if (overlayOpen) return;
        if (e.target.closest('#global-nav, .left-rail, .right-rail, button, input, select, textarea, .pack-card-v2, .ability-pick-content')) return;
        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX;
        startY = t.clientY;
        startT = performance.now();
        tracking = true;
        committed = false;
    }
    function move(e) {
        // Once we know it's a horizontal swipe, prevent the page from cancelling
        // (vertical scroll no longer eats horizontal). We don't preventDefault on
        // touchmove (passive listener) but we set a flag so the up handler still
        // dispatches navigation even after long vertical motion.
        if (!tracking || committed) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);
        if (dx > 16 && dx > dy * 1.2) committed = true;
    }
    function up(e) {
        if (!tracking) return;
        tracking = false;
        const t = (e.changedTouches && e.changedTouches[0]) || e;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const dt = performance.now() - startT;
        const horiz = Math.abs(dx);
        const vert = Math.abs(dy);
        // Commit-flag relaxes the cancel: if we ever crossed the horizontal lock,
        // we navigate even if the user wandered vertically afterwards.
        if (committed) {
            if (horiz < 60) return;
        } else {
            if (horiz < 80) return;
            if (horiz < vert * 1.2) return;
        }
        if (dt > 1200) return;
        navigateRelative(dx < 0 ? 1 : -1);
    }
    root.addEventListener('touchstart', down, { passive: true });
    root.addEventListener('touchmove',  move, { passive: true });
    root.addEventListener('touchend',   up,   { passive: true });
    root.addEventListener('touchcancel', up,  { passive: true });
    root.addEventListener('mousedown', down);
    root.addEventListener('mousemove', move);
    root.addEventListener('mouseup', up);
}

window.openSettings = function() {
    ensureMusicEngine();
    syncSettingsUi();
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.add('active');
    playHaptic('soft');
};

window.closeSettings = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.remove('active');
    playHaptic('soft');
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
    if (enabled) playHaptic('medium');
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (window.canvas) {
        window.canvas.style.display = id === 'game-canvas' ? 'block' : 'none';
    }
    // New side rails + cta + cosmic bg only visible on the fight screen
    const onFight = id === 'fight-screen';
    const showOnFight = ['left-rail', 'right-rail', 'primary-cta', 'cosmic-bg', 'level-roadmap'];
    showOnFight.forEach((cls) => {
        document.querySelectorAll('.' + cls + ', #' + cls).forEach((el) => {
            el.style.display = onFight ? '' : 'none';
        });
    });
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
    const earlyDamageBoost = save.unlocked <= 10 ? 1.12 : save.unlocked <= 20 ? 1.04 : 1;
    const damageUpgrade = getUpgradeBonus(PLAYER_STATS.dmg, save.stats.dmg, 'dmg');
    const fireRateUpgrade = getUpgradeBonus(PLAYER_STATS.atkSpd, save.stats.atkSpd, 'atkSpd');
    const baseDamage = (PLAYER_STATS.dmg.base + damageUpgrade) * Math.max(0.18, 1 + inventory.damageMultiplier) * earlyDamageBoost;
    const speed = PLAYER_STATS.speed.base * (1 + inventory.speedMultiplier);
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
    clearHpDangerFlair();
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
    // Endless difficulty depends ONLY on the elapsed waves, not on save.unlocked.
    // wave 0 = lvl 1, then climbs ~1 level every 2 waves with a soft cap floor early on
    const scaledLevel = Math.max(1, 1 + Math.floor(index / 2));
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
    const economy = getEconomyMultiplier();
    const killGoldBase = currentMode === 'endless' ? (enemy.isBoss ? 2 : 0) : (enemy.isBoss ? 10 : 1);
    const killGold = Math.max(0, Math.round(killGoldBase * economy));
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
    if (enemy.isBoss) playHaptic('hard');
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
    playHaptic('medium');

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
    const svgs = {
        damage_boost: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18 L13 5 L18 18"/><line x1="9.5" y1="14" x2="16.5" y2="14"/><line x1="13" y1="5" x2="13" y2="2"/><polyline points="10.5,4 13,2 15.5,4"/></svg>`,
        rapid_fire: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="4" y1="18" x2="20" y2="18"/><polyline points="17,5.5 21,8 17,10.5" stroke-linejoin="round"/><polyline points="17,10.5 21,13 17,15.5" stroke-linejoin="round"/><polyline points="17,15.5 21,18 17,20.5" stroke-linejoin="round"/></svg>`,
        multi: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="21" x2="13" y2="6"/><line x1="7" y1="21" x2="9" y2="6"/><line x1="19" y1="21" x2="17" y2="6"/><polyline points="11,8 13,6 15,8"/><polyline points="5.5,8.5 7.5,6.5 9.5,8.5"/><polyline points="16.5,8.5 18.5,6.5 20.5,8.5"/></svg>`,
        pierce: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="3" y1="13" x2="23" y2="13"/><polyline points="18,9 23,13 18,17" stroke-linejoin="round"/><circle cx="8" cy="13" r="2.5"/><circle cx="15" cy="13" r="2.5"/></svg>`,
        chain_lightning: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,2 9,13 13.5,13 10,24"/><line x1="4" y1="7" x2="8.5" y2="11.5" stroke-width="1.2" stroke-dasharray="2 2"/><line x1="22" y1="7" x2="17.5" y2="11.5" stroke-width="1.2" stroke-dasharray="2 2"/><line x1="4" y1="19" x2="9.5" y2="16.5" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="4" cy="7" r="1.8" fill="currentColor" stroke="none"/><circle cx="22" cy="7" r="1.8" fill="currentColor" stroke="none"/><circle cx="4" cy="19" r="1.8" fill="currentColor" stroke="none"/></svg>`,
        tornado_shot: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4,7 Q13,3.5 22,7" stroke-width="1.8"/><path d="M6.5,12 Q13,9.5 19.5,12" stroke-width="1.6"/><path d="M9,17 Q13,15 17,17" stroke-width="1.4"/><line x1="13" y1="17" x2="13" y2="22" stroke-width="1.6"/><path d="M11,22 Q13,24.5 15,22" stroke-width="1.3"/></svg>`,
        echo_shot: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="3" stroke-width="1.8"/><circle cx="13" cy="13" r="6.5" stroke-width="1.2" stroke-dasharray="3 2"/><circle cx="13" cy="13" r="10" stroke-width="1" stroke-dasharray="2 3"/><line x1="13" y1="3" x2="13" y2="6.5" stroke-width="1.5"/><line x1="13" y1="19.5" x2="13" y2="23" stroke-width="1.5"/></svg>`,
        ion_round: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><ellipse cx="13" cy="13" rx="3.5" ry="10" stroke-width="1.8"/><ellipse cx="13" cy="13" rx="10" ry="3.5" stroke-width="1.8"/><circle cx="13" cy="13" r="2" fill="currentColor" stroke="none"/></svg>`,
        shock_nova: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="5" stroke-width="1.8"/><line x1="13" y1="2" x2="13" y2="7" stroke-width="1.6"/><line x1="13" y1="19" x2="13" y2="24" stroke-width="1.6"/><line x1="2" y1="13" x2="7" y2="13" stroke-width="1.6"/><line x1="19" y1="13" x2="24" y2="13" stroke-width="1.6"/><line x1="5" y1="5" x2="8.2" y2="8.2" stroke-width="1.4"/><line x1="21" y1="5" x2="17.8" y2="8.2" stroke-width="1.4"/><line x1="5" y1="21" x2="8.2" y2="17.8" stroke-width="1.4"/><line x1="21" y1="21" x2="17.8" y2="17.8" stroke-width="1.4"/></svg>`,
        heal_heart: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13,21 C13,21 4,15 4,9 C4,6.2 6.2,4 9,4 C10.8,4 12.3,5 13,6.2 C13.7,5 15.2,4 17,4 C19.8,4 22,6.2 22,9 C22,15 13,21 13,21Z"/><line x1="13" y1="9" x2="13" y2="15"/><line x1="10" y1="12" x2="16" y2="12"/></svg>`,
        orbiter: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="2.5" stroke-width="1.8"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2" transform="rotate(60 13 13)"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2" transform="rotate(120 13 13)"/></svg>`,
        phoenix_drive: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13,2 L15.5,9 L23,9 L17,14 L19.5,22 L13,17.5 L6.5,22 L9,14 L3,9 L10.5,9 Z"/></svg>`,
        singularity: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="3.5" stroke-width="1.8"/><circle cx="13" cy="13" r="7" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="13" cy="13" r="10.5" stroke-width="1" stroke-dasharray="1 3"/><line x1="4" y1="4" x2="9" y2="9" stroke-width="1.3"/><line x1="22" y1="4" x2="17" y2="9" stroke-width="1.3"/><line x1="4" y1="22" x2="9" y2="17" stroke-width="1.3"/><line x1="22" y1="22" x2="17" y2="17" stroke-width="1.3"/></svg>`
    };
    const wrap = svgs[id];
    if (wrap) return `<div class="ability-icon ability-${id}">${wrap}</div>`;
    return fallback;
}

// Track which pick is currently focused (for the feature panel + take button)
let _abilityPickFocusIdx = 0;

function drawAbilityChoices() {
    const cards = document.getElementById('ability-cards');
    if (!cards) {
        abilityPicking = false;
        return;
    }

    cards.innerHTML = '';
    const pool = ABILITIES.filter((a) => {
        const r = getAbilityRank(a.id);
        return r < (a.tree?.length || 1);
    });
    const source = pool.length >= 3 ? pool : ABILITIES;
    activeAbilityChoices = [...source].sort(() => Math.random() - 0.5).slice(0, 3);

    activeAbilityChoices.forEach((ability, idx) => {
        const rank = getAbilityRank(ability.id);
        const isEvolve = rank > 0;
        const nextIdx = Math.min((ability.tree?.length || 1) - 1, rank);
        const nextDef = ability.tree ? ability.tree[nextIdx] : { name: ability.name, tier: ability.rarity, desc: ability.desc };
        const tier = (nextDef.tier || ability.rarity || 'common').toLowerCase();

        // Pull the inner SVG out of the wrapped icon markup so we can place it inside the diamond
        const wrap = document.createElement('div');
        wrap.innerHTML = getAbilityIconMarkup(ability.id, ability.icon);
        const innerSvgHtml = (wrap.querySelector('svg') && wrap.querySelector('svg').outerHTML) || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>`;

        const card = document.createElement('div');
        card.className = `pick-diamond tier-${tier} ${isEvolve ? 'evolve' : ''} ${idx === _abilityPickFocusIdx ? 'selected' : ''}`.trim();
        card.dataset.idx = String(idx);
        card.dataset.id = ability.id;
        card.innerHTML = `
            ${isEvolve ? `<div class="pd-evolved-tag">EVOLVE +${rank + 1}</div>` : ''}
            <div class="diamond-frame">
                <div class="diamond-icon">${innerSvgHtml}</div>
            </div>
            <div class="pd-label">${nextDef.name}</div>
            <div class="pd-rank" title="Rank ${rank + 1}"></div>
        `;
        card.onclick = () => {
            _abilityPickFocusIdx = idx;
            // Update selected state across all cards
            cards.querySelectorAll('.pick-diamond').forEach((el) => el.classList.toggle('selected', Number(el.dataset.idx) === idx));
            updateAbilityPickFeature();
            playSfx('tap', 0.7);
            playHaptic('tap');
        };
        cards.appendChild(card);
    });

    // default focus to first card
    _abilityPickFocusIdx = 0;
    updateAbilityPickFeature();
    updateMetaHud();
}

// Update the featured info card + tree based on current focus
function updateAbilityPickFeature() {
    const ability = activeAbilityChoices[_abilityPickFocusIdx];
    const featureEl = document.getElementById('ability-pick-feature');
    const titleEl = document.getElementById('feature-title');
    const effectEl = document.getElementById('feature-effect');
    const treeEl = document.getElementById('feature-tree');
    if (!ability || !featureEl || !titleEl || !effectEl || !treeEl) return;

    const rank = getAbilityRank(ability.id);
    const tree = ability.tree || [{ name: ability.name, tier: ability.rarity, desc: ability.desc }];
    const nextIdx = Math.min(tree.length - 1, rank);
    const nextDef = tree[nextIdx];
    const tier = (nextDef.tier || ability.rarity || 'common').toLowerCase();

    featureEl.classList.remove('tier-common','tier-rare','tier-epic','tier-legendary');
    featureEl.classList.add(`tier-${tier}`);

    titleEl.innerHTML = `${nextDef.name.toUpperCase()}`;
    // Pull a delta phrase out of the desc (anything after a "+" or "x")
    effectEl.innerHTML = nextDef.desc;

    // Build the vertical tree of diamonds
    const wrap = document.createElement('div');
    wrap.innerHTML = getAbilityIconMarkup(ability.id, ability.icon);
    const innerSvgHtml = (wrap.querySelector('svg') && wrap.querySelector('svg').outerHTML) || '';

    let html = '';
    tree.forEach((node, i) => {
        const nodeTier = (node.tier || tier).toLowerCase();
        const state = i < rank ? 'owned' : i === rank ? 'current' : 'future';
        html += `<div class="ft-node tier-${nodeTier} ${state}" title="${node.name}">${innerSvgHtml}</div>`;
        if (i < tree.length - 1) html += `<div class="ft-link ${i >= rank ? 'future' : ''}"></div>`;
    });
    treeEl.innerHTML = html;
}

// "TAKE" button at the bottom — applies the focused ability
window.confirmAbilityPick = function() {
    const ability = activeAbilityChoices[_abilityPickFocusIdx];
    if (!ability) return;
    applyAbility(ability.id);
    abilityPicking = false;
    const overlay = document.getElementById('ability-overlay');
    if (overlay) overlay.classList.remove('active');
};

function applyAbility(id) {
    player.abilityRanks[id] = (player.abilityRanks[id] || 0) + 1;
    const rank = player.abilityRanks[id];
    const ability = ABILITIES.find((entry) => entry.id === id);
    const rankDef = getAbilityRankDef(ability, rank - 1);
    const isEvolved = rank > 1;

    switch (id) {
        case 'damage_boost': {
            // 1: x1.18  2: x1.30  3: x1.55 + crit chance  4: x2.0 always-crit
            const mult = [1.18, 1.30, 1.55, 2.00][rank - 1] || 1.20;
            player.damageMultiplier *= mult;
            if (rank >= 3) player.critChance = Math.max(player.critChance || 0, 0.20);
            if (rank >= 4) { player.critChance = 1.0; player.critMultiplier = 2.0; }
            break;
        }
        case 'rapid_fire': {
            const mult = [0.78, 0.62, 0.42, 0.30][rank - 1] || 0.80;
            player.atkCooldown *= mult;
            if (rank >= 3) player.frenzyOnKill = true;
            if (rank >= 4) player.bulletsRicochet = true;
            break;
        }
        case 'multi': {
            const add = [1, 2, 3, 4][rank - 1] || 1;
            player.multishot += add;
            if (rank >= 3) player.multiSpread = (player.multiSpread || 0) + 0.10;
            if (rank >= 4) player.pulsarBurst = true;
            break;
        }
        case 'pierce': {
            const add = [1, 3, 99, 99][rank - 1] || 1;
            player.pierce += add;
            if (rank >= 2) player.pierceDamageBonus = (player.pierceDamageBonus || 0) + 0.20;
            if (rank >= 4) player.markOnHit = true;
            break;
        }
        case 'chain_lightning':
            player.chainLightning = true;
            player.chainCount = [1, 3, 6, 6][rank - 1] || 1;
            if (rank >= 3) player.chainParalyze = true;
            if (rank >= 4) player.chainOnKill = true;
            break;
        case 'tornado_shot':
            player.tornadoShot = true;
            player.tornadoEvery = [3, 2, 2, 1][rank - 1] || 3;
            if (rank >= 3) player.tornadoPull = true;
            if (rank >= 4) player.permaTornado = true;
            break;
        case 'echo_shot':
            player.echoShot = true;
            player.echoEvery = [4, 3, 3, 1][rank - 1] || 4;
            player.echoCount = [1, 2, 2, 1][rank - 1] || 1;
            if (rank >= 3) player.echoSplit = true;
            if (rank >= 4) player.phantomChance = 0.25;
            break;
        case 'ion_round':
            player.ionRound = true;
            player.ionEvery = [5, 5, 4, 4][rank - 1] || 5;
            player.ionRadiusMult = [1.0, 1.5, 1.8, 2.4][rank - 1] || 1.0;
            if (rank >= 3) player.ionPiercing = true;
            if (rank >= 4) player.ionVaporize = true;
            break;
        case 'shock_nova':
            player.shockNova = true;
            player.shockEvery = [12, 8, 5, 4][rank - 1] || 12;
            if (rank >= 3) player.shockChainOnNova = true;
            if (rank >= 4) player.shockAura = true;
            break;
        case 'singularity':
            player.singularity = true;
            player.singularityEvery = [8, 6, 5, 1][rank - 1] || 8;
            if (rank >= 3) player.singularityImplode = true;
            if (rank >= 4) player.permaSingularity = true;
            break;
        case 'phoenix_drive':
            player.phoenixDrive = true;
            if (rank >= 2) player.phoenixBurning = true;
            if (rank >= 3) player.phoenixDouble = true;
            if (rank >= 4) player.phoenixRevive = true;
            break;
        case 'heal_heart':
            player.hp = Math.min(player.maxHp, player.hp + 1);
            if (rank >= 2) { player.maxHp += 1; player.hp = Math.min(player.maxHp, player.hp + 1); }
            if (rank >= 3) { player.maxHp += 1; player.healPerKills = 25; }
            if (rank >= 4) { player.firstLethalBlock = true; }
            syncHpDangerFlair();
            break;
        case 'orbiter':
            // rank 1 = 1 drone, 2 = +1 (total 2), 3 = +2 (total 4), 4 = +2 (total 6)
            const adds = [1, 1, 2, 2][rank - 1] || 1;
            for (let n = 0; n < adds; n++) {
                player.orbiters.push({
                    id: nextOrbiterId++,
                    angle: Math.random() * Math.PI * 2,
                    distance: 50 + player.orbiters.length * 10,
                    r: rank >= 3 ? 5 : 7,
                    damage: 18 + rank * 4,
                    x: player.x,
                    y: player.y
                });
            }
            if (rank >= 4) player.sentinelHalo = true;
            break;
        // ────────────── 25+ NEW ABILITIES (effect logic) ──────────
        case 'cluster_bomb': {
            player.clusterBomb = true;
            player.clusterEvery = [10, 7, 5, 4][rank - 1] || 10;
            player.clusterDmgMult = [3.0, 4.5, 6.0, 9.0][rank - 1] || 3.0;
            if (rank >= 3) player.clusterSplit = true;
            if (rank >= 4) player.clusterChain = true;
            break;
        }
        case 'ricochet': {
            player.bulletsRicochet = true;
            player.ricochetCount = [1, 2, 4, 99][rank - 1] || 1;
            if (rank >= 2) player.ricochetDmgPerBounce = (player.ricochetDmgPerBounce || 0) + 0.20;
            if (rank >= 3) player.ricochetSeek = true;
            break;
        }
        case 'vampire': {
            player.lifesteal = [0.02, 0.04, 0.08, 0.15][rank - 1] || 0.02;
            if (rank >= 2) player.magnetFlat = (player.magnetFlat || 0) + 20;
            if (rank >= 3) player.heartDropOnKill = 0.05;
            if (rank >= 4) player.bossFullHeal = true;
            break;
        }
        case 'frost_shot': {
            player.frostOnHit = true;
            player.frostStrength = [0.25, 0.40, 0.60, 0.60][rank - 1] || 0.25;
            if (rank >= 2) player.frostDoT = true;
            if (rank >= 3) player.freezeChance = 0.15;
            if (rank >= 4) player.frozenShatter = true;
            break;
        }
        case 'poison_dart': {
            player.poisonOnHit = true;
            player.poisonPct = [0.08, 0.12, 0.12, 0.12][rank - 1] || 0.08;
            player.poisonDuration = [3, 4, 5, 6][rank - 1] || 3;
            if (rank >= 2) player.poisonSpread = true;
            if (rank >= 3) player.poisonExplodeOnDeath = true;
            if (rank >= 4) player.poisonJump = true;
            // Add baseline damage so it's tangible even if DoT engine isn't deep
            player.damageMultiplier *= [1.05, 1.10, 1.20, 1.35][rank - 1] || 1.05;
            break;
        }
        case 'bullet_storm': {
            player.frenzyOnKill = true;
            player.frenzyCap = [0.30, 0.50, 0.80, 99][rank - 1] || 0.30;
            if (rank >= 2) player.damageMultiplier *= 1.10;
            if (rank >= 3) player.slowImmune = true;
            if (rank >= 4) player.frenzyPermanent = true;
            break;
        }
        case 'lucky_seven': {
            player.luckyEvery = [7, 7, 5, 4][rank - 1] || 7;
            player.luckyMult = [5, 8, 10, 15][rank - 1] || 5;
            if (rank >= 3) player.luckyHeals = 1;
            if (rank >= 4) player.megaCritChance = 0.15;
            break;
        }
        case 'crit_chance': {
            player.critChance = Math.max(player.critChance || 0, [0.15, 0.25, 0.40, 0.60][rank - 1] || 0.15);
            player.critMultiplier = [2.0, 2.5, 2.5, 4.0][rank - 1] || 2.0;
            if (rank >= 3) player.pierce = (player.pierce || 0) + 1;
            break;
        }
        case 'glass_cannon': {
            const dmgMult = [1.6, 1.9, 2.5, 3.0][rank - 1] || 1.6;
            player.damageMultiplier *= dmgMult;
            player.maxHp = Math.max(1, player.maxHp - (rank === 4 ? 0 : 1));
            player.hp = Math.min(player.hp, player.maxHp);
            if (rank === 2) player.atkCooldown *= 0.77;
            if (rank >= 3) player.firstLethalBlock = true;
            if (rank >= 4) player.maxHp = 2;
            break;
        }
        case 'lich_bullets': {
            player.bulletFork = true;
            player.bulletForkCount = [3, 6, 6, 6][rank - 1] || 3;
            if (rank >= 3) player.forkCritChance = 0.30;
            if (rank >= 4) player.lichEye = true;
            break;
        }
        case 'platinum_rounds': {
            player.platinumStack = true;
            player.platinumPerHit = [0.0005, 0.0008, 0.0012, 0.01][rank - 1] || 0.0005;
            player.platinumCap = [0.30, 0.50, 0.80, 99][rank - 1] || 0.30;
            if (rank >= 2) player.platinumFireRate = 0.0005;
            break;
        }
        case 'blank_burst': {
            player.blankChance = [0.05, 0.10, 0.20, 1.0][rank - 1] || 0.05;
            if (rank >= 2) player.blankPulse = true;
            if (rank >= 3) player.blankRadius = 2;
            if (rank >= 4) player.permanentBlankAura = true;
            break;
        }
        case 'strong_spirit': {
            player.firstLethalBlock = true;
            player.spiritInvul = [2, 3, 5, 5][rank - 1] || 2;
            if (rank >= 2) player.spiritResetOnFullHeal = true;
            if (rank >= 3) player.spiritEvery = 60;
            if (rank >= 4) player.shieldEachWave = true;
            break;
        }
        case 'bloodlust': {
            player.healOnKillChance = [0.25, 0.40, 0.60, 1.0][rank - 1] || 0.25;
            if (rank >= 2) player.killDamageBuff = 0.05;
            if (rank >= 3) player.healPerKills = 5;
            if (rank >= 4) player.everyKillHeal = 0.5;
            break;
        }
        case 'trigger_fingers': {
            player.killSpeedBoost = true;
            player.killSpeedPct = [0.005, 0.01, 0.02, 0.001][rank - 1] || 0.005;
            player.killSpeedCap = [0.20, 0.35, 0.60, 99][rank - 1] || 0.20;
            if (rank >= 2) player.killDamageBoost = 0.05;
            if (rank >= 3) player.bossResetCap = true;
            break;
        }
        case 'scarier_face': {
            // Apply enemy HP reduction to all current and future enemies
            const reduction = [0.20, 0.30, 0.45, 0.45][rank - 1] || 0.20;
            player.enemyHpMult = (player.enemyHpMult || 1) * (1 - reduction);
            // Retroactively apply to alive enemies
            if (typeof enemies !== 'undefined') {
                enemies.forEach((e) => { if (e.alive) e.hp *= (1 - reduction); });
            }
            if (rank >= 2) player.enemyFleeChance = 0.10;
            if (rank >= 3) player.bossHpMult = 0.75;
            if (rank >= 4) player.executeThreshold = 0.30;
            break;
        }
        case 'saw_blade': {
            const sawCount = [1, 2, 3, 4][rank - 1] || 1;
            for (let n = 0; n < sawCount; n++) {
                player.orbiters.push({
                    id: nextOrbiterId++,
                    angle: (n / sawCount) * Math.PI * 2,
                    distance: 60 + (rank * 4),
                    r: 8 + rank * 1.5,
                    damage: 22 + rank * 6,
                    x: player.x,
                    y: player.y,
                    isSaw: true
                });
            }
            if (rank >= 3) player.sawWaves = true;
            if (rank >= 4) player.sawPull = true;
            break;
        }
        case 'boomerang': {
            player.boomerangShot = true;
            player.boomerangEvery = [5, 4, 3, 1][rank - 1] || 5;
            if (rank >= 2) player.boomerangSpawnsClone = true;
            if (rank >= 3) player.boomerangCount = 3;
            if (rank >= 4) player.boomerangPendulum = 5;
            break;
        }
        case 'spread_volley': {
            player.multiSpread = (player.multiSpread || 0) + [0.15, 0.30, 0.50, 0.90][rank - 1];
            if (rank >= 2) player.multishot = (player.multishot || 1) + 1;
            if (rank >= 3) player.closeRangeBonus = 0.30;
            if (rank >= 4) { player.multishot += 3; player.pointBlankMult = 4; }
            break;
        }
        case 'crit_bomb': {
            player.critExplode = true;
            player.critExplodeRadius = [40, 55, 70, 100][rank - 1] || 40;
            player.critExplodeMult = [0.6, 0.8, 1.5, 99][rank - 1] || 0.6;
            if (rank >= 3) player.critStunWave = true;
            if (rank >= 4) player.critOneShot = true;
            break;
        }
        case 'phantom_shield': {
            player.shieldEvery = [8, 6, 4, 2][rank - 1] || 8;
            player.shieldCharges = [1, 2, 1, 1][rank - 1] || 1;
            if (rank >= 3) player.shieldReflect = true;
            if (rank >= 4) player.shieldHeals = true;
            break;
        }
        case 'arc_pulse': {
            player.arcOnHit = true;
            player.arcEvery = [6, 4, 2, 1][rank - 1] || 6;
            player.arcTargets = [3, 3, 6, 8][rank - 1] || 3;
            if (rank >= 2) player.arcParalyze = true;
            break;
        }
        case 'heat_seeker': {
            player.bulletsHome = [0.3, 0.5, 0.8, 1.0][rank - 1] || 0.3;
            if (rank >= 2) player.markedDmg = 0.15;
            if (rank >= 3) player.bulletsHardHome = true;
            if (rank >= 4) player.bulletsSmartWait = true;
            break;
        }
        case 'glass_shards': {
            player.shardsOnHit = true;
            player.shardCount = [3, 5, 10, 10][rank - 1] || 3;
            player.shardDmgMult = [0.5, 0.7, 0.7, 0.7][rank - 1] || 0.5;
            if (rank >= 2) player.shardBleed = true;
            if (rank >= 3) player.shardsBounce = true;
            if (rank >= 4) player.shardsExplode = true;
            break;
        }
        case 'combo_multiplier': {
            player.comboBuff = true;
            player.comboPct = [0.05, 0.08, 0.12, 0.15][rank - 1] || 0.05;
            player.comboCap = [0.50, 0.80, 1.50, 99][rank - 1] || 0.50;
            if (rank >= 3) player.comboTimeBonus = 1;
            if (rank >= 4) player.comboPermanent = true;
            break;
        }
        case 'fortune_coin': {
            player.goldBonus = [0.50, 1.0, 2.0, 4.0][rank - 1] || 0.50;
            if (rank >= 2) player.doubleDropChance = 0.05;
            if (rank >= 3) player.bossPackToken = true;
            if (rank >= 4) player.passiveGold = 20;
            break;
        }
        default:
            break;
    }

    // SFX/haptic intensity now scales with the WINNING rank tier (more dopamine on evolves)
    const tier = rankDef.tier || ability?.rarity || 'common';
    const intensity = tier === 'legendary' ? 1.6 : tier === 'epic' ? 1.25 : tier === 'rare' ? 1.0 : 0.85;
    playSfx('ability', intensity);
    powerPulse = Math.min(2.6, powerPulse + (tier === 'legendary' ? 0.85 : tier === 'epic' ? 0.58 : 0.32));
    screenShake = Math.min(3.2, screenShake + (tier === 'legendary' ? 0.65 : tier === 'epic' ? 0.42 : 0.18));
    playHaptic(tier === 'legendary' ? 'revealLegendary' : tier === 'epic' ? 'hard' : 'medium');
    if (isEvolved) showToast(`Evolved → ${rankDef.name}`);
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
    const hpBefore = player.hp;
    player.hp -= 1;
    player.invulnerable = 0.9;

    // STRONGER heart-loss feedback: red full-screen flash, harder shake, particle burst,
    // HUD-heart shake animation flag, big -1 text, body class for CSS pulse.
    addP(player.x, player.y, source === 'boss' ? '#ff375f' : '#ffffff', 28, 220, 0.45, 4);
    addP(player.x, player.y, '#ff375f', 12, 320, 0.35, 5); // extra red splash
    addFxText(player.x, player.y - 20, '-1', '#ff375f', 0.7, 30);
    screenShake = Math.min(3.6, screenShake + (source === 'boss' ? 1.4 : 0.95));
    powerPulse = Math.min(2.6, powerPulse + 0.4);
    playSfx('hit', source === 'boss' ? 1.25 : 1.1);
    playSfx('death', 0.4); // small ominous low note layered on every -1
    playHaptic(source === 'boss' ? 'hard' : 'hard');

    // Trigger HUD heart shake/lost animation
    window.__heartDamageTime = performance.now();
    window.__heartLostIdx = hpBefore - 1; // the heart that just got depleted
    // Body class for CSS-driven full-screen flash
    document.body.classList.add('hp-flash');
    if (window.__hpFlashTimer) clearTimeout(window.__hpFlashTimer);
    window.__hpFlashTimer = setTimeout(() => document.body.classList.remove('hp-flash'), 400);

    syncHpDangerFlair();

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
    clearHpDangerFlair();
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

function showResultOverlay({ loss = false, title, copy, stats, primaryLabel, secondaryLabel, onPrimary, onSecondary, stars = 0 }) {
    const overlay = document.getElementById('result-overlay');
    const content = overlay ? overlay.querySelector('.result-content') : null;
    const badge = document.getElementById('result-badge');
    const titleNode = document.getElementById('result-title');
    const copyNode = document.getElementById('result-copy');
    const statsNode = document.getElementById('result-stats');
    const primary = document.getElementById('result-primary');
    const secondary = document.getElementById('result-secondary');
    if (!overlay || !badge || !titleNode || !copyNode || !statsNode || !primary || !secondary) return;

    if (content) {
        content.classList.toggle('loss', loss);
        content.classList.toggle('win', !loss);
        // Re-trigger the pop animation
        content.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        content.offsetHeight;
        content.style.animation = '';
    }

    badge.textContent = loss ? 'DEFEATED' : 'VICTORY';
    badge.classList.toggle('loss', loss);
    titleNode.textContent = title;
    copyNode.textContent = copy;

    // Optional star rating for victory
    let starsHtml = '';
    if (!loss && stars >= 0) {
        const lit = Math.max(0, Math.min(3, stars));
        starsHtml = `<div class="result-stars">
            ${[0,1,2].map((i) => `<span class="result-star ${i < lit ? 'lit' : ''}" style="--star-delay:${(i*0.15+0.2).toFixed(2)}s">★</span>`).join('')}
        </div>`;
    }

    statsNode.innerHTML = starsHtml + stats.map((entry) => `<div class="result-line"><span>${entry.label}</span><strong>${entry.value}</strong></div>`).join('');
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
    playHaptic('hard');
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
    const goldReward = Math.round(getLevelGoldReward(currentLevel) * getEconomyMultiplier());
    const gemReward = 1 + Math.floor(currentLevel / 6);
    save.unlocked = Math.max(save.unlocked, currentLevel + 1);
    save.selectedLevel = save.unlocked;
    save.gems += gemReward;
    save.gold += goldReward;
    saveSave();
    closeMission();
    playSfx('win', 1);
    playHaptic('success');
    // Star rating: 1 (cleared), 2 (cleared with HP > half), 3 (cleared full HP)
    const stars = player && player.maxHp ? (player.hp >= player.maxHp ? 3 : (player.hp > player.maxHp / 2 ? 2 : 1)) : 1;
    showResultOverlay({
        title: `Level ${currentLevel} Clear`,
        copy: 'Rewards paid out. The next mission is live.',
        stars,
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
    const radii = [150, 110, 75]; // matching .ring-outer/-mid/-inner
    // Build a single inline SVG that contains 3 progress arcs — one per upgrade —
    // each driven by stroke-dasharray (so it actually GROWS as level rises,
    // it doesn't just rotate around).
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-160 -160 320 320');
    svg.setAttribute('class', 'hub-progress-svg');
    svg.style.position = 'absolute';
    svg.style.inset = '50% auto auto 50%';
    svg.style.transform = 'translate(-50%, -50%)';
    svg.style.width = '320px';
    svg.style.height = '320px';
    svg.style.pointerEvents = 'none';

    UPGRADES.forEach((upgrade, index) => {
        const level = save.stats[upgrade.id] || 0;
        const ratio = Math.min(1, level / upgrade.max);
        const r = radii[index];
        const circ = 2 * Math.PI * r;
        // background track (subtle)
        const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        track.setAttribute('cx', '0'); track.setAttribute('cy', '0');
        track.setAttribute('r', String(r));
        track.setAttribute('fill', 'none');
        track.setAttribute('stroke', 'rgba(255,255,255,0.07)');
        track.setAttribute('stroke-width', '4');
        svg.appendChild(track);
        // active arc — starts at top (12 o'clock), grows clockwise
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arc.setAttribute('cx', '0'); arc.setAttribute('cy', '0');
        arc.setAttribute('r', String(r));
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', upgrade.color);
        arc.setAttribute('stroke-width', String(5 + Math.round(ratio * 5)));
        arc.setAttribute('stroke-linecap', 'round');
        arc.setAttribute('stroke-dasharray', `${(circ * ratio).toFixed(1)} ${circ.toFixed(1)}`);
        arc.setAttribute('stroke-dashoffset', '0');
        arc.setAttribute('transform', 'rotate(-90)');
        arc.style.filter = `drop-shadow(0 0 6px ${upgrade.color}) drop-shadow(0 0 14px ${upgrade.color}66)`;
        arc.style.transition = 'stroke-dasharray .35s ease, stroke-width .25s ease';
        svg.appendChild(arc);
    });

    holder.appendChild(svg);

    const focused = UPGRADES.find((entry) => entry.id === (focusId || lastUpgradeId)) || UPGRADES[0];
    const current = getUpgradePreviewValue(focused.id, save.stats[focused.id] || 0);
    const next = getUpgradePreviewValue(focused.id, Math.min(focused.max, (save.stats[focused.id] || 0) + 1));
    readout.textContent = `${focused.name}: ${current} > ${next}`;
}

function getUpgradePreviewValue(id, level) {
    if (id === 'dmg') return (PLAYER_STATS.dmg.base + getUpgradeBonus(PLAYER_STATS.dmg, level, 'dmg')).toFixed(1);
    if (id === 'atkSpd') return (PLAYER_STATS.atkSpd.base + getUpgradeBonus(PLAYER_STATS.atkSpd, level, 'atkSpd')).toFixed(2);
    if (id === 'economy') return `+${Math.round(getUpgradeBonus(PLAYER_STATS.economy, level, 'economy') * 100)}%`;
    return level;
}

function renderHub() {
    const grid = document.getElementById('hub-grid');
    if (!grid) return;
    grid.innerHTML = '';

    UPGRADES.forEach((upgrade) => {
        const level = save.stats[upgrade.id] || 0;
        const cost = getUpgradeCost(upgrade, level);
        const meta = getUpgradeCardMeta(upgrade, level);
        const card = document.createElement('div');
        card.className = `shop-card ${lastUpgradeId === upgrade.id ? 'upgraded' : ''}`.trim();
        card.innerHTML = `
            <div class="upgrade-card-topline">
                <div class="card-icon" style="color:${upgrade.color}; border-color:${upgrade.color}55;">${upgrade.icon}</div>
                <div class="upgrade-tag ${meta.tier.isMajor ? 'major' : 'minor'}">${meta.phaseLabel}</div>
            </div>
            <div class="card-title">${upgrade.name}</div>
            <div class="card-meta">${meta.surgeLabel} | ${level >= upgrade.max ? 'Maxed' : (meta.tier.nextIsMajor ? 'Next: Big spike' : 'Build-up active')}</div>
            <div class="card-copy">${upgrade.desc}</div>
            <div class="upgrade-card-footer">
                <div class="upgrade-surge">${meta.tier.isMajor ? 'Major step' : `Cycle ${Math.min(meta.tier.step, meta.tier.cycleSize)}/${meta.tier.cycleSize}`}</div>
                <button class="inline-button" type="button" ${level >= upgrade.max ? 'disabled' : ''}>${level >= upgrade.max ? 'MAXED' : `${meta.buttonLabel} ${cost} GOLD`}</button>
            </div>
        `;
        card.onmouseenter = () => updateHubVisualization(upgrade.id);
        card.onclick = () => buyUpgrade(upgrade.id);
        grid.appendChild(card);
    });

    updateHubVisualization();
    updateUpgradeNotifier();
}

function renderShop() {
    renderShopFeatureBanner();
    renderCardPackStoreColumn();
    renderSkinStoreColumn();
    renderStoreColumn('shop-gems', SHOP_SECTIONS.gemItems, 'gems');
    renderRealMoneyColumn();
}

// Wire up data-buy / data-peek buttons on a freshly-rendered pack card
function wirePackCardButtons(card, item, premium) {
    const buyBtn = card.querySelector('[data-buy]');
    const peekBtn = card.querySelector('[data-peek]');
    if (buyBtn) {
        buyBtn.onclick = (e) => {
            e.stopPropagation();
            playSfx('tapAccent', 0.85);
            playHaptic('tap');
            if (premium) buyPremiumPack(item.id);
            else buyShopItem(item.id);
        };
    }
    if (peekBtn) {
        peekBtn.onclick = (e) => {
            e.stopPropagation();
            playSfx('tap', 0.7);
            playHaptic('tap');
            const key = peekBtn.getAttribute('data-peek');
            if (key) showPackPeek(key);
        };
    }
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
        const wrap = document.createElement('div');
        wrap.innerHTML = getPackOfferMarkup(item, packDef, premium);
        const card = wrap.firstElementChild;
        wirePackCardButtons(card, item, premium);
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
        const wrap = document.createElement('div');
        wrap.innerHTML = getPackOfferMarkup(item, packDef, premium);
        const card = wrap.firstElementChild;
        wirePackCardButtons(card, item, premium);
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
    if (!packDef) {
        // non-pack item — handled elsewhere via getShopItemMarkup
        return getShopItemMarkup(item, premium);
    }
    const title = packDef.name;
    // Compact price: drop the currency word, use a short symbol prefix
    const priceCompact = premium ? item.price : (item.currency === 'gems' ? `◆ ${item.cost}` : `${item.cost}G`);
    const priceClass = premium ? 'money' : (item.currency === 'gems' ? 'gems' : 'gold');
    const tierKey = item.reward?.packKey || 'supply_pack_i';
    const buttonClass = premium ? 'btn-glossy btn-gold' : (packDef.rarity === 'gold' || packDef.rarity === 'red' ? 'btn-glossy btn-purple' : 'btn-glossy');

    const best = getBestDropForPack(item.reward.packKey);
    const heroSvg = best ? getRewardArtSvg(best.id, packDef.rewardType === 'skin' ? 'skin' : 'chip') : '';
    const tierLabel = getRarityLabel(packDef.rarity);
    const minis = getMiniDropsForPack(item.reward.packKey);
    const bestName = best ? (best.def.name || best.id) : '';

    return `
        <div class="pack-card-v2 tier-${tierKey}" data-pack="${tierKey}" onclick="playSfx('tap',0.7); playHaptic('tap');">
            <div class="pack-foil"></div>
            <div class="pack-hero">
                <div class="pack-hero-tag">★ ${bestName}</div>
                <div class="pack-tier-badge">${tierLabel}</div>
                <div class="pack-hero-icon">${heroSvg}</div>
            </div>
            <div class="pack-mini-strip">
                ${minis.map((m) => `<div class="pack-mini-drop tier-${m.tier}" title="${m.name}">${getMiniArtSvgInline(m.id, packDef.rewardType === 'skin' ? 'skin' : 'chip')}</div>`).join('')}
            </div>
            <div class="pack-body">
                <div class="pack-name">${title}</div>
                <div class="pack-sub">${item.bonus || formatPackOdds(packDef)}</div>
                <div class="pack-actions">
                    <button class="pack-peek-btn" type="button" data-peek="${item.reward.packKey}">PEEK</button>
                    <button class="${buttonClass} pack-buy-btn" type="button" data-buy="1">
                        <span class="pack-price-chip ${priceClass}">${priceCompact}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Generic shop item markup (gems/utility/real-money non-pack)
function getShopItemMarkup(item, premium = false) {
    const utilClass = getUtilClass(item.id);
    const price = premium ? item.price : `${item.cost} ${item.currency.toUpperCase()}`;
    const priceClass = premium ? 'money' : (item.currency === 'gems' ? 'gems' : 'gold');
    const buttonClass = premium ? 'btn-glossy btn-gold' : 'btn-glossy';
    return `
        <div class="shop-item-v2 ${utilClass}">
            <div class="util-art">${getUtilSvg(item.id, item.icon)}</div>
            <div class="util-name">${item.name}</div>
            <div class="util-desc">${item.bonus}</div>
            <button class="${buttonClass} item-buy" type="button" data-buy="1">
                ${premium ? 'Buy' : 'Get'} <span class="pack-price-chip ${priceClass}">${price}</span>
            </button>
        </div>
    `;
}

function getUtilClass(id) {
    const map = {
        reroll_pack: 'util-reroll',
        storm_license: 'util-storm',
        boss_pass: 'util-boss',
        neon_skin: 'util-trail',
        gold_stash_s: 'util-gold-stash',
        gold_stash_l: 'util-gold-stash',
        gems_pouch_s: 'util-gem-pouch',
        gems_pouch_l: 'util-gem-pouch',
        no_ads: 'util-no-ads',
        starter_bundle: 'util-bundle',
        supporter_pack: 'util-supporter',
        extra_normal_slot: 'util-extra-slot',
        extra_legend_slot: 'util-extra-slot'
    };
    return map[id] || '';
}

function getUtilSvg(id, fallback) {
    const svgs = {
        reroll_pack:    `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11A8 8 0 0 0 7 7"/><polyline points="21,4 21,11 14,11"/><path d="M5 15a8 8 0 0 0 14 4"/><polyline points="5,22 5,15 12,15"/></svg>`,
        storm_license:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="14,2 6,14 12,14 9,24 20,11 13,11 16,2"/></svg>`,
        boss_pass:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l3 6 6 1-4.5 4.5L19 21l-6-3-6 3 1.5-6.5L4 10l6-1z"/><circle cx="13" cy="13" r="2"/></svg>`,
        neon_skin:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h6l2-7 4 14 2-7h6"/></svg>`,
        gold_stash_s:   `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="8"/><path d="M10 13h6M13 10v6"/></svg>`,
        gold_stash_l:   `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="18" height="13" rx="2"/><path d="M7 8V6a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="13" cy="14.5" r="2"/></svg>`,
        gems_pouch_s:   `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,3 22,11 13,23 4,11"/><polyline points="4,11 22,11"/><polyline points="13,3 9,11 13,23"/><polyline points="13,3 17,11 13,23"/></svg>`,
        gems_pouch_l:   `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 22,11 13,24 4,11"/><polygon points="9,11 13,7 17,11 13,15"/></svg>`,
        no_ads:         `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="10"/><line x1="6" y1="6" x2="20" y2="20"/></svg>`,
        starter_bundle: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="20" height="13" rx="1.5"/><polyline points="3,9 13,3 23,9"/><line x1="13" y1="3" x2="13" y2="22"/></svg>`,
        supporter_pack: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 22s-9-6-9-13a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13z"/></svg>`,
        extra_normal_slot:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="18" height="14" rx="2"/><line x1="13" y1="10" x2="13" y2="16"/><line x1="10" y1="13" x2="16" y2="13"/></svg>`,
        extra_legend_slot:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,3 16,10 23,10 17.5,14 19.5,21 13,17 6.5,21 8.5,14 3,10 10,10"/></svg>`,
        premium_alpha:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><polygon points="13,3 22,9 22,17 13,23 4,17 4,9"/><polyline points="13,3 13,23"/><polyline points="4,9 22,17"/><polyline points="22,9 4,17"/></svg>`,
        royal_omega:    `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><polygon points="13,3 22,9 22,17 13,23 4,17 4,9"/><circle cx="13" cy="13" r="3"/></svg>`,
        legend_skin_pack: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><polygon points="13,3 22,9 22,17 13,23 4,17 4,9"/></svg>`
    };
    return svgs[id] || `<span style="font-family:var(--font-ui); color:#fff">${fallback}</span>`;
}

// Find the rarest reward reachable in a given pack
function getBestDropForPack(packKey) {
    const packDef = PACK_DEFINITIONS[packKey];
    if (!packDef) return null;
    const order = ['gold','red','purple','dark','blue'];
    for (const r of order) {
        if ((packDef.odds[r] || 0) <= 0) continue;
        const pool = getPackPool(packDef, r);
        if (!pool.length) continue;
        // pick highest weight in that rarity
        const sorted = [...pool].sort((a, b) => (b[1].weight || 1) - (a[1].weight || 1));
        const [id, def] = sorted[0];
        return { id, def, rarity: r };
    }
    return null;
}

// Up to 3 drops to show under hero, one per top tier
function getMiniDropsForPack(packKey) {
    const packDef = PACK_DEFINITIONS[packKey];
    if (!packDef) return [];
    const order = ['gold','red','purple','dark','blue'];
    const tierToTag = { gold: 'legendary', red: 'legendary', purple: 'epic', dark: 'rare', blue: 'rare' };
    const out = [];
    for (const r of order) {
        if (out.length >= 3) break;
        if ((packDef.odds[r] || 0) <= 0) continue;
        const pool = getPackPool(packDef, r);
        if (!pool.length) continue;
        const sorted = [...pool].sort((a, b) => (b[1].weight || 1) - (a[1].weight || 1));
        const [id, def] = sorted[0];
        out.push({ id, name: def.name, tier: tierToTag[r] || 'common' });
    }
    return out;
}

// Mini SVG art for chip / skin / ability used in mini-strip and peek tiles
function getMiniArtSvgInline(id, type) {
    if (type === 'skin') return `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><polygon points="13,2 22,22 13,17 4,22"/></svg>`;
    if (type === 'ability') {
        // small lightning glyph fallback
        return `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><polyline points="15,2 9,13 13.5,13 10,24"/></svg>`;
    }
    // chip
    const card = INVENTORY_CARDS[id];
    const sigil = card?.sigil || card?.icon || '?';
    return `<span style="font-family:var(--font-ui); font-size:8px; letter-spacing:0.6px;">${(sigil || '').slice(0,4)}</span>`;
}

// Big hero SVG art for pack-hero or peek tile
function getRewardArtSvg(id, type) {
    if (type === 'skin') {
        const skin = SKIN_DEFINITIONS[id];
        if (!skin) return '';
        const s = skin.style;
        const theme = skin.theme || 'arrow';
        const auraGrad = `<defs><radialGradient id="g-${id}" cx="50%" cy="60%" r="60%">
            <stop offset="0%" stop-color="${s.pulse}" stop-opacity="0.95"/>
            <stop offset="55%" stop-color="${s.core}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${s.pulse}" stop-opacity="0"/>
        </radialGradient></defs>
        <circle cx="50" cy="60" r="38" fill="url(#g-${id})"/>`;

        // Each theme draws a unique ship + flair
        let body = '';
        if (theme === 'arrow') {
            body = `
                <polygon points="50,12 74,84 50,72 26,84" fill="${s.ship}" stroke="${s.core}" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="7" fill="${s.core}"/>
                <line x1="34" y1="80" x2="66" y2="80" stroke="${s.trail}" stroke-width="3" stroke-linecap="round"/>`;
        } else if (theme === 'molten') {
            // Magma plate with cracks + ember sparks
            body = `
                <polygon points="50,10 80,86 50,76 20,86" fill="${s.ship}" stroke="${s.pulse}" stroke-width="1.5"/>
                <polyline points="50,18 46,40 52,52 44,68" fill="none" stroke="${s.core}" stroke-width="1.6"/>
                <polyline points="50,18 56,38 48,46 56,66" fill="none" stroke="${s.core}" stroke-width="1.4" opacity="0.8"/>
                <circle cx="40" cy="86" r="2" fill="${s.core}"/>
                <circle cx="60" cy="86" r="2" fill="${s.core}"/>
                <circle cx="50" cy="48" r="6" fill="${s.core}"/>`;
        } else if (theme === 'wave') {
            // Glass wing with rippling void wave behind
            body = `
                <path d="M 18 80 Q 30 64, 50 76 T 82 80" fill="none" stroke="${s.trail}" stroke-width="2"/>
                <path d="M 14 88 Q 28 70, 50 84 T 86 88" fill="none" stroke="${s.pulse}" stroke-width="1.5" opacity="0.7"/>
                <polygon points="50,14 78,80 50,68 22,80" fill="${s.ship}" opacity="0.95"/>
                <polygon points="50,28 64,72 50,62 36,72" fill="${s.pulse}" opacity="0.4"/>
                <circle cx="50" cy="48" r="6" fill="${s.core}"/>`;
        } else if (theme === 'corona') {
            // Sun ship: spikes radiate outward
            const spikes = Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const x1 = 50 + Math.cos(a) * 24, y1 = 50 + Math.sin(a) * 24;
                const x2 = 50 + Math.cos(a) * 38, y2 = 50 + Math.sin(a) * 38;
                return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${s.core}" stroke-width="2.4" opacity="0.85"/>`;
            }).join('');
            body = `${spikes}
                <circle cx="50" cy="50" r="22" fill="${s.ship}" opacity="0.95" stroke="${s.pulse}" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="9" fill="${s.core}"/>`;
        } else if (theme === 'blade') {
            // Sharp red dagger silhouette + twin afterburners
            body = `
                <polygon points="50,8 60,80 50,72 40,80" fill="${s.ship}" stroke="${s.core}" stroke-width="1.4"/>
                <polygon points="42,76 50,90 38,86" fill="${s.trail}" opacity="0.9"/>
                <polygon points="58,76 50,90 62,86" fill="${s.trail}" opacity="0.9"/>
                <polygon points="46,84 50,96 54,84" fill="${s.core}" opacity="0.8"/>
                <circle cx="50" cy="48" r="5" fill="${s.core}"/>`;
        } else if (theme === 'aurora') {
            // Prismatic ship with rainbow ribbon and stars
            body = `
                <defs><linearGradient id="aur-${id}" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#7be8ff"/><stop offset="40%" stop-color="#fffbe8"/>
                    <stop offset="70%" stop-color="#ffd14d"/><stop offset="100%" stop-color="#ff8ba2"/>
                </linearGradient></defs>
                <path d="M 14 84 Q 30 60, 50 78 T 86 84" stroke="url(#aur-${id})" stroke-width="3" fill="none"/>
                <polygon points="50,12 76,84 50,72 24,84" fill="${s.ship}" opacity="0.95" stroke="url(#aur-${id})" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="7" fill="${s.core}"/>
                <circle cx="22" cy="22" r="1.5" fill="#fff"/>
                <circle cx="78" cy="26" r="1.2" fill="#fff"/>
                <circle cx="74" cy="60" r="1.2" fill="#fff"/>
                <circle cx="30" cy="60" r="1.2" fill="#fff"/>`;
        } else {
            body = `
                <polygon points="50,12 74,84 50,72 26,84" fill="${s.ship}" stroke="${s.core}" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="7" fill="${s.core}"/>`;
        }

        return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${auraGrad}${body}</svg>`;
    }
    if (type === 'chip') {
        const chip = INVENTORY_CARDS[id];
        if (!chip) return '';
        const colorMap = { blue: '#2b96ff', dark: '#5566ff', purple: '#bc13fe', red: '#ff375f', gold: '#ffd14d' };
        const color = colorMap[chip.rarity] || '#fff';
        // pick shape per chip
        const shapeMap = {
            damage_chip:      `<polyline points="50,15 32,55 50,55 42,85" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`,
            magnet_chip:      `<path d="M30 55 a20 20 0 0 1 40 0" fill="none" stroke="${color}" stroke-width="4"/><line x1="30" y1="55" x2="30" y2="78" stroke="${color}" stroke-width="4"/><line x1="70" y1="55" x2="70" y2="78" stroke="${color}" stroke-width="4"/>`,
            stability_chip:   `<rect x="22" y="40" width="56" height="20" rx="3" fill="none" stroke="${color}" stroke-width="2"/><line x1="32" y1="50" x2="68" y2="50" stroke="${color}" stroke-width="2"/>`,
            rpm_chip:         `<line x1="20" y1="30" x2="80" y2="30" stroke="${color}" stroke-width="3"/><line x1="20" y1="50" x2="80" y2="50" stroke="${color}" stroke-width="3"/><line x1="20" y1="70" x2="80" y2="70" stroke="${color}" stroke-width="3"/><polyline points="62,22 80,30 62,38" fill="none" stroke="${color}" stroke-width="2.5"/><polyline points="62,42 80,50 62,58" fill="none" stroke="${color}" stroke-width="2.5"/><polyline points="62,62 80,70 62,78" fill="none" stroke="${color}" stroke-width="2.5"/>`,
            overcharge_core:  `<circle cx="50" cy="50" r="22" fill="none" stroke="${color}" stroke-width="3"/><polygon points="50,30 56,50 50,70 44,50" fill="${color}"/>`,
            arc_battery:      `<rect x="32" y="22" width="36" height="56" rx="4" fill="none" stroke="${color}" stroke-width="2.5"/><rect x="42" y="14" width="16" height="8" fill="${color}"/><polyline points="42,40 56,50 42,55 56,68" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`,
            siege_loader:     `<polygon points="20,80 50,20 80,80" fill="none" stroke="${color}" stroke-width="3"/><line x1="35" y1="55" x2="65" y2="55" stroke="${color}" stroke-width="2.5"/>`,
            apex_emblem:      `<polygon points="50,12 88,32 80,76 50,90 20,76 12,32" fill="none" stroke="${color}" stroke-width="3"/><polygon points="50,30 70,42 65,68 50,76 35,68 30,42" fill="${color}" opacity="0.6"/>`,
            minigun_protocol: `<line x1="22" y1="40" x2="78" y2="40" stroke="${color}" stroke-width="4"/><line x1="22" y1="55" x2="78" y2="55" stroke="${color}" stroke-width="4"/><line x1="22" y1="70" x2="78" y2="70" stroke="${color}" stroke-width="4"/><circle cx="20" cy="40" r="3" fill="${color}"/><circle cx="20" cy="55" r="3" fill="${color}"/><circle cx="20" cy="70" r="3" fill="${color}"/>`,
            vortex_array:     `<circle cx="50" cy="50" r="32" fill="none" stroke="${color}" stroke-width="2"/><circle cx="50" cy="50" r="22" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 4"/><circle cx="50" cy="50" r="10" fill="${color}"/>`,
            solar_crown:      `<polygon points="20,80 30,40 50,55 50,15 50,55 70,40 80,80" fill="none" stroke="${color}" stroke-width="3"/><circle cx="50" cy="55" r="6" fill="${color}"/>`,
            crimson_zero:     `<line x1="20" y1="50" x2="80" y2="50" stroke="${color}" stroke-width="3"/><polyline points="62,38 80,50 62,62" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="50" r="6" fill="none" stroke="${color}" stroke-width="2.5"/>`
        };
        const shape = shapeMap[id] || `<rect x="30" y="30" width="40" height="40" fill="none" stroke="${color}" stroke-width="3"/>`;
        return `
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="cg-${id}" cx="50%" cy="50%" r="55%">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
                        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="url(#cg-${id})"/>
                ${shape}
            </svg>`;
    }
    return '';
}

// Mount the shop feature banner (shows the rarest pack in shop as the "headline")
function renderShopFeatureBanner() {
    const mount = document.getElementById('shop-feature-banner-mount');
    if (!mount) return;
    mount.innerHTML = `
        <div class="shop-feature-banner">
            <div class="feature-icon">★</div>
            <div>
                <h3>NEW · ROYAL OMEGA</h3>
                <p>Top crate. Maximum gold and red odds. Exclusives unlocked.</p>
            </div>
        </div>
    `;
}

// ───────────────────────── PACK PEEK ─────────────────────────
window.showPackPeek = function(packKey) {
    const packDef = PACK_DEFINITIONS[packKey];
    if (!packDef) return;
    const overlay = document.getElementById('peek-overlay');
    const content = document.getElementById('peek-content');
    const grid = document.getElementById('peek-grid');
    const oddsBar = document.getElementById('peek-odds-bar');
    const legend = document.getElementById('peek-odds-legend');
    const name = document.getElementById('peek-pack-name');
    const sub = document.getElementById('peek-pack-sub');
    if (!overlay || !content || !grid || !oddsBar || !legend) return;

    name.textContent = packDef.name;
    sub.textContent = packDef.rewardType === 'skin' ? 'Possible skin drops' : 'Possible chip drops';

    content.classList.remove('tier-blue','tier-dark','tier-purple','tier-red','tier-gold');
    content.classList.add(`tier-${packDef.rarity}`);

    // odds bar — flex segments proportional to odds %
    const order = ['blue','dark','purple','red','gold'];
    const total = order.reduce((s, r) => s + (packDef.odds[r] || 0), 0) || 1;
    oddsBar.style.display = 'flex';
    oddsBar.style.gridTemplateColumns = '';
    oddsBar.innerHTML = order.map((r) => {
        const pct = ((packDef.odds[r] || 0) / total) * 100;
        return pct > 0
            ? `<span class="seg-${r}" style="flex:${pct.toFixed(2)} 0 0; min-width:4px;"></span>`
            : '';
    }).join('');

    legend.innerHTML = order.map((r) => {
        const pct = packDef.odds[r] || 0;
        return pct > 0 ? `<span><span class="dot ${r}"></span>${getRarityLabel(r)} ${pct}%</span>` : '';
    }).join('');

    // tiles, grouped by rarity descending
    const tiles = [];
    ['gold','red','purple','dark','blue'].forEach((r) => {
        if ((packDef.odds[r] || 0) <= 0) return;
        const pool = getPackPool(packDef, r);
        if (!pool.length) return;
        const totalWeight = pool.reduce((s, [, def]) => s + (def.weight || 1), 0);
        pool.forEach(([id, def]) => {
            const slice = ((def.weight || 1) / totalWeight) * (packDef.odds[r] / total) * 100;
            const art = getRewardArtSvg(id, packDef.rewardType === 'skin' ? 'skin' : 'chip');
            tiles.push(`
                <div class="peek-tile r-${r}">
                    <div class="peek-art">${art}</div>
                    <div class="peek-name">${def.name}</div>
                    <div class="peek-rate">${slice.toFixed(slice < 1 ? 2 : 1)}%</div>
                </div>
            `);
        });
    });
    grid.innerHTML = tiles.join('');

    overlay.classList.add('active');
    playSfx('peekOpen', 0.9);
    playHaptic('peek');
};

window.closePackPeek = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('peek-overlay');
    if (overlay) overlay.classList.remove('active');
};

// ─────────────────────────── DAILY OVERLAY (popup) ────────────
window.openDailyOverlay = function() {
    const overlay = document.getElementById('daily-overlay');
    const grid = document.getElementById('daily-overlay-grid');
    const status = document.getElementById('daily-overlay-status');
    if (!overlay || !grid) return;
    const cycleDay = Math.max(1, save.daily?.cycleDay || 1);
    const claimedToday = save.daily?.lastClaimKey === getTodayKey();
    if (status) status.textContent = claimedToday ? `Tag ${cycleDay} schon eingesammelt — komm morgen wieder.` : `Tag ${cycleDay} bereit. Reward: ${DAILY_LOGIN_REWARDS[cycleDay - 1]?.label || ''}`;
    grid.innerHTML = DAILY_LOGIN_REWARDS.map((reward, index) => {
        const day = index + 1;
        const status = day < cycleDay ? 'claimed' : day === cycleDay ? (claimedToday ? 'claimed today' : 'today') : 'upcoming';
        const statusText = day < cycleDay ? 'Done' : day === cycleDay ? (claimedToday ? 'Heute' : 'Jetzt') : 'Spaeter';
        return `
            <div class="daily-card ${status}">
                <div class="daily-day">Tag ${day}</div>
                <div class="daily-reward">${reward.label}</div>
                <div class="daily-status">${statusText}</div>
            </div>
        `;
    }).join('');
    overlay.classList.add('active');
    playSfx('peekOpen', 0.85);
    playHaptic('peek');
};
window.closeDailyOverlay = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('daily-overlay');
    if (overlay) overlay.classList.remove('active');
};

// ─────────────────────────── CHALLENGES (popup) ───────────────
const DAILY_CHALLENGES = [
    { id: 'kill100',   title: 'Kill 100 enemies', reward: '120 Gold' },
    { id: 'wave5',     title: 'Reach wave 5 in Endless', reward: '12 Gems' },
    { id: 'evolve',    title: 'Evolve any ability twice in a run', reward: '1 Pack II' },
    { id: 'noHit',     title: 'Clear a mission without losing a heart', reward: '20 Gems' }
];
window.openChallengesOverlay = function() {
    const overlay = document.getElementById('challenges-overlay');
    const list = document.getElementById('challenges-list');
    if (!overlay || !list) return;
    list.innerHTML = DAILY_CHALLENGES.map((c) => `
        <div class="mission-card" style="padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
                <div class="card-title" style="font-size:12px; letter-spacing:1.2px;">${c.title}</div>
                <div class="card-meta" style="margin-top:4px; font-size:10px;">Reward: ${c.reward}</div>
            </div>
            <span class="rarity-tag tier-rare">DAILY</span>
        </div>
    `).join('');
    overlay.classList.add('active');
    playSfx('peekOpen', 0.85);
    playHaptic('peek');
};
window.closeChallengesOverlay = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('challenges-overlay');
    if (overlay) overlay.classList.remove('active');
};

// ─────────────────────────── LEADERBOARD ──────────────────────
// Bots with realistic-looking names. The list is deterministic per session,
// always seats the player at rank 4 (so the player only ever wins
// 2nd/3rd-place rewards if they grind to overtake bots).
const BOT_POOL = [
    'NovaWraith', 'KaiZero', 'QuasarFox', 'NyxBlade', 'EmberLynx', 'Voidstep',
    'IonRavn', 'AshHavoc', 'PhantomZ', 'CrimsonGale', 'SoraEclipse', 'ZephyrAce',
    'StarlightK', 'Glitchcat', 'OmenDrift', 'SilkRider', 'PulseHart', 'AzureV',
    'ThornTaki', 'BastionRei', 'MyrrhAce', 'CometX', 'SableVox', 'LumenZ'
];
function getLeaderboardBots() {
    const seed = save.leaderboardSeed || 7;
    const rng = mulberry32(seed);
    const playerScore = computePlayerLeaderboardScore();
    // Place player at rank 4: three bots above, at least 6 below
    const above = [];
    let s = playerScore;
    for (let i = 0; i < 3; i++) {
        s += Math.floor(120 + rng() * 240); // each bot above is +120..+360
        above.push({ name: BOT_POOL[Math.floor(rng() * BOT_POOL.length)], score: s, isYou: false });
    }
    above.reverse(); // highest score first
    const below = [];
    let bs = playerScore;
    for (let i = 0; i < 7; i++) {
        bs -= Math.floor(80 + rng() * 220);
        below.push({ name: BOT_POOL[Math.floor(rng() * BOT_POOL.length)], score: Math.max(0, bs), isYou: false });
    }
    const rows = [...above, { name: 'You', score: playerScore, isYou: true }, ...below];
    // dedupe names (rare collisions)
    const seen = new Set();
    return rows.map((r) => {
        let name = r.name;
        let n = 1;
        while (seen.has(name)) { n++; name = r.name + n; }
        seen.add(name);
        return { ...r, name };
    });
}
function computePlayerLeaderboardScore() {
    // Score grows with progression but caps so bots above always beat you a bit
    const lvl = save.unlocked || 1;
    const packs = (save.permanentBoosts?.packsOpened || 0);
    const inventory = (save.inventory?.length || 0);
    return Math.floor(lvl * 110 + packs * 18 + inventory * 4 + 320);
}
function mulberry32(a) {
    return function() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const rows = getLeaderboardBots();
    list.innerHTML = rows.map((row, i) => {
        const rank = i + 1;
        return `
            <div class="lb-row ${row.isYou ? 'you' : ''} rank-${rank}">
                <span class="lb-rank">${rank}</span>
                <span class="lb-name">${row.name}</span>
                <span class="lb-score">${row.score.toLocaleString()}</span>
            </div>
        `;
    }).join('');
    const myRow = rows.findIndex((r) => r.isYou);
    const mine = document.getElementById('lb-rank-mine');
    if (mine) mine.textContent = `#${myRow + 1}`;
}

// Sync rail button states
function refreshMapRail() {
    const dailyBtn = document.getElementById('rail-daily');
    const dailyLabel = document.getElementById('rail-daily-label');
    const dailyBadge = document.getElementById('rail-daily-badge');
    const noAdsBtn = document.getElementById('rail-no-ads');
    const noAdsLabel = document.getElementById('rail-no-ads-label');

    if (dailyBtn) {
        const claimedToday = save.daily?.lastClaimKey === getTodayKey();
        dailyBtn.classList.toggle('claimed', claimedToday);
        if (dailyLabel) dailyLabel.textContent = claimedToday ? 'Done' : 'Daily';
        if (dailyBadge) dailyBadge.style.display = claimedToday ? 'none' : 'inline-flex';
    }
    if (noAdsBtn) {
        const owned = !!save.premium?.noAds;
        noAdsBtn.classList.toggle('owned', owned);
        if (noAdsLabel) noAdsLabel.textContent = owned ? 'Active' : 'No Ads';
    }
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
        const wrap = document.createElement('div');
        wrap.innerHTML = packDef
            ? getPackOfferMarkup(item, packDef, false)
            : getShopItemMarkup(item, false);
        const card = wrap.firstElementChild;
        if (packDef) {
            wirePackCardButtons(card, item, false);
        } else {
            const buyBtn = card.querySelector('[data-buy]');
            if (buyBtn) {
                if (owned) {
                    buyBtn.disabled = true;
                    buyBtn.innerHTML = 'OWNED';
                } else {
                    buyBtn.onclick = (e) => {
                        e.stopPropagation();
                        playSfx('tapAccent', 0.85);
                        playHaptic('tap');
                        buyShopItem(item.id);
                    };
                }
            }
        }
        grid.appendChild(card);
    });
}

function renderRealMoneyColumn() {
    const grid = document.getElementById('shop-real');
    if (!grid) return;
    grid.innerHTML = '';

    SHOP_SECTIONS.realMoney.filter((item) => !item.reward?.packKey).forEach((item) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = getShopItemMarkup(item, true);
        const card = wrap.firstElementChild;
        const buyBtn = card.querySelector('[data-buy]');
        if (buyBtn) {
            buyBtn.onclick = (e) => {
                e.stopPropagation();
                playSfx('tapAccent', 0.9);
                playHaptic('tap');
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
        }
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
        const best = getBestDropForPack(packKey);
        const heroSvg = best ? getRewardArtSvg(best.id, pack.rewardType === 'skin' ? 'skin' : 'chip') : '';
        const minis = getMiniDropsForPack(packKey);
        const box = document.createElement('div');
        box.innerHTML = `
            <div class="pack-card-v2 tier-${packKey}" data-pack="${packKey}">
                <div class="pack-foil"></div>
                <div class="pack-hero">
                    <div class="pack-hero-tag">★ Stored ${count > 1 ? `× ${count}` : ''}</div>
                    <div class="pack-tier-badge">${getRarityLabel(pack.rarity)}</div>
                    <div class="pack-hero-icon">${heroSvg}</div>
                </div>
                <div class="pack-mini-strip">
                    ${minis.map((m) => `<div class="pack-mini-drop tier-${m.tier}" title="${m.name}">${getMiniArtSvgInline(m.id, pack.rewardType === 'skin' ? 'skin' : 'chip')}</div>`).join('')}
                </div>
                <div class="pack-body">
                    <div class="pack-name">${pack.name}</div>
                    <div class="pack-sub">${formatPackOdds(pack)}</div>
                    <div class="pack-actions">
                        <button class="pack-peek-btn" type="button" data-peek="${packKey}">PEEK</button>
                        <button class="btn-glossy btn-gold" type="button" data-buy="1">OPEN</button>
                    </div>
                </div>
            </div>
        `;
        const card = box.firstElementChild;
        const openBtn = card.querySelector('[data-buy]');
        const peekBtn = card.querySelector('[data-peek]');
        if (openBtn) openBtn.onclick = (e) => { e.stopPropagation(); playSfx('tapAccent', 1); playHaptic('tap'); openStoredPack(packKey); };
        if (peekBtn) peekBtn.onclick = (e) => { e.stopPropagation(); playSfx('tap', 0.7); playHaptic('tap'); showPackPeek(packKey); };
        grid.appendChild(card);
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
        const equipped = save.equippedSkin === skinId;
        const box = renderFlipCard({
            id: skinId,
            type: 'skin',
            def: skin,
            count: 1,
            extraMeta: equipped ? 'EQUIPPED' : 'OWNED',
            cta: equipped ? 'EQUIPPED' : 'EQUIP SKIN',
            ctaDisabled: equipped,
            onCta: () => equipSkin(skinId)
        });
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
        const box = renderFlipCard({
            id: cardId,
            type: 'chip',
            def: card,
            count,
            extraMeta: `Tier ${card.tier} · Free ${sellable}`,
            cta: sellable <= 0 ? 'LOCKED' : `SELL ${getCardSellValue(cardId)}G`,
            ctaDisabled: sellable <= 0,
            onCta: () => sellInventoryCard(cardId)
        });
        grid.appendChild(box);
    });
}

window.equipSkin = function(skinId) {
    if (!save.skins.includes(skinId) || !SKIN_DEFINITIONS[skinId]) return;
    save.equippedSkin = skinId;
    saveSave();
    renderInventory();
    playSfx('upgrade', 0.9);
    playHaptic('soft');
    showToast(`${SKIN_DEFINITIONS[skinId].name} equipped.`);
};

window.toggleNeonTrail = function() {
    if (!save.premium?.neonTrail) return;
    save.premium.neonTrailEnabled = save.premium.neonTrailEnabled === false;
    saveSave();
    renderInventory();
    playSfx('upgrade', 0.75);
    playHaptic('soft');
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
        const box = renderFlipCard({
            id: cardId,
            type: 'chip',
            def: card,
            count,
            extraMeta: `Free ${Math.max(0, freeCopies)}`,
            cta: canEquip ? 'EQUIP' : 'NO SLOT',
            ctaDisabled: !canEquip,
            onCta: () => equipCard(cardId)
        });
        cardsGrid.appendChild(box);
    });
}

// Generic flippable card used in Loadout + Inventory.
// Front = peek-style hero art + name + tier; Back = stats + CTA + sigil.
function renderFlipCard({ id, type, def, count, extraMeta, cta, ctaDisabled, onCta }) {
    const wrap = document.createElement('div');
    const tier = (def.rarity || 'blue').toLowerCase();
    wrap.className = `flip-card rarity-${tier}`;
    const heroSvg = getRewardArtSvg(id, type);
    const tierLabel = getRarityLabel(tier);
    const statsHtml = describeCardEffect(type, def);
    wrap.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-face flip-front">
                <div class="flip-hero">
                    <div class="flip-tier-badge tier-${tier}">${tierLabel}</div>
                    ${count > 1 ? `<div class="flip-count">×${count}</div>` : ''}
                    <div class="flip-art">${heroSvg}</div>
                </div>
                <div class="flip-name">${def.name}</div>
                <div class="flip-meta">${extraMeta || ''}</div>
                <div class="flip-flip-hint">tap to flip</div>
            </div>
            <div class="flip-card-face flip-back">
                <div class="flip-back-title">${def.name}</div>
                <div class="flip-back-tier tier-${tier}">${tierLabel}${def.sigil ? ' · ' + def.sigil : ''}</div>
                <div class="flip-back-effect">${statsHtml}</div>
                ${cta ? `<button class="flip-back-cta ${ctaDisabled ? 'disabled' : ''}" type="button" ${ctaDisabled ? 'disabled' : ''}>${cta}</button>` : ''}
                <div class="flip-flip-hint">tap to flip</div>
            </div>
        </div>
    `;
    // Click anywhere flips the card; CTA button is excluded
    wrap.addEventListener('click', (e) => {
        if (e.target.closest('.flip-back-cta')) return;
        wrap.classList.toggle('flipped');
        playSfx && playSfx('tap', 0.6);
        playHaptic && playHaptic('tap');
    });
    const ctaBtn = wrap.querySelector('.flip-back-cta');
    if (ctaBtn && onCta && !ctaDisabled) {
        ctaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onCta();
        });
    }
    return wrap;
}

function describeCardEffect(type, def) {
    if (type === 'chip' && def.effect) {
        const parts = [];
        if (def.effect.damageMultiplier)      parts.push(`<div class="fx-stat">DMG <strong>${(def.effect.damageMultiplier > 0 ? '+' : '')}${(def.effect.damageMultiplier * 100).toFixed(0)}%</strong></div>`);
        if (def.effect.attackSpeedMultiplier) parts.push(`<div class="fx-stat">RPM <strong>${(def.effect.attackSpeedMultiplier > 0 ? '+' : '')}${(def.effect.attackSpeedMultiplier * 100).toFixed(0)}%</strong></div>`);
        if (def.effect.magnetFlat)            parts.push(`<div class="fx-stat">MAG <strong>+${def.effect.magnetFlat}</strong></div>`);
        return parts.join('') + (def.desc ? `<div class="fx-desc">${def.desc}</div>` : '');
    }
    if (type === 'skin') {
        return `<div class="fx-desc">${def.desc || ''}</div>`;
    }
    return def.desc || '';
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
    playHaptic('soft');
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
    playHaptic('soft');
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
    renderDailyLoginPanel();
    refreshMapRail();
    renderLeaderboard();
    renderLevelRoadmap();
    refreshLevelCta();
    playHaptic('soft');
};

// Build the vertical level path: current node centered, 1-2 nodes below (past),
// 2-3 nodes above (future), with chest icons next to the future ones.
function renderLevelRoadmap() {
    const host = document.getElementById('level-roadmap');
    if (!host) return;
    const cur = Math.max(1, save.unlocked || 1);
    // Show 8 future levels + current + 1 past (reading top → bottom).
    // Container is scrollable so player can scroll up to peek at later levels.
    const items = [];
    for (let i = 8; i >= -1; i--) {
        const lvl = cur + i;
        if (lvl < 1) continue;
        let state = 'future';
        if (lvl === cur) state = 'current';
        else if (lvl === cur + 1) state = 'future-soon';
        else if (lvl < cur) state = 'locked';
        // Chest icon every 3 levels above current as a reward teaser
        const chest = lvl > cur && (lvl - cur) % 3 === 0;
        items.push({ lvl, state, chest });
    }

    const chestSvg = `<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18"/><path d="M9 8c0-2 6-2 6 0"/></svg>`;

    let html = '';
    items.forEach((it, i) => {
        html += `<div class="lr-node ${it.state}" data-lvl="${it.lvl}">
            ${it.lvl}
            ${it.chest ? `<div class="lr-chest">${chestSvg}</div>` : ''}
        </div>`;
        if (i < items.length - 1) {
            // Line is "active" (green) when both endpoints are at-or-below current
            const lineActive = (items[i + 1].state === 'current' || items[i + 1].state === 'locked') ? 'line-active' : '';
            html += `<div class="lr-line ${lineActive}"></div>`;
        }
    });
    host.innerHTML = html;

    // Scroll so the CURRENT node sits in the lower-middle of the viewport
    // (so the user sees both their level and the next 2-3 levels above)
    requestAnimationFrame(() => {
        const currentEl = host.querySelector('.lr-node.current');
        if (currentEl) {
            const target = currentEl.offsetTop - host.clientHeight * 0.6;
            host.scrollTop = Math.max(0, target);
        }
    });
}

function refreshLevelCta() {
    const label = document.getElementById('primary-cta-label');
    const btn = document.getElementById('battle-button');
    if (label) label.textContent = `EBENE ${save.unlocked || 1}`;
    if (btn) btn.setAttribute('aria-label', `Start level ${save.unlocked || 1}`);
}

// Leaderboard overlay (right rail Rangliste button) — new design with flags
const LB_FLAGS = ['🇩🇪','🇮🇹','🇪🇸','🇫🇷','🇬🇧','🇺🇸','🇯🇵','🇧🇷','🇸🇪','🇰🇷','🇨🇦','🇲🇽'];
function _flagFor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return LB_FLAGS[h % LB_FLAGS.length];
}
const TROPHY_SVG = '<svg viewBox="0 0 24 24"><polygon points="6,4 18,4 17,9 12,11 7,9"/><path d="M12 11v5"/><polygon points="9,16 15,16 14,21 10,21"/></svg>';

window.openLeaderboardOverlay = function() {
    const overlay = document.getElementById('leaderboard-overlay');
    const list = document.getElementById('lb-rows-modal');
    if (!overlay || !list) return;
    const rows = getLeaderboardBots();
    const meIdx = rows.findIndex((r) => r.isYou);
    let html = '';
    rows.forEach((row, i) => {
        const rank = i + 1;
        // Insert "Aktionszone" divider just BEFORE the player's row, but not at top of list
        if (i === meIdx && meIdx > 3) {
            html += `<div class="lb-action-divider">
                <span class="lb-action-arrow"><svg viewBox="0 0 24 24"><polyline points="6,15 12,9 18,15"/></svg></span>
                Aktionszone
                <span class="lb-action-arrow"><svg viewBox="0 0 24 24"><polyline points="6,15 12,9 18,15"/></svg></span>
            </div>`;
        }
        const flag = row.isYou ? '🇩🇪' : _flagFor(row.name);
        const display = row.isYou ? `Player_${(save.leaderboardSeed || 7).toString().slice(-4)}` : row.name;
        html += `
            <div class="lb-row-v2 ${row.isYou ? 'you' : ''}">
                <span class="lb-r-rank">${rank}</span>
                <span class="lb-r-name">${display}</span>
                <span class="lb-r-flag">${flag}</span>
                <span class="lb-r-score">${row.score.toLocaleString()} ${TROPHY_SVG}</span>
            </div>
        `;
    });
    list.innerHTML = html;

    // Update countdown timer to next reset (just a friendly "1D HH" estimate)
    const timer = document.getElementById('lb-timer');
    if (timer) {
        const now = new Date();
        const sundayMidnight = new Date(now);
        sundayMidnight.setHours(24, 0, 0, 0);
        sundayMidnight.setDate(sundayMidnight.getDate() + ((7 - sundayMidnight.getDay()) % 7));
        const diff = sundayMidnight - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        timer.textContent = `${days}D:${String(hours).padStart(2, '0')}H`;
    }

    overlay.classList.add('active');
    playSfx('peekOpen', 0.85);
    playHaptic('peek');
};
window.closeLeaderboardOverlay = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('leaderboard-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.showHub = function() {
    showScreen('hub-screen');
    setActiveNav('nav-hub');
    renderHub();
    updateMetaHud();
    playHaptic('soft');
};

window.showShop = function() {
    showScreen('shop-screen');
    setActiveNav('nav-shop');
    renderShop();
    updateMetaHud();
    playHaptic('soft');
};

window.showInventory = function() {
    showScreen('inventory-screen');
    setActiveNav('nav-inventory');
    renderInventory();
    updateMetaHud();
    playHaptic('soft');
};

window.showLoadout = function() {
    showScreen('loadout-screen');
    setActiveNav('nav-loadout');
    renderLoadout();
    updateMetaHud();
    playHaptic('soft');
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
        blue:   { sfx: 'revealCommon',   intensity: 0.95, haptic: [24],                          shake: 0.25, pulse: 0.20, color: '#2b96ff', burst: 22, hapticName: 'revealCommon', tier: 'common',    fanfare: false, jackpot: false },
        dark:   { sfx: 'revealRare',     intensity: 0.95, haptic: [40, 30, 40],                  shake: 0.35, pulse: 0.30, color: '#5566ff', burst: 28, hapticName: 'revealRare',   tier: 'rare',      fanfare: false, jackpot: false },
        purple: { sfx: 'revealEpic',     intensity: 1.05, haptic: [70, 30, 70, 30, 70],          shake: 0.65, pulse: 0.50, color: '#bc13fe', burst: 40, hapticName: 'revealEpic',   tier: 'epic',      fanfare: false, jackpot: false },
        red:    { sfx: 'revealLegendary',intensity: 1.10, haptic: [180, 60, 180, 60, 240],       shake: 1.10, pulse: 0.75, color: '#ff375f', burst: 56, hapticName: 'revealLegendary', tier: 'legendary', fanfare: true,  jackpot: true  },
        gold:   { sfx: 'revealLegendary',intensity: 1.30, haptic: [220, 80, 220, 80, 220, 80, 360], shake: 1.50, pulse: 1.00, color: '#ffd14d', burst: 72, hapticName: 'revealLegendary', tier: 'legendary', fanfare: true,  jackpot: true  }
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
    const viewport = overlay ? overlay.querySelector('.pack-viewport') : null;
    const result = document.getElementById('pack-result');
    const claimButton = document.getElementById('pack-claim-button');
    const subtitle = document.getElementById('pack-subtitle');
    if (!overlay || !track || !viewport || !result || !claimButton || !subtitle) return;

    packOpeningState = { winnerId, packKey, claimed: false, claimReady: false };
    subtitle.textContent = `${packDef.name} | ${formatPackOdds(packDef)}`;
    result.textContent = 'Opening pack...';
    result.className = 'pack-result';
    claimButton.disabled = true;
    track.style.transform = 'translateX(0px)';
    track.innerHTML = reel.map((rewardId) => packDef.rewardType === 'skin' ? createSkinPackMarkup(rewardId) : createPackCardMarkup(rewardId)).join('');

    // tier-driven glow on the stage
    const packContent = document.getElementById('pack-content');
    if (packContent) {
        packContent.dataset.tier = packDef.rarity;
        packContent.classList.remove('jackpot');
    }
    // reset confetti
    const confetti = document.getElementById('pack-confetti');
    if (confetti) confetti.innerHTML = '';
    // arm rip overlay (curtains close before reveal)
    const rip = document.getElementById('pack-rip');
    if (rip) {
        rip.classList.remove('rip-active', 'hidden');
    }

    overlay.classList.add('active');

    // play the rip sound + haptic, then open the curtains and start build-up
    playPackRip();
    playHaptic('packRip');
    setTimeout(() => {
        if (rip) rip.classList.add('rip-active');
    }, 280);
    setTimeout(() => {
        if (rip) rip.classList.add('hidden');
    }, 1300);
    // build-up audio that crescendos roughly to the reveal
    playBuildUp(8.0);

    window.cancelAnimationFrame(packAnimationFrame);
    const items = [...track.children];
    const viewportCenter = viewport.clientWidth * 0.5;
    const itemCenters = items.map((item) => item.offsetLeft + (item.offsetWidth * 0.5));
    const targetOffset = Math.max(0, itemCenters[winnerIndex] - viewportCenter);
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
        // Tiny permanent stat trickle for the player (small but feels good across many opens)
        trickleBoostFromReward(wonReward.rarity);
        saveSave();
        renderInventory();
        const feedback = getPackRevealFeedback(wonReward.rarity);
        packOpeningState.claimReady = true;
        result.textContent = `Unlocked: ${wonReward.name} | ${getRarityLabel(wonReward.rarity)}`;
        result.className = `pack-result rarity-${wonReward.rarity} ${(wonReward.rarity === 'red' || wonReward.rarity === 'gold') ? 'pack-jackpot' : ''}`.trim();

        // re-tint the stage glow to the WINNING rarity (more dopamine)
        if (packContent) {
            packContent.dataset.tier = wonReward.rarity;
            if (feedback.jackpot) {
                packContent.classList.add('jackpot');
                setTimeout(() => packContent.classList.remove('jackpot'), 1700);
            }
        }

        // primary reveal sound + haptic
        playSfx(feedback.sfx, feedback.intensity);
        playHaptic(feedback.hapticName);

        // jackpot fanfare + confetti for legendary tier
        if (feedback.fanfare) {
            playJackpotFanfare();
            spawnPackConfetti(feedback.color, wonReward.rarity === 'gold' ? 38 : 26);
        }

        // canvas screen shake + particle burst (still works in lobby because canvas exists)
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

        const currentCenter = offset + viewportCenter;
        let currentIndex = lastIndex;
        for (let i = Math.max(0, lastIndex + 1); i < itemCenters.length; i++) {
            if (itemCenters[i] > currentCenter) break;
            currentIndex = i;
        }
        if (currentIndex > lastIndex) {
            const deltaOffset = Math.max(1, offset - lastOffset);
            const deltaTime = Math.max(1, timestamp - lastTickTime) / 1000;
            const speed = deltaOffset / deltaTime;
            const intensity = Math.max(0.55, Math.min(1.18, speed / 850));
            for (let i = lastIndex + 1; i <= currentIndex; i++) {
                playSfx('caseTick', intensity);
                playHaptic('packTick');
            }
            lastIndex = currentIndex;
            lastTickTime = timestamp;
        }

        if (t >= 1) {
            track.style.transform = `translateX(-${targetOffset}px)`;
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
    playHaptic(getUpgradeTierInfo(upgrade, level).isMajor ? 'hard' : 'medium');
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
        playHaptic('medium');
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
    playHaptic('medium');
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
    playHaptic('medium');
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
        playHaptic('medium');
        showToast(`${formatCompactNumber(item.reward.gold)} gold added. Premium checkout simulated.`);
        return;
    }

    if (item.reward?.gems) {
        save.gems += item.reward.gems;
        saveSave();
        renderShop();
        updateMetaHud();
        playSfx('upgrade', 0.9);
        playHaptic('medium');
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
    playHaptic('medium');
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
    const earlyDamageBoost = currentLevel <= 10 ? 1.18 : currentLevel <= 20 ? 1.04 : 1;
    const damageUpgrade = getUpgradeBonus(PLAYER_STATS.dmg, save.stats.dmg, 'dmg');
    const fireRateUpgrade = getUpgradeBonus(PLAYER_STATS.atkSpd, save.stats.atkSpd, 'atkSpd');
    const baseDamage = (PLAYER_STATS.dmg.base + damageUpgrade) * Math.max(0.18, 1 + inventory.damageMultiplier + milestone.damageMultiplier) * earlyDamageBoost;
    const speed = PLAYER_STATS.speed.base * (1 + inventory.speedMultiplier);
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
    const ability = ABILITIES.find((a) => a.id === id);
    if (!ability || !ability.tree) return '';
    const nextIdx = Math.min(ability.tree.length - 1, rank);
    const next = ability.tree[nextIdx];
    return next ? next.desc : '';
}

function getAbilityIconMarkup(id, fallback) {
    const svgs = {
        damage_boost: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18 L13 5 L18 18"/><line x1="9.5" y1="14" x2="16.5" y2="14"/><line x1="13" y1="5" x2="13" y2="2"/><polyline points="10.5,4 13,2 15.5,4"/></svg>`,
        rapid_fire: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="4" y1="18" x2="20" y2="18"/><polyline points="17,5.5 21,8 17,10.5" stroke-linejoin="round"/><polyline points="17,10.5 21,13 17,15.5" stroke-linejoin="round"/><polyline points="17,15.5 21,18 17,20.5" stroke-linejoin="round"/></svg>`,
        multi: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="21" x2="13" y2="6"/><line x1="7" y1="21" x2="9" y2="6"/><line x1="19" y1="21" x2="17" y2="6"/><polyline points="11,8 13,6 15,8"/><polyline points="5.5,8.5 7.5,6.5 9.5,8.5"/><polyline points="16.5,8.5 18.5,6.5 20.5,8.5"/></svg>`,
        pierce: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="3" y1="13" x2="23" y2="13"/><polyline points="18,9 23,13 18,17" stroke-linejoin="round"/><circle cx="8" cy="13" r="2.5"/><circle cx="15" cy="13" r="2.5"/></svg>`,
        chain_lightning: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,2 9,13 13.5,13 10,24"/><line x1="4" y1="7" x2="8.5" y2="11.5" stroke-width="1.2" stroke-dasharray="2 2"/><line x1="22" y1="7" x2="17.5" y2="11.5" stroke-width="1.2" stroke-dasharray="2 2"/><line x1="4" y1="19" x2="9.5" y2="16.5" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="4" cy="7" r="1.8" fill="currentColor" stroke="none"/><circle cx="22" cy="7" r="1.8" fill="currentColor" stroke="none"/><circle cx="4" cy="19" r="1.8" fill="currentColor" stroke="none"/></svg>`,
        tornado_shot: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4,7 Q13,3.5 22,7" stroke-width="1.8"/><path d="M6.5,12 Q13,9.5 19.5,12" stroke-width="1.6"/><path d="M9,17 Q13,15 17,17" stroke-width="1.4"/><line x1="13" y1="17" x2="13" y2="22" stroke-width="1.6"/><path d="M11,22 Q13,24.5 15,22" stroke-width="1.3"/></svg>`,
        echo_shot: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="3" stroke-width="1.8"/><circle cx="13" cy="13" r="6.5" stroke-width="1.2" stroke-dasharray="3 2"/><circle cx="13" cy="13" r="10" stroke-width="1" stroke-dasharray="2 3"/><line x1="13" y1="3" x2="13" y2="6.5" stroke-width="1.5"/><line x1="13" y1="19.5" x2="13" y2="23" stroke-width="1.5"/></svg>`,
        ion_round: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><ellipse cx="13" cy="13" rx="3.5" ry="10" stroke-width="1.8"/><ellipse cx="13" cy="13" rx="10" ry="3.5" stroke-width="1.8"/><circle cx="13" cy="13" r="2" fill="currentColor" stroke="none"/></svg>`,
        shock_nova: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="5" stroke-width="1.8"/><line x1="13" y1="2" x2="13" y2="7" stroke-width="1.6"/><line x1="13" y1="19" x2="13" y2="24" stroke-width="1.6"/><line x1="2" y1="13" x2="7" y2="13" stroke-width="1.6"/><line x1="19" y1="13" x2="24" y2="13" stroke-width="1.6"/><line x1="5" y1="5" x2="8.2" y2="8.2" stroke-width="1.4"/><line x1="21" y1="5" x2="17.8" y2="8.2" stroke-width="1.4"/><line x1="5" y1="21" x2="8.2" y2="17.8" stroke-width="1.4"/><line x1="21" y1="21" x2="17.8" y2="17.8" stroke-width="1.4"/></svg>`,
        heal_heart: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13,21 C13,21 4,15 4,9 C4,6.2 6.2,4 9,4 C10.8,4 12.3,5 13,6.2 C13.7,5 15.2,4 17,4 C19.8,4 22,6.2 22,9 C22,15 13,21 13,21Z"/><line x1="13" y1="9" x2="13" y2="15"/><line x1="10" y1="12" x2="16" y2="12"/></svg>`,
        orbiter: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="2.5" stroke-width="1.8"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2" transform="rotate(60 13 13)"/><ellipse cx="13" cy="13" rx="10" ry="4.5" stroke-width="1.3" stroke-dasharray="3 2" transform="rotate(120 13 13)"/></svg>`,
        phoenix_drive: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13,2 L15.5,9 L23,9 L17,14 L19.5,22 L13,17.5 L6.5,22 L9,14 L3,9 L10.5,9 Z"/></svg>`,
        singularity: `<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="13" cy="13" r="3.5" stroke-width="1.8"/><circle cx="13" cy="13" r="7" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="13" cy="13" r="10.5" stroke-width="1" stroke-dasharray="1 3"/><line x1="4" y1="4" x2="9" y2="9" stroke-width="1.3"/><line x1="22" y1="4" x2="17" y2="9" stroke-width="1.3"/><line x1="4" y1="22" x2="9" y2="17" stroke-width="1.3"/><line x1="22" y1="22" x2="17" y2="17" stroke-width="1.3"/></svg>`,
        // ── 25+ NEW ABILITY ICONS ─────────────────────────────────
        cluster_bomb:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="13" cy="14" rx="5.5" ry="6.5"/><line x1="13" y1="2" x2="13" y2="7"/><line x1="13" y1="11" x2="13" y2="14"/><line x1="11" y1="13" x2="15" y2="13"/><circle cx="6" cy="22" r="1.5"/><circle cx="20" cy="22" r="1.5"/></svg>`,
        ricochet:         `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,5 11,12 3,19 11,15 19,22 23,17 19,11 23,5"/><circle cx="3" cy="5" r="1" fill="currentColor"/><circle cx="23" cy="17" r="1" fill="currentColor"/></svg>`,
        vampire:          `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13,21 C13,21 4,15 4,9 C4,6.2 6.2,4 9,4 C10.8,4 12.3,5 13,6.2 C13.7,5 15.2,4 17,4 C19.8,4 22,6.2 22,9 C22,15 13,21 13,21Z"/><polyline points="10,9 11,12 13,11"/><polyline points="13,11 15,14 16,9"/></svg>`,
        frost_shot:       `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="3" x2="13" y2="23"/><line x1="3" y1="13" x2="23" y2="13"/><line x1="6" y1="6" x2="20" y2="20"/><line x1="20" y1="6" x2="6" y2="20"/><circle cx="13" cy="13" r="2"/></svg>`,
        poison_dart:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,22 13,4 22,22"/><line x1="13" y1="11" x2="13" y2="18"/><circle cx="13" cy="14" r="1" fill="currentColor"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="17" cy="20" r="1" fill="currentColor"/></svg>`,
        bullet_storm:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 8 Q13 3 23 8" stroke-width="2"/><path d="M3 13 Q13 8 23 13" stroke-width="1.6"/><path d="M3 18 Q13 13 23 18" stroke-width="1.4"/><path d="M3 23 Q13 18 23 23" stroke-width="1.2"/></svg>`,
        lucky_seven:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,5 20,5 12,22"/><circle cx="13" cy="13" r="11" stroke-width="1" stroke-dasharray="2 2"/></svg>`,
        crit_chance:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="9"/><circle cx="13" cy="13" r="5"/><circle cx="13" cy="13" r="1.5" fill="currentColor"/><line x1="13" y1="2" x2="13" y2="6"/><line x1="13" y1="20" x2="13" y2="24"/><line x1="2" y1="13" x2="6" y2="13"/><line x1="20" y1="13" x2="24" y2="13"/></svg>`,
        glass_cannon:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="6,4 20,4 18,22 8,22"/><line x1="9" y1="9" x2="11" y2="20"/><line x1="13" y1="6" x2="13" y2="22"/><line x1="17" y1="9" x2="15" y2="20"/></svg>`,
        lich_bullets:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="9" r="5"/><circle cx="13" cy="9" r="2" fill="currentColor"/><polyline points="13,14 8,22"/><polyline points="13,14 13,22"/><polyline points="13,14 18,22"/></svg>`,
        platinum_rounds:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="9"/><polygon points="13,7 16,11 13,15 10,11"/><line x1="13" y1="15" x2="13" y2="19"/></svg>`,
        blank_burst:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="4"/><circle cx="13" cy="13" r="8" stroke-dasharray="2 3"/><line x1="5" y1="5" x2="21" y2="21"/></svg>`,
        strong_spirit:    `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 22s-9-6-9-13a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13z"/><ellipse cx="13" cy="6" rx="6" ry="2.5" stroke-dasharray="2 2"/></svg>`,
        bloodlust:        `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="9" r="5"/><polyline points="9,15 13,22 17,15"/><circle cx="13" cy="9" r="2" fill="currentColor"/></svg>`,
        trigger_fingers:  `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,18 10,12 14,16 22,6"/><polyline points="17,6 22,6 22,11"/></svg>`,
        scarier_face:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9 C 5 4, 21 4, 21 9 C 21 18, 5 18, 5 9z"/><circle cx="9.5" cy="11" r="1.5" fill="currentColor"/><circle cx="16.5" cy="11" r="1.5" fill="currentColor"/><polyline points="9,18 11,21 13,18 15,21 17,18"/></svg>`,
        saw_blade:        `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="6"/><line x1="13" y1="2" x2="13" y2="6"/><line x1="13" y1="20" x2="13" y2="24"/><line x1="2" y1="13" x2="6" y2="13"/><line x1="20" y1="13" x2="24" y2="13"/><line x1="5" y1="5" x2="8" y2="8"/><line x1="21" y1="5" x2="18" y2="8"/><line x1="5" y1="21" x2="8" y2="18"/><line x1="21" y1="21" x2="18" y2="18"/></svg>`,
        boomerang:        `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22 Q4 4, 22 4 Q4 22, 4 22z"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg>`,
        spread_volley:    `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="13" y1="22" x2="6" y2="4"/><line x1="13" y1="22" x2="13" y2="3"/><line x1="13" y1="22" x2="20" y2="4"/><polyline points="4,7 6,4 8.5,7"/><polyline points="11,5 13,3 15,5"/><polyline points="18,7 20,4 22,7"/></svg>`,
        crit_bomb:        `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,3 17,11 25,12 19,17 21,25 13,21 5,25 7,17 1,12 9,11"/><circle cx="13" cy="14" r="2" fill="currentColor"/></svg>`,
        phantom_shield:   `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 L22 7 V14 C22 18, 18 22, 13 23 C8 22, 4 18, 4 14 V7 Z"/><polyline points="9,13 12,16 17,10"/></svg>`,
        arc_pulse:        `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="3"/><path d="M7 7 Q13 4 19 7"/><path d="M19 19 Q13 22 7 19"/><line x1="2" y1="13" x2="6" y2="13"/><line x1="20" y1="13" x2="24" y2="13"/></svg>`,
        heat_seeker:      `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="5"/><circle cx="13" cy="13" r="9" stroke-dasharray="3 3"/><line x1="13" y1="13" x2="22" y2="4"/><polyline points="18,4 22,4 22,8"/></svg>`,
        glass_shards:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,3 16,9 13,11 10,9"/><polygon points="4,12 10,11 7,17"/><polygon points="22,12 19,17 16,11"/><polygon points="13,15 17,20 13,23 9,20"/></svg>`,
        combo_multiplier: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,18 8,11 13,15 18,5 22,9"/><polyline points="20,5 22,5 22,7"/><line x1="3" y1="22" x2="22" y2="22"/></svg>`,
        fortune_coin:     `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="9"/><polyline points="10,10 16,10 13,16 16,16"/><line x1="13" y1="6" x2="13" y2="20"/></svg>`
    };
    const wrap = svgs[id];
    if (wrap) return `<div class="ability-icon ability-${id}">${wrap}</div>`;
    return fallback;
}

// (Removed duplicate drawAbilityChoices + applyAbility — earlier definitions
// at lines ~2117 and ~2165 are now the active versions, with the colored
// rarity-tier picker and the rank-tier-aware effect logic.)

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
    const hpBefore = player.hp;
    player.hp -= 1;
    player.invulnerable = 0.9;

    // STRONGER heart-loss feedback: red full-screen flash, harder shake, particle burst,
    // HUD-heart shake animation flag, big -1 text, body class for CSS pulse.
    addP(player.x, player.y, source === 'boss' ? '#ff375f' : '#ffffff', 28, 220, 0.45, 4);
    addP(player.x, player.y, '#ff375f', 12, 320, 0.35, 5); // extra red splash
    addFxText(player.x, player.y - 20, '-1', '#ff375f', 0.7, 30);
    screenShake = Math.min(3.6, screenShake + (source === 'boss' ? 1.4 : 0.95));
    powerPulse = Math.min(2.6, powerPulse + 0.4);
    playSfx('hit', source === 'boss' ? 1.25 : 1.1);
    playSfx('death', 0.4); // small ominous low note layered on every -1
    playHaptic(source === 'boss' ? 'hard' : 'hard');

    // Trigger HUD heart shake/lost animation
    window.__heartDamageTime = performance.now();
    window.__heartLostIdx = hpBefore - 1; // the heart that just got depleted
    // Body class for CSS-driven full-screen flash
    document.body.classList.add('hp-flash');
    if (window.__hpFlashTimer) clearTimeout(window.__hpFlashTimer);
    window.__hpFlashTimer = setTimeout(() => document.body.classList.remove('hp-flash'), 400);

    syncHpDangerFlair();

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
    playHaptic('soft');
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
    // Sort by unlockLevel ASC so e.g. lvl 6 skill sits near top, not buried at the bottom
    const sortedAbilities = [...ABILITIES].sort((a, b) => {
        const ua = a.unlockLevel || 1;
        const ub = b.unlockLevel || 1;
        if (ua !== ub) return ua - ub;
        // Tiebreaker: rarity order (common first), then name
        const order = { common: 0, rare: 1, epic: 2, legendary: 3 };
        const ra = order[a.rarity] ?? 0;
        const rb = order[b.rarity] ?? 0;
        if (ra !== rb) return ra - rb;
        return (a.name || '').localeCompare(b.name || '');
    });
    sortedAbilities.forEach((ability) => {
        const unlocked = (ability.unlockLevel || 1) <= save.unlocked;
        const baseTier = (ability.rarity || 'common').toLowerCase();
        const card = document.createElement('div');
        // Old-style clean card: icon + title + meta line + 1-line desc + button.
        // No tree dots in archive (those clutter and the user dislikes them).
        card.className = `shop-card ability-card ability-archive-card rarity-tier-${baseTier} ability-${ability.id} ${unlocked ? 'unlocked-now' : 'locked'}`.trim();
        card.innerHTML = `
            ${getAbilityIconMarkup(ability.id, ability.icon)}
            <div class="card-title">${ability.name}</div>
            <div class="card-meta ${unlocked ? '' : 'locked-meta'}">
                ${baseTier.toUpperCase()} | Freigeschaltet ab Lv ${ability.unlockLevel}
            </div>
            <div class="card-copy">${ability.desc}</div>
            <button class="archive-cta" type="button" ${unlocked ? '' : 'disabled'}>
                ${unlocked ? 'JETZT VERFUEGBAR' : `AB LV ${ability.unlockLevel}`}
            </button>
        `;
        if (unlocked) {
            // Click anywhere on the card opens the full detail (with tree visualization)
            card.onclick = (ev) => {
                ev.stopPropagation();
                showAbilityDetail(ability.id);
            };
        }
        grid.appendChild(card);
    });
}

function showAbilityDetail(abilityId) {
    try {
        const ability = ABILITIES.find((a) => a.id === abilityId);
        if (!ability) return;
        const overlay = document.getElementById('ability-detail-overlay');
        const content = document.getElementById('ability-detail-content');
        const card = document.getElementById('ability-detail-card');
        if (!overlay || !content || !card) return;

        const tier = (ability.rarity || 'common').toLowerCase();
        const tierLabels = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
        const rarityLabel = tierLabels[tier] || tier;
        const currentRank = (gameRunning && player?.abilityRanks?.[ability.id]) || 0;
        const tree = ability.tree || [{ name: ability.name, tier, desc: ability.desc }];

        // Inline SVG icon directly (no DOM gymnastics — that was the crash source)
        const iconHtml = getAbilityIconMarkup(ability.id, ability.icon) || '';

        const statRow = buildAbilityDetailStats(ability, currentRank);

        // Tree rows: each rank gets a colored row with name + tier pill + desc
        const treeRows = tree.map((node, i) => {
            const state = i < currentRank ? 'owned' : i === currentRank ? 'next' : 'future';
            const nodeTier = (node.tier || tier).toLowerCase();
            return `
                <div class="ability-tree-row state-${state} tier-${nodeTier}">
                    <div class="tree-row-bullet"></div>
                    <div class="tree-row-body">
                        <div class="tree-row-head">
                            <span class="tree-row-name">${node.name}</span>
                            <span class="rarity-tag tier-${nodeTier}">${nodeTier}</span>
                        </div>
                        <div class="tree-row-desc">${node.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        content.classList.remove('tier-common', 'tier-rare', 'tier-epic', 'tier-legendary');
        content.classList.add(`tier-${tier}`);

        // Single innerHTML write — SVG sizing handled via CSS, no replaceChild
        card.innerHTML = `
            <div class="ability-detail-title">${ability.name}</div>
            <div class="ability-detail-icon-wrap">
                <div class="detail-arc-container">
                    <svg class="detail-arc-svg" viewBox="0 0 220 220">
                        <ellipse class="detail-arc-path"     cx="110" cy="110" rx="100" ry="40" transform="rotate(-20 110 110)"/>
                        <ellipse class="detail-arc-path alt" cx="110" cy="110" rx="85"  ry="35" transform="rotate(40 110 110)"/>
                    </svg>
                </div>
                <div class="neon-svg">${iconHtml}</div>
            </div>
            <div class="ability-detail-stats">${statRow}</div>
            <div class="ability-detail-desc">${ability.desc}</div>
            <div class="ability-detail-tree-block">
                <div class="ability-detail-tree-title">Skill Tree · ${currentRank}/${tree.length}</div>
                <div class="ability-detail-tree-list">${treeRows}</div>
            </div>
            <div class="ability-detail-rarity">${rarityLabel}</div>
        `;

        // Apply rarity color to the inline SVG via CSS variable on the icon wrapper
        const innerWrap = card.querySelector('.neon-svg .ability-icon');
        if (innerWrap) {
            innerWrap.style.color = 'var(--detail-stroke)';
            const innerSvg = innerWrap.querySelector('svg');
            if (innerSvg) {
                innerSvg.style.width = '100%';
                innerSvg.style.height = '100%';
                innerSvg.removeAttribute('width');
                innerSvg.removeAttribute('height');
            }
        }

        overlay.classList.add('active');
        if (typeof playHaptic === 'function') playHaptic('peek');
    } catch (err) {
        console.warn('showAbilityDetail failed:', err);
    }
}

function buildAbilityDetailStats(ability, rank) {
    const tier = (ability.rarity || 'common').toLowerCase();
    const tierLevels = { common: 1, rare: 2, epic: 3, legendary: 4 };
    const tierStars = '★'.repeat(tierLevels[tier] || 1) + '☆'.repeat(4 - (tierLevels[tier] || 1));
    const treeLen = ability.tree?.length || 1;
    const rankLabel = rank > 0 ? `Lv ${rank}/${treeLen}` : 'NEW';
    const unlockLabel = `Lv ${ability.unlockLevel || 1}`;
    return `
        <div class="ability-detail-stat">
            <span class="ability-detail-stat-label">Tier</span>
            <span class="ability-detail-stat-value">${tierStars}</span>
        </div>
        <div class="ability-detail-stat-divider"></div>
        <div class="ability-detail-stat">
            <span class="ability-detail-stat-label">Status</span>
            <span class="ability-detail-stat-value">${rankLabel}</span>
        </div>
        <div class="ability-detail-stat-divider"></div>
        <div class="ability-detail-stat">
            <span class="ability-detail-stat-label">Unlock</span>
            <span class="ability-detail-stat-value">${unlockLabel}</span>
        </div>
    `;
}

function closeAbilityDetail(event) {
    // when called from the overlay backdrop click, only close if the backdrop itself was clicked
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('ability-detail-overlay');
    if (overlay) overlay.classList.remove('active');
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
    updateUpgradeNotifier();
    renderDailyLoginPanel();

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

    if (label) label.textContent = currentMode === 'endless' ? `Endless · Wave ${currentWave + 1}` : `Level ${save.unlocked}`;
    if (desc) {
        const previewDrone = formatCompactNumber(getEnemyLevelStats('drone', save.unlocked).hp);
        const waves = getLevelWaves(save.unlocked).length;
        desc.textContent = currentMode === 'endless'
            ? `Infinite waves with almost no gold payout. Starts around Level ${save.unlocked}. Drone HP: ${previewDrone}.`
            : `Spikes werden jetzt deutlich haerter. ${waves} waves. Drone HP: ${previewDrone}.${nextMilestone ? ` Next power spike: Lv ${nextMilestone.level}.` : ''}`;
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
    installSwipeNavigation();
    document.addEventListener('pointerdown', ensureMusicEngine, { once: true });
    window.addEventListener('resize', resizeCanvas);
});
