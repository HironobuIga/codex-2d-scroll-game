import {
  ENEMY_MAX_FALL_SPEED,
  ENEMY_SPEED,
  PLAYER_AIR_JUMPS,
  PLAYER_AIR_ACCEL,
  PLAYER_AIR_FRICTION,
  PLAYER_AIR_JUMP_SPEED,
  PLAYER_DASH_COOLDOWN,
  PLAYER_DASH_DURATION,
  PLAYER_DASH_SPEED,
  PLAYER_GROUND_ACCEL,
  PLAYER_GROUND_FRICTION,
  PLAYER_INVINCIBLE_SECONDS,
  PLAYER_JUMP_SPEED,
  PLAYER_KNOCKBACK_X,
  PLAYER_KNOCKBACK_Y,
  PLAYER_MAX_FALL_SPEED,
  PLAYER_MAX_SPEED_X,
  PLAYER_PULSE_COOLDOWN,
  PLAYER_PULSE_DURATION,
  PLAYER_PULSE_RADIUS,
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
import { createStageLevels, type LevelData } from "./level";
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
  drawEnemyShots,
  drawEnemies,
  drawGoal,
  drawHud,
  drawOverlay,
  drawPlayer,
  drawSolids,
} from "./render";
import type { GameMode } from "./types";

interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  ttl: number;
}

type GameOverReason = "fall" | "defeat" | null;

export class Game {
  mode: GameMode = "title";
  private readonly levels: LevelData[];
  private levelIndex = 0;
  private level: LevelData;
  private readonly camera: Camera;
  private readonly player: Player;
  private assets: GameAssets | null;
  private enemies: Enemy[] = [];
  private enemyShots: EnemyShot[] = [];
  private coins: Coin[] = [];
  private score = 0;
  private scoreAtStageStart = 0;
  private collectedCoins = 0;
  private elapsedSeconds = 0;
  private gameOverReason: GameOverReason = null;

  constructor(assets?: GameAssets) {
    this.levels = createStageLevels();
    this.level = this.levels[this.levelIndex];
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
    this.score = 0;
    this.loadStage(0);
    this.mode = "playing";
  }

  activatePrimaryAction(): void {
    if (this.mode === "title" || this.mode === "gameover") {
      this.startRun();
      return;
    }
    if (this.mode === "clear") {
      if (this.isFinalStage()) {
        this.startRun();
      } else {
        this.advanceStage();
      }
    }
  }

  activateRetryStageAction(): void {
    if (this.mode !== "gameover" || !this.canRetryCurrentStage()) {
      return;
    }
    this.retryCurrentStage();
  }

  shouldShowStartButton(): boolean {
    return this.mode === "title" || this.mode === "gameover" || this.mode === "clear";
  }

  shouldShowRetryStageButton(): boolean {
    return this.mode === "gameover" && this.canRetryCurrentStage();
  }

  startButtonLabel(): string {
    if (this.mode === "title") {
      return "Start Mission";
    }
    if (this.mode === "clear") {
      return this.isFinalStage() ? "Play Again" : "Next Stage";
    }
    return "Restart Stage 1";
  }

  retryStageButtonLabel(): string {
    return `Retry Stage ${this.level.stageNumber}`;
  }

  step(dt: number, input: InputState): void {
    this.elapsedSeconds += dt;

    if (this.mode === "title" || this.mode === "gameover" || this.mode === "clear") {
      if (this.mode === "gameover" && this.canRetryCurrentStage() && input.consumePress("KeyR")) {
        this.retryCurrentStage();
        this.updateCamera();
        return;
      }
      if (input.consumePress("Space") || input.consumePress("Enter")) {
        this.activatePrimaryAction();
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
      this.level.backgroundStyle,
      this.level.theme,
    );
    drawDecorations(ctx, this.camera, this.level.decorations, "back", renderAssets);
    drawSolids(ctx, this.camera, this.level.solids, renderAssets, this.level.theme);
    drawCoins(ctx, this.camera, this.coins, renderAssets);
    drawEnemies(ctx, this.camera, this.enemies, renderAssets);
    drawEnemyShots(ctx, this.camera, this.enemyShots);
    if (this.player.invincibleTimer <= 0 || Math.floor(this.elapsedSeconds * 20) % 2 === 0) {
      drawPlayer(ctx, this.camera, this.player, renderAssets);
    }
    drawGoal(ctx, this.camera, this.level.goal, renderAssets);
    drawDecorations(ctx, this.camera, this.level.decorations, "front", renderAssets);
    drawHud(
      ctx,
      this.score,
      this.player.hp,
      this.collectedCoins,
      this.coins.length,
      this.level.stageNumber,
      this.levels.length,
      this.level.title,
      this.level.tagline,
      this.level.theme,
    );

    if (this.mode === "title") {
      drawOverlay(
        ctx,
        "COSMIC ALIEN ADVENTURE",
        "Arrow move, Space jump x2, A dash, B pulse",
        "Stomp or burst through cute aliens. Enter pause / F fullscreen",
      );
      return;
    }

    if (this.mode === "paused") {
      drawOverlay(ctx, "PAUSED", "Press Enter to resume");
      return;
    }

    if (this.mode === "gameover") {
      if (this.canRetryCurrentStage()) {
        drawOverlay(
          ctx,
          "GAME OVER",
          `You fell in Stage ${this.level.stageNumber}. Press R or Retry Stage`,
          "Press Space or Restart Stage 1 to start over",
        );
      } else {
        drawOverlay(ctx, "GAME OVER", "Press Space or Restart Stage 1 to try again");
      }
      return;
    }

    if (this.mode === "clear") {
      if (this.isFinalStage()) {
        drawOverlay(ctx, "ALL STAGES CLEAR!", "You crossed every galaxy lane. Press Space to restart");
      } else {
        drawOverlay(
          ctx,
          `STAGE ${this.level.stageNumber} CLEAR`,
          `Next: Stage ${this.level.stageNumber + 1} (${this.levels[this.levelIndex + 1].title})`,
          "Press Space/Enter or click Next Stage",
        );
      }
    }
  }

  renderGameToText(): string {
    const payload = {
      coord_system: "origin=top-left,+x=right,+y=down,unit=px",
      mode: this.mode,
      gameOverReason: this.gameOverReason,
      camera: { x: round(this.camera.x), y: round(this.camera.y) },
      player: {
        x: round(this.player.x),
        y: round(this.player.y),
        vx: round(this.player.vx),
        vy: round(this.player.vy),
        facing: this.player.facing,
        w: this.player.w,
        h: this.player.h,
        hp: this.player.hp,
        grounded: this.player.grounded,
        airJumpsRemaining: this.player.airJumpsRemaining,
        dashTimer: round(this.player.dashTimer),
        dashCooldown: round(this.player.dashCooldownTimer),
        pulseTimer: round(this.player.pulseTimer),
        pulseCooldown: round(this.player.pulseCooldownTimer),
      },
      enemies: this.enemies.map((enemy) => ({
        x: round(enemy.x),
        y: round(enemy.y),
        w: enemy.w,
        h: enemy.h,
        alive: enemy.alive,
        tier: enemy.tier,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        damage: enemy.contactDamage,
        dashing: enemy.isDashing(),
      })),
      enemyShots: this.enemyShots.map((shot) => ({
        x: round(shot.x),
        y: round(shot.y),
        vx: round(shot.vx),
        vy: round(shot.vy),
        r: shot.r,
      })),
      coins: {
        remaining: this.coins.filter((coin) => !coin.collected).length,
        collected: this.collectedCoins,
      },
      score: this.score,
      level: {
        id: this.level.id,
        stage: this.level.stageNumber,
        title: this.level.title,
        tagline: this.level.tagline,
        totalStages: this.levels.length,
        backgroundStyle: this.level.backgroundStyle,
        physics: this.level.physics,
        width: this.level.width,
        height: this.level.height,
      },
    };
    return JSON.stringify(payload);
  }

  private stepPlaying(dt: number, input: InputState): void {
    const stagePhysics = this.level.physics;
    this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - dt);
    this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    this.player.dashCooldownTimer = Math.max(0, this.player.dashCooldownTimer - dt);
    this.player.pulseTimer = Math.max(0, this.player.pulseTimer - dt);
    this.player.pulseCooldownTimer = Math.max(0, this.player.pulseCooldownTimer - dt);

    const moveIntent = (input.isDown("ArrowRight") ? 1 : 0) - (input.isDown("ArrowLeft") ? 1 : 0);
    if (moveIntent !== 0) {
      this.player.facing = moveIntent > 0 ? 1 : -1;
    }
    if (input.consumePress("KeyA") && this.player.dashCooldownTimer <= 0) {
      this.activateDash(moveIntent);
    }

    const accel = this.player.grounded ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL;
    if (this.player.dashTimer > 0) {
      this.player.vx += stagePhysics.windX * dt * 0.35;
      const minDashSpeed = PLAYER_DASH_SPEED * 0.82;
      if (Math.abs(this.player.vx) < minDashSpeed) {
        this.player.vx = this.player.facing * minDashSpeed;
      }
      this.player.vx = clamp(this.player.vx, -PLAYER_DASH_SPEED, PLAYER_DASH_SPEED);
    } else {
      this.player.vx += moveIntent * accel * dt;
      this.player.vx += stagePhysics.windX * dt;
      if (moveIntent === 0) {
        this.player.vx *= this.player.grounded ? PLAYER_GROUND_FRICTION : PLAYER_AIR_FRICTION;
        if (Math.abs(this.player.vx) < 1) {
          this.player.vx = 0;
        }
      }
      this.player.vx = clamp(this.player.vx, -PLAYER_MAX_SPEED_X, PLAYER_MAX_SPEED_X);
    }

    if (input.consumePress("Space")) {
      if (this.player.grounded) {
        this.player.vy = -PLAYER_JUMP_SPEED;
        this.player.grounded = false;
      } else if (this.player.airJumpsRemaining > 0) {
        this.player.airJumpsRemaining -= 1;
        this.player.vy = -PLAYER_AIR_JUMP_SPEED;
        this.player.vx += this.player.facing * 80;
        this.player.vx = clamp(this.player.vx, -PLAYER_MAX_SPEED_X, PLAYER_MAX_SPEED_X);
      }
    }
    const pulseTriggered = input.consumePress("KeyB") && this.player.pulseCooldownTimer <= 0;
    if (pulseTriggered) {
      this.player.pulseTimer = PLAYER_PULSE_DURATION;
      this.player.pulseCooldownTimer = PLAYER_PULSE_COOLDOWN;
    }

    const previousBottom = this.player.bottom();
    this.player.vy = Math.min(
      this.player.vy + WORLD_GRAVITY * stagePhysics.gravityScale * dt,
      PLAYER_MAX_FALL_SPEED * Math.max(1, stagePhysics.gravityScale),
    );
    const movedPlayer = moveBody(this.player.rect(), this.player.vx, this.player.vy, dt, this.level.solids);
    this.player.applyRect(movedPlayer.rect);
    this.player.vx = movedPlayer.vx;
    this.player.vy = movedPlayer.vy;
    this.player.grounded = movedPlayer.hitBottom;
    if (this.player.grounded) {
      this.player.airJumpsRemaining = PLAYER_AIR_JUMPS;
    }
    if (Math.abs(this.player.vx) > 12 && this.player.dashTimer <= 0) {
      this.player.facing = this.player.vx > 0 ? 1 : -1;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      const behaviorSpeedScale = enemy.updateBehavior(dt, this.player.centerX());
      enemy.vx = enemy.direction * ENEMY_SPEED * stagePhysics.enemySpeedScale * behaviorSpeedScale;
      enemy.vy = Math.min(
        enemy.vy + WORLD_GRAVITY * stagePhysics.gravityScale * dt,
        ENEMY_MAX_FALL_SPEED * Math.max(1, stagePhysics.gravityScale),
      );
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

      if (enemy.tier === "ace") {
        this.maybeFireEnemyShot(enemy);
      }
    }

    if (pulseTriggered) {
      this.triggerPulseAttack();
    }

    this.updateEnemyShots(dt);

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
        const defeated = enemy.applyStompDamage();
        if (defeated) {
          this.score += SCORE_PER_STOMP + (enemy.maxHp - 1) * 25;
        } else {
          this.score += Math.floor(SCORE_PER_STOMP * 0.5);
        }
        this.player.vy = -PLAYER_STOMP_BOUNCE * (defeated ? 1 : 0.82);
        this.player.grounded = false;
        continue;
      }
      if (this.player.dashTimer > 0) {
        const defeated = enemy.applyStompDamage();
        if (defeated) {
          this.score += SCORE_PER_STOMP + (enemy.maxHp - 1) * 25;
        } else {
          this.score += Math.floor(SCORE_PER_STOMP * 0.35);
        }
        this.player.vy = Math.min(this.player.vy, -160);
        this.player.grounded = false;
        continue;
      }
      this.damagePlayer(enemy);
      if (this.mode === "gameover") {
        return;
      }
    }

    if (this.player.y > this.level.deathY) {
      this.setGameOver("fall");
      return;
    }

    if (rectsOverlap(this.player.rect(), this.level.goal)) {
      this.mode = "clear";
    }
  }

  private updateCamera(): void {
    this.camera.follow(this.player.centerX(), this.player.centerY(), this.level.width, this.level.height);
  }

  private activateDash(moveIntent: number): void {
    const dashDirection: -1 | 1 = moveIntent !== 0 ? (moveIntent > 0 ? 1 : -1) : this.player.facing;
    this.player.facing = dashDirection;
    this.player.vx = dashDirection * PLAYER_DASH_SPEED;
    this.player.vy *= 0.2;
    this.player.dashTimer = PLAYER_DASH_DURATION;
    this.player.dashCooldownTimer = PLAYER_DASH_COOLDOWN;
  }

  private triggerPulseAttack(): void {
    const pulseX = this.player.centerX();
    const pulseY = this.player.centerY();
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const distance = Math.hypot(enemy.centerX() - pulseX, enemy.y + enemy.h * 0.55 - pulseY);
      if (distance > PLAYER_PULSE_RADIUS) {
        continue;
      }
      const defeated = enemy.applyStompDamage();
      if (defeated) {
        this.score += SCORE_PER_STOMP + (enemy.maxHp - 1) * 25;
      } else {
        this.score += Math.floor(SCORE_PER_STOMP * 0.45);
      }
      enemy.direction = pulseX < enemy.centerX() ? 1 : -1;
    }
    this.enemyShots = this.enemyShots.filter((shot) => Math.hypot(shot.x - pulseX, shot.y - pulseY) > PLAYER_PULSE_RADIUS);
    this.player.vy = Math.min(this.player.vy, -90);
  }

  private damagePlayer(enemy: Enemy): void {
    if (this.player.dashTimer > 0) {
      return;
    }
    if (this.player.invincibleTimer > 0) {
      return;
    }

    this.player.hp = Math.max(0, this.player.hp - enemy.contactDamage);
    this.player.invincibleTimer = PLAYER_INVINCIBLE_SECONDS;
    const pushDirection = this.player.centerX() < enemy.centerX() ? -1 : 1;
    const knockbackScale = 1 + (enemy.contactDamage - 1) * 0.45;
    this.player.vx = pushDirection * PLAYER_KNOCKBACK_X * knockbackScale;
    this.player.vy = -PLAYER_KNOCKBACK_Y * knockbackScale;
    this.player.facing = this.player.vx > 0 ? 1 : -1;
    this.player.grounded = false;
    if (this.player.hp === 0) {
      this.setGameOver("defeat");
    }
  }

  private enemyHasGroundAhead(enemy: Enemy): boolean {
    const probeX = enemy.direction > 0 ? enemy.x + enemy.w + 3 : enemy.x - 3;
    const probeY = enemy.y + enemy.h + 4;
    return hasGroundAt(probeX, probeY, this.level.solids);
  }

  private maybeFireEnemyShot(enemy: Enemy): void {
    const muzzleX = enemy.centerX() + enemy.direction * enemy.w * 0.28;
    const muzzleY = enemy.y + enemy.h * 0.46;
    const toPlayerX = this.player.centerX() - muzzleX;
    const toPlayerY = this.player.centerY() - muzzleY;
    const distance = Math.hypot(toPlayerX, toPlayerY);
    if (distance < 180 || distance > 480) {
      return;
    }
    if (Math.abs(toPlayerY) > 170) {
      return;
    }

    const hasRecentShot = this.enemyShots.some(
      (shot) => Math.abs(shot.x - muzzleX) < 72 && Math.abs(shot.y - muzzleY) < 52 && shot.ttl > 2.15,
    );
    if (hasRecentShot) {
      return;
    }

    const speed = 340;
    const dx = toPlayerX / distance;
    const dy = toPlayerY / distance;
    this.enemyShots.push({
      x: muzzleX,
      y: muzzleY,
      vx: dx * speed,
      vy: dy * speed * 0.74,
      r: 8,
      ttl: 2.7,
    });
  }

  private updateEnemyShots(dt: number): void {
    const nextShots: EnemyShot[] = [];
    for (const shot of this.enemyShots) {
      const nx = shot.x + shot.vx * dt;
      const ny = shot.y + shot.vy * dt;
      const ttl = shot.ttl - dt;
      if (ttl <= 0) {
        continue;
      }
      if (nx < -80 || nx > this.level.width + 80 || ny < -40 || ny > this.level.deathY + 40) {
        continue;
      }
      if (this.level.solids.some((solid) => circleIntersectsRect(nx, ny, shot.r, solid))) {
        continue;
      }
      if (circleIntersectsRect(nx, ny, shot.r, this.player.rect())) {
        if (this.player.dashTimer > 0) {
          continue;
        }
        const ace = this.enemies.find((enemy) => enemy.tier === "ace" && enemy.alive) ?? null;
        if (ace) {
          this.damagePlayer(ace);
        } else if (this.player.invincibleTimer <= 0) {
          this.player.hp = Math.max(0, this.player.hp - 1);
          this.player.invincibleTimer = PLAYER_INVINCIBLE_SECONDS;
          if (this.player.hp === 0) {
            this.setGameOver("defeat");
          }
        }
        continue;
      }
      nextShots.push({ ...shot, x: nx, y: ny, ttl });
    }
    this.enemyShots = nextShots;
  }

  private resetRound(): void {
    this.player.reset(this.level.spawn);
    this.enemies = this.level.enemies.map(
      (spawn, index) => new Enemy(spawn, this.level.stageNumber, index),
    );
    this.enemyShots = [];
    this.coins = this.level.coins.map((spawn) => new Coin(spawn));
    this.collectedCoins = 0;
    this.elapsedSeconds = 0;
    this.updateCamera();
  }

  private advanceStage(): void {
    if (this.levelIndex >= this.levels.length - 1) {
      this.startRun();
      return;
    }
    this.loadStage(this.levelIndex + 1);
    this.mode = "playing";
  }

  private loadStage(index: number): void {
    const clampedIndex = clamp(index, 0, this.levels.length - 1);
    this.levelIndex = clampedIndex;
    this.level = this.levels[this.levelIndex];
    this.scoreAtStageStart = this.score;
    this.gameOverReason = null;
    this.resetRound();
  }

  private isFinalStage(): boolean {
    return this.levelIndex >= this.levels.length - 1;
  }

  private canRetryCurrentStage(): boolean {
    return this.gameOverReason === "fall";
  }

  private retryCurrentStage(): void {
    this.score = this.scoreAtStageStart;
    this.gameOverReason = null;
    this.resetRound();
    this.mode = "playing";
  }

  private setGameOver(reason: Exclude<GameOverReason, null>): void {
    this.gameOverReason = reason;
    this.mode = "gameover";
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
