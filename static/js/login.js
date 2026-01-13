const bgCanvas = document.getElementById('bgTetris');
const bgCtx = bgCanvas.getContext('2d');

bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

const BLOCK_SIZE = 40;
const COLS = Math.ceil(bgCanvas.width / BLOCK_SIZE);
const ROWS = Math.ceil(bgCanvas.height / BLOCK_SIZE);

const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]], 
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,0],[1,0],[1,1]], 
    [[0,1],[0,1],[1,1]] 
];

class FallingPiece {
    constructor() {
        this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        this.x = Math.floor(Math.random() * (COLS - 4));
        this.y = -4;
        this.speed = 0.3 + Math.random() * 0.3;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        bgCtx.fillStyle = '#000000';
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    bgCtx.fillRect(
                        (this.x + col) * BLOCK_SIZE + 2,
                        (this.y + row) * BLOCK_SIZE + 2,
                        BLOCK_SIZE - 4,
                        BLOCK_SIZE - 4
                    );
                }
            }
        }
    }

    isOffScreen() {
        return this.y * BLOCK_SIZE > bgCanvas.height;
    }
}

let pieces = [];
let lastSpawnTime = 0;
const SPAWN_INTERVAL = 2000;

function animateBackground(currentTime) {
    if (currentTime - lastSpawnTime > SPAWN_INTERVAL) {
        pieces.push(new FallingPiece());
        lastSpawnTime = currentTime;
    }

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    pieces = pieces.filter(piece => {
        piece.update();
        piece.draw();
        return !piece.isOffScreen();
    });

    requestAnimationFrame(animateBackground);
}

requestAnimationFrame(animateBackground);

window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
});

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const btn = document.querySelector('.login-btn');

    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    btn.innerHTML = '<span>LOGGING IN...</span>';
    btn.disabled = true;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = '/';
        } else {
            showError(data.error || 'Invalid credentials');
        }
    } catch (error) {
        showError('Connection error. Please try again.');
    } finally {
        btn.innerHTML = '<span>LOGIN</span><span class="arrow">→</span>';
        btn.disabled = false;
    }
}

function showError(message) {
    const form = document.getElementById('loginForm');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
}

document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});

document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin(e);
    }
});