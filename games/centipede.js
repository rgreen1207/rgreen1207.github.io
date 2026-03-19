// ════════════════════════════════════════
// CENTIPEDE
// ════════════════════════════════════════
window.launchCentipede = function launchCentipede() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 20;
  const COLS = Math.floor(W/SZ), ROWS = Math.floor(H/SZ);

  // Build mushroom grid from hero blocks
  const rawBlocks = scrapeHeroBlocks();
  const mushGrid = new Map();
  rawBlocks.forEach(b => {
    const words = b.text.split(' ').filter(w => w.length > 0);
    const wordW = b.w / Math.max(words.length, 1);
    words.forEach((word, i) => {
      const gc = Math.round((b.x + i * wordW + wordW / 2) / SZ);
      const gr = Math.round(b.y / SZ);
      if (gc >= 1 && gc < COLS - 1 && gr >= 1 && gr < Math.floor(ROWS * 0.7)) {
        const key = `${gc},${gr}`;
        if (!mushGrid.has(key))
          mushGrid.set(key, { gc, gr, text: word.slice(0, 6), hp: 2, maxHp: 2, color: b.color });
      }
    });
  });

  // State machine: 'playing' | 'countdown'
  let phase = 'playing';
  let countdownEnd = 0;   // timestamp when countdown ends
  let countdownWave = 1;  // wave about to start

  let wave = 1;
  let moveInterval = 70;  // ms per centipede step

  // Wave N has exactly N segments (wave 1 = 1 seg)
  function makeCentipede(n) {
    return Array.from({ length: n }, (_, i) => ({
      gc: -(i + 1),
      gr: 0,
      dx: 1,
      px: -(i + 1) * SZ + SZ / 2,
      py: SZ / 2,
    }));
  }

  let segs = makeCentipede(wave);
  let moveTimer = 0;
  let lastTs = null;

  const ship = { px: W / 2, py: H - SZ * 3, spd: 3 };
  let bullets = [];
  let score = 0, lives = 3, dead = false;

  const keys = {};
  const kd = (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'playing' && bullets.length < 3)
        bullets.push({ x: ship.px, y: ship.py - SZ, vy: -9 });
    }
  };
  const ku = (e) => { keys[e.key] = false; };
  document.addEventListener('keydown', kd);
  document.addEventListener('keyup', ku);

  function mushAt(gc, gr) {
    const m = mushGrid.get(`${gc},${gr}`);
    return m && m.hp > 0;
  }

  function moveCentipede(dt) {
    moveTimer += dt;
    if (moveTimer < moveInterval) return;
    moveTimer = 0;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const ngc = seg.gc + seg.dx;
      if (ngc < 0 || ngc >= COLS || mushAt(ngc, seg.gr)) {
        seg.gr++;
        if (seg.gr >= ROWS) seg.gr = 1;
        seg.dx *= -1;
      } else {
        seg.gc = ngc;
      }
      seg.px = seg.gc * SZ + SZ / 2;
      seg.py = seg.gr * SZ + SZ / 2;
    }
  }

  function startCountdown() {
    phase = 'countdown';
    countdownWave = wave + 1;
    countdownEnd = performance.now() + 3000;
    segs = [];
    bullets = [];
    moveTimer = 0;
  }

  function startWave() {
    wave = countdownWave;
    moveInterval = Math.max(25, 70 - (wave - 1) * 3);
    segs = makeCentipede(wave);
    moveTimer = 0;
    phase = 'playing';
  }

  function loop(ts) {
    if (dead || state.killed) return;
    const dt = lastTs === null ? 16 : Math.min(ts - lastTs, 50);
    lastTs = ts;

    if (phase === 'countdown') {
      const remaining = Math.ceil((countdownEnd - ts) / 1000);
      if (ts >= countdownEnd) {
        startWave();
      } else {
        draw();
        // Draw countdown overlay
        ctx.fillStyle = 'rgba(13,15,20,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = ACCENT;
        ctx.font = `bold 22px 'JetBrains Mono',monospace`;
        ctx.fillText(`WAVE ${countdownWave}`, W / 2, H / 2 - 50);
        ctx.font = `bold 100px 'JetBrains Mono',monospace`;
        ctx.fillText(remaining, W / 2, H / 2 + 20);
        ctx.fillStyle = '#4a5568';
        ctx.font = `14px 'JetBrains Mono',monospace`;
        ctx.fillText(`${countdownWave} segment${countdownWave > 1 ? 's' : ''}`, W / 2, H / 2 + 90);
        ctx.textBaseline = 'alphabetic';
        hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>next wave: ${countdownWave}`;
      }
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // ── PLAYING ──

    // Ship movement
    if ((keys['ArrowLeft'] || keys['a'])  && ship.px > SZ)      ship.px -= ship.spd;
    if ((keys['ArrowRight'] || keys['d']) && ship.px < W - SZ)   ship.px += ship.spd;
    if ((keys['ArrowUp'] || keys['w'])    && ship.py > H * 0.65) ship.py -= ship.spd;
    if ((keys['ArrowDown'] || keys['s'])  && ship.py < H - SZ)   ship.py += ship.spd;

    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].vy;
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Bullet vs mushroom
    const hitBullets = new Set();
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
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      if (hitBullets.has(bi)) continue;
      const b = bullets[bi];
      for (let si = segs.length - 1; si >= 0; si--) {
        if (Math.hypot(b.x - segs[si].px, b.y - segs[si].py) < SZ * 0.7) {
          const s = segs[si];
          mushGrid.set(`${s.gc},${s.gr}`, { gc: s.gc, gr: s.gr, text: '☠', hp: 1, maxHp: 1, color: '#f87171' });
          segs.splice(si, 1);
          hitBullets.add(bi);
          score += 10;
          break;
        }
      }
    }
    [...hitBullets].sort((a, b) => b - a).forEach(i => bullets.splice(i, 1));

    // Wave cleared
    if (segs.length === 0) {
      startCountdown();
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // Centipede touches player
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      if (seg.px < 0 || seg.px > W) continue;
      if (Math.hypot(seg.px - ship.px, seg.py - ship.py) < SZ * 0.8) {
        lives--;
        if (lives <= 0) { end('The centipede got you!'); return; }
        segs = makeCentipede(wave);
        moveTimer = 0;
        break;
      }
    }

    draw();
    hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>wave: ${wave} (${wave} seg${wave > 1 ? 's' : ''})<br>↑↓←→ move · SPACE fire`;
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

    ctx.strokeStyle = '#1a1e28'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(0, H * 0.65); ctx.lineTo(W, H * 0.65); ctx.stroke();
    ctx.setLineDash([]);

    mushGrid.forEach(m => {
      if (m.hp <= 0) return;
      const a = m.hp / m.maxHp;
      const px = m.gc * SZ, py = m.gr * SZ;
      ctx.globalAlpha = a * 0.2; ctx.fillStyle = m.color; ctx.fillRect(px, py, SZ, SZ);
      ctx.globalAlpha = a; ctx.strokeStyle = m.color; ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, SZ - 1, SZ - 1);
      ctx.fillStyle = m.color;
      ctx.font = `${Math.min(11, SZ - 3)}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.text, px + SZ / 2, py + SZ / 2, SZ - 2);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    segs.forEach((seg, i) => {
      if (seg.px < -SZ || seg.px > W + SZ) return;
      ctx.fillStyle = i === 0 ? '#ffffff' : ACCENT;
      ctx.beginPath(); ctx.arc(seg.px, seg.py, SZ / 2 - 1, 0, Math.PI * 2); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#0d0f14';
        ctx.beginPath(); ctx.arc(seg.px - 4, seg.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(seg.px + 4, seg.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });

    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.moveTo(ship.px, ship.py - SZ / 2);
    ctx.lineTo(ship.px - SZ / 2, ship.py + SZ / 2);
    ctx.lineTo(ship.px + SZ / 2, ship.py + SZ / 2);
    ctx.closePath(); ctx.fill();

    bullets.forEach(b => { ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 7, 4, 14); });
  }

  draw();
  state.rafId = requestAnimationFrame(loop);
};
