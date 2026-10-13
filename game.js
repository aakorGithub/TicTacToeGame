class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.winningPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        this.audioContext = null;
        this.statusDisplay = document.getElementById('status');
        this.cells = document.querySelectorAll('.cell');
        this.resetButton = document.getElementById('resetButton');

        this.initializeGame();
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });

        this.resetButton.addEventListener('click', () => this.resetGame());
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

    handleCellClick(cell) {
        const index = cell.getAttribute('data-index');

        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }

        this.board[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        this.playSound('move');

        if (this.checkWin()) {
            this.statusDisplay.textContent = `Player ${this.currentPlayer} wins!`;
            this.gameActive = false;
            this.playSound('win');
            return;
        }

        if (this.checkDraw()) {
            this.statusDisplay.textContent = "Game ended in a draw!";
            this.gameActive = false;
            this.playSound('draw');
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.statusDisplay.textContent = `Player ${this.currentPlayer}'s turn`;
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