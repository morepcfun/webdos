// -------- START PROGRAM: SNAKE --------
const snakeProgram = {
  name: 'snake',
  program: {
    description: 'A classic snake game. The speed increases!',
    execute: async (term) => {
      return new Promise(resolve => {
        const BOARD_WIDTH = 25, BOARD_HEIGHT = 18, SCORES_KEY = 'webdos_snake_highscores';
        const COLORS = { BORDER: 'var(--green-4)', SCORE_TEXT: 'var(--green-6)', SNAKE_HEAD: 'var(--green-7)', SNAKE_BODY: 'var(--green-5)', FOOD: 'var(--green-6)', GAME_OVER: 'var(--green-7)' };
        const CHARS = { SNAKE_HEAD: '██', SNAKE_BODY: '▓▓', FOOD: '██' };
        let snake, food, score, gameOver, direction, gameLoopId, gameState = 'start', gameSpeed;
        const inputLine = document.querySelector('.input-line');
        const getHighScores = () => { try { const scores = localStorage.getItem(SCORES_KEY); return scores ? JSON.parse(scores) : []; } catch (e) { return []; } };
        const saveHighScore = (newScore) => { if (newScore === 0) return; const scores = getHighScores(); scores.push({ score: newScore, date: new Date().toLocaleDateString() }); scores.sort((a, b) => b.score - a.score); localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 10))); };
        const exitGame = (message) => {
          if (gameLoopId) clearTimeout(gameLoopId);
          document.removeEventListener('keydown', masterInputHandler, { capture: true });
          term.clear();
          if (message) term.print(message);
          inputLine.style.display = 'flex';
          resolve();
        };
        const placeFood = () => {
          while (true) {
            food = { x: Math.floor(Math.random() * BOARD_WIDTH), y: Math.floor(Math.random() * BOARD_HEIGHT) };
            if (!snake.some(segment => segment.x === food.x && segment.y === food.y)) break;
          }
        };
        const initGame = () => {
          snake = [{ x: Math.floor(BOARD_WIDTH / 2), y: Math.floor(BOARD_HEIGHT / 2) }];
          direction = { x: 0, y: 0 };
          score = 0; gameOver = false; gameSpeed = 300; // Slower start speed
          gameState = 'playing';
          placeFood();
          gameLoop();
        };
        const draw = () => {
          term.clear();
          const outputBuffer = [];
          outputBuffer.push(`<span style="color:${COLORS.BORDER}">╔${'══'.repeat(BOARD_WIDTH)}╗</span>`);
          for (let y = 0; y < BOARD_HEIGHT; y++) {
            let line = `<span style="color:${COLORS.BORDER}">║</span>`;
            for (let x = 0; x < BOARD_WIDTH; x++) {
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
              const isFood = food.x === x && food.y === y;
              if (isHead) line += `<span style="color:${COLORS.SNAKE_HEAD}">${CHARS.SNAKE_HEAD}</span>`;
              else if (isBody) line += `<span style="color:${COLORS.SNAKE_BODY}">${CHARS.SNAKE_BODY}</span>`;
              else if (isFood) line += `<span style="color:${COLORS.FOOD}">${CHARS.FOOD}</span>`;
              else line += '  ';
            }
            line += `<span style="color:${COLORS.BORDER}">║</span>`;
            outputBuffer.push(line);
          }
          outputBuffer.push(`<span style="color:${COLORS.BORDER}">╚${'══'.repeat(BOARD_WIDTH)}╝</span>`);
          outputBuffer.push(`<span style="color:${COLORS.SCORE_TEXT}">  Score: ${score} | Speed: ${((150 / gameSpeed - 0.5) * 2 * 100).toFixed(0)}%</span>`);
          term.print(outputBuffer.join('\n'));
        };
        const masterInputHandler = (e) => {
          if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); exitGame("Snake exited by user."); return; }
          e.stopImmediatePropagation(); e.preventDefault();
          if (gameState === 'start') { initGame(); return; }
          if (gameState === 'playing') {
            switch (e.key) {
              case 'ArrowUp': if (direction.y === 0) direction = { x: 0, y: -1 }; break;
              case 'ArrowDown': if (direction.y === 0) direction = { x: 0, y: 1 }; break;
              case 'ArrowLeft': if (direction.x === 0) direction = { x: -1, y: 0 }; break;
              case 'ArrowRight': if (direction.x === 0) direction = { x: 1, y: 0 }; break;
            }
          }
        };
        const showStartScreen = () => {
          term.clear();
          term.print("=== SNAKE ===", { color: COLORS.SCORE_TEXT });
          term.print("Controls:\n  Arrow keys: Steer the snake\n  Alt+Q: Force quit\n");
          term.print("Top 10 High Scores:");
          const highScores = getHighScores();
          if (highScores.length === 0) { term.print("  No high scores yet. Be the first!"); }
          else { highScores.forEach((s, i) => term.print(`${(i + 1).toString().padStart(2)}. ${s.score.toString().padStart(6, ' ')} (${s.date})`)); }
          term.print("\nPress any key to start...");
        };
        const gameLoop = () => {
          if (gameOver) {
            saveHighScore(score);
            term.print(`\n<span style='color: ${COLORS.GAME_OVER};'>Game Over!</span>`);
            term.print("To play again, type 'snake' and press Enter.");
            document.removeEventListener('keydown', masterInputHandler, { capture: true });
            inputLine.style.display = 'flex';
            resolve(); return;
          }
          const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
          if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) gameOver = true;
          if (snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) gameOver = true;
          if (direction.x !== 0 || direction.y !== 0) {
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
              score += 10;
              gameSpeed = Math.max(40, gameSpeed * 0.97); // Increase speed!
              placeFood();
            } else {
              snake.pop();
            }
          }
          draw();
          gameLoopId = setTimeout(gameLoop, gameSpeed);
        };
        inputLine.style.display = 'none';
        document.addEventListener('keydown', masterInputHandler, { capture: true });
        showStartScreen();
      });
    }
  }
};
SystemPrograms.push(snakeProgram);
// -------- END PROGRAM: SNAKE --------