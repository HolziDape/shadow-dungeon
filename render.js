function render() {
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
    drawFxTexts();
    ctx.restore();
    drawOffscreenEnemyIndicators(width, height);
    drawInGameHud(width);
    drawOverlayFx(width, height);
}

function drawLightningBolts() {
    lightningBolts.forEach((bolt) => {
        ctx.save();
        ctx.globalAlpha = bolt.life / bolt.maxLife;
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = bolt.width;
        ctx.shadowBlur = 16;
        ctx.shadowColor = bolt.color;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
            ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    });
}

function drawBackgroundGrid(width, height) {
    const pulse = 0.03 + Math.min(0.06, powerPulse * 0.03);
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.lineWidth = 0.5;
    const size = 48;
    const camX = camera?.x || 0;
    const camY = camera?.y || 0;
    const offsetX = -((camX % size) + size) % size;
    const offsetY = -((camY % size) + size) % size;

    for (let x = offsetX; x < width + size; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = offsetY; y < height + size; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

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

        if (hazard.type === 'gravity') {
            ctx.save();
            ctx.globalAlpha = Math.max(0.14, hazard.life / 1.8);
            ctx.strokeStyle = '#7be8ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#7be8ff';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(123, 232, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}

function drawPickups() {
    pickups.forEach((pickup) => {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.rotate(pickup.spin);
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#00ff9d';
        ctx.fillStyle = '#00ff9d';
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
        ctx.shadowBlur = projectile.tornado ? 18 : 12;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = shotColor;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        if (projectile.tornado) {
            ctx.moveTo(0, -projectile.r);
            ctx.lineTo(projectile.r, 0);
            ctx.lineTo(0, projectile.r);
            ctx.lineTo(-projectile.r, 0);
            ctx.closePath();
        } else {
            ctx.arc(0, 0, projectile.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.fillStyle = shotColor;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.restore();
    });
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.ai === 'sprint' ? Math.sin(enemy.aiClock * 8) * 0.18 : 0);

        const neonColor = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
        ctx.shadowBlur = enemy.isBoss ? 30 : 16;
        ctx.shadowColor = neonColor;
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = enemy.isBoss ? 2 : 1.5;

        ctx.beginPath();
        if (enemy.isBoss) {
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r * 0.7, -enemy.r * 0.2);
            ctx.lineTo(enemy.r, enemy.r * 0.2);
            ctx.lineTo(0, enemy.r);
            ctx.lineTo(-enemy.r, enemy.r * 0.2);
            ctx.lineTo(-enemy.r * 0.7, -enemy.r * 0.2);
            ctx.closePath();
        } else if (enemy.ai === 'heavy') {
            ctx.rect(-enemy.r, -enemy.r, enemy.r * 2, enemy.r * 2);
        } else if (enemy.ai === 'strafe') {
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r, 0);
            ctx.lineTo(0, enemy.r);
            ctx.lineTo(-enemy.r, 0);
            ctx.closePath();
        } else {
            ctx.arc(0, 0, enemy.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        if (enemy.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
            ctx.fill();
        }

        ctx.font = enemy.isBoss ? '700 18px Rajdhani' : '700 14px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        const label = formatCompactNumber(enemy.hp);
        ctx.strokeText(label, 0, -enemy.r - 12);
        ctx.fillText(label, 0, -enemy.r - 12);
        ctx.restore();
    });
}

function drawOrbiters() {
    if (!player || !player.orbiters) return;

    player.orbiters.forEach((orbiter) => {
        ctx.save();
        ctx.translate(orbiter.x, orbiter.y);
        ctx.shadowBlur = 14;
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
    const equippedSkin = (save && SKIN_DEFINITIONS && SKIN_DEFINITIONS[save.equippedSkin]) ? SKIN_DEFINITIONS[save.equippedSkin] : SKIN_DEFINITIONS.stock;
    const style = equippedSkin.style;
    // VFX intensity climbs with rarity (blue=1, dark=2, purple=3, red=4, gold=5)
    const rarityVfx = ({ blue: 1, dark: 2, purple: 3, red: 4, gold: 5 })[equippedSkin.rarity] || 1;

    // Skin-based trail (always on, gets richer with rarity)
    const trail = player.trailPoints || [];
    if (trail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const baseWidth = 4 + rarityVfx * 1.4;
        for (let i = 0; i < trail.length - 1; i++) {
            const prev = trail[Math.max(0, i - 1)];
            const current = trail[i];
            const next = trail[i + 1];
            const startX = i === 0 ? current.x : (prev.x + current.x) * 0.5;
            const startY = i === 0 ? current.y : (prev.y + current.y) * 0.5;
            const endX = (current.x + next.x) * 0.5;
            const endY = (current.y + next.y) * 0.5;
            const fade = 1 - (i / Math.max(1, trail.length - 1));
            const alpha = Math.max(0.02, current.life * 0.55 * fade);
            ctx.shadowBlur = 6 + (fade * (6 + rarityVfx * 2));
            ctx.shadowColor = style.trail;
            ctx.strokeStyle = style.trail;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(1, baseWidth * current.width * (0.24 + fade * 0.76));
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(current.x, current.y, endX, endY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Aurora-Zero gold skin: rainbow shimmer overlay
        if (equippedSkin.rarity === 'gold') {
            const colors = ['#7be8ff', '#fffbe8', '#ffd14d', '#ff8ba2'];
            for (let i = 0; i < trail.length - 1; i += 2) {
                const fade = 1 - (i / Math.max(1, trail.length - 1));
                ctx.globalAlpha = Math.max(0.02, fade * 0.3);
                ctx.strokeStyle = colors[i % colors.length];
                ctx.shadowBlur = 8;
                ctx.shadowColor = colors[i % colors.length];
                ctx.lineWidth = 2;
                const cur = trail[i];
                const nxt = trail[i + 1];
                ctx.beginPath(); ctx.moveTo(cur.x, cur.y); ctx.lineTo(nxt.x, nxt.y); ctx.stroke();
            }
        }
        ctx.restore();
    }

    if (powerPulse > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.25, powerPulse * 0.12);
        ctx.strokeStyle = style.pulse;
        ctx.shadowBlur = 14;
        ctx.shadowColor = style.pulse;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 34 + (powerPulse * 14), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Soft aura glow around the ship (intensity ramps with rarity)
    ctx.save();
    ctx.globalAlpha = 0.55;
    const auraGrad = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, player.r * (2.0 + rarityVfx * 0.4));
    auraGrad.addColorStop(0, style.pulse);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * (2.0 + rarityVfx * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle || 0);
    ctx.globalAlpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0 ? 0.45 : 1;

    // Ship body — outer outline in skin core color
    ctx.shadowBlur = 16 + rarityVfx * 3;
    ctx.shadowColor = style.core;
    ctx.strokeStyle = style.ship;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -player.r);
    ctx.lineTo(player.r * 0.82, player.r);
    ctx.lineTo(0, player.r * 0.42);
    ctx.lineTo(-player.r * 0.82, player.r);
    ctx.closePath();
    ctx.stroke();

    // Filled silhouette (ship color, semi-transparent)
    ctx.shadowBlur = 0;
    ctx.fillStyle = style.ship;
    ctx.globalAlpha = (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0 ? 0.25 : 0.40);
    ctx.fill();
    ctx.globalAlpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0 ? 0.45 : 1;

    // Core sphere
    ctx.shadowBlur = 12;
    ctx.shadowColor = style.core;
    ctx.fillStyle = style.core;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer wing-tip outline (faint, helps silhouette pop on dark bg)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = style.ship;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -player.r - 4);
    ctx.lineTo(player.r * 0.98, player.r + 4);
    ctx.lineTo(0, player.r * 0.5);
    ctx.lineTo(-player.r * 0.98, player.r + 4);
    ctx.closePath();
    ctx.stroke();

    // Rarity-specific extra VFX
    if (equippedSkin.rarity === 'red' || equippedSkin.rarity === 'gold') {
        // Twin afterburner cones from the back
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = style.trail;
        ctx.shadowBlur = 14;
        ctx.shadowColor = style.core;
        const tx = player.r * 0.45;
        const ty = player.r + 2;
        const tlen = player.r * 0.9;
        ctx.beginPath();
        ctx.moveTo(-tx, ty); ctx.lineTo(0, ty + tlen); ctx.lineTo(tx, ty); ctx.closePath();
        ctx.fill();
    }
    if (equippedSkin.rarity === 'gold' || equippedSkin.rarity === 'red') {
        // Sparkles around ship
        const t = (performance.now() / 90) % (Math.PI * 2);
        for (let i = 0; i < 4; i++) {
            const a = t + i * (Math.PI / 2);
            const px = Math.cos(a) * (player.r + 8);
            const py = Math.sin(a) * (player.r + 8);
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = style.core;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
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
        ctx.font = `700 ${text.size}px Rajdhani`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillStyle = text.color;
        ctx.strokeText(text.text, text.x, text.y);
        ctx.fillText(text.text, text.x, text.y);
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
        ctx.shadowBlur = isBoss ? 20 : 12;
        ctx.shadowColor = '#ff375f';
        ctx.fillStyle = '#ff375f';
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

function drawHearts(x, y, hp) {
    const fullHearts = Math.max(0, Math.floor(hp));
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(x + i * 34, y);
        ctx.scale(1.2, 1.2);
        drawHeartShape(i < fullHearts ? '#ff375f' : 'rgba(255,255,255,0.12)');
        ctx.restore();
    }
}

function drawInGameHud(width) {
    if (!player) return;

    const barLeft = 20;
    const barTop = 74;
    const barWidth = width - 40;
    const abilityPct = Math.min(1, player.abilityXp / player.nextAbilityXp);

    drawHearts(20, 20, player.hp);

    const pills = [
        { text: `WAVE ${currentMode === 'endless' ? `${currentWave + 1}/∞` : `${Math.min(currentWave + 1, currentLevelWaves.length)}/${Math.max(1, currentLevelWaves.length)}`}`, color: '#ffffff' },
        { text: `LVL ${currentLevel}`, color: '#ffffff' },
        { text: `GOLD ${save.gold}`, color: '#ffd14d' },
        { text: `GEMS ${save.gems}`, color: '#d98cff' }
    ];

    let rightX = width - 18;
    ctx.textAlign = 'right';
    pills.slice().reverse().forEach((pill) => {
        ctx.font = '700 11px Orbitron';
        const textWidth = ctx.measureText(pill.text).width;
        const pillWidth = textWidth + 20;
        const pillX = rightX - pillWidth;
        ctx.fillStyle = 'rgba(8, 12, 26, 0.72)';
        ctx.strokeStyle = pill.color === '#ffd14d' ? 'rgba(255,209,77,0.28)' : pill.color === '#d98cff' ? 'rgba(217,140,255,0.28)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 16;
        ctx.shadowColor = pill.color === '#ffffff' ? 'rgba(255,255,255,0.06)' : pill.color;
        ctx.beginPath();
        ctx.roundRect(pillX, 12, pillWidth, 26, 13);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pill.color;
        ctx.fillText(pill.text, rightX - 10, 30);
        ctx.shadowBlur = 0;
        rightX = pillX - 6;
    });

    if (killStreak > 2) {
        ctx.textAlign = 'center';
        ctx.font = '700 14px Orbitron';
        ctx.fillStyle = '#ff9d00';
        ctx.fillText(`HIT RUSH x${killStreak}`, width * 0.5, 30);
    }

    ctx.textAlign = 'left';
    ctx.font = '700 13px Rajdhani';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(`Ability XP ${player.abilityXp} / ${player.nextAbilityXp}`, barLeft, 60);

    ctx.fillStyle = 'rgba(4, 8, 20, 0.42)';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, barWidth, 8, 999);
    ctx.fill();
    ctx.fillStyle = '#bc13fe';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, Math.max(12, barWidth * abilityPct), 8, 999);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 100);
    ctx.lineTo(width - 12, 100);
    ctx.stroke();
}

function drawHeartShape(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = color === 'rgba(255,255,255,0.12)' ? 0 : 10;
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
        gradient.addColorStop(0, `rgba(0, 242, 255, ${alpha})`);
        gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    if (player && player.hp === 1) {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.8);
        gradient.addColorStop(0, 'rgba(255, 55, 95, 0)');
        gradient.addColorStop(1, 'rgba(255, 55, 95, 0.18)');
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

    drawHearts(24, safeTop + 8, player.hp);

    const topPills = [
        { text: `WAVE ${waveLabel}`, color: '#ffffff' },
        { text: `ZONE ${currentLevel}`, color: '#ffffff' }
    ];
    const currencyPills = [
        { text: `GOLD ${save.gold}`, color: '#ffd14d' },
        { text: `GEMS ${save.gems}`, color: '#d98cff' }
    ];

    let rightX = width - 18;
    ctx.textAlign = 'right';
    topPills.slice().reverse().forEach((pill) => {
        ctx.font = '700 10px Orbitron';
        const textWidth = ctx.measureText(pill.text).width;
        const pillWidth = textWidth + 18;
        const pillX = rightX - pillWidth;
        ctx.fillStyle = 'rgba(8, 12, 26, 0.72)';
        ctx.strokeStyle = pill.color === '#ffd14d'
            ? 'rgba(255,209,77,0.28)'
            : pill.color === '#d98cff'
                ? 'rgba(217,140,255,0.28)'
                : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 16;
        ctx.shadowColor = pill.color === '#ffffff' ? 'rgba(255,255,255,0.06)' : pill.color;
        ctx.beginPath();
        ctx.roundRect(pillX, safeTop, pillWidth, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pill.color;
        ctx.fillText(pill.text, rightX - 9, safeTop + 17);
        ctx.shadowBlur = 0;
        rightX = pillX - 6;
    });

    rightX = width - 18;
    currencyPills.slice().reverse().forEach((pill) => {
        ctx.font = '700 10px Orbitron';
        const textWidth = ctx.measureText(pill.text).width;
        const pillWidth = textWidth + 18;
        const pillX = rightX - pillWidth;
        ctx.fillStyle = 'rgba(8, 12, 26, 0.78)';
        ctx.strokeStyle = pill.color === '#ffd14d' ? 'rgba(255,209,77,0.34)' : 'rgba(217,140,255,0.34)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 18;
        ctx.shadowColor = pill.color;
        ctx.beginPath();
        ctx.roundRect(pillX, safeTop + 30, pillWidth, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pill.color;
        ctx.fillText(pill.text, rightX - 9, safeTop + 47);
        ctx.shadowBlur = 0;
        rightX = pillX - 6;
    });

    if (killStreak > 2) {
        ctx.textAlign = 'center';
        ctx.font = '700 13px Orbitron';
        ctx.fillStyle = '#ff9d00';
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ff9d00';
        ctx.fillText(`HIT RUSH x${killStreak}`, width * 0.5, safeTop + 20);
        ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
    ctx.font = '700 12px Rajdhani';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(`Ability XP ${player.abilityXp} / ${player.nextAbilityXp}`, barLeft, safeTop + 62);

    ctx.fillStyle = 'rgba(4, 8, 20, 0.42)';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, barWidth, 8, 999);
    ctx.fill();
    ctx.fillStyle = '#bc13fe';
    ctx.beginPath();
    ctx.roundRect(barLeft, barTop, Math.max(12, barWidth * abilityPct), 8, 999);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, safeTop + 96);
    ctx.lineTo(width - 12, safeTop + 96);
    ctx.stroke();
}
