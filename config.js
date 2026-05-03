const WALL = 10;

const PLAYER_STATS = {
    hearts: { base: 3 },
    // Bigger early-level payoff (minorBase up), then tighter growth so late upgrades feel small.
    // Major spikes still pop but their growth is curbed past mid-game.
    // Higher base damage + stronger per-level scaling so player keeps pace.
    dmg:     { name: 'Damage',    base: 5,   progression: { minorBase: 0.32, minorGrowth: 1.06, majorBase: 1.40, majorGrowth: 1.12 } },
    atkSpd:  { name: 'Fire Rate', base: 1,   progression: { minorBase: 0.075, minorGrowth: 1.030, majorBase: 0.24, majorGrowth: 1.07 } },
    economy: { name: 'Income',    base: 1,   progression: { minorBase: 0.12, minorGrowth: 1.035, majorBase: 0.42, majorGrowth: 1.08 } },
    range:   { name: 'Range',     base: 420, inc: 24 },
    speed:   { name: 'Speed',     base: 230 },
    armor:   { name: 'Armor',     base: 0,   inc: 1 },
    magnet:  { name: 'Magnet',    base: 130, inc: 16 }
};

// Seed costs are CHEAPER for the first 5 levels (fast progress) and the tail
// growth is SHARPER (slow progress later), so the curve feels Clash-Royale-y.
const UPGRADES = [
    { id: 'dmg',     name: 'Schaden',   icon: 'DMG', color: '#ffb100', cycleRange: [5, 7], cycleOffset: 0, seedCosts: [18, 26, 38, 56, 84, 132, 198], tailGrowth: 1.32, tailFlat: 60, majorCostMultiplier: 1.95, max: 42, desc: 'Mehr Basisschaden pro Run.' },
    { id: 'atkSpd',  name: 'Feuerrate', icon: 'RPM', color: '#1ec8ff', cycleRange: [5, 7], cycleOffset: 1, seedCosts: [20, 30, 42, 60, 92, 144, 214], tailGrowth: 1.33, tailFlat: 62, majorCostMultiplier: 1.92, max: 42, desc: 'Schnellere Volleys und fluessigeres Combat.' },
    { id: 'economy', name: 'Einkommen', icon: 'GLD', color: '#00ff9d', cycleRange: [5, 7], cycleOffset: 2, seedCosts: [16, 24, 34, 50, 76, 122, 184], tailGrowth: 1.30, tailFlat: 56, majorCostMultiplier: 1.98, max: 42, desc: 'Mehr Gold aus Kills und Missionen.' }
];

const DAILY_LOGIN_REWARDS = [
    { label: '600 Gold', gold: 600 },
    { label: '850 Gold', gold: 850 },
    { label: '18 Gems', gems: 18 },
    { label: '1200 Gold', gold: 1200 },
    { label: '1 Pack I', packKey: 'supply_pack_i' },
    { label: '30 Gems', gems: 30 },
    { label: '1 Pack II', packKey: 'strike_pack_ii' }
];

// ─────────────────────────────────────────────────────────────────────────────
// SKILL TREE — every ability evolves over 4 ranks. Each rank has a name + tier
// (common/rare/epic/legendary) so the picker can colour them. Innovative late
// ranks: not just "more damage" but new behaviours / VFX.
// ─────────────────────────────────────────────────────────────────────────────
const ABILITIES = [
    {
        id: 'damage_boost', name: 'Damage Core', icon: 'DMG', rarity: 'common', unlockLevel: 1,
        desc: 'Damage +18%, light overcharge VFX.',
        tree: [
            { name: 'Damage Core',        tier: 'common',    desc: 'Damage +18%. Subtle red overcharge glow.' },
            { name: 'Power Cell',         tier: 'rare',      desc: 'Damage +30% and bullets leave a faint red trail.' },
            { name: 'Overcharge Reactor', tier: 'epic',      desc: 'Damage +55% and every 5th bullet is a CRIT for x3.' },
            { name: 'Singularity Coil',   tier: 'legendary', desc: 'All bullets crit for x2 and emit a small impact flash.' }
        ]
    },
    {
        id: 'rapid_fire', name: 'Rapid Barrel', icon: 'ROF', rarity: 'common', unlockLevel: 1,
        desc: '+22% fire rate, faster reload feel.',
        tree: [
            { name: 'Rapid Barrel',  tier: 'common',    desc: '+22% fire rate.' },
            { name: 'Hyper Barrel',  tier: 'rare',      desc: '+38% fire rate, muzzle flash bigger.' },
            { name: 'Auto-Loader',   tier: 'epic',      desc: '+58% fire rate. Every kill gives 0.5s frenzy +30% extra.' },
            { name: 'Minigun Mode',  tier: 'legendary', desc: 'x2 fire rate. Bullets ricochet once on walls.' }
        ]
    },
    {
        id: 'multi', name: 'Twin Volley', icon: 'VOL', rarity: 'common', unlockLevel: 1,
        desc: '+1 extra projectile per volley.',
        tree: [
            { name: 'Twin Volley',  tier: 'common',    desc: '+1 extra projectile.' },
            { name: 'Triple Tap',   tier: 'rare',      desc: '+2 projectiles, slight spread.' },
            { name: 'Storm Volley', tier: 'epic',      desc: '+3 projectiles + arc spread, hits feel like a shotgun.' },
            { name: 'Pulsar Burst', tier: 'legendary', desc: 'Every 4th volley fires a 360° ring of bullets.' }
        ]
    },
    {
        id: 'pierce', name: 'Pierce Core', icon: 'PRC', rarity: 'rare', unlockLevel: 4,
        desc: 'Bullets pierce one extra enemy.',
        tree: [
            { name: 'Pierce Core',     tier: 'rare',      desc: 'Bullets pierce +1 enemy.' },
            { name: 'Lance Round',     tier: 'epic',      desc: 'Bullets pierce +3 enemies and gain +20% damage per pierce.' },
            { name: 'Railgun Mode',    tier: 'legendary', desc: 'Bullets pierce ALL enemies, leaving an arc trail.' },
            { name: 'Void Lance',      tier: 'legendary', desc: 'Pierce all + 35% chance to mark hit enemies (next hit = double damage).' }
        ]
    },
    {
        id: 'orbiter', name: 'Defense Drone', icon: 'ORB', rarity: 'rare', unlockLevel: 6,
        desc: 'A drone orbits and protects you.',
        tree: [
            { name: 'Defense Drone',  tier: 'rare',      desc: 'One drone orbits and shoots automatically.' },
            { name: 'Twin Drones',    tier: 'epic',      desc: 'Two drones, faster orbit, each shoots individually.' },
            { name: 'Drone Swarm',    tier: 'epic',      desc: 'Four drones at half size each, full coverage.' },
            { name: 'Sentinel Halo',  tier: 'legendary', desc: 'Six drones + ring of micro-shots every 3s.' }
        ]
    },
    {
        id: 'echo_shot', name: 'Echo Shot', icon: 'ECH', rarity: 'rare', unlockLevel: 8,
        desc: 'Every 4th volley fires a delayed echo.',
        tree: [
            { name: 'Echo Shot',     tier: 'rare',      desc: 'Every 4th volley fires a delayed echo.' },
            { name: 'Double Echo',   tier: 'epic',      desc: 'Every 3rd volley fires two echoes.' },
            { name: 'Resonance',     tier: 'epic',      desc: 'Every echo also splits sideways into two extra bullets.' },
            { name: 'Phantom Salvo', tier: 'legendary', desc: 'Every shot has a 25% ghost echo. Stacks insanely.' }
        ]
    },
    {
        id: 'heal_heart', name: 'Patch Heart', icon: 'HP+', rarity: 'rare', unlockLevel: 10,
        desc: 'Restores one heart immediately.',
        tree: [
            { name: 'Patch Heart',     tier: 'rare',      desc: 'Restore one heart now.' },
            { name: 'Field Surgeon',   tier: 'epic',      desc: 'Restore +1 max heart and one heart now.' },
            { name: 'Lifeline',        tier: 'epic',      desc: '+2 max hearts. Killing 25 enemies heals 1 heart.' },
            { name: 'Crimson Aegis',   tier: 'legendary', desc: '+2 hearts. First lethal hit per run is blocked.' }
        ]
    },
    {
        id: 'chain_lightning', name: 'Kettenblitz', icon: 'ARC', rarity: 'epic', unlockLevel: 12,
        desc: 'Hits chain to nearby enemies.',
        tree: [
            { name: 'Kettenblitz',  tier: 'epic',      desc: 'Hits chain to 1 nearby enemy.' },
            { name: 'Storm Chain',  tier: 'epic',      desc: 'Chain to 3 enemies, longer range.' },
            { name: 'Tesla Net',    tier: 'legendary', desc: 'Chain to 6 enemies, paralyzes targets briefly.' },
            { name: 'Thor\'s Will', tier: 'legendary', desc: 'Every kill triggers a free chain to 4 nearby enemies.' }
        ]
    },
    {
        id: 'tornado_shot', name: 'Tornado Shot', icon: 'TOR', rarity: 'epic', unlockLevel: 14,
        desc: 'Every 3rd volley fires tornado bullets.',
        tree: [
            { name: 'Tornado Shot',     tier: 'epic',      desc: 'Every 3rd volley fires tornado bullets.' },
            { name: 'Cyclone Volley',   tier: 'epic',      desc: 'Every 2nd volley is a tornado, twice the radius.' },
            { name: 'Maelstrom',        tier: 'legendary', desc: 'Tornados pull enemies and tick damage every 0.2s.' },
            { name: 'Eye of the Storm', tier: 'legendary', desc: 'Permanent tornado follows your cursor.' }
        ]
    },
    {
        id: 'phoenix_drive', name: 'Phoenix Drive', icon: 'PHX', rarity: 'epic', unlockLevel: 16,
        desc: 'Lose a heart → fire wave revenge.',
        tree: [
            { name: 'Phoenix Drive',     tier: 'epic',      desc: 'On heart-loss, explode in a fire wave.' },
            { name: 'Ash Bloom',         tier: 'epic',      desc: 'Fire wave leaves burning ground for 4s.' },
            { name: 'Solar Halo',        tier: 'legendary', desc: 'Wave hits twice and grants 3s i-frames.' },
            { name: 'Eternal Phoenix',   tier: 'legendary', desc: 'On lethal damage: revive once with full hearts (per run).' }
        ]
    },
    {
        id: 'ion_round', name: 'Ion Round', icon: 'ION', rarity: 'epic', unlockLevel: 20,
        desc: 'Every 5th volley charges a heavy ion shot.',
        tree: [
            { name: 'Ion Round',     tier: 'epic',      desc: 'Every 5th volley fires a heavy ion shot.' },
            { name: 'Plasma Round',  tier: 'epic',      desc: 'Ion shot splash radius +50%.' },
            { name: 'Ion Cannon',    tier: 'legendary', desc: 'Ion shot becomes a piercing beam.' },
            { name: 'Antimatter Bolt', tier: 'legendary', desc: 'Ion bolt vaporizes anything that isn\'t a boss.' }
        ]
    },
    {
        id: 'shock_nova', name: 'Shock Nova', icon: 'NVA', rarity: 'epic', unlockLevel: 24,
        desc: 'Every 12 kills releases a lightning ring.',
        tree: [
            { name: 'Shock Nova',  tier: 'epic',      desc: 'Every 12 kills release a lightning ring.' },
            { name: 'Pulse Nova',  tier: 'epic',      desc: 'Trigger every 8 kills, ring is bigger.' },
            { name: 'Chain Nova',  tier: 'legendary', desc: 'Every nova spawns 6 chain-bolts to random enemies.' },
            { name: 'Eternal Storm', tier: 'legendary', desc: 'Nova every 4 kills + permanent shock aura around you.' }
        ]
    },
    {
        id: 'singularity', name: 'Singularity', icon: 'SGR', rarity: 'epic', unlockLevel: 30,
        desc: 'Every 8th volley creates a brief pull field.',
        tree: [
            { name: 'Singularity',     tier: 'epic',      desc: 'Every 8th volley creates a brief pull field.' },
            { name: 'Black Pull',      tier: 'epic',      desc: 'Pull field lasts longer and ticks small damage.' },
            { name: 'Void Implosion',  tier: 'legendary', desc: 'After pull, field implodes for huge damage.' },
            { name: 'Event Horizon',   tier: 'legendary', desc: 'Permanent micro-singularity around your ship.' }
        ]
    }
];

// Convenience: get the descriptor at the player's CURRENT rank for an ability
function getAbilityRankDef(ability, rank) {
    if (!ability || !ability.tree) return { name: ability?.name || '?', tier: ability?.rarity || 'common', desc: ability?.desc || '' };
    const idx = Math.max(0, Math.min(ability.tree.length - 1, (rank || 0)));
    return ability.tree[idx];
}

const ENEMY_TYPES = {
    drone: { hp: 5, spd: 1.55, r: 13, color: '#00f2ff', glow: '#00f2ff', exp: 1, ai: 'strafe' },
    chaser: { hp: 8, spd: 1.95, r: 12, color: '#bc13fe', glow: '#bc13fe', exp: 2, ai: 'sprint' },
    tank: { hp: 10, spd: 0.95, r: 20, color: '#ff9d00', glow: '#ff9d00', exp: 3, ai: 'heavy' },
    boss: { hp: 26, spd: 1.08, r: 50, color: '#ff375f', glow: '#ff375f', exp: 10, ai: 'boss', isBoss: true }
};

function getEnemyLevelStats(typeKey, level) {
    const base = ENEMY_TYPES[typeKey];
    // SMOOTHED scaling — was too brutal (12x in 15 levels = 1k HP drones at lvl 20).
    // New: gentle exponential that lets player upgrades keep pace.
    let scale = 2 + ((Math.max(1, level) - 1) * 1.4);

    if (level > 10 && level <= 25) {
        const t = (level - 10) / 15;
        // 4x growth across 15 levels (not 12x). At lvl 20 ≈ 16, at lvl 25 ≈ 60.
        scale = 16 * Math.pow(4, t);
    } else if (level > 25 && level <= 50) {
        const t = (level - 25) / 25;
        // Moderate ramp 60 → 600 across 25 levels (not 100x in same span).
        scale = 60 * Math.pow(10, t);
    } else if (level > 50) {
        scale = 600 * Math.pow(1.10, level - 50);
    }

    return {
        ...base,
        hp: Math.max(2, Math.round(base.hp * scale))
    };
}

function getUpgradeCycleSize(upgrade, blockIndex) {
    const min = upgrade.cycleRange?.[0] || 5;
    const max = upgrade.cycleRange?.[1] || min;
    const span = Math.max(1, max - min + 1);
    return min + ((blockIndex + (upgrade.cycleOffset || 0)) % span);
}

function getUpgradeTierInfo(upgrade, level) {
    let consumed = 0;
    let blockIndex = 0;

    while (consumed <= level) {
        const cycleSize = getUpgradeCycleSize(upgrade, blockIndex);
        const blockTotal = cycleSize + 1;
        if (level < consumed + blockTotal) {
            const position = level - consumed;
            return {
                blockIndex,
                surge: blockIndex + 1,
                cycleSize,
                position,
                step: Math.min(position + 1, cycleSize + 1),
                isMajor: position === cycleSize,
                nextIsMajor: position === cycleSize - 1
            };
        }
        consumed += blockTotal;
        blockIndex += 1;
    }

    return { blockIndex: 0, surge: 1, cycleSize: getUpgradeCycleSize(upgrade, 0), position: 0, step: 1, isMajor: false, nextIsMajor: false };
}

function getUpgradeCost(upgrade, level) {
    if (level >= upgrade.max) return null;
    const tier = getUpgradeTierInfo(upgrade, level);
    let cost = 0;
    if (level < upgrade.seedCosts.length) {
        cost = upgrade.seedCosts[level];
    } else {
        cost = upgrade.seedCosts[upgrade.seedCosts.length - 1];
        for (let i = upgrade.seedCosts.length; i <= level; i++) {
            cost = (cost * upgrade.tailGrowth) + upgrade.tailFlat;
        }
    }
    if (tier.isMajor) cost *= upgrade.majorCostMultiplier || 1.75;
    return Math.round(cost);
}

function getLevelGoldReward(level) {
    if (level <= 10) return 95 + (level * 24);
    if (level <= 25) return 340 + ((level - 10) * 34);
    if (level <= 50) return 850 + Math.round(Math.pow(level - 24, 1.46) * 44);
    return Math.round(6200 * Math.pow(1.115, level - 50));
}

function getLevelWaves(level) {
    const waves = [];
    let count = 0;

    if (level <= 4) count = 2;
    else if (level <= 10) count = 3;
    else if (level <= 18) count = 4;
    else if (level <= 28) count = 5;
    else if (level <= 40) count = 6;
    else count = 7;

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

// Skins now have unique themes — each one is a distinct ship silhouette,
// colour palette, trail FX flavour and short flavour line. The `theme` key
// drives a different SVG art template in getRewardArtSvg() and the runtime VFX.
const SKIN_DEFINITIONS = {
    stock: {
        rarity: 'blue', weight: 1,
        name: 'Stock White', sigil: 'STOCK',
        desc: 'Clean factory frame. Neutral cyan engine signature.',
        theme: 'arrow',
        style: { ship: '#ffffff', core: '#00f2ff', trail: 'rgba(0,242,255,0.30)', shot: '#f5fbff', pulse: '#00f2ff' }
    },
    ember_blade: {
        rarity: 'blue', weight: 34,
        name: 'Ember Blade', sigil: 'EMBER',
        desc: 'Hot magma plate with embers trailing the wake.',
        theme: 'molten',
        style: { ship: '#ff8030', core: '#ffe168', trail: 'rgba(255,120,30,0.55)', shot: '#ffd27d', pulse: '#ff7020' }
    },
    violet_drift: {
        rarity: 'dark', weight: 24,
        name: 'Violet Drift', sigil: 'DRIFT',
        desc: 'Void wave envelope, leaves a glassy purple ribbon.',
        theme: 'wave',
        style: { ship: '#c890ff', core: '#bc13fe', trail: 'rgba(188,19,254,0.55)', shot: '#d78fff', pulse: '#bc13fe' }
    },
    solar_flare: {
        rarity: 'purple', weight: 16,
        name: 'Solar Flare', sigil: 'SOLAR',
        desc: 'Stellar corona with heavy gold muzzle flash.',
        theme: 'corona',
        style: { ship: '#ffe698', core: '#ffd14d', trail: 'rgba(255,209,77,0.60)', shot: '#ffe698', pulse: '#ffd14d' }
    },
    crimson_afterburn: {
        rarity: 'red', weight: 9,
        name: 'Crimson Afterburn', sigil: 'BURN',
        desc: 'Razor red blade with twin afterburn cones.',
        theme: 'blade',
        style: { ship: '#ff375f', core: '#ffe1e8', trail: 'rgba(255,55,95,0.65)', shot: '#ff8ba2', pulse: '#ff375f' },
        exclusive: true
    },
    aurora_zero: {
        rarity: 'gold', weight: 5,
        name: 'Aurora Zero', sigil: 'AUR0',
        desc: 'Prismatic aurora foil. Cyan-gold rainbow pulse.',
        theme: 'aurora',
        style: { ship: '#fffbe8', core: '#ffd14d', trail: 'rgba(123,232,255,0.7)', shot: '#fff4b0', pulse: '#7be8ff' },
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
