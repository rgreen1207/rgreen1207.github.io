// ════════════════════════════════════════
// CENTIPEDE — hero text as mushroom field
// ════════════════════════════════════════
function launchCentipede() {
  const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 22;

  // Build mushroom field from hero blocks — each word becomes a mushroom
  const rawBlocks = scrapeHeroBlocks();
  const mushrooms = [];
  rawBlocks.forEach(b => {
    // Split text into individual word mushrooms
    const words = b.text.split(' ').filter(w => w.length > 0);
    const wordW = b.w / words.length;
    words.forEach((word, i) => {
      const mx = Math.round((b.x + i * wordW + wordW/2) / SZ) * SZ;
      const my = Math.round(b.y / SZ) * SZ;
      if (mx > SZ && mx < W - SZ && my > SZ && my < H - SZ * 3) {
        mushrooms.push({ x: mx, y: my, text: word, hp: 2, maxHp: 2, color: b.color });
      }
    });
  });

  // Centipede segments
  const SEG_N = 14;
  function makeCentipede() {
    return Array.from({ length: SEG_N }, (_, i) => ({ x: -i * SZ, y: SZ, dx: 1 }));
  }
  let centipede = makeCentipede();
  let wave = 1, segSpeed = 1.8;

  const ship = { x: W / 2, y: H - 50, speed: 4 };
  const bullets = [];
  let score = 0, lives = 3, dead = false;

  const keys = {};
  const kd = (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
      e.preventDefault();
      if (bullets.length < 3) bullets.push({ x: ship.x, y: ship.y - SZ, vy: -10 });
    }
  };
  const ku = (e) => { keys[e.key] = false; };
  document.addEventListener('keydown', kd);
  document.addEventListener('keyup', ku);

  function isMush(gx, gy) {
    return mushrooms.some(m => m.hp > 0 && Math.abs(m.x - gx) < SZ * 0.7 && Math.abs(m.y - gy) < SZ * 0.7);
  }

  function loop() {
    if (dead) return;

    // Ship movement — confined to lower third
    if ((keys['ArrowLeft'] || keys['a']) && ship.x > SZ) ship.x -= ship.speed;
    if ((keys['ArrowRight'] || keys['d']) && ship.x < W - SZ) ship.x += ship.speed;
    if ((keys['ArrowUp'] || keys['w']) && ship.y > H * 0.65) ship.y -= ship.speed;
    if ((keys['ArrowDown'] || keys['s']) && ship.y < H - SZ) ship.y += ship.speed;

    // Move bullets
    bullets.forEach(b => b.y += b.vy);
    for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].y < 0) bullets.splice(i, 1);

    // Bullet vs mushroom
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let mi = 0; mi < mushrooms.length; mi++) {
        const m = mushrooms[mi];
        if (m.hp <= 0) continue;
        if (Math.abs(b.x - m.x) < SZ * 0.7 && Math.abs(b.y - m.y) < SZ * 0.7) {
          m.hp--;
          score += m.hp <= 0 ? 5 : 1;
          bullets.splice(bi, 1);
          break;
        }
      }
    }

    // Move centipede
    for (let si = 0; si < centipede.length; si++) {
      const seg = centipede[si];
      const nx = seg.x + seg.dx * segSpeed;
      const hitWallOrEdge = nx < SZ/2 || nx > W - SZ/2 || isMush(nx, seg.y);
      if (hitWallOrEdge) {
        seg.y += SZ;
        seg.dx *= -1;
        if (seg.y >= H) { seg.y = SZ; }
      } else {
        seg.x = nx;
      }
    }

    // Bullet vs centipede
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let si = centipede.length - 1; si >= 0; si--) {
        const seg = centipede[si];
        if (Math.hypot(b.x - seg.x, b.y - seg.y) < SZ * 0.7) {
          bullets.splice(bi, 1);
          score += 10;
          mushrooms.push({ x: Math.round(seg.x / SZ) * SZ, y: Math.round(seg.y / SZ) * SZ, text: '☠', hp: 1, maxHp: 1, color: '#f87171' });
          centipede.splice(si, 1);
          break;
        }
      }
    }

    // Centipede reaches player zone — lose a life
    for (let si = centipede.length - 1; si >= 0; si--) {
      const seg = centipede[si];
      if (Math.hypot(seg.x - ship.x, seg.y - ship.y) < SZ) {
        lives--;
        if (lives <= 0) { end('The centipede got you!'); return; }
        centipede = makeCentipede(); break;
      }
    }

    // New wave when centipede is gone
    if (centipede.length === 0) {
      wave++; segSpeed = Math.min(segSpeed + 0.4, 4);
      centipede = makeCentipede();
    }

    draw();
    hud.innerHTML = `CENTIPEDE<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>wave: ${wave}<br>↑↓←→ move · SPACE fire`;
    requestAnimationFrame(loop);
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

    // Player zone indicator
    ctx.strokeStyle = '#1a1e28'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(0, H * 0.65); ctx.lineTo(W, H * 0.65); ctx.stroke();
    ctx.setLineDash([]);

    // Mushrooms
    mushrooms.forEach(m => {
      if (m.hp <= 0) return;
      const a = m.hp / m.maxHp;
      ctx.globalAlpha = a * 0.3; ctx.fillStyle = m.color;
      ctx.fillRect(m.x - SZ/2, m.y - SZ/2, SZ, SZ);
      ctx.globalAlpha = a; ctx.fillStyle = m.color;
      ctx.font = `${SZ - 4}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.text.slice(0, 4), m.x, m.y, SZ);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    // Centipede
    centipede.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead ? '#ffffff' : ACCENT;
      ctx.beginPath(); ctx.arc(seg.x, seg.y, SZ/2 - 1, 0, Math.PI * 2); ctx.fill();
      if (isHead) {
        ctx.fillStyle = '#0d0f14';
        ctx.beginPath(); ctx.arc(seg.x - 5, seg.y - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(seg.x + 5, seg.y - 4, 3, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Ship
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - SZ/2); ctx.lineTo(ship.x - SZ/2, ship.y + SZ/2); ctx.lineTo(ship.x + SZ/2, ship.y + SZ/2);
    ctx.closePath(); ctx.fill();

    // Bullets
    bullets.forEach(b => { ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 8, 4, 16); });
  }

  draw();
  requestAnimationFrame(loop);
}
