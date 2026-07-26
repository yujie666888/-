class ChessGame {
    constructor() {
        this.board = [];
        this.turn = 'red';
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.moveHistory = [];
        this.capturedPieces = { red: [], black: [] };
        this.gameMode = 'human';
        this.difficulty = 5;
        this.playerSide = 'red';
        this.gameOver = false;
        this.lastMove = null;
        this.hintPosition = null;
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupBoard() {
        this.board = [];
        for (let row = 0; row < 10; row++) {
            this.board[row] = [];
            for (let col = 0; col < 9; col++) {
                this.board[row][col] = null;
            }
        }
        
        const redPieces = [
            { type: 'king', row: 0, col: 4 },
            { type: 'guard', row: 0, col: 3 },
            { type: 'guard', row: 0, col: 5 },
            { type: 'elephant', row: 0, col: 2 },
            { type: 'elephant', row: 0, col: 6 },
            { type: 'horse', row: 0, col: 1 },
            { type: 'horse', row: 0, col: 7 },
            { type: 'chariot', row: 0, col: 0 },
            { type: 'chariot', row: 0, col: 8 },
            { type: 'cannon', row: 2, col: 1 },
            { type: 'cannon', row: 2, col: 7 },
            { type: 'soldier', row: 3, col: 0 },
            { type: 'soldier', row: 3, col: 2 },
            { type: 'soldier', row: 3, col: 4 },
            { type: 'soldier', row: 3, col: 6 },
            { type: 'soldier', row: 3, col: 8 }
        ];
        
        const blackPieces = [
            { type: 'king', row: 9, col: 4 },
            { type: 'guard', row: 9, col: 3 },
            { type: 'guard', row: 9, col: 5 },
            { type: 'elephant', row: 9, col: 2 },
            { type: 'elephant', row: 9, col: 6 },
            { type: 'horse', row: 9, col: 1 },
            { type: 'horse', row: 9, col: 7 },
            { type: 'chariot', row: 9, col: 0 },
            { type: 'chariot', row: 9, col: 8 },
            { type: 'cannon', row: 7, col: 1 },
            { type: 'cannon', row: 7, col: 7 },
            { type: 'soldier', row: 6, col: 0 },
            { type: 'soldier', row: 6, col: 2 },
            { type: 'soldier', row: 6, col: 4 },
            { type: 'soldier', row: 6, col: 6 },
            { type: 'soldier', row: 6, col: 8 }
        ];
        
        redPieces.forEach(p => {
            this.board[p.row][p.col] = { type: p.type, color: 'red' };
        });
        
        blackPieces.forEach(p => {
            this.board[p.row][p.col] = { type: p.type, color: 'black' };
        });
    }
    
    getPieceSymbol(type, color) {
        const symbols = {
            king: color === 'red' ? '帅' : '将',
            guard: color === 'red' ? '仕' : '士',
            elephant: color === 'red' ? '相' : '象',
            horse: '马',
            chariot: '车',
            cannon: '炮',
            soldier: color === 'red' ? '兵' : '卒'
        };
        return symbols[type];
    }
    
    renderBoard() {
        const grid = document.getElementById('board-grid');
        grid.innerHTML = '';
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.lastMove && (this.lastMove.to.row === row && this.lastMove.to.col === col || 
                                     this.lastMove.from.row === row && this.lastMove.from.col === col)) {
                    cell.classList.add('last-move');
                }
                
                if (this.selectedPosition && this.selectedPosition.row === row && this.selectedPosition.col === col) {
                    cell.classList.add('selected');
                }
                
                if (this.hintPosition && this.hintPosition.row === row && this.hintPosition.col === col) {
                    cell.classList.add('hint');
                }
                
                if (this.selectedPiece && this.isValidMove(row, col)) {
                    cell.classList.add('highlight');
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.getPieceSymbol(piece.type, piece.color);
                    cell.appendChild(pieceElement);
                }
                
                grid.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('board-grid').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && !this.gameOver) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            }
        });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.gameMode = e.target.dataset.mode;
                this.updateDifficultyVisibility();
                this.resetGame();
            });
        });
        
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.playerSide = e.target.dataset.side;
                this.resetGame();
            });
        });
        
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('swap-btn').addEventListener('click', () => this.swapSides());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    }
    
    updateDifficultyVisibility() {
        const selector = document.getElementById('difficulty-selector');
        const sideSelector = document.getElementById('side-selector');
        if (this.gameMode === 'ai') {
            selector.style.display = 'flex';
            sideSelector.style.display = 'flex';
        } else {
            selector.style.display = 'none';
            sideSelector.style.display = 'none';
        }
    }
    
    handleCellClick(row, col) {
        if (this.gameMode === 'ai' && this.turn !== this.playerSide) {
            return;
        }
        
        const clickedPiece = this.board[row][col];
        
        if (this.selectedPiece) {
            if (this.isValidMove(row, col)) {
                this.makeMove(this.selectedPosition.row, this.selectedPosition.col, row, col);
                this.selectedPiece = null;
                this.selectedPosition = null;
                this.hintPosition = null;
                this.renderBoard();
                
                if (!this.gameOver && this.gameMode === 'ai' && this.turn !== this.playerSide) {
                    setTimeout(() => this.aiMove(), 500);
                }
            } else if (clickedPiece && clickedPiece.color === this.turn) {
                this.selectedPiece = clickedPiece;
                this.selectedPosition = { row, col };
                this.hintPosition = null;
                this.renderBoard();
            } else {
                this.selectedPiece = null;
                this.selectedPosition = null;
                this.hintPosition = null;
                this.renderBoard();
            }
        } else if (clickedPiece && clickedPiece.color === this.turn) {
            this.selectedPiece = clickedPiece;
            this.selectedPosition = { row, col };
            this.renderBoard();
        }
    }
    
    isValidMove(toRow, toCol) {
        if (!this.selectedPiece || !this.selectedPosition) return false;
        
        const fromRow = this.selectedPosition.row;
        const fromCol = this.selectedPosition.col;
        
        if (fromRow === toRow && fromCol === toCol) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === this.selectedPiece.color) return false;
        
        return this.validatePieceMove(this.selectedPiece.type, fromRow, fromCol, toRow, toCol);
    }
    
    validatePieceMove(type, fromRow, fromCol, toRow, toCol) {
        const dr = toRow - fromRow;
        const dc = toCol - fromCol;
        
        switch (type) {
            case 'king':
                return this.validateKingMove(fromRow, fromCol, toRow, toCol);
            case 'guard':
                return this.validateGuardMove(fromRow, fromCol, toRow, toCol);
            case 'elephant':
                return this.validateElephantMove(fromRow, fromCol, toRow, toCol);
            case 'horse':
                return this.validateHorseMove(fromRow, fromCol, toRow, toCol);
            case 'chariot':
                return this.validateChariotMove(fromRow, fromCol, toRow, toCol);
            case 'cannon':
                return this.validateCannonMove(fromRow, fromCol, toRow, toCol);
            case 'soldier':
                return this.validateSoldierMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }
    
    validateKingMove(fromRow, fromCol, toRow, toCol) {
        const color = this.board[fromRow][fromCol].color;
        
        if (color === 'red') {
            if (toRow < 0 || toRow > 2 || toCol < 3 || toCol > 5) return false;
        } else {
            if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) return false;
        }
        
        const dr = Math.abs(toRow - fromRow);
        const dc = Math.abs(toCol - fromCol);
        
        return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    }
    
    validateGuardMove(fromRow, fromCol, toRow, toCol) {
        const color = this.board[fromRow][fromCol].color;
        
        if (color === 'red') {
            if (toRow < 0 || toRow > 2 || toCol < 3 || toCol > 5) return false;
        } else {
            if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) return false;
        }
        
        const dr = Math.abs(toRow - fromRow);
        const dc = Math.abs(toCol - fromCol);
        
        return dr === 1 && dc === 1;
    }
    
    validateElephantMove(fromRow, fromCol, toRow, toCol) {
        const color = this.board[fromRow][fromCol].color;
        
        if (color === 'red' && toRow >= 5) return false;
        if (color === 'black' && toRow <= 4) return false;
        
        const dr = Math.abs(toRow - fromRow);
        const dc = Math.abs(toCol - fromCol);
        
        if (dr !== 2 || dc !== 2) return false;
        
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        
        return !this.board[midRow][midCol];
    }
    
    validateHorseMove(fromRow, fromCol, toRow, toCol) {
        const dr = Math.abs(toRow - fromRow);
        const dc = Math.abs(toCol - fromCol);
        
        if (!((dr === 2 && dc === 1) || (dr === 1 && dc === 2))) return false;
        
        if (dr === 2) {
            const midRow = fromRow + (toRow > fromRow ? 1 : -1);
            if (this.board[midRow][fromCol]) return false;
        } else {
            const midCol = fromCol + (toCol > fromCol ? 1 : -1);
            if (this.board[fromRow][midCol]) return false;
        }
        
        return true;
    }
    
    validateChariotMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        if (fromRow === toRow) {
            const minCol = Math.min(fromCol, toCol);
            const maxCol = Math.max(fromCol, toCol);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.board[fromRow][col]) return false;
            }
        } else {
            const minRow = Math.min(fromRow, toRow);
            const maxRow = Math.max(fromRow, toRow);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][fromCol]) return false;
            }
        }
        
        return true;
    }
    
    validateCannonMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        const targetPiece = this.board[toRow][toCol];
        
        let piecesBetween = 0;
        
        if (fromRow === toRow) {
            const minCol = Math.min(fromCol, toCol);
            const maxCol = Math.max(fromCol, toCol);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.board[fromRow][col]) piecesBetween++;
            }
        } else {
            const minRow = Math.min(fromRow, toRow);
            const maxRow = Math.max(fromRow, toRow);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][fromCol]) piecesBetween++;
            }
        }
        
        if (targetPiece) {
            return piecesBetween === 1;
        } else {
            return piecesBetween === 0;
        }
    }
    
    validateSoldierMove(fromRow, fromCol, toRow, toCol) {
        const color = this.board[fromRow][fromCol].color;
        
        if (color === 'red') {
            if (fromRow < 5) {
                if (toRow !== fromRow + 1 || toCol !== fromCol) return false;
            } else {
                if ((toRow === fromRow + 1 && toCol === fromCol) ||
                    (toRow === fromRow && Math.abs(toCol - fromCol) === 1)) {
                    return true;
                }
                return false;
            }
        } else {
            if (fromRow > 4) {
                if (toRow !== fromRow - 1 || toCol !== fromCol) return false;
            } else {
                if ((toRow === fromRow - 1 && toCol === fromCol) ||
                    (toRow === fromRow && Math.abs(toCol - fromCol) === 1)) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.type,
            color: piece.color,
            captured: captured ? captured.type : null
        });
        
        if (captured) {
            this.capturedPieces[captured.color].push(captured.type);
            this.updateCapturedPieces();
        }
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        
        this.turn = this.turn === 'red' ? 'black' : 'red';
        
        this.updateUI();
        this.updateMoveList();
        
        if (this.checkGameOver()) {
            this.gameOver = true;
            this.updateUI();
        }
    }
    
    checkGameOver() {
        let redKingFound = false;
        let blackKingFound = false;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king') {
                    if (piece.color === 'red') redKingFound = true;
                    else blackKingFound = true;
                }
            }
        }
        
        return !redKingFound || !blackKingFound;
    }
    
    updateUI() {
        const turnIndicator = document.getElementById('turn-indicator');
        const statusInfo = document.getElementById('status-info');
        
        turnIndicator.textContent = this.turn === 'red' ? '红方' : '黑方';
        turnIndicator.style.color = this.turn === 'red' ? '#ff6b6b' : '#9ca3af';
        
        if (this.gameOver) {
            const winner = this.turn === 'red' ? '黑方' : '红方';
            statusInfo.textContent = `游戏结束 - ${winner}获胜！`;
            statusInfo.style.color = '#ef4444';
        } else {
            statusInfo.textContent = '游戏进行中';
            statusInfo.style.color = '#4ade80';
        }
        
        document.getElementById('move-count').textContent = Math.floor(this.moveHistory.length / 2);
    }
    
    updateCapturedPieces() {
        const redCaptured = document.getElementById('red-captured');
        const blackCaptured = document.getElementById('black-captured');
        
        redCaptured.innerHTML = this.capturedPieces.red.map(type => 
            `<div class="captured-piece red">${this.getPieceSymbol(type, 'red')}</div>`
        ).join('');
        
        blackCaptured.innerHTML = this.capturedPieces.black.map(type => 
            `<div class="captured-piece black">${this.getPieceSymbol(type, 'black')}</div>`
        ).join('');
    }
    
    updateMoveList() {
        const movesContainer = document.getElementById('moves');
        movesContainer.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const redMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            let redText = this.formatMove(redMove);
            let blackText = blackMove ? this.formatMove(blackMove) : '';
            
            moveItem.innerHTML = `
                <span class="move-number">${Math.floor(i / 2) + 1}.</span>
                <span class="move-red">${redText}</span>
                <span class="move-black">${blackText}</span>
            `;
            
            movesContainer.appendChild(moveItem);
        }
        
        movesContainer.scrollTop = movesContainer.scrollHeight;
    }
    
    formatMove(move) {
        const colNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const rowNames = ['十', '九', '八', '七', '六', '五', '四', '三', '二', '一'];
        
        const symbols = {
            king: '帅',
            guard: '仕',
            elephant: '相',
            horse: '马',
            chariot: '车',
            cannon: '炮',
            soldier: '兵'
        };
        
        const fromCol = colNames[move.from.col];
        const fromRow = rowNames[move.from.row];
        const toCol = colNames[move.to.col];
        const toRow = rowNames[move.to.row];
        
        let text = symbols[move.piece];
        
        if (move.piece === 'chariot') {
            text += `${fromCol}${fromRow}平${toCol}${toRow}`;
        } else if (move.piece === 'horse') {
            text += `${fromCol}${fromRow}${move.to.col > move.from.col ? '进' : '退'}${toCol}${toRow}`;
        } else if (move.piece === 'cannon') {
            if (move.from.row === move.to.row) {
                text += `${fromCol}${fromRow}平${toCol}${toRow}`;
            } else {
                text += `${fromCol}${fromRow}${move.to.row > move.from.row ? '进' : '退'}${toCol}${toRow}`;
            }
        } else if (move.piece === 'soldier') {
            if (move.from.col === move.to.col) {
                text += `${fromCol}${fromRow}进一`;
            } else {
                text += `${fromCol}${fromRow}平${toCol}`;
            }
        } else if (move.piece === 'king') {
            text += `${fromCol}${fromRow}平${toCol}`;
        } else if (move.piece === 'guard') {
            text += `${fromCol}${fromRow}${move.to.row > move.from.row ? '进' : '退'}${toCol}`;
        } else if (move.piece === 'elephant') {
            text += `${fromCol}${fromRow}${move.to.row > move.from.row ? '进' : '退'}${toCol}`;
        }
        
        if (move.captured) {
            text += '吃' + symbols[move.captured];
        }
        
        return text;
    }
    
    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver) return;
        
        if (this.gameMode === 'ai') {
            const lastMove = this.moveHistory.pop();
            if (lastMove) {
                this.board[lastMove.from.row][lastMove.from.col] = { type: lastMove.piece, color: lastMove.color };
                if (lastMove.captured) {
                    this.board[lastMove.to.row][lastMove.to.col] = { type: lastMove.captured, color: lastMove.color === 'red' ? 'black' : 'red' };
                    const capturedArr = this.capturedPieces[lastMove.color === 'red' ? 'black' : 'red'];
                    capturedArr.pop();
                    this.updateCapturedPieces();
                } else {
                    this.board[lastMove.to.row][lastMove.to.col] = null;
                }
                this.turn = lastMove.color;
                this.lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
            }
            
            if (this.moveHistory.length > 0) {
                const prevMove = this.moveHistory.pop();
                this.board[prevMove.from.row][prevMove.from.col] = { type: prevMove.piece, color: prevMove.color };
                if (prevMove.captured) {
                    this.board[prevMove.to.row][prevMove.to.col] = { type: prevMove.captured, color: prevMove.color === 'red' ? 'black' : 'red' };
                    const capturedArr = this.capturedPieces[prevMove.color === 'red' ? 'black' : 'red'];
                    capturedArr.pop();
                    this.updateCapturedPieces();
                } else {
                    this.board[prevMove.to.row][prevMove.to.col] = null;
                }
                this.turn = prevMove.color;
                this.lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
            }
        } else {
            const lastMove = this.moveHistory.pop();
            if (lastMove) {
                this.board[lastMove.from.row][lastMove.from.col] = { type: lastMove.piece, color: lastMove.color };
                if (lastMove.captured) {
                    this.board[lastMove.to.row][lastMove.to.col] = { type: lastMove.captured, color: lastMove.color === 'red' ? 'black' : 'red' };
                    const capturedArr = this.capturedPieces[lastMove.color === 'red' ? 'black' : 'red'];
                    capturedArr.pop();
                    this.updateCapturedPieces();
                } else {
                    this.board[lastMove.to.row][lastMove.to.col] = null;
                }
                this.turn = lastMove.color;
                this.lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
            }
        }
        
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.hintPosition = null;
        
        this.updateUI();
        this.updateMoveList();
        this.renderBoard();
    }
    
    resetGame() {
        this.board = [];
        this.turn = 'red';
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.moveHistory = [];
        this.capturedPieces = { red: [], black: [] };
        this.gameOver = false;
        this.lastMove = null;
        this.hintPosition = null;
        
        this.setupBoard();
        this.updateCapturedPieces();
        this.updateUI();
        this.updateMoveList();
        this.renderBoard();
        
        if (this.gameMode === 'ai' && this.playerSide === 'black') {
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    swapSides() {
        this.playerSide = this.playerSide === 'red' ? 'black' : 'red';
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.side === this.playerSide);
        });
        this.resetGame();
    }
    
    showHint() {
        if (this.gameOver) return;
        
        const bestMove = this.findBestMove(this.turn, Math.min(this.difficulty, 3));
        if (bestMove) {
            this.hintPosition = { row: bestMove.toRow, col: bestMove.toCol };
            this.selectedPiece = this.board[bestMove.fromRow][bestMove.fromCol];
            this.selectedPosition = { row: bestMove.fromRow, col: bestMove.fromCol };
            this.renderBoard();
            
            setTimeout(() => {
                this.hintPosition = null;
                this.renderBoard();
            }, 3000);
        }
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const depth = Math.min(this.difficulty + 1, 7);
        const bestMove = this.findBestMove(this.turn, depth);
        
        if (bestMove) {
            this.makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            this.renderBoard();
        }
    }
    
    findBestMove(color, depth) {
        const moves = this.getAllMoves(color);
        
        if (moves.length === 0) return null;
        
        let bestMove = null;
        let bestScore = color === 'red' ? -Infinity : Infinity;
        
        for (const move of moves) {
            this.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
            const score = this.minimax(color === 'red' ? 'black' : 'red', depth - 1, -Infinity, Infinity);
            this.undoMoveInternal();
            
            if (color === 'red') {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }
        
        return bestMove;
    }
    
    getAllMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 10; toRow++) {
                        for (let toCol = 0; toCol < 9; toCol++) {
                            if (this.validatePieceMove(piece.type, row, col, toRow, toCol)) {
                                const target = this.board[toRow][toCol];
                                if (!target || target.color !== color) {
                                    moves.push({ fromRow: row, fromCol: col, toRow, toCol });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    minimax(color, depth, alpha, beta) {
        if (depth === 0 || this.checkGameOver()) {
            return this.evaluateBoard();
        }
        
        const moves = this.getAllMoves(color);
        
        if (moves.length === 0) {
            return color === 'red' ? -Infinity : Infinity;
        }
        
        if (color === 'red') {
            let maxScore = -Infinity;
            for (const move of moves) {
                this.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const score = this.minimax('black', depth - 1, alpha, beta);
                this.undoMoveInternal();
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves) {
                this.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const score = this.minimax('red', depth - 1, alpha, beta);
                this.undoMoveInternal();
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }
    
    undoMoveInternal() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        if (lastMove) {
            this.board[lastMove.from.row][lastMove.from.col] = { type: lastMove.piece, color: lastMove.color };
            if (lastMove.captured) {
                this.board[lastMove.to.row][lastMove.to.col] = { type: lastMove.captured, color: lastMove.color === 'red' ? 'black' : 'red' };
                const capturedArr = this.capturedPieces[lastMove.color === 'red' ? 'black' : 'red'];
                capturedArr.pop();
            } else {
                this.board[lastMove.to.row][lastMove.to.col] = null;
            }
            this.turn = lastMove.color;
            this.lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
        }
    }
    
    evaluateBoard() {
        const pieceValues = {
            king: 10000,
            guard: 200,
            elephant: 200,
            horse: 450,
            chariot: 900,
            cannon: 450,
            soldier: 100
        };
        
        let score = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    let value = pieceValues[piece.type];
                    
                    if (piece.type === 'soldier') {
                        if (piece.color === 'red') {
                            value += row * 20;
                        } else {
                            value += (9 - row) * 20;
                        }
                    }
                    
                    if (piece.type === 'king') {
                        if (piece.color === 'red') {
                            value += (2 - row) * 50;
                            value += Math.abs(col - 4) * 10;
                        } else {
                            value += (row - 7) * 50;
                            value += Math.abs(col - 4) * 10;
                        }
                    }
                    
                    if (piece.color === 'red') {
                        score += value;
                    } else {
                        score -= value;
                    }
                }
            }
        }
        
        return score;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});