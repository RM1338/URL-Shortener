class QRTetrisBuilder {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.qrMatrix = [];
        this.isBuilding = false;
        this.buildQueue = [];
        this.placedBlocks = [];
        this.blockSize = 10; 
        this.animationSpeed = 15; 
        this.lastDropTime = 0;
        this.currentY = 0;
    }

    async loadQRMatrix(shortCode) {
        try {
            const response = await fetch(`/api/qr/${shortCode}`);
            const data = await response.json();
            this.qrMatrix = data.matrix;
            
            this.canvas.width = data.width * this.blockSize;
            this.canvas.height = data.height * this.blockSize;
            
            this.prepareBlocks();
            return true;
        } catch (error) {
            console.error('Failed to load QR matrix:', error);
            return false;
        }
    }

    prepareBlocks() {
        this.buildQueue = [];
        
        const width = this.qrMatrix[0].length;
        const height = this.qrMatrix.length;
        
        for (let x = 0; x < width; x++) {
            const columnBlocks = [];
            for (let y = 0; y < height; y++) {
                if (this.qrMatrix[y][x] === 1) {
                    columnBlocks.push({ x, y });
                }
            }
            if (columnBlocks.length > 0) {
                this.buildQueue.push(columnBlocks);
            }
        }
    }

    start() {
        this.isBuilding = true;
        this.placedBlocks = [];
        this.currentColumnIndex = 0;
        this.currentColumn = [];
        this.currentY = 0;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        this.animate();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        const width = this.qrMatrix[0].length;
        const height = this.qrMatrix.length;
        
        for (let x = 0; x <= width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, height * this.blockSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(width * this.blockSize, y * this.blockSize);
            this.ctx.stroke();
        }
    }

    animate(currentTime = 0) {
        if (!this.isBuilding) return;
        
        if (this.currentColumn.length === 0) {
            if (this.currentColumnIndex >= this.buildQueue.length) {
                this.isBuilding = false;
                this.drawFinal();
                return;
            }
            
            this.currentColumn = [...this.buildQueue[this.currentColumnIndex]];
            this.currentColumnIndex++;
            this.currentY = -this.currentColumn.length;
        }
        
        if (currentTime - this.lastDropTime > this.animationSpeed) {
            this.currentY++;
            
            const bottomBlock = this.currentColumn[this.currentColumn.length - 1];
            if (this.currentY + this.currentColumn.length > bottomBlock.y + 1) {
                this.placedBlocks.push(...this.currentColumn);
                this.currentColumn = [];
            }
            
            this.lastDropTime = currentTime;
        }
        
        this.draw();
        
        requestAnimationFrame((t) => this.animate(t));
    }

    draw() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        this.ctx.fillStyle = '#000000';
        for (const block of this.placedBlocks) {
            this.ctx.fillRect(
                block.x * this.blockSize + 1,
                block.y * this.blockSize + 1,
                this.blockSize - 2,
                this.blockSize - 2
            );
        }
        
        this.ctx.fillStyle = '#000000';
        for (let i = 0; i < this.currentColumn.length; i++) {
            const block = this.currentColumn[i];
            const drawY = (this.currentY + i) * this.blockSize;
            
            if (drawY >= 0) {
                this.ctx.fillRect(
                    block.x * this.blockSize + 1,
                    drawY + 1,
                    this.blockSize - 2,
                    this.blockSize - 2
                );
            }
        }
    }

    drawFinal() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        this.ctx.fillStyle = '#000000';
        for (let y = 0; y < this.qrMatrix.length; y++) {
            for (let x = 0; x < this.qrMatrix[y].length; x++) {
                if (this.qrMatrix[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.blockSize + 1,
                        y * this.blockSize + 1,
                        this.blockSize - 2,
                        this.blockSize - 2
                    );
                }
            }
        }
    }

    stop() {
        this.isBuilding = false;
    }
}

let qrBuilder = null;

async function showQRCode() {
    const shortUrlText = document.getElementById('shortUrl').textContent;
    const shortCode = shortUrlText.split('/').pop();
    
    const tetrisContainer = document.querySelector('.tetris-container');
    if (tetrisContainer) {
        tetrisContainer.style.display = 'none';
    }
    
    let qrContainer = document.getElementById('qr-container');
    if (!qrContainer) {
        qrContainer = document.createElement('div');
        qrContainer.id = 'qr-container';
        qrContainer.className = 'tetris-container';
        qrContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <h3 style="font-family: 'Press Start 2P', cursive; font-size: 12px; margin-bottom: 10px;">Building QR Code...</h3>
                <canvas id="qrCanvas"></canvas>
                <button onclick="closeQRCode()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
            </div>
        `;
        document.body.insertBefore(qrContainer, document.querySelector('.main-content'));
    }
    qrContainer.style.display = 'block';
    
    qrBuilder = new QRTetrisBuilder('qrCanvas');
    const loaded = await qrBuilder.loadQRMatrix(shortCode);
    
    if (loaded) {
        qrBuilder.start();
    } else {
        alert('Failed to generate QR code');
    }
}

function closeQRCode() {
    const qrContainer = document.getElementById('qr-container');
    if (qrContainer) {
        qrContainer.style.display = 'none';
    }
    
    if (qrBuilder) {
        qrBuilder.stop();
    }
    
    const tetrisContainer = document.querySelector('.tetris-container');
    if (tetrisContainer) {
        tetrisContainer.style.display = 'block';
    }
}