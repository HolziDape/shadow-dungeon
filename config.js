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
        id: 'orbiter', name: 'Combat Drone', icon: 'ORB', rarity: 'rare', unlockLevel: 6,
        desc: 'Auto-shooting drone (30% Damage). Stirbt bei Beruehrung, respawn in 15s.',
        tree: [
            { name: 'Combat Drone',   tier: 'rare',      desc: '1 Drohne schiesst automatisch (30% Damage). Stirbt bei Kontakt, respawn 15s.' },
            { name: 'Twin Drones',    tier: 'epic',      desc: '2 Drohnen, schnellere Schussrate, je 30% Damage.' },
            { name: 'Drone Swarm',    tier: 'epic',      desc: '4 Drohnen mit voller Coverage rund um dich.' },
            { name: 'Sentinel Halo',  tier: 'legendary', desc: '6 Drohnen + 25% Damage und respawn in 8s.' }
        ]
    },
    {
        id: 'echo_shot', name: 'Echo Shock', icon: 'ECH', rarity: 'rare', unlockLevel: 8,
        desc: 'Jeder 4. Treffer erzeugt eine Schockwelle am Einschlag.',
        tree: [
            { name: 'Echo Shock',    tier: 'rare',      desc: 'Jeder 4. Treffer = Schockwelle (60% Damage, 80px).' },
            { name: 'Double Echo',   tier: 'epic',      desc: 'Jeder 3. Treffer = Schockwelle (90% Damage, 100px).' },
            { name: 'Resonance',     tier: 'epic',      desc: 'Jeder 2. Treffer = Schockwelle (120% Damage, 130px).' },
            { name: 'Phantom Salvo', tier: 'legendary', desc: 'Jeder Treffer = kleine Schockwelle (50% Damage, 110px).' }
        ]
    },
    {
        id: 'heal_heart', name: 'Patch Heart', icon: 'HP+', rarity: 'rare', unlockLevel: 10,
        desc: 'Stackt Extra-Herzen ueber den normalen Herzen.',
        tree: [
            { name: 'Patch Heart',     tier: 'rare',      desc: '+1 Extra-Herz. Wird zuerst zerstoert. Kein Lifesteal-Heal.' },
            { name: 'Field Surgeon',   tier: 'epic',      desc: '+2 Extra-Herzen.' },
            { name: 'Lifeline',        tier: 'epic',      desc: '+3 Extra-Herzen. 25 Kills = +1 Extra-Herz nachladen.' },
            { name: 'Crimson Aegis',   tier: 'legendary', desc: '+4 Extra-Herzen. Erster letzter Treffer wird geblockt.' }
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
        id: 'phoenix_drive', name: 'Phoenix Aura', icon: 'PHX', rarity: 'epic', unlockLevel: 16,
        desc: 'Permanente Hitze-Aura die nahe Gegner verbrennt.',
        tree: [
            { name: 'Phoenix Aura',     tier: 'epic',      desc: 'Aura (90px) brennt Gegner fuer 22% DMG/s.' },
            { name: 'Ash Bloom',        tier: 'epic',      desc: 'Aura (130px), 35% DMG/s, leichte Burn-DoT.' },
            { name: 'Solar Halo',       tier: 'legendary', desc: 'Aura (180px), 55% DMG/s, +3s I-frames bei HP-Verlust.' },
            { name: 'Eternal Phoenix',  tier: 'legendary', desc: 'Aura (240px), 90% DMG/s, einmal Revive pro Run.' }
        ]
    },
    {
        id: 'ion_round', name: 'Ion Round', icon: 'ION', rarity: 'epic', unlockLevel: 20,
        desc: 'Jeder 5. Schuss = schwerer Splash-Bolt (kein Chain).',
        tree: [
            { name: 'Ion Round',     tier: 'epic',      desc: 'Heavy splash bolt (180% DMG, 70px Splash).' },
            { name: 'Plasma Round',  tier: 'epic',      desc: 'Splash 100px, 230% DMG, leichter Burn.' },
            { name: 'Ion Cannon',    tier: 'legendary', desc: 'Splash 130px, 320% DMG, durchschlaegt Pierce.' },
            { name: 'Antimatter Bolt', tier: 'legendary', desc: 'Splash 160px, vaporisiert nicht-Boss-Gegner.' }
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
    },
    // ──────────────────────────────────────────────────────────
    // 25+ NEW ABILITIES (Nuclear-Throne / Gungeon-inspired)
    // ──────────────────────────────────────────────────────────
    {
        id: 'cluster_bomb', name: 'Kleine Bombe', icon: 'BMB', rarity: 'common', unlockLevel: 2,
        desc: 'Jeder 10. Schuss feuert eine kleine Bombe (300% Schaden).',
        tree: [
            { name: 'Kleine Bombe',     tier: 'common',    desc: 'Jeder 10. Schuss = kleine Bombe (300% ATK).' },
            { name: 'Doppelbombe',      tier: 'rare',      desc: 'Bombe alle 7 Schuss + 50% groesserer Radius.' },
            { name: 'Streubombe',       tier: 'epic',      desc: 'Bombe splittert in 5 Sub-Bomben beim Aufprall.' },
            { name: 'Cluster-Explosion',tier: 'legendary', desc: 'Bombe spaltet sich 2x. Massive Kettenexplosion.' }
        ]
    },
    {
        id: 'ricochet', name: 'Ricochet Round', icon: 'RIC', rarity: 'rare', unlockLevel: 4,
        desc: 'Schuesse prallen einmal von Waenden ab.',
        tree: [
            { name: 'Ricochet Round',   tier: 'rare',      desc: 'Schuesse prallen 1x ab.' },
            { name: 'Twin Ricochet',    tier: 'rare',      desc: 'Schuesse prallen 2x ab und +20% Schaden je Bounce.' },
            { name: 'Pinball Master',   tier: 'epic',      desc: 'Schuesse prallen 4x ab und suchen Gegner.' },
            { name: 'Infinite Bounce',  tier: 'legendary', desc: 'Schuesse prallen unendlich bis sie treffen.' }
        ]
    },
    {
        id: 'vampire', name: 'Vampir-Round', icon: 'VAM', rarity: 'rare', unlockLevel: 6,
        desc: 'Heilt einen kleinen % des verursachten Schadens.',
        tree: [
            { name: 'Vampir-Round',     tier: 'rare',      desc: 'Heilt 1% Lifesteal pro Treffer.' },
            { name: 'Blut-Magnet',      tier: 'rare',      desc: 'Heilt 2% Lifesteal + Pickup-Range +20%.' },
            { name: 'Lebens-Sauger',    tier: 'epic',      desc: 'Heilt 4% Lifesteal + Chance auf Heart-Drop bei Kill.' },
            { name: 'Eternal Bloodlust',tier: 'legendary', desc: 'Heilt 8% Lifesteal + Boss-Kill heilt voll.' }
        ]
    },
    {
        id: 'frost_shot', name: 'Frost-Geschoss', icon: 'FRZ', rarity: 'rare', unlockLevel: 8,
        desc: 'Treffer verlangsamen Gegner um 25%.',
        tree: [
            { name: 'Frost-Geschoss',   tier: 'rare',      desc: 'Treffer verlangsamen Gegner um 25% fuer 1.5s.' },
            { name: 'Eis-Splitter',     tier: 'rare',      desc: 'Slow 40% + 5% Frostbiss-Tick (DoT).' },
            { name: 'Tiefkuehl',        tier: 'epic',      desc: 'Slow 60% + 15% chance Gegner einzufrieren (Stun).' },
            { name: 'Absoluter Nullpunkt',tier: 'legendary', desc: 'Eingefrorene Gegner zerschmettern explosiv.' }
        ]
    },
    {
        id: 'poison_dart', name: 'Gift-Pfeil', icon: 'PSN', rarity: 'common', unlockLevel: 3,
        desc: 'Treffer vergiften Gegner (Schaden ueber Zeit).',
        tree: [
            { name: 'Gift-Pfeil',       tier: 'common',    desc: 'Treffer = 8% ATK Schaden ueber 3s.' },
            { name: 'Toxin',            tier: 'rare',      desc: 'Gift tickt 12% ueber 4s + verbreitet sich.' },
            { name: 'Saeure-Wolke',     tier: 'epic',      desc: 'Vergiftete Gegner explodieren bei Tod in Saeure.' },
            { name: 'Plague Carrier',   tier: 'legendary', desc: 'Gift jumps zwischen Gegnern wie ein Virus.' }
        ]
    },
    {
        id: 'bullet_storm', name: 'Frenzy Mode', icon: 'FRN', rarity: 'rare', unlockLevel: 10,
        desc: 'Feuerrate steigt mit jedem Kill (max +30%).',
        tree: [
            { name: 'Frenzy Mode',      tier: 'rare',      desc: 'Feuerrate +3% pro Kill, max +30%, faellt wenn 2s ohne Kill.' },
            { name: 'Killing Spree',    tier: 'rare',      desc: 'Stack max +50% + auch +10% Damage.' },
            { name: 'Berserker',        tier: 'epic',      desc: 'Stack max +80% + immun gegen Slow.' },
            { name: 'Eternal Storm',    tier: 'legendary', desc: 'Stacks faellen nicht mehr ab. Permanenter Frenzy.' }
        ]
    },
    {
        id: 'lucky_seven', name: 'Glueckszahl', icon: 'L7', rarity: 'common', unlockLevel: 5,
        desc: 'Jeder 7. Schuss verursacht 5x Schaden.',
        tree: [
            { name: 'Glueckszahl',      tier: 'common',    desc: 'Jeder 7. Schuss = x5 Damage.' },
            { name: 'Sieben Sterne',    tier: 'rare',      desc: 'Jeder 7. Schuss = x8 + Glanzeffekt.' },
            { name: 'Jackpot',          tier: 'epic',      desc: 'Jeder 5. Schuss = x10 + heilt 1 HP bei Kill.' },
            { name: 'Royal Flush',      tier: 'legendary', desc: 'Jeder 4. Schuss = x15 + chance auf Mega-Crit x30.' }
        ]
    },
    {
        id: 'crit_chance', name: 'Praezisionskern', icon: 'CRT', rarity: 'common', unlockLevel: 4,
        desc: 'Schuesse haben 15% Chance auf Crit (x2).',
        tree: [
            { name: 'Praezisionskern',  tier: 'common',    desc: '15% Crit-Chance fuer x2 Damage.' },
            { name: 'Headhunter',       tier: 'rare',      desc: '25% Crit-Chance fuer x2.5 Damage.' },
            { name: 'Lethal Edge',      tier: 'epic',      desc: '40% Crit-Chance, Crits durchschlagen Pierce +1.' },
            { name: 'Deadeye',          tier: 'legendary', desc: '60% Crit-Chance, Crits = x4 Damage.' }
        ]
    },
    {
        id: 'glass_cannon', name: 'Glaskanone', icon: 'GLC', rarity: 'rare', unlockLevel: 12,
        desc: '+60% Damage, aber -1 max HP.',
        tree: [
            { name: 'Glaskanone',       tier: 'rare',      desc: '+60% Damage, -1 max HP.' },
            { name: 'Brittle Edge',     tier: 'rare',      desc: '+90% Damage, -1 max HP, +30% Feuerrate.' },
            { name: 'Last Stand',       tier: 'epic',      desc: '+150% Damage bei 1 HP. Ueberlebt 1 toedlichen Treffer.' },
            { name: 'Suicide Pact',     tier: 'legendary', desc: 'x3 Damage, 2 HP nur. Halbe Kosten fuer alle Heals.' }
        ]
    },
    {
        id: 'lich_bullets', name: 'Lich-Auge', icon: 'LCH', rarity: 'epic', unlockLevel: 18,
        desc: 'Schuesse splittern in 3 nach 0.4s Flugzeit.',
        tree: [
            { name: 'Lich-Auge',        tier: 'epic',      desc: 'Schuesse splittern nach 0.4s in 3 Sub-Schuesse.' },
            { name: 'Doppel-Lich',      tier: 'epic',      desc: 'Splitter splittern nochmal in 2 (3->6).' },
            { name: 'Hex-Multiplier',   tier: 'legendary', desc: 'Drei-fach-Split + jede Sub-Bullet hat 30% Crit.' },
            { name: 'Auge des Toten',   tier: 'legendary', desc: 'Alle Bullets bekommen jede Synergy gleichzeitig.' }
        ]
    },
    {
        id: 'platinum_rounds', name: 'Platin-Kugeln', icon: 'PLT', rarity: 'rare', unlockLevel: 14,
        desc: '+0.05% permanenter Damage pro Treffer (max +30%).',
        tree: [
            { name: 'Platin-Kugeln',    tier: 'rare',      desc: '+0.05% permanenter Damage pro Treffer (cap +30%).' },
            { name: 'Goldsplitter',     tier: 'rare',      desc: '+0.08% pro Hit, cap +50%, +5% Feuerrate cap.' },
            { name: 'Iridium-Kern',     tier: 'epic',      desc: '+0.12% Damage + 0.05% Feuerrate pro Hit, cap +80%.' },
            { name: 'Singulaerer Hit',  tier: 'legendary', desc: 'Jeder 100. Hit gibt permanent +1% Damage. Kein Cap.' }
        ]
    },
    {
        id: 'blank_burst', name: 'Platzpatronen', icon: 'BLK', rarity: 'rare', unlockLevel: 16,
        desc: '5% Chance pro Schuss, Gegner-Kugeln zu loeschen.',
        tree: [
            { name: 'Platzpatronen',    tier: 'rare',      desc: '5% Chance pro Schuss = clear nearby enemy bullets.' },
            { name: 'Static Wave',      tier: 'rare',      desc: '10% Blank-Chance + Pulse stoppt 0.3s Gegner-Schuss.' },
            { name: 'Bullet Eraser',    tier: 'epic',      desc: '18% Blank-Chance, blank radius x2, drops gold.' },
            { name: 'Nullification',    tier: 'legendary', desc: '30% Blank-Chance + groesserer Radius. Kein perma-Aura.' }
        ]
    },
    {
        id: 'strong_spirit', name: 'Starker Geist', icon: 'SPR', rarity: 'epic', unlockLevel: 22,
        desc: 'Toedlicher Schaden laesst dich mit 1 HP ueberleben (1x pro Run).',
        tree: [
            { name: 'Starker Geist',    tier: 'epic',      desc: 'Survive 1 toedlichen Treffer mit 1 HP. 2s Invul.' },
            { name: 'Phoenix-Geist',    tier: 'epic',      desc: 'Reset bei Vollheilung. 3s Invul + Burst.' },
            { name: 'Eternal Spirit',   tier: 'legendary', desc: 'Reset alle 60s. 5s Invul + heilt 2 HP.' },
            { name: 'Goettlicher Schild',tier: 'legendary',desc: '1 freier Schild pro Welle. Permanent.' }
        ]
    },
    {
        id: 'trigger_fingers', name: 'Trigger Fingers', icon: 'TFG', rarity: 'common', unlockLevel: 7,
        desc: 'Jeder Kill reduziert ATK-Cooldown um 0.5%.',
        tree: [
            { name: 'Trigger Fingers',  tier: 'common',    desc: 'Kills geben kurz +0.5% Feuerrate (cap +20%).' },
            { name: 'Quick Hands',      tier: 'rare',      desc: 'Kills +1% (cap +35%) + 5% Damage Bonus.' },
            { name: 'Fast Forward',     tier: 'epic',      desc: 'Kills +2% (cap +60%). Boss-Kill = Vollreset cap.' },
            { name: 'Time Warp',        tier: 'legendary', desc: 'Cap entfaellt. Kills geben permanent +0.1%.' }
        ]
    },
    {
        id: 'scarier_face', name: 'Gruselige Fratze', icon: 'SCR', rarity: 'epic', unlockLevel: 20,
        desc: 'Alle Gegner haben -20% max HP.',
        tree: [
            { name: 'Gruselige Fratze', tier: 'epic',      desc: 'Gegner spawnen mit -20% max HP.' },
            { name: 'Nightmare Fuel',   tier: 'epic',      desc: 'Gegner -30% HP + 10% chance dass sie fliehen.' },
            { name: 'Total Eclipse',    tier: 'legendary', desc: 'Gegner -45% HP + Bosse -25%.' },
            { name: 'Grim Reaper',      tier: 'legendary', desc: 'Gegner unter 30% HP sterben sofort.' }
        ]
    },
    {
        id: 'saw_blade', name: 'Saege-Klinge', icon: 'SAW', rarity: 'rare', unlockLevel: 11,
        desc: 'Wirft langsame Saege-Projektile die alles durchschneiden.',
        tree: [
            { name: 'Saege-Klinge',     tier: 'rare',      desc: 'Alle 1.6s eine Saege (60% DMG, durchschlaegt alles, kann mehrfach treffen).' },
            { name: 'Doppelsaege',      tier: 'rare',      desc: '2 Saegen pro Wurf, 80% DMG, alle 1.4s.' },
            { name: 'Buzz-Saw',         tier: 'epic',      desc: '2 Saegen, 120% DMG, alle 1.1s + groesserer Radius.' },
            { name: 'Death Saws',       tier: 'legendary', desc: '3 Riesen-Saegen, 180% DMG, alle 0.9s + Pull-Effekt.' }
        ]
    },
    {
        id: 'boomerang', name: 'Bumerang', icon: 'BMR', rarity: 'rare', unlockLevel: 8,
        desc: 'Periodischer Bumerang mit grossem Bogenflug bis zur Wand.',
        tree: [
            { name: 'Bumerang',         tier: 'rare',      desc: 'Alle 2.5s ein Bumerang (140% DMG, fliegt grossen Bogen).' },
            { name: 'Twin Boomer',      tier: 'rare',      desc: 'Alle 2.0s, +1 Bumerang (Doppel-Wurf).' },
            { name: 'Returning Storm',  tier: 'epic',      desc: 'Alle 1.5s, 3 Bumerangs faecherfoermig.' },
            { name: 'Eternal Return',   tier: 'legendary', desc: 'Alle 1.0s, 4 Bumerangs, +50% DMG, kuerzere Cooldowns.' }
        ]
    },
    {
        id: 'spread_volley', name: 'Streufeuer', icon: 'SPR', rarity: 'common', unlockLevel: 3,
        desc: '+1 Projektil und garantierter Mittel-Schuss + Spread.',
        tree: [
            { name: 'Streufeuer',       tier: 'common',    desc: '+1 Projektil + zentraler Schuss bleibt gerade.' },
            { name: 'Schrotflinte',     tier: 'rare',      desc: '+2 Projektile, breiterer Spread, Mittel-Schuss bleibt.' },
            { name: 'Buckshot',         tier: 'epic',      desc: '+3 Projektile, +30% Close-Range Damage.' },
            { name: 'Death Cone',       tier: 'legendary', desc: '+5 Projektile, 90° Spread, point-blank x4 Damage.' }
        ]
    },
    {
        id: 'crit_bomb', name: 'Crit-Explosion', icon: 'CXB', rarity: 'epic', unlockLevel: 24,
        desc: 'Crits explodieren in einem kleinen AOE.',
        tree: [
            { name: 'Crit-Explosion',   tier: 'epic',      desc: 'Crits = kleine AOE-Explosion (60% Damage Splash).' },
            { name: 'Cluster Crit',     tier: 'epic',      desc: 'Crits splittern + 80% Splash + bigger radius.' },
            { name: 'Nuclear Crit',     tier: 'legendary', desc: 'Crits = 1.5x Damage Splash + Stunwave.' },
            { name: 'Atom Smash',       tier: 'legendary', desc: 'Crits killen alle Gegner in 100px Radius.' }
        ]
    },
    {
        id: 'phantom_shield', name: 'Phantom-Schild', icon: 'SHD', rarity: 'rare', unlockLevel: 13,
        desc: 'Alle 8s blockst du den naechsten Treffer kostenlos.',
        tree: [
            { name: 'Phantom-Schild',   tier: 'rare',      desc: 'Block 1 Hit alle 8s (visual ring).' },
            { name: 'Doppel-Schild',    tier: 'rare',      desc: 'Block alle 6s + 1 extra Charge bei Wave-Start.' },
            { name: 'Aegis Shield',     tier: 'epic',      desc: 'Block alle 4s + reflect Schuss bei Block.' },
            { name: 'Goettliche Aura',  tier: 'legendary', desc: 'Block alle 2s + heilt bei Block.' }
        ]
    },
    {
        id: 'arc_pulse', name: 'Arc-Puls', icon: 'ARC', rarity: 'epic', unlockLevel: 17,
        desc: 'Jeder 6. Treffer entfacht einen Energie-Puls auf 3 Gegner.',
        tree: [
            { name: 'Arc-Puls',         tier: 'epic',      desc: 'Jeder 6. Treffer = Puls auf 3 nahe Gegner.' },
            { name: 'Static Field',     tier: 'epic',      desc: 'Puls jeder 4. Treffer + paralyzed nearby briefly.' },
            { name: 'Magnetic Storm',   tier: 'legendary', desc: 'Puls jeder 2. Treffer + 6 Gegner.' },
            { name: 'Particle Cascade', tier: 'legendary', desc: 'Jeder Treffer pulst auf 8 Gegner.' }
        ]
    },
    {
        id: 'heat_seeker', name: 'Heatseeker', icon: 'HMG', rarity: 'rare', unlockLevel: 7,
        desc: 'Schuesse haben schwaches Homing.',
        tree: [
            { name: 'Heatseeker',       tier: 'rare',      desc: 'Schuesse curven leicht zum naechsten Gegner.' },
            { name: 'Lock-On',          tier: 'rare',      desc: 'Stronger Homing + 15% Damage gegen markierte Ziele.' },
            { name: 'Heat Vector',      tier: 'epic',      desc: 'Hard homing + Schuesse koennen 90° drehen.' },
            { name: 'Smart Munition',   tier: 'legendary', desc: 'Schuesse warten bis sie ein Ziel haben (8s).' }
        ]
    },
    {
        id: 'glass_shards', name: 'Glas-Splitter', icon: 'GLS', rarity: 'common', unlockLevel: 6,
        desc: 'Treffer hinterlassen Glassplitter, die nahe Gegner verletzen.',
        tree: [
            { name: 'Glas-Splitter',    tier: 'common',    desc: 'Treffer = 3 Splitter (50% Damage) im 30px Radius.' },
            { name: 'Diamant-Schaerfe', tier: 'rare',      desc: '5 Splitter + 70% Damage + bleeding stack.' },
            { name: 'Crystalline Storm',tier: 'epic',      desc: '10 Splitter + Splitter prallen 1x ab.' },
            { name: 'Glass Apocalypse', tier: 'legendary', desc: 'Splitter explodieren in 5 weitere kleine Splitter.' }
        ]
    },
    {
        id: 'combo_multiplier', name: 'Combo-Streak', icon: 'CMB', rarity: 'common', unlockLevel: 4,
        desc: '+5% Damage pro aktuellem Killstreak (cap +50%).',
        tree: [
            { name: 'Combo-Streak',     tier: 'common',    desc: '+5% Damage pro Kill in Folge (cap +50%).' },
            { name: 'Kill Chain',       tier: 'rare',      desc: '+8% pro Kill (cap +80%) + faellt langsamer.' },
            { name: 'Streak Master',    tier: 'epic',      desc: '+12% pro Kill (cap +150%) + 1s extra Combo-Time.' },
            { name: 'God Mode',         tier: 'legendary', desc: '+15% pro Kill, kein Cap. Streak verfaellt nie.' }
        ]
    },
    {
        id: 'fortune_coin', name: 'Glueckstaler', icon: 'CON', rarity: 'common', unlockLevel: 5,
        desc: 'Kills geben +50% mehr Gold.',
        tree: [
            { name: 'Glueckstaler',     tier: 'common',    desc: 'Kills geben +50% Gold.' },
            { name: 'Goldener Touch',   tier: 'rare',      desc: '+100% Gold + 5% chance auf Doppel-Drop.' },
            { name: 'Midas',            tier: 'epic',      desc: '+200% Gold + Bosse droppen ein Pack-Token.' },
            { name: 'Wealth Generator', tier: 'legendary', desc: '+400% Gold + jede Welle = +20 Gold passiv.' }
        ]
    }
];

// Convenience: get the descriptor at the player's CURRENT rank for an ability
function getAbilityRankDef(ability, rank) {
    if (!ability || !ability.tree) return { name: ability?.name || '?', tier: ability?.rarity || 'common', desc: ability?.desc || '' };
    const idx = Math.max(0, Math.min(ability.tree.length - 1, (rank || 0)));
    return ability.tree[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY TYPES — original four PLUS nine new types that unlock at later levels.
// Tank HP is significantly increased (10 → 38) so they actually feel like tanks.
// `unlockLevel` is used by getLevelWaves() to gate enemies into later levels.
// ─────────────────────────────────────────────────────────────────────────────
const ENEMY_TYPES = {
    // ── Original ──
    drone:     { hp: 5,  spd: 1.55, r: 13, color: '#00f2ff', glow: '#00f2ff', exp: 1, ai: 'strafe',  unlockLevel: 1 },
    chaser:    { hp: 8,  spd: 1.95, r: 12, color: '#bc13fe', glow: '#bc13fe', exp: 2, ai: 'sprint',  unlockLevel: 4 },
    tank:      { hp: 38, spd: 0.95, r: 20, color: '#ff9d00', glow: '#ff9d00', exp: 4, ai: 'heavy',   unlockLevel: 12 },
    boss:      { hp: 26, spd: 1.08, r: 50, color: '#ff375f', glow: '#ff375f', exp: 10, ai: 'boss',   isBoss: true, unlockLevel: 1 },

    // ── New enemy types (8-9), gated to later levels ──
    swarmling: { hp: 2,  spd: 2.10, r: 8,  color: '#7be8ff', glow: '#7be8ff', exp: 1, ai: 'swarm',     unlockLevel: 1 },
    brute:     { hp: 22, spd: 0.85, r: 17, color: '#ffaa00', glow: '#ffaa00', exp: 4, ai: 'brute',     unlockLevel: 8 },
    sniper:    { hp: 6,  spd: 0.90, r: 12, color: '#ff5dad', glow: '#ff5dad', exp: 3, ai: 'sniper',    unlockLevel: 12 },
    bomber:    { hp: 9,  spd: 1.30, r: 14, color: '#ff7035', glow: '#ff7035', exp: 4, ai: 'bomber',    unlockLevel: 15 },
    healer:    { hp: 14, spd: 1.05, r: 14, color: '#34ffae', glow: '#34ffae', exp: 5, ai: 'healer',    unlockLevel: 18 },
    shielder:  { hp: 24, spd: 0.95, r: 16, color: '#5cc1ff', glow: '#5cc1ff', exp: 5, ai: 'shielder',  unlockLevel: 22, shieldHp: 30 },
    wraith:    { hp: 12, spd: 1.50, r: 12, color: '#9f57ff', glow: '#9f57ff', exp: 5, ai: 'wraith',    unlockLevel: 26 },
    crusher:   { hp: 80, spd: 0.70, r: 24, color: '#ff5040', glow: '#ff5040', exp: 8, ai: 'crusher',   unlockLevel: 30 },
    berserker: { hp: 16, spd: 1.20, r: 13, color: '#ff2030', glow: '#ff2030', exp: 6, ai: 'berserker', unlockLevel: 35 }
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

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL WAVES
// Each wave is an array of spawn entries. Each entry now carries:
//   { t: 'type', n: total count, batch: per-spawn count, interval: seconds }
// → spawnWave() in game.js queues these so enemies trickle in instead of all
//   appearing at once. Early waves are intentionally weak (a handful of swarmlings
//   + drones); harder enemy types unlock the deeper you push.
// ─────────────────────────────────────────────────────────────────────────────
function getLevelWaves(level) {
    const waves = [];
    let count = 0;

    // How many sub-waves per level — fewer in early levels, more later.
    if (level <= 3) count = 2;
    else if (level <= 7) count = 3;
    else if (level <= 14) count = 4;
    else if (level <= 22) count = 5;
    else if (level <= 35) count = 6;
    else count = 7;

    for (let i = 0; i < count; i++) {
        const wave = [];

        // ── Tier-based wave composition ──
        if (level <= 2) {
            // Tutorial-soft: a tiny swarm, very forgiving.
            wave.push({ t: 'swarmling', n: 4 + i * 2,   batch: 2, interval: 0.8 });
            if (i > 0) wave.push({ t: 'drone', n: 2 + i, batch: 1, interval: 1.0 });
        } else if (level <= 4) {
            wave.push({ t: 'swarmling', n: 5 + i * 2,   batch: 2, interval: 0.7 });
            wave.push({ t: 'drone',     n: 3 + i,       batch: 1, interval: 0.9 });
        } else if (level <= 7) {
            wave.push({ t: 'drone',     n: 6 + i * 2,   batch: 2, interval: 0.65 });
            wave.push({ t: 'chaser',    n: 1 + i,       batch: 1, interval: 1.0  });
        } else if (level <= 11) {
            wave.push({ t: 'drone',     n: 6 + i,                 batch: 2, interval: 0.6 });
            wave.push({ t: 'chaser',    n: 3 + i,                 batch: 1, interval: 0.85 });
            wave.push({ t: 'brute',     n: 1 + Math.floor(i / 2), batch: 1, interval: 1.6 });
        } else if (level <= 14) {
            wave.push({ t: 'chaser',    n: 4 + i,                 batch: 2, interval: 0.6 });
            wave.push({ t: 'brute',     n: 1 + Math.floor(i / 2), batch: 1, interval: 1.4 });
            wave.push({ t: 'tank',      n: 1 + Math.floor(i / 3), batch: 1, interval: 1.8 });
            if (level >= 12 && i >= 1) wave.push({ t: 'sniper', n: 1 + Math.floor(i / 2), batch: 1, interval: 1.0 });
        } else if (level <= 17) {
            wave.push({ t: 'chaser',    n: 5 + i,                 batch: 2, interval: 0.55 });
            wave.push({ t: 'tank',      n: 1 + Math.floor(i / 2), batch: 1, interval: 1.5 });
            wave.push({ t: 'sniper',    n: 2 + Math.floor(i / 2), batch: 1, interval: 0.95 });
            wave.push({ t: 'bomber',    n: 1 + Math.floor(i / 3), batch: 1, interval: 1.2 });
        } else if (level <= 21) {
            wave.push({ t: 'chaser',    n: 5 + i,                 batch: 2, interval: 0.5 });
            wave.push({ t: 'tank',      n: 1 + Math.floor(i / 2), batch: 1, interval: 1.4 });
            wave.push({ t: 'sniper',    n: 2 + Math.floor(i / 2), batch: 1, interval: 0.9 });
            wave.push({ t: 'bomber',    n: 1 + Math.floor(i / 2), batch: 1, interval: 1.1 });
            wave.push({ t: 'healer',    n: 1 + Math.floor(i / 3), batch: 1, interval: 1.5 });
        } else if (level <= 25) {
            wave.push({ t: 'chaser',    n: 6 + i,                 batch: 2, interval: 0.45 });
            wave.push({ t: 'brute',     n: 2 + Math.floor(i / 2), batch: 1, interval: 1.1 });
            wave.push({ t: 'tank',      n: 2 + Math.floor(i / 2), batch: 1, interval: 1.3 });
            wave.push({ t: 'shielder',  n: 1 + Math.floor(i / 3), batch: 1, interval: 1.4 });
            wave.push({ t: 'healer',    n: 1,                     batch: 1, interval: 1.5 });
        } else if (level <= 29) {
            wave.push({ t: 'chaser',    n: 5 + i,                 batch: 2, interval: 0.4 });
            wave.push({ t: 'tank',      n: 2 + Math.floor(i / 2), batch: 1, interval: 1.2 });
            wave.push({ t: 'shielder',  n: 2 + Math.floor(i / 2), batch: 1, interval: 1.2 });
            wave.push({ t: 'wraith',    n: 1 + Math.floor(i / 2), batch: 1, interval: 1.0 });
            wave.push({ t: 'bomber',    n: 2,                     batch: 1, interval: 1.0 });
        } else if (level <= 34) {
            wave.push({ t: 'chaser',    n: 6 + i,                 batch: 2, interval: 0.4 });
            wave.push({ t: 'tank',      n: 2 + Math.floor(i / 2), batch: 1, interval: 1.1 });
            wave.push({ t: 'shielder',  n: 2,                     batch: 1, interval: 1.2 });
            wave.push({ t: 'wraith',    n: 2 + Math.floor(i / 2), batch: 1, interval: 0.9 });
            wave.push({ t: 'crusher',   n: 1 + Math.floor(i / 3), batch: 1, interval: 1.6 });
        } else {
            // Endgame: full mix.
            wave.push({ t: 'chaser',    n: 7 + i,                 batch: 3, interval: 0.4  });
            wave.push({ t: 'tank',      n: 2 + Math.floor(i / 2), batch: 1, interval: 1.1  });
            wave.push({ t: 'shielder',  n: 2 + Math.floor(i / 2), batch: 1, interval: 1.2  });
            wave.push({ t: 'wraith',    n: 2 + Math.floor(i / 2), batch: 1, interval: 0.9  });
            wave.push({ t: 'crusher',   n: 1 + Math.floor(i / 2), batch: 1, interval: 1.5  });
            wave.push({ t: 'berserker', n: 2 + Math.floor(i / 2), batch: 1, interval: 1.05 });
            wave.push({ t: 'healer',    n: 1,                     batch: 1, interval: 1.5  });
        }

        // Boss on the last sub-wave of every level.
        if (i === count - 1) {
            wave.push({ t: 'boss', n: 1, batch: 1, interval: 0 });
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
