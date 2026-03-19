    // CENTIPEDE
    // ════════════════════════════════════════
    function launchCentipede() {
      const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
      const ACCENT = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';
      const SZ = 24;

      // Build mushroom field from hero text
      const mushrooms = [];
      document.getElementById('about').querySelectorAll('h1,h2,.hero-eyebrow,.hero-title,.stat-num,.stat-label,.hero-summary,.btn-primary,.tag').forEach(el => {
        const text = el.textContent.trim();
        const r = el.getBoundingClientRect();
        if (r.width < 5 || r.top < 10) return;
        for (let ci = 0; ci < text.length; ci++) {
          if (text[ci] === ' ') continue;
          const charW = r.width / text.length;
          mushrooms.push({ x: Math.round((r.left + ci * charW) / SZ) * SZ, y: Math.round(r.top / SZ) * SZ, ch: text[ci], hp: 2 });
        }
      });

      // Centipede
      const SEG_COUNT = 12;
      let centipede = Array.from({length:SEG_COUNT}, (_,i) => ({ x: i*SZ, y: 0, dx: SZ, dy: 0 }));
      let segSpeed = 2.5;

      const ship = { x: W/2, y: H-50, speed: 4 };
      const bullets = [];
      let score = 0, lives = 3, dead = false, raf;
      const keys = {};
      const kd = e => { keys[e.key]=true; if(e.key===' '){e.preventDefault(); if(bullets.length<4) bullets.push({x:ship.x,y:ship.y-SZ,vy:-8});} };
      const ku = e => { keys[e.key]=false; };
      document.addEventListener('keydown', kd);
      document.addEventListener('keyup', ku);

      function loop() {
        if (dead) return;
        if ((keys['ArrowLeft']||keys['a']) && ship.x>SZ) ship.x-=ship.speed;
        if ((keys['ArrowRight']||keys['d']) && ship.x<W-SZ) ship.x+=ship.speed;
        if ((keys['ArrowUp']||keys['w']) && ship.y>H*0.6) ship.y-=ship.speed;
        if ((keys['ArrowDown']||keys['s']) && ship.y<H-SZ) ship.y+=ship.speed;

        // Move bullets
        bullets.forEach(b => b.y += b.vy);
        for (let i=bullets.length-1;i>=0;i--) if(bullets[i].y<0) bullets.splice(i,1);

        // Bullet vs mushroom
        bullets.forEach((b,bi) => {
          for (let mi=mushrooms.length-1;mi>=0;mi--) {
            const m = mushrooms[mi];
            if (b.x>=m.x && b.x<m.x+SZ && b.y>=m.y && b.y<m.y+SZ) {
              m.hp--; bullets.splice(bi,1); score+=1;
              if(m.hp<=0){mushrooms.splice(mi,1);score+=5;}
              break;
            }
          }
        });

        // Move centipede
        centipede.forEach((seg,si) => {
          seg.x += seg.dx * segSpeed / SZ;
          // Hit wall or mushroom
          const nx = seg.x + seg.dx;
          const hitWall = nx < 0 || nx >= W;
          const hitMush = mushrooms.some(m => Math.abs(nx - m.x) < SZ*0.6 && Math.abs(seg.y - m.y) < SZ*0.6);
          if (hitWall || hitMush) {
            seg.y += SZ; seg.dx *= -1;
            if (seg.y >= H) { seg.y = 0; }
          }
        });

        // Bullet vs centipede
        bullets.forEach((b,bi) => {
          centipede.forEach((seg,si) => {
            if (Math.abs(b.x-seg.x)<SZ*0.6 && Math.abs(b.y-seg.y)<SZ*0.6) {
              bullets.splice(bi,1); score+=10;
              mushrooms.push({x:seg.x,y:seg.y,ch:'*',hp:2});
              centipede.splice(si,1);
            }
          });
        });

        // Centipede reaches player zone
        centipede.forEach(seg => {
          if (Math.abs(seg.x-ship.x)<SZ && Math.abs(seg.y-ship.y)<SZ) {
            lives--;
            if (lives<=0) { dead=true; document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); draw(); gameOver(ctx,W,H,'The centipede got you!',score,cleanup,launchCentipede); return; }
            centipede = Array.from({length:SEG_COUNT},(_,i)=>({x:i*SZ,y:0,dx:SZ,dy:0}));
          }
        });

        if (centipede.length === 0) {
          centipede = Array.from({length:SEG_COUNT},(_,i)=>({x:i*SZ,y:0,dx:SZ,dy:0}));
          segSpeed += 0.5;
        }

        draw();
        hud.innerHTML = `CENTIPEDE  score:${score}  lives:${'♥'.repeat(lives)}  ↑↓←→ move · SPACE shoot`;
        raf = requestAnimationFrame(loop);
      }

      function draw() {
        ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);
        // Mushrooms
        mushrooms.forEach(m => {
          ctx.font = `${SZ-2}px 'JetBrains Mono',monospace`;
          ctx.fillStyle = m.hp===2 ? '#4a5568' : '#6b7a90';
          ctx.textAlign='left';
          ctx.fillText(m.ch, m.x+2, m.y+SZ-4);
        });
        // Centipede
        centipede.forEach((seg,i) => {
          ctx.fillStyle = i===0 ? '#ffffff' : ACCENT;
          ctx.beginPath(); ctx.arc(seg.x+SZ/2, seg.y+SZ/2, SZ/2-2, 0, Math.PI*2); ctx.fill();
          if (i===0) { ctx.fillStyle='#0d0f14'; ctx.beginPath(); ctx.arc(seg.x+SZ/2-4,seg.y+SZ/2-4,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(seg.x+SZ/2+4,seg.y+SZ/2-4,3,0,Math.PI*2); ctx.fill(); }
        });
        // Ship
        ctx.fillStyle=ACCENT; ctx.beginPath(); ctx.moveTo(ship.x,ship.y-SZ/2); ctx.lineTo(ship.x-SZ/2,ship.y+SZ/2); ctx.lineTo(ship.x+SZ/2,ship.y+SZ/2); ctx.closePath(); ctx.fill();
        // Bullets
        bullets.forEach(b=>{ctx.fillStyle='#ffffff';ctx.fillRect(b.x-2,b.y-6,4,12);});
        ctx.strokeStyle='#252a38';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(0,H*0.6);ctx.lineTo(W,H*0.6);ctx.stroke();ctx.setLineDash([]);
      }

      requestAnimationFrame(loop);
    }

    // ════════════════════════════════════════
