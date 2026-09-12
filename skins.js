// skins.js — Ship skin definitions
//
// Ship bodies are sprite-based, with a real two-state flight animation
// (not just a static PNG): a calm 6-frame IDLE loop plays while the ship is
// nearly stationary, and a 6-frame FLY loop (visible thruster flame) takes
// over once it's moving — sped up the faster the player actually flies.
// Layered on top: glow + particles (the 4 non-blue rarity tiers only),
// pulsing/spinning exactly like the shop's skin preview so in-game and shop
// look consistent. drawTrailExtra stays per-skin/procedural — a separate
// overlay on the motion trail, not the ship body itself.
//
// drawBody(ctx, r, style, rarityVfx, invulAlpha, mvx, mvy)
//   ctx  : already translated to ship centre + rotated to ship angle +
//          scaled by skin.renderScale (see render.js drawPlayer())
//   mvx  : ship-local lateral velocity,  normalised −1…+1  (+ = right)
//   mvy  : ship-local forward velocity,  normalised −1…+1  (− = forward / toward nose)
// drawTrailExtra?(ctx, trail, style)

const SKIN_SPRITE_EFFECT_IDS = ['violet_drift', 'solar_flare', 'crimson_afterburn', 'aurora_zero'];
const SKIN_ANIM_FRAME_COUNT = 6;
const SKIN_SPRITES = {};
(function preloadSkinSprites() {
    const ids = ['stock', 'ember_blade', 'violet_drift', 'solar_flare', 'crimson_afterburn', 'aurora_zero'];
    ids.forEach((id) => {
        const fileBase = id.replace(/_/g, '-');
        const loadFrames = (state) => {
            const frames = [];
            for (let i = 1; i <= SKIN_ANIM_FRAME_COUNT; i++) {
                const img = new Image();
                img.src = `icons/skin-${fileBase}-${state}-${i}.png`;
                frames.push(img);
            }
            return frames;
        };
        const entry = { idle: loadFrames('idle'), fly: loadFrames('fly') };
        if (SKIN_SPRITE_EFFECT_IDS.includes(id)) {
            entry.glow = new Image();
            entry.glow.src = `icons/skin-${fileBase}-glow.png`;
            entry.particles = new Image();
            entry.particles.src = `icons/skin-${fileBase}-particles.png`;
        }
        SKIN_SPRITES[id] = entry;
    });
})();

// Per-frame playback state for whichever skin is currently being drawn
// (only the player ship uses this, so one shared state is enough). Reset
// on skin or state change so switching skins/starting to move never shows
// a mid-loop jump.
const _shipAnim = { skinId: null, state: 'idle', frame: 0, elapsed: 0, lastT: 0 };
function _advanceShipAnimFrame(skinId, state, spd) {
    const now = _renderNow;
    if (_shipAnim.skinId !== skinId || _shipAnim.state !== state) {
        _shipAnim.skinId = skinId;
        _shipAnim.state = state;
        _shipAnim.frame = 0;
        _shipAnim.elapsed = 0;
        _shipAnim.lastT = now;
        return 0;
    }
    const dt = Math.max(0, now - _shipAnim.lastT);
    _shipAnim.lastT = now;
    _shipAnim.elapsed += dt;
    // Idle: calm fixed pace. Fly: speeds up with actual movement speed, so
    // flying faster visibly feels faster, not just a flat loop.
    const frameMs = state === 'idle' ? 200 : Math.max(55, 130 - spd * 90);
    while (_shipAnim.elapsed >= frameMs) {
        _shipAnim.elapsed -= frameMs;
        _shipAnim.frame = (_shipAnim.frame + 1) % SKIN_ANIM_FRAME_COUNT;
    }
    return _shipAnim.frame;
}

// Shared renderer for all 6 skins.
function drawSpriteBody(ctx, r, skinId, style, rv, ia, mvx = 0, mvy = 0) {
    const sprites = SKIN_SPRITES[skinId];
    if (!sprites) return;
    const spd = Math.hypot(mvx, mvy);
    const state = spd > 0.08 ? 'fly' : 'idle';
    const frameIdx = _advanceShipAnimFrame(skinId, state, spd);
    const frameImg = sprites[state] && sprites[state][frameIdx];
    if (!frameImg || !frameImg.complete || !frameImg.naturalWidth) return; // not loaded yet — skip this frame

    const size = r * 2.3, half = size / 2;
    const t = _renderNow * 0.001;
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (sprites.glow && sprites.glow.complete && sprites.glow.naturalWidth) {
        const glowAlpha = 0.775 - 0.225 * Math.cos((t / 3.4) * Math.PI * 2);
        ctx.save();
        ctx.globalAlpha = ia * glowAlpha;
        ctx.drawImage(sprites.glow, -half, -half, size, size);
        ctx.restore();
    }
    if (sprites.particles && sprites.particles.complete && sprites.particles.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = ia;
        ctx.rotate((t / 30) * Math.PI * 2);
        ctx.drawImage(sprites.particles, -half, -half, size, size);
        ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = ia;
    ctx.drawImage(frameImg, -half, -half, size, size);
    ctx.restore();

    ctx.imageSmoothingEnabled = smoothing;
}

const SKIN_DEFINITIONS = {

stock: {
    rarity:'blue', renderScale:1.086, weight:1, name:'Stock White', sigil:'STOCK', theme:'arrow',
    desc:'Clean factory frame. Neutral cyan engine signature.',
    style:{ ship:'#ffffff', core:'#6fb7c5', trail:'rgba(111,183,197,0.30)', shot:'#f5fbff', pulse:'#6fb7c5' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'stock', style, rv, ia, mvx, mvy); }
},

ember_blade: {
    rarity:'blue', renderScale:0.956, weight:34, name:'Ember Blade', sigil:'EMBER', theme:'molten',
    desc:'Hot magma plate with embers trailing the wake.',
    style:{ ship:'#cd7a4e', core:'#e0c584', trail:'rgba(205,138,96,0.55)', shot:'#e0bd85', pulse:'#d97a45' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'ember_blade', style, rv, ia, mvx, mvy); }
},

violet_drift: {
    rarity:'dark', renderScale:1.105, weight:24, name:'Violet Drift', sigil:'DRIFT', theme:'wave',
    desc:'Void wave envelope, leaves a glassy purple ribbon.',
    style:{ ship:'#b195d6', core:'#a184c9', trail:'rgba(161,132,201,0.55)', shot:'#bb9bd8', pulse:'#a184c9' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'violet_drift', style, rv, ia, mvx, mvy); }
},

solar_flare: {
    rarity:'purple', renderScale:0.942, weight:16, name:'Solar Flare', sigil:'SOLAR', theme:'corona',
    desc:'Stellar corona with heavy gold muzzle flash.',
    style:{ ship:'#e3cf9a', core:'#d6b36a', trail:'rgba(214,179,106,0.60)', shot:'#e3cf9a', pulse:'#d6b36a' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'solar_flare', style, rv, ia, mvx, mvy); }
},

crimson_afterburn: {
    rarity:'red', renderScale:1.016, weight:9, name:'Crimson Afterburn', sigil:'BURN', theme:'blade',
    desc:'Razor red blade with twin afterburn cones.',
    style:{ ship:'#d0716f', core:'#ffe1e8', trail:'rgba(208,113,111,0.65)', shot:'#d49aa4', pulse:'#d0716f' },
    exclusive:true,
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'crimson_afterburn', style, rv, ia, mvx, mvy); }
},

aurora_zero: {
    rarity:'gold', renderScale:0.808, weight:5, name:'Aurora Zero', sigil:'AUR0', theme:'aurora',
    desc:'Prismatic aurora foil. Cyan-gold rainbow pulse.',
    style:{ ship:'#fffbe8', core:'#d6b36a', trail:'rgba(151,199,214,0.7)', shot:'#fff4b0', pulse:'#97c7d6' },
    exclusive:true,
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) { drawSpriteBody(ctx, r, 'aurora_zero', style, rv, ia, mvx, mvy); },
    drawTrailExtra(ctx, trail, style) {
        const C=['#97c7d6','#fffbe8','#d6b36a','#d49aa4'];
        for(let i=0;i<trail.length-1;i+=2){
            const fade=1-(i/Math.max(1,trail.length-1));
            ctx.globalAlpha=Math.max(0.02,fade*0.32); ctx.strokeStyle=C[i%C.length];
            ctx.shadowBlur=GLOW_SCALE*(8); ctx.shadowColor=C[i%C.length]; ctx.lineWidth=2;
            const c=trail[i], n=trail[i+1];
            ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(n.x,n.y); ctx.stroke();
        }
    }
}

}; // end SKIN_DEFINITIONS
