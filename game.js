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
    settings: { sfx: 0.7, music: 0.35, haptics: false, language: 'en' },
    metaSlots: { normalExtra: 0, legendaryExtra: 0 },
    lastRunSkills: null
};

// ─────────────────────────────────────────────────────────────────────────────
// i18n — single source of truth for every user-facing string. Add new keys here
// in BOTH `en` and `de` so the German fallback stays in sync. Use t('key').
// ─────────────────────────────────────────────────────────────────────────────
const I18N = {
    en: {
        'hud.level': 'LEVEL 1',
        'hud.wave': 'WAVE 0/0',
        'rail.newSkill': 'NEW SKILL',
        'rail.skills': 'Skills',
        'rail.noAds': 'No Ads',
        'rail.leaderboard': 'Leaderboard',
        'rail.quests': 'Quests',
        'rail.dailyLogin': 'Daily Login',
        'rail.test': 'Test',
        'cta.endless': 'ENDLESS',
        'cta.level': 'LEVEL',
        'nav.shop': 'SHOP',
        'nav.equipment': 'EQUIPMENT',
        'nav.fight': 'FIGHT',
        'nav.upgrades': 'UPGRADES',
        'nav.inventory': 'INVENTORY',
        'nav.skills': 'SKILLS',
        'shop.title': 'MARKET',
        'shop.sub': 'Card packs up top, utility below, premium on its own cleaner shelf.',
        'shop.cardShop': 'Card Shop',
        'shop.goldPacks': 'Gold Packs',
        'shop.skinPacks': 'Skin Packs',
        'shop.skinPacksTags': 'Gold, Gems, Premium',
        'shop.gemLab': 'Gem Lab',
        'shop.utility': 'Utility',
        'shop.premiumVault': 'Premium Vault',
        'shop.realMoney': 'Real Money',
        'inventory.title': 'INVENTORY',
        'inventory.sub': 'Open stored packs here and sell spare cards for gold.',
        'equipment.title': 'EQUIPMENT',
        'equipment.sub': 'Equip cards. Slots unlock as you level up.',
        'equipment.slotProgression': 'Slot Progression',
        'equipment.normalSlots': 'Normal Slots',
        'equipment.legendarySlots': 'Legendary Slots',
        'equipment.slotLockedAt': 'Unlocks at Lv',
        'equipment.empty': 'Empty',
        'equipment.maxNote': 'Max slots: 5 Normal + 2 paid · 2 Legendary + 1 paid. The shop will not sell more than this.',
        'abilities.title': 'ABILITY ARCHIVE',
        'hub.title': 'STRIKER-X',
        'hub.sub': 'Upgrade rings animate around the ship like the reference layout.',
        'settings.title': 'SETTINGS',
        'settings.language': 'Language',
        'settings.languageCopy': 'Switch the interface between English and German.',
        'settings.sfx': 'SFX Volume',
        'settings.sfxCopy': 'Shots, hits and pack sounds.',
        'settings.music': 'Music Volume',
        'settings.musicCopy': 'Background music in the lobby and during a run.',
        'settings.haptics': 'Haptics',
        'settings.hapticsCopy': 'Vibration on hits and rewards (Android & in-app browsers).',
        'daily.title': 'DAILY LOGIN',
        'daily.status': 'Day 1 ready',
        'daily.statusReady': 'Day {n} ready',
        'daily.statusClaimed': 'Day {n} claimed',
        'daily.streak': 'Streak {n}',
        'daily.copyReady': 'Today\'s reward is ready. Already-claimed days stay marked.',
        'daily.copyClaimed': 'Today is already collected. Future days are previewed below.',
        'daily.done': 'Done',
        'daily.now': 'Now',
        'daily.later': 'Later',
        'quests.title': 'QUESTS',
        'quests.sub': 'Complete them and climb the league.',
        'leaderboard.subline': 'Reach <strong>Top 3</strong> and win great prizes!',
        'runSummary.title': 'SKILLS USED',
        'runSummary.sub': 'Abilities you leveraged this run.',
        'runSummary.empty': 'No abilities were picked during this run.',
        'runSummary.rank': 'Rank',
        'test.title': '🧪 TEST ARENA',
        'test.start': '▶ START ARENA',
        'test.stop': '■ STOP',
        'test.reset': '↻ RESET',
        'test.god': 'GOD MODE',
        'test.oneshot': 'ONE-SHOT',
        'test.enemies': 'ENEMIES:',
        'test.abilitiesHelp': 'ABILITIES — click = rank +1 (max 4)',
        'test.activeBuffs': 'ACTIVE BUFFS',
        'test.none': 'None',
        'roadmap.reward': 'Reward',
        'roadmap.locked': 'locked',
        'roadmap.ready': 'ready',
        'roadmap.skillUnlock': 'New skill at this level',
        'milestone.statSuffix': '. ',
        'milestone.unlockedAt': 'Unlocked from Lv',
        'milestone.lockedFrom': 'From Lv',
        'milestone.archiveAvailable': 'AVAILABLE NOW',
        'pack.subtitle': 'Spin the reel and claim a permanent account card.',
        'hud.levelShort': 'LEVEL',
        'hud.waveShort': 'WAVE',
        'hud.zone': 'ZONE',
        'hud.hitRush': 'HIT RUSH',
        'hud.abilityXp': 'Ability XP',
        'result.victory': 'VICTORY',
        'result.defeated': 'DEFEATED',
        'result.home': 'Home',
        'result.skills': 'Skills',
        'result.retry': 'Retry',
        'result.nextFight': 'Next Fight',
        'result.runEndless': 'Run Endless',
        'result.winTitle': 'Level {n} Clear',
        'result.winCopy': 'Rewards paid out. The next mission is live.',
        'result.failTitle': 'Mission Failed',
        'result.failCopy': 'One hit costs one full heart. Upgrade and push again.',
        'result.endlessOver': 'Endless Run Over',
        'result.endlessCopy': 'Endless is for pushing builds, not for farming money.',
        'result.statGold': 'Gold Earned',
        'result.statGems': 'Gems Earned',
        'result.statNextMission': 'Next Mission',
        'result.statMilestone': 'Milestone Bonus',
        'result.statMission': 'Mission',
        'result.statBestReach': 'Best Reach',
        'result.statGoldBank': 'Gold Bank',
        'result.statSkillsUsed': 'Skills Used',
        'result.statWaves': 'Waves Survived',
        'result.statScaled': 'Scaled Level',
        'result.pack': 'Pack',
        'result.leaderboardTitle': 'LEADERBOARD',
        'result.before': 'BEFORE',
        'result.after': 'AFTER',
        'result.lbClimbed': 'Climbed {n} place(s) up the league.',
        'result.lbDropped': 'Slipped {n} place(s) down the league.',
        'result.lbHeld': 'Held your position in the league.',
        'settings.leaveTitle': 'Leave Game',
        'settings.leaveCopy': 'Quit the run and return to the home screen.',
        'settings.dmgPopups': 'Damage Numbers',
        'settings.dmgPopupsCopy': 'Show floating damage numbers when you hit enemies.'
    },
    de: {
        'hud.level': 'LEVEL 1',
        'hud.wave': 'WELLE 0/0',
        'rail.newSkill': 'NEUER SKILL',
        'rail.skills': 'Skills',
        'rail.noAds': 'Keine Werbung',
        'rail.leaderboard': 'Rangliste',
        'rail.quests': 'Aufgaben',
        'rail.dailyLogin': 'Täglicher Login',
        'rail.test': 'Test',
        'cta.endless': 'ENDLOS',
        'cta.level': 'EBENE',
        'nav.shop': 'SHOP',
        'nav.equipment': 'AUSRÜSTUNG',
        'nav.fight': 'KÄMPFEN',
        'nav.upgrades': 'UPGRADES',
        'nav.inventory': 'INVENTAR',
        'nav.skills': 'SKILLS',
        'shop.title': 'MARKT',
        'shop.sub': 'Kartenpakete oben, Utility darunter, Premium ganz eigenes Regal.',
        'shop.cardShop': 'Kartenshop',
        'shop.goldPacks': 'Gold-Pakete',
        'shop.skinPacks': 'Skin-Pakete',
        'shop.skinPacksTags': 'Gold, Edelsteine, Premium',
        'shop.gemLab': 'Edelstein-Labor',
        'shop.utility': 'Utility',
        'shop.premiumVault': 'Premium-Tresor',
        'shop.realMoney': 'Echtgeld',
        'inventory.title': 'INVENTAR',
        'inventory.sub': 'Öffne hier deine gespeicherten Pakete und verkaufe doppelte Karten.',
        'equipment.title': 'AUSRÜSTUNG',
        'equipment.sub': 'Rüste Karten aus. Slots schalten sich mit dem Level frei.',
        'equipment.slotProgression': 'Slot-Fortschritt',
        'equipment.normalSlots': 'Normale Slots',
        'equipment.legendarySlots': 'Legendäre Slots',
        'equipment.slotLockedAt': 'Frei ab Lv',
        'equipment.empty': 'Leer',
        'equipment.maxNote': 'Maximale Slots: 5 Normal + 2 gekauft · 2 Legendär + 1 gekauft. Der Shop verkauft nicht mehr.',
        'abilities.title': 'FÄHIGKEITS-ARCHIV',
        'hub.title': 'STRIKER-X',
        'hub.sub': 'Upgrade-Ringe drehen sich wie im Referenz-Layout um das Schiff.',
        'settings.title': 'EINSTELLUNGEN',
        'settings.language': 'Sprache',
        'settings.languageCopy': 'Wechsle die Oberfläche zwischen Englisch und Deutsch.',
        'settings.sfx': 'SFX-Lautstärke',
        'settings.sfxCopy': 'Schüsse, Treffer und Pack-Sounds.',
        'settings.music': 'Musik-Lautstärke',
        'settings.musicCopy': 'Hintergrundmusik in Lobby und Spiel.',
        'settings.haptics': 'Haptik',
        'settings.hapticsCopy': 'Vibration bei Treffern und Belohnungen (Android & In-App).',
        'daily.title': 'TÄGLICHER LOGIN',
        'daily.status': 'Tag 1 bereit',
        'daily.statusReady': 'Tag {n} bereit',
        'daily.statusClaimed': 'Tag {n} abgeholt',
        'daily.streak': 'Streak {n}',
        'daily.copyReady': 'Heute kannst du den aktuellen Reward holen. Eingesammelte Tage bleiben markiert.',
        'daily.copyClaimed': 'Heute ist schon eingesammelt. Die nächsten Tage sind unten sichtbar.',
        'daily.done': 'Fertig',
        'daily.now': 'Jetzt',
        'daily.later': 'Später',
        'quests.title': 'AUFGABEN',
        'quests.sub': 'Erledige sie und steige in der Liga auf.',
        'leaderboard.subline': 'Erreiche <strong>Top 3</strong> und gewinne tolle Preise!',
        'runSummary.title': 'GENUTZTE SKILLS',
        'runSummary.sub': 'Diese Fähigkeiten hast du in diesem Run genutzt.',
        'runSummary.empty': 'In diesem Run wurden keine Skills gewählt.',
        'runSummary.rank': 'Rang',
        'test.title': '🧪 TEST-ARENA',
        'test.start': '▶ ARENA STARTEN',
        'test.stop': '■ STOPPEN',
        'test.reset': '↻ RESET',
        'test.god': 'GOD MODE',
        'test.oneshot': 'ONE-SHOT',
        'test.enemies': 'GEGNER:',
        'test.abilitiesHelp': 'SKILLS — Klick = Rang +1 (max 4)',
        'test.activeBuffs': 'AKTIVE BUFFS',
        'test.none': 'Keine',
        'roadmap.reward': 'Belohnung',
        'roadmap.locked': 'gesperrt',
        'roadmap.ready': 'bereit',
        'roadmap.skillUnlock': 'Neuer Skill auf diesem Level',
        'milestone.statSuffix': '. ',
        'milestone.unlockedAt': 'Frei ab Lv',
        'milestone.lockedFrom': 'Ab Lv',
        'milestone.archiveAvailable': 'JETZT VERFÜGBAR',
        'pack.subtitle': 'Lass die Walze drehen und sichere dir eine permanente Account-Karte.',
        'hud.levelShort': 'LEVEL',
        'hud.waveShort': 'WELLE',
        'hud.zone': 'ZONE',
        'hud.hitRush': 'KILLRAUSCH',
        'hud.abilityXp': 'Skill-XP',
        'result.victory': 'SIEG',
        'result.defeated': 'BESIEGT',
        'result.home': 'Home',
        'result.skills': 'Skills',
        'result.retry': 'Erneut',
        'result.nextFight': 'Nächster Kampf',
        'result.runEndless': 'Endlos starten',
        'result.winTitle': 'Level {n} geschafft',
        'result.winCopy': 'Belohnungen ausgezahlt. Die nächste Mission steht.',
        'result.failTitle': 'Mission gescheitert',
        'result.failCopy': 'Ein Treffer kostet ein ganzes Herz. Upgrade und probier es nochmal.',
        'result.endlessOver': 'Endlos-Run vorbei',
        'result.endlessCopy': 'Endlos ist zum Builds-Pushen da, nicht zum Farmen.',
        'result.statGold': 'Gold erhalten',
        'result.statGems': 'Edelsteine erhalten',
        'result.statNextMission': 'Nächste Mission',
        'result.statMilestone': 'Meilenstein-Bonus',
        'result.statMission': 'Mission',
        'result.statBestReach': 'Beste Welle',
        'result.statGoldBank': 'Gold-Konto',
        'result.statSkillsUsed': 'Genutzte Skills',
        'result.statWaves': 'Überlebte Wellen',
        'result.statScaled': 'Skaliertes Level',
        'result.pack': 'Pack',
        'result.leaderboardTitle': 'RANGLISTE',
        'result.before': 'VORHER',
        'result.after': 'NACHHER',
        'result.lbClimbed': '{n} Platz/Plätze aufgestiegen.',
        'result.lbDropped': '{n} Platz/Plätze gefallen.',
        'result.lbHeld': 'Position in der Liga gehalten.',
        'settings.leaveTitle': 'Spiel verlassen',
        'settings.leaveCopy': 'Run beenden und zum Hauptbildschirm zurückkehren.',
        'settings.dmgPopups': 'Schadenszahlen',
        'settings.dmgPopupsCopy': 'Zeige fliegende Schadenszahlen bei Treffern.'
    }
};

// === Bilingual skill table (auto-injected). Localised name + desc per skill
// AND per tree rank, in en/de. Helper functions tSkill() / tSkillRank() return
// the right object based on getLang(). ===
const SKILL_I18N = {
    damage_boost: {
        en: { name: 'Damage Core', desc: '+18% base weapon damage with a subtle overcharge glow.', tree: [
            { name: 'Damage Core',        desc: '+18% damage. Adds a subtle red overcharge glow to every shot.' },
            { name: 'Power Cell',         desc: '+30% damage. Bullets leave a faint red trail so volleys read at a glance.' },
            { name: 'Overcharge Reactor', desc: '+55% damage. Every 5th bullet is a guaranteed crit dealing 3x damage.' },
            { name: 'Singularity Coil',   desc: 'Every bullet crits for 2x damage with a small impact flash on hit.' }
        ]},
        de: { name: 'Schadenskern', desc: '+18% Grundschaden mit dezentem Glüh-Effekt.', tree: [
            { name: 'Schadenskern',         desc: '+18% Schaden. Schüsse leuchten leicht rot überladen.' },
            { name: 'Energiezelle',         desc: '+30% Schaden. Schüsse hinterlassen eine schwache rote Spur.' },
            { name: 'Überladener Reaktor',  desc: '+55% Schaden. Jeder 5. Schuss ist ein garantierter Crit (3x).' },
            { name: 'Singularitäts-Spule',  desc: 'Jeder Schuss crittet für 2x Schaden mit kleinem Aufprall-Blitz.' }
        ]}
    },
    rapid_fire: {
        en: { name: 'Rapid Barrel', desc: '+22% fire rate so every volley fires noticeably faster.', tree: [
            { name: 'Rapid Barrel',  desc: '+22% fire rate. Reloads feel snappier between volleys.' },
            { name: 'Hyper Barrel',  desc: '+38% fire rate with a bigger, brighter muzzle flash.' },
            { name: 'Auto-Loader',   desc: '+58% fire rate. Each kill grants a 0.5s frenzy buff (+30% extra fire rate).' },
            { name: 'Minigun Mode',  desc: '2x fire rate. Bullets ricochet once off arena walls.' }
        ]},
        de: { name: 'Schnelles Rohr', desc: '+22% Feuerrate — jede Salve ist spürbar schneller.', tree: [
            { name: 'Schnelles Rohr', desc: '+22% Feuerrate. Salven fühlen sich zackiger an.' },
            { name: 'Hyper-Rohr',     desc: '+38% Feuerrate mit größerem, hellerem Mündungsblitz.' },
            { name: 'Auto-Lader',     desc: '+58% Feuerrate. Jeder Kill löst 0.5s Frenzy aus (+30% Feuerrate).' },
            { name: 'Minigun-Modus',  desc: '2x Feuerrate. Schüsse prallen einmal von Wänden ab.' }
        ]}
    },
    multi: {
        en: { name: 'Twin Volley', desc: '+1 extra projectile per volley so each shot covers more area.', tree: [
            { name: 'Twin Volley',   desc: '+1 extra projectile per volley.' },
            { name: 'Triple Tap',    desc: '+2 extra projectiles with a slight horizontal spread.' },
            { name: 'Storm Volley',  desc: '+3 extra projectiles in an arc — feels like a shotgun blast.' },
            { name: 'Pulsar Burst',  desc: 'Every 4th volley fires an additional 360° ring of bullets around you.' }
        ]},
        de: { name: 'Doppelsalve', desc: '+1 zusätzliches Projektil pro Salve — größerer Trefferbereich.', tree: [
            { name: 'Doppelsalve',    desc: '+1 zusätzliches Projektil pro Salve.' },
            { name: 'Dreifach-Schuss', desc: '+2 zusätzliche Projektile mit leichter Streuung.' },
            { name: 'Sturmsalve',     desc: '+3 zusätzliche Projektile im Bogen — wirkt wie eine Schrotsalve.' },
            { name: 'Pulsar-Burst',   desc: 'Jede 4. Salve feuert zusätzlich einen 360°-Ring um dich herum.' }
        ]}
    },
    pierce: {
        en: { name: 'Pierce Core', desc: 'Bullets pass through one extra enemy before stopping.', tree: [
            { name: 'Pierce Core',  desc: 'Bullets pierce 1 extra enemy.' },
            { name: 'Lance Round',  desc: 'Bullets pierce up to 3 enemies and gain +20% damage per pierce.' },
            { name: 'Railgun Mode', desc: 'Bullets pierce ALL enemies and leave a glowing arc trail.' },
            { name: 'Void Lance',   desc: 'Pierce all. 35% chance to mark a target — its next hit deals double damage.' }
        ]},
        de: { name: 'Durchschlag-Kern', desc: 'Schüsse durchdringen einen zusätzlichen Gegner.', tree: [
            { name: 'Durchschlag-Kern', desc: 'Schüsse durchdringen +1 Gegner.' },
            { name: 'Lanzen-Geschoss',   desc: 'Durchdringen +3 Gegner und +20% Schaden je Durchschlag.' },
            { name: 'Railgun-Modus',     desc: 'Durchdringen alle Gegner mit leuchtender Spur.' },
            { name: 'Leerlanze',         desc: 'Alle Gegner durchschlagen. 35% Markierung — nächster Treffer = doppelter Schaden.' }
        ]}
    },
    orbiter: {
        en: { name: 'Combat Drone', desc: 'A drone follows you and auto-fires at enemies for 30% of your damage.', tree: [
            { name: 'Combat Drone',  desc: '1 drone auto-fires (30% damage). Dies on contact, respawns in 15s.' },
            { name: 'Twin Drones',   desc: '2 drones with faster fire rate, 30% damage each.' },
            { name: 'Drone Swarm',   desc: '4 drones giving full coverage all around your ship.' },
            { name: 'Sentinel Halo', desc: '6 drones, +25% drone damage and respawn time cut to 8s.' }
        ]},
        de: { name: 'Kampfdrohne', desc: 'Eine Drohne begleitet dich und schießt automatisch (30% Schaden).', tree: [
            { name: 'Kampfdrohne',     desc: '1 Drohne (30% Schaden). Stirbt bei Kontakt, respawnt in 15s.' },
            { name: 'Zwillingsdrohnen', desc: '2 Drohnen mit höherer Feuerrate (je 30% Schaden).' },
            { name: 'Drohnenschwarm',   desc: '4 Drohnen — volle Rundum-Abdeckung.' },
            { name: 'Wächter-Halo',     desc: '6 Drohnen, +25% Drohnenschaden, Respawn nach 8s.' }
        ]}
    },
    echo_shot: {
        en: { name: 'Echo Shock', desc: 'Every 4th hit creates a shockwave at the impact point.', tree: [
            { name: 'Echo Shock',    desc: 'Every 4th hit fires a shockwave (60% damage, 80px radius).' },
            { name: 'Double Echo',   desc: 'Every 3rd hit fires a shockwave (90% damage, 100px radius).' },
            { name: 'Resonance',     desc: 'Every 2nd hit fires a shockwave (120% damage, 130px radius).' },
            { name: 'Phantom Salvo', desc: 'EVERY hit fires a small shockwave (50% damage, 110px radius).' }
        ]},
        de: { name: 'Echo-Schock', desc: 'Jeder 4. Treffer erzeugt eine Schockwelle.', tree: [
            { name: 'Echo-Schock',     desc: 'Jeder 4. Treffer = Schockwelle (60% Schaden, 80px).' },
            { name: 'Doppel-Echo',      desc: 'Jeder 3. Treffer = Schockwelle (90% Schaden, 100px).' },
            { name: 'Resonanz',         desc: 'Jeder 2. Treffer = Schockwelle (120% Schaden, 130px).' },
            { name: 'Phantom-Salve',    desc: 'JEDER Treffer = kleine Schockwelle (50% Schaden, 110px).' }
        ]}
    },
    heal_heart: {
        en: { name: 'Patch Heart', desc: 'Adds extra hearts that absorb hits before your real HP.', tree: [
            { name: 'Patch Heart',    desc: '+1 extra heart. Lost first; does not regenerate during the run.' },
            { name: 'Field Surgeon',  desc: '+2 extra hearts that soak hits before your real HP.' },
            { name: 'Lifeline',       desc: '+3 extra hearts. Every 25 kills you regain one extra heart.' },
            { name: 'Crimson Aegis',  desc: '+4 extra hearts. The first lethal hit per run is fully blocked.' }
        ]},
        de: { name: 'Flick-Herz', desc: 'Zusätzliche Herzen die Treffer vor der echten HP abfangen.', tree: [
            { name: 'Flick-Herz',     desc: '+1 Extra-Herz. Wird zuerst zerstört, lädt im Run nicht nach.' },
            { name: 'Feldsanitäter',   desc: '+2 Extra-Herzen die Treffer abfangen.' },
            { name: 'Lebenslinie',     desc: '+3 Extra-Herzen. Alle 25 Kills bekommst du eines zurück.' },
            { name: 'Karmesin-Ägis',   desc: '+4 Extra-Herzen. Erster tödlicher Treffer pro Run wird geblockt.' }
        ]}
    },
    chain_lightning: {
        en: { name: 'Chain Lightning', desc: 'Hits jump to nearby enemies as a lightning arc.', tree: [
            { name: 'Chain Lightning', desc: 'Each hit chains to 1 nearby enemy.' },
            { name: 'Storm Chain',     desc: 'Chains to 3 enemies with longer reach.' },
            { name: 'Tesla Net',       desc: 'Chains to 6 enemies and briefly paralyses them.' },
            { name: "Thor's Will",     desc: 'Every kill triggers a free chain to 4 nearby enemies.' }
        ]},
        de: { name: 'Kettenblitz', desc: 'Treffer springen als Blitz auf weitere Gegner.', tree: [
            { name: 'Kettenblitz', desc: 'Jeder Treffer springt auf 1 nahen Gegner über.' },
            { name: 'Sturmkette',  desc: 'Springt auf 3 Gegner mit größerer Reichweite.' },
            { name: 'Tesla-Netz',  desc: 'Springt auf 6 Gegner und lähmt sie kurz.' },
            { name: 'Thors Wille', desc: 'Jeder Kill löst Gratis-Blitz auf 4 nahe Gegner aus.' }
        ]}
    },
    tornado_shot: {
        en: { name: 'Tornado Shot', desc: 'Every 3rd volley fires homing tornado bullets.', tree: [
            { name: 'Tornado Shot',     desc: 'Every 3rd volley fires tornado bullets that curve toward enemies.' },
            { name: 'Cyclone Volley',   desc: 'Every 2nd volley is a tornado with double the radius.' },
            { name: 'Maelstrom',        desc: 'Tornadoes pull enemies in and tick damage every 0.2s.' },
            { name: 'Eye of the Storm', desc: 'A permanent tornado follows your aim and shreds anything close.' }
        ]},
        de: { name: 'Tornado-Schuss', desc: 'Jede 3. Salve feuert zielsuchende Tornados.', tree: [
            { name: 'Tornado-Schuss',  desc: 'Jede 3. Salve feuert Tornados die auf Gegner zusteuern.' },
            { name: 'Zyklon-Salve',    desc: 'Jede 2. Salve ist ein Tornado mit doppeltem Radius.' },
            { name: 'Mahlstrom',       desc: 'Tornados ziehen Gegner an und ticken Schaden alle 0.2s.' },
            { name: 'Auge des Sturms', desc: 'Permanenter Tornado folgt deinem Cursor und zerfetzt alles.' }
        ]}
    },
    phoenix_drive: {
        en: { name: 'Phoenix Aura', desc: 'A heat aura around you constantly burns nearby enemies.', tree: [
            { name: 'Phoenix Aura',    desc: '90px aura that burns enemies for 22% damage per second.' },
            { name: 'Ash Bloom',       desc: '130px aura, 35%/s burn, applies a small DoT on contact.' },
            { name: 'Solar Halo',      desc: '180px aura, 55%/s burn, +3s invincibility on damage taken.' },
            { name: 'Eternal Phoenix', desc: '240px aura, 90%/s burn. Revives you once per run.' }
        ]},
        de: { name: 'Phönix-Aura', desc: 'Hitze-Aura verbrennt nahe Gegner permanent.', tree: [
            { name: 'Phönix-Aura',     desc: '90px Aura — 22% Schaden pro Sekunde.' },
            { name: 'Aschenblüte',      desc: '130px Aura, 35%/s Burn, leichter DoT.' },
            { name: 'Sonnen-Halo',      desc: '180px Aura, 55%/s Burn, 3s Unverwundbarkeit bei HP-Verlust.' },
            { name: 'Ewiger Phönix',    desc: '240px Aura, 90%/s Burn, eine Wiederbelebung pro Run.' }
        ]}
    },
    ion_round: {
        en: { name: 'Ion Round', desc: 'Every 5th bullet becomes a heavy splash bolt.', tree: [
            { name: 'Ion Round',       desc: 'Heavy splash bolt every 5 shots (180% damage, 70px splash).' },
            { name: 'Plasma Round',    desc: '100px splash, 230% damage, applies a small burn.' },
            { name: 'Ion Cannon',      desc: '130px splash, 320% damage, ignores pierce limits.' },
            { name: 'Antimatter Bolt', desc: '160px splash. Vaporises any non-boss enemy on hit.' }
        ]},
        de: { name: 'Ionen-Geschoss', desc: 'Jeder 5. Schuss wird ein schwerer Splash-Bolzen.', tree: [
            { name: 'Ionen-Geschoss',   desc: 'Schwerer Splash alle 5 Schüsse (180% Schaden, 70px).' },
            { name: 'Plasma-Geschoss',  desc: '100px Splash, 230% Schaden, leichter Burn.' },
            { name: 'Ionenkanone',      desc: '130px Splash, 320% Schaden, ignoriert Durchschlag-Limits.' },
            { name: 'Antimaterie-Bolzen', desc: '160px Splash. Verdampft Nicht-Boss-Gegner sofort.' }
        ]}
    },
    shock_nova: {
        en: { name: 'Shock Nova', desc: 'Every 12 kills release a damaging lightning ring around you.', tree: [
            { name: 'Shock Nova',    desc: 'Every 12 kills releases a lightning ring around you.' },
            { name: 'Pulse Nova',    desc: 'Triggers every 8 kills and the ring is bigger.' },
            { name: 'Chain Nova',    desc: 'Each nova spawns 6 chain bolts to random enemies.' },
            { name: 'Eternal Storm', desc: 'Nova every 4 kills + permanent shock aura around you.' }
        ]},
        de: { name: 'Schock-Nova', desc: 'Alle 12 Kills entfesselt sich ein Blitz-Ring um dich.', tree: [
            { name: 'Schock-Nova', desc: 'Alle 12 Kills = ein Blitz-Ring um dich.' },
            { name: 'Puls-Nova',   desc: 'Auslöser alle 8 Kills, Ring ist größer.' },
            { name: 'Ketten-Nova', desc: 'Jede Nova entfesselt 6 Ketten-Blitze.' },
            { name: 'Ewiger Sturm', desc: 'Nova alle 4 Kills + dauerhafte Schock-Aura.' }
        ]}
    },
    singularity: {
        en: { name: 'Singularity', desc: 'Every 8th volley creates a brief gravity well that pulls enemies in.', tree: [
            { name: 'Singularity',    desc: 'Every 8th volley creates a brief pull field.' },
            { name: 'Black Pull',     desc: 'Pull field lasts longer and ticks small damage while active.' },
            { name: 'Void Implosion', desc: 'After the pull ends, the field implodes for huge damage.' },
            { name: 'Event Horizon',  desc: 'A permanent micro-singularity orbits your ship.' }
        ]},
        de: { name: 'Singularität', desc: 'Jede 8. Salve erzeugt ein Schwerkraft-Feld das Gegner anzieht.', tree: [
            { name: 'Singularität',    desc: 'Jede 8. Salve erzeugt ein kurzes Anzieh-Feld.' },
            { name: 'Schwarzer Sog',    desc: 'Anzieh-Feld hält länger und tickt leichten Schaden.' },
            { name: 'Leeren-Implosion', desc: 'Nach dem Sog implodiert das Feld mit massivem Schaden.' },
            { name: 'Ereignishorizont', desc: 'Permanente Mikro-Singularität umkreist dein Schiff.' }
        ]}
    },
    cluster_bomb: {
        en: { name: 'Mini Bomb', desc: 'Every 10th shot fires a small bomb (300% AOE damage).', tree: [
            { name: 'Mini Bomb',         desc: 'Every 10th shot fires a small bomb (300% damage).' },
            { name: 'Double Bomb',       desc: 'Bomb every 7 shots with a 50% bigger blast radius.' },
            { name: 'Cluster Bomb',      desc: 'Bomb splits into 5 sub-bombs on impact for chain explosions.' },
            { name: 'Cluster Detonation', desc: 'Bomb splits twice — massive cascading chain explosion.' }
        ]},
        de: { name: 'Mini-Bombe', desc: 'Jeder 10. Schuss feuert eine kleine Bombe (300% AOE).', tree: [
            { name: 'Mini-Bombe',        desc: 'Jeder 10. Schuss = kleine Bombe (300% Schaden).' },
            { name: 'Doppelbombe',       desc: 'Bombe alle 7 Schüsse, +50% größerer Radius.' },
            { name: 'Streubombe',        desc: 'Bombe spaltet beim Aufprall in 5 Sub-Bomben.' },
            { name: 'Cluster-Detonation', desc: 'Bombe spaltet sich 2x — massive Kettenexplosion.' }
        ]}
    },
    ricochet: {
        en: { name: 'Ricochet Round', desc: 'Bullets bounce off walls once before stopping.', tree: [
            { name: 'Ricochet Round',  desc: 'Bullets bounce off walls 1 time.' },
            { name: 'Twin Ricochet',   desc: 'Bullets bounce 2 times and gain +20% damage per bounce.' },
            { name: 'Pinball Master',  desc: 'Bullets bounce 4 times and home in on enemies after each bounce.' },
            { name: 'Infinite Bounce', desc: 'Bullets bounce forever until they hit something.' }
        ]},
        de: { name: 'Querschläger', desc: 'Schüsse prallen einmal von Wänden ab.', tree: [
            { name: 'Querschläger',      desc: 'Schüsse prallen 1x ab.' },
            { name: 'Doppel-Querschläger', desc: 'Schüsse prallen 2x ab, +20% Schaden je Abpraller.' },
            { name: 'Pinball-Meister',    desc: 'Schüsse prallen 4x ab und suchen Gegner nach jedem Abpraller.' },
            { name: 'Unendlich Abpraller', desc: 'Schüsse prallen unendlich oft ab bis sie etwas treffen.' }
        ]}
    },
    vampire: {
        en: { name: 'Vampire Round', desc: 'Heal a small percentage of the damage you deal.', tree: [
            { name: 'Vampire Round', desc: 'Heal 1% of damage dealt as life-steal.' },
            { name: 'Blood Magnet',  desc: 'Heal 2% as life-steal and pickup range +20%.' },
            { name: 'Life Drinker',  desc: 'Heal 4% life-steal. Kills sometimes drop a heart pickup.' },
            { name: 'Eternal Bloodlust', desc: 'Heal 8% life-steal. Boss kills fully heal you.' }
        ]},
        de: { name: 'Vampir-Geschoss', desc: 'Heilt einen kleinen Anteil des verursachten Schadens.', tree: [
            { name: 'Vampir-Geschoss', desc: 'Heilt 1% Lebensraub pro Treffer.' },
            { name: 'Blut-Magnet',     desc: 'Heilt 2% Lebensraub + 20% mehr Aufsammel-Reichweite.' },
            { name: 'Lebenstrinker',    desc: 'Heilt 4% Lebensraub. Kills lassen manchmal ein Herz fallen.' },
            { name: 'Ewiger Blutrausch', desc: 'Heilt 8% Lebensraub. Boss-Kills heilen voll.' }
        ]}
    },
    frost_shot: {
        en: { name: 'Frost Shot', desc: 'Hits slow enemies down briefly.', tree: [
            { name: 'Frost Shot',     desc: 'Hits slow enemies by 25% for 1.5s.' },
            { name: 'Ice Shard',      desc: 'Slow 40% + 5% frostbite damage-over-time.' },
            { name: 'Deep Freeze',    desc: 'Slow 60% + 15% chance to freeze enemies in place.' },
            { name: 'Absolute Zero',  desc: 'Frozen enemies shatter explosively when killed.' }
        ]},
        de: { name: 'Frost-Geschoss', desc: 'Treffer verlangsamen Gegner kurz.', tree: [
            { name: 'Frost-Geschoss', desc: 'Treffer verlangsamen Gegner um 25% für 1.5s.' },
            { name: 'Eis-Splitter',    desc: 'Verlangsamung 40% + 5% Frostbiss-DoT.' },
            { name: 'Tiefkühl',         desc: 'Verlangsamung 60% + 15% Chance auf Einfrieren.' },
            { name: 'Absoluter Nullpunkt', desc: 'Eingefrorene Gegner zerschmettern explosiv beim Tod.' }
        ]}
    },
    poison_dart: {
        en: { name: 'Poison Dart', desc: 'Hits poison enemies, dealing extra damage over time.', tree: [
            { name: 'Poison Dart',     desc: 'Hits apply poison: 8% of attack damage over 3s.' },
            { name: 'Toxin',           desc: 'Poison ticks 12% over 4s and spreads to nearby enemies.' },
            { name: 'Acid Cloud',      desc: 'Poisoned enemies explode into an acid cloud on death.' },
            { name: 'Plague Carrier',  desc: 'Poison jumps between enemies like a viral infection.' }
        ]},
        de: { name: 'Gift-Pfeil', desc: 'Treffer vergiften Gegner mit Schaden über Zeit.', tree: [
            { name: 'Gift-Pfeil', desc: 'Treffer vergiften: 8% des Angriffsschadens über 3s.' },
            { name: 'Toxin',      desc: 'Gift tickt 12% über 4s und breitet sich auf nahe Gegner aus.' },
            { name: 'Säurewolke',  desc: 'Vergiftete Gegner explodieren beim Tod in eine Säurewolke.' },
            { name: 'Seuchenträger', desc: 'Gift springt zwischen Gegnern wie ein Virus.' }
        ]}
    },
    bullet_storm: {
        en: { name: 'Frenzy Mode', desc: 'Each kill stacks fire rate. Stacks decay after 2 idle seconds.', tree: [
            { name: 'Frenzy Mode',   desc: '+3% fire rate per kill (cap +30%). Decays after 2s without a kill.' },
            { name: 'Killing Spree', desc: 'Cap raised to +50%, also +10% damage at full stacks.' },
            { name: 'Berserker',     desc: 'Cap raised to +80% and you become immune to slow effects.' },
            { name: 'Eternal Storm', desc: 'Stacks no longer decay. Permanent frenzy build-up.' }
        ]},
        de: { name: 'Frenzy-Modus', desc: 'Jeder Kill stackt Feuerrate. Stacks zerfallen nach 2s untätig.', tree: [
            { name: 'Frenzy-Modus', desc: '+3% Feuerrate pro Kill (Cap +30%). Zerfällt nach 2s.' },
            { name: 'Kill-Rausch',   desc: 'Cap erhöht auf +50% und +10% Schaden bei vollen Stacks.' },
            { name: 'Berserker',     desc: 'Cap erhöht auf +80% und Immunität gegen Verlangsamung.' },
            { name: 'Ewiger Sturm',   desc: 'Stacks zerfallen nicht mehr. Permanenter Aufbau.' }
        ]}
    },
    lucky_seven: {
        en: { name: 'Lucky Seven', desc: 'Every 7th shot deals 5x damage.', tree: [
            { name: 'Lucky Seven',  desc: 'Every 7th shot deals 5x damage.' },
            { name: 'Seven Stars',  desc: 'Every 7th shot deals 8x damage with a sparkle effect.' },
            { name: 'Jackpot',      desc: 'Every 5th shot deals 10x damage and heals 1 HP if it kills.' },
            { name: 'Royal Flush',  desc: 'Every 4th shot deals 15x damage. Small chance for a 30x mega-crit.' }
        ]},
        de: { name: 'Glückszahl', desc: 'Jeder 7. Schuss = 5-facher Schaden.', tree: [
            { name: 'Glückszahl', desc: 'Jeder 7. Schuss = 5x Schaden.' },
            { name: 'Sieben Sterne', desc: 'Jeder 7. Schuss = 8x Schaden mit Glanz-Effekt.' },
            { name: 'Jackpot',     desc: 'Jeder 5. Schuss = 10x Schaden und heilt 1 HP bei Kill.' },
            { name: 'Royal Flush', desc: 'Jeder 4. Schuss = 15x Schaden. Chance auf 30x Mega-Crit.' }
        ]}
    },
    crit_chance: {
        en: { name: 'Precision Core', desc: 'Shots have a 15% chance to crit for 2x damage.', tree: [
            { name: 'Precision Core', desc: '15% crit chance for 2x damage.' },
            { name: 'Headhunter',     desc: '25% crit chance for 2.5x damage.' },
            { name: 'Lethal Edge',    desc: '40% crit chance. Crits gain +1 pierce.' },
            { name: 'Deadeye',        desc: '60% crit chance. Crits deal 4x damage.' }
        ]},
        de: { name: 'Präzisions-Kern', desc: 'Schüsse haben 15% Crit-Chance (2x Schaden).', tree: [
            { name: 'Präzisions-Kern', desc: '15% Crit-Chance für 2x Schaden.' },
            { name: 'Kopfgeldjäger',    desc: '25% Crit-Chance für 2.5x Schaden.' },
            { name: 'Tödliche Schneide', desc: '40% Crit-Chance. Crits = +1 Durchschlag.' },
            { name: 'Adlerauge',         desc: '60% Crit-Chance. Crits = 4x Schaden.' }
        ]}
    },
    glass_cannon: {
        en: { name: 'Glass Cannon', desc: '+60% damage but you have 1 less max HP. High-risk build.', tree: [
            { name: 'Glass Cannon',  desc: '+60% damage, but -1 max HP.' },
            { name: 'Brittle Edge',  desc: '+90% damage, -1 max HP, +30% fire rate.' },
            { name: 'Last Stand',    desc: '+150% damage at 1 HP. Survive one lethal hit per run.' },
            { name: 'Suicide Pact',  desc: '3x damage, but you only have 2 HP total. Heals cost half.' }
        ]},
        de: { name: 'Glaskanone', desc: '+60% Schaden, dafür -1 max HP. High-Risk-Build.', tree: [
            { name: 'Glaskanone',   desc: '+60% Schaden, aber -1 max HP.' },
            { name: 'Brüchige Schneide', desc: '+90% Schaden, -1 max HP, +30% Feuerrate.' },
            { name: 'Letztes Gefecht', desc: '+150% Schaden bei 1 HP. Überlebe 1 tödlichen Treffer.' },
            { name: 'Selbstmord-Pakt', desc: '3x Schaden, nur 2 HP gesamt. Heals kosten halb.' }
        ]}
    },
    lich_bullets: {
        en: { name: 'Lich Eye', desc: 'Bullets split into 3 sub-bullets after 0.4s of flight.', tree: [
            { name: 'Lich Eye',       desc: 'Bullets split after 0.4s into 3 sub-bullets.' },
            { name: 'Double Lich',    desc: 'Sub-bullets split again into 2 each (3 -> 6 bullets).' },
            { name: 'Hex Multiplier', desc: 'Triple split, and each sub-bullet has 30% crit chance.' },
            { name: 'Eye of the Dead', desc: 'All bullets simultaneously gain every split-related synergy.' }
        ]},
        de: { name: 'Lich-Auge', desc: 'Schüsse spalten sich nach 0.4s in 3 Sub-Schüsse.', tree: [
            { name: 'Lich-Auge',      desc: 'Schüsse spalten nach 0.4s in 3 Sub-Schüsse.' },
            { name: 'Doppel-Lich',    desc: 'Sub-Schüsse spalten erneut in je 2 (3 -> 6).' },
            { name: 'Hex-Multiplikator', desc: 'Dreifach-Split + 30% Crit-Chance pro Sub-Schuss.' },
            { name: 'Auge des Toten',   desc: 'Alle Schüsse erhalten jede Split-Synergie gleichzeitig.' }
        ]}
    },
    platinum_rounds: {
        en: { name: 'Platinum Rounds', desc: 'Hits permanently increase your damage by a tiny amount, capped.', tree: [
            { name: 'Platinum Rounds', desc: '+0.05% permanent damage per hit (cap +30%).' },
            { name: 'Gold Splinter',   desc: '+0.08% per hit (cap +50%) plus a small fire rate cap.' },
            { name: 'Iridium Core',    desc: '+0.12% damage and +0.05% fire rate per hit (cap +80%).' },
            { name: 'Singular Hit',    desc: 'Every 100th hit gives a permanent +1% damage. No cap.' }
        ]},
        de: { name: 'Platin-Kugeln', desc: 'Treffer erhöhen permanent deinen Schaden minimal.', tree: [
            { name: 'Platin-Kugeln',  desc: '+0.05% permanenter Schaden pro Treffer (Cap +30%).' },
            { name: 'Goldsplitter',    desc: '+0.08% pro Treffer (Cap +50%), kleiner Feuerraten-Cap.' },
            { name: 'Iridium-Kern',    desc: '+0.12% Schaden und +0.05% Feuerrate pro Treffer (Cap +80%).' },
            { name: 'Singulärer Treffer', desc: 'Jeder 100. Treffer = permanent +1% Schaden. Kein Cap.' }
        ]}
    },
    blank_burst: {
        en: { name: 'Blank Burst', desc: 'Shots have a 5% chance to erase nearby enemy bullets.', tree: [
            { name: 'Blank Burst',   desc: '5% chance per shot to clear nearby enemy bullets.' },
            { name: 'Static Wave',   desc: '10% blank chance plus a 0.3s pause on enemy fire.' },
            { name: 'Bullet Eraser', desc: '18% blank chance, doubled radius, drops a small gold pickup.' },
            { name: 'Nullification', desc: '30% blank chance with a much larger clear radius.' }
        ]},
        de: { name: 'Platzpatronen', desc: 'Schüsse können nahe Gegner-Geschosse löschen.', tree: [
            { name: 'Platzpatronen',  desc: '5% Chance pro Schuss = nahe Gegner-Geschosse gelöscht.' },
            { name: 'Statische Welle', desc: '10% Blank-Chance + Gegner-Feuer pausiert 0.3s.' },
            { name: 'Geschoss-Löscher', desc: '18% Blank-Chance, doppelter Radius, kleines Gold-Pickup.' },
            { name: 'Nullifizierung',   desc: '30% Blank-Chance mit deutlich größerem Lösch-Radius.' }
        ]}
    },
    strong_spirit: {
        en: { name: 'Strong Spirit', desc: 'Survive one lethal hit per run with 1 HP and brief invincibility.', tree: [
            { name: 'Strong Spirit',  desc: 'Survive 1 lethal hit per run with 1 HP. 2s invincibility after.' },
            { name: 'Phoenix Spirit', desc: 'Resets when you fully heal. 3s invincibility plus a damage burst.' },
            { name: 'Eternal Spirit', desc: 'Resets every 60s. 5s invincibility and heals 2 HP on trigger.' },
            { name: 'Divine Shield',  desc: '1 free shield at the start of every wave. Permanent.' }
        ]},
        de: { name: 'Starker Geist', desc: 'Überlebe einen tödlichen Treffer pro Run mit 1 HP.', tree: [
            { name: 'Starker Geist',  desc: 'Überlebe 1 tödlichen Treffer pro Run mit 1 HP. 2s unverwundbar.' },
            { name: 'Phönix-Geist',    desc: 'Reset bei Vollheilung. 3s unverwundbar + Schadens-Burst.' },
            { name: 'Ewiger Geist',     desc: 'Reset alle 60s. 5s unverwundbar + heilt 2 HP.' },
            { name: 'Göttlicher Schild', desc: '1 freier Schild zu Wellen-Start. Permanent.' }
        ]}
    },
    trigger_fingers: {
        en: { name: 'Trigger Fingers', desc: 'Each kill briefly speeds up your fire rate.', tree: [
            { name: 'Trigger Fingers', desc: 'Kills give +0.5% fire rate (cap +20%).' },
            { name: 'Quick Hands',     desc: 'Kills give +1% (cap +35%) plus +5% damage bonus.' },
            { name: 'Fast Forward',    desc: 'Kills give +2% (cap +60%). Boss kills fully reset the cap.' },
            { name: 'Time Warp',       desc: 'Cap removed. Kills add +0.1% permanently for the run.' }
        ]},
        de: { name: 'Schnelle Finger', desc: 'Jeder Kill beschleunigt deine Feuerrate kurz.', tree: [
            { name: 'Schnelle Finger', desc: 'Kills geben +0.5% Feuerrate (Cap +20%).' },
            { name: 'Flinke Hände',     desc: 'Kills geben +1% (Cap +35%) + 5% Schaden.' },
            { name: 'Vorspulen',         desc: 'Kills geben +2% (Cap +60%). Boss-Kills setzen Cap zurück.' },
            { name: 'Zeit-Verzerrung',   desc: 'Cap entfällt. Kills geben permanent +0.1% für den Run.' }
        ]}
    },
    scarier_face: {
        en: { name: 'Scary Face', desc: 'All enemies spawn with 20% less max HP — they die faster.', tree: [
            { name: 'Scary Face',    desc: 'Enemies spawn with -20% max HP.' },
            { name: 'Nightmare Fuel', desc: 'Enemies have -30% HP and 10% chance to flee instead of attacking.' },
            { name: 'Total Eclipse', desc: 'Enemies -45% HP. Bosses also lose 25% max HP.' },
            { name: 'Grim Reaper',   desc: 'Enemies under 30% HP die instantly.' }
        ]},
        de: { name: 'Gruselige Fratze', desc: 'Alle Gegner spawnen mit 20% weniger max HP.', tree: [
            { name: 'Gruselige Fratze', desc: 'Gegner spawnen mit -20% max HP.' },
            { name: 'Albtraum-Treibstoff', desc: 'Gegner -30% HP + 10% Chance dass sie fliehen.' },
            { name: 'Totale Sonnenfinsternis', desc: 'Gegner -45% HP. Bosse verlieren 25% max HP.' },
            { name: 'Sensenmann',         desc: 'Gegner unter 30% HP sterben sofort.' }
        ]}
    },
    saw_blade: {
        en: { name: 'Saw Blade', desc: 'Throws slow saw projectiles that pierce through everything.', tree: [
            { name: 'Saw Blade',   desc: 'Throws a saw every 1.6s (60% damage, pierces all, hits multiple times).' },
            { name: 'Twin Saws',   desc: '2 saws per throw, 80% damage, every 1.4s.' },
            { name: 'Buzz Saw',    desc: '2 saws, 120% damage, every 1.1s, with a bigger saw radius.' },
            { name: 'Death Saws',  desc: '3 giant saws, 180% damage, every 0.9s, slight pull effect.' }
        ]},
        de: { name: 'Sägeklinge', desc: 'Wirft langsame Sägen die alles durchschneiden.', tree: [
            { name: 'Sägeklinge', desc: 'Wirft alle 1.6s eine Säge (60% Schaden, durchschlägt alles).' },
            { name: 'Doppelsäge',  desc: '2 Sägen pro Wurf, 80% Schaden, alle 1.4s.' },
            { name: 'Buzz-Säge',   desc: '2 Sägen, 120% Schaden, alle 1.1s, größerer Radius.' },
            { name: 'Todes-Sägen', desc: '3 Riesen-Sägen, 180% Schaden, alle 0.9s, leichter Sog.' }
        ]}
    },
    boomerang: {
        en: { name: 'Boomerang', desc: 'Periodically throws a boomerang that arcs out and returns.', tree: [
            { name: 'Boomerang',       desc: 'Throws a boomerang every 2.5s (140% damage, large arc back to you).' },
            { name: 'Twin Boomer',     desc: 'Every 2.0s, +1 boomerang (double throw).' },
            { name: 'Returning Storm', desc: 'Every 1.5s, 3 boomerangs in a fan pattern.' },
            { name: 'Eternal Return',  desc: 'Every 1.0s, 4 boomerangs at +50% damage.' }
        ]},
        de: { name: 'Bumerang', desc: 'Wirft regelmäßig einen Bumerang im großen Bogen.', tree: [
            { name: 'Bumerang',         desc: 'Wirft alle 2.5s einen Bumerang (140% Schaden, großer Bogen).' },
            { name: 'Zwillings-Bumerang', desc: 'Alle 2.0s, +1 Bumerang (Doppel-Wurf).' },
            { name: 'Wiederkehrender Sturm', desc: 'Alle 1.5s, 3 Bumerangs fächerförmig.' },
            { name: 'Ewige Wiederkehr',   desc: 'Alle 1.0s, 4 Bumerangs mit +50% Schaden.' }
        ]}
    },
    spread_volley: {
        en: { name: 'Spread Fire', desc: '+1 projectile with a guaranteed straight middle shot plus spread.', tree: [
            { name: 'Spread Fire',  desc: '+1 projectile and the centre shot stays straight.' },
            { name: 'Shotgun',      desc: '+2 projectiles, wider spread, centre shot stays straight.' },
            { name: 'Buckshot',     desc: '+3 projectiles plus +30% damage at close range.' },
            { name: 'Death Cone',   desc: '+5 projectiles in a 90° spread, point-blank shots deal 4x damage.' }
        ]},
        de: { name: 'Streufeuer', desc: '+1 Projektil mit gerade fliegendem Mittel-Schuss + Streuung.', tree: [
            { name: 'Streufeuer', desc: '+1 Projektil und der zentrale Schuss bleibt gerade.' },
            { name: 'Schrotflinte', desc: '+2 Projektile, breitere Streuung, Mittel-Schuss bleibt gerade.' },
            { name: 'Buckshot',    desc: '+3 Projektile + 30% Schaden auf Nahdistanz.' },
            { name: 'Todes-Kegel',  desc: '+5 Projektile, 90° Streuung, Nahschüsse machen 4x Schaden.' }
        ]}
    },
    crit_bomb: {
        en: { name: 'Crit Explosion', desc: 'Crits explode in a small AOE around the target.', tree: [
            { name: 'Crit Explosion', desc: 'Crits cause a small AOE explosion (60% splash damage).' },
            { name: 'Cluster Crit',   desc: 'Crits split with 80% splash and a bigger blast radius.' },
            { name: 'Nuclear Crit',   desc: 'Crits = 1.5x damage splash plus a stunning shockwave.' },
            { name: 'Atom Smash',     desc: 'Crits instantly kill all enemies within 100px.' }
        ]},
        de: { name: 'Crit-Explosion', desc: 'Crits explodieren in einem kleinen AOE um das Ziel.', tree: [
            { name: 'Crit-Explosion', desc: 'Crits = kleine AOE-Explosion (60% Splash).' },
            { name: 'Cluster-Crit',   desc: 'Crits spalten mit 80% Splash und größerem Radius.' },
            { name: 'Nuklearer Crit',  desc: 'Crits = 1.5x Splash-Schaden plus Stun-Schockwelle.' },
            { name: 'Atom-Schlag',     desc: 'Crits töten sofort alle Gegner im 100px Radius.' }
        ]}
    },
    phantom_shield: {
        en: { name: 'Phantom Shield', desc: 'Every 8s the next hit you take is blocked for free.', tree: [
            { name: 'Phantom Shield', desc: 'Block 1 hit every 8s (visualised as a glowing ring).' },
            { name: 'Double Shield',  desc: 'Block 1 hit every 6s, plus 1 extra charge at wave start.' },
            { name: 'Aegis Shield',   desc: 'Block 1 hit every 4s. The block reflects a counter-shot.' },
            { name: 'Divine Aura',    desc: 'Block 1 hit every 2s. Each block also heals you.' }
        ]},
        de: { name: 'Phantom-Schild', desc: 'Alle 8s wird der nächste Treffer kostenlos geblockt.', tree: [
            { name: 'Phantom-Schild', desc: 'Blockt 1 Treffer alle 8s (leuchtender Ring sichtbar).' },
            { name: 'Doppel-Schild',  desc: 'Blockt alle 6s + 1 zusätzliche Ladung bei Wellen-Start.' },
            { name: 'Ägis-Schild',     desc: 'Blockt alle 4s. Der Block reflektiert einen Konter-Schuss.' },
            { name: 'Göttliche Aura',   desc: 'Blockt alle 2s. Jeder Block heilt dich zusätzlich.' }
        ]}
    },
    arc_pulse: {
        en: { name: 'Arc Pulse', desc: 'Every 6th hit zaps 3 nearby enemies with an energy pulse.', tree: [
            { name: 'Arc Pulse',        desc: 'Every 6th hit pulses to 3 nearby enemies.' },
            { name: 'Static Field',     desc: 'Pulse every 4 hits, briefly paralysing nearby enemies.' },
            { name: 'Magnetic Storm',   desc: 'Pulse every 2 hits, hits 6 enemies.' },
            { name: 'Particle Cascade', desc: 'Every hit pulses to 8 nearby enemies.' }
        ]},
        de: { name: 'Arc-Puls', desc: 'Jeder 6. Treffer entfacht einen Energie-Puls auf 3 Gegner.', tree: [
            { name: 'Arc-Puls',         desc: 'Jeder 6. Treffer = Puls auf 3 nahe Gegner.' },
            { name: 'Statisches Feld',   desc: 'Puls alle 4 Treffer, lähmt nahe Gegner kurz.' },
            { name: 'Magnetischer Sturm', desc: 'Puls alle 2 Treffer, trifft 6 Gegner.' },
            { name: 'Partikel-Kaskade',   desc: 'Jeder Treffer pulst auf 8 nahe Gegner.' }
        ]}
    },
    heat_seeker: {
        en: { name: 'Heatseeker', desc: 'Bullets weakly home in on the closest enemy.', tree: [
            { name: 'Heatseeker',      desc: 'Bullets gently curve toward the closest enemy.' },
            { name: 'Lock-On',         desc: 'Stronger homing plus +15% damage versus locked targets.' },
            { name: 'Heat Vector',     desc: 'Hard homing — bullets can turn up to 90° mid-flight.' },
            { name: 'Smart Munition',  desc: 'Bullets wait up to 8 seconds in the air for a target before expiring.' }
        ]},
        de: { name: 'Hitzesucher', desc: 'Schüsse steuern leicht auf den nächsten Gegner zu.', tree: [
            { name: 'Hitzesucher', desc: 'Schüsse curven leicht zum nächsten Gegner.' },
            { name: 'Anvisiert',    desc: 'Stärkere Zielsuche + 15% Schaden gegen markierte Ziele.' },
            { name: 'Hitze-Vektor',  desc: 'Harte Zielsuche — Schüsse können 90° im Flug drehen.' },
            { name: 'Intelligente Munition', desc: 'Schüsse warten bis zu 8s auf ein Ziel.' }
        ]}
    },
    glass_shards: {
        en: { name: 'Glass Shards', desc: 'Hits leave glass splinters that hurt nearby enemies.', tree: [
            { name: 'Glass Shards',      desc: 'Hits leave 3 splinters in a 30px radius (50% damage each).' },
            { name: 'Diamond Edge',      desc: '5 splinters at 70% damage, applies a bleed stack.' },
            { name: 'Crystalline Storm', desc: '10 splinters that ricochet once off enemies.' },
            { name: 'Glass Apocalypse',  desc: 'Splinters explode into 5 more smaller splinters.' }
        ]},
        de: { name: 'Glas-Splitter', desc: 'Treffer hinterlassen Glassplitter die nahe Gegner verletzen.', tree: [
            { name: 'Glas-Splitter',  desc: 'Treffer = 3 Splitter im 30px Radius (je 50% Schaden).' },
            { name: 'Diamant-Schärfe', desc: '5 Splitter mit 70% Schaden + Blutungs-Stack.' },
            { name: 'Kristalliner Sturm', desc: '10 Splitter die einmal abprallen.' },
            { name: 'Glas-Apokalypse',  desc: 'Splitter explodieren in 5 weitere kleinere Splitter.' }
        ]}
    },
    combo_multiplier: {
        en: { name: 'Combo Streak', desc: '+5% damage per current killstreak (cap +50%).', tree: [
            { name: 'Combo Streak', desc: '+5% damage per consecutive kill (cap +50%).' },
            { name: 'Kill Chain',   desc: '+8% per kill (cap +80%) and the streak decays slower.' },
            { name: 'Streak Master', desc: '+12% per kill (cap +150%) plus 1 extra second of combo timer.' },
            { name: 'God Mode',      desc: '+15% per kill, no cap. The streak never expires.' }
        ]},
        de: { name: 'Combo-Streak', desc: '+5% Schaden pro aktuellem Killstreak (Cap +50%).', tree: [
            { name: 'Combo-Streak', desc: '+5% Schaden pro Kill in Folge (Cap +50%).' },
            { name: 'Kill-Kette',   desc: '+8% pro Kill (Cap +80%), zerfällt langsamer.' },
            { name: 'Streak-Meister', desc: '+12% pro Kill (Cap +150%) + 1s extra Combo-Timer.' },
            { name: 'Gott-Modus',    desc: '+15% pro Kill, kein Cap. Streak verfällt nie.' }
        ]}
    },
    fortune_coin: {
        en: { name: 'Lucky Coin', desc: 'Kills give +50% more gold.', tree: [
            { name: 'Lucky Coin',       desc: 'Kills give +50% more gold.' },
            { name: 'Golden Touch',     desc: '+100% gold and a 5% chance to drop double rewards.' },
            { name: 'Midas',            desc: '+200% gold and bosses always drop a pack token.' },
            { name: 'Wealth Generator', desc: '+400% gold plus +20 passive gold each wave clear.' }
        ]},
        de: { name: 'Glückstaler', desc: 'Kills geben +50% mehr Gold.', tree: [
            { name: 'Glückstaler',    desc: 'Kills geben +50% mehr Gold.' },
            { name: 'Goldener Touch', desc: '+100% Gold + 5% Chance auf doppelten Drop.' },
            { name: 'Midas',           desc: '+200% Gold + Bosse droppen immer ein Pack-Token.' },
            { name: 'Wohlstands-Generator', desc: '+400% Gold + 20 passives Gold pro abgeschlossener Welle.' }
        ]}
    }
};

// Localised top-level skill (falls back to ABILITIES if not in SKILL_I18N).
function tSkill(id) {
    const lang = (typeof getLang === 'function') ? getLang() : 'en';
    const entry = SKILL_I18N[id];
    if (entry && entry[lang]) return entry[lang];
    if (entry && entry.en) return entry.en;
    const ab = (typeof ABILITIES !== 'undefined') ? ABILITIES.find((a) => a.id === id) : null;
    return ab ? { name: ab.name, desc: ab.desc, tree: (ab.tree || []).map((n) => ({ name: n.name, desc: n.desc })) } : null;
}
function tSkillRank(id, rankIdx) {
    const ab = (typeof ABILITIES !== 'undefined') ? ABILITIES.find((a) => a.id === id) : null;
    const localised = tSkill(id);
    const idx = Math.max(0, Math.min(((ab && ab.tree) ? ab.tree.length : 1) - 1, rankIdx || 0));
    const tNode = (localised && localised.tree && localised.tree[idx]) || null;
    const baseNode = (ab && ab.tree && ab.tree[idx]) || null;
    return {
        name: (tNode && tNode.name) || (baseNode && baseNode.name) || (ab && ab.name) || id,
        desc: (tNode && tNode.desc) || (baseNode && baseNode.desc) || (ab && ab.desc) || '',
        tier: (baseNode && baseNode.tier) || (ab && ab.rarity) || 'common'
    };
}



function getLang() {
    const l = save?.settings?.language;
    return (l === 'de' || l === 'en') ? l : 'en';
}

function t(key, vars) {
    const lang = getLang();
    const dict = I18N[lang] || I18N.en;
    let str = dict[key];
    if (str == null) str = (I18N.en[key] != null ? I18N.en[key] : key);
    if (vars) {
        Object.keys(vars).forEach((k) => {
            str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
        });
    }
    return str;
}

function applyI18nToDom() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const value = t(key);
        // leaderboard.subline contains <strong> markup — allow HTML for that one key only
        if (key === 'leaderboard.subline') {
            el.innerHTML = value;
        } else {
            el.textContent = value;
        }
    });
    // Reflect chosen segmented button in settings
    const segs = document.querySelectorAll('.setting-segmented .seg-btn');
    const lang = getLang();
    segs.forEach((b) => b.classList.toggle('active', b.getAttribute('data-lang') === lang));
    // Update the html lang attribute so screen readers behave
    if (document.documentElement) document.documentElement.setAttribute('lang', lang);
    // Sync the dynamic CTA label with the picked language
    const cta = document.getElementById('primary-cta-label');
    if (cta) cta.textContent = `${t('cta.level')} ${save.unlocked || 1}`;
}

window.setLanguage = function(lang) {
    if (lang !== 'en' && lang !== 'de') lang = 'en';
    save.settings = save.settings || {};
    save.settings.language = lang;
    if (typeof saveSave === 'function') saveSave();
    applyI18nToDom();
    // Re-render anything that bakes localized strings into innerHTML
    if (typeof refreshLevelCta === 'function') refreshLevelCta();
    if (typeof renderDailyLoginPanel === 'function') renderDailyLoginPanel();
    if (typeof renderLevelRoadmap === 'function') renderLevelRoadmap();
    if (typeof renderShop === 'function' && document.getElementById('shop-screen')?.classList.contains('active')) renderShop();
    if (typeof renderLoadout === 'function' && document.getElementById('loadout-screen')?.classList.contains('active')) renderLoadout();
    if (typeof renderAbilityArchive === 'function' && document.getElementById('abilities-screen')?.classList.contains('active')) renderAbilityArchive();
    if (typeof refreshMapRail === 'function') refreshMapRail();
    if (typeof refreshRailBadges === 'function') refreshRailBadges();
    if (typeof drawAbilityChoices === 'function' && document.getElementById('ability-overlay')?.classList.contains('active')) drawAbilityChoices();
    if (typeof renderTestGrid === 'function') renderTestGrid();
    if (typeof updateMetaHud === 'function') updateMetaHud();
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
// ── Per-wave staggered spawn queue ──────────────────────────────────────────
// Each entry: { type, remaining, batch, interval, timer }.
// processWaveSpawnQueue() trickles enemies in instead of dropping them all at once.
let waveSpawnQueue = [];
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
let resultHomeAction = null;
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

// Pick a random colour from a small per-tier palette so successive hits don't
// look identical. Returns a CSS hex/RGBA string.
function _pickFromPalette(palette) {
    return palette[Math.floor(Math.random() * palette.length)];
}

// Floating damage number popup. Tier (size + colour palette) is driven by the
// hit's damage relative to the player's current base damage. Inside each tier
// the exact colour and size are randomised so the screen feels lively.
// Disabled entirely when save.settings.damagePopups === false.
window.showDamagePopup = function(x, y, dmg, opts) {
    opts = opts || {};
    if (!Number.isFinite(dmg) || dmg <= 0) return;
    // Honour the user's setting (default ON if unset).
    if (save && save.settings && save.settings.damagePopups === false) return;

    // Display formatting
    let label;
    if (dmg >= 1000) label = formatCompactNumber(Math.round(dmg));
    else if (dmg >= 10) label = String(Math.round(dmg));
    else label = (Math.round(dmg * 10) / 10).toString();

    // Tier by damage ratio
    const baseDmg = (player && player.dmg ? player.dmg : 1) * (player && player.damageMultiplier ? player.damageMultiplier : 1) || 1;
    const ratio = dmg / baseDmg;

    // Neon rainbow — matches the rest of the game's saturated cyberpunk palette
    // (cyan / gold / magenta / lime / hot pink / etc). Used for normal hits so
    // every popup can come up in any colour, lively but on-brand.
    const NEON_RAINBOW = [
        '#ff375f', '#ff5e7a', '#ff2f8d',          // hot pinks
        '#ff7035', '#ff9d00', '#ffb02e',          // oranges
        '#ffd14d', '#ffe698',                      // golds
        '#a3ff5c', '#00ff9d', '#34ffae',          // limes / mint
        '#00f2ff', '#7be8ff', '#5cc1ff',          // cyans
        '#bc13fe', '#d78fff', '#9f57ff',          // magentas
        '#ffffff'                                  // white highlight
    ];
    // Crit / DoT / Splash keep semantic palettes so they still READ as special.
    let palette, sizeMin, sizeMax, life;
    if (opts.crit) {
        // Crits get bright golds + hot pinks for that "headshot" pop.
        palette = ['#ffd14d', '#ffe698', '#ffb02e', '#ff375f', '#ff8ba2', '#ffffff'];
        sizeMin = 28; sizeMax = 40;
        life = 0.7;
        label = label + '!';
    } else if (opts.dot) {
        // DoT ticks stay green so the player learns "green = poison/burn".
        palette = ['#00ff9d', '#34ffae', '#7be8a3', '#a3ff5c'];
        sizeMin = 14; sizeMax = 20;
        life = 0.5;
    } else if (opts.splash) {
        // Ability/AOE hits: full warm rainbow + significantly bigger so they
        // visually dominate normal projectile hits, plus a heavy neon glow.
        palette = ['#ff7035', '#ff9d00', '#ffb02e', '#ff5c30', '#ff375f', '#ff8ba2', '#bc13fe', '#d78fff'];
        sizeMin = 32; sizeMax = 44;
        life = 0.8;
    } else if (ratio >= 6) {
        // Huge hits — full rainbow blast for maximum impact.
        palette = NEON_RAINBOW;
        sizeMin = 34; sizeMax = 46;
        life = 0.8;
    } else if (ratio >= 3) {
        // Strong hits — rainbow but skip the cool/white tones so it reads "hot".
        palette = ['#ff375f', '#ff5e7a', '#ff7035', '#ff9d00', '#ffd14d', '#bc13fe', '#d78fff'];
        sizeMin = 28; sizeMax = 36;
        life = 0.7;
    } else if (ratio >= 1.5) {
        // Boosted — warmer rainbow without the deep magentas yet.
        palette = ['#ffd14d', '#ffe698', '#ff9d00', '#a3ff5c', '#00ff9d', '#7be8ff'];
        sizeMin = 22; sizeMax = 28;
        life = 0.65;
    } else if (ratio < 0.5) {
        // Tiny hits — cooler/dimmer rainbow so they don't dominate.
        palette = ['#7be8ff', '#5cc1ff', '#cfd9ee', '#dfe7ff', '#a3ff5c', '#ffe698'];
        sizeMin = 14; sizeMax = 18;
        life = 0.5;
    } else {
        // Normal hits — full neon rainbow, every shot looks different.
        palette = NEON_RAINBOW;
        sizeMin = 18; sizeMax = 24;
        life = 0.6;
    }
    const color = _pickFromPalette(palette);
    const size = sizeMin + Math.random() * (sizeMax - sizeMin);

    // Light life jitter so the trails stagger
    const lifeJitter = life * (0.85 + Math.random() * 0.3);

    // Spread X + slight Y so stacked hits don't pile up
    const jx = (Math.random() - 0.5) * 22;
    const jy = (Math.random() - 0.5) * 6;

    fxTexts.push({
        x: x + jx,
        y: y - 8 + jy,
        text: label,
        color,
        life: lifeJitter,
        maxLife: lifeJitter,
        vy: -55 - Math.random() * 25 - Math.min(40, ratio * 5),
        size,
        glow: !!(opts.splash || opts.crit) // heavier neon halo for ability + crit hits
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
    save.settings = Object.assign({ sfx: 0.7, music: 0.35, haptics: false, language: 'en' }, save.settings || {});
    if (save.settings.language !== 'en' && save.settings.language !== 'de') save.settings.language = 'en';
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
    const dmgToggle = document.getElementById('settings-dmg-popups');
    if (dmgToggle) dmgToggle.checked = save.settings?.damagePopups !== false;
    // Reflect language pick on the segmented control
    const lang = getLang();
    document.querySelectorAll('.setting-segmented .seg-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
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

// Hard caps so the shop won't sell phantom slots and the UI can show a ceiling.
const SLOT_HARD_CAPS = { normal: 7, legendary: 3, normalPaid: 2, legendaryPaid: 1 };

// Per-slot unlock level for the *base* slots only (paid extras unlock on purchase).
function getNormalSlotUnlockLevel(idx) {
    // 1 base (lvl 1), then +1 every 15 levels up to 5 base slots:
    // slot index → unlocked at level: 0 → 1, 1 → 15, 2 → 30, 3 → 45, 4 → 60
    if (idx <= 0) return 1;
    return idx * 15;
}
function getLegendarySlotUnlockLevel(idx) {
    // 1st legendary → lvl 30, 2nd legendary → lvl 60
    return idx === 0 ? 30 : idx === 1 ? 60 : 999;
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
    if (levelNode) levelNode.textContent = `${t('hud.levelShort')} ${save.unlocked}`;
    // In-run centered LEVEL banner (visible only via body.in-run CSS rule).
    const inRunLevelNum = document.getElementById('in-run-level-num');
    const inRunLevelLabel = document.getElementById('in-run-level-label');
    if (inRunLevelNum) {
        inRunLevelNum.textContent = (currentMode === 'endless') ? `${currentWave + 1}` : `${currentLevel}`;
    }
    if (inRunLevelLabel) {
        inRunLevelLabel.textContent = (currentMode === 'endless') ? t('cta.endless') : t('hud.levelShort');
    }

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
    const leaveRow = document.getElementById('settings-leave-row');
    if (leaveRow) leaveRow.style.display = gameRunning ? '' : 'none';
    playHaptic('soft');
};

// Leave a run from inside the settings overlay - reset and bounce to home.
window.leaveGameToHome = function() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.remove('active');
    if (typeof hideResultOverlay === 'function') hideResultOverlay();
    if (gameRunning) {
        if (typeof closeMission === 'function') {
            closeMission();
        } else {
            gameRunning = false;
            document.body.classList.remove('in-run');
            if (window.canvas) window.canvas.style.display = 'none';
        }
    }
    currentMode = 'mission';
    if (typeof showFight === 'function') showFight();
    playHaptic('medium');
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

window.toggleDamagePopups = function(enabled) {
    save.settings = save.settings || {};
    save.settings.damagePopups = !!enabled;
    saveSave();
    syncSettingsUi();
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
        baseAtkCooldown: 0.82 / atkSpeedMult,
        shootTimer: 0,
        range: PLAYER_STATS.range.base,
        multishot: 1,
        multiSpread: 0,
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
        hitCounter: 0,
        trailPoints: [],
        trailBudget: 0,
        // ── Crit System ──
        critChance: 0,
        critMultiplier: 2.0,
        megaCritChance: 0,
        // ── Lifesteal / Healing ──
        lifesteal: 0,
        healAccum: 0,
        healOnKillChance: 0,
        everyKillHeal: 0,
        healPerKills: 0,
        healPerKillCounter: 0,
        heartDropOnKill: 0,
        bossFullHeal: false,
        // ── Kill Streak / Combo ──
        comboBuff: false,
        comboPct: 0,
        comboCap: 0,
        comboTimeBonus: 0,
        comboPermanent: false,
        // ── Frenzy ──
        frenzyOnKill: false,
        frenzyStack: 0,
        frenzyCap: 0.30,
        frenzyTimer: 0,
        frenzyPermanent: false,
        // ── Gold ──
        goldBonus: 0,
        doubleDropChance: 0,
        passiveGold: 0,
        bossPackToken: false,
        // ── Trigger Fingers ──
        killSpeedBoost: false,
        killSpeedPct: 0,
        killSpeedCap: 0,
        killSpeedStack: 0,
        killDamageBoost: 0,
        killDamageBuff: 0,
        bossResetCap: false,
        // ── Platinum Rounds ──
        platinumStack: false,
        platinumPerHit: 0,
        platinumCap: 0,
        platinumDmg: 0,
        platinumFireRate: 0,
        platinumFireRateDmg: 0,
        // ── Lucky Seven ──
        luckyEvery: 0,
        luckyMult: 0,
        luckyHeals: 0,
        // ── Frost ──
        frostOnHit: false,
        frostStrength: 0,
        frostDoT: false,
        freezeChance: 0,
        frozenShatter: false,
        // ── Poison ──
        poisonOnHit: false,
        poisonPct: 0,
        poisonDuration: 0,
        poisonSpread: false,
        poisonExplodeOnDeath: false,
        poisonJump: false,
        // ── Bullet Storm ──
        slowImmune: false,
        // ── Glass Cannon ──
        closeRangeBonus: 0,
        pointBlankMult: 0,
        // ── Glass Shards ──
        shardsOnHit: false,
        shardCount: 0,
        shardDmgMult: 0,
        shardBleed: false,
        shardsBounce: false,
        shardsExplode: false,
        // ── Arc Pulse ──
        arcOnHit: false,
        arcEvery: 0,
        arcTargets: 0,
        arcParalyze: false,
        // ── Crit Bomb ──
        critExplode: false,
        critExplodeRadius: 0,
        critExplodeMult: 0,
        critStunWave: false,
        critOneShot: false,
        // ── Phantom Shield ──
        shieldEvery: 0,
        shieldCharges: 0,
        shieldTimer: 0,
        shieldActive: false,
        shieldReflect: false,
        shieldHeals: false,
        // ── Strong Spirit / Phoenix ──
        firstLethalBlock: false,
        lethalBlockUsed: false,
        spiritInvul: 0,
        spiritResetOnFullHeal: false,
        spiritEvery: 0,
        spiritCooldown: 0,
        shieldEachWave: false,
        phoenixDrive: false,
        phoenixBurning: false,
        phoenixDouble: false,
        phoenixRevive: false,
        phoenixReviveUsed: false,
        // ── Scarier Face ──
        enemyHpMult: 1,
        enemyFleeChance: 0,
        bossHpMult: 1,
        executeThreshold: 0,
        // ── Ricochet ──
        bulletsRicochet: false,
        ricochetCount: 0,
        ricochetDmgPerBounce: 0,
        ricochetSeek: false,
        // ── Heat Seeker ──
        bulletsHome: 0,
        markedDmg: 0,
        bulletsHardHome: false,
        bulletsSmartWait: false,
        // ── Boomerang ──
        boomerangShot: false,
        boomerangEvery: 0,
        boomerangSpawnsClone: false,
        boomerangCount: 1,
        boomerangPendulum: 0,
        // ── Lich Bullets ──
        bulletFork: false,
        bulletForkCount: 0,
        forkCritChance: 0,
        lichEye: false,
        // ── Cluster Bomb ──
        clusterBomb: false,
        clusterEvery: 0,
        clusterDmgMult: 0,
        clusterSplit: false,
        clusterChain: false,
        // ── Blank Burst ──
        blankChance: 0,
        blankPulse: false,
        blankRadius: 1,
        permanentBlankAura: false,
        // ── Singularity ──
        singularity: false,
        singularityEvery: 0,
        singularityImplode: false,
        permaSingularity: false,
        singularityTimer: 0,
        // ── Spread Volley ──
        markOnHit: false,
        pierceDamageBonus: 0,
        pulsarBurst: false,
        sentinelHalo: false,
        sawWaves: false,
        sawPull: false,
        // ── Reworked / new abilities ──
        extraHearts: 0,           // Patch Heart stack
        extraHeartHealPerKills: 0,
        extraHeartKillCounter: 0,
        echoOnHit: false,         // Echo Shock
        echoEveryHits: 4,
        echoHitCounter: 0,
        echoRadius: 80,
        echoDmgMult: 0.6,
        phoenixAura: false,       // Phoenix Aura
        phoenixAuraRadius: 0,
        phoenixAuraDps: 0,
        phoenixAuraTick: 0,
        ionSplash: false,         // Ion Round splash
        ionSplashRadius: 0,
        ionSplashMult: 0,
        ionPiercing: false,
        ionVaporize: false,
        sawShoot: false,          // Saw projectile launcher
        sawShootCooldown: 0,
        sawShootInterval: 1.6,
        sawShootCount: 1,
        sawShootDmgMult: 0.6,
        boomerangLaunch: false,   // Real boomerang projectile
        boomerangLaunchCooldown: 0,
        boomerangLaunchInterval: 2.5,
        boomerangLaunchCount: 1,
        boomerangLaunchDmgMult: 1.4,
        alwaysCenterShot: false   // Spread Volley center guarantee
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
    waveSpawnQueue = [];
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
    // Apply Scarier Face HP reduction
    let hp = type.hp;
    if (player && player.enemyHpMult && player.enemyHpMult < 1) {
        hp = Math.max(1, Math.round(hp * player.enemyHpMult));
    }
    if (player && type.isBoss && player.bossHpMult && player.bossHpMult < 1) {
        hp = Math.max(1, Math.round(hp * player.bossHpMult));
    }
    return {
        ...type,
        id: nextEnemyId++,
        x,
        y,
        hp: hp,
        maxHp: hp,
        alive: true,
        hitFlash: 0,
        aiClock: Math.random() * 2,
        sprintCooldown: 1.8 + Math.random(),
        sprintTime: 0,
        sprintDirX: 0,
        sprintDirY: 0,
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        abilityCooldown: type.isBoss ? 4 : 0,
        lastHitBy: 0,
        // ── New-enemy per-type state ──
        attackCooldown: 1.4 + Math.random() * 0.6, // sniper / bomber / brute attack timing
        healCooldown: 2.0 + Math.random() * 0.8,    // healer pulse
        shieldHp: type.shieldHp ? Math.max(1, Math.round(type.shieldHp * Math.max(0.4, hp / Math.max(1, type.hp)))) : 0,
        shieldMax: type.shieldHp ? Math.max(1, Math.round(type.shieldHp * Math.max(0.4, hp / Math.max(1, type.hp)))) : 0,
        phaseTimer: 0,            // wraith
        phasing: false,           // wraith
        chargeTimer: 0,           // crusher dash windup
        charging: false,          // crusher mid-dash
        chargeDirX: 0,
        chargeDirY: 0,
        // ── Status Effects ──
        frostSlow: 0,
        frostTimer: 0,
        poisonDmg: 0,
        poisonTimer: 0,
        frozen: false,
        frozenTimer: 0,
        marked: false,
        markedTimer: 0
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Wave spawning. We don't drop the whole wave at once anymore; we queue the
// spawn entries and trickle them in over time via processWaveSpawnQueue(dt).
// Bosses still fire on their first batch immediately so the boss bar pops up
// the moment the boss wave starts.
// ─────────────────────────────────────────────────────────────────────────────
function buildSpawnQueue(waveEntries, options = {}) {
    const fillMultiplier = options.fillMultiplier || 1;
    return waveEntries.map((entry) => {
        const isBossEntry = entry.t === 'boss';
        const scaledN = isBossEntry ? entry.n : Math.max(1, Math.round(entry.n * fillMultiplier));
        return {
            type: entry.t,
            remaining: scaledN,
            batch: Math.max(1, entry.batch || 1),
            interval: typeof entry.interval === 'number' ? entry.interval : 0.7,
            timer: 0 // first batch fires on the next process tick
        };
    });
}

function processWaveSpawnQueue(dt) {
    if (!waveSpawnQueue || waveSpawnQueue.length === 0) return;
    waveSpawnQueue.forEach((slot) => {
        if (slot.remaining <= 0) return;
        slot.timer -= dt;
        if (slot.timer <= 0) {
            const batch = Math.min(slot.batch, slot.remaining);
            const scaledType = getEnemyLevelStats(slot.type, currentLevel);
            for (let i = 0; i < batch; i++) {
                const spawn = getArenaSpawnEdgePoint();
                enemies.push(createEnemy(scaledType, spawn.x, spawn.y));
            }
            slot.remaining -= batch;
            slot.timer = slot.interval;
        }
    });
    waveSpawnQueue = waveSpawnQueue.filter((slot) => slot.remaining > 0);
}

function spawnWave(index) {
    if (index >= currentLevelWaves.length) return;
    currentWave = index;
    const wave = currentLevelWaves[index];
    waveSpawnQueue = buildSpawnQueue(wave);
    // Fire the very first batch instantly so the wave doesn't start empty.
    processWaveSpawnQueue(0);
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
    const fillMultiplier = 1 + Math.min(0.45, index * 0.02);
    waveSpawnQueue = buildSpawnQueue(templateWave, { fillMultiplier });
    processWaveSpawnQueue(0);

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
    updateSawLauncher(dt);
    updateBoomerangLauncher(dt);
    updatePhoenixAura(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateOrbiters(dt);
    updateHazards(dt);
    updateLightningBolts(dt);
    updateFxTexts(dt);
    updateParticles(dt);
    updateStatusEffects(dt);
    updateAbilityTimers(dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    screenShake = Math.max(0, screenShake - dt * 3.2);
    powerPulse = Math.max(0, powerPulse - dt * 1.6);
    killStreakTimer = Math.max(0, killStreakTimer - dt);
    if (killStreakTimer <= 0 && !player.comboPermanent) killStreak = 0;
    processWaveSpawnQueue(dt);
    checkWaveProgress();
}

// ── Phoenix Aura — passive damage ring around the player ──
function updatePhoenixAura(dt) {
    if (!player.phoenixAura) return;
    player.phoenixAuraTick = (player.phoenixAuraTick || 0) + dt;
    if (player.phoenixAuraTick < 0.18) return;
    const tickDt = player.phoenixAuraTick;
    player.phoenixAuraTick = 0;
    const radius = player.phoenixAuraRadius || 90;
    const dps = player.phoenixAuraDps || 0.22;
    const tickDmg = player.dmg * player.damageMultiplier * dps * tickDt;
    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d > radius) return;
        e.hp -= tickDmg;
        e.hitFlash = Math.max(e.hitFlash || 0, 0.06);
        if (Math.random() < 0.5) addP(e.x, e.y, '#ff6b35', 1, 60, 0.12, 1);
        if (e.hp <= 0) triggerKill(e);
    });
    // Subtle aura ring particles
    if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2;
        addP(player.x + Math.cos(a) * radius, player.y + Math.sin(a) * radius, '#ff8030', 1, 40, 0.25, 1);
    }
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

    // ── Frenzy / Trigger Fingers fire-rate modifier ──
    let cooldownMod = 1;
    if (player.frenzyStack > 0) cooldownMod *= (1 - player.frenzyStack);
    if (player.killSpeedStack > 0) cooldownMod *= (1 - player.killSpeedStack);
    if (player.platinumFireRateDmg > 0) cooldownMod *= (1 - Math.min(0.5, player.platinumFireRateDmg));
    player.shootTimer = Math.max(0.06, player.atkCooldown * cooldownMod);
    player.shotCounter += 1;

    // ── Combo damage multiplier ──
    let comboDmg = 1;
    if (player.comboBuff && killStreak > 0) {
        comboDmg = 1 + Math.min(player.comboCap, killStreak * player.comboPct);
    }

    // ── Platinum Rounds stacking damage ──
    const platDmg = 1 + (player.platinumDmg || 0);

    const baseBulletDmg = player.dmg * player.damageMultiplier * comboDmg * platDmg;

    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    // Lower base spread so multishot stays tight/centered. Spread Volley adds explicit spread.
    const baseSpreadStep = 0.06;
    const spreadStep = baseSpreadStep + (player.multiSpread || 0);
    const start = -spreadStep * (player.multishot - 1) / 2;

    const fireOne = (offsetAngle, opts = {}) => {
        let shotDmg = baseBulletDmg;
        const isLucky = !opts.skipLucky && player.luckyEvery > 0 && player.shotCounter % player.luckyEvery === 0;
        if (isLucky) {
            shotDmg *= (player.luckyMult || 5);
            addFxText(player.x, player.y - 28, 'LUCKY!', '#ffd14d', 0.5, 20);
        }
        addP(player.x, player.y - 12, isLucky ? '#ffd14d' : '#00f2ff', isLucky ? 8 : 5, 140, 0.18, 2);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + offsetAngle,
            speed: 760,
            life: 1.1,
            radius: isLucky ? 7 : 5,
            damage: shotDmg,
            pierce: player.pierce,
            canChain: player.chainLightning,
            color: isLucky ? '#ffd14d' : '#f5fbff',
            bouncesLeft: player.ricochetCount || 0,
            homingStrength: player.bulletsHome || 0,
            forkTimer: player.bulletFork ? 0.18 : 0, // Lich-Auge: split sooner
            forkCount: player.bulletForkCount || 0
        });
    };

    for (let i = 0; i < player.multishot; i++) {
        fireOne(start + (spreadStep * i));
    }

    // ── Spread Volley: always include one perfectly straight bullet ──
    if (player.alwaysCenterShot && player.multishot % 2 === 0) {
        fireOne(0, { skipLucky: true });
    }

    playSfx('shoot', Math.min(1.2, 0.7 + player.multishot * 0.08));

    // ── Cluster Bomb ──
    if (player.clusterBomb && player.shotCounter % (player.clusterEvery || 10) === 0) {
        addP(player.x, player.y - 12, '#ff6b35', 12, 180, 0.25, 3);
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle,
            speed: 560,
            life: 1.3,
            radius: 10,
            damage: baseBulletDmg * (player.clusterDmgMult || 3),
            pierce: 0,
            canChain: false,
            color: '#ff6b35',
            isBomb: true,
            bombSplitCount: player.clusterSplit ? 5 : 0,
            bombChain: player.clusterChain
        });
        playSfx('ability', 1.1);
        addFxText(player.x, player.y - 32, 'BOMB!', '#ff6b35', 0.4, 18);
    }

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
            damage: baseBulletDmg * (0.52 + (echoRank * 0.08)),
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
            radius: 9,
            damage: baseBulletDmg * (player.ionSplashMult || 1.8),
            pierce: player.ionPiercing ? 99 : 0,    // pierce only for rank ≥ 3
            canChain: false,                         // no chain — distinct from Kettenblitz
            color: '#ffcf4d',
            isIon: true,
            ionSplashRadius: player.ionSplashRadius || 70,
            ionVaporize: player.ionVaporize
        });
        playSfx('ability', 1);
    }

    if (player.tornadoShot && player.shotCounter % 3 === 0) {
        powerPulse = Math.min(1.5, powerPulse + 0.45);
        screenShake = Math.min(1.5, screenShake + 0.22);
        spawnTornadoVolley(baseAngle, getAbilityRank('tornado_shot'));
        playSfx('tornado', 1);
    }

    // ── Singularity pull field ──
    if (player.singularity && player.shotCounter % (player.singularityEvery || 8) === 0) {
        spawnSingularity(nearest.x, nearest.y);
    }

    screenShake = Math.min(1.5, screenShake + 0.08);
}

// ── Saw projectile launcher (Saege-Klinge rework) ──
function updateSawLauncher(dt) {
    if (!player.sawShoot) return;
    player.sawShootCooldown -= dt;
    if (player.sawShootCooldown > 0) return;
    player.sawShootCooldown = player.sawShootInterval || 1.6;
    const nearest = findNearestEnemy(player.range || 800);
    const baseAngle = nearest
        ? Math.atan2(nearest.y - player.y, nearest.x - player.x)
        : (player.angle || 0) - Math.PI / 2;
    const count = Math.max(1, player.sawShootCount || 1);
    const fan = (count - 1) * 0.18;
    for (let i = 0; i < count; i++) {
        const offset = -fan / 2 + i * 0.18;
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + offset,
            speed: 320,
            life: 1.6,
            radius: 14,
            damage: player.dmg * player.damageMultiplier * (player.sawShootDmgMult || 0.6),
            pierce: 999,
            canChain: false,
            color: '#7be8ff',
            isSawShot: true,
            sawHitMap: {},
            sawHitInterval: 0.18
        });
    }
    playSfx('ability', 0.85);
}

// ── Boomerang launcher (Bumerang rework) ──
function updateBoomerangLauncher(dt) {
    if (!player.boomerangLaunch) return;
    player.boomerangLaunchCooldown -= dt;
    if (player.boomerangLaunchCooldown > 0) return;
    player.boomerangLaunchCooldown = player.boomerangLaunchInterval || 2.5;
    const nearest = findNearestEnemy(player.range || 900);
    const baseAngle = nearest
        ? Math.atan2(nearest.y - player.y, nearest.x - player.x)
        : (player.angle || 0) - Math.PI / 2;
    const count = Math.max(1, player.boomerangLaunchCount || 1);
    const fan = (count - 1) * 0.30;
    for (let i = 0; i < count; i++) {
        const offset = -fan / 2 + i * 0.30;
        const curveDir = i % 2 === 0 ? 1 : -1; // alternating arc directions
        spawnProjectile({
            x: player.x,
            y: player.y,
            angle: baseAngle + offset,
            speed: 540,
            life: 4.2,
            radius: 9,
            damage: player.dmg * player.damageMultiplier * (player.boomerangLaunchDmgMult || 1.4),
            pierce: 999,
            canChain: false,
            color: '#ffd14d',
            isBoomShot: true,
            boomCurveDir: curveDir,
            boomHitMap: {},
            boomHitInterval: 0.25
        });
    }
    playSfx('ability', 0.95);
}

// ── Singularity pull field ──
function spawnSingularity(tx, ty) {
    const rank = Math.max(1, getAbilityRank('singularity'));
    hazards.push({
        id: nextHazardId++,
        type: 'singularity',
        x: tx, y: ty,
        radius: 80 + rank * 12,
        life: 1.2 + rank * 0.3,
        maxLife: 1.2 + rank * 0.3,
        pullStrength: 180 + rank * 40,
        damage: player.dmg * player.damageMultiplier * 0.1,
        implode: player.singularityImplode,
        color: '#bc13fe',
        hit: false
    });
    addP(tx, ty, '#bc13fe', 18, 120, 0.3, 4);
    addFxText(tx, ty - 20, 'PULL', '#bc13fe', 0.35, 16);
    playSfx('ability', 0.9);
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
        color: config.color || '#f5fbff',
        // ── Extended bullet fields ──
        isBoomerang: !!config.isBoomerang,
        boomerangPhase: 0,
        boomerangTime: 0,
        bouncesLeft: config.bouncesLeft || 0,
        homingStrength: config.homingStrength || 0,
        forkTimer: config.forkTimer || 0,
        forkCount: config.forkCount || 0,
        forked: false,
        isBomb: !!config.isBomb,
        bombSplitCount: config.bombSplitCount || 0,
        bombChain: !!config.bombChain,
        isShard: !!config.isShard,
        speed: config.speed || 760,
        // ── New: Ion splash, saw projectile, boomerang projectile ──
        isIon: !!config.isIon,
        ionSplashRadius: config.ionSplashRadius || 0,
        ionVaporize: !!config.ionVaporize,
        isSawShot: !!config.isSawShot,
        sawHitMap: config.sawHitMap || null,
        sawHitInterval: config.sawHitInterval || 0,
        isBoomShot: !!config.isBoomShot,
        boomCurveDir: config.boomCurveDir || 0,
        boomHitMap: config.boomHitMap || null,
        boomHitInterval: config.boomHitInterval || 0
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
    const newProjectiles = [];

    projectiles.forEach((projectile) => {
        // ── Homing ──
        if (projectile.homingStrength > 0 && !projectile.tornado) {
            const nearestE = findNearestEnemyToPoint(projectile.x, projectile.y, 200);
            if (nearestE) {
                const toX = nearestE.x - projectile.x;
                const toY = nearestE.y - projectile.y;
                const toMag = Math.max(0.01, Math.hypot(toX, toY));
                const curAngle = Math.atan2(projectile.vy, projectile.vx);
                const targetAngle = Math.atan2(toY, toX);
                let diff = targetAngle - curAngle;
                while (diff > Math.PI) diff -= 2 * Math.PI;
                while (diff < -Math.PI) diff += 2 * Math.PI;
                const turnRate = projectile.homingStrength * 3 * dt;
                const newAngle = curAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
                const spd = Math.hypot(projectile.vx, projectile.vy);
                projectile.vx = Math.cos(newAngle) * spd;
                projectile.vy = Math.sin(newAngle) * spd;
            }
        }

        // ── Boomerang return (legacy, no longer triggered from auto-fire) ──
        if (projectile.isBoomerang) {
            projectile.boomerangTime += dt;
            if (projectile.boomerangTime > 0.35 && projectile.boomerangPhase === 0) {
                projectile.boomerangPhase = 1;
                const toPlayerX = player.x - projectile.x;
                const toPlayerY = player.y - projectile.y;
                const mag = Math.max(0.01, Math.hypot(toPlayerX, toPlayerY));
                const spd = Math.hypot(projectile.vx, projectile.vy) * 1.2;
                projectile.vx = (toPlayerX / mag) * spd;
                projectile.vy = (toPlayerY / mag) * spd;
                projectile.life = 2.0;
                projectile.pierce = 99;
            }
        }

        // ── New Boomerang projectile: big curving arc, dies on wall hit ──
        if (projectile.isBoomShot) {
            // apply centripetal turn perpendicular to current velocity
            const turnRate = 1.4 * (projectile.boomCurveDir || 1) * dt; // rad / frame
            const cur = Math.atan2(projectile.vy, projectile.vx);
            const newAngle = cur + turnRate;
            const spd = Math.hypot(projectile.vx, projectile.vy);
            projectile.vx = Math.cos(newAngle) * spd;
            projectile.vy = Math.sin(newAngle) * spd;
            // small spinning trail
            if (Math.random() < 0.5) addP(projectile.x, projectile.y, '#ffd14d', 1, 30, 0.18, 1);
            // tick down per-target hit cooldowns
            if (projectile.boomHitMap) {
                for (const k in projectile.boomHitMap) {
                    projectile.boomHitMap[k] -= dt;
                    if (projectile.boomHitMap[k] <= 0) delete projectile.boomHitMap[k];
                }
            }
        }

        // ── Saw projectile: slow flying saw, infinite pierce, can re-hit same enemy ──
        if (projectile.isSawShot) {
            projectile.spin += dt * 14;
            if (Math.random() < 0.4) addP(projectile.x, projectile.y, '#7be8ff', 1, 30, 0.16, 1);
            if (projectile.sawHitMap) {
                for (const k in projectile.sawHitMap) {
                    projectile.sawHitMap[k] -= dt;
                    if (projectile.sawHitMap[k] <= 0) delete projectile.sawHitMap[k];
                }
            }
            // Sawpull: drag enemies toward saw if rank ≥ 4
            if (player.sawPull) {
                enemies.forEach((e) => {
                    if (!e.alive) return;
                    const d = Math.hypot(e.x - projectile.x, e.y - projectile.y);
                    if (d < 90 && d > 0.5) {
                        e.x += ((projectile.x - e.x) / d) * 30 * dt;
                        e.y += ((projectile.y - e.y) / d) * 30 * dt;
                    }
                });
            }
        }

        // ── Lich Bullet Fork ──
        if (projectile.forkTimer > 0 && !projectile.forked) {
            projectile.forkTimer -= dt;
            if (projectile.forkTimer <= 0) {
                projectile.forked = true;
                const forks = projectile.forkCount || 3;
                const baseAngle = Math.atan2(projectile.vy, projectile.vx);
                const spread = 0.5;
                for (let f = 0; f < forks; f++) {
                    const angle = baseAngle - spread / 2 + (spread / (forks - 1 || 1)) * f;
                    newProjectiles.push({
                        id: nextProjectileId++,
                        x: projectile.x, y: projectile.y,
                        vx: Math.cos(angle) * 640,
                        vy: Math.sin(angle) * 640,
                        dmg: projectile.dmg * 0.6,
                        life: 0.8, r: 4,
                        pierce: player.pierce,
                        canChain: false, tornado: false,
                        spin: 0, color: '#c890ff',
                        isBoomerang: false, boomerangPhase: 0, boomerangTime: 0,
                        bouncesLeft: 0, homingStrength: 0,
                        forkTimer: 0, forkCount: 0, forked: true,
                        isBomb: false, bombSplitCount: 0, bombChain: false,
                        isShard: false, speed: 640
                    });
                }
                addP(projectile.x, projectile.y, '#c890ff', 10, 100, 0.2, 3);
            }
        }

        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        projectile.spin += dt * 10;

        // ── Ricochet off arena walls ──
        if (projectile.bouncesLeft > 0 && !projectile.tornado) {
            let bounced = false;
            if (projectile.x <= WALL + projectile.r || projectile.x >= arena.width - WALL - projectile.r) {
                projectile.vx *= -1;
                projectile.x = Math.max(WALL + projectile.r + 1, Math.min(arena.width - WALL - projectile.r - 1, projectile.x));
                bounced = true;
            }
            if (projectile.y <= arena.top + projectile.r || projectile.y >= arena.height - WALL - projectile.r) {
                projectile.vy *= -1;
                projectile.y = Math.max(arena.top + projectile.r + 1, Math.min(arena.height - WALL - projectile.r - 1, projectile.y));
                bounced = true;
            }
            if (bounced) {
                projectile.bouncesLeft -= 1;
                projectile.life = Math.max(projectile.life, 0.5);
                projectile.dmg *= (1 + (player.ricochetDmgPerBounce || 0));
                addP(projectile.x, projectile.y, '#7be8ff', 6, 60, 0.15, 2);
            }
        }

        // ── Boomerang projectile dies when it hits a wall ──
        if (projectile.isBoomShot) {
            if (projectile.x <= WALL + projectile.r || projectile.x >= arena.width - WALL - projectile.r ||
                projectile.y <= arena.top + projectile.r || projectile.y >= arena.height - WALL - projectile.r) {
                projectile.life = 0;
                addP(projectile.x, projectile.y, '#ffd14d', 12, 100, 0.25, 3);
            }
        }

        if (projectile.tornado) {
            addP(projectile.x, projectile.y, '#bc13fe', 2, 40, 0.12, 2);
        } else if (projectile.isBomb) {
            addP(projectile.x, projectile.y, '#ff6b35', 3, 30, 0.12, 2);
        } else if (Math.random() < 0.45) {
            addP(projectile.x, projectile.y, projectile.color, 1, 20, 0.1, 1);
        }

        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            if (enemy.frozen) continue; // Frozen enemies skip collision temporarily (stun)
            const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
            if (distance >= enemy.r + projectile.r) continue;
            if (projectile.tornado && enemy.lastHitBy === projectile.id) continue;
            // ── Saw / Boomerang per-enemy hit cooldown ──
            if (projectile.isSawShot && projectile.sawHitMap && projectile.sawHitMap[enemy.id] > 0) continue;
            if (projectile.isBoomShot && projectile.boomHitMap && projectile.boomHitMap[enemy.id] > 0) continue;

            player.hitCounter += 1;

            // ── Crit System ──
            let finalDmg = projectile.dmg;
            let isCrit = false;
            if (!projectile.tornado && !projectile.isShard) {
                if (player.critChance > 0 && Math.random() < player.critChance) {
                    let critMult = player.critMultiplier || 2;
                    // Mega crit
                    if (player.megaCritChance > 0 && Math.random() < player.megaCritChance) {
                        critMult *= 3;
                        addFxText(projectile.x, projectile.y - 24, 'MEGA!', '#ff375f', 0.55, 22);
                    }
                    finalDmg *= critMult;
                    isCrit = true;
                }
            }

            // ── Marked target bonus (Heat Seeker) ──
            if (enemy.marked && player.markedDmg > 0) {
                finalDmg *= (1 + player.markedDmg);
            }

            // ── Pierce damage bonus ──
            if (player.pierceDamageBonus > 0 && projectile.pierce > 0) {
                finalDmg *= (1 + player.pierceDamageBonus);
            }

            // ── Close-range bonus (Spread Volley / Glass Cannon) ──
            if (player.closeRangeBonus > 0 || player.pointBlankMult > 0) {
                const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (distToPlayer < 120) {
                    finalDmg *= (1 + (player.closeRangeBonus || 0));
                    if (player.pointBlankMult > 0 && distToPlayer < 60) {
                        finalDmg *= player.pointBlankMult;
                    }
                }
            }

            const dmgApplied = finalDmg * (projectile.tornado ? dt * 8 : 1);
            enemy.hp -= dmgApplied;
            enemy.hitFlash = isCrit ? 0.16 : 0.08;
            enemy.lastHitBy = projectile.id;

            // Floating damage number — every hit, sized + coloured by impact tier
            showDamagePopup(enemy.x, enemy.y - enemy.r, dmgApplied, { crit: isCrit });

            if (isCrit) {
                addP(projectile.x, projectile.y, '#ffd14d', 8, 120, 0.2, 3);
                // ── Crit Bomb AOE ──
                if (player.critExplode) {
                    triggerCritExplosion(projectile.x, projectile.y, finalDmg);
                }
            } else {
                addP(projectile.x, projectile.y, enemy.glow, projectile.tornado ? 4 : 3, 90, 0.16, 2);
            }

            // ── Lifesteal (Vampire) ──
            if (player.lifesteal > 0 && !projectile.tornado && !projectile.isShard) {
                player.healAccum += dmgApplied * player.lifesteal;
                if (player.healAccum >= enemy.maxHp * 0.5) {
                    player.hp = Math.min(player.maxHp, player.hp + 1);
                    player.healAccum = 0;
                    addFxText(player.x, player.y - 20, '+1 HP', '#00ff9d', 0.4, 16);
                    syncHpDangerFlair();
                }
            }

            // ── Platinum Rounds stacking ──
            if (player.platinumStack && !projectile.tornado) {
                player.platinumDmg = Math.min(player.platinumCap === 99 ? 9999 : player.platinumCap, (player.platinumDmg || 0) + player.platinumPerHit);
                if (player.platinumFireRate > 0) {
                    player.platinumFireRateDmg = Math.min(0.5, (player.platinumFireRateDmg || 0) + player.platinumFireRate);
                }
            }

            // ── Frost on Hit ──
            if (player.frostOnHit && !projectile.tornado) {
                enemy.frostSlow = player.frostStrength || 0.25;
                enemy.frostTimer = 1.5;
                if (player.frostDoT && !enemy.frozen) {
                    enemy.hp -= player.dmg * 0.05;
                }
                // Crisper frost VFX: sparkles + impact ring
                addP(enemy.x, enemy.y, '#a8eaff', 6, 70, 0.28, 2);
                addP(projectile.x, projectile.y, '#7be8ff', 4, 90, 0.16, 2);
                hazards.push({
                    id: nextHazardId++,
                    type: 'ring',
                    x: enemy.x, y: enemy.y,
                    radius: 4, maxRadius: 22, speed: 90,
                    life: 0.22, color: 'rgba(123,232,255,0.0)', hit: true // visual only (hit=true ⇒ skip damage)
                });
                if (player.freezeChance > 0 && Math.random() < player.freezeChance) {
                    enemy.frozen = true;
                    enemy.frozenTimer = 1.0;
                    addFxText(enemy.x, enemy.y - 14, 'FROZEN', '#7be8ff', 0.45, 14);
                    addP(enemy.x, enemy.y, '#7be8ff', 18, 110, 0.4, 3);
                    hazards.push({
                        id: nextHazardId++,
                        type: 'ring',
                        x: enemy.x, y: enemy.y,
                        radius: 8, maxRadius: 50, speed: 140,
                        life: 0.45, color: 'rgba(123,232,255,0.0)', hit: true
                    });
                }
            }

            // ── Poison on Hit ──
            if (player.poisonOnHit && !projectile.tornado) {
                enemy.poisonDmg = player.dmg * player.damageMultiplier * (player.poisonPct || 0.08);
                enemy.poisonTimer = player.poisonDuration || 3;
                if (!enemy._poisoned) {
                    enemy._poisoned = true;
                    addFxText(enemy.x, enemy.y - 14, 'POISON', '#00ff9d', 0.35, 14);
                }
            }

            // ── Mark on Hit (Pierce ability) ──
            if (player.markOnHit && Math.random() < 0.35) {
                enemy.marked = true;
                enemy.markedTimer = 3;
            }

            // ── Glass Shards on Hit ──
            if (player.shardsOnHit && !projectile.tornado && !projectile.isShard) {
                const shardCount = player.shardCount || 3;
                for (let s = 0; s < shardCount; s++) {
                    const shardAngle = Math.random() * Math.PI * 2;
                    newProjectiles.push({
                        id: nextProjectileId++,
                        x: projectile.x, y: projectile.y,
                        vx: Math.cos(shardAngle) * 420,
                        vy: Math.sin(shardAngle) * 420,
                        dmg: player.dmg * player.damageMultiplier * (player.shardDmgMult || 0.5),
                        life: 0.4, r: 3,
                        pierce: player.shardsBounce ? 1 : 0,
                        canChain: false, tornado: false,
                        spin: 0, color: '#a0e0ff',
                        isBoomerang: false, boomerangPhase: 0, boomerangTime: 0,
                        bouncesLeft: player.shardsBounce ? 1 : 0,
                        homingStrength: 0,
                        forkTimer: 0, forkCount: 0, forked: true,
                        isBomb: false, bombSplitCount: 0, bombChain: false,
                        isShard: true, speed: 420
                    });
                }
            }

            // ── Arc Pulse ──
            if (player.arcOnHit && !projectile.tornado && !projectile.isShard) {
                player.arcHitCounter = (player.arcHitCounter || 0) + 1;
                if (player.arcHitCounter >= (player.arcEvery || 6)) {
                    player.arcHitCounter = 0;
                    triggerArcPulse(enemy);
                }
            }

            // ── Echo Shock (rework): every Nth hit fires a damage shockwave ──
            if (player.echoOnHit && !projectile.tornado && !projectile.isShard) {
                player.echoHitCounter = (player.echoHitCounter || 0) + 1;
                if (player.echoHitCounter >= (player.echoEveryHits || 4)) {
                    player.echoHitCounter = 0;
                    triggerEchoShock(enemy.x, enemy.y);
                }
            }

            // ── Ion splash on impact ──
            if (projectile.isIon) {
                triggerIonSplash(projectile);
            }

            // ── Saw / Boomerang: register per-enemy hit cooldown so they can re-hit ──
            if (projectile.isSawShot && projectile.sawHitMap) {
                projectile.sawHitMap[enemy.id] = projectile.sawHitInterval || 0.18;
            }
            if (projectile.isBoomShot && projectile.boomHitMap) {
                projectile.boomHitMap[enemy.id] = projectile.boomHitInterval || 0.25;
            }

            if (projectile.canChain) {
                triggerChainLightning(enemy, projectile.dmg * 0.45);
                projectile.canChain = false;
            }

            // Saws and boomerangs do NOT consume pierce — they keep flying.
            if (!projectile.tornado && !projectile.isSawShot && !projectile.isBoomShot) {
                projectile.pierce -= 1;
            }

            // ── Execute threshold (Scarier Face rank 4) ──
            if (player.executeThreshold > 0 && enemy.hp > 0 && enemy.hp <= enemy.maxHp * player.executeThreshold && !enemy.isBoss) {
                enemy.hp = 0;
                addFxText(enemy.x, enemy.y - 16, 'EXECUTE!', '#ff375f', 0.45, 18);
                addP(enemy.x, enemy.y, '#ff375f', 14, 160, 0.3, 4);
            }

            if (enemy.hp <= 0) triggerKill(enemy);
            if (!projectile.tornado && projectile.pierce < 0) {
                // ── Bomb explosion on impact ──
                if (projectile.isBomb) {
                    triggerBombExplosion(projectile);
                }
                projectile.life = 0;
                break;
            }
        }

        // ── Bomb expires (missed) — still explode ──
        if (projectile.isBomb && projectile.life <= 0 && projectile.life > -dt * 2) {
            triggerBombExplosion(projectile);
        }
    });

    // Add forked/shard projectiles
    for (const np of newProjectiles) projectiles.push(np);

    projectiles = projectiles.filter((projectile) => projectile.life > 0);
}

// ── Echo Shock — small AOE on impact, replaces old "echo bullet" mechanic ──
function triggerEchoShock(cx, cy) {
    const radius = player.echoRadius || 80;
    const dmgMult = player.echoDmgMult || 0.6;
    const dmg = player.dmg * player.damageMultiplier * dmgMult;
    addP(cx, cy, '#7be8ff', 18, 160, 0.32, 4);
    addP(cx, cy, '#ffffff', 8, 100, 0.18, 2);
    hazards.push({
        id: nextHazardId++,
        type: 'ring',
        x: cx, y: cy,
        radius: 12, maxRadius: radius, speed: 380,
        life: 0.35, color: 'rgba(123,232,255,0.0)', hit: true // visual only — damage applied immediately
    });
    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (d > radius) return;
        e.hp -= dmg;
        e.hitFlash = 0.1;
        showDamagePopup(e.x, e.y - e.r, dmg, { splash: true });
        if (e.hp <= 0) triggerKill(e);
    });
    addFxText(cx, cy - 18, 'ECHO', '#7be8ff', 0.3, 14);
    playSfx('chain', 0.7);
}

// ── Ion splash on projectile impact ──
function triggerIonSplash(projectile) {
    const radius = projectile.ionSplashRadius || 70;
    const dmg = projectile.dmg * 0.55;
    addP(projectile.x, projectile.y, '#ffd14d', 22, 200, 0.4, 5);
    addP(projectile.x, projectile.y, '#ffe698', 10, 140, 0.25, 3);
    screenShake = Math.min(2.5, screenShake + 0.25);
    hazards.push({
        id: nextHazardId++,
        type: 'ring',
        x: projectile.x, y: projectile.y,
        radius: 10, maxRadius: radius, speed: 540,
        life: 0.35, color: 'rgba(255,209,77,0.0)', hit: true // visual only
    });
    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - projectile.x, e.y - projectile.y);
        if (d > radius) return;
        if (projectile.ionVaporize && !e.isBoss) {
            e.hp = 0;
        } else {
            e.hp -= dmg;
        }
        e.hitFlash = 0.14;
        if (e.hp <= 0) triggerKill(e);
    });
}

// ── Crit Bomb Explosion ──
function triggerCritExplosion(cx, cy, baseDmg) {
    const radius = player.critExplodeRadius || 40;
    const mult = player.critExplodeMult || 0.6;
    addP(cx, cy, '#ffd14d', 20, 200, 0.3, 5);
    screenShake = Math.min(2.5, screenShake + 0.35);
    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (d > radius) return;
        const splashDmg = player.critOneShot ? e.maxHp * 10 : baseDmg * mult;
        e.hp -= splashDmg;
        e.hitFlash = 0.14;
        addP(e.x, e.y, '#ffd14d', 6, 80, 0.15, 2);
        showDamagePopup(e.x, e.y - e.r, splashDmg, { splash: true });
        if (e.hp <= 0) triggerKill(e);
    });
}

// ── Arc Pulse ──
function triggerArcPulse(origin) {
    const targets = enemies
        .filter((e) => e.alive && e.id !== origin.id)
        .map((e) => ({ enemy: e, dist: Math.hypot(e.x - origin.x, e.y - origin.y) }))
        .filter((e) => e.dist < 160)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, player.arcTargets || 3);

    const pulseDmg = player.dmg * player.damageMultiplier * 0.35;
    targets.forEach(({ enemy }) => {
        enemy.hp -= pulseDmg;
        enemy.hitFlash = 0.1;
        addLightningBolt(origin.x, origin.y, enemy.x, enemy.y, '#bc13fe', 0.14, 2.5);
        addP(enemy.x, enemy.y, '#bc13fe', 8, 80, 0.18, 2);
        if (player.arcParalyze) {
            enemy.frozen = true;
            enemy.frozenTimer = 0.3;
        }
        if (enemy.hp <= 0) triggerKill(enemy);
    });
    if (targets.length) {
        addFxText(origin.x, origin.y - 18, 'ARC', '#bc13fe', 0.3, 14);
        playSfx('chain', 0.85);
    }
}

// ── Cluster Bomb Explosion ──
function triggerBombExplosion(projectile) {
    const radius = 70;
    addP(projectile.x, projectile.y, '#ff6b35', 28, 250, 0.4, 6);
    addP(projectile.x, projectile.y, '#ffd14d', 14, 180, 0.25, 4);
    screenShake = Math.min(3, screenShake + 0.55);
    powerPulse = Math.min(2, powerPulse + 0.4);
    playSfx('hit', 1.2);

    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - projectile.x, e.y - projectile.y);
        if (d > radius) return;
        e.hp -= projectile.dmg * 0.8;
        e.hitFlash = 0.14;
        if (e.hp <= 0) triggerKill(e);
    });

    // Sub-bombs
    if (projectile.bombSplitCount > 0) {
        for (let s = 0; s < projectile.bombSplitCount; s++) {
            const angle = (s / projectile.bombSplitCount) * Math.PI * 2;
            spawnProjectile({
                x: projectile.x, y: projectile.y,
                angle: angle,
                speed: 320,
                life: 0.6,
                radius: 6,
                damage: projectile.dmg * 0.4,
                pierce: 0,
                canChain: false,
                color: '#ff9d00',
                isBomb: projectile.bombChain,
                bombSplitCount: projectile.bombChain ? Math.floor(projectile.bombSplitCount / 2) : 0,
                bombChain: false
            });
        }
    }
}

// Helper: find nearest enemy to an arbitrary point
function findNearestEnemyToPoint(px, py, range) {
    let nearest = null;
    let minDist = range;
    enemies.forEach((e) => {
        if (!e.alive) return;
        const d = Math.hypot(e.x - px, e.y - py);
        if (d < minDist) { minDist = d; nearest = e; }
    });
    return nearest;
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
        showDamagePopup(enemy.x, enemy.y - enemy.r, chainDamage, { splash: true });
        addFxText(enemy.x, enemy.y - 18, 'ARC', '#00f2ff', 0.32, 16);
        if (enemy.hp <= 0) triggerKill(enemy);
    });
    if (targets.length) playSfx('chain', 0.95);
}

function updateEnemies(dt) {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        // ── Damage gating: wraith phase i-frames + shielder absorbs ──
        // We diff against the previous-frame HP so we intercept any source of damage.
        if (enemy._prevHp == null) enemy._prevHp = enemy.hp;
        if (enemy.hp < enemy._prevHp) {
            let drop = enemy._prevHp - enemy.hp;
            if (enemy.phasing) {
                enemy.hp = enemy._prevHp; // phased = invulnerable
                drop = 0;
            }
            if (enemy.shieldHp > 0 && drop > 0) {
                const absorbed = Math.min(enemy.shieldHp, drop);
                enemy.shieldHp -= absorbed;
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + absorbed);
            }
        }
        enemy._prevHp = enemy.hp;

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

        // ── Frozen stun — skip movement entirely ──
        if (enemy.frozen) return;

        let moveX = nx;
        let moveY = ny;
        let speed = enemy.spd * 70;

        // ── Frost slow ──
        if (enemy.frostSlow > 0) {
            speed *= (1 - enemy.frostSlow);
        }

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
        } else if (enemy.ai === 'swarm') {
            // Tight chase with twitchy zig-zag.
            moveX = nx * 0.92 + px * 0.34 * Math.sin(enemy.aiClock * 6.0);
            moveY = ny * 0.92 + py * 0.34 * Math.sin(enemy.aiClock * 6.0);
        } else if (enemy.ai === 'brute') {
            // Slow, relentless straight-line chaser.
            moveX = nx;
            moveY = ny;
            speed *= 0.85;
        } else if (enemy.ai === 'sniper') {
            // Holds at ~280px and shoots ring projectiles.
            const desired = 280;
            if (distance < desired - 30) {
                moveX = -nx * 0.72 + px * 0.5 * enemy.strafeDir;
                moveY = -ny * 0.72 + py * 0.5 * enemy.strafeDir;
            } else if (distance > desired + 30) {
                moveX = nx * 0.6 + px * 0.4 * enemy.strafeDir;
                moveY = ny * 0.6 + py * 0.4 * enemy.strafeDir;
                speed *= 0.7;
            } else {
                moveX = px * enemy.strafeDir;
                moveY = py * enemy.strafeDir;
                speed *= 0.55;
            }
            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0 && distance < 600) {
                enemy.attackCooldown = 2.4 + Math.random() * 0.6;
                hazards.push({
                    id: nextHazardId++,
                    type: 'ring',
                    x: enemy.x,
                    y: enemy.y,
                    radius: 6,
                    maxRadius: 90,
                    speed: 360,
                    life: 0.9,
                    color: '#ff5dad',
                    hit: false
                });
                addP(enemy.x, enemy.y, '#ff5dad', 6, 60, 0.18, 2);
            }
        } else if (enemy.ai === 'bomber') {
            // Charges at the player; explosion is in triggerKill().
            moveX = nx;
            moveY = ny;
        } else if (enemy.ai === 'healer') {
            // Stays back and pulses healing.
            if (distance < 240) {
                moveX = -nx;
                moveY = -ny;
                speed *= 0.85;
            } else {
                moveX = nx * 0.55 + px * 0.45 * enemy.strafeDir;
                moveY = ny * 0.55 + py * 0.45 * enemy.strafeDir;
                speed *= 0.6;
            }
            enemy.healCooldown -= dt;
            if (enemy.healCooldown <= 0) {
                enemy.healCooldown = 2.6;
                const healAmt = Math.max(2, Math.round(enemy.maxHp * 0.05));
                for (const ally of enemies) {
                    if (!ally.alive || ally === enemy) continue;
                    if (Math.hypot(ally.x - enemy.x, ally.y - enemy.y) < 200) {
                        ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
                    }
                }
                addP(enemy.x, enemy.y, '#34ffae', 10, 130, 0.45, 3);
            }
        } else if (enemy.ai === 'shielder') {
            // Slow tank with a damage-absorbing shield (handled above).
            moveX = nx;
            moveY = ny;
            speed *= 0.85;
        } else if (enemy.ai === 'wraith') {
            // Periodically phases — invulnerable while phasing.
            enemy.phaseTimer -= dt;
            if (enemy.phaseTimer <= 0) {
                enemy.phasing = !enemy.phasing;
                enemy.phaseTimer = enemy.phasing ? 0.5 : 1.6;
                if (enemy.phasing) addP(enemy.x, enemy.y, '#9f57ff', 6, 80, 0.25, 2);
            }
            moveX = nx * 1.05 + px * 0.45 * Math.sin(enemy.aiClock * 3.5);
            moveY = ny * 1.05 + py * 0.45 * Math.sin(enemy.aiClock * 3.5);
        } else if (enemy.ai === 'crusher') {
            // Heavy tank that periodically charges at the player.
            if (enemy.charging) {
                enemy.chargeTimer -= dt;
                moveX = enemy.chargeDirX;
                moveY = enemy.chargeDirY;
                speed *= 2.4;
                if (enemy.chargeTimer <= 0) enemy.charging = false;
            } else {
                enemy.chargeTimer -= dt;
                moveX = nx;
                moveY = ny;
                speed *= 0.7;
                if (enemy.chargeTimer <= 0 && distance > 110 && distance < 520) {
                    enemy.charging = true;
                    enemy.chargeDirX = nx;
                    enemy.chargeDirY = ny;
                    enemy.chargeTimer = 0.7;
                    addP(enemy.x, enemy.y, '#ff5040', 12, 150, 0.4, 3);
                } else if (enemy.chargeTimer <= 0) {
                    enemy.chargeTimer = 1.8;
                }
            }
        } else if (enemy.ai === 'berserker') {
            // Speeds up as HP drops (up to ~1.9x).
            const hpFrac = Math.max(0, enemy.hp / Math.max(1, enemy.maxHp));
            const rage = 1 + (1 - hpFrac) * 0.9;
            moveX = nx;
            moveY = ny;
            speed *= rage;
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
        // ── Combat Drone (rework) ──
        if (orbiter.isDrone) {
            // Dead drones tick down respawn timer.
            if (!orbiter.alive) {
                orbiter.respawnTimer -= dt;
                if (orbiter.respawnTimer <= 0) {
                    orbiter.alive = true;
                    orbiter.shootTimer = orbiter.shootInterval || 1.4;
                    addP(player.x, player.y, '#7be8ff', 14, 120, 0.3, 3);
                    addFxText(player.x, player.y - 26, 'DRONE READY', '#7be8ff', 0.4, 14);
                }
                return;
            }
            // Orbit around the player at fixed slot.
            orbiter.angle += dt * 1.6;
            orbiter.x = player.x + Math.cos(orbiter.angle) * orbiter.distance;
            orbiter.y = player.y + Math.sin(orbiter.angle) * orbiter.distance;

            // Auto-fire at nearest enemy.
            orbiter.shootTimer -= dt;
            if (orbiter.shootTimer <= 0) {
                orbiter.shootTimer = orbiter.shootInterval || 1.4;
                const target = findNearestEnemyToPoint(orbiter.x, orbiter.y, 600);
                if (target) {
                    const angle = Math.atan2(target.y - orbiter.y, target.x - orbiter.x);
                    spawnProjectile({
                        x: orbiter.x,
                        y: orbiter.y,
                        angle: angle,
                        speed: 720,
                        life: 0.9,
                        radius: 4,
                        damage: player.dmg * player.damageMultiplier * (orbiter.dmgMult || 0.3),
                        pierce: 0,
                        canChain: false,
                        color: '#7be8ff'
                    });
                    addP(orbiter.x, orbiter.y, '#7be8ff', 2, 60, 0.12, 1);
                }
            }

            // Die on enemy contact, schedule respawn.
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const d = Math.hypot(enemy.x - orbiter.x, enemy.y - orbiter.y);
                if (d < enemy.r + orbiter.r + 1) {
                    orbiter.alive = false;
                    orbiter.respawnTimer = orbiter.respawnDuration || 15;
                    addP(orbiter.x, orbiter.y, '#ff6b35', 14, 130, 0.3, 3);
                    addFxText(orbiter.x, orbiter.y - 14, 'DRONE DOWN', '#ff6b35', 0.4, 14);
                    break;
                }
            }
            return;
        }

        // ── Saw orbiter (legacy: no longer added by saw_blade rework, but
        //    safe-guarded in case of leftover state from another source) ──
        orbiter.angle += dt * (1.8 + index * 0.08);
        orbiter.x = player.x + Math.cos(orbiter.angle) * orbiter.distance;
        orbiter.y = player.y + Math.sin(orbiter.angle) * orbiter.distance;
        enemies.forEach((enemy) => {
            if (!enemy.alive) return;
            const distance = Math.hypot(enemy.x - orbiter.x, enemy.y - orbiter.y);
            if (distance < enemy.r + orbiter.r) {
                enemy.hp -= (orbiter.damage || 0) * dt;
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
        // ── Singularity pull field ──
        if (hazard.type === 'singularity') {
            addP(hazard.x, hazard.y, '#bc13fe', 2, 30, 0.1, 1);
            enemies.forEach((e) => {
                if (!e.alive) return;
                const d = Math.hypot(e.x - hazard.x, e.y - hazard.y);
                if (d > hazard.radius) return;
                // Pull toward center
                const pullX = (hazard.x - e.x) / Math.max(1, d);
                const pullY = (hazard.y - e.y) / Math.max(1, d);
                e.x += pullX * hazard.pullStrength * dt;
                e.y += pullY * hazard.pullStrength * dt;
                // Tick damage
                e.hp -= hazard.damage * dt;
                if (e.hp <= 0) triggerKill(e);
            });
            // Implode at end
            if (hazard.implode && hazard.life <= 0 && hazard.life > -dt * 2) {
                addP(hazard.x, hazard.y, '#bc13fe', 24, 200, 0.35, 5);
                addP(hazard.x, hazard.y, '#ffffff', 12, 140, 0.2, 3);
                screenShake = Math.min(2.5, screenShake + 0.5);
                enemies.forEach((e) => {
                    if (!e.alive) return;
                    const d = Math.hypot(e.x - hazard.x, e.y - hazard.y);
                    if (d < hazard.radius * 0.8) {
                        e.hp -= player.dmg * player.damageMultiplier * 2;
                        e.hitFlash = 0.2;
                        if (e.hp <= 0) triggerKill(e);
                    }
                });
            }
        }
    });
    hazards = hazards.filter((hazard) => hazard.life > 0 && (hazard.type === 'singularity' || hazard.radius < hazard.maxRadius));
}

// ── Status Effects on Enemies ──
function updateStatusEffects(dt) {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        // ── Frost slow decay ──
        if (enemy.frostTimer > 0) {
            enemy.frostTimer -= dt;
            if (enemy.frostTimer <= 0) enemy.frostSlow = 0;
        }

        // ── Frozen stun ──
        if (enemy.frozen) {
            enemy.frozenTimer -= dt;
            if (enemy.frozenTimer <= 0) enemy.frozen = false;
        }

        // ── Poison DoT ──
        if (enemy.poisonTimer > 0) {
            enemy.poisonTimer -= dt;
            enemy.hp -= enemy.poisonDmg * dt;
            // Visual tick
            if (Math.random() < 0.15) addP(enemy.x, enemy.y, '#00ff9d', 2, 30, 0.12, 1);
            // Poison spread
            if (player.poisonSpread && Math.random() < 0.02 * dt) {
                enemies.forEach((other) => {
                    if (other === enemy || !other.alive || other._poisoned) return;
                    const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
                    if (d < 60) {
                        other.poisonDmg = enemy.poisonDmg;
                        other.poisonTimer = player.poisonDuration || 3;
                        other._poisoned = true;
                    }
                });
            }
            if (enemy.hp <= 0) triggerKill(enemy);
        }

        // ── Marked timer ──
        if (enemy.markedTimer > 0) {
            enemy.markedTimer -= dt;
            if (enemy.markedTimer <= 0) enemy.marked = false;
        }
    });
}

// ── Ability Timers (Frenzy decay, Shield recharge, Passive gold, Singularity aura) ──
function updateAbilityTimers(dt) {
    if (!player) return;

    // ── Frenzy decay ──
    if (player.frenzyOnKill && !player.frenzyPermanent && player.frenzyStack > 0) {
        player.frenzyTimer -= dt;
        if (player.frenzyTimer <= 0) {
            player.frenzyStack = Math.max(0, player.frenzyStack - dt * 0.3);
        }
    }

    // ── Phantom Shield recharge ──
    if (player.shieldEvery > 0) {
        player.shieldTimer = (player.shieldTimer || 0) + dt;
        if (player.shieldTimer >= player.shieldEvery) {
            player.shieldTimer = 0;
            player.shieldCharges = Math.max(player.shieldCharges, 1);
            player.shieldActive = true;
            addP(player.x, player.y, '#7be8ff', 10, 80, 0.2, 2);
        }
    }

    // ── Strong Spirit cooldown reset ──
    if (player.spiritEvery > 0 && player.lethalBlockUsed) {
        player.spiritCooldown = (player.spiritCooldown || 0) + dt;
        if (player.spiritCooldown >= player.spiritEvery) {
            player.spiritCooldown = 0;
            player.lethalBlockUsed = false;
        }
    }

    // ── Passive gold (Fortune Coin rank 4) ──
    if (player.passiveGold > 0) {
        player._passiveGoldTimer = (player._passiveGoldTimer || 0) + dt;
        if (player._passiveGoldTimer >= 1) { // every second
            player._passiveGoldTimer = 0;
            // Only in mission mode, give passive gold per second (scaled down)
            const pgold = Math.round(player.passiveGold / 10); // per second fraction
            if (pgold > 0) save.gold += pgold;
        }
    }

    // ── Permanent Singularity aura ──
    if (player.permaSingularity) {
        player.singularityTimer = (player.singularityTimer || 0) + dt;
        if (player.singularityTimer >= 3) {
            player.singularityTimer = 0;
            spawnSingularity(player.x, player.y);
        }
    }
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
    // Don't advance while there are still enemies queued to spawn for this wave.
    if (waveSpawnQueue && waveSpawnQueue.length > 0) return;
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

    // ── Bomber: explosion on death (damages player + nearby enemies) ──
    if (enemy.ai === 'bomber') {
        hazards.push({
            id: nextHazardId++,
            type: 'ring',
            x: enemy.x,
            y: enemy.y,
            radius: 8,
            maxRadius: 130,
            speed: 420,
            life: 0.7,
            color: '#ff7035',
            hit: false
        });
        addP(enemy.x, enemy.y, '#ff7035', 22, 170, 0.4, 4);
        screenShake = Math.min(2.5, screenShake + 0.35);
    }

    const economy = getEconomyMultiplier();
    const killGoldBase = currentMode === 'endless' ? (enemy.isBoss ? 2 : 0) : (enemy.isBoss ? 10 : 1);
    // ── Fortune Coin gold bonus ──
    const goldMult = 1 + (player.goldBonus || 0);
    let killGold = Math.max(0, Math.round(killGoldBase * economy * goldMult));
    if (player.doubleDropChance > 0 && Math.random() < player.doubleDropChance) {
        killGold *= 2;
    }
    addP(enemy.x, enemy.y, enemy.glow, enemy.isBoss ? 42 : 18, enemy.isBoss ? 260 : 210, 0.8, enemy.isBoss ? 7 : 4);
    addP(enemy.x, enemy.y, '#ffffff', enemy.isBoss ? 16 : 6, enemy.isBoss ? 180 : 120, 0.26, enemy.isBoss ? 4 : 2);
    if (killGold > 0) {
        pickups.push({ x: enemy.x, y: enemy.y, gold: killGold, alive: true, spin: 0 });
    }
    grantAbilityXp(enemy.exp);
    if (enemy.isBoss) save.gems += 2;

    // ── Bloodlust — heal on kill ──
    if (player.healOnKillChance > 0 && Math.random() < player.healOnKillChance && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        addFxText(enemy.x, enemy.y - 20, '+1 HP', '#ff375f', 0.35, 14);
        syncHpDangerFlair();
    }
    // ── Every-kill heal (bloodlust rank 4) ──
    if (player.everyKillHeal > 0) {
        player.healAccum = (player.healAccum || 0) + player.everyKillHeal;
        if (player.healAccum >= 1 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 1);
            player.healAccum -= 1;
            syncHpDangerFlair();
        }
    }
    // ── Heal per N kills ──
    if (player.healPerKills > 0) {
        player.healPerKillCounter = (player.healPerKillCounter || 0) + 1;
        if (player.healPerKillCounter >= player.healPerKills && player.hp < player.maxHp) {
            player.healPerKillCounter = 0;
            player.hp = Math.min(player.maxHp, player.hp + 1);
            addFxText(player.x, player.y - 20, '+1 HP', '#00ff9d', 0.4, 16);
            syncHpDangerFlair();
        }
    }
    // ── Patch Heart: extra-heart recharge per N kills (rank 3+) ──
    if (player.extraHeartHealPerKills > 0) {
        player.extraHeartKillCounter = (player.extraHeartKillCounter || 0) + 1;
        if (player.extraHeartKillCounter >= player.extraHeartHealPerKills) {
            player.extraHeartKillCounter = 0;
            player.extraHearts = (player.extraHearts || 0) + 1;
            addFxText(player.x, player.y - 32, '+1 EXTRA', '#ffd14d', 0.5, 18);
            syncHpDangerFlair();
        }
    }
    // ── Boss full heal (Vampire rank 4) ──
    if (player.bossFullHeal && enemy.isBoss) {
        player.hp = player.maxHp;
        addFxText(player.x, player.y - 24, 'FULL HEAL!', '#ff375f', 0.6, 20);
        syncHpDangerFlair();
    }
    // ── Kill damage buff (Bloodlust / Trigger Fingers) ──
    if (player.killDamageBuff > 0) {
        player.damageMultiplier *= (1 + player.killDamageBuff);
    }

    // ── Frenzy stacking (Bullet Storm) ──
    if (player.frenzyOnKill) {
        const addFrenzy = 0.03;
        if (player.frenzyPermanent) {
            player.frenzyStack = Math.min(player.frenzyCap === 99 ? 9999 : player.frenzyCap, player.frenzyStack + addFrenzy);
        } else {
            player.frenzyStack = Math.min(player.frenzyCap, player.frenzyStack + addFrenzy);
            player.frenzyTimer = 2.0;
        }
    }

    // ── Trigger Fingers speed stacking ──
    if (player.killSpeedBoost) {
        player.killSpeedStack = Math.min(
            player.killSpeedCap === 99 ? 9999 : player.killSpeedCap,
            (player.killSpeedStack || 0) + (player.killSpeedPct || 0.005)
        );
    }

    // ── Lucky Seven heal on kill ──
    if (player.luckyHeals > 0 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + player.luckyHeals);
        syncHpDangerFlair();
    }

    // ── Chain on Kill (Chain Lightning rank 4) ──
    if (player.chainOnKill) {
        triggerChainLightning(enemy, player.dmg * player.damageMultiplier * 0.5);
    }

    // ── Poison explode on death ──
    if (player.poisonExplodeOnDeath && enemy._poisoned) {
        addP(enemy.x, enemy.y, '#00ff9d', 16, 140, 0.3, 4);
        enemies.forEach((e) => {
            if (!e.alive || e.id === enemy.id) return;
            const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
            if (d < 80) {
                e.hp -= player.dmg * player.damageMultiplier * 0.3;
                e.poisonDmg = player.dmg * player.damageMultiplier * (player.poisonPct || 0.08);
                e.poisonTimer = player.poisonDuration || 3;
                e._poisoned = true;
                e.hitFlash = 0.1;
                if (e.hp <= 0) triggerKill(e);
            }
        });
    }

    // ── Frozen shatter ──
    if (player.frozenShatter && enemy.frozen) {
        addP(enemy.x, enemy.y, '#7be8ff', 22, 180, 0.35, 5);
        screenShake = Math.min(2.5, screenShake + 0.3);
        enemies.forEach((e) => {
            if (!e.alive || e.id === enemy.id) return;
            const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
            if (d < 100) {
                e.hp -= enemy.maxHp * 0.5;
                e.hitFlash = 0.14;
                if (e.hp <= 0) triggerKill(e);
            }
        });
    }

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
    killStreakTimer = 2.2 + (player.comboTimeBonus || 0);
    screenShake = Math.min(2.9, screenShake + (enemy.isBoss ? 1.05 : 0.28));
    powerPulse = Math.min(2.3, powerPulse + (enemy.isBoss ? 0.88 : 0.2));
    if (enemy.isBoss) playHaptic('hard'); else playHaptic('tap');
    addFxText(enemy.x, enemy.y - enemy.r - 12, enemy.isBoss ? 'BOSS DOWN' : `+${enemy.exp} XP`, enemy.isBoss ? '#ff9d00' : '#ffffff', enemy.isBoss ? 0.85 : 0.45, enemy.isBoss ? 24 : 16);
    updateMetaHud();
}

function releaseShockNova() {
    const rank = Math.max(1, getAbilityRank('shock_nova'));
    const radius = 170 + rank * 16;

    // ── Atom-bomb VFX: bright flash core, three concentric expanding rings,
    //    huge particle burst, white-out screen pulse, heavy shake. ──
    addP(player.x, player.y, '#ffffff', 80, 480, 0.55, 9);   // bright core flash
    addP(player.x, player.y, '#ffe698', 56, 340, 0.50, 7);   // golden mid-burst
    addP(player.x, player.y, '#ff7035', 42, 290, 0.55, 6);   // fire ring
    addP(player.x, player.y, '#bc13fe', 28, 220, 0.42, 5);   // shock outer
    // Three expanding "shock rings" for the atom-bomb feel.
    [0, 0.06, 0.12].forEach((delay, i) => {
        setTimeout(() => {
            if (!hazards) return;
            hazards.push({
                id: nextHazardId++,
                type: 'ring',
                x: player.x, y: player.y,
                radius: 6,
                maxRadius: radius * (0.7 + i * 0.25),
                speed: 540 + i * 80,
                life: 0.55,
                color: 'rgba(255,209,77,0.0)',
                hit: true // visual only
            });
        }, delay * 1000);
    });
    addFxText(player.x, player.y - 30, 'NOVA', '#ffe698', 0.55, 28);
    playSfx('chain', 1.4);
    playSfx('hit', 1.3);
    powerPulse = Math.min(3.0, powerPulse + 1.1);
    screenShake = Math.min(4.0, screenShake + 1.2);
    playHaptic('hard');

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance > radius) return;
        const novaDmg = player.dmg * player.damageMultiplier * (0.36 + rank * 0.12);
        enemy.hp -= novaDmg;
        enemy.hitFlash = 0.18;
        addLightningBolt(player.x, player.y, enemy.x, enemy.y, '#ffe698', 0.20, 4);
        showDamagePopup(enemy.x, enemy.y - enemy.r, novaDmg, { splash: true });
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
        const localisedNode = (typeof tSkillRank === 'function') ? tSkillRank(ability.id, nextIdx) : null;
        const baseNode = ability.tree ? ability.tree[nextIdx] : { name: ability.name, tier: ability.rarity, desc: ability.desc };
        const nextDef = {
            name: (localisedNode && localisedNode.name) || baseNode.name,
            tier: (localisedNode && localisedNode.tier) || baseNode.tier,
            desc: (localisedNode && localisedNode.desc) || baseNode.desc
        };
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
    const localised = (typeof tSkillRank === 'function') ? tSkillRank(ability.id, nextIdx) : null;
    const baseNext = tree[nextIdx];
    const nextDef = {
        name: (localised && localised.name) || baseNext.name,
        tier: (localised && localised.tier) || baseNext.tier,
        desc: (localised && localised.desc) || baseNext.desc
    };
    const tier = (nextDef.tier || ability.rarity || 'common').toLowerCase();

    featureEl.classList.remove('tier-common','tier-rare','tier-epic','tier-legendary');
    featureEl.classList.add(`tier-${tier}`);

    titleEl.innerHTML = `${(nextDef.name || '').toUpperCase()}`;
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
            // Twin Volley stays CENTERED — no extra spread from this ability.
            const add = [1, 2, 3, 4][rank - 1] || 1;
            player.multishot += add;
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
            // ── Echo SHOCK rework: shockwave on Nth hit (not extra projectile) ──
            player.echoShot = true; // legacy flag for buff list
            player.echoOnHit = true;
            player.echoEveryHits = [4, 3, 2, 1][rank - 1] || 4;
            player.echoRadius    = [80, 100, 130, 110][rank - 1] || 80;
            player.echoDmgMult   = [0.6, 0.9, 1.2, 0.5][rank - 1] || 0.6;
            break;
        case 'ion_round':
            player.ionRound = true;
            player.ionEvery = [5, 5, 4, 4][rank - 1] || 5;
            player.ionSplash = true;
            player.ionSplashRadius = [70, 100, 130, 160][rank - 1] || 70;
            player.ionSplashMult = [1.8, 2.3, 3.2, 3.8][rank - 1] || 1.8;
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
            // ── Phoenix AURA: permanent damage ring around player ──
            player.phoenixDrive = true; // legacy flag kept for buff list rendering
            player.phoenixAura = true;
            player.phoenixAuraRadius = [90, 130, 180, 240][rank - 1] || 90;
            player.phoenixAuraDps   = [0.22, 0.35, 0.55, 0.90][rank - 1] || 0.22;
            if (rank >= 3) player.phoenixDouble = true;       // 3s i-frames on hp loss kept
            if (rank >= 4) player.phoenixRevive = true;
            break;
        case 'heal_heart':
            // ── Patch Heart REWORK: stacking extra hearts, no max-hp grant ──
            player.extraHearts = (player.extraHearts || 0) + [1, 2, 3, 4][rank - 1];
            if (rank >= 3) player.extraHeartHealPerKills = 25;
            if (rank >= 4) player.firstLethalBlock = true;
            syncHpDangerFlair();
            break;
        case 'orbiter':
            // ── Combat Drone REWORK: shoot, die on contact, respawn 15s ──
            {
                const totals     = [1, 2, 4, 6][rank - 1] || 1;
                const respawnSec = rank >= 4 ? 8 : 15;
                const dmgMult    = rank >= 4 ? 0.40 : 0.30;
                const fireRate   = [1.4, 1.2, 1.0, 0.8][rank - 1] || 1.4;
                const need = Math.max(0, totals - player.orbiters.length);
                for (let n = 0; n < need; n++) {
                    const slot = player.orbiters.length;
                    player.orbiters.push({
                        id: nextOrbiterId++,
                        slot,
                        totalSlots: totals,
                        angle: (slot / Math.max(1, totals)) * Math.PI * 2,
                        distance: 70,
                        r: 7,
                        isDrone: true,
                        alive: true,
                        respawnTimer: 0,
                        respawnDuration: respawnSec,
                        shootTimer: Math.random() * fireRate,
                        shootInterval: fireRate,
                        dmgMult,
                        x: player.x,
                        y: player.y
                    });
                }
                // Re-tune existing drones (e.g. on rank up) to match the new totals.
                player.orbiters.forEach((o, i) => {
                    if (!o.isDrone) return;
                    o.totalSlots = totals;
                    o.respawnDuration = respawnSec;
                    o.dmgMult = dmgMult;
                    o.shootInterval = fireRate;
                    o.angle = (i / Math.max(1, totals)) * Math.PI * 2;
                });
                if (rank >= 4) player.sentinelHalo = true;
            }
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
            // Lifesteal NERF (was [0.02, 0.04, 0.08, 0.15] — felt absurd in late-game).
            player.lifesteal = [0.01, 0.02, 0.04, 0.08][rank - 1] || 0.01;
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
            // ── Glass Cannon: lost heart is GONE for the run ──
            // No canister drop, no lifesteal restore (lifesteal already caps at maxHp).
            // Only Patch Heart's extra hearts can stack on top of what's left.
            const dmgMult = [1.6, 1.9, 2.5, 3.0][rank - 1] || 1.6;
            player.damageMultiplier *= dmgMult;
            // Drop max-hp permanently (rank 4 caps at 2 max).
            if (rank === 4) {
                player.maxHp = 2;
            } else {
                player.maxHp = Math.max(1, player.maxHp - 1);
            }
            player.hp = Math.min(player.hp, player.maxHp);
            player.glassCannonLocked = true; // signal: no max-hp regrants this run
            if (rank === 2) player.atkCooldown *= 0.77;
            if (rank >= 3) player.firstLethalBlock = true;
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
            // Rank 4 was effectively immortality — now capped at 30%.
            player.blankChance = [0.05, 0.10, 0.18, 0.30][rank - 1] || 0.05;
            if (rank >= 2) player.blankPulse = true;
            if (rank >= 3) player.blankRadius = 2;
            if (rank >= 4) player.blankRadius = 3; // bigger radius instead of perma-aura
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
        // 'bloodlust' removed — overlapped with Vampire's lifesteal.
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
            // ── Saw blade REWORK: shoots flying saws instead of orbiters ──
            player.sawShoot = true;
            player.sawShootInterval = [1.6, 1.4, 1.1, 0.9][rank - 1] || 1.6;
            player.sawShootCount    = [1, 2, 2, 3][rank - 1] || 1;
            player.sawShootDmgMult  = [0.6, 0.8, 1.2, 1.8][rank - 1] || 0.6;
            if (rank >= 3) player.sawWaves = true;
            if (rank >= 4) player.sawPull = true;
            break;
        }
        case 'boomerang': {
            // ── Bumerang REWORK: real arcing boomerang projectile, dies on wall ──
            player.boomerangLaunch = true;
            player.boomerangLaunchInterval = [2.5, 2.0, 1.5, 1.0][rank - 1] || 2.5;
            player.boomerangLaunchCount    = [1, 2, 3, 4][rank - 1] || 1;
            player.boomerangLaunchDmgMult  = [1.4, 1.5, 1.6, 2.0][rank - 1] || 1.4;
            // legacy flag for buff list rendering only
            player.boomerangShot = true;
            break;
        }
        case 'spread_volley': {
            // ── Streufeuer REWORK: rank 1 already adds a bullet AND keeps a centered shot ──
            player.alwaysCenterShot = true;
            player.multishot = (player.multishot || 1) + [1, 2, 3, 5][rank - 1];
            player.multiSpread = (player.multiSpread || 0) + [0.18, 0.30, 0.50, 0.85][rank - 1];
            if (rank >= 3) player.closeRangeBonus = 0.30;
            if (rank >= 4) player.pointBlankMult = 4;
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

    // ── Phantom Shield — block the hit entirely ──
    if (player.shieldActive && player.shieldCharges > 0) {
        player.shieldCharges -= 1;
        player.invulnerable = 0.5;
        addP(player.x, player.y, '#7be8ff', 20, 160, 0.3, 4);
        addFxText(player.x, player.y - 22, 'BLOCKED!', '#7be8ff', 0.5, 20);
        playSfx('ability', 1.0);
        screenShake = Math.min(2, screenShake + 0.4);
        // Shield heals
        if (player.shieldHeals && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 1);
            addFxText(player.x, player.y - 36, '+1 HP', '#00ff9d', 0.35, 14);
            syncHpDangerFlair();
        }
        // Shield reflect
        if (player.shieldReflect) {
            const nearestE = findNearestEnemy(200);
            if (nearestE) {
                const angle = Math.atan2(nearestE.y - player.y, nearestE.x - player.x);
                spawnProjectile({
                    x: player.x, y: player.y,
                    angle: angle, speed: 900, life: 0.8, radius: 6,
                    damage: player.dmg * player.damageMultiplier * 2,
                    pierce: 2, canChain: true,
                    color: '#7be8ff'
                });
                addFxText(player.x, player.y - 44, 'REFLECT!', '#ffd14d', 0.4, 16);
            }
        }
        if (player.shieldCharges <= 0) player.shieldActive = false;
        return;
    }

    // ── Blank Burst aura — chance to negate hit ──
    if (player.permanentBlankAura || (player.blankChance > 0 && Math.random() < player.blankChance)) {
        player.invulnerable = 0.3;
        addP(player.x, player.y, '#ffffff', 16, 120, 0.25, 3);
        addFxText(player.x, player.y - 20, 'BLANK!', '#ffffff', 0.4, 18);
        return;
    }

    // ── Patch Heart: extra hearts soak the hit BEFORE normal HP ──
    if (player.extraHearts && player.extraHearts > 0) {
        player.extraHearts -= 1;
        player.invulnerable = 0.9;
        addP(player.x, player.y, '#ffd14d', 22, 200, 0.45, 4);
        addP(player.x, player.y, '#ff8030', 10, 160, 0.32, 3);
        addFxText(player.x, player.y - 22, '-1 EXTRA', '#ffd14d', 0.5, 22);
        screenShake = Math.min(2.4, screenShake + 0.55);
        playSfx('hit', source === 'boss' ? 1.0 : 0.9);
        playHaptic('medium');
        syncHpDangerFlair();
        return;
    }

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

    // ── Phoenix Aura — passive ring instead of revenge wave ──
    // (rank 3 still grants 3s i-frames on hp loss, kept as a defensive perk.)
    if (player.phoenixDouble) {
        player.invulnerable = Math.max(player.invulnerable, 3);
        addFxText(player.x, player.y - 30, 'PHOENIX!', '#ff6b35', 0.45, 20);
    }

    // Trigger HUD heart shake/lost animation
    window.__heartDamageTime = performance.now();
    window.__heartLostIdx = hpBefore - 1; // the heart that just got depleted
    // Body class for CSS-driven full-screen flash
    document.body.classList.add('hp-flash');
    if (window.__hpFlashTimer) clearTimeout(window.__hpFlashTimer);
    window.__hpFlashTimer = setTimeout(() => document.body.classList.remove('hp-flash'), 400);

    syncHpDangerFlair();

    if (player.hp > 0) return;

    // ── Strong Spirit / First Lethal Block ──
    if (player.firstLethalBlock && !player.lethalBlockUsed) {
        player.lethalBlockUsed = true;
        player.hp = 1;
        player.invulnerable = Math.max(player.invulnerable, player.spiritInvul || 2);
        addP(player.x, player.y, '#ffd14d', 24, 220, 0.4, 5);
        addFxText(player.x, player.y - 28, 'SAVED!', '#ffd14d', 0.6, 22);
        playSfx('ability', 1.3);
        playHaptic('hard');
        syncHpDangerFlair();
        updateMetaHud();
        return;
    }

    // ── Phoenix Revive — full HP once per run ──
    if (player.phoenixRevive && !player.phoenixReviveUsed) {
        player.phoenixReviveUsed = true;
        player.hp = player.maxHp;
        player.invulnerable = 3;
        addP(player.x, player.y, '#ff6b35', 40, 320, 0.6, 8);
        addFxText(player.x, player.y - 30, 'REVIVE!', '#ff6b35', 0.8, 26);
        playSfx('win', 1);
        playHaptic('hard');
        syncHpDangerFlair();
        updateMetaHud();
        return;
    }

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

function showResultOverlay({ loss = false, title, copy, stats, primaryLabel, secondaryLabel, homeLabel, onPrimary, onSecondary, onHome, stars = 0, leaderboardDelta = null }) {
    const overlay = document.getElementById('result-overlay');
    const content = overlay ? overlay.querySelector('.result-content') : null;
    const badge = document.getElementById('result-badge');
    const titleNode = document.getElementById('result-title');
    const copyNode = document.getElementById('result-copy');
    const statsNode = document.getElementById('result-stats');
    const primary = document.getElementById('result-primary');
    const secondary = document.getElementById('result-secondary');
    const home = document.getElementById('result-home');
    const lbBlock = document.getElementById('result-leaderboard-delta');
    if (!overlay || !badge || !titleNode || !copyNode || !statsNode || !primary || !secondary) return;

    if (content) {
        content.classList.toggle('loss', loss);
        content.classList.toggle('win', !loss);
        content.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        content.offsetHeight;
        content.style.animation = '';
    }

    badge.textContent = loss ? t('result.defeated') : t('result.victory');
    badge.classList.toggle('loss', loss);
    titleNode.textContent = title;
    copyNode.textContent = copy;

    let starsHtml = '';
    if (!loss && stars >= 0) {
        const lit = Math.max(0, Math.min(3, stars));
        starsHtml = `<div class="result-stars">${[0,1,2].map((i) => `<span class="result-star ${i < lit ? 'lit' : ''}" style="--star-delay:${(i*0.15+0.2).toFixed(2)}s">★</span>`).join('')}</div>`;
    }

    statsNode.innerHTML = starsHtml + stats.map((entry) => `<div class="result-line"><span>${entry.label}</span><strong>${entry.value}</strong></div>`).join('');
    primary.textContent = primaryLabel;
    secondary.textContent = secondaryLabel;
    if (home) home.textContent = homeLabel || t('result.home');
    resultPrimaryAction = onPrimary;
    resultSecondaryAction = onSecondary;
    resultHomeAction = onHome;

    // Leaderboard delta block (only on victory if data is supplied)
    if (lbBlock) {
        if (!loss && leaderboardDelta && Number.isFinite(leaderboardDelta.before) && Number.isFinite(leaderboardDelta.after)) {
            const before = leaderboardDelta.before;
            const after = leaderboardDelta.after;
            const moved = before - after;
            const arrow = document.getElementById('rld-arrow');
            const beforeNode = document.getElementById('rld-rank-before');
            const afterNode = document.getElementById('rld-rank-after');
            const detailNode = document.getElementById('rld-detail');
            if (beforeNode) beforeNode.textContent = `#${before}`;
            if (afterNode) afterNode.textContent = `#${after}`;
            if (arrow) {
                arrow.classList.remove('same', 'down');
                if (moved > 0) { arrow.textContent = '▲'; }
                else if (moved < 0) { arrow.textContent = '▼'; arrow.classList.add('down'); }
                else { arrow.textContent = '–'; arrow.classList.add('same'); }
            }
            if (detailNode) {
                if (moved > 0) detailNode.textContent = t('result.lbClimbed', { n: moved });
                else if (moved < 0) detailNode.textContent = t('result.lbDropped', { n: Math.abs(moved) });
                else detailNode.textContent = t('result.lbHeld');
            }
            lbBlock.style.display = '';
        } else {
            lbBlock.style.display = 'none';
        }
    }

    if (typeof applyI18nToDom === 'function') applyI18nToDom();
    overlay.classList.add('active');
}

function gameOver() {
    // Capture this run's skill ranks before closing so the post-run summary works.
    if (player && player.abilityRanks) {
        save.lastRunSkills = Object.assign({}, player.abilityRanks);
    } else {
        save.lastRunSkills = {};
    }
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
            title: t('result.endlessOver'),
            copy: t('result.endlessCopy'),
            stats: [
                { label: t('result.statWaves'), value: `${currentWave + 1}` },
                { label: t('result.statScaled'), value: `${currentLevel}` },
                { label: t('result.statGold'), value: `+${formatCompactNumber(endlessGold)}` },
                { label: t('result.statGems'), value: `+${endlessGems}` }
            ],
            primaryLabel: t('result.runEndless'),
            secondaryLabel: t('result.skills'),
            homeLabel: t('result.home'),
            onPrimary: () => window.startEndlessMode(),
            onSecondary: () => { hideResultOverlay(); openRunSummary(); },
            onHome: () => { currentMode = 'mission'; showFight(); }
        });
        return;
    }
    const failStats = [
        { label: t('result.statMission'), value: `${t('cta.level')} ${currentLevel}` },
        { label: t('result.statBestReach'), value: `${t('hud.waveShort')} ${Math.min(currentWave + 1, Math.max(1, currentLevelWaves.length))}/${Math.max(1, currentLevelWaves.length)}` },
        { label: t('result.statGoldBank'), value: formatCompactNumber(save.gold) }
    ];
    const failSkills = formatRunSkillsList(save.lastRunSkills);
    if (failSkills) failStats.push({ label: t('result.statSkillsUsed'), value: failSkills });
    showResultOverlay({
        loss: true,
        title: t('result.failTitle'),
        copy: t('result.failCopy'),
        stats: failStats,
        primaryLabel: t('result.retry'),
        secondaryLabel: t('result.skills'),
        homeLabel: t('result.home'),
        onPrimary: () => window.startCurrentLevel(),
        onSecondary: () => { hideResultOverlay(); openRunSummary(); },
        onHome: () => { currentMode = 'mission'; showFight(); }
    });
}

function victory() {
    if (currentMode === 'endless') return;
    // Snapshot leaderboard rank BEFORE the score bumps so we can show the delta.
    const lbBefore = (function() {
        try {
            if (typeof getLeaderboardBots !== 'function') return null;
            const rows = getLeaderboardBots();
            const idx = rows.findIndex((r) => r.isYou);
            return idx >= 0 ? idx + 1 : null;
        } catch (e) { return null; }
    })();
    const goldReward = Math.round(getLevelGoldReward(currentLevel) * getEconomyMultiplier());
    const gemReward = 1 + Math.floor(currentLevel / 6);
    save.unlocked = Math.max(save.unlocked, currentLevel + 1);
    save.selectedLevel = save.unlocked;
    save.gems += gemReward;
    save.gold += goldReward;

    // Every 3rd level grants a milestone bonus: extra gold, extra gems and a
    // level-appropriate pack token. The pack picked scales with current level.
    let milestoneBonus = null;
    if (currentLevel % 3 === 0) {
        const bonusGold = Math.round(goldReward * 0.5);
        const bonusGems = 5 + Math.floor(currentLevel / 4);
        let packKey = 'supply_pack_i';
        if (currentLevel >= 30) packKey = 'apex_pack_iii';
        else if (currentLevel >= 12) packKey = 'strike_pack_ii';
        save.gold += bonusGold;
        save.gems += bonusGems;
        save.packs.push(packKey);
        milestoneBonus = { gold: bonusGold, gems: bonusGems, packKey };
    }

    // Capture this run's used skills so the post-run summary can render them.
    if (player && player.abilityRanks) {
        save.lastRunSkills = Object.assign({}, player.abilityRanks);
    } else {
        save.lastRunSkills = {};
    }

    saveSave();
    closeMission();
    playSfx('win', 1);
    playHaptic('success');
    // Star rating: 1 (cleared), 2 (cleared with HP > half), 3 (cleared full HP)
    const stars = player && player.maxHp ? (player.hp >= player.maxHp ? 3 : (player.hp > player.maxHp / 2 ? 2 : 1)) : 1;
    const stats = [
        { label: t('result.statGold'), value: `+${formatCompactNumber(goldReward)}` },
        { label: t('result.statGems'), value: `+${gemReward}` },
        { label: t('result.statNextMission'), value: `${t('cta.level')} ${save.unlocked}` }
    ];
    if (milestoneBonus) {
        stats.push({ label: t('result.statMilestone'), value: `+${formatCompactNumber(milestoneBonus.gold)} G · +${milestoneBonus.gems} ◆ · 1× ${PACK_DEFINITIONS[milestoneBonus.packKey]?.name || t('result.pack')}` });
    }
    const skillsSummary = formatRunSkillsList(save.lastRunSkills);
    if (skillsSummary) {
        stats.push({ label: t('result.statSkillsUsed'), value: skillsSummary });
    }
    const lbAfter = (function() {
        try {
            if (typeof getLeaderboardBots !== 'function') return null;
            const rows = getLeaderboardBots();
            const idx = rows.findIndex((r) => r.isYou);
            return idx >= 0 ? idx + 1 : null;
        } catch (e) { return null; }
    })();
    const leaderboardDelta = (lbBefore != null && lbAfter != null) ? { before: lbBefore, after: lbAfter } : null;

    showResultOverlay({
        title: t('result.winTitle', { n: currentLevel }),
        copy: t('result.winCopy'),
        stars,
        stats,
        primaryLabel: t('result.nextFight'),
        secondaryLabel: t('result.skills'),
        homeLabel: t('result.home'),
        leaderboardDelta,
        onPrimary: () => window.startCurrentLevel(),
        onSecondary: () => { hideResultOverlay(); openRunSummary(); },
        onHome: () => { currentMode = 'mission'; showFight(); }
    });
}

// Build a one-line skills summary like "Damage Core (R1) · Twin Volley (R2)"
function formatRunSkillsList(ranks) {
    if (!ranks) return '';
    const entries = Object.entries(ranks).filter(([, r]) => r > 0);
    if (!entries.length) return '';
    const parts = entries.slice(0, 4).map(([id, rank]) => {
        const localised = (typeof tSkill === 'function') ? tSkill(id) : null;
        const ab = ABILITIES.find((a) => a.id === id);
        const name = (localised && localised.name) || (ab ? ab.name : id);
        return `${name} (R${rank})`;
    });
    if (entries.length > 4) parts.push(`+${entries.length - 4} more`);
    return parts.join(' · ');
}

window.openRunSummary = function() {
    const overlay = document.getElementById('run-summary-overlay');
    const list = document.getElementById('run-summary-list');
    if (!overlay || !list) return;
    const ranks = save.lastRunSkills || {};
    const entries = Object.entries(ranks).filter(([, r]) => r > 0);
    if (!entries.length) {
        list.innerHTML = `<div class="run-summary-empty">${t('runSummary.empty')}</div>`;
    } else {
        list.innerHTML = entries.map(([id, rank]) => {
            const ab = ABILITIES.find((a) => a.id === id);
            if (!ab) return '';
            const tier = (ab.rarity || 'common').toLowerCase();
            const localised = (typeof tSkill === 'function') ? tSkill(id) : null;
            const localNode = (typeof tSkillRank === 'function') ? tSkillRank(id, Math.min((ab.tree||[]).length - 1, rank - 1)) : null;
            const dispName = (localised && localised.name) || ab.name;
            const dispDesc = (localNode && localNode.desc) || (localised && localised.desc) || ab.desc || '';
            return `
                <div class="run-summary-row rarity-tier-${tier}">
                    <div class="rs-icon">${getAbilityIconMarkup(ab.id, ab.icon) || ''}</div>
                    <div class="rs-body">
                        <div class="rs-head">
                            <span class="rs-name">${dispName}</span>
                            <span class="rs-rank">${t('runSummary.rank')} ${rank}/${(ab.tree || []).length || 1}</span>
                        </div>
                        <div class="rs-desc">${dispDesc}</div>
                    </div>
                </div>`;
        }).join('');
    }
    overlay.classList.add('active');
    playHaptic('peek');
};

window.closeRunSummary = function(event) {
    if (event && event.currentTarget && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('run-summary-overlay');
    if (overlay) overlay.classList.remove('active');
};

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
        // Aura/glow background — common to all skins, intensity scales with rarity
        const rarityIntensity = ({ blue: 0.85, dark: 1.0, purple: 1.15, red: 1.3, gold: 1.5 })[skin.rarity] || 1.0;
        const auraGrad = `<defs>
            <radialGradient id="g-${id}" cx="50%" cy="55%" r="60%">
                <stop offset="0%" stop-color="${s.pulse}" stop-opacity="${(0.95 * rarityIntensity).toFixed(2)}"/>
                <stop offset="50%" stop-color="${s.core}" stop-opacity="${(0.5 * rarityIntensity).toFixed(2)}"/>
                <stop offset="100%" stop-color="${s.pulse}" stop-opacity="0"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="55" r="44" fill="url(#g-${id})"/>`;

        // Each theme draws a unique ship + flair (heavy VFX)
        let body = '';

        if (theme === 'arrow') {
            // Stock — clean white triangle with subtle glow ring
            body = `
                <circle cx="50" cy="50" r="36" fill="none" stroke="${s.pulse}" stroke-width="0.8" opacity="0.4" stroke-dasharray="2 2"/>
                <polygon points="50,16 70,80 50,70 30,80" fill="${s.ship}" stroke="${s.core}" stroke-width="1.6" stroke-linejoin="round"/>
                <circle cx="50" cy="50" r="8" fill="${s.core}"/>
                <circle cx="50" cy="50" r="3.5" fill="#ffffff"/>
                <line x1="36" y1="78" x2="64" y2="78" stroke="${s.trail}" stroke-width="3" stroke-linecap="round"/>`;
        }
        else if (theme === 'molten') {
            // EMBER BLADE — magma shell with glowing cracks + flame trail + embers
            body = `
                <defs>
                    <linearGradient id="emb-${id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${s.core}" stop-opacity="0.95"/>
                        <stop offset="100%" stop-color="${s.pulse}" stop-opacity="1"/>
                    </linearGradient>
                </defs>
                <!-- big flame trail behind ship -->
                <path d="M 36 70 Q 30 85, 36 95 Q 50 88, 64 95 Q 70 85, 64 70 Z" fill="${s.pulse}" opacity="0.55"/>
                <path d="M 40 72 Q 36 86, 42 92 Q 50 86, 58 92 Q 64 86, 60 72 Z" fill="${s.core}" opacity="0.85"/>
                <!-- ship plate with magma gradient -->
                <polygon points="50,14 72,76 50,68 28,76" fill="url(#emb-${id})" stroke="${s.core}" stroke-width="1.6" stroke-linejoin="round"/>
                <!-- glowing cracks -->
                <polyline points="50,20 46,38 52,46 44,60" fill="none" stroke="${s.core}" stroke-width="1.6" opacity="0.95"/>
                <polyline points="50,22 56,40 48,48 56,62" fill="none" stroke="#ffe168" stroke-width="1.2" opacity="0.85"/>
                <polyline points="50,26 50,60" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
                <!-- core -->
                <circle cx="50" cy="46" r="7" fill="#ffe168"/>
                <circle cx="50" cy="46" r="3" fill="#ffffff"/>
                <!-- floating embers -->
                <circle cx="22" cy="38" r="1.6" fill="${s.core}" opacity="0.9"/>
                <circle cx="76" cy="44" r="1.4" fill="${s.core}" opacity="0.85"/>
                <circle cx="18" cy="58" r="1.2" fill="${s.pulse}" opacity="0.85"/>
                <circle cx="80" cy="62" r="1.6" fill="${s.pulse}" opacity="0.9"/>`;
        }
        else if (theme === 'wave') {
            // VIOLET DRIFT — translucent purple wing with rippling void waves + glow trails
            body = `
                <defs>
                    <linearGradient id="wave-${id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${s.ship}" stop-opacity="0.95"/>
                        <stop offset="100%" stop-color="${s.pulse}" stop-opacity="0.5"/>
                    </linearGradient>
                </defs>
                <!-- void waves behind ship -->
                <path d="M 8 78 Q 24 60, 50 74 T 92 78" fill="none" stroke="${s.trail}" stroke-width="2.4"/>
                <path d="M 4 86 Q 22 68, 50 82 T 96 86" fill="none" stroke="${s.pulse}" stroke-width="2" opacity="0.75"/>
                <path d="M 0 94 Q 20 76, 50 90 T 100 94" fill="none" stroke="${s.pulse}" stroke-width="1.4" opacity="0.55"/>
                <!-- ship -->
                <polygon points="50,14 76,78 50,66 24,78" fill="url(#wave-${id})" stroke="${s.pulse}" stroke-width="1.4"/>
                <polygon points="50,28 64,68 50,58 36,68" fill="${s.pulse}" opacity="0.45"/>
                <!-- core glow -->
                <circle cx="50" cy="44" r="9" fill="${s.pulse}" opacity="0.4"/>
                <circle cx="50" cy="44" r="6" fill="${s.core}"/>
                <circle cx="50" cy="44" r="2.5" fill="#ffffff"/>
                <!-- floating energy dots -->
                <circle cx="20" cy="34" r="1.2" fill="#ffffff" opacity="0.85"/>
                <circle cx="80" cy="38" r="1" fill="#ffffff" opacity="0.7"/>
                <circle cx="14" cy="52" r="0.9" fill="${s.core}" opacity="0.8"/>
                <circle cx="86" cy="56" r="1.1" fill="${s.core}" opacity="0.85"/>`;
        }
        else if (theme === 'corona') {
            // SOLAR FLARE — plasma sun with corona spikes (16 instead of 8) + sunspots + rotating rings
            const spikesOuter = Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                const inR = 22, outR = i % 2 === 0 ? 38 : 32;
                const x1 = 50 + Math.cos(a) * inR, y1 = 50 + Math.sin(a) * inR;
                const x2 = 50 + Math.cos(a) * outR, y2 = 50 + Math.sin(a) * outR;
                return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${s.core}" stroke-width="${i % 2 === 0 ? '2.8' : '1.6'}" opacity="${i % 2 === 0 ? '0.95' : '0.7'}" stroke-linecap="round"/>`;
            }).join('');
            // corona rings
            body = `
                <defs>
                    <radialGradient id="sun-${id}" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
                        <stop offset="40%" stop-color="${s.core}" stop-opacity="1"/>
                        <stop offset="100%" stop-color="${s.pulse}" stop-opacity="0.7"/>
                    </radialGradient>
                </defs>
                ${spikesOuter}
                <!-- outer corona ring -->
                <circle cx="50" cy="50" r="34" fill="none" stroke="${s.core}" stroke-width="0.8" opacity="0.5" stroke-dasharray="3 3"/>
                <circle cx="50" cy="50" r="28" fill="none" stroke="${s.pulse}" stroke-width="0.8" opacity="0.6" stroke-dasharray="2 2"/>
                <!-- solar surface -->
                <circle cx="50" cy="50" r="22" fill="url(#sun-${id})" stroke="${s.core}" stroke-width="1.5"/>
                <!-- sunspots / plasma swirls -->
                <circle cx="44" cy="46" r="3" fill="${s.pulse}" opacity="0.55"/>
                <circle cx="56" cy="54" r="2.4" fill="${s.pulse}" opacity="0.5"/>
                <circle cx="52" cy="42" r="1.6" fill="${s.pulse}" opacity="0.4"/>
                <!-- bright core -->
                <circle cx="50" cy="50" r="9" fill="#fff8d0"/>
                <circle cx="50" cy="50" r="4" fill="#ffffff"/>`;
        }
        else if (theme === 'blade') {
            // CRIMSON AFTERBURN — rocket-blade silhouette with TWIN afterburn cones + sparks + blood trail
            body = `
                <defs>
                    <linearGradient id="blade-${id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${s.ship}" stop-opacity="1"/>
                        <stop offset="100%" stop-color="${s.pulse}" stop-opacity="0.85"/>
                    </linearGradient>
                    <linearGradient id="flame-${id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fff8d0" stop-opacity="0"/>
                        <stop offset="30%" stop-color="${s.core}" stop-opacity="0.95"/>
                        <stop offset="100%" stop-color="${s.pulse}" stop-opacity="1"/>
                    </linearGradient>
                </defs>
                <!-- twin afterburn cones (longer, more dramatic) -->
                <polygon points="40,72 32,98 48,86" fill="url(#flame-${id})"/>
                <polygon points="60,72 68,98 52,86" fill="url(#flame-${id})"/>
                <polygon points="42,76 38,94 50,86" fill="${s.core}" opacity="0.85"/>
                <polygon points="58,76 62,94 50,86" fill="${s.core}" opacity="0.85"/>
                <polygon points="46,80 50,98 54,80" fill="${s.core}" opacity="0.7"/>
                <!-- sharp blade silhouette -->
                <polygon points="50,10 62,76 50,68 38,76" fill="url(#blade-${id})" stroke="${s.core}" stroke-width="1.4"/>
                <!-- inner blade highlight -->
                <polygon points="50,18 56,68 50,62 44,68" fill="#ffffff" opacity="0.35"/>
                <!-- wing tips -->
                <polygon points="38,76 30,64 36,72" fill="${s.ship}" opacity="0.85"/>
                <polygon points="62,76 70,64 64,72" fill="${s.ship}" opacity="0.85"/>
                <!-- core glow -->
                <circle cx="50" cy="50" r="6" fill="${s.core}"/>
                <circle cx="50" cy="50" r="2.5" fill="#ffffff"/>
                <!-- sparks shooting from afterburners -->
                <circle cx="28" cy="84" r="1.5" fill="${s.core}" opacity="0.9"/>
                <circle cx="72" cy="86" r="1.4" fill="${s.core}" opacity="0.9"/>
                <circle cx="22" cy="92" r="1" fill="#ffffff" opacity="0.85"/>
                <circle cx="78" cy="92" r="1.1" fill="#ffffff" opacity="0.85"/>
                <circle cx="50" cy="96" r="1.4" fill="#ffffff" opacity="0.9"/>`;
        }
        else if (theme === 'aurora') {
            // AURORA ZERO — prismatic foil with HUGE rainbow ribbon + halo + sparkles + multi-layer ship
            body = `
                <defs>
                    <linearGradient id="aur-rainbow-${id}" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stop-color="#7be8ff"/>
                        <stop offset="25%"  stop-color="#fffbe8"/>
                        <stop offset="50%"  stop-color="#ffd14d"/>
                        <stop offset="75%"  stop-color="#ff8ba2"/>
                        <stop offset="100%" stop-color="#bc13fe"/>
                    </linearGradient>
                    <radialGradient id="aur-halo-${id}" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stop-color="#ffd14d" stop-opacity="0.8"/>
                        <stop offset="60%"  stop-color="#7be8ff" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#bc13fe" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <!-- big rotating halo -->
                <circle cx="50" cy="50" r="42" fill="url(#aur-halo-${id})"/>
                <!-- prismatic outer ring -->
                <circle cx="50" cy="50" r="38" fill="none" stroke="url(#aur-rainbow-${id})" stroke-width="1.4" opacity="0.9" stroke-dasharray="6 3"/>
                <circle cx="50" cy="50" r="32" fill="none" stroke="url(#aur-rainbow-${id})" stroke-width="0.8" opacity="0.6" stroke-dasharray="2 4"/>
                <!-- rainbow ribbons (2 sweeps for depth) -->
                <path d="M 6 84 Q 26 56, 50 76 T 94 84" stroke="url(#aur-rainbow-${id})" stroke-width="3.2" fill="none" opacity="0.95"/>
                <path d="M 2 92 Q 24 64, 50 84 T 98 92" stroke="url(#aur-rainbow-${id})" stroke-width="2" fill="none" opacity="0.65"/>
                <!-- ship with prismatic outline -->
                <polygon points="50,12 74,80 50,68 26,80" fill="${s.ship}" opacity="0.95" stroke="url(#aur-rainbow-${id})" stroke-width="1.8"/>
                <polygon points="50,24 64,72 50,62 36,72" fill="url(#aur-rainbow-${id})" opacity="0.45"/>
                <!-- multi-layer core -->
                <circle cx="50" cy="48" r="10" fill="${s.core}" opacity="0.55"/>
                <circle cx="50" cy="48" r="6"  fill="${s.core}"/>
                <circle cx="50" cy="48" r="3"  fill="#ffffff"/>
                <!-- sparkle stars (8 around) -->
                <polygon points="18,18 19,22 23,23 19,24 18,28 17,24 13,23 17,22" fill="#ffffff" opacity="0.95"/>
                <polygon points="82,22 82.5,25 86,26 82.5,27 82,30 81.5,27 78,26 81.5,25" fill="#ffffff" opacity="0.85"/>
                <polygon points="84,58 84.5,61 88,62 84.5,63 84,66 83.5,63 80,62 83.5,61" fill="#ffffff" opacity="0.85"/>
                <polygon points="16,60 16.5,63 20,64 16.5,65 16,68 15.5,65 12,64 15.5,63" fill="#ffffff" opacity="0.85"/>
                <circle cx="40" cy="20" r="1.2" fill="#ffffff" opacity="0.9"/>
                <circle cx="60" cy="20" r="1" fill="#ffffff" opacity="0.85"/>
                <circle cx="30" cy="40" r="0.9" fill="#ffd14d" opacity="0.8"/>
                <circle cx="72" cy="42" r="0.9" fill="#7be8ff" opacity="0.8"/>`;
        }
        else {
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
// Reward icon mapping (small SVG glyph)
function _rewardIconFor(reward) {
    if (reward.gold || /gold/i.test(reward.label || '')) return '<svg viewBox="0 0 24 24" fill="none" stroke="#ffd14d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="9,9 15,9 12,15 15,15"/></svg>';
    if (reward.gems || /gems/i.test(reward.label || '')) return '<svg viewBox="0 0 24 24" fill="none" stroke="#bc13fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,3 22,11 12,22 2,11"/><polyline points="2,11 22,11"/></svg>';
    if (reward.packKey || /pack/i.test(reward.label || '')) return '<svg viewBox="0 0 24 24" fill="none" stroke="#ff67ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,3 22,9 22,17 12,23 2,17 2,9"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
}

window.openDailyOverlay = function() {
    const overlay = document.getElementById('daily-overlay');
    const grid = document.getElementById('daily-overlay-grid');
    const status = document.getElementById('daily-overlay-status');
    if (!overlay || !grid) return;
    const cycleDay = Math.max(1, save.daily?.cycleDay || 1);
    const claimedToday = save.daily?.lastClaimKey === getTodayKey();
    const streak = save.daily?.streak || 0;

    if (status) {
        status.innerHTML = claimedToday
            ? `<span style="color:#1eff8c">✓ Tag ${cycleDay} eingesammelt</span> · komm morgen wieder · Streak <strong style="color:#ffd14d">${streak}</strong>`
            : `<span style="color:#67d4ff">Tag ${cycleDay} bereit</span> · Streak <strong style="color:#ffd14d">${streak}</strong>`;
    }

    grid.innerHTML = DAILY_LOGIN_REWARDS.map((reward, index) => {
        const day = index + 1;
        const stateClass = day < cycleDay ? 'past' : day === cycleDay ? (claimedToday ? 'past' : 'today') : 'future';
        const statusText = day < cycleDay ? '✓' : day === cycleDay ? (claimedToday ? '✓' : 'JETZT') : `+${day - cycleDay}d`;
        const isToday = day === cycleDay && !claimedToday;
        return `
            <div class="lb-daily-card state-${stateClass} ${isToday ? 'highlight' : ''}">
                <div class="lb-daily-day">Tag ${day}</div>
                <div class="lb-daily-icon">${_rewardIconFor(reward)}</div>
                <div class="lb-daily-reward">${reward.label}</div>
                <div class="lb-daily-status">${statusText}</div>
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
    { id: 'kill100', title: 'Eliminate 100 enemies',         goal: 100, reward: { gold: 120, label: '120 Gold' },   tier: 'common' },
    { id: 'wave5',   title: 'Reach wave 5 in Endless',       goal: 5,   reward: { gems: 12, label: '12 Gems' },     tier: 'rare' },
    { id: 'evolve',  title: 'Evolve an ability twice in a run', goal: 2, reward: { packKey: 'strike', label: '1 Pack II' }, tier: 'epic' },
    { id: 'noHit',   title: 'Clear a mission without damage', goal: 1,  reward: { gems: 20, label: '20 Gems' },     tier: 'epic' },
    { id: 'kills500',title: 'Eliminate 500 enemies (weekly)', goal: 500, reward: { gold: 800, label: '800 Gold' },  tier: 'legendary' }
];

function getChallengeProgress(c) {
    const p = save.challengeProgress || {};
    const v = Math.min(c.goal, p[c.id] || 0);
    return { value: v, pct: Math.min(1, v / c.goal) };
}

window.openChallengesOverlay = function() {
    const overlay = document.getElementById('challenges-overlay');
    const list = document.getElementById('challenges-list');
    if (!overlay || !list) return;
    list.innerHTML = DAILY_CHALLENGES.map((c) => {
        const p = getChallengeProgress(c);
        const done = p.value >= c.goal;
        const tierClass = `tier-${c.tier}`;
        return `
            <div class="lb-quest-card ${tierClass} ${done ? 'done' : ''}">
                <div class="lb-quest-icon">${_rewardIconFor(c.reward)}</div>
                <div class="lb-quest-body">
                    <div class="lb-quest-head">
                        <span class="lb-quest-title">${c.title}</span>
                        <span class="rarity-tag ${tierClass}">${(c.tier || 'common').toUpperCase()}</span>
                    </div>
                    <div class="lb-quest-progress">
                        <div class="lb-quest-bar"><div class="lb-quest-fill" style="width:${(p.pct * 100).toFixed(0)}%"></div></div>
                        <span class="lb-quest-pct">${p.value}/${c.goal}</span>
                    </div>
                </div>
                <div class="lb-quest-reward">${c.reward.label}</div>
                <button class="lb-quest-claim ${done ? '' : 'locked'}" type="button" ${done ? '' : 'disabled'}>${done ? 'CLAIM' : 'LOCKED'}</button>
            </div>
        `;
    }).join('');
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
    refreshRailBadges();
}

// The `!` rail badges are intentionally only visible when something is
// actually pending: the Daily Login resets at midnight, so the badge appears
// when today's reward hasn't been claimed; Quests only badge when at least
// one quest is completed and ready to collect.
function refreshRailBadges() {
    const dailyClaimable = save.daily?.lastClaimKey !== getTodayKey();
    const rewardsBadge = document.getElementById('rewards-badge');
    if (rewardsBadge) rewardsBadge.style.display = dailyClaimable ? 'inline-flex' : 'none';

    // Quests: stub today — badge if any auto-completed quest pending.
    // Heuristic: if the player just leveled past a milestone OR has unread daily
    // quests we'd flag here. Right now we just treat "daily claimable" as the
    // proxy until quest data lands; the badge is hidden otherwise.
    const questsBadge = document.getElementById('quests-badge');
    if (questsBadge) {
        const hasOpenQuests = !!save.questsCompleted; // populated by gameplay
        questsBadge.style.display = hasOpenQuests ? 'inline-flex' : 'none';
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
        <p class="eyebrow">${t('equipment.slotProgression')}</p>
        <h2>Normal ${normalEquipped.length}/${caps.normal} (max ${SLOT_HARD_CAPS.normal}) · Legendary ${legendaryEquipped.length}/${caps.legendary} (max ${SLOT_HARD_CAPS.legendary})</h2>
        <p>${t('equipment.maxNote')}</p>
    `;

    normal.innerHTML = `<p class="eyebrow">${t('equipment.normalSlots')}</p><div class="loadout-slots">${buildSlotMarkup('normal', caps.normal, normalEquipped)}</div>`;
    legendary.innerHTML = `<p class="eyebrow">${t('equipment.legendarySlots')}</p><div class="loadout-slots">${buildSlotMarkup('legendary', caps.legendary, legendaryEquipped)}</div>`;

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
    const hardCap = type === 'legendary' ? SLOT_HARD_CAPS.legendary : SLOT_HARD_CAPS.normal;
    const slots = [];

    // 1) Already-unlocked slots: show equipped card or "Empty"
    for (let i = 0; i < total; i++) {
        const cardId = equipped[i];
        if (!cardId) {
            slots.push(`<div class="loadout-slot empty">${t('equipment.empty')}</div>`);
            continue;
        }
        const card = INVENTORY_CARDS[cardId];
        slots.push(`<button class="loadout-slot rarity-${card.rarity}" type="button" onclick="unequipCard('${type}', ${i})"><strong>${card.icon}</strong><span>${card.name}</span></button>`);
    }

    // 2) Locked slots up to the hard cap — show the level they unlock at,
    //    or "PAID" for the last paid-tier slot so users know it's a shop unlock.
    for (let i = total; i < hardCap; i++) {
        let lockLabel;
        if (type === 'normal') {
            // Last 2 normal slots are paid expansions (cap 5 base + 2 paid)
            if (i >= 5) {
                lockLabel = `${t('equipment.slotLockedAt')} 60 · PAID`;
            } else {
                lockLabel = `${t('equipment.slotLockedAt')} ${getNormalSlotUnlockLevel(i)}`;
            }
        } else {
            // Legendary: 0->lvl 30, 1->lvl 60, 2->paid
            if (i >= 2) {
                lockLabel = `${t('equipment.slotLockedAt')} 60 · PAID`;
            } else {
                lockLabel = `${t('equipment.slotLockedAt')} ${getLegendarySlotUnlockLevel(i)}`;
            }
        }
        slots.push(`<div class="loadout-slot empty locked-slot" title="${lockLabel}">
            <span class="lock-pill">🔒 ${lockLabel}</span>
        </div>`);
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

// Spiral level roadmap. Each node sits on a hand-rolled spiral; nodes are
// connected by a line; every 3rd level above current shows a reward chest
// (gold + gems + a level-appropriate pack); levels that unlock a new ability
// get a "skill" tag pinned to the LEFT side of the node.
function renderLevelRoadmap() {
    const host = document.getElementById('level-roadmap');
    if (!host) return;
    const cur = Math.max(1, save.unlocked || 1);

    // 8 future + current + 1 past, top → bottom (scrollable). Spiral coordinates
    // are computed in the host's local box; the host is given an explicit height
    // so we get smooth scrolling instead of cramming everything.
    const future = 8;
    const past = 1;
    const items = [];
    for (let i = future; i >= -past; i--) {
        const lvl = cur + i;
        if (lvl < 1) continue;
        let state = 'future';
        if (lvl === cur) state = 'current';
        else if (lvl === cur + 1) state = 'future-soon';
        else if (lvl < cur) state = 'locked';
        const reward = lvl > 0 && lvl % 3 === 0;
        const ability = ABILITIES.find((a) => (a.unlockLevel || 1) === lvl);
        items.push({ lvl, state, reward, ability });
    }

    // Spiral params — tuned for a mobile portrait viewport (~380px wide).
    // The horizontal radius has to stay clear of the left/right rails (each
    // ~92px wide); a radius of ~46 keeps the nodes inside the central lane.
    const ordered = items.slice().reverse(); // index 0 = past/current, last = far-future
    const cx = 50; // center column in %
    const stepY = 92; // px between consecutive nodes
    const radius = 46; // px sideways amplitude — was 78, now stays inside the rails
    const turn = 0.7; // how tight the spiral coils per step (radians)

    // Bottom padding ensures the CURRENT node sits ABOVE the FIGHT/ENDLESS
    // CTA instead of being pushed behind it. Top padding gives the highest
    // node room to breathe.
    const bottomPad = 110; // big buffer so the current-level node never
                           // overlaps the primary CTA + endless pill below.
    const topPad = 24;
    const totalHeight = bottomPad + topPad + stepY * ordered.length;
    host.style.minHeight = `${totalHeight}px`;
    host.style.position = 'relative';

    const chestSvg = `<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18"/><path d="M9 8c0-2 6-2 6 0"/></svg>`;
    const sparkSvg = `<svg viewBox="0 0 24 24"><polygon points="12,3 14,10 21,12 14,14 12,21 10,14 3,12 10,10"/></svg>`;

    // Compute per-node coordinates so the connecting SVG line + reward + skill
    // markers can attach to the same positions.
    const positions = ordered.map((it, i) => {
        const t = i;
        const offsetX = Math.sin(t * turn) * radius; // px
        // y measured from the BOTTOM of the host so the current node anchors
        // near the bottom (just above the CTA, not behind it).
        const yFromBottom = bottomPad + stepY * i;
        // Skill / reward badges are pinned to the side OPPOSITE the spiral
        // curve so they never bleed under the left or right rail.
        const badgeSide = offsetX <= 0 ? 'right' : 'left';
        return { ...it, x: offsetX, yFromBottom, badgeSide };
    });

    // Connecting spiral line as a stack of CSS-rotated segments. Each
    // segment is anchored at the LEFT-MIDDLE (transform-origin: 0 50%) so we
    // offset its `bottom` by half its 3 px height to make the pivot land on
    // the node center exactly.
    const SEG_H = 3;
    let segmentsHtml = '';
    for (let i = 0; i < positions.length - 1; i++) {
        const a = positions[i];
        const b = positions[i + 1];
        const dx = b.x - a.x;
        // CSS y grows DOWN, our yFromBottom grows UP — when b is higher than
        // a, dyCss is negative (the segment needs to tilt upward in CSS).
        const dyCss = -(b.yFromBottom - a.yFromBottom);
        const len = Math.sqrt(dx * dx + dyCss * dyCss);
        // CSS rotate() is clockwise-positive, which matches atan2(dyCss, dx)
        // for a y-down coordinate system. No sign flip needed.
        const angleDeg = Math.atan2(dyCss, dx) * 180 / Math.PI;
        const lineActive = (a.state === 'current' || a.state === 'locked') && (b.state === 'current' || b.state === 'locked');
        segmentsHtml += `<div class="lr-segment ${lineActive ? 'line-active' : ''}" style="
            left: calc(50% + ${a.x}px);
            bottom: ${a.yFromBottom - SEG_H / 2}px;
            width: ${len}px;
            transform: rotate(${angleDeg}deg);
        "></div>`;
    }

    let nodesHtml = '';
    positions.forEach((p) => {
        // Skill tag goes on the OPPOSITE side from the spiral curve so it
        // can't get clipped by a side rail. The label is short-circuited to
        // keep the pill compact (full name shown on tap in tooltip).
        const skillBadge = p.ability ? `
            <div class="lr-skill-link side-${p.badgeSide}" title="${t('roadmap.skillUnlock')}: ${(typeof tSkill === 'function' && tSkill(p.ability.id)?.name) || p.ability.name}">
                <span class="lr-skill-arm"></span>
                <span class="lr-skill-tag rarity-tier-${(p.ability.rarity || 'common').toLowerCase()}">
                    ${sparkSvg}
                </span>
            </div>` : '';
        // Reward marker is now a tight chest icon that sits ON the node
        // corner instead of an oversized "+G/◆/Pack" text pill.
        const rewardBadge = p.reward ? `
            <div class="lr-reward" title="${t('roadmap.reward')}">
                ${chestSvg}
            </div>` : '';
        nodesHtml += `<div class="lr-node ${p.state}" data-lvl="${p.lvl}" style="
            left: calc(50% + ${p.x}px);
            bottom: ${p.yFromBottom}px;
        ">
            <span class="lr-node-num">${p.lvl}</span>
            ${rewardBadge}
            ${skillBadge}
        </div>`;
    });

    host.innerHTML = `
        <div class="lr-segments">${segmentsHtml}</div>
        <div class="lr-nodes">${nodesHtml}</div>
    `;

    // Scroll so the CURRENT node sits in the BOTTOM 25% of the viewport. The
    // future levels then read upward from there.
    requestAnimationFrame(() => {
        const currentEl = host.querySelector('.lr-node.current');
        if (currentEl) {
            // offsetTop of the current node, minus an offset that lands the
            // node ~80% of the way down the visible area.
            const target = currentEl.offsetTop + currentEl.offsetHeight - host.clientHeight * 0.92;
            host.scrollTop = Math.max(0, target);
        } else {
            host.scrollTop = host.scrollHeight;
        }
    });
}

function refreshLevelCta() {
    const label = document.getElementById('primary-cta-label');
    const btn = document.getElementById('battle-button');
    if (label) label.textContent = `${t('cta.level')} ${save.unlocked || 1}`;
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
    if (!card) return '';
    return `
        <div class="pack-card pack-card-reel rarity-${card.rarity}">
            <div class="pack-reel-tier-badge tier-${card.rarity}">${getRarityLabel(card.rarity).toUpperCase()}</div>
            <div class="pack-reel-art">${getRewardArtSvg(cardId, 'chip')}</div>
            <div class="pack-reel-name">${card.name}</div>
            <div class="pack-reel-sigil">${card.sigil || ''}</div>
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
    if (!skin) return '';
    return `
        <div class="pack-card pack-card-reel rarity-${skin.rarity}">
            <div class="pack-reel-tier-badge tier-${skin.rarity}">${getRarityLabel(skin.rarity).toUpperCase()}</div>
            <div class="pack-reel-art">${getRewardArtSvg(skinId, 'skin')}</div>
            <div class="pack-reel-name">${skin.name}</div>
            <div class="pack-reel-sigil">${skin.sigil || ''}</div>
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
    resultHomeAction = null;
    action();
};

window.handleResultSecondary = function() {
    if (!resultSecondaryAction) return;
    hideResultOverlay();
    const action = resultSecondaryAction;
    resultPrimaryAction = null;
    resultSecondaryAction = null;
    resultHomeAction = null;
    action();
};

// Home button on result overlay - back to fight screen without forcing the Skills view.
window.handleResultHome = function() {
    hideResultOverlay();
    const action = resultHomeAction;
    resultPrimaryAction = null;
    resultSecondaryAction = null;
    resultHomeAction = null;
    if (typeof action === 'function') {
        action();
    } else {
        currentMode = 'mission';
        if (typeof showFight === 'function') showFight();
    }
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
        hitCounter: 0,
        trailPoints: [],
        trailBudget: 0,
        // ── Reworked / new abilities ──
        extraHearts: 0,
        extraHeartHealPerKills: 0,
        extraHeartKillCounter: 0,
        echoOnHit: false,
        echoEveryHits: 4,
        echoHitCounter: 0,
        echoRadius: 80,
        echoDmgMult: 0.6,
        phoenixAura: false,
        phoenixAuraRadius: 0,
        phoenixAuraDps: 0,
        phoenixAuraTick: 0,
        ionSplash: false,
        ionSplashRadius: 0,
        ionSplashMult: 0,
        ionPiercing: false,
        ionVaporize: false,
        sawShoot: false,
        sawShootCooldown: 0,
        sawShootInterval: 1.6,
        sawShootCount: 1,
        sawShootDmgMult: 0.6,
        boomerangLaunch: false,
        boomerangLaunchCooldown: 0,
        boomerangLaunchInterval: 2.5,
        boomerangLaunchCount: 1,
        boomerangLaunchDmgMult: 1.4,
        alwaysCenterShot: false,
        // ── HP/aux ──
        damageMultiplier: 1
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

// (Removed duplicate update/updateAutoFire/updateHazards/damagePlayer —
// the active versions with full ability support are defined earlier.)

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
        const localisedTop = (typeof tSkill === 'function') ? tSkill(ability.id) : null;

        const iconHtml = getAbilityIconMarkup(ability.id, ability.icon) || '';
        const statRow = buildAbilityDetailStats(ability, currentRank);

        const treeRows = tree.map((node, i) => {
            const state = i < currentRank ? 'owned' : i === currentRank ? 'next' : 'future';
            const nodeTier = (node.tier || tier).toLowerCase();
            const localNode = (typeof tSkillRank === 'function') ? tSkillRank(ability.id, i) : null;
            const dispName = (localNode && localNode.name) || node.name;
            const dispDesc = (localNode && localNode.desc) || node.desc;
            return `
                <div class="ability-tree-row state-${state} tier-${nodeTier}">
                    <div class="tree-row-bullet"></div>
                    <div class="tree-row-body">
                        <div class="tree-row-head">
                            <span class="tree-row-name">${dispName}</span>
                            <span class="rarity-tag tier-${nodeTier}">${nodeTier}</span>
                        </div>
                        <div class="tree-row-desc">${dispDesc}</div>
                    </div>
                </div>
            `;
        }).join('');

        content.classList.remove('tier-common', 'tier-rare', 'tier-epic', 'tier-legendary');
        content.classList.add(`tier-${tier}`);

        // Single innerHTML write — SVG sizing handled via CSS, no replaceChild
        card.innerHTML = `
            <div class="ability-detail-title">${(localisedTop && localisedTop.name) || ability.name}</div>
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
            <div class="ability-detail-desc">${(localisedTop && localisedTop.desc) || ability.desc}</div>
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
    if (levelNode) levelNode.textContent = `${t('hud.levelShort')} ${save.unlocked}`;
    // In-run centered LEVEL banner (visible only via body.in-run CSS rule).
    const inRunLevelNum = document.getElementById('in-run-level-num');
    const inRunLevelLabel = document.getElementById('in-run-level-label');
    if (inRunLevelNum) {
        inRunLevelNum.textContent = (currentMode === 'endless') ? `${currentWave + 1}` : `${currentLevel}`;
    }
    if (inRunLevelLabel) {
        inRunLevelLabel.textContent = (currentMode === 'endless') ? t('cta.endless') : t('hud.levelShort');
    }
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

// ══════════════════════════════════════════════════════════════
//  TEST ARENA — Debug mode for testing all abilities
// ══════════════════════════════════════════════════════════════

let _testArenaActive = false;
let _testGodMode = false;
let _testOneShotMode = false;
let _testAbilityQueue = {};

window.openTestArena = function() {
    const overlay = document.getElementById('test-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    renderTestGrid();
    updateTestBuffs();
};

window.closeTestArena = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('test-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.testStartArena = function() {
    _testArenaActive = true;
    currentMode = 'endless';
    currentLevel = 1;
    currentLevelWaves = [];

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

    window.canvas = document.getElementById('game-canvas');
    if (!window.canvas) return;
    window.ctx = window.canvas.getContext('2d');
    document.body.classList.add('in-run');
    resizeCanvas();
    configureArena();
    
    _applyTestStateToPlayer();
    
    clampCamera();
    attachPointerControls();
    showScreen('game-canvas');
    updateMetaHud();
    lastTime = performance.now();
    requestAnimationFrame(loop);

    const overlay = document.getElementById('test-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.testStopArena = function() {
    _testArenaActive = false;
    gameRunning = false;
    document.body.classList.remove('in-run');
    showScreen('fight-screen');
    if (window.canvas) window.canvas.style.display = 'none';
};

window.testResetAbilities = function() {
    _testAbilityQueue = {};
    if (_testArenaActive && player) {
        _applyTestStateToPlayer(true);
    }
    renderTestGrid();
    updateTestBuffs();
    showToast('Abilities reset!');
};

function _applyTestStateToPlayer(preservePosition = false) {
    let oldX = arena ? arena.width / 2 : 0;
    let oldY = arena ? arena.height / 2 : 0;
    if (preservePosition && player) {
        oldX = player.x;
        oldY = player.y;
    }
    
    player = createPlayer();
    player.x = oldX;
    player.y = oldY;
    
    // Apply queued abilities
    for (const [id, rank] of Object.entries(_testAbilityQueue)) {
        for (let i = 0; i < rank; i++) {
            // Apply silently to prevent massive sound overlap
            const origPlaySfx = window.playSfx;
            window.playSfx = () => {};
            applyAbility(id);
            window.playSfx = origPlaySfx;
        }
    }
    
    if (_testGodMode) {
        player.maxHp = 999;
        player.hp = 999;
    }
    if (_testOneShotMode) {
        player.dmg = 99999;
        player.damageMultiplier = 100;
    }
    syncHpDangerFlair();
}

window.testSpawnEnemies = function(type, count) {
    if (!_testArenaActive || !player) {
        showToast('Start arena first!');
        return;
    }
    const level = Math.max(1, currentLevel);
    for (let i = 0; i < count; i++) {
        const spawn = getArenaSpawnEdgePoint();
        let typeKey = type;
        if (type === 'boss') typeKey = 'boss';
        else if (type === 'heavy') typeKey = 'tank';
        const scaledType = getEnemyLevelStats(typeKey, level);
        enemies.push(createEnemy(scaledType, spawn.x, spawn.y));
    }
    showToast(`+${count} ${type}`);
};

window.testGodMode = function(enabled) {
    _testGodMode = enabled;
    if (_testArenaActive && player) {
        if (enabled) {
            player.maxHp = 999;
            player.hp = 999;
        } else {
            player.maxHp = 5;
            player.hp = Math.min(player.hp, player.maxHp);
        }
        syncHpDangerFlair();
    }
};

window.testOneShotMode = function(enabled) {
    _testOneShotMode = enabled;
    if (_testArenaActive && player) {
        _applyTestStateToPlayer(true);
    }
};

function renderTestGrid() {
    const grid = document.getElementById('test-ability-grid');
    if (!grid) return;

    grid.innerHTML = ABILITIES.map((ability) => {
        const rank = _testAbilityQueue[ability.id] || 0;
        const rankClass = rank > 0 ? `rank-${Math.min(rank, 4)}` : '';
        const rankLabel = rank > 0 ? `R${rank}` : '';
        const tierNames = ['', 'Common', 'Rare', 'Epic', 'Legendary'];
        const tierName = rank > 0 && rank <= 4 ? tierNames[rank] : '';
        const localisedName = ((typeof tSkill === 'function') && tSkill(ability.id) && tSkill(ability.id).name) || ability.name || ability.id;

        return `
            <button class="test-ability-btn ${rankClass}" onclick="testApplyAbility('${ability.id}')" title="${localisedName}\n${tierName}">
                <span class="ta-rank">${rankLabel}</span>
                <span class="ta-name">${localisedName}</span>
            </button>
        `;
    }).join('');
}

window.testApplyAbility = function(id) {
    const currentRank = _testAbilityQueue[id] || 0;
    if (currentRank >= 4) {
        showToast(`${id} already max rank!`);
        return;
    }
    
    _testAbilityQueue[id] = currentRank + 1;
    
    if (_testArenaActive && player) {
        applyAbility(id); 
    } else {
        const ability = ABILITIES.find((a) => a.id === id);
        const rankDef = getAbilityRankDef(ability, currentRank);
        const tier = rankDef.tier || ability?.rarity || 'common';
        const intensity = tier === 'legendary' ? 1.6 : tier === 'epic' ? 1.25 : tier === 'rare' ? 1.0 : 0.85;
        if (window.playSfx) playSfx('ability', intensity);
    }
    
    renderTestGrid();
    updateTestBuffs();
    
    const newRank = _testAbilityQueue[id];
    const tierNames = ['', 'Common', 'Rare', 'Epic', 'Legendary'];
    showToast(`${id} → Rank ${newRank} (${tierNames[newRank] || ''})`);
};

function updateTestBuffs() {
    const el = document.getElementById('test-active-buffs');
    if (!el) return;

    let p = player;
    
    if (!_testArenaActive || !p) {
        const oldPlayer = player;
        player = createPlayer(); 
        for (const [id, rank] of Object.entries(_testAbilityQueue)) {
            for (let i = 0; i < rank; i++) {
                const origPlaySfx = window.playSfx;
                window.playSfx = () => {};
                applyAbility(id);
                window.playSfx = origPlaySfx;
            }
        }
        p = player;
        player = oldPlayer;
    }

    const buffs = [];

    if (p.critChance > 0) buffs.push(`Crit ${(p.critChance*100).toFixed(0)}%`);
    if (p.critMultiplier > 2) buffs.push(`Crit ×${p.critMultiplier}`);
    if (p.lifesteal > 0) buffs.push(`Lifesteal ${(p.lifesteal*100).toFixed(0)}%`);
    if (p.pierce > 0) buffs.push(`Pierce ${p.pierce}`);
    if (p.multishot > 1) buffs.push(`Multi ×${p.multishot}`);
    if (p.chainLightning) buffs.push(`Chain ${p.chainCount}`);
    if (p.tornadoShot) buffs.push('Tornado');
    if (p.echoShot) buffs.push('Echo');
    if (p.ionRound) buffs.push('Ion');
    if (p.shockNova) buffs.push('Nova');
    if (p.singularity) buffs.push('Singularity');
    if (p.phoenixDrive) buffs.push('Phoenix');
    if (p.frostOnHit) buffs.push(`Frost ${(p.frostStrength*100).toFixed(0)}%`);
    if (p.poisonOnHit) buffs.push('Poison');
    if (p.clusterBomb) buffs.push('Cluster');
    if (p.bulletsRicochet) buffs.push(`Ricochet ${p.ricochetCount || 1}`);
    if (p.bulletsHome > 0) buffs.push(`Homing ${(p.bulletsHome*100).toFixed(0)}%`);
    if (p.boomerangShot) buffs.push('Boomerang');
    if (p.bulletFork) buffs.push(`Fork ${p.bulletForkCount}`);
    if (p.shardsOnHit) buffs.push(`Shards ×${p.shardCount}`);
    if (p.arcOnHit) buffs.push(`Arc /${p.arcEvery}`);
    if (p.critExplode) buffs.push('Crit Bomb');
    if (p.frenzyOnKill) buffs.push('Frenzy');
    if (p.killSpeedBoost) buffs.push('Trigger');
    if (p.comboBuff) buffs.push('Combo');
    if (p.firstLethalBlock) buffs.push('Spirit');
    if (p.shieldEvery > 0) buffs.push('Shield');
    if (p.blankChance > 0) buffs.push(`Blank ${(p.blankChance*100).toFixed(0)}%`);
    if (p.healOnKillChance > 0) buffs.push(`Kill Heal ${(p.healOnKillChance*100).toFixed(0)}%`);
    if (p.goldBonus > 0) buffs.push(`Gold +${(p.goldBonus*100).toFixed(0)}%`);
    if (p.platinumStack) buffs.push('Platinum');
    if (p.markOnHit) buffs.push('Mark');
    if (p.multiSpread > 0) buffs.push(`Spread +${(p.multiSpread*100).toFixed(0)}%`);
    if (p.damageMultiplier > 1.1) buffs.push(`DMG ×${p.damageMultiplier.toFixed(2)}`);
    if (p.atkCooldown < 0.3) buffs.push(`AtkSpd ${p.atkCooldown.toFixed(3)}s`);
    if (p.orbiters && p.orbiters.length > 0) buffs.push(`Orbiters ×${p.orbiters.length}`);

    if (buffs.length === 0) {
        el.innerHTML = 'Keine';
    } else {
        el.innerHTML = buffs.map(b => `<span class="buff-tag">${b}</span>`).join('');
    }
}

// T key shortcut to toggle test overlay
window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyT' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Don't trigger in text inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        const overlay = document.getElementById('test-overlay');
        if (!overlay) return;
        if (overlay.classList.contains('active')) {
            closeTestArena();
        } else {
            openTestArena();
        }
    }
});

window.addEventListener('load', () => {
    loadSave();
    applyI18nToDom();
    buildRoadmap();
    showFight();
    installSwipeNavigation();
    refreshRailBadges();
    document.addEventListener('pointerdown', ensureMusicEngine, { once: true });
    window.addEventListener('resize', resizeCanvas);
});
