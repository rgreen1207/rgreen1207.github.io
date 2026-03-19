// ════════════════════════════════════════
// SNAKE — hero text as destructible walls
// ════════════════════════════════════════
window.launchSnake = function launchSnake() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 16;
  const COLS = Math.floor(W / SZ), ROWS = Math.floor(H / SZ);

  // Build wall blocks — store exact grid bounds on each block at creation time
  const rawBlocks = scrapeHeroBlocks();
  const wallBlocks = []; // { gx1, gy1, gx2, gy2, text, color, fontSize, hp, maxHp, alive }

  rawBlocks.forEach(b => {
    const gx1 = Math.floor(b.x / SZ);
    const gy1 = Math.floor(b.y / SZ);
    const gx2 = Math.ceil((b.x + b.w) / SZ);
    const gy2 = Math.ceil((b.y + b.h) / SZ);
    wallBlocks.push({
      gx1, gy1, gx2, gy2,
      // Pixel rect derived from grid (these are what we draw — matches collision exactly)
      px: gx1 * SZ, py: gy1 * SZ,
      pw: (gx2 - gx1) * SZ, ph: (gy2 - gy1) * SZ,
      text: b.text, color: b.color, fontSize: b.fontSize,
      hp: b.hp, maxHp: b.maxHp, alive: true,
    });
  });

  // Build lookup grid from stored bounds
  const wallGrid = new Map(); // "gx,gy" -> wallBlock
  wallBlocks.forEach(b => {
    for (let gx = b.gx1; gx < b.gx2; gx++)
      for (let gy = b.gy1; gy < b.gy2; gy++)
        wallGrid.set(`${gx},${gy}`, b);
  });

  function isWall(gx, gy) {
    const b = wallGrid.get(`${gx},${gy}`);
    return b && b.alive;
  }

  function damageWall(gx, gy) {
    const b = wallGrid.get(`${gx},${gy}`);
    if (!b || !b.alive) return;
    b.hp--;
    if (b.hp <= 0) {
      b.alive = false;
      // Remove all cells for this block
      for (let x = b.gx1; x < b.gx2; x++)
        for (let y = b.gy1; y < b.gy2; y++)
          wallGrid.delete(`${x},${y}`);
    }
  }

  // Start snake at bottom-center, clear of walls
  let sx = Math.floor(COLS / 2), sy = ROWS - 5;
  while (sy > 1 && isWall(sx, sy)) sy--;

  let snake = [{ x: sx, y: sy }];
  let dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
  let score = 0, dead = false, speed = 90, lastTime = 0;

  function placeFood() {
    let f, tries = 0;
    do {
      f = { x: 1 + Math.floor(Math.random() * (COLS-2)), y: 1 + Math.floor(Math.random() * (ROWS-2)) };
      tries++;
    } while ((isWall(f.x, f.y) || snake.some(s => s.x === f.x && s.y === f.y)) && tries < 800);
    return f;
  }
  let food = placeFood();

  const kH = (e) => {
    const m = {
      ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1},
      ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
      w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
    };
    if (m[e.key] && !(m[e.key].x === -dir.x && m[e.key].y === -dir.y)) {
      nextDir = m[e.key]; e.preventDefault();
    }
  };
  document.addEventListener('keydown', kH);

  function tick(ts) {
    if (dead || state.killed) return;
    if (ts - lastTime < speed) { state.rafId = requestAnimationFrame(tick); return; }
    lastTime = ts;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      end('Hit the boundary!'); return;
    }
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      end('Hit yourself!'); return;
    }
    if (isWall(head.x, head.y)) {
      damageWall(head.x, head.y);
      end('Blocked by Ryan Green himself!'); return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10; food = placeFood(); speed = Math.max(50, speed - 2);
    } else {
      snake.pop();
    }

    draw();
    hud.innerHTML = `SNAKE<br>score: ${score}<br>↑↓←→ / WASD<br>avoid red zones`;
    state.rafId = requestAnimationFrame(tick);
  }

  function end(msg) {
    dead = true;
    document.removeEventListener('keydown', kH);
    draw();
    showGameOver(ctx, W, H, msg, score, cleanup, launchSnake);
  }

  function draw() {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);

    // Draw wall blocks using STORED GRID pixel coords — exact match to collision
    wallBlocks.forEach(b => {
      if (!b.alive) return;
      const a = b.hp / b.maxHp;

      // Red fill
      ctx.globalAlpha = a * 0.18;
      ctx.fillStyle = '#f87171';
      ctx.fillRect(b.px, b.py, b.pw, b.ph);

      // Red border — this is exactly the collision zone
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.px + 1, b.py + 1, b.pw - 2, b.ph - 2);

      // Text label
      ctx.fillStyle = b.color;
      ctx.font = `${b.fontSize}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.px + b.pw/2, b.py + b.ph/2, b.pw - 4);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    });

    // Outer boundary — red, same death rule
    ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W-2, H-2);

    // Food
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(food.x*SZ + SZ/2, food.y*SZ + SZ/2, SZ/2 - 2, 0, Math.PI*2);
    ctx.fill();

    // Snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : ACCENT;
      ctx.fillRect(s.x*SZ + 1, s.y*SZ + 1, SZ-2, SZ-2);
    });
  }

  draw();
  state.rafId = requestAnimationFrame(tick);
};
