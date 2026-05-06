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

        // ── Saw shot: spinning toothed disc ──
        if (projectile.isSawShot) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#7be8ff';
            ctx.strokeStyle = '#a8eaff';
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
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#ffd14d';
            ctx.strokeStyle = '#ffe698';
            ctx.fillStyle = 'rgba(255,209,77,0.20)';
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
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#ffd14d';
            ctx.strokeStyle = '#ffe698';
            ctx.fillStyle = 'rgba(255,209,77,0.35)';
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

        // Wraith fades out while phasing.
        const phaseAlpha = enemy.phasing ? 0.35 : 1;
        ctx.globalAlpha = phaseAlpha;

        ctx.beginPath();
        if (enemy.isBoss) {
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r * 0.7, -enemy.r * 0.2);
            ctx.lineTo(enemy.r, enemy.r * 0.2);
            ctx.lineTo(0, enemy.r);
            ctx.lineTo(-enemy.r, enemy.r * 0.2);
            ctx.lineTo(-enemy.r * 0.7, -enemy.r * 0.2);
            ctx.closePath();
        } else if (enemy.ai === 'heavy' || enemy.ai === 'crusher') {
            const r = enemy.r;
            ctx.rect(-r, -r, r * 2, r * 2);
        } else if (enemy.ai === 'strafe') {
            ctx.moveTo(0, -enemy.r);
            ctx.lineTo(enemy.r, 0);
            ctx.lineTo(0, enemy.r);
            ctx.lineTo(-enemy.r, 0);
            ctx.closePath();
        } else if (enemy.ai === 'brute') {
            // Hexagon
            const r = enemy.r;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 2;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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
                const x = Math.cos(a) * rad;
                const y = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (enemy.ai === 'healer') {
            // Plus / cross
            const r = enemy.r;
            const t = r * 0.4;
            ctx.moveTo(-t, -r);
            ctx.lineTo(t, -r);
            ctx.lineTo(t, -t);
            ctx.lineTo(r, -t);
            ctx.lineTo(r, t);
            ctx.lineTo(t, t);
            ctx.lineTo(t, r);
            ctx.lineTo(-t, r);
            ctx.lineTo(-t, t);
            ctx.lineTo(-r, t);
            ctx.lineTo(-r, -t);
            ctx.lineTo(-t, -t);
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
            // swarmling, drone fallback, etc.
            ctx.arc(0, 0, enemy.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        if (enemy.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
            ctx.fill();
        }

        // Shielder shield ring
        if (enemy.shieldHp > 0 && enemy.shieldMax > 0) {
            const pct = Math.max(0, Math.min(1, enemy.shieldHp / enemy.shieldMax));
            ctx.globalAlpha = phaseAlpha * (0.55 + 0.35 * pct);
            ctx.strokeStyle = '#7ee2ff';
            ctx.shadowColor = '#7ee2ff';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
            ctx.stroke();
            ctx.globalAlpha = phaseAlpha;
        }

        ctx.globalAlpha = 1;

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
        // Combat drone: distinct look. While respawning, render a faint countdown ring on the player.
        if (orbiter.isDrone) {
            if (!orbiter.alive) {
                // Respawn timer indicator floating above the player
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.globalAlpha = 0.55;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff8030';
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
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#7be8ff';
            ctx.strokeStyle = '#a8eaff';
            ctx.fillStyle = 'rgba(123, 232, 255, 0.20)';
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

    // ── Phoenix Aura: pulsating fire ring around the player ──
    if (player.phoenixAura && player.phoenixAuraRadius > 0) {
        const t = (performance.now() / 1000) % 1000;
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
        ctx.beginPath();
        ctx.arc(0, 0, r * wobble, 0, Math.PI * 2);
        ctx.fill();
        // Outer crackling ring
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ff7035';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
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
    // Compute damage-flash factor (0 = idle, 1 = just damaged, decays in 0.6s)
    const damageT = (typeof window.__heartDamageTime === 'number')
        ? Math.max(0, 1 - (performance.now() - window.__heartDamageTime) / 600)
        : 0;
    // Lost-heart index: which heart got depleted? Animate it shaking out
    const lostHeartIdx = (typeof window.__heartLostIdx === 'number') ? window.__heartLostIdx : -1;

    for (let i = 0; i < 3; i++) {
        ctx.save();
        // Default position
        let cx = x + i * 34;
        let cy = y;
        let scale = 1.2;
        let color = i < fullHearts ? '#ff375f' : 'rgba(255,255,255,0.12)';
        let glow = 0;

        // Lost heart: shake + fade out
        if (i === lostHeartIdx && damageT > 0) {
            cx += Math.sin(damageT * 22) * 4 * damageT;
            cy += Math.cos(damageT * 18) * 3 * damageT;
            scale = 1.2 * (1 + damageT * 0.6); // grow as it "explodes"
            color = `rgba(255, ${Math.floor(55 + damageT * 200)}, ${Math.floor(95 + damageT * 80)}, ${(1 - damageT * 0.6).toFixed(2)})`;
            glow = damageT * 18;
        }
        // Remaining hearts pulse briefly when damage hits
        else if (i < fullHearts && damageT > 0) {
            scale = 1.2 * (1 + damageT * 0.18);
            glow = damageT * 12;
        }

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        if (glow > 0) {
            ctx.shadowColor = '#ff375f';
            ctx.shadowBlur = glow;
        }
        drawHeartShape(color);
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

    // ── Extra hearts (Patch Heart) — drawn after the regular hearts ──
    if (player.extraHearts && player.extraHearts > 0) {
        drawExtraHearts(24 + 3 * 34, safeTop + 8, player.extraHearts);
    }

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

    drawBossBars(width, safeTop);
    drawFrenzyIndicator(width, safeTop);
}

// ─────────────────────────────────────────────────────────────────────────────
// Boss bars — one big top-of-screen bar per living boss. Stacked if multiple.
// ─────────────────────────────────────────────────────────────────────────────
function drawBossBars(width, safeTop) {
    const bosses = enemies.filter((e) => e && e.alive && e.isBoss);
    if (bosses.length === 0) return;

    const barW = Math.min(560, width - 80);
    const barH = 18;
    const gapY = 8;
    const startY = safeTop + 110;
    const x = (width - barW) / 2;

    bosses.forEach((boss, i) => {
        const y = startY + i * (barH + gapY + 14);
        const pct = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));

        ctx.save();
        ctx.fillStyle = 'rgba(8, 12, 26, 0.78)';
        ctx.strokeStyle = 'rgba(255, 55, 95, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(255, 55, 95, 0.55)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 9);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        const grad = ctx.createLinearGradient(x, y, x + barW, y);
        grad.addColorStop(0, '#ff8198');
        grad.addColorStop(1, '#ff375f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, Math.max(2, (barW - 4) * pct), barH - 4, 7);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.font = '700 11px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffe1e8';
        const name = boss.bossName || 'BOSS';
        ctx.fillText(name, x + 2, y - 4);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 225, 232, 0.92)';
        const hpLabel = `${formatCompactNumber(Math.max(0, Math.ceil(boss.hp)))} / ${formatCompactNumber(boss.maxHp)}`;
        ctx.fillText(hpLabel, x + barW - 2, y - 4);

        ctx.restore();
    });
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
    ctx.fillStyle = 'rgba(8, 12, 26, 0.78)';
    ctx.strokeStyle = 'rgba(255, 157, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#ff9d00';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    const fillGrad = ctx.createLinearGradient(x, y, x + w, y);
    fillGrad.addColorStop(0, '#ffe1a0');
    fillGrad.addColorStop(1, '#ff5a1c');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, Math.max(2, (w - 2) * pct), h - 2, 5);
    ctx.fill();
    ctx.font = '700 10px Orbitron';
    ctx.fillStyle = '#ffe698';
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
        ctx.shadowColor = '#ffd14d';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ffd14d';
        ctx.fillStyle = 'rgba(255, 209, 77, 0.25)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(12, 2, 12, -10, 0, -4);
        ctx.bezierCurveTo(-12, -10, -12, 2, 0, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    if (count > max) {
        ctx.save();
        ctx.font = '700 11px Orbitron';
        ctx.fillStyle = '#ffd14d';
        ctx.textAlign = 'left';
        ctx.fillText(`+${count - max}`, x + max * 30 + 4, y + 4);
        ctx.restore();
    }
}
