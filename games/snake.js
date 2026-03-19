// ════════════════════════════════════════
// SNAKE — hero text as destructible walls
// ════════════════════════════════════════
function launchSnake() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 16;
  const COLS = Math.floor(W / SZ), ROWS = Math.floor(H / SZ);

  // Build destructible wall blocks from hero elements
  const blocks = scrapeHeroBlocks();

  // Map each grid cell to a block reference
  const wallGrid = new Map();
  blocks.forEach(b => {
    const x1=Math.floor(b.x/SZ), x2=Math.ceil((b.x+b.w)/SZ);
    const y1=Math.floor(b.y/SZ), y2=Math.ceil((b.y+b.h)/SZ);
    for (let gx=x1;gx<=x2;gx++) for (let gy=y1;gy<=y2;gy++) wallGrid.set(`${gx},${gy}`, b);
  });

  function isWall(gx,gy) { const b=wallGrid.get(`${gx},${gy}`); return b&&b.alive; }
  function damageWall(gx,gy) {
    const b=wallGrid.get(`${gx},${gy}`);
    if (!b||!b.alive) return;
    b.hp--;
    if (b.hp<=0) { b.alive=false; wallGrid.forEach((v,k)=>{ if(v===b) wallGrid.delete(k); }); }
  }

  // Start snake safely at bottom-center, clear of any walls
  let sx=Math.floor(COLS/2), sy=ROWS-6;
  while (isWall(sx,sy)) sy--;
  let snake=[{x:sx,y:sy}];
  let dir={x:1,y:0}, nextDir={x:1,y:0};
  let score=0, dead=false, speed=90, lastTime=0;

  function placeFood() {
    let f, tries=0;
    do { f={x:1+Math.floor(Math.random()*(COLS-2)), y:1+Math.floor(Math.random()*(ROWS-2))}; tries++; }
    while ((isWall(f.x,f.y)||snake.some(s=>s.x===f.x&&s.y===f.y)) && tries<600);
    return f;
  }
  let food=placeFood();

  const kH=(e)=>{
    const m={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
             w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
    if (m[e.key]&&!(m[e.key].x===-dir.x&&m[e.key].y===-dir.y)) { nextDir=m[e.key]; e.preventDefault(); }
  };
  document.addEventListener('keydown', kH);

  function tick(ts) {
    if (dead || state.killed) return;
    if (ts-lastTime<speed) { state.rafId = requestAnimationFrame(tick); return; }
    lastTime=ts; dir=nextDir;
    const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS) { end('Hit the boundary!'); return; }
    if (snake.some(s=>s.x===head.x&&s.y===head.y)) { end('Hit yourself!'); return; }
    if (isWall(head.x,head.y)) { damageWall(head.x,head.y); end('Crashed into your resume!'); return; }
    snake.unshift(head);
    if (head.x===food.x&&head.y===food.y) { score+=10; food=placeFood(); speed=Math.max(50,speed-2); }
    else snake.pop();
    draw();
    hud.innerHTML=`SNAKE<br>score: ${score}<br>↑↓←→ / WASD`;
    state.rafId = requestAnimationFrame(tick);
  }

  function end(msg) {
    dead=true; document.removeEventListener('keydown',kH);
    draw(); showGameOver(ctx,W,H,msg,score,cleanup,launchSnake);
  }

  function draw() {
    ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);

    // Draw hero blocks — show bounding box outlines clearly
    blocks.forEach(b => {
      if (!b.alive) return;
      const a=b.hp/b.maxHp;
      // Filled background
      ctx.globalAlpha=a*0.15; ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.w,b.h);
      // Clear bright border
      ctx.globalAlpha=a; ctx.strokeStyle=b.color; ctx.lineWidth=1.5;
      ctx.strokeRect(b.x+0.5,b.y+0.5,b.w-1,b.h-1);
      // Text
      ctx.fillStyle=b.color;
      ctx.font=`${b.fontSize}px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(b.text, b.x+b.w/2, b.y+b.h/2, b.w-4);
      ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
    });

    // Food
    ctx.fillStyle='#f87171';
    ctx.beginPath(); ctx.arc(food.x*SZ+SZ/2,food.y*SZ+SZ/2,SZ/2-2,0,Math.PI*2); ctx.fill();

    // Snake
    snake.forEach((s,i)=>{
      ctx.fillStyle=i===0?'#ffffff':ACCENT;
      ctx.fillRect(s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2);
    });
  }

  draw();
  state.rafId = requestAnimationFrame(tick);
}
// ════════════════════════════════════════
// SNAKE — hero text as destructible walls
// ════════════════════════════════════════
function launchSnake() {
  const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
  const ACCENT = getAccent();
  const SZ = 18;
  const COLS = Math.floor(W / SZ), ROWS = Math.floor(H / SZ);

  // Scrape hero blocks — each becomes a destructible wall cluster
  const blocks = scrapeHeroBlocks();
  // Build grid wall map from blocks
  const wallMap = new Map(); // key -> block reference
  blocks.forEach(b => {
    const x1 = Math.floor(b.x / SZ), x2 = Math.ceil((b.x + b.w) / SZ);
    const y1 = Math.floor(b.y / SZ), y2 = Math.ceil((b.y + b.h) / SZ);
    for (let gx = x1; gx <= x2; gx++) for (let gy = y1; gy <= y2; gy++) wallMap.set(`${gx},${gy}`, b);
  });

  function isWall(gx, gy) {
    const b = wallMap.get(`${gx},${gy}`);
    return b && b.alive;
  }

  function hitWall(gx, gy) {
    const b = wallMap.get(`${gx},${gy}`);
    if (b && b.alive) {
      if (damageBlock(b)) {
        // Remove all wall cells for this block
        wallMap.forEach((v, k) => { if (v === b) wallMap.delete(k); });
      }
      return true;
    }
    return false;
  }

  // Start snake in a guaranteed clear area at bottom center
  const startX = Math.floor(COLS / 2), startY = ROWS - 4;
  let snake = [{ x: startX, y: startY }];
  let dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
  let score = 0, dead = false, speed = 130, lastTime = 0;
  let food = placeFood();

  function placeFood() {
    let f, tries = 0;
    do {
      f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      tries++;
    } while ((isWall(f.x, f.y) || snake.some(s => s.x === f.x && s.y === f.y)) && tries < 500);
    return f;
  }

  const kH = (e) => {
    const m = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
                w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0} };
    if (m[e.key] && !(m[e.key].x === -dir.x && m[e.key].y === -dir.y)) {
      nextDir = m[e.key]; e.preventDefault();
    }
  };
  document.addEventListener('keydown', kH);

  function tick(ts) {
    if (dead) return;
    if (ts - lastTime < speed) { requestAnimationFrame(tick); return; }
    lastTime = ts;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Boundary check
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      end('You hit the boundary!'); return;
    }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      end('You hit yourself!'); return;
    }
    // Wall collision — damage block, die
    if (isWall(head.x, head.y)) {
      hitWall(head.x, head.y);
      end('You crashed into your own resume!'); return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10; food = placeFood(); speed = Math.max(55, speed - 3);
    } else {
      snake.pop();
    }

    draw();
    hud.innerHTML = `SNAKE<br>score: ${score}<br>↑↓←→ / WASD move<br>walls: ${blocks.filter(b=>b.alive).length} left`;
    requestAnimationFrame(tick);
  }

  function end(msg) {
    dead = true;
    document.removeEventListener('keydown', kH);
    draw();
    showGameOver(ctx, W, H, msg, score, cleanup, launchSnake);
  }

  function draw() {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
    // Draw hero blocks
    blocks.forEach(b => drawBlock(ctx, b, ACCENT));
    // Food
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(food.x * SZ + SZ/2, food.y * SZ + SZ/2, SZ/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : ACCENT;
      ctx.fillRect(s.x * SZ + 1, s.y * SZ + 1, SZ - 2, SZ - 2);
    });
  }

  draw();
  requestAnimationFrame(tick);
}
