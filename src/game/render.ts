import type { Camera } from "./camera";
import type { GameAssets } from "./assets";
import type { Coin } from "./entities/Coin";
import type { Enemy } from "./entities/Enemy";
import type { Player } from "./entities/Player";
import type {
  DecorationLayer,
  DecorationSpawn,
  StageBackgroundStyle,
  StageVisualTheme,
} from "./level";
import type { Rect } from "./types";

const DEFAULT_THEME: StageVisualTheme = {
  skyTop: "#070a1f",
  skyMid: "#130f37",
  skyBottom: "#23164a",
  nebula: ["#4b7fff", "#b86fff", "#58d8ff"],
  haze: "#9e7dff",
  star: "#ffffff",
  solidOverlay: "#8af7ff",
  hudStroke: "#7ddbff",
  hudPanel: "#081133",
};

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  width: number,
  height: number,
  elapsedSeconds: number,
  assets?: GameAssets,
  backgroundStyle: StageBackgroundStyle = "nebula",
  theme: StageVisualTheme = DEFAULT_THEME,
): void {
  const activeTheme = theme ?? DEFAULT_THEME;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, activeTheme.skyTop);
  gradient.addColorStop(0.55, activeTheme.skyMid);
  gradient.addColorStop(1, activeTheme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (backgroundStyle === "cometStorm") {
    drawCometStorm(ctx, width, height, cameraX, elapsedSeconds, activeTheme);
  } else if (backgroundStyle === "orbitalGrid") {
    drawOrbitalGrid(ctx, width, height, cameraX, elapsedSeconds, activeTheme);
  } else if (backgroundStyle === "lunarMist") {
    drawLunarMist(ctx, width, height, cameraX, elapsedSeconds, activeTheme);
  } else if (backgroundStyle === "redAlert") {
    drawRedAlertBands(ctx, width, height, cameraX, elapsedSeconds, activeTheme);
  } else {
    drawNebulaBands(ctx, width, height, cameraX, elapsedSeconds, activeTheme);
  }

  if (assets) {
    if (backgroundStyle === "orbitalGrid") {
      drawParallaxLayer(ctx, assets.backgroundFar, cameraX, 0.08, 0.9, -232, 0.68);
      drawParallaxLayer(ctx, assets.backgroundMid, cameraX, 0.18, 0.92, -182, 0.78);
      drawParallaxLayer(ctx, assets.backgroundNear, cameraX, 0.3, 0.94, -118, 0.86);
    } else {
      drawParallaxLayer(ctx, assets.backgroundFar, cameraX, 0.12, 0.92, -252, 0.78);
      drawParallaxLayer(ctx, assets.backgroundMid, cameraX, 0.22, 0.92, -194, 0.84);
      drawParallaxLayer(ctx, assets.backgroundNear, cameraX, 0.36, 0.94, -122, 0.9);
    }
  }

  drawStarfield(ctx, width, height, cameraX, elapsedSeconds, activeTheme);

  ctx.fillStyle = toRgba(activeTheme.haze, 0.16);
  const hazeY = height - 96 + Math.sin(elapsedSeconds * 1.3) * 6;
  ctx.fillRect(0, hazeY, width, 44);
}

export function drawDecorations(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  decorations: DecorationSpawn[],
  layer: DecorationLayer,
  assets?: GameAssets,
): void {
  for (const decoration of decorations) {
    if (decoration.layer !== layer) {
      continue;
    }
    const px = decoration.x - camera.x * decoration.parallax;
    const py = decoration.y - camera.y;
    const sprite = pickDecorationSprite(decoration.type, assets);
    if (sprite) {
      ctx.drawImage(sprite, Math.floor(px), Math.floor(py), decoration.w, decoration.h);
      continue;
    }
    drawDecorationFallback(ctx, decoration, px, py);
  }
}

export function drawSolids(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  solids: Rect[],
  assets?: GameAssets,
  theme: StageVisualTheme = DEFAULT_THEME,
): void {
  const activeTheme = theme ?? DEFAULT_THEME;

  for (const solid of solids) {
    const sx = Math.floor(solid.x - camera.x);
    const sy = Math.floor(solid.y - camera.y);
    const isGround = solid.h >= 30;
    const tile = isGround ? assets?.groundTile : assets?.platformTile;
    if (tile && isLoaded(tile)) {
      drawTiledSprite(ctx, tile, sx, sy, solid.w, solid.h);
    } else {
      const baseColor = isGround ? "#2c1f4e" : "#2b3559";
      const topColor = isGround ? "#8af7ff" : "#98d0ff";
      ctx.fillStyle = baseColor;
      ctx.fillRect(sx, sy, solid.w, solid.h);
      ctx.fillStyle = topColor;
      ctx.fillRect(sx, sy, solid.w, Math.min(7, solid.h));
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      for (let offset = 8; offset < solid.w; offset += 24) {
        ctx.fillRect(sx + offset, sy + 10, 8, Math.max(3, solid.h - 14));
      }
    }

    ctx.fillStyle = toRgba(activeTheme.solidOverlay, isGround ? 0.2 : 0.28);
    ctx.fillRect(sx, sy, solid.w, solid.h);
  }
}

export function drawCoins(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  coins: Coin[],
  assets?: GameAssets,
): void {
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }
    const cx = coin.x - camera.x;
    const cy = coin.y - camera.y;
    if (assets?.coin && isLoaded(assets.coin)) {
      const size = coin.r * 2.45;
      ctx.drawImage(assets.coin, cx - size * 0.5, cy - size * 0.5, size, size);
    } else {
      ctx.beginPath();
      ctx.fillStyle = "#ffd570";
      ctx.arc(cx, cy, coin.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "#fff6bf";
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, coin.r - 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawEnemies(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  enemies: Enemy[],
  assets?: GameAssets,
): void {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }
    const sx = enemy.x - camera.x;
    const sy = enemy.y - camera.y;
    const isMoving = Math.abs(enemy.vx) > 28 || enemy.isDashing() || !enemy.grounded;
    const enemySprite = pickEnemySprite(enemy, assets, isMoving);
    if (enemySprite && isLoaded(enemySprite)) {
      const movementFacing: -1 | 1 = Math.abs(enemy.vx) > 4 ? (enemy.vx > 0 ? 1 : -1) : enemy.direction;
      const enemyFacing: -1 | 1 = movementFacing > 0 ? -1 : 1;
      const sizeScale = pickEnemySizeScale(enemy);
      drawSpriteBottomCenter(
        ctx,
        enemySprite,
        sx + enemy.w * 0.5,
        sy + enemy.h + 4,
        enemy.h * sizeScale,
        enemyFacing,
      );
    } else {
      const bodyX = sx + enemy.w * 0.5;
      const bodyY = sy + enemy.h * 0.5;
      const tint = enemy.maxHp >= 3 ? "#ff8d95" : enemy.maxHp === 2 ? "#ffd18f" : "#72ffbe";
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.ellipse(bodyX, bodyY, enemy.w * 0.56, enemy.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(bodyX - 9, bodyY - 4, 5, 0, Math.PI * 2);
      ctx.arc(bodyX + 9, bodyY - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#223142";
      ctx.beginPath();
      ctx.arc(bodyX - 9, bodyY - 4, 2.2, 0, Math.PI * 2);
      ctx.arc(bodyX + 9, bodyY - 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#223142";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bodyX, bodyY + 3, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.fillStyle = "#9dffe0";
      ctx.beginPath();
      ctx.arc(bodyX - 14, bodyY - 16, 4, 0, Math.PI * 2);
      ctx.arc(bodyX + 14, bodyY - 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.isDashing()) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
      const trailDir = enemy.direction > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(
        sx + enemy.w * 0.5 + trailDir * 14,
        sy + enemy.h * 0.52,
        enemy.w * 0.58,
        enemy.h * 0.44,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    if (enemy.maxHp > 1) {
      const barW = enemy.w + 10;
      const barH = 5;
      const bx = sx - 5;
      const by = sy - 10;
      ctx.fillStyle = "rgba(7, 12, 26, 0.75)";
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = enemy.maxHp >= 3 ? "#ff8d95" : "#ffd26e";
      ctx.fillRect(bx, by, (barW * enemy.hp) / enemy.maxHp, barH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);
    }
  }
}

export function drawEnemyShots(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  enemyShots: Array<{ x: number; y: number; r: number; vx: number }>,
): void {
  for (const shot of enemyShots) {
    const sx = shot.x - camera.x;
    const sy = shot.y - camera.y;
    const grad = ctx.createRadialGradient(sx, sy, shot.r * 0.2, sx, sy, shot.r * 2.1);
    grad.addColorStop(0, "rgba(255, 240, 180, 1)");
    grad.addColorStop(0.45, "rgba(255, 190, 80, 0.95)");
    grad.addColorStop(1, "rgba(255, 130, 60, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, shot.r * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe09a";
    ctx.beginPath();
    ctx.arc(sx, sy, shot.r, 0, Math.PI * 2);
    ctx.fill();

    const trail = shot.vx >= 0 ? -1 : 1;
    ctx.fillStyle = "rgba(255, 230, 170, 0.65)";
    ctx.beginPath();
    ctx.ellipse(sx + trail * shot.r * 1.25, sy, shot.r * 1.4, shot.r * 0.74, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  player: Player,
  assets?: GameAssets,
): void {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;
  const centerX = sx + player.w * 0.5;
  const centerY = sy + player.h * 0.55;
  const isDashPose = player.dashTimer > 0;
  const isPulsePose = player.pulseTimer > 0;
  const isAirPose = !player.grounded && Math.abs(player.vy) > 40;
  const isMovingOnGround = player.grounded && Math.abs(player.vx) > 28;
  if (isPulsePose) {
    const pulseRatio = Math.min(1, player.pulseTimer / 0.3);
    ctx.strokeStyle = `rgba(125, 255, 244, ${0.2 + pulseRatio * 0.45})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 26 + (1 - pulseRatio) * 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(168, 220, 255, ${0.15 + pulseRatio * 0.32})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18 + (1 - pulseRatio) * 64, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isDashPose) {
    const trailDir = player.facing > 0 ? -1 : 1;
    for (let index = 0; index < 3; index += 1) {
      const t = index / 3;
      ctx.fillStyle = `rgba(134, 224, 255, ${0.22 - t * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(
        centerX + trailDir * (16 + index * 18),
        centerY + 4 + index * 2,
        26 - index * 4,
        14 - index * 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  const sprite = isDashPose
    ? assets?.heroMove ?? assets?.heroAir ?? assets?.heroIdle
    : isAirPose
      ? assets?.heroAir
      : isMovingOnGround
        ? assets?.heroMove ?? assets?.heroIdle
        : assets?.heroIdle;
  if (sprite && isLoaded(sprite)) {
    const playerFacing = player.facing;
    const poseScale = isDashPose ? 2.1 : isAirPose ? 2.02 : isMovingOnGround ? 1.98 : 1.94;
    drawSpriteBottomCenter(
      ctx,
      sprite,
      sx + player.w * 0.5,
      sy + player.h + 6,
      player.h * poseScale,
      playerFacing,
    );
    return;
  }

  ctx.fillStyle = "#4fa3ff";
  ctx.fillRect(sx, sy, player.w, player.h);
  ctx.fillStyle = "#dff5ff";
  ctx.fillRect(sx + 7, sy + 9, player.w - 14, 8);
}

export function drawGoal(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  goal: Rect,
  assets?: GameAssets,
): void {
  const sx = goal.x - camera.x;
  const sy = goal.y - camera.y;
  if (assets?.goalFlag && isLoaded(assets.goalFlag)) {
    ctx.drawImage(assets.goalFlag, sx - 20, sy - 96, 124, 178);
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(sx, sy, 4, goal.h);
  ctx.fillStyle = "#ff7b8f";
  ctx.beginPath();
  ctx.moveTo(sx + 4, sy);
  ctx.lineTo(sx + goal.w, sy + 12);
  ctx.lineTo(sx + 4, sy + 24);
  ctx.closePath();
  ctx.fill();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  score: number,
  hp: number,
  maxHp: number,
  collectedCoins: number,
  totalCoins: number,
  stageNumber: number,
  totalStages: number,
  stageTitle: string,
  stageTagline: string,
  theme: StageVisualTheme = DEFAULT_THEME,
): void {
  const activeTheme = theme ?? DEFAULT_THEME;

  ctx.fillStyle = toRgba(activeTheme.hudPanel, 0.82);
  ctx.fillRect(14, 14, 590, 108);
  ctx.strokeStyle = toRgba(activeTheme.hudStroke, 0.72);
  ctx.strokeRect(14, 14, 590, 108);

  ctx.fillStyle = "#f6f8ff";
  ctx.font = "700 18px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Stage ${stageNumber}/${totalStages} - ${stageTitle}`, 28, 40);

  ctx.font = "600 14px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#def2ff";
  ctx.fillText(stageTagline, 28, 62);

  ctx.font = "700 17px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#f6f8ff";
  ctx.fillText(`Score ${score}`, 28, 92);
  ctx.fillText(`HP ${hp}/${maxHp}`, 196, 92);
  ctx.fillText(`Coins ${collectedCoins}/${totalCoins}`, 286, 92);

  const hpBarX = 196;
  const hpBarY = 99;
  const hpBarW = 78;
  const hpBarH = 8;
  const hpRatio = maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp));
  ctx.fillStyle = "rgba(7, 12, 26, 0.78)";
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = hpRatio > 0.45 ? "#7dffbc" : hpRatio > 0.2 ? "#ffd37d" : "#ff8f9f";
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  helperText?: string,
): void {
  ctx.fillStyle = "rgba(6, 8, 22, 0.65)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 50px 'Trebuchet MS', sans-serif";
  ctx.fillText(title, ctx.canvas.width * 0.5, ctx.canvas.height * 0.42);
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d7f1ff";
  ctx.fillText(subtitle, ctx.canvas.width * 0.5, ctx.canvas.height * 0.53);

  if (helperText) {
    ctx.font = "600 16px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "#f3f8ff";
    ctx.fillText(helperText, ctx.canvas.width * 0.5, ctx.canvas.height * 0.62);
  }
  ctx.textAlign = "left";
}

function isLoaded(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
}

function drawSpriteBottomCenter(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  bottomY: number,
  drawHeight: number,
  facing: -1 | 1 = 1,
): void {
  const aspect = image.width / image.height;
  const drawWidth = drawHeight * aspect;
  if (facing >= 0) {
    ctx.drawImage(image, centerX - drawWidth * 0.5, bottomY - drawHeight, drawWidth, drawHeight);
    return;
  }

  ctx.save();
  ctx.translate(centerX, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, -drawWidth * 0.5, bottomY - drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cameraX: number,
  speed: number,
  scale: number,
  yOffset: number,
  alpha: number,
): void {
  if (!isLoaded(image)) {
    return;
  }
  const drawHeight = image.height * scale;
  const drawWidth = image.width * scale;
  const startX = -((cameraX * speed) % drawWidth) - drawWidth;
  const y = ctx.canvas.height - drawHeight + yOffset;
  const previousAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  for (let x = startX; x < ctx.canvas.width + drawWidth; x += drawWidth) {
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }
  ctx.globalAlpha = previousAlpha;
}

function drawTiledSprite(
  ctx: CanvasRenderingContext2D,
  tile: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const tileW = Math.max(8, Math.round(tile.width * (height / tile.height)));
  for (let offset = 0; offset < width; offset += tileW) {
    const chunkW = Math.min(tileW, width - offset);
    ctx.drawImage(tile, x + offset, y, chunkW, height);
  }
}

function pickDecorationSprite(
  type: DecorationSpawn["type"],
  assets?: GameAssets,
): HTMLImageElement | null {
  if (!assets) {
    return null;
  }
  if (type === "planet" && isLoaded(assets.decoPlanet)) {
    return assets.decoPlanet;
  }
  if (type === "ufo" && isLoaded(assets.decoUfo)) {
    return assets.decoUfo;
  }
  if (type === "satellite" && isLoaded(assets.decoSatellite)) {
    return assets.decoSatellite;
  }
  return null;
}

function pickEnemySprite(
  enemy: Enemy,
  assets: GameAssets | undefined,
  isMoving: boolean,
): HTMLImageElement | null {
  if (!assets) {
    return null;
  }
  if (enemy.tier === "scout") {
    return assets.enemyScout;
  }
  if (enemy.tier === "runner") {
    return isMoving ? assets.enemyRunner : assets.enemyScout;
  }
  if (enemy.tier === "hopper") {
    return assets.enemyHopper;
  }
  if (enemy.tier === "guard") {
    return assets.enemyGuard;
  }
  if (enemy.tier === "ace") {
    return assets.enemyAce;
  }
  return assets.enemySlime;
}

function pickEnemySizeScale(enemy: Enemy): number {
  if (enemy.tier === "scout") {
    return 1.82;
  }
  if (enemy.tier === "runner") {
    return 1.95;
  }
  if (enemy.tier === "hopper") {
    return 1.85;
  }
  if (enemy.tier === "guard") {
    return 1.95;
  }
  if (enemy.tier === "ace") {
    return 2.08;
  }
  return 1.85;
}

function drawDecorationFallback(
  ctx: CanvasRenderingContext2D,
  decoration: DecorationSpawn,
  x: number,
  y: number,
): void {
  if (decoration.type === "planet") {
    ctx.fillStyle = "#8f8dff";
    ctx.beginPath();
    ctx.arc(x + decoration.w * 0.5, y + decoration.h * 0.5, decoration.w * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(222, 211, 255, 0.8)";
    ctx.lineWidth = Math.max(2, decoration.w * 0.04);
    ctx.beginPath();
    ctx.ellipse(
      x + decoration.w * 0.5,
      y + decoration.h * 0.52,
      decoration.w * 0.46,
      decoration.h * 0.15,
      -0.1,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    return;
  }

  if (decoration.type === "ufo") {
    ctx.fillStyle = "#a0f3ff";
    ctx.beginPath();
    ctx.ellipse(
      x + decoration.w * 0.5,
      y + decoration.h * 0.42,
      decoration.w * 0.26,
      decoration.h * 0.2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#8db4ff";
    ctx.beginPath();
    ctx.ellipse(
      x + decoration.w * 0.5,
      y + decoration.h * 0.62,
      decoration.w * 0.46,
      decoration.h * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#fff6ba";
    ctx.beginPath();
    ctx.arc(x + decoration.w * 0.3, y + decoration.h * 0.64, decoration.w * 0.05, 0, Math.PI * 2);
    ctx.arc(x + decoration.w * 0.7, y + decoration.h * 0.64, decoration.w * 0.05, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = "#d4d9f8";
  ctx.fillRect(x + decoration.w * 0.44, y + decoration.h * 0.14, decoration.w * 0.12, decoration.h * 0.72);
  ctx.fillStyle = "#a4b8ff";
  ctx.beginPath();
  ctx.moveTo(x + decoration.w * 0.28, y + decoration.h * 0.5);
  ctx.lineTo(x + decoration.w * 0.5, y + decoration.h * 0.36);
  ctx.lineTo(x + decoration.w * 0.72, y + decoration.h * 0.5);
  ctx.lineTo(x + decoration.w * 0.5, y + decoration.h * 0.64);
  ctx.closePath();
  ctx.fill();
}

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  for (let index = 0; index < 110; index += 1) {
    const starX = wrap(index * 173.47 - cameraX * (0.03 + (index % 5) * 0.01), width + 120) - 60;
    const baseY = 24 + (index * 47.39) % (height - 180);
    const waveY = Math.sin(elapsedSeconds * 0.4 + index * 1.37) * 5;
    const radius = 0.8 + (index % 3) * 0.45;
    const alpha = 0.35 + ((index * 37) % 60) / 100;
    ctx.fillStyle = toRgba(theme.star, alpha);
    ctx.beginPath();
    ctx.arc(starX, baseY + waveY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNebulaBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  const bands = [
    { color: toRgba(theme.nebula[0], 0.23), y: height * 0.24, speed: 0.07, amp: 18, wave: 0.012, seg: 280 },
    { color: toRgba(theme.nebula[1], 0.2), y: height * 0.35, speed: 0.11, amp: 24, wave: 0.011, seg: 320 },
    { color: toRgba(theme.nebula[2], 0.17), y: height * 0.5, speed: 0.17, amp: 20, wave: 0.014, seg: 260 },
  ];

  for (const band of bands) {
    const shift = -((cameraX * band.speed) % band.seg);
    ctx.fillStyle = band.color;
    for (let x = shift - band.seg; x < width + band.seg; x += band.seg) {
      const waveY = Math.sin((x + elapsedSeconds * 90) * band.wave) * band.amp;
      ctx.beginPath();
      ctx.moveTo(x, band.y + waveY);
      ctx.quadraticCurveTo(
        x + band.seg * 0.3,
        band.y - band.amp + waveY,
        x + band.seg * 0.55,
        band.y + waveY,
      );
      ctx.quadraticCurveTo(
        x + band.seg * 0.82,
        band.y + band.amp + waveY,
        x + band.seg,
        band.y + waveY,
      );
      ctx.lineTo(x + band.seg, height);
      ctx.lineTo(x, height);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawCometStorm(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  drawNebulaBands(ctx, width, height, cameraX, elapsedSeconds, theme);

  ctx.lineWidth = 2;
  for (let index = 0; index < 18; index += 1) {
    const x = wrap(index * 230 - cameraX * 0.35 - elapsedSeconds * 260, width + 320) - 160;
    const y = 44 + (index * 59) % (height * 0.55);
    ctx.strokeStyle = toRgba(theme.nebula[index % 3], 0.5 - (index % 4) * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 130, y + 34);
    ctx.stroke();

    ctx.fillStyle = toRgba(theme.star, 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrbitalGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  ctx.strokeStyle = toRgba(theme.nebula[0], 0.16);
  ctx.lineWidth = 1;
  const xShift = -((cameraX * 0.18) % 80);
  for (let x = xShift; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const yShift = -((elapsedSeconds * 18) % 60);
  for (let y = yShift; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = toRgba(theme.nebula[2], 0.22);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const cx = width * (0.24 + i * 0.28);
    const cy = height * (0.22 + ((i + 1) % 2) * 0.18);
    const r = 70 + i * 36 + Math.sin(elapsedSeconds + i) * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLunarMist(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  drawNebulaBands(ctx, width, height, cameraX * 0.4, elapsedSeconds * 0.7, theme);

  for (let index = 0; index < 8; index += 1) {
    const radius = 120 + (index % 3) * 40;
    const x = wrap(index * 280 - cameraX * (0.05 + index * 0.005), width + 260) - 130;
    const y = 80 + (index * 54) % 240 + Math.sin(elapsedSeconds * 0.7 + index) * 16;
    ctx.fillStyle = toRgba(theme.nebula[index % 3], 0.14);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRedAlertBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  elapsedSeconds: number,
  theme: StageVisualTheme,
): void {
  drawNebulaBands(ctx, width, height, cameraX, elapsedSeconds, theme);

  const offset = (elapsedSeconds * 180 + cameraX * 0.2) % 120;
  for (let x = -height; x < width + height; x += 120) {
    ctx.fillStyle = toRgba(theme.nebula[(Math.floor(x / 120) + 60) % 3], 0.12);
    ctx.beginPath();
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x + 40 + offset, 0);
    ctx.lineTo(x - height + 40 + offset, height);
    ctx.lineTo(x - height + offset, height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = toRgba(theme.nebula[0], 0.22);
  ctx.lineWidth = 2;
  for (let y = 70; y < height - 80; y += 90) {
    const wave = Math.sin(elapsedSeconds * 2.2 + y * 0.04) * 18;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    ctx.lineTo(width, y - wave);
    ctx.stroke();
  }
}

function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}

// Expected input is a hex color (#RGB or #RRGGBB). Non-hex CSS colors are returned unchanged.
function toRgba(color: string, alpha: number): string {
  const match = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) {
    return color;
  }
  const hex = match[1];
  const expanded = hex.length === 3
    ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    : hex;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
