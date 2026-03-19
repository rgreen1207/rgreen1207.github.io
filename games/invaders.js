// ════════════════════════════════════════
// SPACE INVADERS — hero blocks as the invader fleet
// ════════════════════════════════════════
function launchInvaders() {
  const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
  const ACCENT = getAccent();

  // Each hero block becomes an invader, positioned where it appears on page
  const rawBlocks = scrapeHeroBlocks();
  // Sort by Y then X to form natural rows
  rawBlocks.sort((a, b) => a.y - b.y || a.x - b.x);

  // Build invader grid: place them in formation at the top, but preserve their text labels
  const COLS_I = Math.min(8, Math.ceil(rawBlocks.length / 3));
  const ROWS_I = Math.ceil(rawBlocks.length / COLS_I);
  const padX = W * 0.07, colW = (W * 0.86) / COLS_I;
  const startY = 60, rowH = 52;

  const invaders = rawBlocks.map((b, i) => ({
    x: padX + (i % COLS_I) * colW + colW / 2,
    y: startY + Math.floor(i / COLS_I) * rowH,
    w: Math.min(colW - 10, b.w + 20),
    h: 30,
    text: b.text,
    color: b.color,
    hp: b.maxHp,
    maxHp: b.maxHp,
    alive: true,
  }));

  let invDir = 1, invSpd = 0.5;
  const ship = { x: W / 2, y: H - 60, speed: 6 };
  const bullets = [], enemyBullets = [];
  let score = 0, lives = 3, dead = false, won = false;
  let lastEnemyShot = 0;

  const keys = {};
  const kd = (e) => {
    keys[e.key] = true;
    if (e.key === ' ') { e.preventDefault(); if (bullets.length < 4) bullets.push({ x: ship.x, y: ship.y - 20, vy: -12 }); }
  };
  const ku = (e) => { keys[e.key] = false; };
  document.addEventListener('keydown', kd);
  document.addEventListener('keyup', ku);

  function loop(ts) {
    if (dead || won) return;

    // Ship movement
    if ((keys['ArrowLeft'] || keys['a']) && ship.x > 24) ship.x -= ship.speed;
    if ((keys['ArrowRight'] || keys['d']) && ship.x < W - 24) ship.x += ship.speed;

    // Move invaders
    const alive = invaders.filter(i => i.alive);
    let edge = false;
    alive.forEach(inv => { inv.x += invDir * invSpd; if (inv.x < 50 || inv.x > W - 50) edge = true; });
    if (edge) { invDir *= -1; alive.forEach(inv => { inv.y += 22; }); invSpd = Math.min(invSpd + 0.05, 3); }

    // Enemy fire
    if (ts - lastEnemyShot > 1000 && alive.length) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      enemyBullets.push({ x: shooter.x, y: shooter.y + shooter.h / 2, vy: 5 });
      lastEnemyShot = ts;
    }

    // Move bullets
    bullets.forEach(b => b.y += b.vy);
    enemyBullets.forEach(b => b.y += b.vy);

    // Player bullet vs invader
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let ii = 0; ii < invaders.length; ii++) {
        const inv = invaders[ii];
        if (!inv.alive) continue;
        if (b.x > inv.x - inv.w/2 && b.x < inv.x + inv.w/2 && b.y > inv.y - inv.h/2 && b.y < inv.y + inv.h/2) {
          inv.hp--;
          if (inv.hp <= 0) { inv.alive = false; score += 20; }
          else score += 5;
          bullets.splice(bi, 1);
          break;
        }
      }
    }

    // Enemy bullet vs ship
    for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
      const b = enemyBullets[bi];
      if (Math.hypot(b.x - ship.x, b.y - ship.y) < 22) {
        lives--;
        enemyBullets.splice(bi, 1);
        if (lives <= 0) { end('You got hit too many times!'); return; }
      }
    }

    // Invader reaches bottom
    if (alive.some(inv => inv.y > H - 80)) { end('They reached the bottom!'); return; }

    // Win
    if (!alive.length) { won = true; drawWin(); return; }

    // Cull offscreen bullets
    for (let i = bullets.length-1; i >= 0; i--) if (bullets[i].y < 0) bullets.splice(i, 1);
    for (let i = enemyBullets.length-1; i >= 0; i--) if (enemyBullets[i].y > H) enemyBullets.splice(i, 1);

    draw();
    hud.innerHTML = `INVADERS<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>←→ move · SPACE fire`;
    requestAnimationFrame(loop);
  }

  function end(msg) {
    dead = true;
    document.removeEventListener('keydown', kd);
    document.removeEventListener('keyup', ku);
    draw();
    showGameOver(ctx, W, H, msg, score, cleanup, launchInvaders);
  }

  function draw() {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);

    invaders.forEach(inv => {
      if (!inv.alive) return;
      const a = inv.hp / inv.maxHp;
      ctx.globalAlpha = a * 0.25;
      ctx.fillStyle = inv.color; ctx.fillRect(inv.x - inv.w/2, inv.y - inv.h/2, inv.w, inv.h);
      ctx.globalAlpha = a * 0.8;
      ctx.strokeStyle = inv.color; ctx.lineWidth = 1;
      ctx.strokeRect(inv.x - inv.w/2 + 0.5, inv.y - inv.h/2 + 0.5, inv.w - 1, inv.h - 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = inv.color;
      ctx.font = `${Math.min(12, inv.w / inv.text.length * 1.5)}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(inv.text, inv.x, inv.y, inv.w - 4);
      // Eyes
      ctx.fillStyle = '#f87171'; ctx.globalAlpha = a;
      ctx.fillRect(inv.x - 8, inv.y + inv.h/2 + 2, 4, 4);
      ctx.fillRect(inv.x + 4, inv.y + inv.h/2 + 2, 4, 4);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    // Ground line
    ctx.strokeStyle = '#252a38'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40); ctx.stroke();

    // Ship
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.moveTo(ship.x, ship.y - 22); ctx.lineTo(ship.x - 18, ship.y + 10); ctx.lineTo(ship.x + 18, ship.y + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ship.x, ship.y - 8, 4, 0, Math.PI * 2); ctx.fill();

    // Bullets
    bullets.forEach(b => { ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 8, 4, 16); });
    enemyBullets.forEach(b => { ctx.fillStyle = '#f87171'; ctx.fillRect(b.x - 2, b.y - 6, 4, 12); });
  }

  function drawWin() {
    ctx.fillStyle = 'rgba(13,15,20,0.92)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT; ctx.font = "bold 40px 'JetBrains Mono',monospace";
    ctx.fillText('YOU WIN!', W/2, H/2 - 40);
    ctx.fillStyle = '#e2e8f0'; ctx.font = "16px 'JetBrains Mono',monospace";
    ctx.fillText('Score: ' + score, W/2, H/2 + 10);
    ctx.fillStyle = '#4a5568'; ctx.font = "13px 'JetBrains Mono',monospace";
    ctx.fillText('R to restart  ·  ESC to quit', W/2, H/2 + 50);
    ctx.textBaseline = 'alphabetic';
    const rH = (e) => { if (e.key==='r'||e.key==='R') { document.removeEventListener('keydown',rH); cleanup(); launchInvaders(); } };
    document.addEventListener('keydown', rH);
  }

  draw();
  requestAnimationFrame(loop);
}
