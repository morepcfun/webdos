// -------- START PROGRAM: BREAKOUT --------
const breakoutProgram = {
  name: 'breakout',
  program: {
    description: 'Smash bricks with the ball in this arcade classic.',
    execute: async (term) => {
      return new Promise(resolve => {
        const WIDTH = 50, HEIGHT = 24;
        const PADDLE_WIDTH = 10;
        const BRICK_COLORS = ['var(--green-3)', 'var(--green-4)', 'var(--green-5)', 'var(--green-6)'];
        let paddle, ball, bricks, score, lives, gameState;
        let keys = {};
        let gameLoopId = null;
        const initGame = () => {
          gameState = 'running';
          score = 0; lives = 3;
          paddle = { x: (WIDTH - PADDLE_WIDTH) / 2 };
          resetBall(); createBricks();
          document.addEventListener('keydown', handleKeyDown);
          document.addEventListener('keyup', handleKeyUp);
          gameLoop();
        };
        const resetBall = () => { ball = { x: WIDTH / 2, y: HEIGHT - 3, dx: Math.random() > 0.5 ? 0.4 : -0.4, dy: -0.25 }; };
        const createBricks = () => {
          bricks = [];
          const brickRows = 4, brickCols = 10;
          const brickWidth = WIDTH / brickCols;
          for (let r = 0; r < brickRows; r++) { for (let c = 0; c < brickCols; c++) { bricks.push({ x: c * brickWidth, y: r + 2, width: brickWidth, alive: true, color: BRICK_COLORS[r % BRICK_COLORS.length] }); } }
        };
        const handleKeyDown = (e) => { keys[e.key] = true; };
        const handleKeyUp = (e) => { keys[e.key] = false; };
        const update = () => {
          if (gameState !== 'running') return;
          if (keys['ArrowLeft'] && paddle.x > 0) paddle.x -= 1;
          if (keys['ArrowRight'] && paddle.x < WIDTH - PADDLE_WIDTH) paddle.x += 1;
          ball.x += ball.dx; ball.y += ball.dy;
          if (ball.x <= 0 || ball.x >= WIDTH - 1) ball.dx *= -1;
          if (ball.y <= 0) ball.dy *= -1;
          if (ball.y >= HEIGHT - 1) {
            lives--;
            if (lives <= 0) { gameState = 'gameOver'; }
            else { resetBall(); }
          }
          const ballFloorY = Math.floor(ball.y);
          if (ballFloorY === HEIGHT - 2 && ball.dy > 0 && ball.x >= paddle.x && ball.x < paddle.x + PADDLE_WIDTH) {
            ball.dy *= -1;
            let hitPos = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2); // -1 to 1
            ball.dx = hitPos * 0.5; // Scale paddle influence for more controlled speed
          }
          for (const brick of bricks) {
            if (brick.alive && Math.floor(ball.y) === Math.floor(brick.y) && ball.x >= brick.x && ball.x < brick.x + brick.width) {
              brick.alive = false;
              ball.dy *= -1;
              score += 10;
            }
          }
          if (bricks.every(b => !b.alive)) { gameState = 'win'; }
        };
        const draw = () => {
          term.clear();
          let grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));
          for (const brick of bricks) { if (brick.alive) { for (let i = 0; i < Math.floor(brick.width); i++) { if (Math.floor(brick.x) + i < WIDTH) grid[Math.floor(brick.y)][Math.floor(brick.x) + i] = `<span style="color:${brick.color}">▓</span>`; } } }
          for (let i = 0; i < PADDLE_WIDTH; i++) { if (Math.floor(paddle.x) + i < WIDTH) grid[HEIGHT - 2][Math.floor(paddle.x) + i] = '▀'; }
          if (Math.floor(ball.y) >= 0 && Math.floor(ball.y) < HEIGHT && Math.floor(ball.x) >= 0 && Math.floor(ball.x) < WIDTH) {
            grid[Math.floor(ball.y)][Math.floor(ball.x)] = 'O';
          }
          let output = grid.map(row => row.join('')).join('\n');
          output += `\nScore: ${score} | Lives left: ${'♥'.repeat(lives)}`;
          if (gameState === 'gameOver') { output += "\n\n  GAME OVER!"; }
          else if (gameState === 'win') { output += "\n\n  YOU WON! CONGRATULATIONS!"; }
          term.print(output);
        };
        const gameLoop = () => {
          if (gameState === 'gameOver' || gameState === 'win' || gameState === 'exit') {
            draw();
            exitGame(gameState === 'exit' ? "Breakout exited by user." : null);
            return;
          }
          update();
          draw();
          gameLoopId = requestAnimationFrame(gameLoop);
        };
        const exitGame = (message) => {
          if (gameLoopId) cancelAnimationFrame(gameLoopId);
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
          document.removeEventListener('keydown', masterInputHandler, { capture: true });
          if (message) term.print("\n" + message);
          term.print("\nTo play again, type 'breakout' and press Enter.");
          document.querySelector('.input-line').style.display = 'flex';
          resolve();
        };
        const masterInputHandler = (e) => { if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); gameState = 'exit'; } };
        const showStartScreen = () => {
          term.clear();
          term.print("=== BREAKOUT ===");
          term.print("Smash all the bricks with the ball to win.\n");
          term.print("Controls:\n  Left/Right Arrow: Steer the paddle\n  Alt+Q: Quit game\n");
          term.print("Press any key to start...");
          document.addEventListener('keydown', function startHandler(e) {
            e.preventDefault(); e.stopImmediatePropagation();
            this.removeEventListener('keydown', startHandler);
            document.querySelector('.input-line').style.display = 'none';
            document.addEventListener('keydown', masterInputHandler, { capture: true });
            initGame();
          }, { once: true });
        };
        showStartScreen();
      });
    }
  }
};
SystemPrograms.push(breakoutProgram);
// -------- END PROGRAM: BREAKOUT --------