class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameMode = '2player';
        this.difficulty = 'easy';
        this.score = { X: 0, O: 0 };
        this.winningPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        this.audioContext = null;
        this.statusDisplay = document.getElementById('status');
        this.scoreX = document.getElementById('scoreX');
        this.scoreO = document.getElementById('scoreO');
        this.cells = document.querySelectorAll('.cell');
        this.resetButton = document.getElementById('resetButton');
        this.modeButtons = document.querySelectorAll('.mode-button');
        this.difficultyButtons = document.querySelectorAll('.difficulty-button');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayText = document.getElementById('overlayText');
        this.playAgainButton = document.getElementById('playAgainButton');

        this.initializeGame();
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });

        this.resetButton.addEventListener('click', () => this.resetGame());
        this.playAgainButton.addEventListener('click', () => this.resetGame());
        this.modeButtons.forEach(button => {
            button.addEventListener('click', () => this.setGameMode(button.dataset.mode));
        });
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => this.setDifficulty(button.dataset.difficulty));
        });

        this.updateScoreboard();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.modeButtons.forEach(button => {
            const isActive = button.dataset.mode === mode;
            button.classList.toggle('active', isActive);
        });
        this.resetGame();
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.difficultyButtons.forEach(button => {
            const isActive = button.dataset.difficulty === level;
            button.classList.toggle('active', isActive);
        });
        this.resetGame();
    }

    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayText.textContent = message;
        this.gameOverlay.classList.add('show');
    }

    hideOverlay() {
        this.gameOverlay.classList.remove('show');
    }

    updateScoreboard() {
        this.scoreX.textContent = this.score.X;
        this.scoreO.textContent = this.score.O;
    }

    ensureAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        return this.audioContext;
    }

    playSound(type) {
        const context = this.ensureAudioContext();

        if (!context) {
            return;
        }

        const soundMap = {
            move: { frequency: 440, duration: 0.08, type: 'triangle', volume: 0.04 },
            win: { frequency: 660, duration: 0.2, type: 'square', volume: 0.06 },
            draw: { frequency: 260, duration: 0.22, type: 'sawtooth', volume: 0.05 },
            reset: { frequency: 180, duration: 0.12, type: 'sine', volume: 0.04 }
        };

        const config = soundMap[type] || soundMap.move;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);

        gainNode.gain.setValueAtTime(0.0001, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(config.volume, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + config.duration);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + config.duration);
    }

    getAvailableMoves() {
        return this.board
            .map((cell, index) => (cell === '' ? index : null))
            .filter(index => index !== null);
    }

    findBestMove() {
        const availableMoves = this.getAvailableMoves();

        for (const move of availableMoves) {
            this.board[move] = 'O';
            if (this.checkWin()) {
                this.board[move] = '';
                return move;
            }
            this.board[move] = '';
        }

        for (const move of availableMoves) {
            this.board[move] = 'X';
            if (this.checkWin()) {
                this.board[move] = '';
                return move;
            }
            this.board[move] = '';
        }

        if (this.difficulty === 'hard') {
            if (this.board[4] === '') return 4;

            const corners = [0, 2, 6, 8].filter(index => this.board[index] === '');
            if (corners.length > 0) {
                return corners[Math.floor(Math.random() * corners.length)];
            }
        }

        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    makeComputerMove() {
        if (!this.gameActive || this.gameMode !== 'cpu' || this.currentPlayer !== 'O') {
            return;
        }

        const move = this.findBestMove();

        if (move === undefined) {
            return;
        }

        setTimeout(() => {
            const cell = document.querySelector(`[data-index="${move}"]`);
            if (cell && this.board[move] === '') {
                this.board[move] = 'O';
                cell.textContent = 'O';
                this.playSound('move');

                if (this.checkWin()) {
                    this.score.O += 1;
                    this.updateScoreboard();
                    this.statusDisplay.textContent = 'Player O wins!';
                    this.gameActive = false;
                    this.showOverlay('Player O Wins!', 'Press play again to start a new round.');
                    this.playSound('win');
                    return;
                }

                if (this.checkDraw()) {
                    this.statusDisplay.textContent = 'Game ended in a draw!';
                    this.gameActive = false;
                    this.showOverlay('Draw Game!', 'Nobody wins this round.');
                    this.playSound('draw');
                    return;
                }

                this.currentPlayer = 'X';
                this.statusDisplay.textContent = "Player X's turn";
            }
        }, this.difficulty === 'hard' ? 700 : 1100);
    }

    handleCellClick(cell) {
        const index = Number(cell.getAttribute('data-index'));

        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }

        if (this.gameMode === 'cpu' && this.currentPlayer === 'O') {
            return;
        }

        this.board[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        this.playSound('move');

        if (this.checkWin()) {
            this.score[this.currentPlayer] += 1;
            this.updateScoreboard();
            this.statusDisplay.textContent = `Player ${this.currentPlayer} wins!`;
            this.gameActive = false;
            this.showOverlay(`Player ${this.currentPlayer} Wins!`, 'Press play again to start a new round.');
            this.playSound('win');
            return;
        }

        if (this.checkDraw()) {
            this.statusDisplay.textContent = 'Game ended in a draw!';
            this.gameActive = false;
            this.showOverlay('Draw Game!', 'Nobody wins this round.');
            this.playSound('draw');
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.statusDisplay.textContent = `Player ${this.currentPlayer}'s turn`;

        if (this.gameMode === 'cpu' && this.currentPlayer === 'O') {
            this.makeComputerMove();
        }
    }

    checkWin() {
        return this.winningPatterns.some(pattern => {
            return pattern.every(index => {
                return this.board[index] === this.currentPlayer;
            });
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.hideOverlay();
        this.statusDisplay.textContent = `Player ${this.currentPlayer}'s turn`;
        this.cells.forEach(cell => {
            cell.textContent = '';
        });
        this.playSound('reset');
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TicTacToe();
}); 