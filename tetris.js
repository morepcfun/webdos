programs['tetris'] = {
    description: 'The classic block-stacking puzzle game.',
    execute: async (term, args) => {

        // --- GAME STATE AND CLEANUP ---
        let gameKeydownListener = null; // To hold our game's keyboard listener

        function cleanup() {
            // Remove game-specific event listeners
            if (gameKeydownListener) {
                document.removeEventListener('keydown', gameKeydownListener);
            }
            // A resize listener is also added by the game, so we should clean it up.
            // This is harder to do directly without modifying the original game code,
            // but for this scope, removing the main listener is key.

            // Remove the game's UI and styles
            const gameWrapper = document.getElementById('tetris-wrapper');
            const gameStyles = document.getElementById('tetris-styles');
            if (gameWrapper) gameWrapper.remove();
            if (gameStyles) gameStyles.remove();

            // Give control back to the terminal
            window.isProgramRunning = false;
            term.print("\nExited Tetris. Welcome back to WEB-DOS.");
        }

        // --- STEP 1: DEFINE THE GAME'S HTML STRUCTURE ---
        const gameHTML = `
            <div class="game-container">
                <div class="info-panel">
                    <div class="info-section">
                        <h2 id="score-label">Score</h2>
                        <p id="score">0</p>
                    </div>
                    <div class="info-section">
                        <h2 id="level-label">Level</h2>
                        <p id="level">1</p>
                    </div>
                    <div class="info-section">
                        <h2 id="next-label">Next</h2>
                        <canvas id="nextPieceCanvas"></canvas>
                        <div id="controls">
                            <div><span class="key">← →</span><span class="action-text">Move</span></div>
                            <div><span class="key">↑</span><span class="action-text">Rotate</span></div>
                            <div><span class="key">↓</span><span class="action-text">Speed Up</span></div>
                            <div><span class="key">Space</span><span class="action-text">Drop</span></div>
                            <div><span class="key">P</span><span class="action-text">Pause</span></div>
                        </div>
                    </div>
                </div>
                <canvas id="gameCanvas"></canvas>
                <div class="highscore-panel">
                    <h1 id="main-title">Tetris</h1>
                    <h2 id="highscore-title">Top 10</h2>
                    <ol id="highscore-list"></ol>
                    <button id="resetHighscoreButton">Reset Scores</button>
                </div>
                <div class="game-over-screen" id="gameStatusScreen">
                    <div id="statusMessage"></div>
                    <button id="statusButton"></button>
                    <button id="exitButton">Exit to DOS</button>
                </div>
            </div>
        `;

        // --- STEP 2: DEFINE THE RESTYLED CSS ---
        const gameCSS = `
            :root {
                --green: #65ff14;
                --dark-green: #008000;
                --dark-bg: #000000;
                --text-color: #e0e0e0;
                --game-over-color: #ff0000;
            }
            #tetris-wrapper {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: var(--dark-bg);
                font-family: 'Courier New', Courier, monospace;
                z-index: 1000;
            }
            .game-container {
                display: flex;
                gap: 3vh;
                background-color: var(--dark-bg);
                padding: 2vh;
                border-radius: 2vh;
                box-shadow: 0 0 5vh rgba(101, 255, 20, 0.6), 0 0 2.5vh rgba(101, 255, 20, 0.4) inset;
                border: 0.4vh solid var(--green);
                position: relative;
            }
            canvas#gameCanvas {
                background-color: #050505;
                border: 0.3vh solid var(--green);
                box-shadow: 0 0 2.5vh rgba(101, 255, 20, 0.5);
                display: block;
            }
            .info-panel, .highscore-panel {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                width: 30vh;
                padding: 2vh;
                background-color: var(--dark-bg);
                border-radius: 1.5vh;
                border: 0.3vh solid var(--dark-green);
                box-shadow: 0 0 3vh rgba(0, 128, 0, 0.6), 0 0 1.5vh rgba(0, 128, 0, 0.4) inset;
            }
            .highscore-panel {
                border-color: var(--green);
                box-shadow: 0 0 3vh rgba(101, 255, 20, 0.6), 0 0 1.5vh rgba(101, 255, 20, 0.4) inset;
            }
            .highscore-panel h2, .info-section h2 {
                font-size: 3.6vh;
                color: var(--green);
                text-shadow: 0 0 1vh var(--green);
                margin: 0 0 1.5vh 0;
            }
            .highscore-panel ol { list-style-type: none; text-align: center; width: 100%; padding-left: 0; margin: 0; font-size: 3.1vh; color: var(--text-color); }
            .highscore-panel li { margin-bottom: 0.8vh; text-shadow: 0 0 0.5vh var(--green); }
            .info-section { width: 100%; text-align: center; margin-bottom: 1.5vh; }
            .info-section p { font-size: 4.5vh; color: var(--green); text-shadow: 0 0 0.8vh var(--green); margin: 0; }
            #nextPieceCanvas { background-color: #050505; border: 0.2vh solid var(--dark-green); box-shadow: 0 0 1.5vh rgba(0, 128, 0, 0.5); margin: 1vh 0 2vh 0; width: 100%; height: 12vh; }
            .game-over-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); display: none; flex-direction: column; justify-content: center; align-items: center; font-size: 7vh; color: var(--game-over-color); text-shadow: 0 0 2vh var(--game-over-color); z-index: 100; border-radius: 1.8vh; }
            .game-over-screen button { background-color: var(--green); color: var(--dark-bg); border: 0.3vh solid var(--dark-green); padding: 2vh 4vh; font-family: 'Courier New', Courier, monospace; font-size: 2.5vh; cursor: pointer; border-radius: 1vh; box-shadow: 0 0 1.5vh rgba(101, 255, 20, 0.7); transition: transform 0.2s, box-shadow 0.2s; margin-top: 3vh; }
            .game-over-screen button:hover { transform: scale(1.05); box-shadow: 0 0 2.5vh rgba(101, 255, 20, 1); }
            #exitButton { background-color: var(--dark-green); margin-top: 1vh; }
            #resetHighscoreButton { background-color: var(--game-over-color); color: var(--text-color); border: 0.3vh solid #cc0000; padding: 1.5vh 3vh; font-family: 'Courier New', Courier, monospace; font-size: 2.2vh; cursor: pointer; border-radius: 1vh; box-shadow: 0 0 1.5vh rgba(255, 0, 0, 0.7); margin-top: auto; }
            #controls { width: 100%; margin-top: 2vh; font-size: 2vh; color: var(--dark-green); opacity: 0.8; }
            #controls div { display: flex; align-items: center; margin-bottom: 0.8vh; }
            #controls span.key { display: inline-block; background-color: #222; border: 1px solid var(--dark-green); border-radius: 0.5vh; padding: 0.3vh 1vh; margin-right: 1.5vh; font-weight: bold; color: var(--text-color); min-width: 4vh; text-align: center; }
            .game-container.paused::before { content: "PAUSED"; position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-size: 10vh; color: var(--green); background-color: rgba(0, 0, 0, 0.85); text-shadow: 0 0 2vh var(--green); z-index: 200; border-radius: 2vh; pointer-events: none; }
            h1 { text-align: center; font-size: 1.34rem; color: var(--green); }
        `;

        // --- STEP 3: PREPARE AND RUN THE GAME ---
        
        // Take control from the terminal
        window.isProgramRunning = true;
        term.clear();
        term.print("Loading Tetris...");

        // Inject styles
        const styleSheet = document.createElement("style");
        styleSheet.id = "tetris-styles";
        styleSheet.innerText = gameCSS;
        document.head.appendChild(styleSheet);

        // Inject HTML
        const wrapper = document.createElement("div");
        wrapper.id = "tetris-wrapper";
        wrapper.innerHTML = gameHTML;
        document.body.appendChild(wrapper);

        // Add the exit button functionality
        document.getElementById('exitButton').addEventListener('click', cleanup);

        // --- ALL OF THE ORIGINAL TETRIS JAVASCRIPT LOGIC GOES HERE ---
        // (Slightly modified to work in this new context)
        const gameCanvas = document.getElementById('gameCanvas');
        const ctx = gameCanvas.getContext('2d');
        const nextPieceCanvas = document.getElementById('nextPieceCanvas');
        const nextPieceCtx = nextPieceCanvas.getContext('2d');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const gameStatusScreen = document.getElementById('gameStatusScreen');
        const statusMessage = document.getElementById('statusMessage');
        const statusButton = document.getElementById('statusButton');
        const gameContainer = document.querySelector('.game-container');
        const highscoreList = document.getElementById('highscore-list');
        const resetHighscoreButton = document.getElementById('resetHighscoreButton');
        const BOARD_WIDTH = 10;
        const BOARD_HEIGHT = 20;
        const HIGHSCORE_KEY = 'tetrisHighscores_v2';
        let blockSize;
        let previewBlockSize;
        let board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
        let currentPiece = null;
        let nextPiece = null;
        let score = 0;
        let level = 1;
        let fallInterval = 1000;
        let gameLoop;
        let isGameOver = false;
        let isPaused = false;
        const TETROMINOES = [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]], [[1, 1], [1, 1]], [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]], [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        ];
        const COLORS = ['#65ff14', '#30D5C8', '#40E0D0', '#00A36C', '#2AAA8A', '#50C878', '#00A36C'];

        function initializeGame() {
            board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
            score = 0; level = 1; fallInterval = 1000; isGameOver = false;
            scoreDisplay.textContent = score; levelDisplay.textContent = level;
            gameStatusScreen.style.display = 'none';
        }
        function showStartScreen() {
            statusMessage.textContent = "Welcome to Tetris"; statusButton.textContent = "Start Game";
            gameStatusScreen.style.display = 'flex';
        }
        function createPiece() {
            const typeId = Math.floor(Math.random() * TETROMINOES.length);
            const shape = TETROMINOES[typeId];
            return { shape: shape, x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0, type: typeId };
        }
        function isValidMove(piece, offsetX, offsetY, shape) {
            const shapeToCheck = shape || piece.shape;
            for (let r = 0; r < shapeToCheck.length; r++) {
                for (let c = 0; c < shapeToCheck[r].length; c++) {
                    if (shapeToCheck[r][c]) {
                        const newX = piece.x + c + offsetX; const newY = piece.y + r + offsetY;
                        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
                        if (newY >= 0 && board[newY][newX] > 0) return false;
                    }
                }
            }
            return true;
        }
        function rotate(piece) {
            const newShape = piece.shape[0].map((_, colIndex) => piece.shape.map(row => row[colIndex]).reverse());
            if (isValidMove(piece, 0, 0, newShape)) {
                piece.shape = newShape;
            } else { // Wall kick logic
                const kicks = [[-1, 0], [1, 0], [0, -1]];
                for (const [kx, ky] of kicks) {
                    if (isValidMove(piece, kx, ky, newShape)) {
                        piece.shape = newShape; piece.x += kx; piece.y += ky; return;
                    }
                }
            }
        }
        function freezePiece() {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        if (currentPiece.y + y < 0) { endGame(); return; }
                        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.type + 1;
                    }
                });
            });
        }
        function clearRows() {
            let rowsCleared = 0;
            board = board.filter(row => !row.every(cell => cell > 0));
            rowsCleared = BOARD_HEIGHT - board.length;
            while (board.length < BOARD_HEIGHT) { board.unshift(Array(BOARD_WIDTH).fill(0)); }
            if (rowsCleared > 0) updateScore(rowsCleared);
        }
        function dropPiece() {
            if (isGameOver) return;
            if (isValidMove(currentPiece, 0, 1)) {
                currentPiece.y++;
            } else {
                freezePiece(); clearRows();
                if (!isGameOver) {
                    currentPiece = nextPiece; nextPiece = createPiece(); drawNextPiece();
                    if (!isValidMove(currentPiece, 0, 0)) { endGame(); }
                }
            }
            drawGame();
        }
        function endGame() {
            isGameOver = true; clearInterval(gameLoop);
            statusMessage.textContent = "GAME OVER!"; statusButton.textContent = "Play Again";
            gameStatusScreen.style.display = 'flex';
            addHighscore(score); displayHighscores();
        }
        function restartGame() {
            initializeGame(); currentPiece = createPiece(); nextPiece = createPiece();
            drawNextPiece(); drawGame();
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(dropPiece, fallInterval);
        }
        function updateScore(lines) {
            const points = [0, 100, 300, 500, 800]; score += points[lines] * level;
            scoreDisplay.textContent = score;
            const newLevel = Math.floor(score / 3000) + 1;
            if (newLevel > level) {
                level = newLevel; levelDisplay.textContent = level;
                fallInterval = Math.max(250, fallInterval - 40);
                clearInterval(gameLoop); gameLoop = setInterval(dropPiece, fallInterval);
            }
        }
        function getHighscores() { return JSON.parse(localStorage.getItem(HIGHSCORE_KEY)) || []; }
        function saveHighscores(scores) { localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores)); }
        function addHighscore(newScore) {
            if (newScore === 0) return; const scores = getHighscores(); scores.push(newScore);
            scores.sort((a, b) => b - a); saveHighscores(scores.slice(0, 10));
        }
        function displayHighscores() {
            const scores = getHighscores(); highscoreList.innerHTML = '';
            scores.forEach(s => { const li = document.createElement('li'); li.textContent = s; highscoreList.appendChild(li); });
        }
        function drawBlock(x, y, typeId, context, currentBlockSize, isShadow = false) {
            context.fillStyle = COLORS[typeId];
            if (isShadow) {
                context.globalAlpha = 0.3; context.fillRect(x * currentBlockSize, y * currentBlockSize, currentBlockSize, currentBlockSize);
                context.globalAlpha = 1.0;
            } else {
                context.fillRect(x * currentBlockSize, y * currentBlockSize, currentBlockSize, currentBlockSize);
                context.strokeStyle = '#000'; context.strokeRect(x * currentBlockSize, y * currentBlockSize, currentBlockSize, currentBlockSize);
            }
        }
        function drawGame() {
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            board.forEach((row, y) => row.forEach((val, x) => { if (val > 0) drawBlock(x, y, val - 1, ctx, blockSize); }));
            if (currentPiece) {
                let shadowY = currentPiece.y;
                while (isValidMove(currentPiece, 0, shadowY - currentPiece.y + 1)) { shadowY++; }
                drawPiece({ ...currentPiece, y: shadowY }, ctx, blockSize, true);
                drawPiece(currentPiece, ctx, blockSize, false);
            }
        }
        function drawPiece(piece, context, currentBlockSize, isShadow = false) {
            piece.shape.forEach((row, y) => row.forEach((val, x) => {
                if (val) drawBlock(piece.x + x, piece.y + y, piece.type, context, currentBlockSize, isShadow);
            }));
        }
        function drawNextPiece() {
            nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
            if (nextPiece) {
                const shape = nextPiece.shape;
                const pieceWidth = shape[0].length * previewBlockSize; const pieceHeight = shape.length * previewBlockSize;
                const startX = (nextPieceCanvas.width - pieceWidth) / 2; const startY = (nextPieceCanvas.height - pieceHeight) / 2;
                drawPiece({ ...nextPiece, x: startX / previewBlockSize, y: startY / previewBlockSize }, nextPieceCtx, previewBlockSize);
            }
        }
        function setGameScale() {
            blockSize = Math.floor((window.innerHeight * 0.9) / BOARD_HEIGHT);
            gameCanvas.height = blockSize * BOARD_HEIGHT; gameCanvas.width = blockSize * BOARD_WIDTH;
            previewBlockSize = blockSize * 0.7;
            nextPieceCanvas.width = nextPieceCanvas.clientWidth; nextPieceCanvas.height = nextPieceCanvas.clientHeight;
        }
        function togglePause() {
            if (isGameOver) return; isPaused = !isPaused;
            if (isPaused) { clearInterval(gameLoop); gameContainer.classList.add('paused'); }
            else { gameLoop = setInterval(dropPiece, fallInterval); gameContainer.classList.remove('paused'); }
        }
        gameKeydownListener = (e) => {
            if (e.key.toLowerCase() === 'p') { togglePause(); return; }
            if (isGameOver || !currentPiece || isPaused) return;
            let handled = true;
            switch (e.key) {
                case 'ArrowLeft': if (isValidMove(currentPiece, -1, 0)) currentPiece.x--; break;
                case 'ArrowRight': if (isValidMove(currentPiece, 1, 0)) currentPiece.x++; break;
                case 'ArrowDown': if (isValidMove(currentPiece, 0, 1)) { currentPiece.y++; score++; scoreDisplay.textContent = score; } break;
                case 'ArrowUp': rotate(currentPiece); break;
                case ' ': e.preventDefault(); while (isValidMove(currentPiece, 0, 1)) { currentPiece.y++; score++; } scoreDisplay.textContent = score; dropPiece(); break;
                default: handled = false; break;
            }
            if (handled) drawGame();
        };
        document.addEventListener('keydown', gameKeydownListener);
        statusButton.addEventListener('click', restartGame);
        resetHighscoreButton.addEventListener('click', () => { localStorage.removeItem(HIGHSCORE_KEY); displayHighscores(); });
        window.addEventListener('resize', () => { setGameScale(); drawGame(); drawNextPiece(); });
        
        // Initial setup
        setGameScale();
        displayHighscores();
        showStartScreen();
    }
};