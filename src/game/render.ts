import type { Camera } from "./camera";
import type { Coin } from "./entities/Coin";
import type { Enemy } from "./entities/Enemy";
import type { Player } from "./entities/Player";
import type { DecorationLayer, DecorationSpawn } from "./level";
import type { Rect } from "./types";
import type { GameAssets } from "./assets";

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  width: number,
  height: number,
  elapsedSeconds: number,
  assets?: GameAssets,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#86b6ff");
  gradient.addColorStop(0.65, "#9ed5ff");
  gradient.addColorStop(1, "#daf4ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (assets) {
    drawParallaxLayer(ctx, assets.backgroundFar, cameraX, 0.16, 0.72, -118, 0.85);
    drawParallaxLayer(ctx, assets.backgroundMid, cameraX, 0.36, 0.76, -62, 0.9);
    drawParallaxLayer(ctx, assets.backgroundNear, cameraX, 0.62, 0.8, -12, 0.96);
  } else {
    const layers = [
      { color: "#d4e9ff", speed: 0.2, baseY: height - 220, amp: 22, wave: 0.02, width: 300 },
      { color: "#a6d2ff", speed: 0.45, baseY: height - 160, amp: 28, wave: 0.019, width: 260 },
      { color: "#79b8ff", speed: 0.75, baseY: height - 104, amp: 26, wave: 0.018, width: 220 },
    ];

    for (const layer of layers) {
      const shift = -(cameraX * layer.speed) % layer.width;
      ctx.fillStyle = layer.color;
      for (let x = shift - layer.width; x < width + layer.width; x += layer.width) {
        const wave = Math.sin((x + elapsedSeconds * 80) * layer.wave) * layer.amp;
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x + layer.width * 0.15, layer.baseY + wave);
        ctx.lineTo(x + layer.width * 0.52, layer.baseY - layer.amp * 1.4);
        ctx.lineTo(x + layer.width, height);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = "rgba(235, 249, 255, 0.22)";
  const shimmerY = height - 170 + Math.sin(elapsedSeconds * 1.4) * 8;
  ctx.fillRect(0, shimmerY, width, 24);
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
): void {
  for (const solid of solids) {
    const sx = Math.floor(solid.x - camera.x);
    const sy = Math.floor(solid.y - camera.y);
    const isGround = solid.h >= 30;
    const tile = isGround ? assets?.groundTile : assets?.platformTile;
    if (tile && isLoaded(tile)) {
      drawTiledSprite(ctx, tile, sx, sy, solid.w, solid.h);
    } else {
      ctx.fillStyle = isGround ? "#5b4f42" : "#6c554b";
      ctx.fillRect(sx, sy, solid.w, solid.h);
      ctx.fillStyle = isGround ? "#78b44e" : "#8ccb72";
      ctx.fillRect(sx, sy, solid.w, Math.min(8, solid.h));
    }
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
      ctx.fillStyle = "#ffd447";
      ctx.arc(cx, cy, coin.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "#ffec96";
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
    if (assets?.enemySlime && isLoaded(assets.enemySlime)) {
      const drawW = enemy.w + 12;
      const drawH = enemy.h + 10;
      ctx.drawImage(assets.enemySlime, sx - 6, sy - 6, drawW, drawH);
    } else {
      ctx.fillStyle = "#d45c5c";
      ctx.fillRect(sx, sy, enemy.w, enemy.h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sx + 8, sy + 8, 8, 6);
      ctx.fillRect(sx + enemy.w - 16, sy + 8, 8, 6);
      ctx.fillStyle = "#2e1a1a";
      ctx.fillRect(sx + 11, sy + 10, 3, 3);
      ctx.fillRect(sx + enemy.w - 13, sy + 10, 3, 3);
    }
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
  const isAirPose = !player.grounded && Math.abs(player.vy) > 40;
  const sprite = isAirPose ? assets?.heroAir : assets?.heroIdle;
  if (sprite && isLoaded(sprite)) {
    ctx.drawImage(sprite, sx - 12, sy - 14, player.w + 24, player.h + 26);
  } else {
    ctx.fillStyle = "#3f7be0";
    ctx.fillRect(sx, sy, player.w, player.h);
    ctx.fillStyle = "#d8eeff";
    ctx.fillRect(sx + 8, sy + 10, player.w - 16, 8);
  }
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
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sx, sy, 4, goal.h);
    ctx.fillStyle = "#ff584f";
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy);
    ctx.lineTo(sx + goal.w, sy + 12);
    ctx.lineTo(sx + 4, sy + 24);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  score: number,
  hp: number,
  collectedCoins: number,
  totalCoins: number,
): void {
  ctx.fillStyle = "rgba(7, 28, 53, 0.82)";
  ctx.fillRect(14, 14, 268, 80);
  ctx.strokeStyle = "rgba(165, 222, 255, 0.56)";
  ctx.strokeRect(14, 14, 268, 80);
  ctx.fillStyle = "#f4fcff";
  ctx.font = "700 18px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Score ${score}`, 28, 40);
  ctx.fillText(`HP ${hp}`, 28, 66);
  ctx.fillText(`Coins ${collectedCoins}/${totalCoins}`, 132, 66);
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  helperText?: string,
): void {
  ctx.fillStyle = "rgba(8, 17, 32, 0.6)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 52px 'Trebuchet MS', sans-serif";
  ctx.fillText(title, ctx.canvas.width * 0.5, ctx.canvas.height * 0.42);
  ctx.font = "700 22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ddf3ff";
  ctx.fillText(subtitle, ctx.canvas.width * 0.5, ctx.canvas.height * 0.53);

  if (helperText) {
    ctx.font = "600 16px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "#ecf8ff";
    ctx.fillText(helperText, ctx.canvas.width * 0.5, ctx.canvas.height * 0.62);
  }
  ctx.textAlign = "left";
}

function isLoaded(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
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
  if (type === "tree" && isLoaded(assets.decoTree)) {
    return assets.decoTree;
  }
  if (type === "crystal" && isLoaded(assets.decoCrystal)) {
    return assets.decoCrystal;
  }
  if (type === "ruin" && isLoaded(assets.decoRuin)) {
    return assets.decoRuin;
  }
  return null;
}

function drawDecorationFallback(
  ctx: CanvasRenderingContext2D,
  decoration: DecorationSpawn,
  x: number,
  y: number,
): void {
  if (decoration.type === "tree") {
    ctx.fillStyle = "#1e4d2f";
    ctx.fillRect(x + decoration.w * 0.45, y + decoration.h * 0.62, decoration.w * 0.1, decoration.h * 0.38);
    ctx.fillStyle = "#3f8b4c";
    ctx.beginPath();
    ctx.ellipse(
      x + decoration.w * 0.5,
      y + decoration.h * 0.44,
      decoration.w * 0.36,
      decoration.h * 0.32,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }
  if (decoration.type === "crystal") {
    ctx.fillStyle = "#7ce8ff";
    ctx.beginPath();
    ctx.moveTo(x + decoration.w * 0.5, y);
    ctx.lineTo(x + decoration.w, y + decoration.h * 0.6);
    ctx.lineTo(x + decoration.w * 0.5, y + decoration.h);
    ctx.lineTo(x, y + decoration.h * 0.6);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.fillStyle = "#8fa5b2";
  ctx.fillRect(x + decoration.w * 0.1, y + decoration.h * 0.15, decoration.w * 0.8, decoration.h * 0.85);
}
