    // ════════════════════════════════════════
    // GAME ENGINE — shared utilities
    // ════════════════════════════════════════
    function createGameCanvas(onEsc) {
      const hero = document.getElementById('about');
      const rect = hero.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;

      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(13,15,20,0.96);z-index:8000;`;

      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      canvas.style.cssText = 'display:block;';
      overlay.appendChild(canvas);

      const hud = document.createElement('div');
      hud.style.cssText = `position:absolute;top:12px;right:16px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#4ade80;text-align:right;pointer-events:none;`;
      overlay.appendChild(hud);

      const escHint = document.createElement('div');
      escHint.style.cssText = `position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:11px;color:#4a5568;`;
      escHint.textContent = 'ESC to quit';
      overlay.appendChild(escHint);

      document.body.appendChild(overlay);

      const escHandler = (e) => { if (e.key === 'Escape') { cleanup(); onEsc && onEsc(); } };
      document.addEventListener('keydown', escHandler);

      function cleanup() {
        document.removeEventListener('keydown', escHandler);
        overlay.remove();
      }

      return { canvas, ctx: canvas.getContext('2d'), W, H, hud, overlay, cleanup };
    }

    function gameOver(ctx, W, H, msg, score, cleanup, relaunch) {
      ctx.fillStyle = 'rgba(13,15,20,0.85)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f87171';
      ctx.font = "bold 48px 'JetBrains Mono',monospace";
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W/2, H/2 - 60);
      ctx.fillStyle = '#4ade80';
      ctx.font = "20px 'JetBrains Mono',monospace";
      ctx.fillText(msg, W/2, H/2 - 10);
      ctx.fillStyle = '#8892a4';
      ctx.font = "14px 'JetBrains Mono',monospace";
      ctx.fillText(`Score: ${score}`, W/2, H/2 + 30);
      ctx.fillText('R to restart · ESC to quit', W/2, H/2 + 60);
      const restart = (e) => {
        if (e.key === 'r' || e.key === 'R') { document.removeEventListener('keydown', restart); cleanup(); relaunch(); }
      };
      document.addEventListener('keydown', restart);
    }

