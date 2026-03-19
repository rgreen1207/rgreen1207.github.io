    // SPACE INVADERS
    // ════════════════════════════════════════
    function launchInvaders() {
      const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
      const ACCENT = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

      // Collect text nodes from hero as invaders
      const labels = [];
      document.getElementById('about').querySelectorAll('.stat-num,.stat-label,.tag,.hero-eyebrow,.hero-title,.section-label').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.top > 0) labels.push({ text: el.textContent.trim().slice(0,20), x: r.left + r.width/2, y: r.top + r.height/2 });
      });

      const ROWS_I = 3, COLS_I = Math.min(8, Math.ceil(labels.length / ROWS_I));
      const invaders = [];
      const padX = W * 0.1, stepX = (W * 0.8) / (COLS_I - 1 || 1);
      const startY = 80, stepY = 55;
      for (let r = 0; r < ROWS_I; r++) {
        for (let c = 0; c < COLS_I; c++) {
          const lbl = labels[r * COLS_I + c] || { text: '404' };
          invaders.push({ x: padX + c * stepX, y: startY + r * stepY, text: lbl.text, alive: true, w: 80, h: 24 });
        }
      }

      let invDir = 1, invSpeed = 0.4, invDrop = false;
      const ship = { x: W/2, y: H - 60, w: 40, speed: 5 };
      const bullets = [], enemyBullets = [];
      let score = 0, lives = 3, dead = false, won = false, raf;
      const keys = {};
      const kd = e => { keys[e.key] = true; if (e.key===' ') { e.preventDefault(); if (bullets.length < 5) bullets.push({x:ship.x,y:ship.y-20,vy:-10}); } };
      const ku = e => { keys[e.key] = false; };
      document.addEventListener('keydown', kd);
      document.addEventListener('keyup', ku);

      let lastShot = 0;
      function loop(ts) {
        if (dead || won) return;
        // Move ship
        if ((keys['ArrowLeft']||keys['a']) && ship.x > 20) ship.x -= ship.speed;
        if ((keys['ArrowRight']||keys['d']) && ship.x < W-20) ship.x += ship.speed;

        // Move invaders
        let hitEdge = false;
        invaders.filter(i=>i.alive).forEach(i => {
          i.x += invDir * invSpeed;
          if (i.x < 60 || i.x > W-60) hitEdge = true;
        });
        if (hitEdge) { invDir *= -1; invaders.filter(i=>i.alive).forEach(i => i.y += 20); }

        // Enemy shoot
        if (ts - lastShot > 1200) {
          const alive = invaders.filter(i=>i.alive);
          if (alive.length) { const a = alive[Math.floor(Math.random()*alive.length)]; enemyBullets.push({x:a.x,y:a.y+15,vy:5}); lastShot = ts; }
        }

        // Move bullets
        bullets.forEach(b => b.y += b.vy);
        enemyBullets.forEach(b => b.y += b.vy);

        // Bullet vs invader
        bullets.forEach((b,bi) => {
          invaders.forEach(inv => {
            if (inv.alive && Math.abs(b.x-inv.x)<inv.w/2 && Math.abs(b.y-inv.y)<inv.h) {
              inv.alive = false; bullets.splice(bi,1); score += 10;
            }
          });
        });

        // Enemy bullet vs ship
        enemyBullets.forEach((b,bi) => {
          if (Math.abs(b.x-ship.x)<20 && Math.abs(b.y-ship.y)<20) {
            lives--; enemyBullets.splice(bi,1);
            if (lives <= 0) { dead=true; document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); draw(ts); gameOver(ctx,W,H,'Earth has fallen.',score,cleanup,launchInvaders); return; }
          }
        });

        // Invader reaches bottom
        invaders.filter(i=>i.alive).forEach(i => { if (i.y > H - 100) { dead=true; } });

        // Win
        if (!invaders.some(i=>i.alive)) { won=true; drawWin(); return; }

        // Cleanup offscreen
        for (let i=bullets.length-1;i>=0;i--) if(bullets[i].y<0) bullets.splice(i,1);
        for (let i=enemyBullets.length-1;i>=0;i--) if(enemyBullets[i].y>H) enemyBullets.splice(i,1);

        draw(ts);
        hud.innerHTML = `INVADERS  score:${score}  lives:${'♥'.repeat(lives)}  ←→ move · SPACE shoot`;
        raf = requestAnimationFrame(loop);
      }

      function draw(ts) {
        ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);
        // Invaders
        invaders.forEach(inv => {
          if (!inv.alive) return;
          ctx.font = "13px 'JetBrains Mono',monospace";
          ctx.fillStyle = ACCENT;
          ctx.textAlign = 'center';
          ctx.fillText(inv.text, inv.x, inv.y);
          // Eyes
          ctx.fillStyle = '#f87171';
          ctx.fillRect(inv.x-12,inv.y+4,4,4);
          ctx.fillRect(inv.x+8,inv.y+4,4,4);
        });
        // Ship
        ctx.fillStyle = ACCENT;
        ctx.beginPath(); ctx.moveTo(ship.x,ship.y-20); ctx.lineTo(ship.x-20,ship.y+10); ctx.lineTo(ship.x+20,ship.y+10); ctx.closePath(); ctx.fill();
        // Bullets
        bullets.forEach(b => { ctx.fillStyle='#ffffff'; ctx.fillRect(b.x-2,b.y-8,4,16); });
        enemyBullets.forEach(b => { ctx.fillStyle='#f87171'; ctx.fillRect(b.x-2,b.y-6,4,12); });
        // Ground line
        ctx.strokeStyle='#252a38'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,H-40); ctx.lineTo(W,H-40); ctx.stroke();
      }

      function drawWin() {
        ctx.fillStyle='rgba(13,15,20,0.9)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle=ACCENT; ctx.font="bold 40px 'JetBrains Mono',monospace"; ctx.textAlign='center';
        ctx.fillText('YOU WIN!', W/2, H/2-40);
        ctx.fillStyle='#8892a4'; ctx.font="16px 'JetBrains Mono',monospace";
        ctx.fillText(`Score: ${score}`, W/2, H/2+10);
        ctx.fillText('R to restart · ESC to quit', W/2, H/2+50);
        const r = (e) => { if(e.key==='r'||e.key==='R'){document.removeEventListener('keydown',r);cleanup();launchInvaders();} };
        document.addEventListener('keydown', r);
      }

      requestAnimationFrame(loop);
    }

    // ════════════════════════════════════════
