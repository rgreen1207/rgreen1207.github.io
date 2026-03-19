    // MISSILE COMMAND
    // ════════════════════════════════════════
    function launchMissile() {
      const { canvas, ctx, W, H, hud, cleanup } = createGameCanvas();
      const ACCENT = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';

      // Cities = stat cards / contact links from hero
      const cityEls = document.getElementById('about').querySelectorAll('.stat,.contact-link,.btn-primary,.btn-secondary');
      const cities = [];
      cityEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && cities.length < 8) cities.push({ x: r.left+r.width/2, label: el.textContent.trim().slice(0,14), alive: true, r: r });
      });
      if (!cities.length) for (let i=0;i<6;i++) cities.push({x:W*0.1+i*(W*0.8/5), label:`node-${i}`, alive:true});

      const missiles   = [];   // incoming
      const myMissiles = [];   // player fired
      const explosions = [];
      let score = 0, ammo = 30, wave = 1, dead = false, raf;
      let lastSpawn = 0, spawnInterval = 2500;

      // Click to fire
      const clickH = (e) => {
        const rect = canvas.getBoundingClientRect();
        const tx = e.clientX - rect.left, ty = e.clientY - rect.top;
        if (ammo > 0) {
          const base = {x: W/2, y: H-20};
          const dist = Math.hypot(tx-base.x, ty-base.y);
          const speed = 8;
          myMissiles.push({ x:base.x, y:base.y, vx:(tx-base.x)/dist*speed, vy:(ty-base.y)/dist*speed, tx, ty });
          ammo--;
        }
      };
      canvas.addEventListener('click', clickH);
      // Also keyboard
      const kd = e => {
        if (e.key === 'Escape') { canvas.removeEventListener('click',clickH); document.removeEventListener('keydown',kd); }
      };
      document.addEventListener('keydown', kd);

      function spawnMissile(ts) {
        if (ts - lastSpawn < spawnInterval) return;
        lastSpawn = ts;
        const alive = cities.filter(c=>c.alive);
        if (!alive.length) return;
        const target = alive[Math.floor(Math.random()*alive.length)];
        const sx = Math.random()*W;
        const dist = Math.hypot(target.x-sx, target.y-(H-40));
        const spd = 1.2 + wave*0.3;
        missiles.push({ x:sx, y:0, vx:(target.x-sx)/dist*spd, vy:(target.y-0)/dist*spd, tx:target.x, ty:H-40, target });
      }

      function loop(ts) {
        if (dead) return;
        spawnMissile(ts);
        // Move missiles
        missiles.forEach(m => { m.x+=m.vx; m.y+=m.vy; });
        myMissiles.forEach(m => { m.x+=m.vx; m.y+=m.vy; });

        // Explosions grow/shrink
        explosions.forEach(e => { e.r += 3; e.life--; });
        for (let i=explosions.length-1;i>=0;i--) if(explosions[i].life<=0) explosions.splice(i,1);

        // My missile reaches target
        for (let i=myMissiles.length-1;i>=0;i--) {
          const m = myMissiles[i];
          if (Math.hypot(m.x-m.tx, m.y-m.ty)<10) {
            explosions.push({x:m.tx,y:m.ty,r:5,life:25,color:ACCENT});
            myMissiles.splice(i,1);
          }
        }

        // Explosion kills incoming missiles
        explosions.forEach(exp => {
          for (let i=missiles.length-1;i>=0;i--) {
            const m=missiles[i];
            if (Math.hypot(m.x-exp.x,m.y-exp.y)<exp.r) { missiles.splice(i,1); score+=10; }
          }
        });

        // Missile hits city
        for (let i=missiles.length-1;i>=0;i--) {
          const m=missiles[i];
          if (m.y >= H-40 && m.target.alive) {
            m.target.alive=false; explosions.push({x:m.target.x,y:H-40,r:5,life:30,color:'#f87171'});
            missiles.splice(i,1);
          }
          if (m.y>H) missiles.splice(i,1);
        }

        // Game over if all cities gone
        if (!cities.some(c=>c.alive)) {
          dead=true; canvas.removeEventListener('click',clickH);
          draw(ts); gameOver(ctx,W,H,'Infrastructure destroyed!',score,cleanup,launchMissile);
          return;
        }

        // Next wave
        if (missiles.length===0 && myMissiles.length===0 && explosions.length===0) {
          wave++; ammo=Math.min(ammo+15,30); spawnInterval=Math.max(800,spawnInterval-200);
        }

        draw(ts);
        hud.innerHTML = `MISSILE COMMAND  score:${score}  wave:${wave}  ammo:${ammo}  CLICK to fire`;
        raf = requestAnimationFrame(loop);
      }

      function draw(ts) {
        ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);
        // Stars
        ctx.fillStyle='#1a1e28';
        for(let i=0;i<60;i++){const sx=(i*137)%W,sy=(i*97)%H; ctx.fillRect(sx,sy,1,1);}
        // Ground
        ctx.fillStyle='#1a1e28'; ctx.fillRect(0,H-40,W,40);
        // Cities
        cities.forEach(c => {
          if (!c.alive) return;
          ctx.fillStyle=ACCENT; ctx.font="11px 'JetBrains Mono',monospace"; ctx.textAlign='center';
          ctx.fillText(c.label, c.x, H-45);
          ctx.fillStyle=ACCENT; ctx.fillRect(c.x-16,H-40,32,10);
          ctx.fillRect(c.x-8,H-50,16,10);
          ctx.fillRect(c.x-4,H-58,8,8);
        });
        // Missile base
        ctx.fillStyle='#4a5568'; ctx.fillRect(W/2-20,H-40,40,12);
        ctx.fillStyle=ACCENT; ctx.fillRect(W/2-3,H-52,6,12);
        // Incoming missiles
        missiles.forEach(m => { ctx.strokeStyle='#f87171'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(m.x-m.vx*30,m.y-m.vy*30); ctx.lineTo(m.x,m.y); ctx.stroke(); ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(m.x,m.y,3,0,Math.PI*2); ctx.fill(); });
        // My missiles
        myMissiles.forEach(m => { ctx.strokeStyle='#8892a4'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W/2,H-40); ctx.lineTo(m.x,m.y); ctx.stroke(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(m.x,m.y,3,0,Math.PI*2); ctx.fill(); });
        // Explosions
        explosions.forEach(e => { const alpha=e.life/30; ctx.strokeStyle=e.color; ctx.globalAlpha=alpha; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; });
      }

      requestAnimationFrame(loop);
    }

