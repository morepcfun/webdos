// -------- START PROGRAM: SOKOBAN --------
  const sokobanProgram = {
    name: 'sokoban',
    program: {
      description: 'A classic box-pushing puzzle game.',
      execute: async (term) => {
        return new Promise(resolve => {
          const inputLine = document.querySelector('.input-line');

          const LEVELS = [
            [
              '    #####',
              '    #   #',
              '    #$  #',
              '  ###  $##',
              '  #  $ $ #',
              '### # ## #   ######',
              '#   # ## #####  ..#',
              '# $  $          ..#',
              '##### ### #@##  ..#',
              '    #     #########',
              '    #######'
            ],
            [
              '############',
              '#..  #     #',
              '#..  # $ $ #',
              '#..  #$#### #',
              '#..    @ # #',
              '#..  # #  $#',
              '###### ##$ #',
              '  # $  $ # #',
              '  #    #   #',
              '  ##########'
            ],
            [
              '        ########',
              '        #     @#',
              '        # $#$ ##',
              '        # $  #',
              '      ####$  #',
              '      #   #$ #',
              '####### ###$ #',
              '#... #    #  #',
              '##...#  $ #  #',
              ' #...#$#$ #  #',
              ' ####### ##  #',
              '       #     #',
              '       #######'
            ]
          ];

          let level, player, boxes, targets, walls, moves, undoStack, gameState;
          let currentLevelIndex = 0;

          const isWall = (x, y) => walls.some(w => w.x === x && w.y === y);
          const getBoxAt = (x, y) => boxes.find(b => b.x === x && b.y === y);
          const isTarget = (x, y) => targets.some(t => t.x === x && t.y === y);

          const loadLevel = (levelIndex) => {
            level = LEVELS[levelIndex].map(row => row.split(''));
            player = {}; boxes = []; targets = []; walls = [];
            moves = 0; undoStack = []; gameState = 'playing';

            for (let y = 0; y < level.length; y++) {
              for (let x = 0; x < level[y].length; x++) {
                switch (level[y][x]) {
                  case '@': player = { x, y }; break;
                  case '+': player = { x, y }; targets.push({ x, y }); break;
                  case '$': boxes.push({ x, y }); break;
                  case '*': boxes.push({ x, y }); targets.push({ x, y }); break;
                  case '.': targets.push({ x, y }); break;
                  case '#': walls.push({ x, y }); break;
                }
              }
            }
            draw();
          };

          const checkWin = () => {
              if (boxes.length === 0 || targets.length === 0) return false;
              for (const target of targets) {
                  if (!getBoxAt(target.x, target.y)) return false;
              }
              return true;
          };

          const movePlayer = (dx, dy) => {
            if (gameState !== 'playing') return;

            const nextX = player.x + dx;
            const nextY = player.y + dy;

            if (isWall(nextX, nextY)) return;

            const box = getBoxAt(nextX, nextY);
            if (box) {
              const boxNextX = nextX + dx;
              const boxNextY = nextY + dy;
              if (isWall(boxNextX, boxNextY) || getBoxAt(boxNextX, boxNextY)) return;

              undoStack.push({ player: { ...player }, boxes: boxes.map(b => ({ ...b })) });
              box.x = boxNextX;
              box.y = boxNextY;
            } else {
               undoStack.push({ player: { ...player }, boxes: boxes.map(b => ({ ...b })) });
            }

            player.x = nextX;
            player.y = nextY;
            moves++;

            if (checkWin()) {
                gameState = 'win';
                draw();
                setTimeout(() => {
                    currentLevelIndex++;
                    if (currentLevelIndex < LEVELS.length) {
                        loadLevel(currentLevelIndex);
                    } else {
                        exitGame('Congratulations! You have completed all levels!');
                    }
                }, 2000);
            } else {
                draw();
            }
          };

          const undo = () => {
            if (undoStack.length > 0) {
                const lastState = undoStack.pop();
                player = lastState.player;
                boxes = lastState.boxes;
                moves--;
                draw();
            }
          };

          const draw = () => {
              term.clear();
              let output = '';
              const maxY = level.length;
              const maxX = Math.max(...level.map(r => r.length));

              for (let y = 0; y < maxY; y++) {
                  let line = '';
                  for (let x = 0; x < maxX; x++) {
                      if (player.x === x && player.y === y) {
                          line += isTarget(x,y) ? '+' : '@';
                      } else if (getBoxAt(x, y)) {
                          line += isTarget(x,y) ? '*' : '$';
                      } else if (isWall(x, y)) {
                          line += '#';
                      } else if (isTarget(x,y)) {
                          line += '.';
                      } else {
                          line += ' ';
                      }
                  }
                  output += line + '\n';
              }
              output += '\n--- SOKOBAN ---\n';
              const boxesOnTarget = targets.filter(t => getBoxAt(t.x, t.y)).length;
              output += `Level: ${currentLevelIndex + 1}/${LEVELS.length} | Moves: ${moves} | Targets: ${boxesOnTarget}/${targets.length}\n`;
              output += `(WASD/Arrows) Move | (R) Restart | (U) Undo | (Alt+Q) Quit\n`;
              if (gameState === 'win') {
                  output += '\nLevel Complete!';
              }
              term.print(output);
          };

          const exitGame = (message) => {
            document.removeEventListener('keydown', masterInputHandler, { capture: true });
            term.clear();
            if (message) term.print(message);
            term.print("\nTo play again, type 'sokoban' and press Enter.");
            inputLine.style.display = 'flex';
            resolve();
          };

          const masterInputHandler = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); exitGame("Sokoban exited by user."); return; }
            e.preventDefault(); e.stopImmediatePropagation();

            switch (e.key.toLowerCase()) {
              case 'w': case 'arrowup': movePlayer(0, -1); break;
              case 'a': case 'arrowleft': movePlayer(-1, 0); break;
              case 's': case 'arrowdown': movePlayer(0, 1); break;
              case 'd': case 'arrowright': movePlayer(1, 0); break;
              case 'r': loadLevel(currentLevelIndex); break;
              case 'u': undo(); break;
            }
          };

          inputLine.style.display = 'none';
          document.addEventListener('keydown', masterInputHandler, { capture: true });
          loadLevel(currentLevelIndex);
        });
      }
    }
  };
  SystemPrograms.push(sokobanProgram);
  // -------- END PROGRAM: SOKOBAN --------