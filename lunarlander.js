// -------- START PROGRAM: LUNARLANDER --------
const lunarlanderProgram = {
  name: 'lunarlander',
  program: {
    description: 'Land the lunar module safely on the moon.',
    execute: async (term) => {
      return new Promise(resolve => {
        // --- Game Config ---
        const WIDTH = 70, HEIGHT = 24, SCORES_KEY = 'webdos_lunarlander_highscores';
        const GRAVITY = 0.001, MAIN_THRUST = -0.0025, SIDE_THRUST = 0.0015;
        const SAFE_LANDING_SPEED_V = 0.1, SAFE_LANDING_SPEED_H = 0.15;
        const COLORS = { HUD_SAFE: 'var(--green-5)', HUD_WARN: 'var(--green-6)', HUD_DANGER: 'var(--green-7)', TERRAIN: 'var(--green-4)', PAD: 'var(--green-6)', LANDER: 'var(--green-7)', FLAME: 'var(--green-6)' };
        const CHARS = { LANDER: 'V', TERRAIN: '█', MAIN_FLAME: '▲', SIDE_FLAME_L: '>', SIDE_FLAME_R: '<' };
        // --- Game State ---
        let lander, terrain, landingPad, gameState, gameLoopId, level, totalScore;
        let keys = {};
        const inputLine = document.querySelector('.input-line');
        const getHighScores = () => { try { const scores = localStorage.getItem(SCORES_KEY); return scores ? JSON.parse(scores) : []; } catch (e) { return []; } };
        const saveHighScore = (newScore) => { if (newScore === 0) return; const scores = getHighScores(); scores.push({ score: newScore, date: new Date().toLocaleDateString() }); scores.sort((a, b) => b.score - a.score); localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 3))); };
        const startLevel = () => {
          generateTerrain();
          lander = { x: WIDTH / 2, y: 5, vx: 0.05 * (1 + level / 10), vy: 0, fuel: 750 };
          gameState = 'running';
          // If the loop isn't running, start it.
          if (!gameLoopId) {
            gameLoopId = requestAnimationFrame(gameLoop);
          }
        };
        const runGame = () => {
          level = 1;
          totalScore = 0;
          startLevel();
        };
        const generateTerrain = () => {
          terrain = [];
          let currentY = HEIGHT - 5;
          for (let i = 0; i < WIDTH; i++) {
            if (Math.random() > 0.6) currentY += (Math.random() > 0.5 ? 1 : -1);
            currentY = Math.max(HEIGHT - 10, Math.min(HEIGHT - 2, currentY));
            terrain.push(currentY);
          }
          const padWidth = Math.max(4, 9 - Math.floor(level / 2));
          const padStartIndex = Math.floor(10 + Math.random() * (WIDTH - padWidth - 20));
          const padY = terrain[padStartIndex + Math.floor(padWidth / 2)];
          for (let i = 0; i < padWidth; i++) {
            terrain[padStartIndex + i] = padY;
          }
          landingPad = { startX: padStartIndex, endX: padStartIndex + padWidth, y: padY };
        };
        const handleKeyDown = (e) => { keys[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
        const exitGame = () => {
          if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
          document.removeEventListener('keydown', masterInputHandler, { capture: true });
          term.print("\nTo play again, type 'lunarlander' and press Enter.");
          inputLine.style.display = 'flex';
          resolve();
        };
        const update = () => {
          if (gameState !== 'running') return;
          lander.vy += GRAVITY;
          if (lander.fuel > 0) {
            if (keys['w'] || keys['arrowup']) { lander.vy += MAIN_THRUST; lander.fuel -= 1; }
            if (keys['a'] || keys['arrowleft']) { lander.vx -= SIDE_THRUST; lander.fuel -= 0.2; }
            if (keys['d'] || keys['arrowright']) { lander.vx += SIDE_THRUST; lander.fuel -= 0.2; }
          }
          if (lander.fuel < 0) lander.fuel = 0;
          lander.x += lander.vx; lander.y += lander.vy;
          const landerRoundX = Math.round(lander.x);
          const groundY = landerRoundX >= 0 && landerRoundX < WIDTH ? terrain[landerRoundX] : HEIGHT;
          if (lander.y >= groundY - 1) {
            lander.y = groundY - 1;
            const onPad = landerRoundX >= landingPad.startX && landerRoundX <= landingPad.endX;
            const safeV = Math.abs(lander.vy) < SAFE_LANDING_SPEED_V;
            const safeH = Math.abs(lander.vx) < SAFE_LANDING_SPEED_H;
            if (onPad && safeV && safeH) gameState = 'landed';
            else gameState = 'crashed';
          }
        };
        const draw = (message) => {
          term.clear();
          let grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));
          for (let x = 0; x < WIDTH; x++) {
            const color = (x >= landingPad.startX && x <= landingPad.endX) ? COLORS.PAD : COLORS.TERRAIN;
            for (let y = terrain[x]; y < HEIGHT; y++) grid[y][x] = `<span style="color:${color}">${CHARS.TERRAIN}</span>`;
          }
          const landerRoundX = Math.round(lander.x), landerRoundY = Math.round(lander.y);
          if (landerRoundY >= 0 && landerRoundY < HEIGHT && landerRoundX >= 0 && landerRoundX < WIDTH) {
            grid[landerRoundY][landerRoundX] = `<span style="color:${COLORS.LANDER}">${CHARS.LANDER}</span>`;
            if (lander.fuel > 0 && gameState === 'running') {
              if ((keys['w'] || keys['arrowup']) && landerRoundY + 1 < HEIGHT) grid[landerRoundY + 1][landerRoundX] = `<span style="color:${COLORS.FLAME}">${CHARS.MAIN_FLAME}</span>`;
              if ((keys['a'] || keys['arrowleft']) && landerRoundX + 1 < WIDTH) grid[landerRoundY][landerRoundX + 1] = `<span style="color:${COLORS.FLAME}">${CHARS.SIDE_FLAME_L}</span>`;
              if ((keys['d'] || keys['arrowright']) && landerRoundX - 1 >= 0) grid[landerRoundY][landerRoundX - 1] = `<span style="color:${COLORS.FLAME}">${CHARS.SIDE_FLAME_R}</span>`;
            }
          }
          const groundY = terrain[landerRoundX] || HEIGHT;
          const altitude = Math.max(0, groundY - lander.y - 1);
          const vSpeedColor = Math.abs(lander.vy) < SAFE_LANDING_SPEED_V ? COLORS.HUD_SAFE : (Math.abs(lander.vy) < SAFE_LANDING_SPEED_V * 2 ? COLORS.HUD_WARN : COLORS.HUD_DANGER);
          const hSpeedColor = Math.abs(lander.vx) < SAFE_LANDING_SPEED_H ? COLORS.HUD_SAFE : (Math.abs(lander.vx) < SAFE_LANDING_SPEED_H * 2 ? COLORS.HUD_WARN : COLORS.HUD_DANGER);
          const fuelColor = lander.fuel > 300 ? COLORS.HUD_SAFE : (lander.fuel > 100 ? COLORS.HUD_WARN : COLORS.HUD_DANGER);
          const fuelBar = '█'.repeat(Math.ceil(lander.fuel / 37.5)) + '░'.repeat(20 - Math.ceil(lander.fuel / 37.5));
          let output = grid.map(row => row.join('')).join('\n');
          output += `\nLVL: ${level} | ALT: ${altitude.toFixed(2).padStart(7, ' ')}m | `;
          output += `V SPD: <span style="color:${vSpeedColor}">${lander.vy.toFixed(2).padStart(5, ' ')}</span> | `;
          output += `H SPD: <span style="color:${hSpeedColor}">${lander.vx.toFixed(2).padStart(5, ' ')}</span> | `;
          output += `FUEL: <span style="color:${fuelColor}">[${fuelBar}]</span>`;
          output += `\nSCORE: ${totalScore}`;
          if (message) output += `\n\n${message}`;
          term.print(output);
        };
        const gameLoop = () => {
          update();
          if (gameState === 'running') {
            draw();
            gameLoopId = requestAnimationFrame(gameLoop);
          } else {
            gameLoopId = null; // Stop the loop
            if (gameState === 'landed') {
              const fuelBonus = Math.round(lander.fuel);
              const speedBonus = Math.round((SAFE_LANDING_SPEED_V - Math.abs(lander.vy)) * 1000 + (SAFE_LANDING_SPEED_H - Math.abs(lander.vx)) * 500);
              const levelScore = fuelBonus + speedBonus + (level * 250);
              totalScore += levelScore;
              level++;
              let nextLevelMessage = `<span style="background-color:${COLORS.PAD}; color:var(--black);">-- LEVEL ${level - 1} COMPLETE! | +${levelScore} pts --</span>`;
              nextLevelMessage += `\nPreparing next descent...`;
              draw(nextLevelMessage);
              setTimeout(startLevel, 3000);
            } else { // Crashed
              saveHighScore(totalScore);
              const highScores = getHighScores();
              let finalMessage = `<span style="background-color:${COLORS.HUD_DANGER}; color:var(--black);">-- GAME OVER | FINAL SCORE: ${totalScore} --</span>\n\n--- Top Scores ---\n`;
              highScores.forEach((s, i) => { finalMessage += `${i + 1}. ${s.score} (${s.date})\n`; });
              draw(finalMessage);
              setTimeout(exitGame, 4000);
            }
          }
        };
        const masterInputHandler = (e) => { if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); gameState = 'exit'; saveHighScore(totalScore); exitGame("Lunar Lander exited by user."); } };
        const showStartScreen = () => {
          term.clear();
          term.print("=== LUNAR LANDER ===");
          term.print("Safely land the module on the highlighted landing pad.\n");
          term.print("Controls:\n  W/Up Arrow:    Main Thruster\n  A,D/Left,Right: Side Thrusters\n  Alt+Q:          Quit Game\n");
          const highScores = getHighScores();
          if (highScores.length > 0) {
            term.print("--- Top Scores ---");
            highScores.forEach((s, i) => term.print(`${i + 1}. ${s.score} (${s.date})`));
          }
          term.print("\nPress any key to begin...");
          document.addEventListener('keydown', function startHandler(e) {
            e.preventDefault(); e.stopImmediatePropagation();
            this.removeEventListener('keydown', startHandler);
            inputLine.style.display = 'none';
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            document.addEventListener('keydown', masterInputHandler, { capture: true });
            runGame();
          }, { once: true });
        };
        showStartScreen();
      });
    }
  }
};
SystemPrograms.push(lunarlanderProgram);
// -------- END PROGRAM: LUNARLANDER --------