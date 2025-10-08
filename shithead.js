// -------- START PROGRAM: SHITHEAD --------
const shitheadProgram = {
  name: 'shithead',
  program: {
    description: 'The classic card game. Get rid of your cards!',
    execute: async (term) => {
      return new Promise(resolve => {
        const PLAYER_NAME = "You", AI_NAME = "The Machine", CARD_RANKS = { '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, 'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12, '10': 13 };
        let gameState = {};
        const inputLine = document.querySelector('.input-line');
        const getCardValue = (card) => (card ? card.slice(0, -1) : ''), getCardRank = (card) => card ? CARD_RANKS[getCardValue(card)] || 0 : 0, sortCards = (cards) => cards.sort((a, b) => getCardRank(a) - getCardRank(b));
        const createNewGame = () => {
          const suits = ['H', 'D', 'C', 'S'], values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
          let deck = [];
          for (const suit of suits) { for (const value of values) { deck.push(value + suit); } }
          for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; }
          gameState = {
            players: {
              [PLAYER_NAME]: { name: PLAYER_NAME, hand: sortCards(deck.splice(0, 3)), faceUp: sortCards(deck.splice(0, 3)), faceDown: deck.splice(0, 3) },
              [AI_NAME]: { name: AI_NAME, hand: sortCards(deck.splice(0, 3)), faceUp: sortCards(deck.splice(0, 3)), faceDown: deck.splice(0, 3) },
            },
            deck: deck, discardPile: [], turn: PLAYER_NAME, winner: null, gameInProgress: true, statusMessage: `The game has started. It's your turn!`
          };
        };
        const switchTurn = () => {
          if (gameState.winner) return;
          gameState.turn = gameState.turn === PLAYER_NAME ? AI_NAME : PLAYER_NAME;
          gameState.statusMessage = `It's ${gameState.players[gameState.turn].name}'s turn.`;
          draw();
          if (gameState.turn === AI_NAME) setTimeout(aiTurn, 1200);
        };
        const drawCards = (player) => { const p = gameState.players[player]; while (p.hand.length < 3 && gameState.deck.length > 0) p.hand.push(gameState.deck.pop()); sortCards(p.hand); };
        const checkWinCondition = (player) => { const p = gameState.players[player]; if (p.hand.length === 0 && p.faceUp.length === 0 && p.faceDown.length === 0) { gameState.winner = player; gameState.gameInProgress = false; return true; } return false; };
        const checkFourOfAKind = () => { if (gameState.discardPile.length < 4) return false; const topFour = gameState.discardPile.slice(-4); return topFour.every(c => getCardValue(c) === getCardValue(topFour[0])); };
        const burnPile = (player) => {
          gameState.statusMessage = `${gameState.players[player].name} burned the pile! New turn.`;
          draw();
          setTimeout(() => { gameState.discardPile = []; drawCards(player); if (checkWinCondition(player)) { endGame(); return; } draw(); if (player === AI_NAME) setTimeout(aiTurn, 1000); }, 800);
        };
        const processMove = (player, card, sourcePile) => {
          const source = gameState.players[player][sourcePile];
          const index = source.indexOf(card); if (index > -1) source.splice(index, 1);
          gameState.discardPile.push(card);
          gameState.statusMessage = `${gameState.players[player].name} played ${formatCard(card)}.`;
          if (checkWinCondition(player)) { endGame(); return; }
          if (checkFourOfAKind()) { burnPile(player); return; }
          const cardValue = getCardValue(card);
          if (cardValue === '10') { burnPile(player); return; }
          if (cardValue === '2') { gameState.statusMessage = `The pile was reset. New turn for ${gameState.players[player].name}.`; }
          drawCards(player);
          if (checkWinCondition(player)) { endGame(); return; }
          if (cardValue === '2') { draw(); if (player === AI_NAME) setTimeout(aiTurn, 1000); }
          else { switchTurn(); }
        };
        const getEffectiveTopCard = () => { for (let i = gameState.discardPile.length - 1; i >= 0; i--) { if (getCardValue(gameState.discardPile[i]) !== '2') return gameState.discardPile[i]; } return null; };
        const checkMoveLegality = (cardToPlay) => { const cardValue = getCardValue(cardToPlay); if (cardValue === '2' || cardValue === '10' || gameState.discardPile.length === 0) return true; const effectiveTopCard = getEffectiveTopCard(); if (!effectiveTopCard) return true; return getCardRank(cardToPlay) >= getCardRank(effectiveTopCard); };
        const playerPicksUpPile = (player) => { if (gameState.discardPile.length === 0) { switchTurn(); return; } const p = gameState.players[player]; p.hand.push(...gameState.discardPile); sortCards(p.hand); gameState.discardPile = []; gameState.statusMessage = `${p.name} picked up the pile.`; switchTurn(); };
        const handlePlayerMove = (card, sourcePile) => {
          if (sourcePile !== 'faceDown' && !checkMoveLegality(card)) { gameState.statusMessage = "Invalid move! Play a higher card or take the pile."; draw(); return; }
          if (sourcePile === 'faceDown') {
            if (checkMoveLegality(card)) { gameState.statusMessage = `You played ${formatCard(card)} blind... It was legal!`; processMove(PLAYER_NAME, card, 'faceDown'); }
            else { gameState.statusMessage = `You played ${formatCard(card)} blind... Unlucky!`; const source = gameState.players[PLAYER_NAME].faceDown; const index = source.indexOf(card); if (index > -1) source.splice(index, 1); gameState.discardPile.push(card); draw(); setTimeout(() => playerPicksUpPile(PLAYER_NAME), 800); }
          } else { processMove(PLAYER_NAME, card, sourcePile); }
        };
        const aiTurn = () => {
          if (gameState.turn !== AI_NAME || !gameState.gameInProgress) return;
          const ai = gameState.players[AI_NAME];
          const playableFrom = ai.hand.length > 0 ? 'hand' : ai.faceUp.length > 0 ? 'faceUp' : 'faceDown';
          const cardOptions = ai[playableFrom];
          if (playableFrom === 'faceDown') {
            const cardToPlay = cardOptions[0];
            gameState.statusMessage = `${AI_NAME} is playing blind...`; draw();
            setTimeout(() => { if (checkMoveLegality(cardToPlay)) { processMove(AI_NAME, cardToPlay, 'faceDown'); } else { const source = gameState.players[AI_NAME].faceDown; const index = source.indexOf(cardToPlay); if (index > -1) source.splice(index, 1); gameState.discardPile.push(cardToPlay); playerPicksUpPile(AI_NAME); } }, 500); return;
          }
          const legalMoves = cardOptions.filter(checkMoveLegality);
          if (legalMoves.length === 0) { playerPicksUpPile(AI_NAME); return; }
          const tens = legalMoves.filter(c => getCardValue(c) === '10'); if (tens.length > 0 && gameState.discardPile.length >= 5) { processMove(AI_NAME, tens[0], playableFrom); return; }
          let normalMoves = legalMoves.filter(c => !['2', '10'].includes(getCardValue(c))); if (normalMoves.length > 0) { processMove(AI_NAME, normalMoves[0], playableFrom); return; }
          processMove(AI_NAME, legalMoves[0], playableFrom);
        };
        const formatCard = (cardStr) => { if (!cardStr) return '[   ]'; const suitSymbols = { H: '♥', D: '♦', C: '♣', S: '♠' }; const value = getCardValue(cardStr).padEnd(2); const suit = suitSymbols[cardStr.slice(-1)]; return `[${value}${suit}]`; };
        const draw = () => {
          term.clear();
          const p = gameState.players[PLAYER_NAME], ai = gameState.players[AI_NAME];
          const topCard = gameState.discardPile.length > 0 ? formatCard(gameState.discardPile[gameState.discardPile.length - 1]) : '[   ]';
          const deckStr = `Deck: ${gameState.deck.length > 0 ? '[??]' : '[  ]'} (${gameState.deck.length})`;
          const pileStr = `Pile: ${topCard} (${gameState.discardPile.length})`;
          const centeredInfo = `${deckStr.padEnd(20)}${pileStr.padStart(20)}`;
          const activePile = p.hand.length > 0 ? p.hand : p.faceUp.length > 0 ? p.faceUp : p.faceDown;
          let handStr, handDisplay;
          if (p.hand.length > 0) { handStr = `Your Hand:`; handDisplay = p.hand.map((c, i) => `${i + 1}:${formatCard(c)}`).join('  '); }
          else if (p.faceUp.length > 0) { handStr = `Your Face-Up:`; handDisplay = p.faceUp.map((c, i) => `${i + 1}:${formatCard(c)}`).join('  '); }
          else { handStr = `Your Face-Down:`; handDisplay = p.faceDown.map((c, i) => `${i + 1}:[??]`).join('  '); }
          let out = [];
          out.push(`+-- ${AI_NAME.padEnd(46, '-')} --+`);
          out.push(`| Hand: ${ai.hand.length} | Face-Up: ${ai.faceUp.map(formatCard).join(' ')}`.padEnd(52) + `|`);
          out.push(`|       | Face-Down: ${ai.faceDown.map(() => '[??]').join(' ')}`.padEnd(52) + `|`);
          out.push(`+${'─'.repeat(54)}+`);
          out.push(`| ${centeredInfo.padStart(46).padEnd(52)} |`);
          out.push(`+${'─'.repeat(54)}+`);
          out.push(`+-- ${`${PLAYER_NAME}${gameState.turn === PLAYER_NAME ? ' (Your Turn!)' : ''}`.padEnd(46, '-')} --+`);
          out.push(`| Hand: ${p.hand.length} | Face-Up: ${p.faceUp.map(formatCard).join(' ')}`.padEnd(52) + `|`);
          out.push(`|       | Face-Down: ${p.faceDown.map(() => '[??]').join(' ')}`.padEnd(52) + `|`);
          out.push(`+${'─'.repeat(54)}+`);
          out.push(`${handStr.padEnd(14)} ${handDisplay}`);
          out.push('\n');
          out.push(`Status: ${gameState.statusMessage}`);
          let controls = `Controls: Select card (1-${activePile.length})`;
          if (!activePile.some(checkMoveLegality) && gameState.discardPile.length > 0) { controls += ", (T)ake pile"; }
          controls += ', (Alt+Q) Quit';
          out.push(controls);
          term.print(out.join('\n'));
        };
        const endGame = () => { gameState.statusMessage = gameState.winner === PLAYER_NAME ? `🎉 YOU WON! ${AI_NAME} is the Shithead!` : `😭 YOU LOST! You are the Shithead!`; draw(); setTimeout(() => { term.print("\nType 'shithead' to play again."); exitGame(); }, 2000); };
        const exitGame = () => { document.removeEventListener('keydown', masterInputHandler, { capture: true }); inputLine.style.display = 'flex'; resolve(); };
        const masterInputHandler = (e) => {
          if (!gameState.gameInProgress || (gameState.turn !== PLAYER_NAME)) return;
          if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopImmediatePropagation(); exitGame("Shithead exited by user."); return; }
          e.preventDefault(); e.stopImmediatePropagation();
          const p = gameState.players[PLAYER_NAME];
          const activePile = p.hand.length > 0 ? p.hand : p.faceUp.length > 0 ? p.faceUp : p.faceDown;
          const activePileName = p.hand.length > 0 ? 'hand' : p.faceUp.length > 0 ? 'faceUp' : 'faceDown';
          if (!isNaN(e.key) && e.key > 0 && e.key <= activePile.length) { handlePlayerMove(activePile[parseInt(e.key) - 1], activePileName); }
          else if (e.key.toLowerCase() === 't') { if (!activePile.some(checkMoveLegality) && gameState.discardPile.length > 0) { playerPicksUpPile(PLAYER_NAME); } }
        };
        const showStartScreen = () => {
          term.clear();
          term.print("=== SHITHEAD CARD GAME ===");
          term.print("Goal: Be the first to get rid of all your cards.\n");
          term.print("Rules: Play an equal or higher card. 2 resets the pile, 10 burns it.");
          term.print("Controls:\n  Number keys: Select a card to play\n  T: Take the pile\n  Alt+Q: Quit game\n");
          term.print("Press any key to start...");
          document.addEventListener('keydown', function startHandler(e) {
            e.preventDefault(); e.stopImmediatePropagation(); this.removeEventListener('keydown', startHandler);
            inputLine.style.display = 'none';
            document.addEventListener('keydown', masterInputHandler, { capture: true });
            createNewGame();
            draw();
          }, { once: true });
        };
        showStartScreen();
      });
    }
  }
};
SystemPrograms.push(shitheadProgram);
// -------- END PROGRAM: SHITHEAD --------