const WALL = 10;

const PLAYER_STATS = {
    hearts: { base: 3 },
    dmg: { name: 'Damage', base: 1, steps: [0.22, 0.3, 0.45, 0.7, 1.05] },
    atkSpd: { name: 'Fire Rate', base: 1, steps: [0.06, 0.08, 0.12, 0.18, 0.24] },
    range: { name: 'Range', base: 420, inc: 24 },
    speed: { name: 'Speed', base: 230, steps: [10, 14, 20, 28, 38] },
    armor: { name: 'Armor', base: 0, inc: 1 },
    magnet: { name: 'Magnet', base: 130, inc: 16 }
};

const UPGRADES = [
    { id: 'dmg', name: 'Schaden', icon: 'DMG', color: '#ffb100', seedCosts: [28, 44, 66, 96, 136, 188], tailGrowth: 1.185, tailFlat: 36, max: 30, desc: 'Mehr Basisschaden pro Run.' },
    { id: 'atkSpd', name: 'Feuerrate', icon: 'RPM', color: '#1ec8ff', seedCosts: [30, 48, 72, 104, 148, 202], tailGrowth: 1.18, tailFlat: 38, max: 30, desc: 'Schnellere Volleys und fluessigeres Combat.' },
    { id: 'speed', name: 'Triebwerk', icon: 'SPD', color: '#00ff9d', seedCosts: [24, 38, 58, 86, 122, 170], tailGrowth: 1.175, tailFlat: 30, max: 30, desc: 'Mehr Tempo zum Dodgen.' }
];

const ABILITIES = [
    { id: 'damage_boost', name: 'Damage +30%', desc: 'Ein cleaner 30% Damage Boost.', icon: 'DMG', rarity: 'common', unlockLevel: 1 },
    { id: 'rapid_fire', name: 'Rapid Barrel', desc: '18% mehr Feuerrate.', icon: 'ROF', rarity: 'common', unlockLevel: 1 },
    { id: 'multi', name: 'Twin Volley', desc: '+1 zusaetzliches Projektil.', icon: 'VOL', rarity: 'common', unlockLevel: 1 },
    { id: 'pierce', name: 'Pierce Core', desc: 'Schuesse durchdringen einen weiteren Feind.', icon: 'PRC', rarity: 'rare', unlockLevel: 5 },
    { id: 'orbiter', name: 'Defense Drone', desc: 'Eine Drohne kreist um dein Schiff.', icon: 'ORB', rarity: 'rare', unlockLevel: 8 },
    { id: 'echo_shot', name: 'Echo Shot', desc: 'Jede vierte Volley feuert einen Echo-Schuss mit.', icon: 'ECH', rarity: 'rare', unlockLevel: 10 },
    { id: 'heal_heart', name: 'Patch Heart', desc: 'Stellt ein Herz wieder her.', icon: 'HP+', rarity: 'rare', unlockLevel: 12 },
    { id: 'chain_lightning', name: 'Kettenblitz', desc: 'Treffer springen auf nahe Gegner ueber.', icon: 'ARC', rarity: 'epic', unlockLevel: 15 },
    { id: 'tornado_shot', name: 'Tornado Shot', desc: 'Jede dritte Volley feuert Tornado-Schuesse.', icon: 'TOR', rarity: 'epic', unlockLevel: 15 },
    { id: 'phoenix_drive', name: 'Phoenix Drive', desc: 'Bei Herzverlust explodierst du in einer Feuerwelle.', icon: 'PHX', rarity: 'epic', unlockLevel: 15 },
    { id: 'ion_round', name: 'Ion Round', desc: 'Jede fuenfte Volley laedt ein starkes Ion-Geschoss.', icon: 'ION', rarity: 'epic', unlockLevel: 28 },
    { id: 'shock_nova', name: 'Shock Nova', desc: 'Alle 12 Kills entlaedt sich ein Blitzkreis.', icon: 'NVA', rarity: 'epic', unlockLevel: 36 },
    { id: 'singularity', name: 'Singularity', desc: 'Jede achte Volley erzeugt kurz ein Zugfeld.', icon: 'SGR', rarity: 'epic', unlockLevel: 52 }
];

const ENEMY_TYPES = {
    drone: { hp: 5, spd: 1.55, r: 13, color: '#00f2ff', glow: '#00f2ff', exp: 1, ai: 'strafe' },
    chaser: { hp: 8, spd: 1.95, r: 12, color: '#bc13fe', glow: '#bc13fe', exp: 2, ai: 'sprint' },
    tank: { hp: 10, spd: 0.95, r: 20, color: '#ff9d00', glow: '#ff9d00', exp: 3, ai: 'heavy' },
    boss: { hp: 26, spd: 1.08, r: 50, color: '#ff375f', glow: '#ff375f', exp: 10, ai: 'boss', isBoss: true }
};

function getEnemyLevelStats(typeKey, level) {
    const base = ENEMY_TYPES[typeKey];
    let scale = 1;

    if (level <= 10) {
        scale = 1 + ((level - 1) * 0.04);
    } else if (level <= 25) {
        scale = (1 + (9 * 0.04)) * Math.pow(1.082, level - 10);
    } else if (level <= 60) {
        scale = (1 + (9 * 0.04)) * Math.pow(1.082, 15) * Math.pow(1.068, level - 25);
    } else {
        scale = (1 + (9 * 0.04)) * Math.pow(1.082, 15) * Math.pow(1.068, 35) * Math.pow(1.045, level - 60);
    }

    return {
        ...base,
        hp: Math.max(2, Math.round(base.hp * scale))
    };
}

function getUpgradeCost(upgrade, level) {
    if (level >= upgrade.max) return null;
    if (level < upgrade.seedCosts.length) return upgrade.seedCosts[level];

    let cost = upgrade.seedCosts[upgrade.seedCosts.length - 1];
    for (let i = upgrade.seedCosts.length; i <= level; i++) {
        cost = (cost * upgrade.tailGrowth) + upgrade.tailFlat;
    }
    return Math.round(cost);
}

function getLevelGoldReward(level) {
    if (level <= 10) return 95 + (level * 26);
    if (level <= 30) return 355 + ((level - 10) * 16);
    if (level <= 70) return 675 + ((level - 30) * 13);
    return 1195 + ((level - 70) * 15);
}

function getLevelWaves(level) {
    const waves = [];
    let count = 0;

    if (level <= 4) count = 2;
    else if (level <= 10) count = 3;
    else if (level <= 18) count = 4;
    else if (level <= 28) count = 5;
    else count = 6;

    for (let i = 0; i < count; i++) {
        const wave = [];
        const difficulty = level + i;

        if (difficulty < 4) {
            wave.push({ t: 'drone', n: 7 + i * 2 });
        } else if (difficulty < 9) {
            wave.push({ t: 'drone', n: 8 + i * 2 });
            wave.push({ t: 'chaser', n: 2 + i });
        } else if (difficulty < 15) {
            wave.push({ t: 'drone', n: 7 + i });
            wave.push({ t: 'chaser', n: 4 + i });
            wave.push({ t: 'tank', n: 1 + Math.floor((i + 1) / 2) });
        } else {
            wave.push({ t: 'chaser', n: 8 + i * 2 });
            wave.push({ t: 'tank', n: 2 + Math.floor((i + 1) / 2) });
        }

        if (i === count - 1) {
            wave.push({ t: 'boss', n: 1 });
        }

        waves.push(wave);
    }

    return waves;
}

const LEVEL_MILESTONES = [
    { level: 15, title: 'Epic Pool Unlocked', desc: 'Kettenblitz, Tornado Shot und Phoenix Drive koennen jetzt droppen.', statLine: '+8% damage, +6% fire rate' },
    { level: 35, title: 'Core Overdrive', desc: 'Midgame schaltet ein weiteres kleines Powerfenster frei.', statLine: '+12% damage, +1 free reroll each run' },
    { level: 70, title: 'Pierce Threshold', desc: 'Spaetere Runs bekommen mehr Durchschlag und etwas Magnet.', statLine: '+1 pierce, +24 magnet' },
    { level: 110, title: 'Infinite Tempo', desc: 'Endgame bleibt langsamer, aber du bekommst wieder etwas Schub.', statLine: '+14% fire rate, +10% damage' }
];

const SHOP_SECTIONS = {
    goldPacks: [
        { id: 'pack_t1', name: 'Supply Pack I', currency: 'gold', cost: 180, icon: 'P1', bonus: 'Standard pack. Mostly blue drops, very low premium odds.', reward: { packKey: 'supply_pack_i' } },
        { id: 'pack_t2', name: 'Strike Pack II', currency: 'gold', cost: 390, icon: 'P2', bonus: 'Improved pack with better dark-blue and purple odds.', reward: { packKey: 'strike_pack_ii' } },
        { id: 'pack_t3', name: 'Apex Pack III', currency: 'gold', cost: 780, icon: 'P3', bonus: 'Best gold pack, but red and gold drops stay rare.', reward: { packKey: 'apex_pack_iii' } }
    ],
    skinPacks: [
        { id: 'skin_pack_gold', name: 'Street Skin Pack', currency: 'gold', cost: 520, icon: 'SK1', bonus: 'Starter skin pack with basic skins and lighter VFX.', reward: { packKey: 'street_skin_pack' } },
        { id: 'skin_pack_gems', name: 'Prism Skin Pack', currency: 'gems', cost: 90, icon: 'SK2', bonus: 'Better skin pack with rarer trails, shots and glow styles.', reward: { packKey: 'prism_skin_pack' } }
    ],
    gemItems: [
        { id: 'reroll_pack', name: 'Reroll Pack', currency: 'gems', cost: 18, icon: 'RLL', bonus: 'Adds 3 ability rerolls.', reward: { rerollTokens: 3 } },
        { id: 'storm_license', name: 'Storm License', currency: 'gems', cost: 28, icon: 'ARC', bonus: 'Start the next run with +18 ability XP.', reward: { bonusAbilityXp: 18 } },
        { id: 'boss_pass', name: 'Boss Pass', currency: 'gems', cost: 32, icon: 'BOS', bonus: 'One revive against the next boss.', reward: { bossRevive: 1 } },
        { id: 'neon_skin', name: 'Neon Trail', currency: 'gems', cost: 24, icon: 'SKN', bonus: 'Permanent brighter trail effect.', reward: { neonTrail: true } }
    ],
    realMoney: [
        { id: 'gold_stash_s', name: 'Gold Stash', price: '$0.99', icon: 'GLD', bonus: 'Get 2500 gold instantly.', reward: { gold: 2500 } },
        { id: 'gold_stash_l', name: 'Gold Crate', price: '$2.99', icon: 'G2', bonus: 'Get 9000 gold instantly.', reward: { gold: 9000 } },
        { id: 'gems_pouch_s', name: 'Gem Pouch', price: '$0.99', icon: 'GEM', bonus: 'Get 120 gems instantly.', reward: { gems: 120 } },
        { id: 'gems_pouch_l', name: 'Gem Vault', price: '$3.99', icon: 'G4', bonus: 'Get 650 gems instantly.', reward: { gems: 650 } },
        { id: 'no_ads', name: 'No Ads', price: '$2.99', icon: 'VIP', bonus: 'Permanent premium unlock.' },
        { id: 'starter_bundle', name: 'Starter Bundle', price: '$4.99', icon: 'BOX', bonus: '500 gems, 3 premium packs and cosmetics.' },
        { id: 'supporter_pack', name: 'Supporter Pack', price: '$9.99', icon: 'SUP', bonus: 'Exclusive skin, gems and upgrade boost.' },
        { id: 'premium_alpha', name: 'Premium Alpha Crate', price: '$2.49', icon: 'PAK', bonus: 'High-value premium crate with elevated purple/red odds.', reward: { packKey: 'premium_alpha_crate' } },
        { id: 'royal_omega', name: 'Royal Omega Crate', price: '$4.99', icon: 'OMG', bonus: 'Best premium crate with gold exclusives and stronger odds.', reward: { packKey: 'royal_omega_crate' } },
        { id: 'legend_skin_pack', name: 'Legend Skin Pack', price: '$3.49', icon: 'SK3', bonus: 'Top skin pack with the strongest VFX skins and exclusive looks.', reward: { packKey: 'legend_skin_pack' } },
        { id: 'extra_normal_slot', name: 'Extra Deck Slot', price: '$3.99', icon: 'SLT', bonus: 'Adds one extra normal loadout slot.', reward: { extraNormalSlots: 1 } },
        { id: 'extra_legend_slot', name: 'Legend Slot', price: '$6.99', icon: 'LGT', bonus: 'Adds one extra legendary loadout slot.', reward: { extraLegendarySlots: 1 } }
    ]
};

const PACK_DEFINITIONS = {
    supply_pack_i: {
        name: 'Supply Pack I',
        rarity: 'blue',
        odds: { blue: 80, dark: 15, purple: 4.4, red: 0.5, gold: 0.1 },
        allowExclusive: false
    },
    strike_pack_ii: {
        name: 'Strike Pack II',
        rarity: 'dark',
        odds: { blue: 54, dark: 29, purple: 13, red: 3.2, gold: 0.8 },
        allowExclusive: false
    },
    apex_pack_iii: {
        name: 'Apex Pack III',
        rarity: 'purple',
        odds: { blue: 30, dark: 32, purple: 24, red: 11, gold: 3 },
        allowExclusive: false
    },
    premium_alpha_crate: {
        name: 'Premium Alpha Crate',
        rarity: 'red',
        odds: { blue: 4, dark: 14, purple: 38, red: 30, gold: 14 },
        allowExclusive: true
    },
    royal_omega_crate: {
        name: 'Royal Omega Crate',
        rarity: 'gold',
        odds: { blue: 1, dark: 8, purple: 23, red: 38, gold: 30 },
        allowExclusive: true
    },
    street_skin_pack: {
        name: 'Street Skin Pack',
        rarity: 'blue',
        rewardType: 'skin',
        odds: { blue: 74, dark: 22, purple: 4, red: 0, gold: 0 },
        allowExclusive: false
    },
    prism_skin_pack: {
        name: 'Prism Skin Pack',
        rarity: 'purple',
        rewardType: 'skin',
        odds: { blue: 26, dark: 38, purple: 26, red: 8, gold: 2 },
        allowExclusive: false
    },
    legend_skin_pack: {
        name: 'Legend Skin Pack',
        rarity: 'gold',
        rewardType: 'skin',
        odds: { blue: 6, dark: 18, purple: 34, red: 26, gold: 16 },
        allowExclusive: true
    }
};

const SKIN_DEFINITIONS = {
    stock: {
        rarity: 'blue',
        weight: 1,
        name: 'Stock White',
        sigil: 'STOCK',
        desc: 'Clean stock frame with neutral trail.',
        style: { ship: '#ffffff', core: '#00f2ff', trail: 'rgba(0,242,255,0.3)', shot: '#f5fbff', pulse: '#00f2ff' }
    },
    ember_blade: {
        rarity: 'blue',
        weight: 34,
        name: 'Ember Blade',
        sigil: 'EMBER',
        desc: 'Orange hull glow and hotter impact sparks.',
        style: { ship: '#ffd0a6', core: '#ff9d00', trail: 'rgba(255,157,0,0.38)', shot: '#ffd27d', pulse: '#ff9d00' }
    },
    violet_drift: {
        rarity: 'dark',
        weight: 24,
        name: 'Violet Drift',
        sigil: 'DRIFT',
        desc: 'Purple trail and smoother energy wake.',
        style: { ship: '#f1dcff', core: '#bc13fe', trail: 'rgba(188,19,254,0.4)', shot: '#d78fff', pulse: '#bc13fe' }
    },
    solar_flare: {
        rarity: 'purple',
        weight: 16,
        name: 'Solar Flare',
        sigil: 'SOLAR',
        desc: 'Bright gold core with heavier muzzle flash.',
        style: { ship: '#fff4bf', core: '#ffd14d', trail: 'rgba(255,209,77,0.42)', shot: '#ffe698', pulse: '#ffd14d' }
    },
    crimson_afterburn: {
        rarity: 'red',
        weight: 9,
        name: 'Crimson Afterburn',
        sigil: 'BURN',
        desc: 'Aggressive red pulse and stronger finisher VFX.',
        style: { ship: '#ffd3dc', core: '#ff375f', trail: 'rgba(255,55,95,0.46)', shot: '#ff8ba2', pulse: '#ff375f' },
        exclusive: true
    },
    aurora_zero: {
        rarity: 'gold',
        weight: 5,
        name: 'Aurora Zero',
        sigil: 'AUR0',
        desc: 'Top-tier skin with layered cyan-gold VFX.',
        style: { ship: '#fffbe8', core: '#ffd14d', trail: 'rgba(123,232,255,0.5)', shot: '#fff4b0', pulse: '#7be8ff' },
        exclusive: true
    }
};

const INVENTORY_CARDS = {
    damage_chip: { tier: 1, rarity: 'blue', weight: 36, icon: 'DMG', sigil: 'DMG+', name: 'Damage Chip', desc: '+8% base damage', effect: { damageMultiplier: 0.08 } },
    magnet_chip: { tier: 1, rarity: 'blue', weight: 34, icon: 'MAG', sigil: 'MAG+', name: 'Magnet Chip', desc: '+18 magnet range', effect: { magnetFlat: 18 } },
    stability_chip: { tier: 1, rarity: 'blue', weight: 30, icon: 'STB', sigil: 'RPM+', name: 'Stability Chip', desc: '+10% fire rate', effect: { attackSpeedMultiplier: 0.10 } },
    rpm_chip: { tier: 2, rarity: 'dark', weight: 28, icon: 'RPM', sigil: 'BURST', name: 'RPM Chip', desc: '+20% fire rate', effect: { attackSpeedMultiplier: 0.20 } },
    overcharge_core: { tier: 2, rarity: 'dark', weight: 24, icon: 'OVR', sigil: 'OVR', name: 'Overcharge Core', desc: '+18% damage, -6% fire rate', effect: { damageMultiplier: 0.18, attackSpeedMultiplier: -0.06 } },
    arc_battery: { tier: 3, rarity: 'purple', weight: 20, icon: 'ARC', sigil: 'ARC+', name: 'Arc Battery', desc: '+38% fire rate, -12% damage', effect: { attackSpeedMultiplier: 0.38, damageMultiplier: -0.12 } },
    siege_loader: { tier: 3, rarity: 'purple', weight: 18, icon: 'SLD', sigil: 'HEAVY', name: 'Siege Loader', desc: '+42% damage, -15% fire rate', effect: { damageMultiplier: 0.42, attackSpeedMultiplier: -0.15 } },
    apex_emblem: { tier: 4, rarity: 'red', weight: 12, icon: 'APX', sigil: 'RAGE', name: 'Apex Emblem', desc: '+110% damage, -30% fire rate', effect: { damageMultiplier: 1.10, attackSpeedMultiplier: -0.30 } },
    minigun_protocol: { tier: 4, rarity: 'red', weight: 10, icon: 'MIN', sigil: 'MINI', name: 'Minigun Protocol', desc: '+300% fire rate, -70% damage', effect: { attackSpeedMultiplier: 3.0, damageMultiplier: -0.70 } },
    vortex_array: { tier: 5, rarity: 'gold', weight: 6, icon: 'VTX', sigil: 'VAC', name: 'Vortex Array', desc: '+140% fire rate and +60 magnet range', effect: { attackSpeedMultiplier: 1.40, magnetFlat: 60 } },
    solar_crown: { tier: 5, rarity: 'gold', weight: 4, icon: 'SOL', sigil: 'SUN', name: 'Solar Crown', desc: '+160% damage and +55% fire rate', effect: { damageMultiplier: 1.60, attackSpeedMultiplier: 0.55 }, exclusive: true },
    crimson_zero: { tier: 4, rarity: 'red', weight: 5, icon: 'CRM', sigil: 'ZERO', name: 'Crimson Zero', desc: '+220% fire rate, -35% damage', effect: { attackSpeedMultiplier: 2.20, damageMultiplier: -0.35 }, exclusive: true }
};
