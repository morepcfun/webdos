// -------- START PROGRAM: TETRIS --------
const tetrisProgram = {
  name: 'tetris',
  program: {
    description: 'A classic block-stacking game.',
    execute: async (term) => {
      return new Promise(resolve => {
        const BOARD_WIDTH = 10, BOARD_HEIGHT = 20, SCORES_KEY = 'webdos_tetris_highscores';
        const COLORS = { BORDER: 'var(--green-4)', SCORE_TEXT: 'var(--green-6)', LOCKED_PIECE: 'var(--green-5)', GHOST_PIECE: 'var(--green-3)', ACTIVE_PIECE: 'var(--green-7)', GAME_OVER: 'var(--green-7)' };
        const PIECES = { 'I': [[1, 1, 1, 1]], 'O': [[1, 1], [1, 1]], 'T': [[0, 1, 0], [1, 1, 1]], 'L': [[0, 0, 1], [1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]], 'S': [[0, 1, 1], [1, 1, 0]], 'Z': [[1, 1, 0], [0, 1, 1]] };
        const PIECE_TYPES = 'IOTLJSZ';
        let board, score, lines, gameOver, currentPiece, nextPiece, gameLoopId, gameState = 'start';
        const inputLine = document.querySelector('.input-line');
        const getHighScores = () => { try { const scores = localStorage.getItem(SCORES_KEY); return scores ? JSON.parse(scores) : []; } catch (e) { return []; } };
        const saveHighScore = (newScore) => { if (newScore === 0) return; const scores = getHighScores(); scores.push({ score: newScore, date: new Date().toLocaleDateString() }); scores.sort((a, b) => b.score - a.score); localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 10))); };
        const exitGame = (message) => {
          if (gameLoopId) cancelAnimationFrame(gameLoopId);
          document.removeEventListener('keydown', masterInputHandler, { capture: true });
          term.clear();
          if (message) term.print(message);
          inputLine.style.display = 'flex';
          resolve();
        };
        const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        const spawnPiece = () => { currentPiece = nextPiece; const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]; nextPiece = { shape: PIECES[type], x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }; if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) { gameOver = true; } };
        const checkCollision = (shape, x, y) => { for (let row = 0; row < shape.length; row++) { for (let col = 0; col < shape[row].length; col++) { if (shape[row][col]) { let boardX = x + col; let boardY = y + row; if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || (boardY >= 0 && board[boardY][boardX])) { return true; } } } } return false; };
        const rotatePiece = () => { const shape = currentPiece.shape; const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse()); if (!checkCollision(newShape, currentPiece.x, currentPiece.y)) { currentPiece.shape = newShape; } };
        const lockPiece = () => { currentPiece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value && (currentPiece.y + y) >= 0) { board[currentPiece.y + y][currentPiece.x + x] = 1; } }); }); };
        const clearLines = () => {
          let linesCleared = 0;
          for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
              linesCleared++;
              board.splice(y, 1);
              board.unshift(Array(BOARD_WIDTH).fill(0));
              y++;
            }
          }
          if (linesCleared > 0) {
            lines += linesCleared;
            score += (linesCleared * 100) * linesCleared;
          }
        };
        const getGhostPosition = () => { let ghostY = currentPiece.y; while (!checkCollision(currentPiece.shape, currentPiece.x, ghostY + 1)) { ghostY++; } return ghostY; };
        const draw = () => {
          term.clear();
          const ghostY = getGhostPosition();
          const outputBuffer = [];
          outputBuffer.push(`<span style="color:${COLORS.BORDER}">╔${'══'.repeat(BOARD_WIDTH)}╗</span>`);
          for (let y = 0; y < BOARD_HEIGHT; y++) {
            let line = `<span style="color:${COLORS.BORDER}">║</span>`;
            for (let x = 0; x < BOARD_WIDTH; x++) {
              const pieceX = x - currentPiece.x, pieceY = y - currentPiece.y, ghostPieceY = y - ghostY;
              const isPiece = pieceY >= 0 && pieceY < currentPiece.shape.length && pieceX >= 0 && pieceX < currentPiece.shape[pieceY].length && currentPiece.shape[pieceY][pieceX];
              const isGhost = ghostPieceY >= 0 && ghostPieceY < currentPiece.shape.length && pieceX >= 0 && pieceX < currentPiece.shape[ghostPieceY].length && currentPiece.shape[ghostPieceY][pieceX];
              if (isPiece) { line += `<span style="color:${COLORS.ACTIVE_PIECE}">██</span>`; }
              else if (isGhost) { line += `<span style="color:${COLORS.GHOST_PIECE}">░░</span>`; }
              else if (board[y][x]) { line += `<span style="color:${COLORS.LOCKED_PIECE}">▓▓</span>`; }
              else { line += '  '; }
            }
            line += `<span style="color:${COLORS.BORDER}">║</span>`;
            outputBuffer.push(line);
          }
          outputBuffer.push(`<span style="color:${COLORS.BORDER}">╚${'══'.repeat(BOARD_WIDTH)}╝</span>`);
          outputBuffer.push(`<span style="color:${COLORS.SCORE_TEXT}">  Score: ${score}   Lines: ${lines}</span>`);
          outputBuffer.push(`<span style="color:${COLORS.SCORE_TEXT}">  Next:</span>`);
          if (nextPiece && nextPiece.shape) {
            nextPiece.shape.forEach(row => {
              const nextPieceLine = '  ' + row.map(cell => cell ? '██' : '  ').join('');
              outputBuffer.push(`<span style="color:${COLORS.ACTIVE_PIECE}">${nextPieceLine}</span>`);
            });
          }
          term.print(outputBuffer.join('\n'));
        };
        const masterInputHandler = (e) => {
          if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); exitGame("Tetris exited by user."); return; }
          e.stopImmediatePropagation();
          switch (gameState) {
            case 'start': e.preventDefault(); gameState = 'playing'; runGame(); break;
            case 'playing':
              if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
              if (e.key === 'ArrowLeft') { if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) currentPiece.x--; }
              else if (e.key === 'ArrowRight') { if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) currentPiece.x++; }
              else if (e.key === 'ArrowDown') { if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) { currentPiece.y++; score += 1; } else { lockPiece(); clearLines(); spawnPiece(); } }
              else if (e.key === 'ArrowUp') { rotatePiece(); }
              else if (e.key === ' ') { const ghostY = getGhostPosition(); score += (ghostY - currentPiece.y) * 2; currentPiece.y = ghostY; lockPiece(); clearLines(); spawnPiece(); }
              draw();
              break;
          }
        };
        const showStartScreen = () => {
          term.clear();
          term.print("=== TETRIS ===", { color: COLORS.SCORE_TEXT });
          term.print("Controls:\n  Left/Right: Move\n  Up: Rotate\n  Down: Soft drop\n  Spacebar: Hard drop\n  Alt+Q: Force quit\n");
          term.print("Top 10 High Scores:");
          const highScores = getHighScores();
          if (highScores.length === 0) { term.print("  No high scores yet. Be the first!"); }
          else { highScores.forEach((s, i) => term.print(`${(i + 1).toString().padStart(2)}. ${s.score.toString().padStart(6, ' ')} (${s.date})`)); }
          term.print("\nPress any key to start...");
        };
        const runGame = () => {
          board = createEmptyBoard(); score = 0; lines = 0; gameOver = false;
          const firstType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
          nextPiece = { shape: PIECES[firstType], x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
          spawnPiece();
          let lastTime = 0; let dropCounter = 0;
          const gameLoop = (time = 0) => {
            if (gameOver) {
              saveHighScore(score);
              term.print(`\n<span style='color: ${COLORS.GAME_OVER};'>Game Over!</span>`);
              term.print("To play again, type 'tetris' and press Enter.");
              cancelAnimationFrame(gameLoopId);
              document.removeEventListener('keydown', masterInputHandler, { capture: true });
              inputLine.style.display = 'flex';
              resolve(); return;
            }
            const deltaTime = time - lastTime; lastTime = time; dropCounter += deltaTime;
            if (dropCounter > 1000) { if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) { lockPiece(); clearLines(); spawnPiece(); } else { currentPiece.y++; } dropCounter = 0; }
            draw();
            gameLoopId = requestAnimationFrame(gameLoop);
          };
          gameLoop();
        };
        inputLine.style.display = 'none';
        document.addEventListener('keydown', masterInputHandler, { capture: true });
        showStartScreen();
      });
    }
  }
};
SystemPrograms.push(tetrisProgram);
// -------- END PROGRAM: TETRIS --------