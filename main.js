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
  meteors: [],
  spawnTimer: 0,
  score: 0,
  health: 3,
  hitCooldown: 0,
  gameOver: false,
};

const METEOR_COLORS = ["#f97316", "#fb7185", "#facc15"];

function resetGame() {
  state.hero = {
    x: 180,
    y: 360,
    baseY: 360,
    width: 70,
    height: 90,
    jumpVelocity: 0,
    isJumping: false,
    attackTimer: 0,
  };
  state.meteors = [];
  state.spawnTimer = 0;
  state.score = 0;
  state.health = 3;
  state.hitCooldown = 0;
  state.gameOver = false;
}

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
    if (!state.gameOver) {
      jump();
    }
  }
  if (event.key.toLowerCase() === "j") {
    if (!state.gameOver) {
      attack();
    }
  }
  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
});

function spawnMeteor() {
  const size = 24 + Math.random() * 16;
  state.meteors.push({
    x: canvas.width + size + Math.random() * 180,
    y: 360 + Math.random() * 60,
    size,
    speed: 4.4 + Math.random() * 1.8,
    wobble: Math.random() * Math.PI * 2,
    color: METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)],
  });
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(delta) {
  state.backgroundOffset = (state.backgroundOffset + delta * 0.05) % canvas.width;

  for (const star of state.stars) {
    star.x -= star.speed * delta * 0.08;
    if (star.x < -5) {
      star.x = canvas.width + 5;
      star.y = Math.random() * canvas.height;
    }
  }

  if (state.gameOver) {
    state.monster.bob += delta * 0.004;
    return;
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

  if (state.hitCooldown > 0) {
    state.hitCooldown -= delta;
    if (state.hitCooldown < 0) {
      state.hitCooldown = 0;
    }
  }

  state.spawnTimer -= delta;
  if (state.spawnTimer <= 0) {
    spawnMeteor();
    state.spawnTimer = 900 + Math.random() * 800;
  }

  for (const meteor of state.meteors) {
    meteor.x -= meteor.speed;
    meteor.wobble += 0.04;
    meteor.y += Math.sin(meteor.wobble) * 0.4;
  }

  state.meteors = state.meteors.filter((meteor) => meteor.x + meteor.size > -40);

  if (state.hero.attackTimer > 0) {
    const attackBox = {
      x: state.hero.x + state.hero.width - 6,
      y: state.hero.y + 10,
      width: 60,
      height: 50,
    };
    state.meteors = state.meteors.filter((meteor) => {
      const meteorBox = {
        x: meteor.x - meteor.size * 0.6,
        y: meteor.y - meteor.size * 0.6,
        width: meteor.size * 1.2,
        height: meteor.size * 1.2,
      };
      if (rectsOverlap(attackBox, meteorBox)) {
        state.score += 120;
        return false;
      }
      return true;
    });
  }

  if (state.hitCooldown <= 0) {
    const heroBox = {
      x: state.hero.x + 10,
      y: state.hero.y + 10,
      width: state.hero.width - 20,
      height: state.hero.height - 10,
    };
    for (const meteor of state.meteors) {
      const meteorBox = {
        x: meteor.x - meteor.size * 0.5,
        y: meteor.y - meteor.size * 0.5,
        width: meteor.size,
        height: meteor.size,
      };
      if (rectsOverlap(heroBox, meteorBox)) {
        state.health -= 1;
        state.hitCooldown = 1000;
        meteor.x = -100;
        break;
      }
    }
  }

  if (state.health <= 0) {
    state.gameOver = true;
  }

  state.score += delta * 0.02;
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

  if (state.hitCooldown > 0) {
    ctx.fillStyle = "rgba(248, 113, 113, 0.35)";
    ctx.beginPath();
    ctx.ellipse(34, 58, 40, 44, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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

function drawMeteors() {
  for (const meteor of state.meteors) {
    ctx.save();
    ctx.translate(meteor.x, meteor.y);
    ctx.rotate(Math.sin(meteor.wobble) * 0.4);

    ctx.fillStyle = meteor.color;
    ctx.beginPath();
    ctx.arc(0, 0, meteor.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(-meteor.size * 0.2, -meteor.size * 0.15, meteor.size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-meteor.size * 1.2, 0);
    ctx.lineTo(-meteor.size * 0.6, 0);
    ctx.stroke();

    ctx.restore();
  }
}

function drawHud() {
  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.font = "16px 'Zen Maru Gothic', sans-serif";
  ctx.fillText("人間 vs モンスター", 30, 36);
  ctx.fillStyle = "rgba(129, 140, 248, 0.8)";
  ctx.fillText("Space scroll demo", 30, 58);

  ctx.fillStyle = "rgba(191, 219, 254, 0.9)";
  ctx.font = "18px 'Zen Maru Gothic', sans-serif";
  ctx.fillText(`Score: ${Math.floor(state.score)}`, 760, 36);

  ctx.fillStyle = "rgba(248, 113, 113, 0.9)";
  ctx.fillText(`Life: ${state.health}`, 760, 62);
}

function drawGameOver() {
  if (!state.gameOver) {
    return;
  }
  ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "36px 'Zen Maru Gothic', sans-serif";
  ctx.fillText("GAME OVER", 350, 240);

  ctx.fillStyle = "rgba(199, 210, 254, 0.9)";
  ctx.font = "20px 'Zen Maru Gothic', sans-serif";
  ctx.fillText("Rキーでリトライ", 380, 280);
}

function render() {
  drawBackground();
  drawMeteors();
  drawHero();
  drawMonster();
  drawHud();
  drawGameOver();
}

function loop(timestamp) {
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  update(delta);
  render();
  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
