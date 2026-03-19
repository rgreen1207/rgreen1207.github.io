    // ════════════════════════════════════════
    // SNAKE
    // ════════════════════════════════════════
    function launchSnake() {
      const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
      const SZ = 20;
      const COLS = Math.floor(W / SZ);
      const ROWS = Math.floor(H / SZ);
      const ACCENT = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

      // Build walls from hero text elements
      const walls = new Set();
      const hero = document.getElementById('about');
      hero.querySelectorAll('h1,h2,.hero-eyebrow,.hero-title,.stat-num,.stat-label,.btn-primary,.btn-secondary,.contact-link,.hero-name-prompt').forEach(el => {
        const r = el.getBoundingClientRect();
        const x1 = Math.floor(r.left / SZ), x2 = Math.ceil(r.right / SZ);
        const y1 = Math.floor(r.top / SZ),  y2 = Math.ceil(r.bottom / SZ);
        for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) walls.add(`${x},${y}`);
      });

      let snake = [{x:Math.floor(COLS/2), y:Math.floor(ROWS/2)}];
      let dir = {x:1,y:0}, nextDir = {x:1,y:0};
      let score = 0, food = placeFood(), dead = false, speed = 120, lastTime = 0;

      function placeFood() {
        let f;
        do { f = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)}; }
        while (walls.has(`${f.x},${f.y}`) || snake.some(s=>s.x===f.x&&s.y===f.y));
        return f;
      }

      const keys = (e) => {
        const m = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
                   w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
        if (m[e.key] && !(m[e.key].x===-dir.x&&m[e.key].y===-dir.y)) { nextDir=m[e.key]; e.preventDefault(); }
      };
      document.addEventListener('keydown', keys);

      function tick(ts) {
        if (dead) return;
        if (ts - lastTime < speed) { requestAnimationFrame(tick); return; }
        lastTime = ts;
        dir = nextDir;
        const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

        // Wall / boundary / self collision
        if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS || walls.has(`${head.x},${head.y}`) || snake.some(s=>s.x===head.x&&s.y===head.y)) {
          dead = true;
          document.removeEventListener('keydown', keys);
          draw();
          gameOver(ctx, W, H, 'You hit a wall!', score, cleanup, launchSnake);
          return;
        }

        snake.unshift(head);
        if (head.x===food.x && head.y===food.y) {
          score += 10; food = placeFood(); speed = Math.max(60, speed - 2);
        } else { snake.pop(); }

        draw();
        hud.textContent = `SNAKE  score: ${score}  ↑↓←→ to move`;
        requestAnimationFrame(tick);
      }

      function draw() {
        ctx.fillStyle = '#0d0f14';
        ctx.fillRect(0, 0, W, H);
        // Walls
        walls.forEach(k => {
          const [x,y] = k.split(',').map(Number);
          ctx.fillStyle = '#1a1e28';
          ctx.fillRect(x*SZ, y*SZ, SZ-1, SZ-1);
        });
        // Food
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(food.x*SZ+SZ/2, food.y*SZ+SZ/2, SZ/2-2, 0, Math.PI*2);
        ctx.fill();
        // Snake
        snake.forEach((s,i) => {
          ctx.fillStyle = i===0 ? '#ffffff' : ACCENT;
          ctx.fillRect(s.x*SZ+1, s.y*SZ+1, SZ-2, SZ-2);
        });
      }

      requestAnimationFrame(tick);
    }

    // ════════════════════════════════════════
