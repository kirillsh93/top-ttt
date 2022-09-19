const Gameboard = (function () {
  const BOARD_SIZE = 3;
  const NUM_OF_CELLS = BOARD_SIZE * BOARD_SIZE;

  const board = [];

  function initBoard() {
    for (let i = 0; i < NUM_OF_CELLS; i++) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('cell');
      cellEl.setAttribute('id', i);
      board[i] = cellEl;
    }

    return board;
  }

  return {
    get board() {
      return board;
    },
    initBoard,
  };
})();

// --------------------

const DisplayController = (function () {
  const EMOJIS_PLAYER = ['😄', '🙃', '😛', '🤬', '😬', '😈', '😼', '😏', '😎', '🤔'];
  const EMOJIS_WELCOME = ['🍒', '🍎', '🍑', '🍋', '🥑', '🥝', '🥥', '🍊', '🍉'];

  const boardContainer = document.querySelector('.container');
  const infoTitle = document.querySelector('.info-title');
  infoTitle.textContent = `${pickRandomItem(EMOJIS_WELCOME)} Tic-Tac-Toe ${pickRandomItem(EMOJIS_WELCOME)}`;

  const playerXNameEl = document.querySelector('.player-X-name');
  const playerXScoreEl = document.querySelector('.player-X-score');

  const playerONameEl = document.querySelector('.player-O-name');
  const playerOScoreEl = document.querySelector('.player-O-score');

  const btnRestartText = document.querySelector('.btn-restart-text');

  // --------------------

  function clearBoard(board) {
    board.forEach((cellEL) => cellEL.classList.remove('cell-X', 'cell-O', 'highlighted', 'no-hover'));
    boardContainer.style.transform = 'scale(1)';
    btnRestartText.textContent = 'Restart';
  }

  function renderBoard(board) {
    board.forEach((cellEl) => {
      boardContainer.appendChild(cellEl);
    });
  }

  function setPlayerNames(playerX, playerO) {
    playerXNameEl.textContent = playerX.name;
    playerONameEl.textContent = playerO.name;
  }

  function updatePlayerScores(playerX, playerO) {
    playerXScoreEl.textContent = playerX.score;
    playerOScoreEl.textContent = playerO.score;
  }

  function updateGameInfo(currentPlayer) {
    document.documentElement.style.setProperty('--player-tag', `'${currentPlayer.tag}'`);
    document.documentElement.style.setProperty('--player-fs', `${currentPlayer.fontSize}`);
    document.documentElement.style.setProperty('--player-color', `${currentPlayer.color}`);
    infoTitle.textContent = `${currentPlayer.name}'s Turn ${pickRandomItem(EMOJIS_PLAYER)}`;
  }

  function pickRandomItem(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }

  function setGameOver(board, winner = false) {
    if (!winner) {
      infoTitle.textContent = `It's a Tie 🤝`;
    } else {
      infoTitle.textContent = `Congrats ${winner.name} 🎉`;
    }

    board.forEach((cellEl) => cellEl.classList.add('no-hover'));

    boardContainer.style.transform = 'scale(0.9)';
    btnRestartText.textContent = 'Play Again';
  }

  function highlightCells(cellIndices, board) {
    cellIndices.forEach((idx) => board[idx].classList.add('highlighted'));
  }

  function toggleClass(className, selectors) {
    selectors.forEach((sel) => {
      document.querySelector(sel).classList.toggle(className);
    });
  }

  return {
    toggleClass,
    updatePlayerScores,
    setPlayerNames,
    highlightCells,
    setGameOver,
    renderBoard,
    clearBoard,
    updateGameInfo,
  };
})();

// --------------------

const GameController = (function () {
  // player names form
  const form = document.querySelector('.form');
  form.addEventListener('submit', initGame);

  // init game
  function initGame(event) {
    event.preventDefault();

    const playerXName = event.target.querySelector('#player-X-name').value;
    const playerOName = event.target.querySelector('#player-O-name').value;

    const playerX = Player(playerXName, 'X');
    const playerO = Player(playerOName, 'O');
    let currentPlayer = pickRandomPlayer(playerX, playerO);

    const board = Gameboard.initBoard();

    activateBoard(board); // add event listeners to board cells
    activateButtons(); // add event listeners to buttons

    DisplayController.setPlayerNames(playerX, playerO);
    DisplayController.updatePlayerScores(playerX, playerO);
    DisplayController.updateGameInfo(currentPlayer);
    DisplayController.renderBoard(board);

    // hide/show game UI with hidden class
    DisplayController.toggleClass('hidden', [
      '.container',
      '.actions',
      '.player-X-info',
      '.player-O-info',
      '.form-container',
    ]);

    // functions
    function pickRandomPlayer(player1, player2) {
      return Math.floor(Math.random() * 2) === 0 ? player1 : player2;
    }

    function pickCell(event) {
      event.target.classList.add(`cell-${currentPlayer.tag}`);
      event.target.classList.add(`no-hover`);
      event.target.removeEventListener('click', pickCell);
      if (isGameOver(board)) {
        deactivateBoard(board);
      } else {
        switchPlayer();
      }
    }

    function switchPlayer() {
      if (currentPlayer === playerX) {
        currentPlayer = playerO;
      } else {
        currentPlayer = playerX;
      }

      DisplayController.updateGameInfo(currentPlayer);
    }

    function restartGame() {
      DisplayController.clearBoard(board);
      activateBoard(board);
      switchPlayer();
    }

    function resetGame() {
      playerX.resetScore();
      playerO.resetScore();
      DisplayController.updatePlayerScores(playerX, playerO);
      restartGame();
    }

    function activateButtons() {
      const btnRestart = document.querySelector('.btn-restart');
      const btnReset = document.querySelector('.btn-reset');

      btnRestart.addEventListener('click', restartGame);
      btnReset.addEventListener('click', resetGame);
    }

    function activateBoard(board) {
      board.forEach((cellEl) => {
        cellEl.addEventListener('click', pickCell);
      });
    }

    function deactivateBoard(board) {
      board.forEach((cellEl) => {
        cellEl.removeEventListener('click', pickCell);
      });
    }

    function isGameOver(board) {
      // check for winner
      const [winner, winningCells] = checkForWinner();
      if (winner) {
        winner.incrementScore();
        DisplayController.updatePlayerScores(playerX, playerO);
        DisplayController.setGameOver(board, winner);
        DisplayController.highlightCells(winningCells, board);

        return true;
      }
      // check for tie
      const allCellsPicked = board.every(
        (cell) => cell.classList.contains('cell-X') || cell.classList.contains('cell-O'),
      );
      if (allCellsPicked) {
        DisplayController.setGameOver(board);
        return true;
      }

      return false;
    }

    function checkForWinner() {
      // array of winning cells combinations
      const WINNING_ROWS = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];

      let result = [false];

      for (const rowCells of WINNING_ROWS) {
        const winningRowX = rowCells.every((cellIndex) => board[cellIndex].classList.contains(`cell-X`));
        const winningRowO = rowCells.every((cellIndex) => board[cellIndex].classList.contains(`cell-O`));
        if (winningRowX) {
          result = [playerX, rowCells];
          break;
        }
        if (winningRowO) {
          result = [playerO, rowCells];
          break;
        }
      }

      return result;
    }
  }
})();

// --------------------

function Player(name, tag) {
  const color = tag === 'X' ? 'aliceblue' : 'bisque';
  const fz = tag === 'X' ? '12vh' : '13vh';
  let score = 0;

  function resetScore() {
    score = 0;
  }

  function incrementScore() {
    score++;
  }

  return {
    incrementScore,
    resetScore,

    get score() {
      return score;
    },

    get name() {
      return name;
    },

    get tag() {
      return tag;
    },

    get color() {
      return color;
    },

    get fontSize() {
      return fz;
    },
  };
}
