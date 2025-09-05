// 游戏配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const GRID_COUNT = CANVAS_SIZE / GRID_SIZE;

// 游戏状态
const gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    speed: 250
};

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 创建音效函数
function createBeep(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// 音效函数
const sounds = {
    eat: () => {
        if (!soundToggle.checked) return;
        // 吃食物音效 - 清脆的音调
        createBeep(800, 0.1, 'square');
        setTimeout(() => createBeep(1000, 0.1, 'square'), 50);
    },
    
    gameOver: () => {
        if (!soundToggle.checked) return;
        // 游戏结束音效 - 下降音调
        createBeep(400, 0.2, 'sawtooth');
        setTimeout(() => createBeep(300, 0.2, 'sawtooth'), 100);
        setTimeout(() => createBeep(200, 0.3, 'sawtooth'), 200);
    },
    
    move: () => {
        if (!soundToggle.checked) return;
        // 移动音效 - 轻微的滴答声（降低音量和频率）
        if (Math.random() < 0.3) { // 只有30%的概率播放移动音效
            createBeep(150, 0.03, 'triangle');
        }
    },
    
    start: () => {
        if (!soundToggle.checked) return;
        // 开始游戏音效 - 上升音调
        createBeep(400, 0.1, 'sine');
        setTimeout(() => createBeep(600, 0.1, 'sine'), 100);
        setTimeout(() => createBeep(800, 0.2, 'sine'), 200);
    }
};

// 蛇的初始状态
let snake = {
    body: [{x: 10, y: 10}],
    direction: {x: 0, y: 0},
    nextDirection: {x: 0, y: 0}
};

// 食物位置
let food = {x: 15, y: 15};

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const speedSelect = document.getElementById('speedSelect');
const soundToggle = document.getElementById('soundToggle');

// 初始化游戏
function initGame() {
    // 重置蛇的状态
    snake.body = [{x: 10, y: 10}];
    snake.direction = {x: 0, y: 0};
    snake.nextDirection = {x: 0, y: 0};
    
    // 重置游戏状态
    gameState.score = 0;
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    // 生成新食物
    generateFood();
    
    // 更新显示
    updateScore();
    updateHighScore();
    
    // 隐藏游戏结束界面
    gameOverDiv.style.display = 'none';
    
    // 更新按钮状态
    updateButtonStates();
    
    // 绘制初始状态
    draw();
}

// 生成食物
function generateFood() {
    do {
        food.x = Math.floor(Math.random() * GRID_COUNT);
        food.y = Math.floor(Math.random() * GRID_COUNT);
    } while (isSnakePosition(food.x, food.y));
}

// 检查位置是否被蛇占据
function isSnakePosition(x, y) {
    return snake.body.some(segment => segment.x === x && segment.y === y);
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        // 初始化音频上下文（需要用户交互）
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        gameState.isRunning = true;
        gameState.isPaused = false;
        
        sounds.start(); // 播放开始游戏音效
        
        // 如果蛇没有方向，设置默认方向
        if (snake.direction.x === 0 && snake.direction.y === 0) {
            snake.direction = {x: 1, y: 0};
            snake.nextDirection = {x: 1, y: 0};
        }
        
        updateButtonStates();
        gameState.gameLoop = setInterval(gameLoop, gameState.speed);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isRunning && !gameState.isPaused) {
        gameState.isPaused = true;
        clearInterval(gameState.gameLoop);
        updateButtonStates();
    } else if (gameState.isPaused) {
        gameState.isPaused = false;
        gameState.gameLoop = setInterval(gameLoop, gameState.speed);
        updateButtonStates();
    }
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameState.gameLoop);
    initGame();
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
}

// 更新游戏状态
function update() {
    // 更新蛇的方向
    snake.direction = {...snake.nextDirection};
    
    // 计算蛇头的新位置
    const head = {...snake.body[0]};
    head.x += snake.direction.x;
    head.y += snake.direction.y;
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新的蛇头
    snake.body.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        gameState.score += 10;
        updateScore();
        generateFood();
        sounds.eat(); // 播放吃食物音效
    } else {
        // 如果没有吃到食物，移除蛇尾
        snake.body.pop();
        sounds.move(); // 播放移动音效
    }
}

// 检查碰撞
function checkCollision(head) {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        return true;
    }
    
    // 检查自身碰撞
    return snake.body.some(segment => segment.x === head.x && segment.y === head.y);
}

// 游戏结束
function gameOver() {
    clearInterval(gameState.gameLoop);
    gameState.isRunning = false;
    
    sounds.gameOver(); // 播放游戏结束音效
    
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        updateHighScore();
    }
    
    // 显示游戏结束界面
    finalScoreElement.textContent = gameState.score;
    gameOverDiv.style.display = 'block';
    
    updateButtonStates();
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 绘制网格线
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
        ctx.stroke();
    }
    
    // 绘制蛇
    snake.body.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        
        if (index === 0) {
            // 绘制蛇头 - 圆形
            ctx.fillStyle = '#2d5a3d';
            ctx.beginPath();
            ctx.arc(x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE/2 - 1, 0, 2 * Math.PI);
            ctx.fill();
            
            // 蛇头内部渐变
            ctx.fillStyle = '#48bb78';
            ctx.beginPath();
            ctx.arc(x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE/2 - 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // 绘制眼睛
            const eyeSize = 3;
            const eyeOffset = 6;
            
            // 根据移动方向调整眼睛位置
            let eyeX1, eyeY1, eyeX2, eyeY2;
            if (snake.direction.x === 1) { // 向右
                eyeX1 = x + GRID_SIZE/2 + 3;
                eyeY1 = y + GRID_SIZE/2 - 3;
                eyeX2 = x + GRID_SIZE/2 + 3;
                eyeY2 = y + GRID_SIZE/2 + 3;
            } else if (snake.direction.x === -1) { // 向左
                eyeX1 = x + GRID_SIZE/2 - 3;
                eyeY1 = y + GRID_SIZE/2 - 3;
                eyeX2 = x + GRID_SIZE/2 - 3;
                eyeY2 = y + GRID_SIZE/2 + 3;
            } else if (snake.direction.y === -1) { // 向上
                eyeX1 = x + GRID_SIZE/2 - 3;
                eyeY1 = y + GRID_SIZE/2 - 3;
                eyeX2 = x + GRID_SIZE/2 + 3;
                eyeY2 = y + GRID_SIZE/2 - 3;
            } else { // 向下或初始状态
                eyeX1 = x + GRID_SIZE/2 - 3;
                eyeY1 = y + GRID_SIZE/2 + 3;
                eyeX2 = x + GRID_SIZE/2 + 3;
                eyeY2 = y + GRID_SIZE/2 + 3;
            }
            
            // 绘制眼睛
            ctx.fillStyle = '#1a202c';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize, 0, 2 * Math.PI);
            ctx.fill();
            
            // 眼睛高光
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX1 + 1, eyeY1 - 1, 1, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2 + 1, eyeY2 - 1, 1, 0, 2 * Math.PI);
            ctx.fill();
            
        } else {
            // 绘制蛇身 - 圆角矩形，颜色渐变
            const alpha = Math.max(0.3, 1 - (index * 0.1));
            const greenIntensity = Math.max(100, 200 - (index * 10));
            
            // 蛇身外圈
            ctx.fillStyle = `rgba(45, 90, 61, ${alpha})`;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);
            ctx.fill();
            
            // 蛇身内部
            ctx.fillStyle = `rgba(72, 187, 120, ${alpha})`;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6, 4);
            ctx.fill();
            
            // 添加鳞片纹理
            if (index % 2 === 0) {
                ctx.fillStyle = `rgba(104, 211, 145, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.roundRect(x + 5, y + 5, GRID_SIZE - 10, GRID_SIZE - 10, 2);
                ctx.fill();
            }
        }
    });
    
    // 绘制食物 - 苹果形状
    const foodX = food.x * GRID_SIZE + GRID_SIZE/2;
    const foodY = food.y * GRID_SIZE + GRID_SIZE/2;
    
    // 苹果主体
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.arc(foodX, foodY + 1, GRID_SIZE/2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 苹果顶部凹陷
    ctx.fillStyle = '#1a202c';
    ctx.beginPath();
    ctx.arc(foodX, foodY - 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 苹果茎
    ctx.fillStyle = '#68d391';
    ctx.fillRect(foodX - 1, foodY - 8, 2, 4);
    
    // 苹果叶子
    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.ellipse(foodX + 3, foodY - 6, 3, 2, Math.PI/4, 0, 2 * Math.PI);
    ctx.fill();
    
    // 苹果高光
    ctx.fillStyle = '#fc8181';
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 1, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 小高光点
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(foodX - 3, foodY - 2, 1, 0, 2 * Math.PI);
    ctx.fill();
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = gameState.score;
}

// 更新最高分显示
function updateHighScore() {
    highScoreElement.textContent = gameState.highScore;
}

// 更新按钮状态
function updateButtonStates() {
    if (!gameState.isRunning) {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        startBtn.textContent = '开始游戏';
        pauseBtn.textContent = '暂停';
    } else if (gameState.isPaused) {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        pauseBtn.textContent = '继续';
    } else {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        pauseBtn.textContent = '暂停';
    }
}

// 键盘控制
function handleKeyPress(event) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const key = event.key;
    
    switch (key) {
        case 'ArrowUp':
            snake.nextDirection = {x: 0, y: -1};
            break;
        case 'ArrowDown':
            snake.nextDirection = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
            snake.nextDirection = {x: -1, y: 0};
            break;
        case 'ArrowRight':
            snake.nextDirection = {x: 1, y: 0};
            break;
        case ' ':
            event.preventDefault();
            pauseGame();
            break;
    }
}

// 速度控制函数
function changeSpeed() {
    const newSpeed = parseInt(speedSelect.value);
    gameState.speed = newSpeed;
    
    // 如果游戏正在运行且未暂停，重新启动游戏循环以应用新速度
    if (gameState.isRunning && !gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = setInterval(gameLoop, gameState.speed);
    }
}

// 事件监听器
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', () => {
    gameOverDiv.style.display = 'none';
    restartGame();
});
speedSelect.addEventListener('change', changeSpeed);
document.addEventListener('keydown', handleKeyPress);

// 初始化游戏
initGame();

// 防止方向键滚动页面
document.addEventListener('keydown', function(event) {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
});

console.log('贪吃蛇游戏已加载完成！使用方向键控制蛇的移动，空格键暂停游戏。');