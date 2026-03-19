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

  // ── MUSHROOM FIELD from hero blocks ──
  const rawBlocks = scrapeHeroBlocks();
  const mushGrid = new Map(); // "gc,gr" -> { gc, gr, text, hp, maxHp, color }

  rawBlocks.forEach(b => {
    const words = b.text.split(' ').filter(w => w.length > 0);
    const wordW = b.w / Math.max(words.length, 1);
    words.forEach((word, i) => {
      const gc = Math.round((b.x + i * wordW + wordW / 2) / SZ);
      const gr = Math.round(b.y / SZ);
      const maxGr = Math.floor(ROWS * 0.65); // keep mushrooms out of player zone
      if (gc >= 1 && gc < COLS - 1 && gr >= 1 && gr < maxGr) {
        const key = `${gc},${gr}`;
        if (!mushGrid.has(key))
          mushGrid.set(key, { gc, gr, text: word.slice(0, 5), hp: 2, maxHp: 2, color: b.color });
      }
    });
  });

  // ── WAVE STATE ──
  let wave = 1;
  let phase = 'playing'; // 'playing' | 'countdown'
  let countdownTarget = 0;

  function waveSegCount(w) {
    // Wave 1 = BASE_SEGS, wave 2 = BASE_SEGS+1, ..., capped at MAX_WAVE
    return Math.min(BASE_SEGS + (w - 1), MAX_WAVE);
  }

  function waveSpeed(w) {
    // Starts at 75ms per step, gets faster each wave, floor 22ms
    return Math.max(22, 75 - (w - 1) * 2);
  }

  // ── CENTIPEDE ──
  let segs = [];
  let moveTimer = 0;

  function makeCentipede(n) {
    // All segments start off the left edge of row 0, head first
    return Array.from({ length: n }, (_, i) => ({
      gc: -(i + 1),
      gr: 0,
      dx: 1, // moving right
      px: -(i + 1) * SZ + SZ / 2,
      py: SZ / 2,
    }));
  }

  function spawnWave(w) {
    wave = w;
    segs = makeCentipede(waveSegCount(w));
    moveTimer = 0;
    bullets = [];
    phase = 'playing';
  }

  spawnWave(1);

  // ── SHIP ──
  const ship = { px: W / 2, py: H - SZ * 3, spd: 3 };
  let bullets = [];
  let score = 0, lives = 3, dead = false;
  let lastTs = null;

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

  // ── MUSHROOM HELPERS ──
  function mushAt(gc, gr) {
    // Centipede can pass through mushrooms if the entire row is blocked
    // to prevent infinite downward spiral — only block if < 80% of row is mushrooms
    const m = mushGrid.get(`${gc},${gr}`);
    return m && m.hp > 0;
  }

  function rowBlockedAhead(gc, gr, dx) {
    // Check if moving dx from gc hits a wall; if whole row is mushrooms, ignore
    const target = gc + dx;
    if (target < 0 || target >= COLS) return true;
    if (!mushAt(target, gr)) return false;
    // Count mushrooms in this row — if more than 60% filled, pass through
    let count = 0;
    for (let c = 0; c < COLS; c++) if (mushAt(c, gr)) count++;
    return count < Math.floor(COLS * 0.6);
  }

  // ── CENTIPEDE MOVEMENT ──
  function moveCentipede(dt) {
    moveTimer += dt;
    const interval = waveSpeed(wave);
    if (moveTimer < interval) return;
    moveTimer = 0;

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (rowBlockedAhead(seg.gc, seg.gr, seg.dx)) {
        // Drop one row and reverse
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

    // Countdown between waves
    if (phase === 'countdown') {
      draw();
      const remaining = Math.ceil((countdownTarget - ts) / 1000);
      const nextWave = wave + 1;
      ctx.fillStyle = 'rgba(13,15,20,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 24px 'JetBrains Mono',monospace`;
      ctx.fillText(`WAVE ${nextWave}`, W / 2, H / 2 - 55);
      ctx.font = `bold 96px 'JetBrains Mono',monospace`;
      ctx.fillText(Math.max(1, remaining), W / 2, H / 2 + 20);
      ctx.fillStyle = '#8892a4';
      ctx.font = `14px 'JetBrains Mono',monospace`;
      ctx.fillText(`${waveSegCount(nextWave)} segments`, W / 2, H / 2 + 88);
      ctx.textBaseline = 'alphabetic';
      hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>next: wave ${nextWave}`;

      if (ts >= countdownTarget) spawnWave(nextWave);
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // Ship movement (lower 35% of screen)
    if ((keys['ArrowLeft']  || keys['a']) && ship.px > SZ)       ship.px -= ship.spd;
    if ((keys['ArrowRight'] || keys['d']) && ship.px < W - SZ)   ship.px += ship.spd;
    if ((keys['ArrowUp']    || keys['w']) && ship.py > H * 0.65) ship.py -= ship.spd;
    if ((keys['ArrowDown']  || keys['s']) && ship.py < H - SZ)   ship.py += ship.spd;

    // Move bullets up
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].vy;
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Collect hit bullet indices (process collisions before removing)
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

    // Bullet vs centipede segment
    for (let bi = 0; bi < bullets.length; bi++) {
      if (hitBullets.has(bi)) continue;
      const b = bullets[bi];
      for (let si = segs.length - 1; si >= 0; si--) {
        const seg = segs[si];
        if (seg.px < -SZ || seg.px > W + SZ) continue; // off-screen
        if (Math.hypot(b.x - seg.px, b.y - seg.py) < SZ * 0.75) {
          // Killed segment becomes a mushroom
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

    // Remove hit bullets (reverse order)
    [...hitBullets].sort((a, b) => b - a).forEach(i => bullets.splice(i, 1));

    // Wave complete
    if (segs.length === 0) {
      if (wave >= MAX_WAVE) {
        // Player beat all 32 waves
        drawVictory();
        return;
      }
      phase = 'countdown';
      countdownTarget = ts + 3000;
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    // Centipede touches player (on-screen only)
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      if (seg.px < 0 || seg.px > W) continue;
      if (Math.hypot(seg.px - ship.px, seg.py - ship.py) < SZ * 0.85) {
        lives--;
        if (lives <= 0) { end('The centipede got you!'); return; }
        // Respawn centipede for this wave, keep score and mushrooms
        segs = makeCentipede(waveSegCount(wave));
        moveTimer = 0;
        bullets = [];
        break;
      }
    }

    draw();
    const n = waveSegCount(wave);
    hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>wave: ${wave}/${MAX_WAVE}<br>${n} segments<br>↑↓←→ · SPACE fire`;
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

    // Player zone line
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

    // Centipede segments
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

    // Ship
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.moveTo(ship.px, ship.py - SZ / 2);
    ctx.lineTo(ship.px - SZ / 2, ship.py + SZ / 2);
    ctx.lineTo(ship.px + SZ / 2, ship.py + SZ / 2);
    ctx.closePath(); ctx.fill();

    // Bullets
    bullets.forEach(b => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - 2, b.y - 7, 4, 14);
    });
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
