// ════════════════════════════════════════
// CENTIPEDE
// ════════════════════════════════════════
window.launchCentipede = function launchCentipede() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 20;
  const COLS = Math.floor(W/SZ), ROWS = Math.floor(H/SZ);

  // Build mushroom grid from hero blocks
  const blocks = scrapeHeroBlocks();
  const mushGrid = new Map();
  blocks.forEach(b => {
    const words = b.text.split(' ').filter(w=>w.length>0);
    const wordW = b.w / Math.max(words.length,1);
    words.forEach((word,i) => {
      const gc = Math.round((b.x + i*wordW + wordW/2) / SZ);
      const gr = Math.round(b.y / SZ);
      // Only place if in upper 70% of screen and not on edges
      if (gc>=1&&gc<COLS-1&&gr>=1&&gr<Math.floor(ROWS*0.7)) {
        const key=`${gc},${gr}`;
        if (!mushGrid.has(key)) mushGrid.set(key, { gc, gr, text:word.slice(0,6), hp:2, maxHp:2, color:b.color });
      }
    });
  });

  // Centipede — spawns at TOP-LEFT, moves RIGHT across top row
  const SEG_N = 12;
  function makeCentipede() {
    // Start segments off the left edge at row 0, spaced apart
    return Array.from({length:SEG_N},(_,i)=>({
      gc: -(i+1),   // start off-screen left
      gr: 0,        // top row
      dx: 1,        // moving right
      px: -(i+1)*SZ+SZ/2,  // pixel x
      py: SZ/2,             // pixel y
    }));
  }
  let segs = makeCentipede();
  let wave=1, segSpd=1.2;
  let moveTimer=0, moveInterval=60; // ms between moves

  const ship = { gc:Math.floor(COLS/2), gr:ROWS-3, px:W/2, py:(ROWS-3)*SZ+SZ/2, spd:3 };
  const bullets=[];
  let score=0, lives=3, dead=false;
  let lastTs=null;

  const keys={};
  const kd=(e)=>{
    keys[e.key]=true;
    if(e.key===' '){e.preventDefault(); if(bullets.length<3) bullets.push({x:ship.px,y:ship.py-SZ,vy:-9});}
  };
  const ku=(e)=>{ keys[e.key]=false; };
  document.addEventListener('keydown',kd);
  document.addEventListener('keyup',ku);

  function mushAt(gc,gr) { const m=mushGrid.get(`${gc},${gr}`); return m&&m.hp>0; }

  function moveCentipede(dt) {
    moveTimer+=dt;
    if (moveTimer<moveInterval) return;
    moveTimer=0;

    for (let i=0;i<segs.length;i++) {
      const seg=segs[i];
      const ngc = seg.gc+seg.dx;
      // Hit wall edge or mushroom — drop one row, reverse
      if (ngc<0||ngc>=COLS||mushAt(ngc,seg.gr)) {
        seg.gr++;
        if (seg.gr>=ROWS) seg.gr=1;
        seg.dx*=-1;
        // Update pixel
        seg.py=seg.gr*SZ+SZ/2;
      } else {
        seg.gc=ngc;
      }
      seg.px=seg.gc*SZ+SZ/2;
      seg.py=seg.gr*SZ+SZ/2;
    }
  }

  let lastTime2=null;
  function loop(ts) {
    if (dead || state.killed) return;
    const dt = lastTime2===null ? 16 : Math.min(ts-lastTime2,50);
    lastTime2=ts;

    // Ship movement — lower third
    if ((keys['ArrowLeft']||keys['a'])&&ship.px>SZ) { ship.px-=ship.spd; ship.gc=Math.floor(ship.px/SZ); }
    if ((keys['ArrowRight']||keys['d'])&&ship.px<W-SZ) { ship.px+=ship.spd; ship.gc=Math.floor(ship.px/SZ); }
    if ((keys['ArrowUp']||keys['w'])&&ship.py>H*0.65) { ship.py-=ship.spd; ship.gr=Math.floor(ship.py/SZ); }
    if ((keys['ArrowDown']||keys['s'])&&ship.py<H-SZ) { ship.py+=ship.spd; ship.gr=Math.floor(ship.py/SZ); }

    // Bullets
    bullets.forEach(b=>b.y+=b.vy);
    for(let i=bullets.length-1;i>=0;i--) if(bullets[i].y<0) bullets.splice(i,1);

    // Bullet vs mushroom
    for(let bi=bullets.length-1;bi>=0;bi--) {
      const b=bullets[bi];
      const gc=Math.floor(b.x/SZ), gr=Math.floor(b.y/SZ);
      const m=mushGrid.get(`${gc},${gr}`);
      if(m&&m.hp>0) { m.hp--; score+=m.hp<=0?5:1; bullets.splice(bi,1); }
    }

    moveCentipede(dt);

    // Bullet vs centipede
    for(let bi=bullets.length-1;bi>=0;bi--) {
      const b=bullets[bi];
      for(let si=segs.length-1;si>=0;si--) {
        if(Math.hypot(b.x-segs[si].px,b.y-segs[si].py)<SZ*0.7) {
          const s=segs[si];
          mushGrid.set(`${s.gc},${s.gr}`,{gc:s.gc,gr:s.gr,text:'☠',hp:1,maxHp:1,color:'#f87171'});
          segs.splice(si,1); bullets.splice(bi,1); score+=10; break;
        }
      }
    }

    // Centipede touches player
    for(let si=0;si<segs.length;si++) {
      if(Math.hypot(segs[si].px-ship.px,segs[si].py-ship.py)<SZ*0.8) {
        lives--;
        if(lives<=0){end('The centipede got you!');return;}
        segs=makeCentipede(); break;
      }
    }

    // New wave
    if(segs.length===0) {
      wave++; segSpd=Math.min(segSpd+0.3,3); moveInterval=Math.max(30,moveInterval-6);
      segs=makeCentipede();
    }

    draw();
    hud.innerHTML=`CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>wave: ${wave}<br>↑↓←→ move<br>SPACE fire`;
    state.rafId = requestAnimationFrame(loop);
  }

  function end(msg) {
    dead=true; document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku);
    draw(); showGameOver(ctx,W,H,msg,score,cleanup,launchCentipede);
  }

  function draw() {
    ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);

    // Player zone line
    ctx.strokeStyle='#1a1e28'; ctx.lineWidth=1; ctx.setLineDash([4,6]);
    ctx.beginPath(); ctx.moveTo(0,H*0.65); ctx.lineTo(W,H*0.65); ctx.stroke();
    ctx.setLineDash([]);

    // Mushrooms
    mushGrid.forEach(m=>{
      if(m.hp<=0) return;
      const a=m.hp/m.maxHp;
      const px=m.gc*SZ, py=m.gr*SZ;
      ctx.globalAlpha=a*0.2; ctx.fillStyle=m.color; ctx.fillRect(px,py,SZ,SZ);
      ctx.globalAlpha=a; ctx.strokeStyle=m.color; ctx.lineWidth=1;
      ctx.strokeRect(px+0.5,py+0.5,SZ-1,SZ-1);
      ctx.fillStyle=m.color;
      ctx.font=`${Math.min(11,SZ-3)}px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(m.text,px+SZ/2,py+SZ/2,SZ-2);
      ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
    });

    // Centipede
    segs.forEach((seg,i)=>{
      if(seg.px<-SZ||seg.px>W+SZ) return; // off screen
      ctx.fillStyle=i===0?'#ffffff':ACCENT;
      ctx.beginPath(); ctx.arc(seg.px,seg.py,SZ/2-1,0,Math.PI*2); ctx.fill();
      if(i===0) {
        ctx.fillStyle='#0d0f14';
        ctx.beginPath(); ctx.arc(seg.px-4,seg.py-3,2.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(seg.px+4,seg.py-3,2.5,0,Math.PI*2); ctx.fill();
      }
    });

    // Ship
    ctx.fillStyle=ACCENT;
    ctx.beginPath(); ctx.moveTo(ship.px,ship.py-SZ/2); ctx.lineTo(ship.px-SZ/2,ship.py+SZ/2); ctx.lineTo(ship.px+SZ/2,ship.py+SZ/2); ctx.closePath(); ctx.fill();

    // Bullets
    bullets.forEach(b=>{ctx.fillStyle='#ffffff';ctx.fillRect(b.x-2,b.y-7,4,14);});
  }

  draw();
  state.rafId = requestAnimationFrame(loop);
}
