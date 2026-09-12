// ctx.shadowBlur is one of the most expensive Canvas2D ops on mobile GPUs
// (especially iOS Safari) — it forces a real blur convolution on every shape
// drawn with it active, and this file sets it on nearly every entity every
// frame. 0 hits the browser's documented fast path (no shadow work at all
// when shadowBlur/shadowOffsetX/shadowOffsetY are all 0, which they are
// here — offsets are never set). Also more consistent with the flat/hard-
// shadow, no-glow direction the rest of the redesign already committed to.
var GLOW_SCALE = 0;
let _renderNow = 0;

// Real pixel-art icons for the 5 active abilities (replaces the emoji drawn
// above the player when the ability is ready) — preloaded once here since
// they're drawn on canvas, not via <img>.
const ACTIVE_ABILITY_ICONS = {};
(function preloadActiveAbilityIcons() {
    if (typeof ACTIVE_ABILITIES === 'undefined') return;
    ACTIVE_ABILITIES.forEach((def) => {
        const img = new Image();
        img.src = `icons/small/${def.icon}`;
        ACTIVE_ABILITY_ICONS[def.id] = img;
    });
})();

// Same for passive abilities (bottom-right HUD row) — replaces the 3-letter
// text sigil. saw_blade/heat_seeker already had real icons from an earlier
// pass and use different filenames.
const PASSIVE_ABILITY_ICONS = {};
(function preloadPassiveAbilityIcons() {
    if (typeof ABILITIES === 'undefined') return;
    const legacyFile = { saw_blade: 'blade-48.png', heat_seeker: 'missile-48.png' };
    ABILITIES.forEach((a) => {
        const file = legacyFile[a.id] || `ability-${a.id}-48.png`;
        const img = new Image();
        img.src = `icons/small/${file}`;
        PASSIVE_ABILITY_ICONS[a.id] = img;
    });
})();

function render() {
    _renderNow = performance.now();
    const width = window.GW || window.innerWidth;
    const height = window.GH || window.innerHeight;
    const shakeX = screenShake > 0 ? (Math.random() - 0.5) * 12 * screenShake : 0;
    const shakeY = screenShake > 0 ? (Math.random() - 0.5) * 12 * screenShake : 0;

    ctx.clearRect(0, 0, width, height);
    drawBackgroundGrid(width, height);
    ctx.save();
    ctx.translate(shakeX - (camera?.x || 0), shakeY - (camera?.y || 0));
    drawHazards();
    drawLightningBolts();
    drawPickups();
    drawProjectiles();
    drawEnemies();
    drawOrbiters();
    drawPlayer();
    drawParticles();
    drawVfxRings();
    drawVfxSparks();
    drawFxTexts();
    ctx.restore();
    drawOffscreenEnemyIndicators(width, height);
    drawInGameHud(width);
    drawOverlayFx(width, height);
}

function drawLightningBolts() {
    lightningBolts.forEach((bolt) => {
        const fade = bolt.life / bolt.maxLife;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = bolt.width;
        ctx.shadowBlur=GLOW_SCALE*(18);
        ctx.shadowColor = bolt.color;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
            ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
        }
        ctx.stroke();
        // Second thinner branch — offset each point slightly for a forked look
        if (bolt.points.length > 2) {
            ctx.globalAlpha = fade * 0.45;
            ctx.lineWidth = bolt.width * 0.5;
            ctx.shadowBlur=GLOW_SCALE*(8);
            ctx.beginPath();
            ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
            for (let i = 1; i < bolt.points.length; i++) {
                const perp = i % 2 === 0 ? 1 : -1;
                ctx.lineTo(bolt.points[i].x + perp * 4, bolt.points[i].y + perp * 4);
            }
            ctx.stroke();
        }
        ctx.restore();
    });
}

let _gridCanvas = null;
let _gridCtx = null;
let _gridW = 0, _gridH = 0, _gridOffX = 0, _gridOffY = 0;

function drawBackgroundGrid(width, height) {
    // A zero-sized canvas makes drawImage() throw InvalidStateError, and this
    // runs inside the render loop, so the throw would take rendering down with
    // it. The canvas really can be 0x0 for a frame or two — starting while the
    // tab is hidden, or mid orientation change on mobile.
    if (!(width > 0) || !(height > 0)) return;
    const pulse = 0.03 + Math.min(0.06, powerPulse * 0.03);
    const size = 48;
    const camX = camera?.x || 0;
    const camY = camera?.y || 0;
    const offsetX = -((camX % size) + size) % size;
    const offsetY = -((camY % size) + size) % size;

    // Rebuild offscreen grid only when dimensions or camera-tile-offset changes
    if (!_gridCanvas || _gridW !== width || _gridH !== height ||
        _gridOffX !== offsetX || _gridOffY !== offsetY) {
        _gridW = width; _gridH = height;
        _gridOffX = offsetX; _gridOffY = offsetY;

        if (!_gridCanvas) {
            _gridCanvas = document.createElement('canvas');
            _gridCtx = _gridCanvas.getContext('2d');
        }
        _gridCanvas.width = width;
        _gridCanvas.height = height;
        _gridCtx.clearRect(0, 0, width, height);
        _gridCtx.strokeStyle = 'rgba(255,255,255,1)';
        _gridCtx.lineWidth = 0.5;
        for (let x = offsetX; x < width + size; x += size) {
            _gridCtx.beginPath();
            _gridCtx.moveTo(x, 0);
            _gridCtx.lineTo(x, height);
            _gridCtx.stroke();
        }
        for (let y = offsetY; y < height + size; y += size) {
            _gridCtx.beginPath();
            _gridCtx.moveTo(0, y);
            _gridCtx.lineTo(width, y);
            _gridCtx.stroke();
        }
    }

    ctx.globalAlpha = pulse;
    ctx.drawImage(_gridCanvas, 0, 0);
    ctx.globalAlpha = 1;

    if (typeof arena !== 'undefined') {
        const left = -camX;
        const top = arena.top - camY;
        const right = arena.width - camX;
        const bottom = arena.height - camY;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, right - left, bottom - top);
    }
}

function drawHazards() {
    hazards.forEach((hazard) => {
        if (hazard.type === 'ring') {
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 7;
            ctx.globalAlpha = Math.max(0.1, hazard.life / 1.2);
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            return;
        }

        if (hazard.type === 'enemybullet') {
            ctx.save();
            ctx.globalAlpha = Math.max(0.3, hazard.life / 1.6);
            ctx.shadowBlur=GLOW_SCALE*(14);
            ctx.shadowColor = hazard.color;
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        if (hazard.type === 'empring') {
            ctx.save();
            ctx.globalAlpha = Math.max(0.08, hazard.life / 1.4);
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 5;
            ctx.setLineDash([14, 8]);
            ctx.shadowBlur=GLOW_SCALE*(18);
            ctx.shadowColor = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            return;
        }

        if (hazard.type === 'gravity') {
            ctx.save();
            ctx.globalAlpha = Math.max(0.14, hazard.life / 1.8);
            ctx.strokeStyle = '#97c7d6';
            ctx.lineWidth = 3;
            ctx.shadowBlur=GLOW_SCALE*(22);
            ctx.shadowColor = '#97c7d6';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(151,199,214, 0.15)';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Singularity shot: traveling black hole ──
        if (hazard.type === 'singularity_shot') {
            ctx.save();
            const sr = hazard.radius;
            const now = _renderNow * 0.001;
            // Void core gradient
            const grad = ctx.createRadialGradient(hazard.x, hazard.y, 0, hazard.x, hazard.y, sr * 2.8);
            grad.addColorStop(0,   '#000000');
            grad.addColorStop(0.45,'#12002a');
            grad.addColorStop(1,   'rgba(161,132,201,0)');
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, sr * 2.8, 0, Math.PI * 2);
            ctx.fill();
            // Spinning accretion disk (flat ellipse)
            ctx.globalAlpha = 0.75;
            ctx.strokeStyle = '#b98cd1';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur=GLOW_SCALE*(22);
            ctx.shadowColor = '#a184c9';
            ctx.beginPath();
            ctx.ellipse(hazard.x, hazard.y, sr * 3.0, sr * 0.9, now * 2.2, 0, Math.PI * 2);
            ctx.stroke();
            // Second smaller ring at different angle
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(hazard.x, hazard.y, sr * 2.2, sr * 0.6, now * 1.5 + 1.1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        // ── Singularity pull field: black hole at rest ──
        if (hazard.type === 'singularity') {
            ctx.save();
            const alpha = Math.max(0.08, hazard.life / hazard.maxLife);
            const r = hazard.radius;
            const now = _renderNow * 0.001;
            // Pull zone — dashed outer ring
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#a184c9';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.shadowBlur=GLOW_SCALE*(16);
            ctx.shadowColor = '#a184c9';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // Dark void core
            const coreGrad = ctx.createRadialGradient(hazard.x, hazard.y, 0, hazard.x, hazard.y, r * 0.48);
            coreGrad.addColorStop(0,   '#000000');
            coreGrad.addColorStop(0.65,'#110022');
            coreGrad.addColorStop(1,   'rgba(161,132,201,0)');
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, r * 0.48, 0, Math.PI * 2);
            ctx.fill();
            // Spinning accretion disk
            ctx.globalAlpha = alpha * 0.65;
            ctx.strokeStyle = '#b98cd1';
            ctx.lineWidth = 3;
            ctx.shadowBlur=GLOW_SCALE*(28);
            ctx.shadowColor = '#b98cd1';
            ctx.beginPath();
            ctx.ellipse(hazard.x, hazard.y, r * 0.38, r * 0.12, now * 3.5, 0, Math.PI * 2);
            ctx.stroke();
            // Spiraling debris particles drawn as small arcs at varying radii
            ctx.shadowBlur=GLOW_SCALE*(8);
            for (let si = 0; si < 6; si++) {
                const sa = now * (2.8 + si * 0.4) + (si / 6) * Math.PI * 2;
                const sr2 = r * (0.25 + (si % 3) * 0.1);
                const sx = hazard.x + Math.cos(sa) * sr2;
                const sy = hazard.y + Math.sin(sa) * sr2 * 0.35;
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = si % 2 === 0 ? '#a184c9' : '#b98cd1';
                ctx.beginPath();
                ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        // ── Magnetmine ──
        if (hazard.type === 'magnetmine') {
            ctx.save();
            const armFrac = hazard.armed ? 1 : 1 - Math.max(0, hazard.armTimer / 0.8);
            ctx.globalAlpha = 0.85;
            ctx.shadowBlur=GLOW_SCALE*(14);
            ctx.shadowColor = hazard.color;
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.stroke();
            // Trigger radius indicator (fades in as mine arms)
            ctx.globalAlpha = armFrac * 0.2;
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.triggerR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // Blinking core
            ctx.globalAlpha = hazard.armed ? (0.6 + 0.4 * Math.sin(_renderNow * 0.01)) : 0.4;
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // ── Slowzone ──
        if (hazard.type === 'slowzone') {
            ctx.save();
            const frac = hazard.life / hazard.maxLife;
            ctx.globalAlpha = frac * 0.22;
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = frac * 0.45;
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            return;
        }

        // ── Ricochet bullet ──
        if (hazard.type === 'ricochet') {
            ctx.save();
            ctx.globalAlpha = Math.max(0.3, hazard.life / 1.6);
            ctx.shadowBlur=GLOW_SCALE*(18);
            ctx.shadowColor = hazard.color;
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.fill();
            // Speed trail
            ctx.globalAlpha *= 0.4;
            ctx.beginPath();
            ctx.arc(hazard.x - hazard.vx * 0.02, hazard.y - hazard.vy * 0.02, hazard.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // ── Grenade ──
        if (hazard.type === 'grenade') {
            ctx.save();
            ctx.shadowBlur=GLOW_SCALE*(16);
            ctx.shadowColor = hazard.color;
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // ── Clone (wraith decoy) ──
        if (hazard.type === 'clone') {
            ctx.save();
            const frac = hazard.life / hazard.maxLife;
            ctx.globalAlpha = frac * 0.65;
            ctx.shadowBlur=GLOW_SCALE*(20);
            ctx.shadowColor = hazard.color;
            ctx.strokeStyle = hazard.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
            ctx.stroke();
            // Pulsing cross
            ctx.globalAlpha = frac * 0.5 * (0.5 + 0.5 * Math.sin(_renderNow * 0.012));
            ctx.fillStyle = hazard.color;
            ctx.fillRect(hazard.x - 6, hazard.y - 1.5, 12, 3);
            ctx.fillRect(hazard.x - 1.5, hazard.y - 6, 3, 12);
            ctx.restore();
            return;
        }
    });
}

function drawPickups() {
    pickups.forEach((pickup) => {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.rotate(pickup.spin);
        ctx.shadowBlur=GLOW_SCALE*(16);
        ctx.shadowColor = '#67c092';
        ctx.fillStyle = '#67c092';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

function drawProjectiles() {
    const equippedSkin = (save && SKIN_DEFINITIONS && SKIN_DEFINITIONS[save.equippedSkin]) ? SKIN_DEFINITIONS[save.equippedSkin] : SKIN_DEFINITIONS.stock;
    const shotColor = equippedSkin.style.shot || '#ffffff';
    const glowColor = equippedSkin.style.core || shotColor;
    projectiles.forEach((projectile) => {
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(projectile.spin || 0);

        // ── Saw shot: spinning toothed disc ──
        if (projectile.isSawShot) {
            ctx.shadowBlur=GLOW_SCALE*(18);
            ctx.shadowColor = '#97c7d6';
            ctx.strokeStyle = '#bcd6de';
            ctx.lineWidth = 1.6;
            const r = projectile.r;
            const teeth = 10;
            ctx.beginPath();
            for (let i = 0; i < teeth * 2; i++) {
                const a = (Math.PI / teeth) * i;
                const rad = i % 2 === 0 ? r : r * 0.65;
                const x = Math.cos(a) * rad;
                const y = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            // Inner hub
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        // ── Boomerang shot: V-shaped boomerang silhouette ──
        if (projectile.isBoomShot) {
            ctx.shadowBlur=GLOW_SCALE*(16);
            ctx.shadowColor = '#d6b36a';
            ctx.strokeStyle = '#e3cf9a';
            ctx.fillStyle = 'rgba(214,179,106,0.20)';
            ctx.lineWidth = 2;
            const r = projectile.r;
            ctx.beginPath();
            ctx.moveTo(-r * 1.2, 0);
            ctx.quadraticCurveTo(0, -r * 1.4, r * 1.2, 0);
            ctx.quadraticCurveTo(0, -r * 0.4, -r * 1.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            return;
        }

        // ── Ion shot: bigger glow ring ──
        if (projectile.isIon) {
            ctx.shadowBlur=GLOW_SCALE*(22);
            ctx.shadowColor = '#d6b36a';
            ctx.strokeStyle = '#e3cf9a';
            ctx.fillStyle = 'rgba(214,179,106,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, projectile.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, projectile.r * 0.55, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.shadowBlur=GLOW_SCALE*(projectile.tornado ? 22 : 12);
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = shotColor;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        if (projectile.tornado) {
            // Tornado: layered rotating diamond rings for swirl look
            const now2 = _renderNow * 0.001;
            ctx.moveTo(0, -projectile.r);
            ctx.lineTo(projectile.r, 0);
            ctx.lineTo(0, projectile.r);
            ctx.lineTo(-projectile.r, 0);
            ctx.closePath();
            ctx.stroke();
            // Second inner ring, counter-rotated
            ctx.save();
            ctx.rotate(now2 * 4);
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -projectile.r * 0.6);
            ctx.lineTo(projectile.r * 0.6, 0);
            ctx.lineTo(0, projectile.r * 0.6);
            ctx.lineTo(-projectile.r * 0.6, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.arc(0, 0, projectile.r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = shotColor;
        ctx.globalAlpha = 0.25;
        if (!projectile.tornado) ctx.fill();
        ctx.restore();
    });
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.ai === 'sprint' ? Math.sin(enemy.aiClock * 8) * 0.18 : 0);

        // Chaser: apply blink alpha fade
        const blinkAlpha = (enemy.ai === 'sprint' && enemy.blinkAlpha !== undefined)
            ? enemy.blinkAlpha : 1.0;

        // Chaser blink-ready glow: flicker purple when blinkPending
        const blinkFlicker = enemy.blinkPending && Math.sin(enemy.aiClock * 18) > 0;
        const neonColor = enemy.hitFlash > 0 ? '#ffffff' : (blinkFlicker ? '#bd93d6' : enemy.color);
        ctx.shadowBlur=GLOW_SCALE*(enemy.isBoss ? 30 : 16);
        ctx.shadowColor = neonColor;
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = enemy.isBoss ? 2 : 1.5;

        // Wraith fades out while phasing.
        const phaseAlpha = enemy.phasing ? 0.35 : blinkAlpha;
        ctx.globalAlpha = phaseAlpha;

        ctx.beginPath();
        if (enemy.isBoss) {
            // Hexagon
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * enemy.r, Math.sin(a) * enemy.r);
                else ctx.lineTo(Math.cos(a) * enemy.r, Math.sin(a) * enemy.r);
            }
            ctx.closePath();
        } else if (enemy.ai === 'heavy') {
            // Tank: square with inner X (EMP indicator)
            const r = enemy.r;
            ctx.rect(-r, -r, r * 2, r * 2);
        } else if (enemy.ai === 'crusher') {
            // Crusher: jagged 8-point star / cross-square
            const r = enemy.r;
            const notch = r * 0.62;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i - Math.PI / 8;
                const rad = i % 2 === 0 ? r : notch;
                if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
                else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath();
        } else if (enemy.ai === 'strafe') {
            // Drone: diamond with a small barrel line toward player
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r, 0);
            ctx.lineTo(0, enemy.r);
            ctx.lineTo(-enemy.r, 0);
            ctx.closePath();
        } else if (enemy.ai === 'swarm') {
            // Swarmling: circle with a split line (ready to divide)
            ctx.arc(0, 0, enemy.r, 0, Math.PI * 2);
        } else if (enemy.ai === 'sprint') {
            // Chaser: chevron/arrow pointing at player
            const a = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            ctx.rotate(a - Math.PI / 2);
            const r = enemy.r;
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.85, r * 0.5);
            ctx.lineTo(0, r * 0.1);
            ctx.lineTo(-r * 0.85, r * 0.5);
            ctx.closePath();
        } else if (enemy.ai === 'brute') {
            // Brute: thick pentagon (heavy, stompy)
            const r = enemy.r;
            for (let i = 0; i < 5; i++) {
                const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
        } else if (enemy.ai === 'sniper') {
            // Forward triangle pointing at the player
            const a = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            ctx.rotate(a);
            ctx.moveTo(enemy.r, 0);
            ctx.lineTo(-enemy.r * 0.7, -enemy.r * 0.85);
            ctx.lineTo(-enemy.r * 0.7, enemy.r * 0.85);
            ctx.closePath();
        } else if (enemy.ai === 'bomber') {
            // 5-spike star
            const r = enemy.r;
            const inner = r * 0.55;
            for (let i = 0; i < 10; i++) {
                const a = (Math.PI / 5) * i - Math.PI / 2;
                const rad = i % 2 === 0 ? r : inner;
                if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
                else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath();
        } else if (enemy.ai === 'healer') {
            // Plus / cross
            const r = enemy.r;
            const t = r * 0.4;
            ctx.moveTo(-t, -r); ctx.lineTo(t, -r); ctx.lineTo(t, -t);
            ctx.lineTo(r, -t); ctx.lineTo(r, t); ctx.lineTo(t, t);
            ctx.lineTo(t, r); ctx.lineTo(-t, r); ctx.lineTo(-t, t);
            ctx.lineTo(-r, t); ctx.lineTo(-r, -t); ctx.lineTo(-t, -t);
            ctx.closePath();
        } else if (enemy.ai === 'shielder') {
            // Shielder body = square; shield ring drawn after.
            ctx.rect(-enemy.r, -enemy.r, enemy.r * 2, enemy.r * 2);
        } else if (enemy.ai === 'wraith') {
            ctx.arc(0, 0, enemy.r, 0, Math.PI * 2);
        } else if (enemy.ai === 'berserker') {
            // Aggressive triangle
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r * 0.95, enemy.r * 0.85);
            ctx.lineTo(-enemy.r * 0.95, enemy.r * 0.85);
            ctx.closePath();
        } else {
            ctx.arc(0, 0, enemy.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        if (enemy.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
            ctx.fill();
        }

        // ── Swarmling: split dividing line ──
        if (enemy.ai === 'swarm' && !enemy.hasSplit) {
            ctx.globalAlpha = phaseAlpha * 0.7;
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -enemy.r); ctx.lineTo(0, enemy.r);
            ctx.stroke();
        }

        // ── Drone: barrel line pointing at player ──
        if (enemy.ai === 'strafe') {
            const ba = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const shootReady = (enemy.shootCooldown !== undefined && enemy.shootCooldown < 0.5);
            ctx.globalAlpha = phaseAlpha * (shootReady ? 0.9 : 0.45);
            ctx.strokeStyle = shootReady ? '#ffffff' : neonColor;
            ctx.lineWidth = shootReady ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ba) * (enemy.r * 0.5), Math.sin(ba) * (enemy.r * 0.5));
            ctx.lineTo(Math.cos(ba) * (enemy.r + 8), Math.sin(ba) * (enemy.r + 8));
            ctx.stroke();
        }

        // ── Tank: EMP pulse ring indicator when charging up ──
        if (enemy.ai === 'heavy' && enemy.empCooldown !== undefined && enemy.empCooldown < 1.5) {
            const pulse = 1 - enemy.empCooldown / 1.5;
            ctx.globalAlpha = phaseAlpha * pulse * 0.7;
            ctx.strokeStyle = '#cf9440';
            ctx.shadowColor = '#cf9440';
            ctx.shadowBlur=GLOW_SCALE*(12);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, enemy.r + 5 + pulse * 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // ── Brute: expanding ground ring when about to slam ──
        if (enemy.ai === 'brute' && enemy.slamCooldown !== undefined && enemy.slamCooldown < 0.7) {
            const charge = 1 - enemy.slamCooldown / 0.7;
            // Pulsing ring that grows outward — clear warning area
            const ringR = enemy.r + charge * 14;
            ctx.globalAlpha = phaseAlpha * charge * 0.9;
            ctx.strokeStyle = '#d09c46';
            ctx.shadowColor = '#d09c46';
            ctx.shadowBlur=GLOW_SCALE*(16);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, ringR, 0, Math.PI * 2);
            ctx.stroke();
            // Second inner ring for depth
            ctx.globalAlpha = phaseAlpha * charge * 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, ringR * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = phaseAlpha;

        // ── Shielder: full overhaul ──
        if (enemy.ai === 'shielder') {
            const pct = enemy.shieldMax > 0 ? Math.max(0, Math.min(1, enemy.shieldHp / enemy.shieldMax)) : 0;
            const isRaging = enemy.shieldRageTimer > 0;

            if (pct > 0) {
                // Thick directional shield arc facing player
                const toPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                ctx.save();
                ctx.rotate(toPlayer); // rotate so arc faces player
                const shieldSpan = Math.PI * 0.75; // 135° arc
                ctx.globalAlpha = phaseAlpha * (0.55 + 0.45 * pct);
                ctx.strokeStyle = '#8db4d2';
                ctx.shadowColor = '#8db4d2';
                ctx.shadowBlur=GLOW_SCALE*(20 * pct);
                ctx.lineWidth = 4 + pct * 3;
                ctx.beginPath();
                ctx.arc(0, 0, enemy.r + 7, -shieldSpan / 2, shieldSpan / 2);
                ctx.stroke();
                // Glow fill inside arc
                ctx.globalAlpha = phaseAlpha * pct * 0.15;
                ctx.fillStyle = '#8db4d2';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, enemy.r + 7, -shieldSpan / 2, shieldSpan / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Rage glow
            if (isRaging) {
                ctx.globalAlpha = phaseAlpha * 0.5;
                ctx.strokeStyle = '#c25f57';
                ctx.shadowColor = '#c25f57';
                ctx.shadowBlur=GLOW_SCALE*(22);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, enemy.r + 3 + Math.sin(enemy.aiClock * 12) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Shield regen pulse
            if (!isRaging && pct > 0 && pct < 1 && enemy.shieldRegenTimer > 2.5) {
                ctx.globalAlpha = phaseAlpha * 0.3 * Math.sin(enemy.aiClock * 6);
                ctx.strokeStyle = '#8db4d2';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, enemy.r + 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (enemy.shieldHp > 0 && enemy.shieldMax > 0) {
            // Other enemies with shields: simple arc
            const pct = Math.max(0, Math.min(1, enemy.shieldHp / enemy.shieldMax));
            ctx.globalAlpha = phaseAlpha * (0.55 + 0.35 * pct);
            ctx.strokeStyle = '#9cc8d8';
            ctx.shadowColor = '#9cc8d8';
            ctx.shadowBlur=GLOW_SCALE*(12);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
            ctx.stroke();
            ctx.globalAlpha = phaseAlpha;
        }

        ctx.globalAlpha = 1;

        ctx.font = enemy.isBoss ? '700 18px "IBM Plex Sans"' : '700 14px "IBM Plex Sans"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 4;
        ctx.shadowBlur=GLOW_SCALE*(0);
        const label = formatCompactNumber(enemy.hp);
        ctx.strokeText(label, 0, -enemy.r - 12);
        ctx.fillText(label, 0, -enemy.r - 12);
        ctx.restore();
    });
}

function drawOrbiters() {
    if (!player || !player.orbiters) return;

    player.orbiters.forEach((orbiter) => {
        // Combat drone: distinct look. While respawning, render a faint countdown ring on the player.
        if (orbiter.isDrone) {
            if (!orbiter.alive) {
                // Respawn timer indicator floating above the player
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.globalAlpha = 0.55;
                ctx.shadowBlur=GLOW_SCALE*(8);
                ctx.shadowColor = '#cd7a4e';
                ctx.strokeStyle = 'rgba(255, 128, 48, 0.6)';
                ctx.lineWidth = 1.5;
                const pct = Math.max(0, Math.min(1, 1 - orbiter.respawnTimer / Math.max(0.001, orbiter.respawnDuration || 15)));
                const arcStart = -Math.PI / 2 + (orbiter.slot || 0) * (Math.PI * 2 / Math.max(1, orbiter.totalSlots || 1));
                ctx.beginPath();
                ctx.arc(0, 0, 36, arcStart, arcStart + Math.PI * 2 * pct * 0.3);
                ctx.stroke();
                ctx.restore();
                return;
            }
            // Live drone: tri-filled body with cyan ring + tiny barrel toward target
            ctx.save();
            ctx.translate(orbiter.x, orbiter.y);
            ctx.shadowBlur=GLOW_SCALE*(14);
            ctx.shadowColor = '#97c7d6';
            ctx.strokeStyle = '#bcd6de';
            ctx.fillStyle = 'rgba(151,199,214, 0.20)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, 0, orbiter.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // crosshair to read as "gun"
            ctx.beginPath();
            ctx.moveTo(-orbiter.r * 0.6, 0);
            ctx.lineTo(orbiter.r * 0.6, 0);
            ctx.moveTo(0, -orbiter.r * 0.6);
            ctx.lineTo(0, orbiter.r * 0.6);
            ctx.stroke();
            ctx.restore();
            return;
        }
        // Legacy generic orbiter
        ctx.save();
        ctx.translate(orbiter.x, orbiter.y);
        ctx.shadowBlur=GLOW_SCALE*(14);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, orbiter.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawPlayer() {
    if (!player) return;
    const skin = (save && SKIN_DEFINITIONS && SKIN_DEFINITIONS[save.equippedSkin])
        ? SKIN_DEFINITIONS[save.equippedSkin]
        : SKIN_DEFINITIONS.stock;
    const style = skin.style;
    const rarityVfx = ({ blue: 1, dark: 2, purple: 3, red: 4, gold: 5 })[skin.rarity] || 1;

    // ── Phoenix Aura ──────────────────────────────────────────────────────────
    if (player.phoenixAura && player.phoenixAuraRadius > 0) {
        const t = (_renderNow / 1000) % 1000;
        const r = player.phoenixAuraRadius;
        const wobble = 1 + Math.sin(t * 4.2) * 0.04;
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.globalAlpha = 0.18 + Math.sin(t * 5) * 0.04;
        const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * wobble);
        grad.addColorStop(0, 'rgba(255, 160, 60, 0.0)');
        grad.addColorStop(0.55, 'rgba(255, 110, 40, 0.45)');
        grad.addColorStop(1, 'rgba(255, 50, 20, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r * wobble, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.7)';
        ctx.lineWidth = 1.4; ctx.shadowBlur=GLOW_SCALE*(18); ctx.shadowColor = '#cd7a4e';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        // ── Flame wisps orbiting the aura edge ──
        ctx.shadowBlur=GLOW_SCALE*(12); ctx.shadowColor = '#cc6338';
        for (let i = 0; i < 7; i++) {
            const wa = t * 1.8 + (i / 7) * Math.PI * 2;
            const wr = r * (0.92 + Math.sin(t * 3.1 + i) * 0.06);
            const wx = Math.cos(wa) * wr;
            const wy = Math.sin(wa) * wr;
            const ws = 0.3 + Math.abs(Math.sin(t * 2.4 + i * 1.3)) * 0.35;
            ctx.globalAlpha = ws * 0.7;
            ctx.fillStyle = i % 2 === 0 ? '#cd7a4e' : '#dda05c';
            ctx.beginPath();
            ctx.arc(wx, wy, 3 + ws * 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ── Trail ─────────────────────────────────────────────────────────────────
    // Emitted from the ship's actual engine positions (matching the sprite art:
    // twin main engines close together at the rear-center, plus a thruster on
    // each wingtip) instead of a single stream out of the hull's pivot point.
    // The two rear-center engines sit only ~3px apart at gameplay scale, so
    // they're drawn as one combined central stream — separating them wouldn't
    // read as two lines anyway — while the wing thrusters are far enough out
    // to draw as their own distinct trails.
    const trail = player.trailPoints || [];
    if (trail.length > 1) {
        const thrusterHalf = player.r * 1.15; // sprite half-size (size = r*2.3)
        const THRUSTERS = [
            { lx: 0,     ly: 0.82, width: 1.15, alpha: 1 },    // rear-center (both main engines)
            { lx: -0.85, ly: 0.55, width: 0.55, alpha: 0.7 },  // left wingtip
            { lx: 0.85,  ly: 0.55, width: 0.55, alpha: 0.7 }   // right wingtip
        ];
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const baseWidth = 4 + rarityVfx * 1.4;
        for (const th of THRUSTERS) {
            const ox = th.lx * thrusterHalf, oy = th.ly * thrusterHalf;
            // Rotate this thruster's local offset into world space per historical
            // point using that point's own recorded ship angle, so the trail
            // stays correctly anchored to the hull as it turns over time.
            const pts = trail.map((p) => {
                const a = p.angle || 0, cosA = Math.cos(a), sinA = Math.sin(a);
                return { x: p.x + ox * cosA - oy * sinA, y: p.y + ox * sinA + oy * cosA, life: p.life, width: p.width };
            });
            for (let i = 0; i < pts.length - 1; i++) {
                const prev    = pts[Math.max(0, i - 1)];
                const current = pts[i];
                const next    = pts[i + 1];
                const startX = i === 0 ? current.x : (prev.x + current.x) * 0.5;
                const startY = i === 0 ? current.y : (prev.y + current.y) * 0.5;
                const endX   = (current.x + next.x) * 0.5;
                const endY   = (current.y + next.y) * 0.5;
                const fade   = 1 - (i / Math.max(1, pts.length - 1));
                ctx.shadowBlur=GLOW_SCALE*(6 + (fade * (6 + rarityVfx * 2))) * th.width;
                ctx.shadowColor = style.trail;
                ctx.strokeStyle = style.trail;
                ctx.globalAlpha = Math.max(0.02, current.life * 0.55 * fade * th.alpha);
                ctx.lineWidth   = Math.max(1, baseWidth * th.width * current.width * (0.24 + fade * 0.76));
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(current.x, current.y, endX, endY);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
        // Optional per-skin trail overlay (e.g. aurora rainbow shimmer)
        if (typeof skin.drawTrailExtra === 'function') {
            skin.drawTrailExtra(ctx, trail, style);
        }
        ctx.restore();
    }

    // ── Power-pulse ring ──────────────────────────────────────────────────────
    if (powerPulse > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.25, powerPulse * 0.12);
        ctx.strokeStyle = style.pulse; ctx.shadowBlur=GLOW_SCALE*(14); ctx.shadowColor = style.pulse;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(player.x, player.y, 34 + powerPulse * 14, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    // ── Soft aura glow ────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.55;
    const auraGrad = ctx.createRadialGradient(
        player.x, player.y, 4,
        player.x, player.y, player.r * (2.0 + rarityVfx * 0.4)
    );
    auraGrad.addColorStop(0, style.pulse);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r * (2.0 + rarityVfx * 0.4), 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── Ship body (delegated to the skin) ─────────────────────────────────────
    const invulAlpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0 ? 0.45 : 1;
    // Rotate world-space smoothed velocity into ship-local space so skins can react
    // to movement without knowing about world angle. Normalized ~0..1 at full speed.
    const _angle = player.angle || 0;
    const _cosA = Math.cos(-_angle), _sinA = Math.sin(-_angle);
    const _wx = player._mvx || 0, _wy = player._mvy || 0;
    const _lmx = Math.max(-1, Math.min(1, (_wx * _cosA - _wy * _sinA) / 220));
    const _lmy = Math.max(-1, Math.min(1, (_wx * _sinA + _wy * _cosA) / 220));
    ctx.save();
    ctx.translate(player.x, player.y);
    // Rotates to face movement direction only (player.angle is no longer
    // touched by aim/shooting, see updateAutoFire) — so the thruster always
    // points the right way relative to where the ship is actually flying.
    ctx.rotate(_angle);
    // Each skin picked its own scale base (r/34 … r/40) with its own geometry on
    // top, so rendered hulls ranged from 40px to 61px tall while the hitbox is a
    // fixed player.r for all of them — a cosmetic skin was changing how big your
    // ship looked relative to what actually gets hit. renderScale pulls them
    // into a tight band (~43-49px) without flattening their character.
    const _skinScale = skin.renderScale || 1;
    if (_skinScale !== 1) ctx.scale(_skinScale, _skinScale);
    ctx.globalAlpha = invulAlpha;
    skin.drawBody(ctx, player.r, style, rarityVfx, invulAlpha, _lmx, _lmy);
    ctx.restore();
    ctx.globalAlpha = 1;

    // ── Active Ability: Cooldown Arc + Ready Glow ──────────────────────────
    if (player.activeAbility) {
        const def = typeof ACTIVE_ABILITIES !== 'undefined'
            ? ACTIVE_ABILITIES.find(a => a.id === player.activeAbility) : null;
        const col = def ? def.color : '#ffffff';
        const maxCD = player.activeMaxCooldown || 1;
        const curCD = player.activeCooldown || 0;
        const fill = 1 - curCD / maxCD; // 0 = empty, 1 = ready
        const arcR = player.r + 14;
        const startAngle = -Math.PI / 2;

        ctx.save();
        // Background track
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(player.x, player.y, arcR, 0, Math.PI * 2);
        ctx.stroke();

        // Filled arc
        if (fill > 0) {
            ctx.globalAlpha = fill > 0.99 ? 0.9 + 0.1 * Math.sin(_renderNow * 0.008) : 0.75;
            ctx.shadowBlur=GLOW_SCALE*(fill > 0.99 ? 16 : 8);
            ctx.shadowColor = col;
            ctx.strokeStyle = col;
            ctx.lineWidth = fill > 0.99 ? 3.5 : 3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, arcR, startAngle, startAngle + Math.PI * 2 * fill);
            ctx.stroke();
        }

        // Ready icon above player
        if (curCD <= 0 && def) {
            const pulse = 0.7 + 0.3 * Math.sin(_renderNow * 0.007);
            ctx.globalAlpha = pulse;
            ctx.shadowBlur=GLOW_SCALE*(12);
            ctx.shadowColor = col;
            const iconImg = ACTIVE_ABILITY_ICONS[player.activeAbility];
            if (iconImg && iconImg.complete && iconImg.naturalWidth) {
                const s = 20;
                const smoothing = ctx.imageSmoothingEnabled;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(iconImg, player.x - s / 2, player.y - arcR - 10 - s, s, s);
                ctx.imageSmoothingEnabled = smoothing;
            } else {
                ctx.fillStyle = col;
                ctx.font = 'bold 13px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(def.icon, player.x, player.y - arcR - 10);
            }
        }

        // Activate flash ring
        if (player.activeAbilityFlash > 0) {
            ctx.globalAlpha = player.activeAbilityFlash * 0.8;
            ctx.strokeStyle = col;
            ctx.lineWidth = 4;
            ctx.shadowBlur=GLOW_SCALE*(24);
            ctx.shadowColor = col;
            ctx.beginPath();
            ctx.arc(player.x, player.y, arcR + (1 - player.activeAbilityFlash) * 30, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Shield visual when active
        if (player.shieldActive) {
            const sp = player.shieldTimer / player.shieldDuration;
            ctx.globalAlpha = sp * 0.35;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.r + 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = sp * 0.85;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur=GLOW_SCALE*(18);
            ctx.shadowColor = col;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.r + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

function drawParticles() {
    particles.forEach((particle) => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawFxTexts() {
    fxTexts.forEach((text) => {
        ctx.globalAlpha = text.life / text.maxLife;
        ctx.font = `900 ${text.size}px "IBM Plex Sans", "Arial Black", sans-serif`;
        ctx.textAlign = 'center';

        // Glow: ability + crit popups get a heavy multi-pass neon halo so they
        // feel weighty. Regular pop-ups still get a light shadow above 22px.
        if (text.glow) {
            // Outer soft halo (additive feel via extra fill passes)
            ctx.save();
            ctx.shadowBlur=GLOW_SCALE*(Math.min(60, text.size * 1.6));
            ctx.shadowColor = text.color;
            ctx.fillStyle = text.color;
            // Two halo passes intensify the bloom
            ctx.fillText(text.text, text.x, text.y);
            ctx.fillText(text.text, text.x, text.y);
            ctx.restore();
            ctx.shadowBlur=GLOW_SCALE*(Math.min(40, text.size * 1.1));
            ctx.shadowColor = text.color;
        } else if (text.size >= 22) {
            ctx.shadowBlur=GLOW_SCALE*(Math.min(28, text.size * 0.9));
            ctx.shadowColor = text.color;
        } else {
            ctx.shadowBlur=GLOW_SCALE*(0);
        }

        ctx.lineWidth = Math.max(5, Math.round(text.size * (text.glow ? 0.36 : 0.32)));
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.strokeText(text.text, text.x, text.y);
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, text.x, text.y);
        ctx.shadowBlur=GLOW_SCALE*(0);
    });
    ctx.globalAlpha = 1;
}

function drawOffscreenEnemyIndicators(width, height) {
    if (!player || !camera) return;

    const safeTop = height > width ? 110 : 72;
    const margin = 22;
    const left = margin;
    const right = width - margin;
    const top = safeTop;
    const bottom = height - margin;
    const cx = width * 0.5;
    const cy = height * 0.5 + 12;
    const viewLeft = camera.x;
    const viewRight = camera.x + width;
    const viewTop = camera.y;
    const viewBottom = camera.y + height;

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        if (enemy.x >= viewLeft && enemy.x <= viewRight && enemy.y >= viewTop && enemy.y <= viewBottom) return;

        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;
        const dx = screenX - cx;
        const dy = screenY - cy;
        const angle = Math.atan2(dy, dx);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let t = Infinity;
        if (cos > 0) t = Math.min(t, (right - cx) / cos);
        if (cos < 0) t = Math.min(t, (left - cx) / cos);
        if (sin > 0) t = Math.min(t, (bottom - cy) / sin);
        if (sin < 0) t = Math.min(t, (top - cy) / sin);
        if (!Number.isFinite(t)) return;

        const px = cx + cos * t;
        const py = cy + sin * t;
        const isBoss = !!enemy.isBoss;
        const size = isBoss ? 15 : 11;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.shadowBlur=GLOW_SCALE*(isBoss ? 20 : 12);
        ctx.shadowColor = '#d0716f';
        ctx.fillStyle = '#d0716f';
        ctx.globalAlpha = isBoss ? 1 : 0.92;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.72, size);
        ctx.lineTo(0, size * 0.45);
        ctx.lineTo(-size * 0.72, size);
        ctx.closePath();
        ctx.fill();

        if (isBoss) {
            ctx.strokeStyle = 'rgba(255,255,255,0.95)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    });
}

// `total` = the player's max hearts. This loop used to be hardcoded to 3, which
// was fine while 3 was the only possible value — with the Panzerung upgrade the
// player reaches 8 and hearts 4..8 were never drawn, so damage had no feedback.
// Spacing and size now shrink as the count grows so the row still fits a 375px
// phone (8 hearts at the old 34px step would have been 272px wide).
function drawHearts(x, y, hp, total = 3) {
    const count = Math.max(1, Math.floor(total));
    const fullHearts = Math.max(0, Math.floor(hp));
    const step      = count <= 3 ? 34  : count <= 5 ? 28  : count <= 6 ? 24   : 21;
    const baseScale = count <= 3 ? 1.2 : count <= 5 ? 1.0 : count <= 6 ? 0.86 : 0.76;

    // Compute damage-flash factor (0 = idle, 1 = just damaged, decays in 0.6s)
    const damageT = (typeof window.__heartDamageTime === 'number')
        ? Math.max(0, 1 - (_renderNow - window.__heartDamageTime) / 600)
        : 0;
    // Lost-heart range: which heart(s) got depleted this hit? Animate them
    // shaking out. A boss hit can cost 2 hearts at once, so this is a range
    // (start index + count), not a single index.
    const lostHeartIdx = (typeof window.__heartLostIdx === 'number') ? window.__heartLostIdx : -1;
    const lostHeartCount = (typeof window.__heartLostCount === 'number') ? window.__heartLostCount : 1;

    for (let i = 0; i < count; i++) {
        ctx.save();
        // Default position
        let cx = x + i * step;
        let cy = y;
        let scale = baseScale;
        let color = i < fullHearts ? '#d0716f' : 'rgba(255,255,255,0.12)';
        let glow = 0;

        // Lost heart(s): shake + fade out
        if (i >= lostHeartIdx && i < lostHeartIdx + lostHeartCount && lostHeartIdx >= 0 && damageT > 0) {
            cx += Math.sin(damageT * 22) * 4 * damageT;
            cy += Math.cos(damageT * 18) * 3 * damageT;
            scale = baseScale * (1 + damageT * 0.6); // grow as it "explodes"
            color = `rgba(255, ${Math.floor(55 + damageT * 200)}, ${Math.floor(95 + damageT * 80)}, ${(1 - damageT * 0.6).toFixed(2)})`;
            glow = damageT * 18;
        }
        // Remaining hearts pulse briefly when damage hits
        else if (i < fullHearts && damageT > 0) {
            scale = baseScale * (1 + damageT * 0.18);
            glow = damageT * 12;
        }

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        if (glow > 0) {
            ctx.shadowColor = '#d0716f';
            ctx.shadowBlur=GLOW_SCALE*(glow);
        }
        drawHeartShape(color);
        ctx.restore();
    }
    // Where the row ends, so callers can lay out things after it.
    return x + count * step;
}

function drawHeartShape(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur=GLOW_SCALE*(color === 'rgba(255,255,255,0.12)' ? 0 : 10);
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(12, 2, 12, -10, 0, -4);
    ctx.bezierCurveTo(-12, -10, -12, 2, 0, 10);
    ctx.stroke();
}

function drawOverlayFx(width, height) {
    if (powerPulse > 0) {
        const alpha = Math.min(0.18, powerPulse * 0.08);
        const gradient = ctx.createRadialGradient(width / 2, height * 0.6, 20, width / 2, height * 0.6, width * 0.65);
        gradient.addColorStop(0, `rgba(111,183,197, ${alpha})`);
        gradient.addColorStop(1, 'rgba(111,183,197, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    if (player && player.hp === 1) {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.8);
        gradient.addColorStop(0, 'rgba(208,113,111, 0)');
        gradient.addColorStop(1, 'rgba(208,113,111, 0.18)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

function drawInGameHud(width) {
    if (!player) return;

    const height = window.GH || window.innerHeight;
    const safeTop = height > width ? 48 : 16;
    const barLeft = 20;
    const barTop = safeTop + 70;
    const barWidth = width - 40;
    const abilityPct = Math.min(1, player.abilityXp / player.nextAbilityXp);
    const waveLabel = currentMode === 'endless'
        ? `${currentWave + 1}/INF`
        : `${Math.min(currentWave + 1, currentLevelWaves.length)}/${Math.max(1, currentLevelWaves.length)}`;

    // Row width now depends on max hearts, so the extra-heart row follows on
    // from wherever the regular row actually ended.
    const heartsEndX = drawHearts(24, safeTop + 8, player.hp, player.maxHp);

    // ── Extra hearts (Patch Heart) — drawn after the regular hearts ──
    if (player.extraHearts && player.extraHearts > 0) {
        drawExtraHearts(heartsEndX, safeTop + 8, player.extraHearts);
    }

    const _tt2 = (typeof t === 'function') ? t : ((k) => k);
    const topPills = [
        { text: `${_tt2('hud.waveShort')} ${waveLabel}`, color: '#ffffff' },
        { text: `${_tt2('hud.zone')} ${currentLevel}`, color: '#ffffff' }
    ];
    const currencyPills = [
        { text: `GOLD ${save.gold}`, color: '#d6b36a' },
        { text: `GEMS ${save.gems}`, color: '#bb98d6' }
    ];

    let rightX = width - 18;
    ctx.textAlign = 'right';
    topPills.slice().reverse().forEach((pill) => {
        ctx.font = '700 10px "Saira Condensed"';
        const textWidth = ctx.measureText(pill.text).width;
        const pillWidth = textWidth + 18;
        const pillX = rightX - pillWidth;
        ctx.fillStyle = 'rgba(13,12,17, 0.72)';
        ctx.strokeStyle = pill.color === '#d6b36a'
            ? 'rgba(214,179,106,0.28)'
            : pill.color === '#bb98d6'
                ? 'rgba(217,140,255,0.28)'
                : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.shadowBlur=GLOW_SCALE*(16);
        ctx.shadowColor = pill.color === '#ffffff' ? 'rgba(255,255,255,0.06)' : pill.color;
        ctx.beginPath();
        ctx.roundRect(pillX, safeTop, pillWidth, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pill.color;
        ctx.fillText(pill.text, rightX - 9, safeTop + 17);
        ctx.shadowBlur=GLOW_SCALE*(0);
        rightX = pillX - 6;
    });

    rightX = width - 18;
    currencyPills.slice().reverse().forEach((pill) => {
        ctx.font = '700 10px "Saira Condensed"';
        const textWidth = ctx.measureText(pill.text).width;
        const pillWidth = textWidth + 18;
        const pillX = rightX - pillWidth;
        ctx.fillStyle = 'rgba(13,12,17, 0.78)';
        ctx.strokeStyle = pill.color === '#d6b36a' ? 'rgba(214,179,106,0.34)' : 'rgba(217,140,255,0.34)';
        ctx.lineWidth = 1;
        ctx.shadowBlur=GLOW_SCALE*(18);
        ctx.shadowColor = pill.color;
        ctx.beginPath();
        ctx.roundRect(pillX, safeTop + 30, pillWidth, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pill.color;
        ctx.fillText(pill.text, rightX - 9, safeTop + 47);
        ctx.shadowBlur=GLOW_SCALE*(0);
        rightX = pillX - 6;
    });

    if (killStreak > 2) {
        ctx.textAlign = 'center';
        ctx.font = '700 13px "Saira Condensed"';
        ctx.fillStyle = '#cf9440';
        ctx.shadowBlur=GLOW_SCALE*(14);
        ctx.shadowColor = '#cf9440';
        ctx.fillText(`${_tt2('hud.hitRush')} x${killStreak}`, width * 0.5, safeTop + 20);
        ctx.shadowBlur=GLOW_SCALE*(0);
    }

    ctx.textAlign = 'left';
    ctx.font = '700 12px "IBM Plex Sans"';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(`${_tt2('hud.abilityXp')} ${player.abilityXp} / ${player.nextAbilityXp}`, barLeft, safeTop + 62);

    ctx.fillStyle = 'rgba(4, 8, 20, 0.42)';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, barWidth, 8, 999);
    ctx.fill();
    ctx.fillStyle = '#a184c9';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, Math.max(12, barWidth * abilityPct), 8, 999);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, safeTop + 96);
    ctx.lineTo(width - 12, safeTop + 96);
    ctx.stroke();

    drawBossBars(width, safeTop);
    drawFrenzyIndicator(width, safeTop);
    drawPassiveIcons(width, height);
}

// ── Passive ability icons: bottom-right, glow when triggered ──────────────────
const _passiveIconTriggers = {}; // id → timer (seconds to glow)
function triggerPassiveIconGlow(id) { _passiveIconTriggers[id] = 0.55; }
function updatePassiveIconTimers(dt) {
    for (const id in _passiveIconTriggers) {
        if (_passiveIconTriggers[id] > 0) {
            _passiveIconTriggers[id] = Math.max(0, _passiveIconTriggers[id] - dt);
        }
    }
}

function drawPassiveIcons(width, height) {
    if (!player || !player.abilityRanks) return;
    const active = Object.keys(player.abilityRanks).filter(id => player.abilityRanks[id] > 0);
    if (active.length === 0) return;

    const SIZE = 26, GAP = 4, MAX = 8;
    const shown = active.slice(0, MAX);
    const totalW = shown.length * (SIZE + GAP) - GAP;
    const startX = width - 16 - totalW;
    const Y = height - 20 - SIZE;

    shown.forEach((id, i) => {
        const ability = typeof ABILITIES !== 'undefined' ? ABILITIES.find(a => a.id === id) : null;
        const icon = ability ? (ability.icon || id.slice(0,3).toUpperCase()) : id.slice(0,3).toUpperCase();
        const rank = player.abilityRanks[id] || 0;
        const glowT = _passiveIconTriggers[id] || 0;

        const x = startX + i * (SIZE + GAP);
        const glowing = glowT > 0;

        ctx.save();
        // Box background
        ctx.globalAlpha = glowing ? 0.85 : 0.5;
        ctx.fillStyle = glowing ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, Y, SIZE, SIZE, 5) : ctx.rect(x, Y, SIZE, SIZE);
        ctx.fill();

        // Glow border when active
        if (glowing) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur=GLOW_SCALE*(12 * glowT);
            ctx.shadowColor = '#fff';
            ctx.globalAlpha = glowT;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, Y, SIZE, SIZE, 5) : ctx.rect(x, Y, SIZE, SIZE);
            ctx.stroke();
        }

        // Icon
        const iconImg = PASSIVE_ABILITY_ICONS[id];
        if (iconImg && iconImg.complete && iconImg.naturalWidth) {
            ctx.globalAlpha = glowing ? 1 : 0.85;
            ctx.shadowBlur=GLOW_SCALE*(glowing ? 8 : 0);
            ctx.shadowColor = '#fff';
            const smoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = false;
            const pad = 3, iconSize = SIZE - pad * 2;
            ctx.drawImage(iconImg, x + pad, Y + pad - 1, iconSize, iconSize);
            ctx.imageSmoothingEnabled = smoothing;
        } else {
            ctx.globalAlpha = glowing ? 1 : 0.75;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur=GLOW_SCALE*(glowing ? 8 : 0);
            ctx.shadowColor = '#fff';
            ctx.font = `bold ${SIZE <= 26 ? 9 : 10}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, x + SIZE / 2, Y + SIZE / 2 - 2);
        }

        // Rank dots
        for (let r = 0; r < Math.min(rank, 4); r++) {
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = rank >= 4 ? '#d6b36a' : '#aaa';
            ctx.beginPath();
            ctx.arc(x + 4 + r * 5, Y + SIZE - 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Boss bars — one big top-of-screen bar per living boss. Stacked if multiple.
// ─────────────────────────────────────────────────────────────────────────────
function drawBossBars(width, safeTop) {
    const barW = Math.min(560, width - 80);
    const barH = 18;
    const gapY = 8;
    const startY = safeTop + 110;
    const x = (width - barW) / 2;
    let bi = 0;

    for (let _ei = 0; _ei < enemies.length; _ei++) {
        const boss = enemies[_ei];
        if (!boss || !boss.alive || !boss.isBoss) continue;
        const i = bi++;
        const y = startY + i * (barH + gapY + 14);
        const pct = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));

        ctx.save();
        ctx.fillStyle = 'rgba(13,12,17, 0.78)';
        ctx.strokeStyle = 'rgba(208,113,111, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur=GLOW_SCALE*(18);
        ctx.shadowColor = 'rgba(208,113,111, 0.55)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 9);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur=GLOW_SCALE*(0);

        const grad = ctx.createLinearGradient(x, y, x + barW, y);
        grad.addColorStop(0, '#ff8198');
        grad.addColorStop(1, '#d0716f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, Math.max(2, (barW - 4) * pct), barH - 4, 7);
        ctx.fill();

        ctx.shadowBlur=GLOW_SCALE*(0);
        ctx.font = '700 11px "Saira Condensed"';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffe1e8';
        const name = boss.bossName || 'BOSS';
        ctx.fillText(name, x + 2, y - 4);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 225, 232, 0.92)';
        const hpLabel = `${formatCompactNumber(Math.max(0, Math.ceil(boss.hp)))} / ${formatCompactNumber(boss.maxHp)}`;
        ctx.fillText(hpLabel, x + barW - 2, y - 4);

        ctx.restore();
    }
}

// ── Frenzy indicator: shows how many stacks of Frenzy are active ──
function drawFrenzyIndicator(width, safeTop) {
    if (!player) return;
    const stack = player.frenzyStack || 0;
    if (stack <= 0) return;
    const cap = player.frenzyCap > 0 && player.frenzyCap !== 99 ? player.frenzyCap : 1;
    const pct = Math.max(0, Math.min(1, stack / cap));
    const w = 180;
    const h = 12;
    const x = (width - w) / 2;
    const y = safeTop + 80;
    ctx.save();
    ctx.fillStyle = 'rgba(13,12,17, 0.78)';
    ctx.strokeStyle = 'rgba(255, 157, 0, 0.6)';
    ctx.shadowBlur=GLOW_SCALE*(14);
    ctx.shadowColor = '#cf9440';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur=GLOW_SCALE*(0);
    const fillGrad = ctx.createLinearGradient(x, y, x + w, y);
    fillGrad.addColorStop(0, '#ffe1a0');
    fillGrad.addColorStop(1, '#cf6a42');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, Math.max(2, (w - 2) * pct), h - 2, 5);
    ctx.fill();
    ctx.font = '700 10px "Saira Condensed"';
    ctx.fillStyle = '#e3cf9a';
    ctx.textAlign = 'center';
    ctx.fillText(`FRENZY +${(stack * 100).toFixed(0)}%`, width / 2, y - 3);
    ctx.restore();
}

// ── Extra hearts (Patch Heart) — golden hearts to the right of normal ones ──
function drawExtraHearts(x, y, count) {
    const max = Math.min(8, count);
    for (let i = 0; i < max; i++) {
        ctx.save();
        ctx.translate(x + i * 30, y);
        ctx.scale(1.1, 1.1);
        ctx.shadowColor = '#d6b36a';
        ctx.shadowBlur=GLOW_SCALE*(14);
        ctx.strokeStyle = '#d6b36a';
        ctx.fillStyle = 'rgba(214,179,106, 0.25)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(12, 2, 12, -10, 0, -4);
        ctx.bezierCurveTo(-12, -10, -12, 2, 0, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

// ── VFX Rings ─────────────────────────────────────────────────────────────────
function drawVfxRings() {
    if (!vfxRings || vfxRings.length === 0) return;
    ctx.save();
    for (let i = 0; i < vfxRings.length; i++) {
        const ring = vfxRings[i];
        const fade = ring.life / ring.maxLife;
        ctx.globalAlpha = fade * 0.85;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth * (0.5 + fade * 0.5);
        ctx.shadowBlur=GLOW_SCALE*(10 * fade);
        ctx.shadowColor = ring.color;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur=GLOW_SCALE*(0);
    ctx.restore();
}

// ── VFX Sparks ────────────────────────────────────────────────────────────────
function drawVfxSparks() {
    if (!vfxSparks || vfxSparks.length === 0) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < vfxSparks.length; i++) {
        const s = vfxSparks[i];
        const fade = s.life / s.maxLife;
        ctx.globalAlpha = fade * 0.9;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.2 * fade + 0.4;
        ctx.shadowBlur=GLOW_SCALE*(6 * fade);
        ctx.shadowColor = s.color;
        const speed = Math.hypot(s.vx, s.vy);
        const nx = speed > 0.1 ? s.vx / speed : 0;
        const ny = speed > 0.1 ? s.vy / speed : 0;
        const tailLen = s.len * fade;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - nx * tailLen, s.y - ny * tailLen);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur=GLOW_SCALE*(0);
    ctx.restore();
}
