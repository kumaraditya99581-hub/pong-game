
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerScoreText = document.getElementById("playerScore");
const computerScoreText = document.getElementById("computerScore");
const statusText = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 8;

const player = {
  x: 25,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  speed: 7,
  score: 0
};

const computer = {
  x: WIDTH - 25 - PADDLE_WIDTH,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  speed: 4.5,
  score: 0
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  vx: 5,
  vy: 3,
  speed: 5
};

let running = false;
let upPressed = false;
let downPressed = false;

function resetBall(direction = 1) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 5;
  ball.vx = ball.speed * direction;
  ball.vy = (Math.random() * 4 - 2) || 2;
}

function resetGame() {
  player.score = 0;
  computer.score = 0;

  player.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  computer.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;

  playerScoreText.textContent = "0";
  computerScoreText.textContent = "0";

  resetBall(Math.random() < 0.5 ? -1 : 1);

  running = true;
  startBtn.textContent = "Pause Game";
  statusText.textContent = "Game on! Good luck!";
}

function startGame() {
  if (!running) {
    running = true;
    startBtn.textContent = "Pause Game";
    statusText.textContent = "Game on!";
  } else {
    running = false;
    startBtn.textContent = "Resume Game";
    statusText.textContent = "Game paused.";
  }
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#36f5c5";
  ctx.shadowColor = "#36f5c5";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawCenterLine() {
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "#344156";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGame() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawCenterLine();
  drawRect(player.x, player.y, PADDLE_WIDTH,
    PADDLE_HEIGHT, "#36f5c5");
  drawRect(computer.x, computer.y, PADDLE_WIDTH,
    PADDLE_HEIGHT, "#ff6685");
  drawBall();
}

function movePlayer() {
  if (upPressed) {
    player.y -= player.speed;
  }

  if (downPressed) {
    player.y += player.speed;
  }

  player.y = Math.max(
    0, Math.min(HEIGHT - PADDLE_HEIGHT, player.y)
  );
}

function moveComputer() {
  // Follow the ball, with a small reaction delay.
  const target = ball.y - PADDLE_HEIGHT / 2;

  if (computer.y + PADDLE_HEIGHT / 2 < ball.y - 10) {
    computer.y += computer.speed;
  } else if (
    computer.y + PADDLE_HEIGHT / 2 > ball.y + 10
  ) {
    computer.y -= computer.speed;
  }

  computer.y = Math.max(
    0, Math.min(HEIGHT - PADDLE_HEIGHT, computer.y)
  );
}

function checkPaddleCollision(paddle, direction) {
  const ballLeft = ball.x - BALL_RADIUS;
  const ballRight = ball.x + BALL_RADIUS;
  const ballTop = ball.y - BALL_RADIUS;
  const ballBottom = ball.y + BALL_RADIUS;

  const paddleRight = paddle.x + PADDLE_WIDTH;
  const paddleBottom = paddle.y + PADDLE_HEIGHT;

  const overlaps =
    ballRight >= paddle.x &&
    ballLeft <= paddleRight &&
    ballBottom >= paddle.y &&
    ballTop <= paddleBottom;

  if (overlaps && ball.vx * direction < 0) {
    // Reverse the ball and increase its speed slightly.
    ball.vx = -ball.vx;
    ball.speed = Math.min(ball.speed + 0.25, 10);

    // Change the bounce angle based on impact position.
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const hitPosition = (ball.y - paddleCenter) /
      (PADDLE_HEIGHT / 2);

    ball.vy = hitPosition * 5;

    // Place the ball outside the paddle to prevent sticking.
    if (direction === 1) {
      ball.x = paddleRight + BALL_RADIUS;
    } else {
      ball.x = paddle.x - BALL_RADIUS;
    }

    // Preserve speed after changing the bounce angle.
    const magnitude = Math.hypot(ball.vx, ball.vy);
    ball.vx = Math.sign(ball.vx) *
      Math.sqrt(Math.max(1, magnitude ** 2 - ball.vy ** 2));
  }
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top and bottom wall collision.
  if (ball.y - BALL_RADIUS <= 0) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }

  if (ball.y + BALL_RADIUS >= HEIGHT) {
    ball.y = HEIGHT - BALL_RADIUS;
    ball.vy = -Math.abs(ball.vy);
  }

  // Paddle collisions.
  checkPaddleCollision(player, -1);
  checkPaddleCollision(computer, 1);

  // Computer misses: player scores.
  if (ball.x - BALL_RADIUS > WIDTH) {
    player.score++;
    playerScoreText.textContent = player.score;
    statusText.textContent = "Point for you!";
    resetBall(-1);
  }

  // Player misses: computer scores.
  if (ball.x + BALL_RADIUS < 0) {
    computer.score++;
    computerScoreText.textContent = computer.score;
    statusText.textContent = "Point for the computer!";
    resetBall(1);
  }
}

function gameLoop() {
  if (running) {
    movePlayer();
    moveComputer();
    updateBall();
  }

  drawGame();
  requestAnimationFrame(gameLoop);
}

// Mouse control: move the left paddle with the mouse.
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = HEIGHT / rect.height;
  const mouseY = (event.clientY - rect.top) * scaleY;

  player.y = mouseY - PADDLE_HEIGHT / 2;
  player.y = Math.max(
    0, Math.min(HEIGHT - PADDLE_HEIGHT, player.y)
  );
});

// Keyboard controls.
document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowUp") upPressed = true;
  if (event.key === "ArrowDown") downPressed = true;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp") upPressed = false;
  if (event.key === "ArrowDown") downPressed = false;
});

// Stop stuck movement when the browser loses focus.
window.addEventListener("blur", () => {
  upPressed = false;
  downPressed = false;
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

// Draw the opening screen and start the animation loop.
resetBall(1);
drawGame();
gameLoop();
