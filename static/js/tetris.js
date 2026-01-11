const canvas = document.getElementById('tetrisCanvas');

if (!canvas) {
    console.error('Tetris canvas not found!');
} else {
    const ctx = canvas.getContext('2d');

    const COLS = 8;
    const ROWS = 13;
    const BLOCK_SIZE = 30;
    const FALL_SPEED = 450;

const TETROMINOES = {
    'I': [[1,1,1,1]],
    'O': [[1,1],[1,1]],
    'T': [[0,1,0],[1,1,1]],
    'S': [[0,1,1],[1,1,0]],
    'Z': [[1,1,0],[0,1,1]],
    'L': [[1,0],[1,0],[1,1]],
    'J': [[0,1],[0,1],[1,1]]
};

const SHAPES = Object.keys(TETROMINOES);

let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let lastFallTime = 0;

function createPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const piece = TETROMINOES[shape];
    currentPiece = piece;
    
    currentX = Math.floor(Math.random() * (COLS - piece[0].length + 1));
    
    currentY = -piece.length;
    
    if (collides(currentPiece, currentX, 0)) {
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    }
}

function collides(piece, offsetX, offsetY) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x]) {
                const newX = offsetX + x;
                const newY = offsetY + y;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                const boardY = currentY + y;
                const boardX = currentX + x;
                if (boardY >= 0 && boardY < ROWS) {
                    board[boardY][boardX] = 1;
                }
            }
        }
    }
}

function clearLines() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell === 1)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            y++;
        }
    }
}

function drawBoard() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(
                    x * BLOCK_SIZE + 3,
                    y * BLOCK_SIZE + 3,
                    BLOCK_SIZE - 2,
                    BLOCK_SIZE - 2
                );
                
                ctx.fillStyle = '#000000';
                ctx.fillRect(
                    x * BLOCK_SIZE + 1,
                    y * BLOCK_SIZE + 1,
                    BLOCK_SIZE - 2,
                    BLOCK_SIZE - 2
                );
            }
        }
    }
    
    if (currentPiece) {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    const drawY = currentY + y;
                    if (drawY >= 0) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                        ctx.fillRect(
                            (currentX + x) * BLOCK_SIZE + 3,
                            drawY * BLOCK_SIZE + 3,
                            BLOCK_SIZE - 2,
                            BLOCK_SIZE - 2
                        );
                        
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(
                            (currentX + x) * BLOCK_SIZE + 1,
                            drawY * BLOCK_SIZE + 1,
                            BLOCK_SIZE - 2,
                            BLOCK_SIZE - 2
                        );
                    }
                }
            }
        }
    }
}

function update(currentTime) {
    if (!currentPiece) {
        createPiece();
    }
    
    if (currentTime - lastFallTime > FALL_SPEED) {
        currentY++;
        
        if (collides(currentPiece, currentX, currentY)) {
            currentY--;
            mergePiece();
            clearLines();
            currentPiece = null;
        }
        
        lastFallTime = currentTime;
    }
    
    drawBoard();
    requestAnimationFrame(update);
}

    createPiece();
    requestAnimationFrame(update);
}