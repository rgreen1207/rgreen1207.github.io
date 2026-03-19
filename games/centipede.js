// ════════════════════════════════════════
// CENTIPEDE
// ════════════════════════════════════════
window.launchCentipede = function launchCentipede() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 20;
  const COLS = Math.floor(W / SZ);
  const ROWS = Math.floor(H / SZ);
  const MAX_WAVE = 32;
  const BASE_SEGS = 10;
  const MUSH_ZONE_ROWS = Math.floor(ROWS * 0.65); // mushrooms live above this row

  // ── HERO TEXT — mushroom word list ──
  const rawBlocks = scrapeHeroBlocks();
  const wordPool = [];
  rawBlocks.forEach(b => {
    b.text.split(' ').filter(w => w.length > 0).forEach(w => wordPool.push(w.slice(0, 5)));
  });
  // Fallback pool if hero produces nothing
  const fallbackPool = ['Ryan','Green','FastAPI','Python','Redis','Docker','AWS','SQL','API','dev'];
  const allWords = wordPool.length >= 10 ? wordPool : fallbackPool;

  // ── MUSHROOM GRID ──
  let mushGrid = new Map(); // "gc,gr" -> { gc, gr, text, hp, maxHp, color }

  const MUSH_COLORS = ['#4ade80','#60a5fa','#fbbf24','#c084fc','#8892a4'];

  function buildMushrooms(w) {
    // Keep ☠ mushrooms from killed segments, rebuild the rest fresh each wave
    const newGrid = new Map();
    // Copy over ☠ remnants from previous wave
    mushGrid.forEach((m, key) => { if (m.text === '☠') newGrid.set(key, m); });

    // Scatter ~60 random mushrooms (more each wave up to 100)
    const count = Math.min(60 + (w - 1) * 3, 100);
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 8) {
      tries++;
      const gc = 1 + Math.floor(Math.random() * (COLS - 2));
      const gr = 1 + Math.floor(Math.random() * (MUSH_ZONE_ROWS - 2));
      const key = `${gc},${gr}`;
      if (!newGrid.has(key)) {
        const word = allWords[Math.floor(Math.random() * allWords.length)];
        const color = MUSH_COLORS[Math.floor(Math.random() * MUSH_COLORS.length)];
        newGrid.set(key, { gc, gr, text: word, hp: 2, maxHp: 2, color });
        placed++;
      }
    }
    mushGrid = newGrid;
  }

  // ── WAVE STATE ──
  let wave = 0;
  let phase = 'playing';
  let countdownTarget = 0;

  function waveSegCount(w) {
    return Math.min(BASE_SEGS + (w - 1), MAX_WAVE);
  }

  function waveSpeed(w) {
    return Math.max(22, 80 - (w - 1) * 2);
  }

  // ── CENTIPEDE ──
  let segs = [];
  let moveTimer = 0;

  function makeCentipede(n) {
    // Spawn all segments bunched together at the TOP LEFT, already on-screen
    // Row 0, columns 0..n-1, all moving right
    return Array.from({ length: n }, (_, i) => ({
      gc: i,        // start on screen from col 0
      gr: 0,
      dx: 1,
      px: i * SZ + SZ / 2,
      py: SZ / 2,
    }));
  }

  // ── SHIP / BULLETS ──
  const ship = { px: W / 2, py: H - SZ * 3, spd: 3 };
  let bullets = [];
  let score = 0, lives = 3, dead = false;
  let lastTs = null;

  function spawnWave(w) {
    wave = w;
    buildMushrooms(w);
    segs = makeCentipede(waveSegCount(w));
    moveTimer = 0;
    bullets = [];
    phase = 'playing';
  }

  spawnWave(1);

  const keys = {};
  const kd = (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'playing' && bullets.length < 3)
        bullets.push({ x: ship.px, y: ship.py - SZ, vy: -10 });
    }
  };
  const ku = (e) => { keys[e.key] = false; };
  document.addEventListener('keydown', kd);
  document.addEventListener('keyup', ku);

  // ── MUSHROOM COLLISION ──
  function mushAt(gc, gr) {
    const m = mushGrid.get(`${gc},${gr}`);
    return m && m.hp > 0;
  }

  function blockedAhead(gc, gr, dx) {
    const target = gc + dx;
    if (target < 0 || target >= COLS) return true;
    if (!mushAt(target, gr)) return false;
    // If more than 55% of this row has mushrooms, pass through to avoid lockup
    let count = 0;
    for (let c = 0; c < COLS; c++) if (mushAt(c, gr)) count++;
    return count < Math.floor(COLS * 0.55);
  }

  // ── MOVEMENT ──
  function moveCentipede(dt) {
    moveTimer += dt;
    const interval = waveSpeed(wave);
    if (moveTimer < interval) return;
    moveTimer = 0;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (blockedAhead(seg.gc, seg.gr, seg.dx)) {
        seg.gr = Math.min(seg.gr + 1, ROWS - 1);
        seg.dx *= -1;
      } else {
        seg.gc += seg.dx;
      }
      seg.px = seg.gc * SZ + SZ / 2;
      seg.py = seg.gr * SZ + SZ / 2;
    }
  }

  // ── MAIN LOOP ──
  function loop(ts) {
    if (dead || state.killed) return;
    const dt = lastTs === null ? 16 : Math.min(ts - lastTs, 50);
    lastTs = ts;

    // ── COUNTDOWN PHASE ──
    if (phase === 'countdown') {
      const nextWave = wave + 1;
      const remaining = Math.ceil((countdownTarget - ts) / 1000);

      draw();
      ctx.fillStyle = 'rgba(13,15,20,0.78)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 26px 'JetBrains Mono',monospace`;
      ctx.fillText(`WAVE ${nextWave} INCOMING`, W / 2, H / 2 - 60);
      ctx.font = `bold 110px 'JetBrains Mono',monospace`;
      ctx.fillText(Math.max(1, remaining), W / 2, H / 2 + 20);
      ctx.fillStyle = '#8892a4';
      ctx.font = `14px 'JetBrains Mono',monospace`;
      ctx.fillText(`${waveSegCount(nextWave)} segments`, W / 2, H / 2 + 95);
      ctx.textBaseline = 'alphabetic';
      hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>next: wave ${nextWave}`;

      if (ts >= countdownTarget) {
        spawnWave(nextWave);
      }
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // ── PLAYING PHASE ──

    // Ship movement (lower 35%)
    if ((keys['ArrowLeft']  || keys['a']) && ship.px > SZ)       ship.px -= ship.spd;
    if ((keys['ArrowRight'] || keys['d']) && ship.px < W - SZ)   ship.px += ship.spd;
    if ((keys['ArrowUp']    || keys['w']) && ship.py > H * 0.65) ship.py -= ship.spd;
    if ((keys['ArrowDown']  || keys['s']) && ship.py < H - SZ)   ship.py += ship.spd;

    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].vy;
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    const hitBullets = new Set();

    // Bullet vs mushroom
    for (let bi = 0; bi < bullets.length; bi++) {
      const b = bullets[bi];
      const gc = Math.floor(b.x / SZ), gr = Math.floor(b.y / SZ);
      const m = mushGrid.get(`${gc},${gr}`);
      if (m && m.hp > 0) {
        m.hp--;
        score += m.hp <= 0 ? 5 : 1;
        hitBullets.add(bi);
      }
    }

    moveCentipede(dt);

    // Bullet vs centipede
    for (let bi = 0; bi < bullets.length; bi++) {
      if (hitBullets.has(bi)) continue;
      const b = bullets[bi];
      for (let si = segs.length - 1; si >= 0; si--) {
        const seg = segs[si];
        if (Math.hypot(b.x - seg.px, b.y - seg.py) < SZ * 0.75) {
          mushGrid.set(`${seg.gc},${seg.gr}`, {
            gc: seg.gc, gr: seg.gr, text: '☠', hp: 1, maxHp: 1, color: '#f87171'
          });
          segs.splice(si, 1);
          hitBullets.add(bi);
          score += 10;
          break;
        }
      }
    }

    // Remove hit bullets (reverse order to preserve indices)
    [...hitBullets].sort((a, b) => b - a).forEach(i => bullets.splice(i, 1));

    // Wave complete
    if (segs.length === 0) {
      if (wave >= MAX_WAVE) {
        drawVictory(); return;
      }
      phase = 'countdown';
      countdownTarget = ts + 3000;
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // Centipede touches player
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      if (Math.hypot(seg.px - ship.px, seg.py - ship.py) < SZ * 0.85) {
        lives--;
        if (lives <= 0) { end('The centipede got you!'); return; }
        segs = makeCentipede(waveSegCount(wave));
        moveTimer = 0;
        bullets = [];
        break;
      }
    }

    draw();
    const n = waveSegCount(wave);
    hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>wave: ${wave}/${MAX_WAVE}<br>${n} segs<br>↑↓←→ · SPACE fire`;
    state.rafId = requestAnimationFrame(loop);
  }

  function end(msg) {
    dead = true;
    document.removeEventListener('keydown', kd);
    document.removeEventListener('keyup', ku);
    draw();
    showGameOver(ctx, W, H, msg, score, cleanup, launchCentipede);
  }

  function draw() {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#252a38'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(0, H * 0.65); ctx.lineTo(W, H * 0.65); ctx.stroke();
    ctx.setLineDash([]);

    // Mushrooms
    mushGrid.forEach(m => {
      if (m.hp <= 0) return;
      const a = m.hp / m.maxHp;
      const px = m.gc * SZ, py = m.gr * SZ;
      ctx.globalAlpha = a * 0.2; ctx.fillStyle = m.color;
      ctx.fillRect(px, py, SZ, SZ);
      ctx.globalAlpha = a; ctx.strokeStyle = m.color; ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, SZ - 1, SZ - 1);
      ctx.fillStyle = m.color;
      ctx.font = `${Math.min(10, SZ - 3)}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.text, px + SZ / 2, py + SZ / 2, SZ - 2);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    // Centipede
    segs.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : ACCENT;
      ctx.beginPath(); ctx.arc(seg.px, seg.py, SZ / 2 - 1, 0, Math.PI * 2); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#0d0f14';
        ctx.beginPath(); ctx.arc(seg.px - 4, seg.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(seg.px + 4, seg.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Ship
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.moveTo(ship.px, ship.py - SZ / 2);
    ctx.lineTo(ship.px - SZ / 2, ship.py + SZ / 2);
    ctx.lineTo(ship.px + SZ / 2, ship.py + SZ / 2);
    ctx.closePath(); ctx.fill();

    // Bullets
    bullets.forEach(b => { ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 7, 4, 14); });
  }

  function drawVictory() {
    draw();
    ctx.fillStyle = 'rgba(13,15,20,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT; ctx.font = `bold 44px 'JetBrains Mono',monospace`;
    ctx.fillText('YOU WIN!', W / 2, H / 2 - 60);
    ctx.fillStyle = '#e2e8f0'; ctx.font = `18px 'JetBrains Mono',monospace`;
    ctx.fillText('All 32 waves cleared.', W / 2, H / 2 - 10);
    ctx.fillStyle = ACCENT; ctx.font = `16px 'JetBrains Mono',monospace`;
    ctx.fillText(`Final score: ${score}`, W / 2, H / 2 + 30);
    ctx.fillStyle = '#4a5568'; ctx.font = `13px 'JetBrains Mono',monospace`;
    ctx.fillText('R to play again  ·  ESC to quit', W / 2, H / 2 + 70);
    ctx.textBaseline = 'alphabetic';
    const rH = (e) => {
      if (e.key === 'r' || e.key === 'R') { document.removeEventListener('keydown', rH); cleanup(); launchCentipede(); }
      if (e.key === 'Escape') { document.removeEventListener('keydown', rH); cleanup(); }
    };
    document.addEventListener('keydown', rH);
  }

  draw();
  state.rafId = requestAnimationFrame(loop);
};
