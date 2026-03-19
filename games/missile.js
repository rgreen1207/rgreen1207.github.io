// ════════════════════════════════════════
// MISSILE COMMAND
// ════════════════════════════════════════
function launchMissile() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();

  // Fixed hardcoded cities — no text elements at bottom
  const cityLabels = ['Python','FastAPI','Redis','PostgreSQL','Docker','AWS','RabbitMQ','Celery'];
  const cityCount = cityLabels.length;
  const cityPad = W * 0.06;
  const citySpacing = (W - cityPad * 2) / (cityCount - 1);
  const cities = cityLabels.map((label, i) => ({
    x: cityPad + i * citySpacing,
    y: H - 55,
    label,
    alive: true,
    hp: 2, maxHp: 2,
  }));

  const bases = [
    { x: W * 0.2, y: H - 30, ammo: 15 },
    { x: W * 0.5, y: H - 30, ammo: 15 },
    { x: W * 0.8, y: H - 30, ammo: 15 },
  ];
  let activeBase = 1;

  const inMissiles = [], myMissiles = [], explosions = [];
  let score = 0, wave = 1, dead = false;
  let spawnTimer = 0, spawnInterval = 1800;
  let missilesSentThisWave = 0;
  const missilesPerWave = () => 4 + wave * 2;

  function fireAt(tx, ty) {
    // Find base with ammo — prefer activeBase
    let base = null;
    if (bases[activeBase].ammo > 0) base = bases[activeBase];
    else { for (let i = 0; i < bases.length; i++) if (bases[i].ammo > 0) { base = bases[i]; activeBase = i; break; } }
    if (!base) return;
    const dist = Math.max(Math.hypot(tx - base.x, ty - base.y), 1);
    const spd = 10;
    myMissiles.push({ sx: base.x, sy: base.y, x: base.x, y: base.y, vx: (tx-base.x)/dist*spd, vy: (ty-base.y)/dist*spd, tx, ty });
    base.ammo--;
  }

  // Use window coords directly — canvas fills viewport
  const clickH = (e) => { fireAt(e.clientX, e.clientY); };
  const kd = (e) => {
    if (e.key==='1') activeBase=0;
    if (e.key==='2') activeBase=1;
    if (e.key==='3') activeBase=2;
    if (e.key===' ') { e.preventDefault(); fireAt(bases[activeBase].x, H*0.25); }
  };
  canvas.addEventListener('click', clickH);
  document.addEventListener('keydown', kd);

  function spawnEnemy(dt) {
    if (missilesSentThisWave >= missilesPerWave()) return;
    spawnTimer += dt;
    if (spawnTimer < spawnInterval) return;
    spawnTimer = 0;
    const aliveCities = cities.filter(c => c.alive);
    if (!aliveCities.length) return;
    const target = aliveCities[Math.floor(Math.random() * aliveCities.length)];
    const sx = 50 + Math.random() * (W - 100), sy = 0;
    const dist = Math.max(Math.hypot(target.x - sx, target.y - sy), 1);
    const spd = 0.9 + wave * 0.2;
    inMissiles.push({ x: sx, y: sy, vx: (target.x-sx)/dist*spd, vy: (target.y-sy)/dist*spd, target });
    missilesSentThisWave++;
    spawnInterval = Math.max(500, spawnInterval - 60);
  }

  let lastTs = null;
  function loop(ts) {
    if (dead || state.killed) return;
    const dt = lastTs === null ? 16 : Math.min(ts - lastTs, 50);
    lastTs = ts;

    spawnEnemy(dt);

    inMissiles.forEach(m => { m.x += m.vx; m.y += m.vy; });
    myMissiles.forEach(m => { m.x += m.vx; m.y += m.vy; });
    explosions.forEach(e => { e.r += 3.5; e.life--; });
    for (let i = explosions.length-1; i >= 0; i--) if (explosions[i].life <= 0) explosions.splice(i, 1);

    // My missile reaches target — explode
    for (let i = myMissiles.length-1; i >= 0; i--) {
      const m = myMissiles[i];
      if (Math.hypot(m.x-m.tx, m.y-m.ty) < 14) {
        explosions.push({ x: m.tx, y: m.ty, r: 8, maxR: 55, life: 22, maxLife: 22, color: ACCENT });
        myMissiles.splice(i, 1);
      }
    }

    // Explosions intercept incoming
    for (let ei = 0; ei < explosions.length; ei++) {
      const exp = explosions[ei];
      for (let mi = inMissiles.length-1; mi >= 0; mi--) {
        if (Math.hypot(inMissiles[mi].x-exp.x, inMissiles[mi].y-exp.y) < exp.r) {
          inMissiles.splice(mi, 1); score += 25;
        }
      }
    }

    // Incoming hits city
    for (let mi = inMissiles.length-1; mi >= 0; mi--) {
      const m = inMissiles[mi];
      if (m.target.alive && Math.hypot(m.x-m.target.x, m.y-m.target.y) < 30) {
        m.target.hp--;
        if (m.target.hp <= 0) m.target.alive = false;
        explosions.push({ x: m.target.x, y: m.target.y, r: 6, maxR: 40, life: 25, maxLife: 25, color: '#f87171' });
        inMissiles.splice(mi, 1); continue;
      }
      if (m.y > H + 10) inMissiles.splice(mi, 1);
    }

    if (!cities.some(c => c.alive)) { end('Infrastructure destroyed!'); return; }

    // Wave complete
    if (missilesSentThisWave >= missilesPerWave() && inMissiles.length===0 && myMissiles.length===0 && explosions.length===0) {
      wave++; missilesSentThisWave=0; spawnInterval=Math.max(500,1800-wave*120); spawnTimer=0;
      bases.forEach(b => { b.ammo = Math.min(b.ammo+10, 20); });
      score += wave * 100;
    }

    draw();
    const totalAmmo = bases.reduce((s,b)=>s+b.ammo,0);
    hud.innerHTML = `MISSILE CMD<br>score: ${score}<br>wave: ${wave}<br>ammo: ${totalAmmo}<br>1/2/3 pick base<br>CLICK or SPACE fire`;
    state.rafId = requestAnimationFrame(loop);
  }

  function end(msg) {
    dead = true;
    canvas.removeEventListener('click', clickH);
    document.removeEventListener('keydown', kd);
    draw();
    showGameOver(ctx, W, H, msg, score, cleanup, launchMissile);
  }

  function draw() {
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#060810'); sky.addColorStop(1,'#0d1018');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

    // Stars
    for (let i=0;i<80;i++) { ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect((i*137+7)%W,(i*97+13)%(H*0.85),1,1); }

    // Ground
    ctx.fillStyle='#13161e'; ctx.fillRect(0,H-30,W,30);
    ctx.strokeStyle='#252a38'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,H-30); ctx.lineTo(W,H-30); ctx.stroke();

    // Cities
    cities.forEach(c => {
      if (!c.alive) return;
      const col = c.hp===2 ? ACCENT : '#fbbf24';
      ctx.fillStyle=col;
      ctx.fillRect(c.x-16,H-30,32,10); ctx.fillRect(c.x-9,H-40,18,10); ctx.fillRect(c.x-5,H-50,10,10);
      ctx.font="10px 'JetBrains Mono',monospace"; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillStyle=col; ctx.fillText(c.label,c.x,H-52);
      ctx.textBaseline='alphabetic';
    });

    // Missile bases
    bases.forEach((base,i) => {
      const isActive = i===activeBase;
      ctx.fillStyle = isActive ? ACCENT : '#4a5568';
      ctx.fillRect(base.x-14,H-30,28,10); ctx.fillRect(base.x-3,H-38,6,8);
      ctx.fillStyle = isActive ? '#ffffff' : '#6b7a90';
      ctx.font="9px 'JetBrains Mono',monospace"; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(`[${i+1}]${base.ammo}`,base.x,H-32); ctx.textBaseline='alphabetic';
    });

    // Incoming — red trails
    inMissiles.forEach(m => {
      const len=50; const mag=Math.max(Math.hypot(m.vx,m.vy),0.01);
      ctx.strokeStyle='#f87171'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(m.x-m.vx/mag*len,m.y-m.vy/mag*len); ctx.lineTo(m.x,m.y); ctx.stroke();
      ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(m.x,m.y,3,0,Math.PI*2); ctx.fill();
    });

    // My missiles — white dots, trail from base
    myMissiles.forEach(m => {
      ctx.strokeStyle='rgba(100,100,120,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(m.sx,m.sy); ctx.lineTo(m.x,m.y); ctx.stroke();
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(m.x,m.y,3,0,Math.PI*2); ctx.fill();
    });

    // Explosions
    explosions.forEach(e => {
      const a = e.life/e.maxLife;
      ctx.globalAlpha=a*0.25; ctx.fillStyle=e.color; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.7,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=a; ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1;
    });
  }

  draw();
  state.rafId = requestAnimationFrame(loop);
}
