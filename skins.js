// skins.js — Ship skin definitions
// drawBody(ctx, r, style, rarityVfx, invulAlpha, mvx, mvy)
//   ctx  : already translated to ship centre + rotated to ship angle
//   mvx  : ship-local lateral velocity,  normalised −1…+1  (+ = right)
//   mvy  : ship-local forward velocity,  normalised −1…+1  (− = forward / toward nose)
// drawTrailExtra?(ctx, trail, style)

function _shipPath(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
}
function _glowStroke(ctx, fn, color, lw, hBlur, tBlur) {
    const saved = ctx.globalAlpha;
    ctx.shadowColor=color; ctx.strokeStyle=color;
    ctx.lineWidth=lw+1.8; ctx.shadowBlur=hBlur; ctx.globalAlpha=saved*0.5;
    fn(); ctx.stroke();
    ctx.lineWidth=lw; ctx.shadowBlur=tBlur; ctx.globalAlpha=saved;
    fn(); ctx.stroke();
}
function _radFill(ctx, cx, cy, r1, colA, colB, alpha) {
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r1);
    g.addColorStop(0,colA); g.addColorStop(1,colB);
    ctx.fillStyle=g; ctx.globalAlpha=alpha; ctx.fill();
}

const SKIN_DEFINITIONS = {

// ─────────────────────────────────────────────────────
//  STOCK  —  Ghost Frame
//  Motion: engine plume extends when moving forward,
//  scanner ring spins faster, nav lights strobe faster
// ─────────────────────────────────────────────────────
stock: {
    rarity:'blue', weight:1, name:'Stock White', sigil:'STOCK', theme:'arrow',
    desc:'Clean factory frame. Neutral cyan engine signature.',
    style:{ ship:'#ffffff', core:'#00f2ff', trail:'rgba(0,242,255,0.30)', shot:'#f5fbff', pulse:'#00f2ff' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/34, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const fwd=Math.max(0,-mvy);   // 0..1, positive when moving toward nose
        const pts=[[0,-34*sc],[20*sc,30*sc],[0,20*sc],[-20*sc,30*sc]];

        // Rotating hex scanner ring — spins faster when moving
        ctx.save();
        const hexSpeed=0.35+spd*0.9;
        ctx.strokeStyle=style.pulse; ctx.lineWidth=0.8; ctx.globalAlpha=ia*(0.28+spd*0.18);
        ctx.shadowBlur=10; ctx.shadowColor=style.pulse; ctx.setLineDash([4,3]);
        ctx.beginPath();
        for(let i=0;i<6;i++){
            const a=(t*hexSpeed)+(i/6)*Math.PI*2;
            i===0 ? ctx.moveTo(Math.cos(a)*40*sc, Math.sin(a)*40*sc)
                  : ctx.lineTo(Math.cos(a)*40*sc, Math.sin(a)*40*sc);
        }
        ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

        // Sweep-scan line — faster + brighter when moving
        ctx.save();
        const scanA=(t*(1.1+spd*1.4))%(Math.PI*2);
        ctx.globalAlpha=ia*(0.14+spd*0.14); ctx.strokeStyle=style.core; ctx.lineWidth=1.2;
        ctx.shadowBlur=14; ctx.shadowColor=style.core;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(scanA)*42*sc, Math.sin(scanA)*42*sc); ctx.stroke();
        ctx.restore();

        // Dashed orbit ring — slowly rotating
        ctx.save(); ctx.strokeStyle=style.pulse; ctx.lineWidth=0.6; ctx.globalAlpha=ia*0.28;
        ctx.setLineDash([2,3]); ctx.rotate(t*0.22);
        ctx.beginPath(); ctx.arc(0,-2*sc,37*sc,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();

        // Hull fill + glow
        ctx.save(); _shipPath(ctx,pts);
        _radFill(ctx,0,-10*sc,36*sc,'rgba(200,255,255,0.55)','rgba(0,180,255,0.04)',ia); ctx.restore();
        ctx.save(); ctx.globalAlpha=ia;
        _glowStroke(ctx,()=>_shipPath(ctx,pts),style.core,1.6,22,8);
        ctx.shadowBlur=4; ctx.shadowColor='#fff'; ctx.strokeStyle='rgba(255,255,255,0.85)';
        ctx.lineWidth=0.9; _shipPath(ctx,pts); ctx.stroke(); ctx.restore();

        // Panel lines — spine sways, cross-bars slide laterally
        ctx.save(); ctx.strokeStyle='rgba(0,242,255,0.45)'; ctx.lineWidth=0.6;
        ctx.shadowBlur=4; ctx.shadowColor=style.core; ctx.globalAlpha=ia*0.7; ctx.lineCap='round';
        const sw=Math.sin(t*1.6)*1.8*sc; // sway
        ctx.beginPath(); ctx.moveTo(0,-28*sc);
        ctx.quadraticCurveTo(sw,-6*sc,0,18*sc); ctx.stroke();
        const slide=Math.sin(t*2.2)*2*sc;
        ctx.beginPath(); ctx.moveTo((-10+slide)*sc,-4*sc); ctx.lineTo((10+slide)*sc,-4*sc); ctx.stroke();
        ctx.beginPath(); ctx.moveTo((-6-slide)*sc,8*sc); ctx.lineTo((6-slide)*sc,8*sc); ctx.stroke();
        ctx.restore();

        // Wing-tip nav lights — blink faster when moving
        ctx.save();
        const blinkRate=4+spd*6;
        [[-20*sc,22*sc,'#ff4466'],[20*sc,22*sc,'#44ff88']].forEach(([wx,wy,col],i)=>{
            const blink=0.5+Math.sin(t*blinkRate+i*Math.PI)*0.5;
            ctx.globalAlpha=ia*blink*(0.8+spd*0.2); ctx.fillStyle=col;
            ctx.shadowBlur=9+spd*6; ctx.shadowColor=col;
            ctx.beginPath(); ctx.arc(wx,wy,2.2,0,Math.PI*2); ctx.fill();
        }); ctx.restore();

        // Engine exhaust plume — longer + brighter when moving forward
        ctx.save();
        const ep=0.7+Math.sin(t*7)*0.2+fwd*0.6;
        const eg=ctx.createLinearGradient(0,20*sc,0,(42+fwd*18)*sc);
        eg.addColorStop(0,style.core); eg.addColorStop(0.5,'rgba(0,200,255,0.45)'); eg.addColorStop(1,'rgba(0,180,255,0)');
        ctx.fillStyle=eg; ctx.shadowBlur=14+fwd*10; ctx.shadowColor=style.core;
        ctx.globalAlpha=ia*(0.75+fwd*0.2)*ep;
        const pw=(6+fwd*4)*sc;
        ctx.beginPath(); ctx.moveTo(-pw,20*sc); ctx.lineTo(0,(42+fwd*18)*sc*ep); ctx.lineTo(pw,20*sc); ctx.closePath(); ctx.fill();
        ctx.restore();

        // Motion-burst sparks along sides when moving fast
        if(spd>0.3){
            ctx.save();
            [[-20*sc,8*sc],[20*sc,8*sc]].forEach(([sx,sy],i)=>{
                ctx.globalAlpha=ia*(spd-0.3)*0.8;
                ctx.fillStyle=style.core; ctx.shadowBlur=8; ctx.shadowColor=style.core;
                ctx.beginPath(); ctx.arc(sx+mvx*4*sc, sy-mvy*3*sc, 1.5+spd,0,Math.PI*2); ctx.fill();
            }); ctx.restore();
        }

        // Core glow orb
        ctx.save(); ctx.shadowBlur=18; ctx.shadowColor=style.core; ctx.globalAlpha=ia;
        const cg=ctx.createRadialGradient(0,-2*sc,0,0,-2*sc,7*sc);
        cg.addColorStop(0,'#fff'); cg.addColorStop(0.5,style.core); cg.addColorStop(1,'rgba(0,200,255,0)');
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,-2*sc,7*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // Engine bar
        ctx.save(); ctx.shadowBlur=8; ctx.shadowColor=style.trail; ctx.strokeStyle=style.trail;
        ctx.lineWidth=2.5+fwd*1.5; ctx.lineCap='round'; ctx.globalAlpha=ia*(0.7+fwd*0.2);
        ctx.beginPath(); ctx.moveTo(-12*sc,26*sc); ctx.lineTo(12*sc,26*sc); ctx.stroke(); ctx.restore();
    }
},

// ─────────────────────────────────────────────────────
//  EMBER BLADE  —  Volcanic Forge
//  Motion: flames stretch forward, embers scatter wider,
//  lava drips elongate, cracks pulse harder at speed
// ─────────────────────────────────────────────────────
ember_blade: {
    rarity:'blue', weight:34, name:'Ember Blade', sigil:'EMBER', theme:'molten',
    desc:'Hot magma plate with embers trailing the wake.',
    style:{ ship:'#ff8030', core:'#ffe168', trail:'rgba(255,120,30,0.55)', shot:'#ffd27d', pulse:'#ff7020' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/36, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const fwd=Math.max(0,-mvy);
        const pts=[[0,-36*sc],[22*sc,26*sc],[0,18*sc],[-22*sc,26*sc]];

        // 4-layer flame stack — extends when moving forward
        ctx.save();
        const flameBoost=1+fwd*0.55;
        [[20,54,style.pulse,0.32,18],[14,46,style.pulse,0.55,14],[9,40,style.core,0.75,10],[5,33,'#fffbe8',0.9,6]].forEach(([hw,h,col,a,blur])=>{
            const fi=(0.85+Math.sin(t*5+hw)*0.15)*flameBoost;
            ctx.fillStyle=col; ctx.shadowBlur=blur+(fwd*6); ctx.shadowColor=col; ctx.globalAlpha=ia*a*Math.min(1.0,fi);
            ctx.beginPath(); ctx.moveTo(-hw*sc,20*sc); ctx.lineTo(0,h*sc*fi); ctx.lineTo(hw*sc,20*sc); ctx.closePath(); ctx.fill();
        }); ctx.restore();

        // Lava drips from wing tips — longer when moving, sway side to side
        ctx.save(); ctx.lineCap='round';
        [-22,22].forEach((wx,si)=>{
            const dy=Math.sin(t*2.5+si)*6;
            const dripLen=(40+fwd*14+dy);
            const sway=Math.sin(t*1.8+si*1.7)*4*sc; // lateral sway
            const cx=wx*sc+sway*0.5, cy=(26+dripLen)*0.5*sc; // control point midway
            const dg=ctx.createLinearGradient(wx*sc,26*sc,wx*sc+sway,dripLen*sc);
            dg.addColorStop(0,style.pulse); dg.addColorStop(1,'rgba(255,80,0,0)');
            ctx.strokeStyle=dg; ctx.lineWidth=2.2+fwd*1.2;
            ctx.shadowBlur=8+fwd*6; ctx.shadowColor=style.pulse; ctx.globalAlpha=ia*(0.7+fwd*0.2);
            ctx.beginPath(); ctx.moveTo(wx*sc,26*sc);
            ctx.quadraticCurveTo(cx, cy, wx*sc+sway, dripLen*sc); ctx.stroke();
            ctx.fillStyle=style.core; ctx.shadowBlur=6; ctx.globalAlpha=ia*0.9;
            ctx.beginPath(); ctx.arc(wx*sc+sway,dripLen*sc,2.2+fwd,0,Math.PI*2); ctx.fill();
        }); ctx.restore();

        // Hull fill + glow
        ctx.save(); _shipPath(ctx,pts);
        _radFill(ctx,0,-20*sc,40*sc,'rgba(255,220,80,0.6)','rgba(180,40,0,0.1)',ia); ctx.restore();
        ctx.save(); ctx.globalAlpha=ia;
        _glowStroke(ctx,()=>_shipPath(ctx,pts),style.core,1.8,26+spd*8,9); ctx.restore();

        // Glowing crack network — vertices wobble, pulses harder at speed
        ctx.save(); ctx.lineCap='round'; ctx.shadowColor=style.core; ctx.shadowBlur=6+spd*8;
        [
            [[-2,-24],[2,-14],[-4,-4],[0,8]],
            [[4,-18],[1,-6],[4,4]],
            [[-5,-10],[-8,0],[-6,10]],
            [[5,-8],[8,2],[6,10]]
        ].forEach((crack,ci)=>{
            const pulse=0.4+Math.sin(t*3+crack[0][0])*0.25+spd*0.3;
            ctx.globalAlpha=ia*Math.min(0.9,0.5+pulse*0.3); ctx.strokeStyle=style.core; ctx.lineWidth=0.8+spd*0.5;
            ctx.beginPath(); ctx.moveTo(crack[0][0]*sc,crack[0][1]*sc);
            for(let i=1;i<crack.length;i++){
                // each interior vertex jiggles slightly on its own frequency
                const jx=Math.sin(t*2.8+ci*1.7+i*0.9)*1.1*sc;
                const jy=Math.cos(t*2.3+ci*2.1+i*1.3)*0.7*sc;
                ctx.lineTo(crack[i][0]*sc+jx, crack[i][1]*sc+jy);
            }
            ctx.stroke();
        }); ctx.restore();

        // Spine shimmer
        ctx.save();
        const cg2=0.55+Math.sin(t*3.5)*0.25;
        ctx.strokeStyle='#fff5aa'; ctx.lineCap='round'; ctx.shadowColor=style.core;
        ctx.shadowBlur=8+cg2*5; ctx.lineWidth=1.2; ctx.globalAlpha=ia*(0.6+cg2*0.25);
        ctx.beginPath(); ctx.moveTo(-3*sc,-26*sc); ctx.lineTo(1*sc,-8*sc); ctx.lineTo(-4*sc,4*sc); ctx.lineTo(0,14*sc); ctx.stroke();
        ctx.restore();

        // Core glow
        ctx.save(); ctx.shadowBlur=16+spd*8; ctx.shadowColor=style.core; ctx.globalAlpha=ia;
        const og=ctx.createRadialGradient(0,-4*sc,0,0,-4*sc,(8+spd*3)*sc);
        og.addColorStop(0,'#fff'); og.addColorStop(0.4,style.core); og.addColorStop(1,'rgba(255,80,0,0)');
        ctx.fillStyle=og; ctx.beginPath(); ctx.arc(0,-4*sc,(8+spd*3)*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // 8 floating embers — scatter wider when moving fast
        ctx.save();
        const scatter=1+spd*1.8;
        [[-26,-10],[24,-6],[-30,8],[28,10],[-18,4],[20,0],[-14,-18],[16,-14]].forEach(([ex,ey],i)=>{
            const bx=Math.sin(t*2.2+i*1.5)*3*scatter + mvx*4;
            const by=Math.cos(t*1.8+i*2.1)*4*scatter - mvy*3;
            ctx.globalAlpha=ia*(0.45+Math.sin(t*3+i)*0.35);
            ctx.fillStyle=i%3===0?'#fffbe8':i%3===1?style.core:style.pulse;
            ctx.shadowBlur=5+spd*5; ctx.shadowColor=style.core;
            ctx.beginPath(); ctx.arc((ex+bx)*sc,(ey+by)*sc,1.4+i%2*0.6+spd*0.8,0,Math.PI*2); ctx.fill();
        }); ctx.restore();
    }
},

// ─────────────────────────────────────────────────────
//  VIOLET DRIFT  —  Void Phantom
//  Motion: ghost wings fan out asymmetrically when
//  turning, lightning arc intensity tracks speed,
//  void particles orbit wider at speed
// ─────────────────────────────────────────────────────
violet_drift: {
    rarity:'dark', weight:24, name:'Violet Drift', sigil:'DRIFT', theme:'wave',
    desc:'Void wave envelope, leaves a glassy purple ribbon.',
    style:{ ship:'#c890ff', core:'#bc13fe', trail:'rgba(188,19,254,0.55)', shot:'#d78fff', pulse:'#bc13fe' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/36, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const fwd=Math.max(0,-mvy);
        const pts=[[0,-36*sc],[26*sc,28*sc],[0,16*sc],[-26*sc,28*sc]];

        // 4 ghost wing layers — spread asymmetrically when turning
        // The side you're moving AWAY from spreads more (trailing wing)
        ctx.save(); ctx.lineCap='round';
        [-1,1].forEach(sign=>{
            // If sign=+1 (right wing) and mvx<0 (moving left), right wing is trailing → spread more
            const trail_factor = 1 + Math.max(0, -sign*mvx)*0.9 + fwd*0.4;
            [[36,10,0.6],[44,8,0.45],[52,6,0.28],[62,4,0.15]].forEach(([dist,h,a],li)=>{
                const wave=Math.sin(t*1.5+li*0.8)*4;
                ctx.globalAlpha=ia*a*Math.min(1,trail_factor-li*0.05);
                ctx.strokeStyle=style.trail;
                ctx.lineWidth=(1.8-li*0.35)*trail_factor;
                ctx.shadowBlur=9-li*2+spd*4; ctx.shadowColor=style.pulse;
                ctx.beginPath(); ctx.moveTo(0,8*sc);
                ctx.quadraticCurveTo(sign*(dist*0.5*trail_factor)*sc,(h+wave)*sc, sign*(dist*trail_factor)*sc,(h*2+wave)*sc);
                ctx.stroke();
            });
        }); ctx.restore();

        // 5 concentric void rings — alternating rings counter-rotate, radius breathes
        ctx.save();
        [[24,0.9,0.50],[30,0.7,0.38],[36,0.5,0.27],[42,0.35,0.18],[50,0.2,0.10]].forEach(([rad,lw,ba],ri)=>{
            const pulse=0.5+Math.sin(t*1.8-ri*0.5)*0.35+spd*0.2;
            const breath=1+Math.sin(t*1.1+ri*0.6)*0.025; // subtle radius breathe
            const rotDir=ri%2===0?1:-1;
            ctx.save();
            ctx.rotate(t*(0.08+ri*0.04)*rotDir); // slow ring rotation
            ctx.strokeStyle=style.pulse; ctx.lineWidth=lw+spd*0.3;
            ctx.shadowBlur=ri===0?12+spd*6:4; ctx.shadowColor=style.pulse;
            ctx.globalAlpha=ia*ba*pulse; ctx.setLineDash(ri%2===0?[]:[3,4]);
            ctx.beginPath(); ctx.arc(0,0,rad*breath*sc,0,Math.PI*2); ctx.stroke();
            ctx.setLineDash([]); ctx.restore();
        }); ctx.restore();

        // Hull fill + glow
        ctx.save(); _shipPath(ctx,pts);
        _radFill(ctx,0,-14*sc,40*sc,'rgba(190,100,255,0.5)','rgba(80,0,160,0.06)',ia); ctx.restore();
        ctx.save(); ctx.globalAlpha=ia;
        _glowStroke(ctx,()=>_shipPath(ctx,pts),style.core,1.7,28+spd*8,10); ctx.restore();

        // Twin nose lightning arcs — brighter + more jagged when fast
        ctx.save(); ctx.lineCap='round';
        const lightIntensity=0.4+Math.abs(Math.sin(t*4.5))*0.4+spd*0.4;
        ctx.globalAlpha=ia*lightIntensity;
        ctx.strokeStyle='#e8aaff'; ctx.lineWidth=1.1+spd*0.6;
        ctx.shadowBlur=12+spd*10; ctx.shadowColor=style.core;
        [-1,1].forEach(sign=>{
            const jag=spd*4;
            ctx.beginPath(); ctx.moveTo(0,-34*sc);
            ctx.lineTo(sign*(6+jag)*sc,-22*sc); ctx.lineTo(sign*2*sc,-14*sc);
            ctx.lineTo(sign*(9+jag)*sc,-4*sc); ctx.stroke();
        }); ctx.restore();

        // Inner void phase — vertices morph with slow sine displacement
        ctx.save();
        const ip=0.28+Math.abs(Math.sin(t*1.8))*0.2+spd*0.15;
        ctx.fillStyle=style.pulse; ctx.shadowBlur=10+spd*8; ctx.shadowColor=style.pulse; ctx.globalAlpha=ia*Math.min(0.7,ip);
        const vm=[
            [0+Math.sin(t*1.3)*2, -22+Math.cos(t*1.1)*2],
            [14+Math.sin(t*1.7+1)*2.5,  18+Math.cos(t*1.5+1)*1.5],
            [0+Math.sin(t*2.1+2)*1.5,    8+Math.cos(t*1.9+2)*2],
            [-14+Math.sin(t*1.4+3)*2.5, 18+Math.cos(t*1.6+3)*1.5]
        ];
        ctx.beginPath(); ctx.moveTo(vm[0][0]*sc,vm[0][1]*sc);
        vm.slice(1).forEach(([vx,vy])=>ctx.lineTo(vx*sc,vy*sc));
        ctx.closePath(); ctx.fill(); ctx.restore();

        // Core glow
        ctx.save(); ctx.shadowBlur=20+spd*8; ctx.shadowColor=style.core; ctx.globalAlpha=ia;
        const vg=ctx.createRadialGradient(0,-6*sc,0,0,-6*sc,(9+spd*3)*sc);
        vg.addColorStop(0,'#fff'); vg.addColorStop(0.4,style.core); vg.addColorStop(1,'rgba(140,0,200,0)');
        ctx.fillStyle=vg; ctx.beginPath(); ctx.arc(0,-6*sc,(9+spd*3)*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // 8 orbiting void particles — drift outward at speed
        ctx.save();
        const vColors=['#d78fff','#bc13fe','#e8aaff','#8800cc','#fff','#ff80ff','#aa44ff','#7700bb'];
        vColors.forEach((col,i)=>{
            const a=t*(0.8+i*0.15)+i*(Math.PI/4);
            const rad=(r+5+i%3*5)*(1+spd*0.3);
            ctx.globalAlpha=ia*(0.5+Math.sin(t*2.5+i)*0.35);
            ctx.fillStyle=col; ctx.shadowBlur=6+spd*4; ctx.shadowColor=col;
            ctx.beginPath(); ctx.arc(Math.cos(a)*rad,Math.sin(a)*rad,1.6+i%2*0.6+spd*0.5,0,Math.PI*2); ctx.fill();
        }); ctx.restore();

        // Void spark nodes — flicker faster when moving
        ctx.save();
        const sparkRate=2.5+spd*4;
        [[-28,-14],[26,-8],[-32,6],[30,10],[-24,20],[24,18]].forEach(([dx,dy],i)=>{
            ctx.globalAlpha=ia*(0.38+Math.sin(t*sparkRate+i)*0.28);
            ctx.fillStyle=i%2===0?'#fff':'#d78fff'; ctx.shadowBlur=3+spd*4;
            ctx.beginPath(); ctx.arc(dx*sc,dy*sc,1.1+spd*0.5,0,Math.PI*2); ctx.fill();
        }); ctx.restore();
    }
},

// ─────────────────────────────────────────────────────
//  SOLAR FLARE  —  Crown of Stars
//  Motion: corona spikes lean back when moving forward,
//  debris orbit accelerates with speed,
//  prominence arcs get bigger
// ─────────────────────────────────────────────────────
solar_flare: {
    rarity:'purple', weight:16, name:'Solar Flare', sigil:'SOLAR', theme:'corona',
    desc:'Stellar corona with heavy gold muzzle flash.',
    style:{ ship:'#ffe698', core:'#ffd14d', trail:'rgba(255,209,77,0.60)', shot:'#ffe698', pulse:'#ffd14d' },
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/38, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const fwd=Math.max(0,-mvy);
        // Debris/spin speed increases with player speed
        const spinS=t*0.4, spinF=t*(1.1+spd*1.4);

        // 24 corona spikes — lean back (longer in +y) when moving forward
        ctx.save(); ctx.shadowColor=style.core; ctx.lineCap='round';
        for(let i=0;i<24;i++){
            const a=spinS+(i/24)*Math.PI*2;
            const tier=i%3;
            // Spikes at ~+y direction (tail) get extended when moving forward
            const leanBoost=1+fwd*0.5*Math.max(0,Math.sin(a)); // more extension on back-facing spikes
            const outR=([46,36,28][tier]+fwd*8*Math.max(0,Math.sin(a)))*sc;
            const inR=[20,22,24][tier]*sc;
            const lw=[2.2,1.4,0.9][tier]; const ga=[0.95,0.7,0.5][tier];
            const flicker=0.85+Math.sin(t*4+i*0.8)*0.15;
            ctx.shadowBlur=[14,7,3][tier]+spd*3;
            ctx.strokeStyle=tier===0?style.core:tier===1?style.ship:'rgba(255,230,150,0.8)';
            ctx.lineWidth=lw+spd*0.3; ctx.globalAlpha=ia*ga*flicker;
            ctx.beginPath(); ctx.moveTo(Math.cos(a)*inR,Math.sin(a)*inR);
            ctx.lineTo(Math.cos(a)*outR,Math.sin(a)*outR); ctx.stroke();
        } ctx.restore();

        // 3 solar prominence arcs — bigger when moving
        ctx.save(); ctx.strokeStyle='#ff9900'; ctx.lineWidth=1.8+spd*1.0; ctx.lineCap='round';
        ctx.shadowBlur=12+spd*8; ctx.shadowColor='#ff9900';
        [[0,1.2],[Math.PI*2/3,0.9],[Math.PI*4/3,1.1]].forEach(([baseA,scale],pi)=>{
            const a=baseA+spinS*0.5;
            const arcScale=scale*(1+fwd*0.4);
            const bx=Math.cos(a)*26*sc, by=Math.sin(a)*26*sc;
            const cpx=Math.cos(a+0.8)*38*sc*arcScale, cpy=Math.sin(a+0.8)*38*sc*arcScale;
            const ex=Math.cos(a+1.4)*22*sc, ey=Math.sin(a+1.4)*22*sc;
            ctx.globalAlpha=ia*(0.5+Math.abs(Math.sin(t*2+pi))*0.45+spd*0.2);
            ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo(cpx,cpy,ex,ey); ctx.stroke();
        }); ctx.restore();

        // Dashed inner ring — slowly rotates
        ctx.save(); ctx.strokeStyle=style.core; ctx.lineWidth=0.9;
        ctx.globalAlpha=ia*(0.28+Math.abs(Math.sin(t*1.5))*0.2);
        ctx.setLineDash([3,3]); ctx.shadowBlur=12; ctx.shadowColor=style.core;
        ctx.rotate(t*0.18);
        ctx.beginPath(); ctx.arc(0,0,34*sc,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();

        // Solar body gradient
        ctx.save(); ctx.shadowBlur=20+spd*8; ctx.shadowColor=style.core; ctx.globalAlpha=ia;
        const sg=ctx.createRadialGradient(0,0,0,0,0,22*sc);
        sg.addColorStop(0,'#fff'); sg.addColorStop(0.35,style.core);
        sg.addColorStop(0.75,'#ff9900'); sg.addColorStop(1,style.pulse);
        ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(0,0,22*sc,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=style.core; ctx.lineWidth=1.4; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(0,0,22*sc,0,Math.PI*2); ctx.stroke(); ctx.restore();

        // 4 sunspots — slowly drift in small orbits
        ctx.save();
        [[-6,-4,3,0.28],[6,4,2.4,0.21],[2,-8,1.6,0.35],[-3,7,2.0,0.18]].forEach(([sx,sy,sr,spd2],i)=>{
            const ox=Math.cos(t*spd2+i*1.6)*2.5, oy=Math.sin(t*spd2*0.8+i*2.1)*2;
            ctx.globalAlpha=ia*0.48; ctx.fillStyle='#b07000'; ctx.shadowBlur=0;
            ctx.beginPath(); ctx.arc((sx+ox)*sc,(sy+oy)*sc,sr*sc,0,Math.PI*2); ctx.fill();
        }); ctx.restore();

        // Inner hot-spot
        ctx.save(); ctx.globalAlpha=ia; ctx.shadowBlur=0;
        ctx.fillStyle='#fff8c0'; ctx.beginPath(); ctx.arc(0,0,8*sc,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff';    ctx.beginPath(); ctx.arc(0,0,3.5*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // 6 orbiting debris — faster orbit + wider at speed
        ctx.save();
        for(let i=0;i<6;i++){
            const a=spinF+i*(Math.PI/3);
            const dRad=(28+i%3*4+spd*6)*sc;
            const tw=0.6+Math.sin(t*4+i*1.2)*0.3;
            ctx.globalAlpha=ia*tw; ctx.fillStyle=i%2===0?style.ship:style.core;
            ctx.shadowBlur=8+spd*4; ctx.shadowColor=style.core;
            ctx.beginPath(); ctx.arc(Math.cos(a)*dRad,Math.sin(a)*dRad,i%2===0?2.0:1.4,0,Math.PI*2); ctx.fill();
        } ctx.restore();

        // Gold dust
        ctx.save();
        for(let i=0;i<10;i++){
            const a=t*0.6+i*(Math.PI/5), rad=(34+i%5*2+spd*4)*sc;
            ctx.globalAlpha=ia*(0.3+Math.sin(t*3.5+i)*0.2);
            ctx.fillStyle='rgba(255,230,130,0.85)'; ctx.shadowBlur=2;
            ctx.beginPath(); ctx.arc(Math.cos(a)*rad,Math.sin(a)*rad,0.9,0,Math.PI*2); ctx.fill();
        } ctx.restore();
    }
},

// ─────────────────────────────────────────────────────
//  CRIMSON AFTERBURN  —  Speed Demon
//  Motion: afterburner cones grow dramatically with
//  forward speed, speed streaks light up, shockwave
//  arcs pulse stronger, pulse ring expands at speed
// ─────────────────────────────────────────────────────
crimson_afterburn: {
    rarity:'red', weight:9, name:'Crimson Afterburn', sigil:'BURN', theme:'blade',
    desc:'Razor red blade with twin afterburn cones.',
    style:{ ship:'#ff375f', core:'#ffe1e8', trail:'rgba(255,55,95,0.65)', shot:'#ff8ba2', pulse:'#ff375f' },
    exclusive:true,
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/40, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const fwd=Math.max(0,-mvy);
        const fl=1.0+Math.sin(t*8)*0.18+fwd*0.55; // flame length factor
        const pts=[[0,-40*sc],[12*sc,26*sc],[0,18*sc],[-12*sc,26*sc]];

        // Speed streak lines — opacity + length tied to speed
        ctx.save(); ctx.lineCap='round';
        for(let i=0;i<8;i++){
            const sx=(i-3.5)*8*sc, sy=28*sc;
            const len=(16+i%3*12+spd*24)*sc;
            const sa=(0.1+spd*0.55)*Math.max(0,0.5+Math.sin(t*7+i)*0.5);
            ctx.strokeStyle=i%2===0?style.pulse:'rgba(255,200,210,0.55)';
            ctx.lineWidth=0.7+i%2*0.4+spd*0.5; ctx.shadowBlur=4+spd*6; ctx.shadowColor=style.pulse;
            ctx.globalAlpha=ia*sa;
            ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy+len); ctx.stroke();
        } ctx.restore();

        // Twin afterburner cones — 3 layers, scale with forward speed
        ctx.save();
        [-1,1].forEach(sign=>{
            [[22,52,style.pulse,0.32,18],[14,44,style.pulse,0.58,12],[8,38,'#fffbe8',0.88,8]].forEach(([hw,h,col,a,blur])=>{
                const fi=(0.85+Math.sin(t*6+sign*0.5+hw)*0.15)*fl;
                ctx.fillStyle=col; ctx.shadowBlur=blur+fwd*12; ctx.shadowColor=col; ctx.globalAlpha=ia*Math.min(0.95,a*fi*0.9);
                ctx.beginPath();
                ctx.moveTo(sign*hw*sc,20*sc); ctx.lineTo(sign*(hw+8)*sc,h*sc*fl); ctx.lineTo(sign*2*sc,32*sc);
                ctx.closePath(); ctx.fill();
            });
        });
        // Center afterglow cone
        const cf=ctx.createLinearGradient(0,26*sc,0,(50+fwd*18)*sc*fl);
        cf.addColorStop(0,style.core); cf.addColorStop(1,'rgba(255,40,80,0)');
        ctx.fillStyle=cf; ctx.globalAlpha=ia*(0.65+fwd*0.25);
        ctx.beginPath(); ctx.moveTo(-4*sc,28*sc); ctx.lineTo(0,(50+fwd*18)*sc*fl); ctx.lineTo(4*sc,28*sc); ctx.closePath(); ctx.fill();
        ctx.restore();

        // Energy wing canards — tip flexes up/down like flapping
        ctx.save(); ctx.shadowBlur=10+spd*6; ctx.shadowColor=style.pulse;
        [-1,1].forEach(sign=>{
            const flex=Math.sin(t*3.5+sign*0.8)*3*sc; // tip flex
            [[0.85,1.0],[0.5,0.6]].forEach(([ga,scale])=>{
                ctx.fillStyle=style.pulse; ctx.globalAlpha=ia*ga;
                ctx.beginPath();
                ctx.moveTo(-12*sign*sc, 26*sc);
                ctx.lineTo(-20*sign*sc*scale, 14*sc + flex*scale);
                ctx.lineTo(-14*sign*sc*scale, 22*sc + flex*scale*0.5);
                ctx.closePath(); ctx.fill();
            });
        }); ctx.restore();

        // Hull fill + glow
        ctx.save(); _shipPath(ctx,pts);
        const bg=ctx.createLinearGradient(0,-40*sc,0,26*sc);
        bg.addColorStop(0,'rgba(255,255,255,0.75)'); bg.addColorStop(0.3,style.ship); bg.addColorStop(1,'rgba(160,0,30,0.3)');
        ctx.fillStyle=bg; ctx.globalAlpha=ia*0.45; ctx.fill(); ctx.restore();
        ctx.save(); ctx.globalAlpha=ia;
        _glowStroke(ctx,()=>_shipPath(ctx,pts),style.core,1.6,30+spd*8,10); ctx.restore();

        // Spine line — subtle S-curve wave
        ctx.save(); ctx.strokeStyle=style.core; ctx.lineWidth=1+spd*0.5;
        ctx.shadowBlur=12+spd*6; ctx.shadowColor=style.core; ctx.lineCap='round'; ctx.globalAlpha=ia*0.75;
        const sw2=Math.sin(t*2.5)*2.5*sc;
        ctx.beginPath(); ctx.moveTo(0,-38*sc);
        ctx.bezierCurveTo(sw2,-20*sc, -sw2,-2*sc, 0,16*sc); ctx.stroke(); ctx.restore();

        // 2 shockwave arcs — more visible + further out at speed
        ctx.save(); ctx.strokeStyle=style.pulse; ctx.lineCap='round';
        [14,22].forEach((arcR,si)=>{
            const pulse=0.3+Math.abs(Math.sin(t*3+si))*0.4+spd*0.4;
            ctx.lineWidth=1.2-si*0.3+spd*0.5; ctx.shadowBlur=8+spd*6; ctx.shadowColor=style.pulse;
            ctx.globalAlpha=ia*Math.min(0.85,pulse*0.65);
            const expandedR=(arcR+spd*10)*sc;
            ctx.beginPath(); ctx.arc(0,32*sc,expandedR,Math.PI*0.08,Math.PI*0.92); ctx.stroke();
        }); ctx.restore();

        // Core glow
        ctx.save(); ctx.shadowBlur=18+spd*8; ctx.shadowColor=style.core; ctx.globalAlpha=ia;
        const cg=ctx.createRadialGradient(0,0,0,0,0,(7+spd*3)*sc);
        cg.addColorStop(0,'#fff'); cg.addColorStop(0.4,style.core); cg.addColorStop(1,'rgba(255,55,95,0)');
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,(7+spd*3)*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // 6 heat particles + expanding pulse ring at speed
        ctx.save();
        const ot=t*2.8;
        for(let i=0;i<6;i++){
            const a=ot+i*(Math.PI/3), tw=0.5+Math.sin(t*5+i*1.7)*0.4;
            ctx.globalAlpha=ia*tw;
            ctx.fillStyle=i%3===0?style.core:i%3===1?style.pulse:'rgba(255,200,200,0.8)';
            ctx.shadowBlur=8+spd*4; ctx.shadowColor=style.pulse;
            const pr=(r+9+spd*8);
            ctx.beginPath(); ctx.arc(Math.cos(a)*pr,Math.sin(a)*pr,1.8+spd*0.8,0,Math.PI*2); ctx.fill();
        }
        const rp=0.35+Math.abs(Math.sin(t*2.4))*0.4+spd*0.3;
        ctx.globalAlpha=ia*Math.min(0.7,rp*0.55); ctx.strokeStyle=style.pulse; ctx.lineWidth=1.2+spd*1.0;
        ctx.shadowBlur=10+spd*8; ctx.shadowColor=style.pulse;
        ctx.beginPath(); ctx.arc(0,0,(r+16+spd*12)+Math.sin(t*3)*3,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }
},

// ─────────────────────────────────────────────────────
//  AURORA ZERO  —  Prismatic Light Show
//  Motion: INERTIA DRIFT — all orbiting/floating
//  elements lag behind the ship's movement.
//  driftX = −mvx * lag,  driftY = −mvy * lag
//  Prism fragments drift most, stars drift medium,
//  rings barely. Aurora ribbons extend in wake direction.
// ─────────────────────────────────────────────────────
aurora_zero: {
    rarity:'gold', weight:5, name:'Aurora Zero', sigil:'AUR0', theme:'aurora',
    desc:'Prismatic aurora foil. Cyan-gold rainbow pulse.',
    style:{ ship:'#fffbe8', core:'#ffd14d', trail:'rgba(123,232,255,0.7)', shot:'#fff4b0', pulse:'#7be8ff' },
    exclusive:true,
    drawBody(ctx, r, style, rv, ia, mvx=0, mvy=0) {
        const sc=r/38, t=_renderNow * 0.001;
        const spd=Math.hypot(mvx,mvy);
        const ROW=['#7be8ff','#fffbe8','#ffd14d','#ff8ba2','#bc13fe'];
        const pts=[[0,-38*sc],[24*sc,30*sc],[0,18*sc],[-24*sc,30*sc]];
        const makeRG=(x0,y0,x1,y1)=>{
            const g=ctx.createLinearGradient(x0,y0,x1,y1);
            ROW.forEach((c,i)=>g.addColorStop(i/(ROW.length-1),c));
            return g;
        };

        // Inertia drift offsets (elements lag behind the moving ship)
        // Negative because if ship moves right (+mvx), elements appear to drift LEFT (−)
        const driftFrag = 14; // prism fragments — maximum drift
        const driftStar = 20; // constellation stars — most drift (lightweight)
        const driftOrb  = 8;  // orbiting orbs — medium
        const driftRing = 3;  // rings — barely drift (heavy)
        const dx = -mvx; // +mvx → drift left in ship space
        const dy = -mvy; // −mvy (forward) → drift toward tail (+y)

        // 5 aurora ribbon bands — longer in the wake direction (opposite to movement)
        ctx.save(); ctx.lineCap='round';
        [[-8,0.70,3.0],[ 4,0.52,2.0],[-4,0.38,1.4],[12,0.26,1.0],[-12,0.16,0.7]].forEach(([yoff,a,lw],ri)=>{
            // Ribbons behind the ship stretch when moving forward
            const wakeY=(40+yoff + Math.max(0,-mvy)*16)*sc;
            ctx.strokeStyle=makeRG(-52*sc,0,52*sc,0); ctx.lineWidth=lw;
            ctx.shadowBlur=lw*10; ctx.shadowColor=style.pulse;
            ctx.globalAlpha=ia*a*(0.85+Math.sin(t*1.2+ri)*0.15+spd*0.15);
            ctx.beginPath(); ctx.moveTo(-52*sc,wakeY);
            ctx.quadraticCurveTo(-26*sc,wakeY-14*sc,0,wakeY-6*sc);
            ctx.quadraticCurveTo( 26*sc,wakeY-14*sc,52*sc,wakeY); ctx.stroke();
        }); ctx.restore();

        // 3 prismatic dashed rings — slight inertia drift
        ctx.save();
        [[38,'#7be8ff',[5,3],1.4],[44,'#ffd14d',[2,4],0.8],[32,'#ff8ba2',[3,5],1.0]].forEach(([rad,col,dash,lw],ri)=>{
            ctx.setLineDash(dash); ctx.lineWidth=lw; ctx.strokeStyle=col;
            ctx.shadowBlur=ri===0?10:6; ctx.shadowColor=col;
            ctx.globalAlpha=ia*(0.48+Math.sin(t*1.2+ri*0.8)*0.15);
            // Slight drift on the rings
            const ox=dx*driftRing*sc, oy=dy*driftRing*sc;
            ctx.beginPath(); ctx.arc(ox, oy, (rad+Math.sin(t*2+ri)*1.5)*sc, 0, Math.PI*2); ctx.stroke();
        }); ctx.setLineDash([]); ctx.restore();

        // 4 crystal prism fragments — strong inertia drift
        ctx.save();
        const fragBase=[
            [[0,-38*sc],[-5*sc,-30*sc],[5*sc,-30*sc]],        // nose
            [[ 22*sc,28*sc],[28*sc,20*sc],[31*sc,32*sc]],     // right wing
            [[-22*sc,28*sc],[-28*sc,20*sc],[-31*sc,32*sc]],   // left wing
            [[ 0,18*sc],[-4*sc,26*sc],[4*sc,26*sc]]           // tail
        ];
        fragBase.forEach((tri,ti)=>{
            const tw=0.38+Math.abs(Math.sin(t*2.5+ti))*0.4;
            // Each fragment drifts by its own amount + a bit of wobble
            const wobble=Math.sin(t*1.8+ti*1.4)*0.3;
            const ox=(dx*driftFrag+wobble*3)*sc;
            const oy=(dy*driftFrag+Math.cos(t*2.1+ti)*3)*sc;
            const shifted=tri.map(([px,py])=>[px+ox, py+oy]);
            ctx.globalAlpha=ia*tw*0.48; ctx.fillStyle=ROW[ti%ROW.length];
            ctx.shadowBlur=8+spd*4; ctx.shadowColor=ROW[ti%ROW.length];
            ctx.beginPath(); ctx.moveTo(shifted[0][0],shifted[0][1]);
            ctx.lineTo(shifted[1][0],shifted[1][1]); ctx.lineTo(shifted[2][0],shifted[2][1]); ctx.closePath(); ctx.fill();
            ctx.globalAlpha=ia*0.75; ctx.strokeStyle=ROW[(ti+1)%ROW.length]; ctx.lineWidth=0.8;
            ctx.stroke();
        }); ctx.restore();

        // Hull fill
        ctx.save(); _shipPath(ctx,pts);
        _radFill(ctx,0,-20*sc,42*sc,'rgba(255,255,210,0.65)','rgba(80,180,255,0.06)',ia); ctx.restore();

        // Hull rainbow stroke
        ctx.save(); ctx.globalAlpha=ia; ctx.shadowBlur=28+spd*6; ctx.shadowColor=style.pulse;
        ctx.strokeStyle=makeRG(-24*sc,0,24*sc,0); ctx.lineWidth=2.2;
        _shipPath(ctx,pts); ctx.stroke();
        ctx.shadowBlur=6; ctx.shadowColor='#fff'; ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=0.9;
        _shipPath(ctx,pts); ctx.stroke(); ctx.restore();

        // Muzzle flash — fires at the nose tip, scales with firepower, capped at 4×base
        {
            // shootTimer counts DOWN from atkCooldown after each shot → flash = 1 right after firing
            const _p = (typeof player !== 'undefined') ? player : null;
            const _cd  = (_p && _p.atkCooldown) ? _p.atkCooldown : 1;
            const _st  = (_p && _p.shootTimer  != null) ? _p.shootTimer  : 0;
            const flash = Math.max(0, _st / _cd); // 1 = just fired, 0 = ready
            if (flash > 0.01) {
                // firepower: base dmg×mult, normalized so base≈1 maps to 0, high dmg maps to 1
                const rawFP = (_p && _p.dmg && _p.damageMultiplier)
                    ? _p.dmg * _p.damageMultiplier : 1;
                const fp = Math.min(1, (rawFP - 1) / 5); // 0 at base, 1 at 6× — cap
                const noseY = -38 * sc;
                const spikeLen = (38 + fp * 32) * sc;  // 38px base → 70px at max fp
                const armLen   = (20 + fp * 18) * sc;  // cross arm
                const glow     = 22 + fp * 28;          // shadowBlur grows with fp
                ctx.save(); ctx.lineCap = 'round';
                // main vertical spike (forward)
                ctx.globalAlpha = ia * flash * 0.95;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.0 + fp * 1.4;
                ctx.shadowBlur = glow; ctx.shadowColor = '#fff';
                ctx.beginPath(); ctx.moveTo(0, noseY); ctx.lineTo(0, noseY - spikeLen); ctx.stroke();
                // colour overlay on spike
                ctx.strokeStyle = '#7be8ff'; ctx.lineWidth = 1.0 + fp * 0.8;
                ctx.shadowColor = '#7be8ff';
                ctx.globalAlpha = ia * flash * 0.6;
                ctx.beginPath(); ctx.moveTo(0, noseY); ctx.lineTo(0, noseY - spikeLen * 0.75); ctx.stroke();
                // short back-spike
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0;
                ctx.globalAlpha = ia * flash * 0.35;
                ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(0, noseY); ctx.lineTo(0, noseY + armLen * 0.4); ctx.stroke();
                // cross arm
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0 + fp * 0.6;
                ctx.globalAlpha = ia * flash * 0.7;
                ctx.shadowBlur = glow * 0.6; ctx.shadowColor = '#ffd14d';
                ctx.beginPath(); ctx.moveTo(-armLen, noseY); ctx.lineTo(armLen, noseY); ctx.stroke();
                // colour rings that burst outward at the tip
                ROW.forEach((col, i) => {
                    const ringR = (5 + i * 3 + fp * 6) * sc;
                    ctx.globalAlpha = ia * flash * (0.45 - i * 0.06);
                    ctx.strokeStyle = col; ctx.lineWidth = 0.9;
                    ctx.shadowBlur = 10; ctx.shadowColor = col;
                    ctx.beginPath(); ctx.arc(0, noseY, ringR, 0, Math.PI * 2); ctx.stroke();
                });
                ctx.restore();
            }
        }

        // Inner hull rainbow glow
        ctx.save();
        const dp=0.3+Math.abs(Math.sin(t*1.5))*0.18;
        ctx.fillStyle=makeRG(-14*sc,0,14*sc,0); ctx.globalAlpha=ia*dp;
        ctx.shadowBlur=8; ctx.shadowColor=style.pulse;
        ctx.beginPath(); ctx.moveTo(0,-26*sc); ctx.lineTo(14*sc,22*sc); ctx.lineTo(0,12*sc); ctx.lineTo(-14*sc,22*sc); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=makeRG(-14*sc,0,14*sc,0); ctx.lineWidth=1.2; ctx.globalAlpha=ia*0.85;
        ctx.beginPath(); ctx.moveTo(0,-26*sc); ctx.lineTo(14*sc,22*sc); ctx.lineTo(0,12*sc); ctx.lineTo(-14*sc,22*sc); ctx.closePath(); ctx.stroke(); ctx.restore();

        // Core triple-ring glow
        ctx.save();
        ctx.shadowBlur=24+spd*6; ctx.shadowColor=style.core; ctx.globalAlpha=ia*0.55;
        ctx.fillStyle=style.pulse; ctx.beginPath(); ctx.arc(0,-2*sc,11*sc,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=16; ctx.globalAlpha=ia; ctx.fillStyle=style.core;
        ctx.beginPath(); ctx.arc(0,-2*sc,6*sc,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0; ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(0,-2*sc,3*sc,0,Math.PI*2); ctx.fill(); ctx.restore();

        // 4-pointed star sparkle helper
        const drawStar4=(cx,cy,sz,rot,col,alpha)=>{
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
            ctx.shadowBlur=12; ctx.shadowColor=col;
            for(let arm=0;arm<4;arm++){
                const ang=arm*(Math.PI/2);
                const ex=Math.cos(ang)*sz, ey=Math.sin(ang)*sz;
                // taper: thick at centre, sharp at tip
                ctx.globalAlpha=alpha*0.9; ctx.strokeStyle=col; ctx.lineWidth=1.2*(1-arm*0.05);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(ex,ey); ctx.stroke();
                // tiny crossbar at 40% length
                const mx=ex*0.42, my=ey*0.42;
                const px=-ey*0.18, py=ex*0.18;
                ctx.globalAlpha=alpha*0.45; ctx.lineWidth=0.6;
                ctx.beginPath(); ctx.moveTo(mx+px,my+py); ctx.lineTo(mx-px,my-py); ctx.stroke();
            }
            ctx.globalAlpha=alpha; ctx.fillStyle='#fff'; ctx.shadowBlur=6;
            ctx.beginPath(); ctx.arc(0,0,sz*0.13,0,Math.PI*2); ctx.fill();
            ctx.restore();
        };

        // 8 drifting 4-pointed star sparkles — replace flat dot cloud
        ctx.save();
        const sparkPos=[[-32,-18],[28,-14],[-38,2],[36,4],[-30,16],[30,20],[-20,-24],[20,-20]];
        sparkPos.forEach(([sx,sy],i)=>{
            const pulse=0.45+Math.abs(Math.sin(t*1.6+i*1.1))*0.55;
            const sz=(5+i%3*1.5)*sc;
            const rot=t*0.7*(i%2===0?1:-1)+i;
            const pFactor=0.8+i%3*0.3;
            const ox=(dx*driftStar*pFactor + Math.sin(t*0.9+i)*1.5)*sc;
            const oy=(dy*driftStar*pFactor + Math.cos(t*0.7+i)*1.5)*sc;
            drawStar4(sx*sc+ox, sy*sc+oy, sz, rot, ROW[i%ROW.length], ia*pulse);
        }); ctx.restore();

        // 4 orbiting crystal diamonds — replace plain orbs
        ctx.save();
        const ot2=t*1.6;
        const drawDiamond=(cx,cy,w,h,rot,col,alpha)=>{
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
            ctx.globalAlpha=alpha; ctx.shadowBlur=14+spd*6; ctx.shadowColor=col;
            ctx.fillStyle=col;
            ctx.beginPath(); ctx.moveTo(0,-h); ctx.lineTo(w,0); ctx.lineTo(0,h); ctx.lineTo(-w,0); ctx.closePath(); ctx.fill();
            ctx.globalAlpha=alpha*0.6; ctx.fillStyle='#fff';
            ctx.beginPath(); ctx.moveTo(0,-h*0.55); ctx.lineTo(w*0.4,0); ctx.lineTo(0,h*0.3); ctx.lineTo(-w*0.4,0); ctx.closePath(); ctx.fill();
            ctx.globalAlpha=alpha*0.85; ctx.strokeStyle='#fff'; ctx.lineWidth=0.6;
            ctx.shadowBlur=6; ctx.shadowColor='#fff';
            ctx.beginPath(); ctx.moveTo(0,-h); ctx.lineTo(w,0); ctx.lineTo(0,h); ctx.lineTo(-w,0); ctx.closePath(); ctx.stroke();
            ctx.restore();
        };
        for(let i=0;i<4;i++){
            const orbitA=ot2+i*(Math.PI/2);
            const orbitR=(r+12)+(i%2===0?0:6);
            const tw=0.7+Math.sin(t*3.5+i*1.4)*0.25;
            const ox=dx*driftOrb*sc, oy=dy*driftOrb*sc;
            drawDiamond(
                Math.cos(orbitA)*orbitR+ox, Math.sin(orbitA)*orbitR+oy,
                (3.2+spd*0.4)*sc, (6+spd*0.8)*sc,
                t*2.4*(i%2===0?1:-1)+i*0.9,
                ROW[i%ROW.length], ia*tw
            );
        }

        // Vertex corner 4-pointed sparks
        [[0,-38*sc],[24*sc,30*sc],[-24*sc,30*sc],[0,18*sc]].forEach(([sx,sy],i)=>{
            const pulse=0.55+Math.abs(Math.sin(t*2.8+i*2.1))*0.45;
            drawStar4(sx,sy,(5+i*0.5)*sc, t*1.2*(i%2===0?1:-1), '#fff', ia*pulse);
        }); ctx.restore();

        // 2 rainbow engine ribbon arcs
        ctx.save(); ctx.lineCap='round';
        [[34,3.0,0.9],[42,2.0,0.6]].forEach(([yd,lw,a])=>{
            const y=yd*sc;
            ctx.strokeStyle=makeRG(-44*sc,0,44*sc,0); ctx.lineWidth=lw;
            ctx.shadowBlur=10; ctx.shadowColor=style.pulse; ctx.globalAlpha=ia*a;
            ctx.beginPath(); ctx.moveTo(-44*sc,y);
            ctx.quadraticCurveTo(-22*sc,y-16*sc,0,y-4*sc);
            ctx.quadraticCurveTo( 22*sc,y-16*sc,44*sc,y); ctx.stroke();
        }); ctx.restore();
    },
    drawTrailExtra(ctx, trail, style) {
        const C=['#7be8ff','#fffbe8','#ffd14d','#ff8ba2'];
        for(let i=0;i<trail.length-1;i+=2){
            const fade=1-(i/Math.max(1,trail.length-1));
            ctx.globalAlpha=Math.max(0.02,fade*0.32); ctx.strokeStyle=C[i%C.length];
            ctx.shadowBlur=8; ctx.shadowColor=C[i%C.length]; ctx.lineWidth=2;
            const c=trail[i], n=trail[i+1];
            ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(n.x,n.y); ctx.stroke();
        }
    }
}

}; // end SKIN_DEFINITIONS
