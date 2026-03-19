// ════════════════════════════════════════
// MISSILE COMMAND — defend your hero content
// ════════════════════════════════════════
function launchMissile() {
  const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
  const ACCENT = getAccent();

  // Hero blocks become cities/targets to defend — distributed along the bottom
  const rawBlocks = scrapeHeroBlocks();
  // Evenly space them at the bottom regardless of their original positions
  const cityDefs = rawBlocks.slice(0, 10);
  const cityPad = W * 0.08;
  const citySpacing = (W - cityPad * 2) / Math.max(cityDefs.length - 1, 1);

  const cities = cityDefs.map((b, i) => ({
    x: cityPad + i * citySpacing,
    y: H - 50,
    label: b.text.slice(0, 12),
    color: b.color,
    alive: true,
    hp: b.maxHp,
    maxHp: b.maxHp,
  }));

  // If somehow no blocks, add fallback cities
  if (!cities.length) {
    ['Python', 'FastAPI', 'Redis', 'PostgreSQL', 'AWS', 'Docker'].forEach((label, i) => {
      cities.push({ x: W * 0.1 + i * (W * 0.8 / 5), y: H - 50, label, color: ACCENT, alive: true, hp: 2, maxHp: 2 });
    });
  }

  // Three missile bases evenly spread
  const bases = [
    { x: W * 0.2, ammo: 12 },
    { x: W * 0.5, ammo: 12 },
    { x: W * 0.8, ammo: 12 },
  ];
  let activeBase = 1; // middle base selected by default

  const inMissiles  = [];  // incoming enemy
  const myMissiles  = [];  // player fired
  const explosions  = [];
  let score = 0, wave = 1, dead = false;
  let lastSpawn = -2000, spawnInterval = 2000;
  let waveActive = true;
  const MISSILES_PER_WAVE = () => 4 + wave * 2;
  let missilesFiredThisWave = 0;

  // Click / key to fire from nearest base
  const clickH = (e) => {
    const rect = canvas.getBoundingClientRect();
    const tx = e.clientX - rect.left, ty = e.clientY - rect.top;
    fireAt(tx, ty);
  };

  function fireAt(tx, ty) {
    const base = bases[activeBase];
    if (base.ammo <= 0) {
      // Try other bases
      for (let i = 0; i < bases.length; i++) {
        if (bases[i].ammo > 0) { activeBase = i; break; }
      }
      if (bases[activeBase].ammo <= 0) return;
    }
    const b = bases[activeBase];
    const dist = Math.hypot(tx - b.x, ty - b.y) || 1;
    const spd = 9;
    myMissiles.push({ sx: b.x, sy: b.y - 15, x: b.x, y: b.y - 15, vx: (tx-b.x)/dist*spd, vy: (ty-b.y)/dist*spd, tx, ty });
    b.ammo--;
  }

  canvas.addEventListener('click', clickH);

  // Keyboard: 1/2/3 selects base, space fires upward from active base
  const kd = (e) => {
    if (e.key === '1') activeBase = 0;
    if (e.key === '2') activeBase = 1;
    if (e.key === '3') activeBase = 2;
    if (e.key === ' ') { e.preventDefault(); fireAt(bases[activeBase].x, H * 0.3); }
  };
  document.addEventListener('keydown', kd);

  function spawnEnemy(ts) {
    if (!waveActive) return;
    if (missilesFiredThisWave >= MISSILES_PER_WAVE()) return;
    if (ts - lastSpawn < spawnInterval) return;
    lastSpawn = ts;

    const aliveCities = cities.filter(c => c.alive);
    if (!aliveCities.length) return;

    const target = aliveCities[Math.floor(Math.random() * aliveCities.length)];
    const sx = Math.random() * W;
    const sy = 0;
    const dist = Math.hypot(target.x - sx, target.y - sy) || 1;
    const spd = 1.0 + wave * 0.25;
    inMissiles.push({ x: sx, y: sy, vx: (target.x-sx)/dist*spd, vy: (target.y-sy)/dist*spd, target });
    missilesFiredThisWave++;
    spawnInterval = Math.max(600, spawnInterval - 80);
  }

  function loop(ts) {
    if (dead) return;

    spawnEnemy(ts);

    // Move
    inMissiles.forEach(m => { m.x += m.vx; m.y += m.vy; });
    myMissiles.forEach(m => { m.x += m.vx; m.y += m.vy; });

    // Explosions
    explosions.forEach(e => { e.r += 4; e.life--; });
    for (let i = explosions.length-1; i >= 0; i--) if (explosions[i].life <= 0) explosions.splice(i, 1);

    // My missile reaches target
    for (let i = myMissiles.length-1; i >= 0; i--) {
      const m = myMissiles[i];
      if (Math.hypot(m.x - m.tx, m.y - m.ty) < 12) {
        explosions.push({ x: m.tx, y: m.ty, r: 6, life: 28, color: ACCENT });
        myMissiles.splice(i, 1);
      }
    }

    // Explosion intercepts incoming
    explosions.forEach(exp => {
      for (let i = inMissiles.length-1; i >= 0; i--) {
        if (Math.hypot(inMissiles[i].x - exp.x, inMissiles[i].y - exp.y) < exp.r + 4) {
          inMissiles.splice(i, 1); score += 25;
        }
      }
    });

    // Incoming hits city
    for (let i = inMissiles.length-1; i >= 0; i--) {
      const m = inMissiles[i];
      const city = m.target;
      if (city.alive && Math.hypot(m.x - city.x, m.y - city.y) < 28) {
        city.hp--;
        explosions.push({ x: city.x, y: city.y, r: 8, life: 35, color: '#f87171' });
        inMissiles.splice(i, 1);
        if (city.hp <= 0) { city.alive = false; }
        continue;
      }
      if (m.y > H) inMissiles.splice(i, 1);
    }

    // All cities gone
    if (!cities.some(c => c.alive)) {
      end('Infrastructure destroyed!'); return;
    }

    // Wave clear
    if (missilesFiredThisWave >= MISSILES_PER_WAVE() && inMissiles.length === 0 && myMissiles.length === 0 && explosions.length === 0) {
      wave++;
      missilesFiredThisWave = 0;
      spawnInterval = Math.max(600, 2000 - wave * 100);
      lastSpawn = -9999;
      // Refill ammo
      bases.forEach(b => { b.ammo = Math.min(b.ammo + 8, 15); });
      score += 100 * wave;
    }

    draw(ts);
    const totalAmmo = bases.reduce((s, b) => s + b.ammo, 0);
    hud.innerHTML = `MISSILE CMD<br>score: ${score}<br>wave: ${wave}<br>ammo: ${totalAmmo}<br>1/2/3 base · CLICK fire`;
    requestAnimationFrame(loop);
  }

  function end(msg) {
    dead = true;
    canvas.removeEventListener('click', clickH);
    document.removeEventListener('keydown', kd);
    draw(0);
    showGameOver(ctx, W, H, msg, score, cleanup, launchMissile);
  }

  function draw(ts) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#060810'); sky.addColorStop(1, '#0d0f14');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#252a38';
    for (let i = 0; i < 80; i++) ctx.fillRect((i * 137 + 7) % W, (i * 97 + 13) % (H * 0.85), 1, 1);

    // Ground
    ctx.fillStyle = '#13161e'; ctx.fillRect(0, H - 36, W, 36);
    ctx.strokeStyle = '#252a38'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H-36); ctx.lineTo(W, H-36); ctx.stroke();

    // Cities
    cities.forEach(c => {
      if (!c.alive) return;
      const a = c.hp / c.maxHp;
      // Building silhouette
      ctx.globalAlpha = a;
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x - 18, H - 36, 36, 14);
      ctx.fillRect(c.x - 10, H - 50, 20, 14);
      ctx.fillRect(c.x - 5, H - 62, 10, 12);
      // Label
      ctx.font = "10px 'JetBrains Mono',monospace";
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(c.label, c.x, H - 38);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    // Missile bases
    bases.forEach((base, i) => {
      const isActive = i === activeBase;
      ctx.fillStyle = isActive ? ACCENT : '#4a5568';
      ctx.fillRect(base.x - 18, H - 36, 36, 12);
      ctx.fillRect(base.x - 4, H - 46, 8, 10);
      // Ammo indicator
      ctx.fillStyle = isActive ? '#ffffff' : '#6b7a90';
      ctx.font = "9px 'JetBrains Mono',monospace";
      ctx.textAlign = 'center'; ctx.fillText(`[${i+1}] ${base.ammo}`, base.x, H - 24);
    });

    // Incoming missiles — red trails
    inMissiles.forEach(m => {
      const trailLen = 40;
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(m.x - m.vx * trailLen/Math.hypot(m.vx,m.vy), m.y - m.vy * trailLen/Math.hypot(m.vx,m.vy));
      ctx.lineTo(m.x, m.y); ctx.stroke();
      ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI*2); ctx.fill();
    });

    // My missiles — white trails from source
    myMissiles.forEach(m => {
      ctx.strokeStyle = '#6b7a90'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.sx, m.sy); ctx.lineTo(m.x, m.y); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI*2); ctx.fill();
    });

    // Explosions
    explosions.forEach(e => {
      const a = e.life / 28;
      ctx.globalAlpha = a * 0.3; ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.6, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = a; ctx.strokeStyle = e.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Crosshair on cursor — subtle
    ctx.strokeStyle = 'rgba(74,222,128,0.2)'; ctx.lineWidth = 1;
  }

  draw(0);
  requestAnimationFrame(loop);
}
