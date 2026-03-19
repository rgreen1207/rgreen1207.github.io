    // ════════════════════════════════════════
    // DEVTOOLS CONSOLE MESSAGE
    // ════════════════════════════════════════
    console.log('%c', 'font-size:0');
    console.log(
      '%c  ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗\n' +
      '%c  ██╔══██╗╚██╗ ██╔╝██╔══██╗████╗  ██║\n' +
      '%c  ██████╔╝ ╚████╔╝ ███████║██╔██╗ ██║\n' +
      '%c  ██╔══██╗  ╚██╔╝  ██╔══██║██║╚██╗██║\n' +
      '%c  ██║  ██║   ██║   ██║  ██║██║ ╚████║\n' +
      '%c  ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝\n',
      'color:#4ade80','color:#4ade80','color:#4ade80','color:#4ade80','color:#4ade80','color:#4ade80'
    );
    console.log('%c  👋 Hey, you found the source.', 'color:#e2e8f0; font-size:14px; font-weight:bold;');
    console.log('%c  Senior Backend Engineer · Seattle, WA', 'color:#8892a4; font-size:12px;');
    console.log('%c  → ryan@rgreen.dev', 'color:#4ade80; font-size:12px;');
    console.log('%c  → Press ` to open the terminal', 'color:#4ade80; font-size:12px;');
    console.log('%c  → Try the Konami code ↑↑↓↓←→←→BA', 'color:#4ade80; font-size:12px;');

    // ════════════════════════════════════════
    // THEME / COLOR ENGINE
    // ════════════════════════════════════════
    const themes = {
      green:  { accent: '#4ade80', dim: '#22c55e55', label: 'Green'  },
      blue:   { accent: '#60a5fa', dim: '#3b82f655', label: 'Blue'   },
      red:    { accent: '#f87171', dim: '#ef444455', label: 'Red'     },
      yellow: { accent: '#fbbf24', dim: '#f59e0b55', label: 'Yellow' },
      purple: { accent: '#c084fc', dim: '#a855f755', label: 'Purple' },
      white:  { accent: '#f1f5f9', dim: '#e2e8f055', label: 'White'  },
      amber:  { accent: '#fb923c', dim: '#f9731655', label: 'Amber'  },
    };
    let currentTheme = 'green';

    function applyTheme(name) {
      const t = themes[name];
      if (!t) return false;
      currentTheme = name;
      const r = document.documentElement.style;
      r.setProperty('--green',     t.accent);
      r.setProperty('--green-dim', t.dim);
      // Update name-green span color
      const ng = document.getElementById('name-green');
      if (ng) {
        ng.style.setProperty('-webkit-text-fill-color', t.accent);
        ng.style.color = t.accent;
      }
      // Update hero name gradient
      const hn = document.getElementById('hero-name');
      if (hn) {
        hn.style.backgroundImage = `linear-gradient(110deg, #ffffff 0%, #e2e8f0 40%, ${t.accent} 100%)`;
      }
      return true;
    }

    // ════════════════════════════════════════
    // TYPEWRITER
    // ════════════════════════════════════════
    const ryanSpan  = document.getElementById('name-ryan');
    const greenSpan = document.getElementById('name-green');
    const cursor    = document.getElementById('hero-cursor');
    const fullFirst = 'Ryan ';
    const fullLast  = 'Green';
    let ti = 0;

    function retypeN() {
      ryanSpan.textContent  = '';
      greenSpan.textContent = '';
      greenSpan.style.removeProperty('-webkit-text-fill-color');
      greenSpan.style.removeProperty('color');
      cursor.style.visibility = 'visible';
      cursor.style.opacity    = '1';
      cursor.style.animation  = 'blink 0.7s step-end infinite';
      ti = 0;
      typeN();
    }

    function typeN() {
      const full = fullFirst + fullLast;
      if (ti <= full.length) {
        const txt = full.slice(0, ti);
        ryanSpan.textContent  = txt.slice(0, Math.min(ti, fullFirst.length));
        if (ti > fullFirst.length) {
          greenSpan.textContent = txt.slice(fullFirst.length);
        }
        ti++;
        setTimeout(typeN, ti === 1 ? 200 : 95);
      } else {
        // Apply accent color to "Green" after typing
        const t = themes[currentTheme];
        greenSpan.style.setProperty('-webkit-text-fill-color', t.accent);
        greenSpan.style.color = t.accent;
        setTimeout(() => {
          cursor.style.animation  = 'none';
          cursor.style.opacity    = '0';
          setTimeout(() => { cursor.style.visibility = 'hidden'; }, 500);
        }, 1500);
      }
    }

    setTimeout(typeN, 300);

    // retypeWithColor: types "Ryan Green", erases "Green", types color name
    function retypeWithColor(colorName) {
      const t      = themes[colorName];
      const label  = t.label;   // e.g. "Blue"
      let   phase  = 'typing';  // typing → erasing → retyping
      let   idx    = 0;

      // Reset cursor
      cursor.style.visibility = 'visible';
      cursor.style.opacity    = '1';
      cursor.style.animation  = 'blink 0.7s step-end infinite';
      ryanSpan.textContent    = '';
      greenSpan.textContent   = '';
      greenSpan.style.removeProperty('-webkit-text-fill-color');
      greenSpan.style.removeProperty('color');

      const full = fullFirst + fullLast;

      function step() {
        if (phase === 'typing') {
          // Type "Ryan Green"
          if (idx <= full.length) {
            ryanSpan.textContent  = full.slice(0, Math.min(idx, fullFirst.length));
            greenSpan.textContent = idx > fullFirst.length ? full.slice(fullFirst.length, idx) : '';
            idx++;
            setTimeout(step, idx === 1 ? 150 : 90);
          } else {
            // Pause then erase "Green"
            phase = 'erasing';
            idx   = fullLast.length;
            setTimeout(step, 600);
          }
        } else if (phase === 'erasing') {
          if (idx >= 0) {
            greenSpan.textContent = fullLast.slice(0, idx);
            idx--;
            setTimeout(step, 60);
          } else {
            // Start retyping the color name
            phase = 'retyping';
            idx   = 0;
            greenSpan.style.setProperty('-webkit-text-fill-color', t.accent);
            greenSpan.style.color = t.accent;
            setTimeout(step, 120);
          }
        } else if (phase === 'retyping') {
          if (idx <= label.length) {
            greenSpan.textContent = label.slice(0, idx);
            idx++;
            setTimeout(step, 90);
          } else {
            // Done — hide cursor
            setTimeout(() => {
              cursor.style.animation  = 'none';
              cursor.style.opacity    = '0';
              setTimeout(() => { cursor.style.visibility = 'hidden'; }, 500);
            }, 1200);
          }
        }
      }
      step();
    }

    // Click >_ prompt to retype
    document.querySelector('.hero-name-prompt').style.cursor = 'pointer';
    document.querySelector('.hero-name-prompt').title = 'Click to reboot';
    document.querySelector('.hero-name-prompt').addEventListener('click', retypeN);

    // ════════════════════════════════════════
    // KONAMI CODE
    // ════════════════════════════════════════
    const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIdx = 0;

    document.addEventListener('keydown', (e) => {
      if (e.key === konamiSeq[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === konamiSeq.length) {
          konamiIdx = 0;
          triggerKonami();
        }
      } else {
        konamiIdx = e.key === konamiSeq[0] ? 1 : 0;
      }
    });

    function triggerKonami() {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;background:#0d0f14;z-index:9999;
        font-family:'JetBrains Mono',monospace;font-size:13px;color:#4ade80;
        padding:3rem;overflow:hidden;display:flex;flex-direction:column;gap:4px;
      `;
      document.body.appendChild(overlay);

      const lines = [
        '$ sudo deploy ryan-green --env=production',
        '',
        '[  0.001s] Initializing deployment pipeline...',
        '[  0.042s] Loading 8+ years of backend experience... ✓',
        '[  0.198s] Compiling FastAPI expertise... ✓',
        '[  0.341s] Bundling distributed systems knowledge... ✓',
        '[  0.512s] Installing RabbitMQ · Redis · Celery... ✓',
        '[  0.890s] Migrating legacy Rails monolith to microservices... ✓',
        '[  1.203s] Optimizing 10 MariaDB databases (-30% query time)... ✓',
        '[  1.445s] Deploying OpenStreetMap server (saving $80K/yr)... ✓',
        '[  1.788s] Processing 11M+ records in < 30 min... ✓',
        '[  2.001s] Onboarding 20+ junior engineers... ✓',
        '[  2.340s] Running test suite (1,500+ tests)... ✓',
        '[  2.501s] All systems nominal.',
        '',
        '  ██████╗ ███████╗ █████╗ ██████╗ ██╗   ██╗',
        '  ██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝',
        '  ██████╔╝█████╗  ███████║██║  ██║ ╚████╔╝ ',
        '  ██╔══██╗██╔══╝  ██╔══██║██║  ██║  ╚██╔╝  ',
        '  ██║  ██║███████╗██║  ██║██████╔╝   ██║   ',
        '  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝   ',
        '',
        '  ✓ ryan-green successfully deployed to production.',
        '  ✓ Available for hire. Run `sudo hire ryan` to proceed.',
        '',
        '  [ press any key to return ]',
      ];

      let li = 0;
      function printLine() {
        if (li < lines.length) {
          const el = document.createElement('div');
          el.textContent = lines[li];
          if (lines[li].startsWith('  █')) el.style.color = '#4ade80';
          if (lines[li].includes('✓ ryan-green')) el.style.color = '#86efac';
          if (lines[li].includes('Available')) el.style.color = '#86efac';
          overlay.appendChild(el);
          overlay.scrollTop = overlay.scrollHeight;
          li++;
          setTimeout(printLine, lines[li-1] === '' ? 60 : 90);
        }
      }
      printLine();

      const dismiss = () => { overlay.remove(); document.removeEventListener('keydown', dismiss); document.removeEventListener('click', dismiss); };
      setTimeout(() => {
        document.addEventListener('keydown', dismiss);
        document.addEventListener('click', dismiss);
      }, 2000);
    }

    // ════════════════════════════════════════
    // SECRET CLI TERMINAL
    // ════════════════════════════════════════
    let cliOpen = false;
    const cliEl = document.createElement('div');
    cliEl.id = 'secret-cli';
    cliEl.style.cssText = `
      display:none;position:fixed;bottom:0;left:0;right:0;
      background:#0d0f14;border-top:1px solid #252a38;
      font-family:'JetBrains Mono',monospace;font-size:13px;color:#e2e8f0;
      z-index:9998;padding:1rem 2rem;max-height:320px;overflow-y:auto;
    `;

    const cliHistory = document.createElement('div');
    const cliInputRow = document.createElement('div');
    cliInputRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;';
    const cliPromptLabel = document.createElement('span');
    cliPromptLabel.textContent = 'rgreen@dev:~$';
    cliPromptLabel.style.color = '#4ade80';
    const cliInput = document.createElement('input');
    cliInput.type = 'text';
    cliInput.autocomplete = 'off';
    cliInput.spellcheck = false;
    cliInput.style.cssText = `
      background:transparent;border:none;outline:none;color:#e2e8f0;
      font-family:'JetBrains Mono',monospace;font-size:13px;flex:1;caret-color:#4ade80;
    `;
    cliInputRow.appendChild(cliPromptLabel);
    cliInputRow.appendChild(cliInput);
    cliEl.appendChild(cliHistory);
    cliEl.appendChild(cliInputRow);
    document.body.appendChild(cliEl);

    function cliPrint(text, color) {
      const line = document.createElement('div');
      line.textContent = text;
      if (color) line.style.color = color;
      cliHistory.appendChild(line);
      cliEl.scrollTop = cliEl.scrollHeight;
    }

    const cliCommands = {
      help: () => {
        cliPrint('Available commands:', '#8892a4');
        cliPrint('  whoami            — find out who I am');
        cliPrint('  ls                — list skills');
        cliPrint('  cat resume.txt    — print resume summary');
        cliPrint('  ping rgreen.dev   — ping the server');
        cliPrint('  theme <color>     — change accent color');
        cliPrint('    colors: green · blue · red · yellow · purple · white · amber');
        cliPrint('  sudo hire ryan    — make a great decision');
        cliPrint('  clear             — clear terminal');
        cliPrint('  exit              — close terminal');
        cliPrint('');
        cliPrint('  games:', '#8892a4');
        cliPrint('  play snake        — classic snake, text as walls');
        cliPrint('  play invaders     — space invaders, stats as enemies');
        cliPrint('  play centipede    — centipede through the page text');
        cliPrint('  play missile      — missile command, defend your content');
      },
      whoami: () => {
        cliPrint('ryan-green', '#4ade80');
        cliPrint('Senior Backend Engineer · Seattle, WA');
        cliPrint('Specializing in distributed systems, FastAPI, and making legacy code regret existing.');
      },
      ls: () => {
        cliPrint('drwxr-xr-x  Python/         FastAPI/        RabbitMQ/');
        cliPrint('drwxr-xr-x  Redis/          Celery/         PostgreSQL/');
        cliPrint('drwxr-xr-x  AWS/            Docker/         Microservices/');
        cliPrint('-rw-r--r--  distributed-systems.rs    10+ years of xp');
        cliPrint('-rw-r--r--  leadership.md             3 teams · 15 engineers');
      },
      'cat resume.txt': () => {
        cliPrint('--- Ryan Green · Senior Backend Engineer ---', '#4ade80');
        cliPrint('8+ years · Python · FastAPI · Distributed Systems');
        cliPrint('$120K avg annual savings delivered');
        cliPrint('6 production apps shipped · avg 4-5 months each');
        cliPrint('20+ engineers mentored');
        cliPrint('→ ryan@rgreen.dev', '#4ade80');
      },
      'ping rgreen.dev': () => {
        cliPrint('PING rgreen.dev (::1): 56 data bytes');
        setTimeout(() => cliPrint('64 bytes from rgreen.dev: icmp_seq=0 ttl=64 time=0.421 ms'), 400);
        setTimeout(() => cliPrint('64 bytes from rgreen.dev: icmp_seq=1 ttl=64 time=0.388 ms'), 800);
        setTimeout(() => cliPrint('64 bytes from rgreen.dev: icmp_seq=2 ttl=64 time=0.401 ms'), 1200);
        setTimeout(() => cliPrint('--- rgreen.dev ping statistics ---'), 1600);
        setTimeout(() => cliPrint('3 packets transmitted, 3 received, 0% packet loss', '#4ade80'), 2000);
      },
      'sudo hire ryan': () => {
        cliPrint('[sudo] password for recruiter: ********', '#8892a4');
        setTimeout(() => cliPrint('Verifying credentials...'), 600);
        setTimeout(() => cliPrint('✓ Access granted. Excellent taste confirmed.', '#4ade80'), 1200);
        setTimeout(() => cliPrint('→ Opening mailto:ryan@rgreen.dev...', '#4ade80'), 1800);
        setTimeout(() => { window.location.href = 'mailto:ryan@rgreen.dev'; }, 2400);
      },
      clear: () => { cliHistory.innerHTML = ''; },
      exit: () => { toggleCLI(); },
    };

    function runCommand(raw) {
      const cmd = raw.trim().toLowerCase();
      cliPrint(`rgreen@dev:~$ ${raw}`, '#4ade80');
      if (!cmd) return;

      // Theme command
      if (cmd.startsWith('theme ')) {
        const color = cmd.split(' ')[1];
        if (applyTheme(color)) {
          cliPrint(`✓ Accent color changed to ${themes[color].label}.`, themes[color].accent);
          cliPrint(`  Updating identity...`, themes[color].accent);
          setTimeout(() => retypeWithColor(color), 400);
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
        } else {
          cliPrint(`Unknown color: "${color}". Try: green · blue · red · yellow · purple · white · amber`, '#f87171');
        }
        return;
      }

      if (cliCommands[cmd]) {
        cliCommands[cmd]();
      } else if (cmd.startsWith('play ')) {
        const game = cmd.split(' ')[1];
        const games = { snake: launchSnake, invaders: launchInvaders, centipede: launchCentipede, missile: launchMissile };
        if (games[game]) {
          cliPrint(`Launching ${game}... press ESC to quit`, '#4ade80');
          toggleCLI();
          setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => games[game](), 600); }, 100);
        } else {
          cliPrint(`Unknown game: "${game}". Try: snake · invaders · centipede · missile`, '#f87171');
        }
      } else {
        cliPrint(`command not found: ${cmd}. Type 'help' for available commands.`, '#f87171');
      }
    }

    cliEl.addEventListener('click', () => {
      cliInput.focus();
    });

    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        runCommand(cliInput.value);
        cliInput.value = '';
      }
      if (e.key === 'Escape') toggleCLI();
      e.stopPropagation();
    });

    window.toggleCLI = function toggleCLI() {
      cliOpen = !cliOpen;
      cliEl.style.display = cliOpen ? 'block' : 'none';
      if (cliOpen) {
        if (cliHistory.children.length === 0) {
          cliPrint('rgreen.dev terminal v1.0.0 — type \'help\' for commands', '#8892a4');
          cliPrint('');
        }
        setTimeout(() => cliInput.focus(), 50);
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          toggleCLI();
        }
      }
    });

    // ════════════════════════════════════════
    // SCROLL REVEAL
    // ════════════════════════════════════════
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => revealObserver.observe(el));

    // ════════════════════════════════════════
    // NAV ACTIVE STATE
    // ════════════════════════════════════════
    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 100) current = s.id;
      });
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--green)' : '';
      });
    });
