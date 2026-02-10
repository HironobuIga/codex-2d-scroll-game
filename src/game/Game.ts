import {
  ENEMY_MAX_FALL_SPEED,
  ENEMY_SPEED,
  PLAYER_AIR_ACCEL,
  PLAYER_AIR_FRICTION,
  PLAYER_GROUND_ACCEL,
  PLAYER_GROUND_FRICTION,
  PLAYER_INVINCIBLE_SECONDS,
  PLAYER_JUMP_SPEED,
  PLAYER_KNOCKBACK_X,
  PLAYER_KNOCKBACK_Y,
  PLAYER_MAX_FALL_SPEED,
  PLAYER_MAX_SPEED_X,
  PLAYER_STOMP_BOUNCE,
  SCORE_PER_COIN,
  SCORE_PER_STOMP,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_GRAVITY,
} from "./constants";
import type { GameAssets } from "./assets";
import { Camera } from "./camera";
import { Coin } from "./entities/Coin";
import { Enemy } from "./entities/Enemy";
import { Player } from "./entities/Player";
import { InputState } from "./input";
import { createLevel1, type LevelData } from "./level";
import {
  circleIntersectsRect,
  clamp,
  hasGroundAt,
  moveBody,
  rectsOverlap,
} from "./physics";
import {
  drawBackground,
  drawDecorations,
  drawCoins,
  drawEnemies,
  drawGoal,
  drawHud,
  drawOverlay,
  drawPlayer,
  drawSolids,
} from "./render";
import type { GameMode } from "./types";

export class Game {
  mode: GameMode = "title";
  private readonly level: LevelData;
  private readonly camera: Camera;
  private readonly player: Player;
  private assets: GameAssets | null;
  private enemies: Enemy[] = [];
  private coins: Coin[] = [];
  private score = 0;
  private collectedCoins = 0;
  private elapsedSeconds = 0;

  constructor(assets?: GameAssets) {
    this.level = createLevel1();
    this.camera = new Camera(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    this.player = new Player(this.level.spawn);
    this.assets = assets ?? null;
    this.resetRound();
    this.mode = "title";
  }

  setAssets(assets: GameAssets): void {
    this.assets = assets;
  }

  startRun(): void {
    this.resetRound();
    this.mode = "playing";
  }

  shouldShowStartButton(): boolean {
    return this.mode === "title" || this.mode === "gameover" || this.mode === "clear";
  }

  startButtonLabel(): string {
    return this.mode === "title" ? "Start" : "Restart";
  }

  step(dt: number, input: InputState): void {
    this.elapsedSeconds += dt;

    if (this.mode === "title" || this.mode === "gameover" || this.mode === "clear") {
      if (input.consumePress("Space") || input.consumePress("Enter")) {
        this.startRun();
      }
      this.updateCamera();
      return;
    }

    if (this.mode === "paused") {
      if (input.consumePress("Enter")) {
        this.mode = "playing";
      }
      return;
    }

    if (input.consumePress("Enter")) {
      this.mode = "paused";
      return;
    }

    this.stepPlaying(dt, input);
    this.updateCamera();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const renderAssets = this.assets ?? undefined;
    drawBackground(
      ctx,
      this.camera.x,
      ctx.canvas.width,
      ctx.canvas.height,
      this.elapsedSeconds,
      renderAssets,
    );
    drawDecorations(ctx, this.camera, this.level.decorations, "back", renderAssets);
    drawSolids(ctx, this.camera, this.level.solids, renderAssets);
    drawCoins(ctx, this.camera, this.coins, renderAssets);
    drawEnemies(ctx, this.camera, this.enemies, renderAssets);
    if (this.player.invincibleTimer <= 0 || Math.floor(this.elapsedSeconds * 20) % 2 === 0) {
      drawPlayer(ctx, this.camera, this.player, renderAssets);
    }
    drawGoal(ctx, this.camera, this.level.goal, renderAssets);
    drawDecorations(ctx, this.camera, this.level.decorations, "front", renderAssets);
    drawHud(ctx, this.score, this.player.hp, this.collectedCoins, this.coins.length);

    if (this.mode === "title") {
      drawOverlay(
        ctx,
        "Side Scroll Trial",
        "ArrowLeft/ArrowRight move, Space jump",
        "Enter pauses, F toggles fullscreen",
      );
      return;
    }

    if (this.mode === "paused") {
      drawOverlay(ctx, "PAUSED", "Press Enter to resume");
      return;
    }

    if (this.mode === "gameover") {
      drawOverlay(ctx, "GAME OVER", "Press Space or Restart to try again");
      return;
    }

    if (this.mode === "clear") {
      drawOverlay(ctx, "CLEAR!", "Goal reached. Press Space or Restart");
    }
  }

  renderGameToText(): string {
    const payload = {
      coord_system: "origin=top-left,+x=right,+y=down,unit=px",
      mode: this.mode,
      camera: { x: round(this.camera.x), y: round(this.camera.y) },
      player: {
        x: round(this.player.x),
        y: round(this.player.y),
        vx: round(this.player.vx),
        vy: round(this.player.vy),
        w: this.player.w,
        h: this.player.h,
        hp: this.player.hp,
        grounded: this.player.grounded,
      },
      enemies: this.enemies.map((enemy) => ({
        x: round(enemy.x),
        y: round(enemy.y),
        w: enemy.w,
        h: enemy.h,
        alive: enemy.alive,
      })),
      coins: {
        remaining: this.coins.filter((coin) => !coin.collected).length,
        collected: this.collectedCoins,
      },
      score: this.score,
      level: {
        id: this.level.id,
        width: this.level.width,
        height: this.level.height,
      },
    };
    return JSON.stringify(payload);
  }

  private stepPlaying(dt: number, input: InputState): void {
    this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - dt);

    const moveIntent = (input.isDown("ArrowRight") ? 1 : 0) - (input.isDown("ArrowLeft") ? 1 : 0);
    const accel = this.player.grounded ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL;
    this.player.vx += moveIntent * accel * dt;
    if (moveIntent === 0) {
      this.player.vx *= this.player.grounded ? PLAYER_GROUND_FRICTION : PLAYER_AIR_FRICTION;
      if (Math.abs(this.player.vx) < 1) {
        this.player.vx = 0;
      }
    }
    this.player.vx = clamp(this.player.vx, -PLAYER_MAX_SPEED_X, PLAYER_MAX_SPEED_X);

    if (input.consumePress("Space") && this.player.grounded) {
      this.player.vy = -PLAYER_JUMP_SPEED;
      this.player.grounded = false;
    }

    const previousBottom = this.player.bottom();
    this.player.vy = Math.min(this.player.vy + WORLD_GRAVITY * dt, PLAYER_MAX_FALL_SPEED);
    const movedPlayer = moveBody(this.player.rect(), this.player.vx, this.player.vy, dt, this.level.solids);
    this.player.applyRect(movedPlayer.rect);
    this.player.vx = movedPlayer.vx;
    this.player.vy = movedPlayer.vy;
    this.player.grounded = movedPlayer.hitBottom;

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      enemy.vx = enemy.direction * ENEMY_SPEED;
      enemy.vy = Math.min(enemy.vy + WORLD_GRAVITY * dt, ENEMY_MAX_FALL_SPEED);
      const movedEnemy = moveBody(enemy.rect(), enemy.vx, enemy.vy, dt, this.level.solids);
      enemy.applyRect(movedEnemy.rect);
      enemy.vx = movedEnemy.vx;
      enemy.vy = movedEnemy.vy;
      enemy.grounded = movedEnemy.hitBottom;

      if (movedEnemy.hitLeft || movedEnemy.hitRight) {
        enemy.direction *= -1;
      }

      if (enemy.x <= enemy.patrolMin) {
        enemy.direction = 1;
      } else if (enemy.x + enemy.w >= enemy.patrolMax) {
        enemy.direction = -1;
      } else if (enemy.grounded && !this.enemyHasGroundAhead(enemy)) {
        enemy.direction *= -1;
      }
    }

    const playerRect = this.player.rect();
    for (const coin of this.coins) {
      if (coin.collected) {
        continue;
      }
      if (!circleIntersectsRect(coin.x, coin.y, coin.r, playerRect)) {
        continue;
      }
      coin.collected = true;
      this.score += SCORE_PER_COIN;
      this.collectedCoins += 1;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      if (!rectsOverlap(this.player.rect(), enemy.rect())) {
        continue;
      }
      const landedFromAbove = previousBottom <= enemy.y + 7 && this.player.vy >= 0;
      if (landedFromAbove) {
        enemy.alive = false;
        this.score += SCORE_PER_STOMP;
        this.player.vy = -PLAYER_STOMP_BOUNCE;
        this.player.grounded = false;
        continue;
      }
      this.damagePlayer(enemy);
      if (this.mode === "gameover") {
        return;
      }
    }

    if (this.player.y > this.level.deathY) {
      this.mode = "gameover";
      return;
    }

    if (rectsOverlap(this.player.rect(), this.level.goal)) {
      this.mode = "clear";
    }
  }

  private updateCamera(): void {
    this.camera.follow(this.player.centerX(), this.player.centerY(), this.level.width, this.level.height);
  }

  private damagePlayer(enemy: Enemy): void {
    if (this.player.invincibleTimer > 0) {
      return;
    }

    this.player.hp = Math.max(0, this.player.hp - 1);
    this.player.invincibleTimer = PLAYER_INVINCIBLE_SECONDS;
    const pushDirection = this.player.centerX() < enemy.centerX() ? -1 : 1;
    this.player.vx = pushDirection * PLAYER_KNOCKBACK_X;
    this.player.vy = -PLAYER_KNOCKBACK_Y;
    this.player.grounded = false;
    if (this.player.hp === 0) {
      this.mode = "gameover";
    }
  }

  private enemyHasGroundAhead(enemy: Enemy): boolean {
    const probeX = enemy.direction > 0 ? enemy.x + enemy.w + 3 : enemy.x - 3;
    const probeY = enemy.y + enemy.h + 4;
    return hasGroundAt(probeX, probeY, this.level.solids);
  }

  private resetRound(): void {
    this.player.reset(this.level.spawn);
    this.enemies = this.level.enemies.map((spawn) => new Enemy(spawn));
    this.coins = this.level.coins.map((spawn) => new Coin(spawn));
    this.score = 0;
    this.collectedCoins = 0;
    this.elapsedSeconds = 0;
    this.updateCamera();
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
