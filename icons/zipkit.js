window.ZipKit=(()=>{
const createCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const OUT='#1a1420';
const W=64,H=96,SC=16;
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(c,t,w)=>'#'+c.map((v,i)=>Math.round(v+(t[i]-v)*w).toString(16).padStart(2,'0')).join('');
const Wt=[255,255,255],Bk=[26,20,32];
const ramp=h=>{const c=hex(h);return{xl:mix(c,Wt,.55),l:mix(c,Wt,.28),b:h,m:mix(c,Bk,.32),d:mix(c,Bk,.58),dd:mix(c,Bk,.74)};};
function mk(){
 const g=Array.from({length:H},()=>Array(W).fill(null));
 const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=1&&x<W-1&&y>=1&&y<H-1)g[y][x]=c;};
 const api={g,put,
  rect(x0,y0,x1,y1,c){for(let y=Math.round(y0);y<=Math.round(y1);y++)for(let x=Math.round(x0);x<=Math.round(x1);x++)put(x,y,c);return api;},
  poly(pts,c){let a=1e9,b=-1e9;pts.forEach(p=>{a=Math.min(a,p[1]);b=Math.max(b,p[1])});
   for(let y=Math.floor(a);y<=Math.ceil(b);y++)for(let x=0;x<W;x++){let ins=false;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];
     if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins;}
    if(ins)put(x,y,c);}return api;},
  disc(cx,cy,r,c,rin){for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){
   const d=Math.hypot(x-cx,y-cy);if(d<=r&&(rin==null||d>=rin))put(x,y,c);}return api;},
  spoke(cx,cy,r0,r1,deg,w,c){const A=deg*Math.PI/180,x0=cx+Math.cos(A)*r0,y0=cy+Math.sin(A)*r0,x1=cx+Math.cos(A)*r1,y1=cy+Math.sin(A)*r1;
   const L=Math.hypot(x1-x0,y1-y0)||1;
   for(let y=Math.floor(Math.min(y0,y1)-w-1);y<=Math.ceil(Math.max(y0,y1)+w+1);y++)
    for(let x=Math.floor(Math.min(x0,x1)-w-1);x<=Math.ceil(Math.max(x0,x1)+w+1);x++){
     let t=((x-x0)*(x1-x0)+(y-y0)*(y1-y0))/(L*L);t=Math.max(0,Math.min(1,t));
     if(Math.hypot(x-(x0+t*(x1-x0)),y-(y0+t*(y1-y0)))<=w)put(x,y,c);}return api;},
  star(x,y,r,c){api.rect(x,y-r,x,y+r,c);api.rect(x-r,y,x+r,y,c);api.rect(x-1,y-1,x+1,y+1,c);return api;},
 };
 return api;
}
function render(g,PAL){
 const cv=createCanvas(W*SC,H*SC),ctx=cv.getContext('2d');
 const at=(y,x)=>(y<0||x<0||y>=H||x>=W)?null:g[y][x];
 const nm=v=>v?v.split('!')[0]:null;
 const out=Array.from({length:H},()=>Array(W).fill(0));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(at(y,x))continue;let n=false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(at(y+dy,x+dx))n=true;if(n)out[y][x]=1;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=null;
  if(out[y][x])f=OUT;
  else if(at(y,x)){const[n0,tone]=g[y][x].split('!'),Rp=PAL[n0];if(!Rp)continue;
   if(tone&&Rp[tone])f=Rp[tone];
   else{const nd=(a,b)=>nm(at(a,b))!==n0;
    const up=nd(y-1,x),le=nd(y,x-1),dn=nd(y+1,x),ri=nd(y,x+1);
    f=(up&&le)?Rp.xl:(up||le)?Rp.l:(dn||ri)?Rp.d:Rp.b;}}
  if(f){ctx.fillStyle=f;ctx.fillRect(x*SC,y*SC,SC,SC);}}
 return cv;
}
const TIERS=[
 {id:'common',   body:'#b9adf0', foil:'#e8e4f7', hi:'#ffffff', glow:'#ffffff', spark:0, flake:0, rays:0, leak:0},
 {id:'rare',     body:'#29d1ff', foil:'#bff1ff', hi:'#ffffff', glow:'#8fe8ff', spark:1, flake:0, rays:0, leak:1},
 {id:'epic',     body:'#ff5fd1', foil:'#ffc2ee', hi:'#ffffff', glow:'#ff9ae2', spark:1, flake:1, rays:0, leak:2},
 {id:'legendary',body:'#ffcd3c', foil:'#ffe9a8', hi:'#ffffff', glow:'#ffe07a', spark:1, flake:1, rays:1, leak:3},
];
const PX0=14,PX1=50,PY0=12,PY1=84,TILT=2;
const ZY=26;
const zy=x=>ZY+TILT*(PX1-x)/(PX1-PX0);
const L=PX0+1,R=PX1-1;
const FR=[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1];
// ---- layer 1: pack body (no zipper mechanism) ----
// body, foil stripe, seal icon, top flap and the gap/glow band.
function body(a,T,t){
 const fl=t>=1?-3:0;
 a.poly([[PX0+7,PY0+TILT-7],[PX1+7,PY0-7],[PX1+7,PY1-7],[PX0+7,PY1+TILT-7]],'pk!dd');
 a.poly([[PX0+3.5,PY0+TILT-3.5],[PX1+3.5,PY0-3.5],[PX1+3.5,PY1-3.5],[PX0+3.5,PY1+TILT-3.5]],'pk!m');
 a.poly([[PX0,zy(PX0)],[PX1,zy(PX1)],[PX1,PY1],[PX0,PY1+TILT]],'pk!b');
 a.poly([[PX0,PY1-13+TILT],[PX1,PY1-13],[PX1,PY1-7],[PX0,PY1-7+TILT]],'pk!m');
 a.poly([[PX0,PY1-7+TILT],[PX1,PY1-7],[PX1,PY1],[PX0,PY1+TILT]],'pk!d');
 a.rect(PX0+2,zy(PX0)+3,PX0+3,PY1-4,'pk!xl');
 a.rect(PX1-2,zy(PX1)+3,PX1-1,PY1-2,'pk!d');
 for(let x=PX0+2;x<=PX1-2;x+=3)a.rect(x,PY1-3,x+1,PY1-1,'pk!dd');
 const fy=50;
 a.poly([[PX0,fy+TILT],[PX1,fy],[PX1,fy+11],[PX0,fy+11+TILT]],'foil!b');
 a.poly([[PX0,fy+TILT],[PX1,fy],[PX1,fy+3],[PX0,fy+3+TILT]],'foil!xl');
 a.poly([[PX0,fy+8+TILT],[PX1,fy+8],[PX1,fy+11],[PX0,fy+11+TILT]],'foil!m');
 for(let i=0;i<4;i++){const bx=PX0+6+i*9;a.poly([[bx,fy+9],[bx+3,fy+3],[bx+5,fy+3],[bx+2,fy+9]],'foil!xl');}
 a.poly([[21,63],[43,62],[43,79],[21,80]],'pk!d');
 a.poly([[23,65],[41,64],[41,77],[23,78]],'pk!m');
 [[23,65],[41,64],[41,77],[23,78]].forEach(([x,y])=>a.disc(x,y,1.2,'pk!dd'));
 a.disc(32,71,6,'foil!b');a.disc(32,71,3.2,'foil!xl');a.disc(32,71,1.4,'pk!dd');
 a.poly([[PX0,PY0+TILT+fl],[PX1,PY0+fl],[PX1,zy(PX1)+fl],[PX0,zy(PX0)+fl]],'pk!b');
 a.poly([[PX0,PY0+TILT+fl],[PX1,PY0+fl],[PX1,PY0+7+fl],[PX0,PY0+7+TILT+fl]],'pk!l');
 a.poly([[PX0,PY0+TILT+fl],[PX1,PY0+fl],[PX1,PY0+3+fl],[PX0,PY0+3+TILT+fl]],'pk!xl');
 a.rect(PX0+2,PY0+5+fl,PX0+3,zy(PX0)-4+fl,'pk!xl');
 a.rect(PX1-2,PY0+4+fl,PX1-1,zy(PX1)-4+fl,'pk!d');
 const slider=L+(R-L)*t,lk=T.leak,open=x=>x<slider-0.5;
 const GW=1+Math.round(t*2);
 for(let x=L;x<=R;x++){
  const c=Math.round(zy(x));
  if(open(x)){
   a.rect(x,c-2-GW+fl,x,c+2+GW,'glow!dd');
   a.rect(x,c-GW+fl,x,c+GW,'glow!b');
   a.rect(x,c-1+fl,x,c+1,'glow!xl');
   if(lk&&x%3===0){a.rect(x,c-4-GW+fl,x,c-4-GW+fl,'glow!m');a.rect(x,c+4+GW,x,c+4+GW,'glow!m');}
  }else{
   a.rect(x,c-4+fl,x,c-4+fl,'glow!b');
   a.rect(x,c+4,x,c+4,'glow!b');
   if(lk){a.rect(x,c-5+fl,x,c-5+fl,'glow!m');a.rect(x,c+5,x,c+5+Math.floor(lk/2),'glow!m');}
  }
 }
}

// ---- layer 2: zipper mechanism only (teeth, tape, slider, ring) ----
function mech(a,T,t){
 const fl=t>=1?-3:0;
 const slider=L+(R-L)*t,open=x=>x<slider-0.5;
 const GW=1+Math.round(t*2);
 // dark channel behind the closed run of teeth
 for(let x=L;x<=R;x++){
  const c=Math.round(zy(x));
  if(!open(x))a.rect(x,c-1,x,c+1,'zip!dd');
 }
 // tape bands + parted tooth accents
 for(let x=L;x<=R;x++){
  const c=Math.round(zy(x)),o=open(x);
  const up=o?c-3-GW+fl:c-3+fl, lo=o?c+2+GW:c+2;
  a.rect(x,up,x,up+1,'zip!m');
  a.rect(x,up,x,up,'zip!l');
  a.rect(x,lo,x,lo+1,'zip!m');
  a.rect(x,lo+1,x,lo+1,'zip!d');
  if(o){const i=Math.round(x-L)%4;
   if(i<2)a.rect(x,up+2,x,up+2,'zip!xl');
   else a.rect(x,lo-1,x,lo-1,'zip!l');}
 }
 // interlocking closed teeth
 for(let x=L;x<=R-3;x+=4){
  const c1=Math.round(zy(x)),c2=Math.round(zy(x+2));
  if(!open(x)){a.rect(x,c1-1,x+1,c1,'zip!xl');a.rect(x+2,c2,x+3,c2+1,'zip!l');}
 }
 // slider box
 const SCy=Math.round(zy(slider));
 const SX0=Math.round(slider)-4,SX1=Math.round(slider)+5,SY0=SCy-5,SY1=SCy+5;
 a.rect(SX0,SY0,SX1,SY1,'zip!b');
 a.rect(SX0,SY0,SX1,SY0,'zip!xl');
 a.rect(SX0,SY1,SX1,SY1,'zip!d');
 a.rect(SX0,SY0,SX0,SY1,'zip!l');
 a.rect(SX0+4,SCy-2,SX0+6,SCy+2,'zip!m');
 // chain stem + pull ring
 const RCX=SX0+1,RCY=SY1+7,RR=5;
 a.rect(RCX-1,SY1,RCX,RCY-RR+1,'zip!l');
 a.disc(RCX,RCY,RR,'zip!b',3);
 [[-4,-2],[-3,-3],[-2,-4],[-1,-4]].forEach(([dx,dy])=>a.rect(RCX+dx,RCY+dy,RCX+dx,RCY+dy,'zip!xl'));
 [[3,2],[4,1],[2,3]].forEach(([dx,dy])=>a.rect(RCX+dx,RCY+dy,RCX+dx,RCY+dy,'zip!d'));
}

// flourishes belong to the body layer (rays behind, sparks around)
function flourish(a,T,t,phase){
 if(phase==='back'){
  if(T.rays)for(let k=0;k<20;k++)a.spoke(32,48,42,k%2?52+t*4:46+t*4,k*18+7,0.9,'ray!'+(k%2?'l':'b'));
 }else{
  if(T.spark)[[8,16,3],[57,24,3],[9,74,2],[56,70,3]].forEach(([x,y,r])=>a.star(x,y,r,'glow!xl'));
  if(T.flake)[[6,38,2],[59,46,2],[11,88,2],[54,90,1],[7,6,1],[58,10,2],[4,58,1]].forEach(([x,y,r])=>a.star(x,y,r,'glow!l'));
 }
}


// renders the FULL grid once (so outline + shading are computed against the
// complete artwork) but only emits cells owned by `which`: 'body' | 'mech' | 'all'.
// Outline cells follow their neighbouring owner, mechanism winning ties, so the
// two layers stacked are pixel-identical to the combined render.
function renderLayer(g,own,PAL,which){
 const cv=createCanvas(W*SC,H*SC),ctx=cv.getContext('2d');
 const at=(y,x)=>(y<0||x<0||y>=H||x>=W)?null:g[y][x];
 const ow=(y,x)=>(y<0||x<0||y>=H||x>=W)?null:own[y][x];
 const nm=v=>v?v.split('!')[0]:null;
 const out=Array.from({length:H},()=>Array(W).fill(0));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(at(y,x))continue;let n=false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(at(y+dy,x+dx))n=true;if(n)out[y][x]=1;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let f=null,owner=null;
  if(out[y][x]){
   f=OUT;owner='body';
   for(let dy=-1;dy<=1&&owner!=='mech';dy++)for(let dx=-1;dx<=1;dx++)
    if(ow(y+dy,x+dx)==='mech'){owner='mech';break;}
  } else if(at(y,x)){
   owner=own[y][x];
   const[n0,tone]=g[y][x].split('!'),Rp=PAL[n0];if(!Rp)continue;
   if(tone&&Rp[tone])f=Rp[tone];
   else{const nd=(a,b)=>nm(at(a,b))!==n0;
    const up=nd(y-1,x),le=nd(y,x-1),dn=nd(y+1,x),ri=nd(y,x+1);
    f=(up&&le)?Rp.xl:(up||le)?Rp.l:(dn||ri)?Rp.d:Rp.b;}
  }
  if(f&&(which==='all'||owner===which)){ctx.fillStyle=f;ctx.fillRect(x*SC,y*SC,SC,SC);}}
 return cv;
}
// builds the complete grid plus a per-cell owner map
function compose(T,t){
 const a=mk();
 flourish(a,T,t,'back');
 body(a,T,t);
 const s1=a.g.map(r=>r.slice());
 mech(a,T,t);
 const own=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>
  a.g[y][x]==null?null:(s1[y][x]===a.g[y][x]?'body':'mech')));
 // sparks/flecks sit on top of everything, as in the original draw order,
 // and stay owned by the body layer
 flourish(a,T,t,'front');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)
  if(a.g[y][x]!=null&&own[y][x]==null)own[y][x]='body';
  else if(a.g[y][x]!=null&&s1[y][x]!==a.g[y][x]&&own[y][x]==='mech'){
   // a fleck overpainted the mechanism here
   own[y][x]='body';}
 return {g:a.g,own};
}

function palette(T){
 return {pk:ramp(T.body),
  foil:{xl:T.hi,l:mix(hex(T.foil),Wt,.4),b:T.foil,m:mix(hex(T.foil),Bk,.28),d:mix(hex(T.foil),Bk,.5),dd:mix(hex(T.foil),Bk,.66)},
  glow:{xl:'#ffffff',l:mix(hex(T.glow),Wt,.55),b:T.glow,m:mix(hex(T.glow),Bk,.18),d:mix(hex(T.glow),Bk,.45),dd:'#2a2338'},
  zip:{xl:'#f2f2f8',l:'#dcdce6',b:'#c9c9d4',m:'#9a9aa8',d:'#6b6b7a',dd:'#3c3c46'},
  shine:{xl:'#ffffff',l:'#eef0fb',b:'#d6d9ea',m:'#a8acc4',d:'#7a7e96',dd:'#4e5266'},
  ray:ramp('#ffcd3c')};
}
// layer 1 — pack body, foil, seal, flap, gap glow. No mechanism.
function frameBody(T,t){const c=compose(T,t);return renderLayer(c.g,c.own,palette(T),'body');}
// layer 2 — zipper teeth, tape, slider box, chain + pull ring only.
function frameMechanism(T,t){const c=compose(T,t);return renderLayer(c.g,c.own,palette(T),'mech');}
// combined, unchanged output
function frame(T,t){const c=compose(T,t);return renderLayer(c.g,c.own,palette(T),'all');}
// Normalized (0..1) positions for CSS/canvas overlays (e.g. the shine
// layer) that need to track the art's own zipper geometry exactly rather
// than duplicate/guess it. sliderX/Y is the pull-tab center; leftX/Y and
// rightX/Y are the seam's two ends (same tilt formula the pack art uses).
function geometry(t){
 const slider=L+(R-L)*t;
 return {
  sliderX: slider/W, sliderY: zy(slider)/H,
  leftX: L/W, leftY: zy(L)/H,
  rightX: R/W, rightY: zy(R)/H,
 };
}
return {TIERS,FR,frame,frameBody,frameMechanism,geometry};
})()