// ════════════════════════════════════════
// GAME ENGINE — shared utilities
// ════════════════════════════════════════

function getAccent() {
  return getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';
}

function scrapeHeroBlocks() {
  const blocks = [];
  const defs = [
    { sel: '#hero-name',      col: '#ffffff', fs: 18, hp: 5 },
    { sel: '.hero-eyebrow',   col: '#4ade80', fs: 11, hp: 2 },
    { sel: '.hero-title',     col: '#4ade80', fs: 14, hp: 3 },
    { sel: '.stat-num',       col: '#4ade80', fs: 16, hp: 3 },
    { sel: '.stat-label',     col: '#6b7a90', fs: 10, hp: 2 },
    { sel: '.btn-primary',    col: '#4ade80', fs: 11, hp: 3 },
    { sel: '.btn-secondary',  col: '#8892a4', fs: 11, hp: 2 },
    { sel: '.contact-link',   col: '#8892a4', fs: 11, hp: 2 },
    { sel: '.hero-summary',   col: '#6b7a90', fs: 11, hp: 2 },
  ];
  defs.forEach(({ sel, col, fs, hp }) => {
    document.querySelectorAll(sel).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const txt = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!txt) return;
      blocks.push({ x: r.left, y: r.top, w: r.width, h: r.height,
        text: txt, color: col, fontSize: fs, hp, maxHp: hp, alive: true });
    });
  });
  return blocks;
}

function createGameCanvas() {
  const W = window.innerWidth, H = window.innerHeight;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;overflow:hidden;';

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'display:block;cursor:crosshair;';
  overlay.appendChild(canvas);

  const hud = document.createElement('div');
  hud.style.cssText = "position:absolute;top:12px;right:16px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#4ade80;text-align:right;pointer-events:none;line-height:1.8;";
  overlay.appendChild(hud);

  const hint = document.createElement('div');
  hint.style.cssText = "position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:11px;color:#4a5568;white-space:nowrap;";
  hint.textContent = 'ESC to quit  ·  R to restart';
  overlay.appendChild(hint);

  document.body.appendChild(overlay);

  // Shared killed flag — games must check this in their RAF loop
  const state = { killed: false, rafId: null };

  const escH = (e) => {
    if (e.key === 'Escape') {
      // Also block Cmd/Ctrl+R from re-opening if held during ESC
      cleanup();
    }
  };

  // Intercept Cmd+R / Ctrl+R while game is open to allow normal page reload
  const reloadH = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      cleanup();
      // Don't prevent default — let the reload proceed naturally
    }
  };

  document.addEventListener('keydown', escH);
  document.addEventListener('keydown', reloadH);

  function cleanup() {
    state.killed = true;
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    document.removeEventListener('keydown', escH);
    document.removeEventListener('keydown', reloadH);
    if (overlay.parentNode) overlay.remove();
  }

  return { canvas, ctx: canvas.getContext('2d'), W, H, hud, overlay, cleanup, state };
}

function drawBlock(ctx, b, accent) {
  if (!b.alive) return;
  const a = b.hp / b.maxHp;
  const col = b.color;
  ctx.globalAlpha = a * 0.2;
  ctx.fillStyle = col; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = a * 0.7;
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.font = `${b.fontSize}px 'JetBrains Mono',monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2, b.w - 6);
  ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
}

function hitBlock(b, x, y, r) {
  return b.alive && x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h;
}

function damageBlock(b) {
  if (!b.alive) return false;
  b.hp--;
  if (b.hp <= 0) { b.alive = false; return true; }
  return false;
}

function showGameOver(ctx, W, H, msg, score, cleanup, relaunch) {
  ctx.fillStyle = 'rgba(13,15,20,0.92)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f87171'; ctx.font = "bold 48px 'JetBrains Mono',monospace";
  ctx.fillText('GAME OVER', W/2, H/2 - 70);
  ctx.fillStyle = '#e2e8f0'; ctx.font = "18px 'JetBrains Mono',monospace";
  ctx.fillText(msg, W/2, H/2 - 20);
  ctx.fillStyle = '#4ade80'; ctx.font = "16px 'JetBrains Mono',monospace";
  ctx.fillText('Score: ' + score, W/2, H/2 + 20);
  ctx.fillStyle = '#4a5568'; ctx.font = "13px 'JetBrains Mono',monospace";
  ctx.fillText('R to restart  ·  ESC to quit', W/2, H/2 + 60);
  ctx.textBaseline = 'alphabetic';
  const rH = (e) => {
    if (e.key === 'r' || e.key === 'R') {
      document.removeEventListener('keydown', rH);
      cleanup();
      relaunch();
    }
  };
  document.addEventListener('keydown', rH);
}

const gameOver = showGameOver;
// ════════════════════════════════════════
// GAME ENGINE — shared utilities
// ════════════════════════════════════════

function getAccent() {
  return getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#4ade80';
}

// Scrape all visible hero text elements into renderable block objects.
function scrapeHeroBlocks() {
  const blocks = [];
  const defs = [
    { sel: '#hero-name',      col: '#ffffff', fs: 18, hp: 5 },
    { sel: '.hero-eyebrow',   col: '#4ade80', fs: 11, hp: 2 },
    { sel: '.hero-title',     col: '#4ade80', fs: 14, hp: 3 },
    { sel: '.stat-num',       col: '#4ade80', fs: 16, hp: 3 },
    { sel: '.stat-label',     col: '#6b7a90', fs: 10, hp: 2 },
    { sel: '.btn-primary',    col: '#4ade80', fs: 11, hp: 3 },
    { sel: '.btn-secondary',  col: '#8892a4', fs: 11, hp: 2 },
    { sel: '.contact-link',   col: '#8892a4', fs: 11, hp: 2 },
    { sel: '.hero-summary',   col: '#6b7a90', fs: 11, hp: 2 },
  ];
  defs.forEach(({ sel, col, fs, hp }) => {
    document.querySelectorAll(sel).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const txt = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!txt) return;
      blocks.push({ x: r.left, y: r.top, w: r.width, h: r.height,
        text: txt, color: col, fontSize: fs, hp, maxHp: hp, alive: true });
    });
  });
  return blocks;
}

function createGameCanvas() {
  const W = window.innerWidth, H = window.innerHeight;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;overflow:hidden;';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'display:block;cursor:crosshair;';
  overlay.appendChild(canvas);
  const hud = document.createElement('div');
  hud.style.cssText = "position:absolute;top:12px;right:16px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#4ade80;text-align:right;pointer-events:none;line-height:1.8;";
  overlay.appendChild(hud);
  const hint = document.createElement('div');
  hint.style.cssText = "position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:11px;color:#4a5568;white-space:nowrap;";
  hint.textContent = 'ESC to quit  ·  R to restart';
  overlay.appendChild(hint);
  document.body.appendChild(overlay);
  const escH = (e) => { if (e.key === 'Escape') cleanup(); };
  document.addEventListener('keydown', escH);
  function cleanup() { document.removeEventListener('keydown', escH); overlay.remove(); }
  return { canvas, ctx: canvas.getContext('2d'), W, H, hud, overlay, cleanup };
}

function drawBlock(ctx, b, accent) {
  if (!b.alive) return;
  const a = b.hp / b.maxHp;
  const col = b.color;
  ctx.globalAlpha = a * 0.2;
  ctx.fillStyle = col; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = a * 0.7;
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.font = `${b.fontSize}px 'JetBrains Mono',monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2, b.w - 6);
  ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
}

function hitBlock(b, x, y, r) {
  return b.alive && x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h;
}

function damageBlock(b) {
  if (!b.alive) return false;
  b.hp--;
  if (b.hp <= 0) { b.alive = false; return true; }
  return false;
}

function showGameOver(ctx, W, H, msg, score, cleanup, relaunch) {
  ctx.fillStyle = 'rgba(13,15,20,0.92)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f87171'; ctx.font = "bold 48px 'JetBrains Mono',monospace";
  ctx.fillText('GAME OVER', W/2, H/2 - 70);
  ctx.fillStyle = '#e2e8f0'; ctx.font = "18px 'JetBrains Mono',monospace";
  ctx.fillText(msg, W/2, H/2 - 20);
  ctx.fillStyle = '#4ade80'; ctx.font = "16px 'JetBrains Mono',monospace";
  ctx.fillText('Score: ' + score, W/2, H/2 + 20);
  ctx.fillStyle = '#4a5568'; ctx.font = "13px 'JetBrains Mono',monospace";
  ctx.fillText('R to restart  ·  ESC to quit', W/2, H/2 + 60);
  ctx.textBaseline = 'alphabetic';
  const rH = (e) => { if (e.key==='r'||e.key==='R') { document.removeEventListener('keydown',rH); cleanup(); relaunch(); } };
  document.addEventListener('keydown', rH);
}

const gameOver = showGameOver;
