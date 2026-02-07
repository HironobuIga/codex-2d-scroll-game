const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const state = {
  lastTime: 0,
  backgroundOffset: 0,
  stars: Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 1 + Math.random() * 2,
    speed: 0.3 + Math.random() * 0.7,
  })),
  hero: {
    x: 180,
    y: 360,
    baseY: 360,
    width: 70,
    height: 90,
    jumpVelocity: 0,
    isJumping: false,
    attackTimer: 0,
  },
  monster: {
    x: 640,
    y: 330,
    width: 110,
    height: 120,
    bob: 0,
  },
};

function jump() {
  if (!state.hero.isJumping) {
    state.hero.isJumping = true;
    state.hero.jumpVelocity = -14;
  }
}

function attack() {
  state.hero.attackTimer = 18;
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
  if (event.key.toLowerCase() === "j") {
    attack();
  }
});

function update(delta) {
  state.backgroundOffset = (state.backgroundOffset + delta * 0.05) % canvas.width;

  for (const star of state.stars) {
    star.x -= star.speed * delta * 0.08;
    if (star.x < -5) {
      star.x = canvas.width + 5;
      star.y = Math.random() * canvas.height;
    }
  }

  if (state.hero.isJumping) {
    state.hero.y += state.hero.jumpVelocity;
    state.hero.jumpVelocity += 0.6;
    if (state.hero.y >= state.hero.baseY) {
      state.hero.y = state.hero.baseY;
      state.hero.isJumping = false;
    }
  }

  if (state.hero.attackTimer > 0) {
    state.hero.attackTimer -= delta * 0.05;
    if (state.hero.attackTimer < 0) {
      state.hero.attackTimer = 0;
    }
  }

  state.monster.bob += delta * 0.004;
}

function drawBackground() {
  ctx.fillStyle = "#070a1c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-state.backgroundOffset, 0);

  ctx.fillStyle = "rgba(46, 93, 255, 0.15)";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(200 + i * 260, 120, 110, 35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(120, 210, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(140, 90, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  for (const star of state.stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#1b1f3a";
  ctx.fillRect(0, 430, canvas.width, 110);

  ctx.fillStyle = "#2f335e";
  for (let i = 0; i < 12; i += 1) {
    ctx.fillRect(i * 90 - (state.backgroundOffset * 0.3) % 90, 430, 46, 8);
  }
}

function drawHero() {
  const { x, y, width, height, attackTimer } = state.hero;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#ffd6e0";
  ctx.beginPath();
  ctx.arc(32, 20, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(18, 34, 32, 38);

  ctx.fillStyle = "#a5b4fc";
  ctx.fillRect(8, 50, 12, 24);
  ctx.fillRect(44, 50, 12, 24);

  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(24, 70, 12, 20);

  if (attackTimer > 0) {
    ctx.strokeStyle = "rgba(252, 211, 77, 0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(70, 50, 22, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }

  ctx.restore();

  ctx.fillStyle = "#e11d48";
  ctx.fillRect(x + width - 14, y + height - 18, 12, 12);
}

function drawMonster() {
  const { x, y, width, height, bob } = state.monster;
  const floatOffset = Math.sin(bob) * 10;

  ctx.save();
  ctx.translate(x, y + floatOffset);

  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(50, 50, 50, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(20, 70, 60, 40);

  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(35, 45, 8, 0, Math.PI * 2);
  ctx.arc(65, 45, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.arc(50, 65, 12, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = "rgba(244, 114, 182, 0.7)";
  ctx.fillRect(5, 40, 14, 10);
  ctx.fillRect(82, 40, 14, 10);

  ctx.restore();

  ctx.fillStyle = "rgba(59, 130, 246, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 28, 55, 12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawBackground();
  drawHero();
  drawMonster();

  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.font = "16px 'Zen Maru Gothic', sans-serif";
  ctx.fillText("人間 vs モンスター", 30, 36);
  ctx.fillStyle = "rgba(129, 140, 248, 0.8)";
  ctx.fillText("Space scroll demo", 30, 58);
}

function loop(timestamp) {
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  update(delta);
  render();
  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
