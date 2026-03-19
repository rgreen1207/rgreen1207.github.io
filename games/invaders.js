// ════════════════════════════════════════
// SPACE INVADERS — personal info as invaders
// ════════════════════════════════════════
window.launchInvaders = function launchInvaders() {
  const { canvas, ctx, W, H, hud, cleanup, state } = createGameCanvas();
  const ACCENT = getAccent();

  // Hardcoded personal info invaders — descriptive of Ryan Green
  const invaderData = [
    // Row 1 — identity
    { text:'Ryan Green',      color:'#ffffff', hp:3 },
    { text:'Sr. Backend Eng', color:'#ffffff', hp:3 },
    { text:'Seattle WA',      color:'#ffffff', hp:3 },
    { text:'ryan@rgreen.dev', color:'#4ade80', hp:3 },
    { text:'rgreen.dev',      color:'#4ade80', hp:3 },
    // Row 2 — contact / social
    { text:'(951)400-1744',   color:'#4ade80', hp:2 },
    { text:'github/rgreen1207',color:'#8892a4', hp:2 },
    { text:'linkedin/rgreen1207',color:'#8892a4', hp:2 },
    { text:'8+ yrs exp',      color:'#fbbf24', hp:2 },
    { text:'$120K saved/yr',  color:'#fbbf24', hp:2 },
    // Row 3 — core skills
    { text:'Python',          color:'#4ade80', hp:2 },
    { text:'FastAPI',         color:'#4ade80', hp:2 },
    { text:'PostgreSQL',      color:'#4ade80', hp:2 },
    { text:'RabbitMQ',        color:'#4ade80', hp:2 },
    { text:'Redis',           color:'#4ade80', hp:2 },
    // Row 4 — more skills
    { text:'Celery',          color:'#6b7a90', hp:1 },
    { text:'Docker',          color:'#6b7a90', hp:1 },
    { text:'AWS EC2/S3',      color:'#6b7a90', hp:1 },
    { text:'SQLAlchemy',      color:'#6b7a90', hp:1 },
    { text:'Pydantic',        color:'#6b7a90', hp:1 },
    // Row 5 — background
    { text:'Microservices',   color:'#4a5568', hp:1 },
    { text:'Distributed Sys', color:'#4a5568', hp:1 },
    { text:'Event-Driven',    color:'#4a5568', hp:1 },
    { text:'REST APIs',       color:'#4a5568', hp:1 },
    { text:'CI/CD',           color:'#4a5568', hp:1 },
  ];

  const COLS_I = 5, ROWS_I = Math.ceil(invaderData.length / COLS_I);
  const padX = W * 0.05;
  const colW = (W - padX*2) / COLS_I;
  const startY = 60, rowH = 50;

  const invaders = invaderData.map((d, i) => ({
    ...d,
    maxHp: d.hp,
    alive: true,
    x: padX + (i % COLS_I) * colW + colW/2,
    y: startY + Math.floor(i / COLS_I) * rowH,
    w: Math.min(colW - 14, 160),
    h: 28,
  }));

  let invDir=1, invSpd=0.4;
  const ship={x:W/2, y:H-60, spd:6};
  const bullets=[], enemyBullets=[];
  let score=0, lives=3, dead=false, won=false;
  let lastEnemyShot=0;

  const keys={};
  const kd=(e)=>{
    keys[e.key]=true;
    if(e.key===' '){e.preventDefault(); if(bullets.length<4) bullets.push({x:ship.x,y:ship.y-20,vy:-12});}
  };
  const ku=(e)=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);
  document.addEventListener('keyup',ku);

  function loop(ts) {
    if(dead||won||state.killed) return;

    if((keys['ArrowLeft']||keys['a'])&&ship.x>20) ship.x-=ship.spd;
    if((keys['ArrowRight']||keys['d'])&&ship.x<W-20) ship.x+=ship.spd;

    const alive=invaders.filter(inv=>inv.alive);
    let edge=false;
    alive.forEach(inv=>{ inv.x+=invDir*invSpd; if(inv.x-inv.w/2<30||inv.x+inv.w/2>W-30) edge=true; });
    if(edge) { invDir*=-1; alive.forEach(inv=>inv.y+=18); invSpd=Math.min(invSpd+0.04,2.5); }

    if(ts-lastEnemyShot>900&&alive.length) {
      const shooter=alive[Math.floor(Math.random()*alive.length)];
      enemyBullets.push({x:shooter.x,y:shooter.y+shooter.h/2+4,vy:5+Math.random()*2});
      lastEnemyShot=ts;
    }

    bullets.forEach(b=>b.y+=b.vy);
    enemyBullets.forEach(b=>b.y+=b.vy);

    // Player bullet vs invader
    for(let bi=bullets.length-1;bi>=0;bi--) {
      const b=bullets[bi];
      for(let ii=0;ii<invaders.length;ii++) {
        const inv=invaders[ii];
        if(!inv.alive) continue;
        if(b.x>inv.x-inv.w/2&&b.x<inv.x+inv.w/2&&b.y>inv.y-inv.h/2&&b.y<inv.y+inv.h/2) {
          inv.hp--; score+=5;
          if(inv.hp<=0){inv.alive=false;score+=15;}
          bullets.splice(bi,1); break;
        }
      }
    }

    // Enemy bullet vs ship
    for(let bi=enemyBullets.length-1;bi>=0;bi--) {
      if(Math.hypot(enemyBullets[bi].x-ship.x,enemyBullets[bi].y-ship.y)<20) {
        lives--; enemyBullets.splice(bi,1);
        if(lives<=0){end('You got destroyed!');return;}
      }
    }

    // Invader reaches bottom
    if(alive.some(inv=>inv.y+inv.h/2>H-80)){end('They reached your ship!');return;}
    if(!alive.length){won=true;drawWin();return;}

    for(let i=bullets.length-1;i>=0;i--) if(bullets[i].y<0) bullets.splice(i,1);
    for(let i=enemyBullets.length-1;i>=0;i--) if(enemyBullets[i].y>H) enemyBullets.splice(i,1);

    draw();
    hud.innerHTML=`INVADERS<br>score: ${score}<br>lives: ${'♥'.repeat(lives)}<br>←→ move · SPACE fire`;
    state.rafId = requestAnimationFrame(loop);
  }

  function end(msg) {
    dead=true; document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku);
    draw(); showGameOver(ctx,W,H,msg,score,cleanup,launchInvaders);
  }

  function draw() {
    ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H);

    invaders.forEach(inv=>{
      if(!inv.alive) return;
      const a=inv.hp/inv.maxHp;
      const fs=Math.max(9,Math.min(12,inv.w/(inv.text.length*0.65)));
      ctx.globalAlpha=a*0.2; ctx.fillStyle=inv.color;
      ctx.fillRect(inv.x-inv.w/2,inv.y-inv.h/2,inv.w,inv.h);
      ctx.globalAlpha=a*0.8; ctx.strokeStyle=inv.color; ctx.lineWidth=1;
      ctx.strokeRect(inv.x-inv.w/2+0.5,inv.y-inv.h/2+0.5,inv.w-1,inv.h-1);
      ctx.globalAlpha=a; ctx.fillStyle=inv.color;
      ctx.font=`${fs}px 'JetBrains Mono',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(inv.text,inv.x,inv.y,inv.w-4);
      // eyes
      ctx.fillStyle='#f87171';
      ctx.fillRect(inv.x-7,inv.y+inv.h/2+2,3,3);
      ctx.fillRect(inv.x+4,inv.y+inv.h/2+2,3,3);
      ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
    });

    ctx.strokeStyle='#252a38'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H-40); ctx.lineTo(W,H-40); ctx.stroke();

    ctx.fillStyle=ACCENT;
    ctx.beginPath(); ctx.moveTo(ship.x,ship.y-22); ctx.lineTo(ship.x-18,ship.y+10); ctx.lineTo(ship.x+18,ship.y+10); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(ship.x,ship.y-8,4,0,Math.PI*2); ctx.fill();

    bullets.forEach(b=>{ctx.fillStyle='#ffffff';ctx.fillRect(b.x-2,b.y-8,4,16);});
    enemyBullets.forEach(b=>{ctx.fillStyle='#f87171';ctx.fillRect(b.x-2,b.y-6,4,12);});
  }

  function drawWin() {
    ctx.fillStyle='rgba(13,15,20,0.92)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=ACCENT; ctx.font="bold 40px 'JetBrains Mono',monospace";
    ctx.fillText('YOU WIN!',W/2,H/2-40);
    ctx.fillStyle='#e2e8f0'; ctx.font="16px 'JetBrains Mono',monospace";
    ctx.fillText('Score: '+score,W/2,H/2+10);
    ctx.fillStyle='#4a5568'; ctx.font="13px 'JetBrains Mono',monospace";
    ctx.fillText('R to restart  ·  ESC to quit',W/2,H/2+50);
    ctx.textBaseline='alphabetic';
    const rH=(e)=>{if(e.key==='r'||e.key==='R'){document.removeEventListener('keydown',rH);cleanup();launchInvaders();}};
    document.addEventListener('keydown',rH);
  }

  draw();
  state.rafId = requestAnimationFrame(loop);
}
