import { ENEMY_HEIGHT, ENEMY_WIDTH } from "../constants";
import type { EnemySpawn } from "../level";
import type { Rect } from "../types";

export type EnemyTier = "scout" | "runner" | "hopper" | "guard" | "ace";

interface EnemyTierProfile {
  widthScale: number;
  heightScale: number;
  speedScale: number;
  maxHp: number;
  contactDamage: number;
  jumpInterval: number;
  jumpSpeed: number;
  dashSpeedScale: number;
  dashDuration: number;
  dashCooldown: number;
  dashRange: number;
  shotCooldown: number;
}

const ENEMY_TIER_PROFILES: Record<EnemyTier, EnemyTierProfile> = {
  scout: {
    widthScale: 0.92,
    heightScale: 0.95,
    speedScale: 1,
    maxHp: 1,
    contactDamage: 1,
    jumpInterval: 0,
    jumpSpeed: 0,
    dashSpeedScale: 1,
    dashDuration: 0,
    dashCooldown: 0,
    dashRange: 0,
    shotCooldown: 0,
  },
  runner: {
    widthScale: 0.96,
    heightScale: 0.88,
    speedScale: 1.32,
    maxHp: 1,
    contactDamage: 1,
    jumpInterval: 0,
    jumpSpeed: 0,
    dashSpeedScale: 1.55,
    dashDuration: 0.42,
    dashCooldown: 1.8,
    dashRange: 240,
    shotCooldown: 0,
  },
  hopper: {
    widthScale: 0.88,
    heightScale: 1.02,
    speedScale: 1.08,
    maxHp: 1,
    contactDamage: 1,
    jumpInterval: 1.4,
    jumpSpeed: 560,
    dashSpeedScale: 1,
    dashDuration: 0,
    dashCooldown: 0,
    dashRange: 0,
    shotCooldown: 0,
  },
  guard: {
    widthScale: 1.22,
    heightScale: 1.32,
    speedScale: 0.94,
    maxHp: 2,
    contactDamage: 2,
    jumpInterval: 0,
    jumpSpeed: 0,
    dashSpeedScale: 1.22,
    dashDuration: 0.28,
    dashCooldown: 2.1,
    dashRange: 180,
    shotCooldown: 0,
  },
  ace: {
    widthScale: 1.38,
    heightScale: 1.56,
    speedScale: 1.24,
    maxHp: 4,
    contactDamage: 3,
    jumpInterval: 1.16,
    jumpSpeed: 620,
    dashSpeedScale: 1.75,
    dashDuration: 0.46,
    dashCooldown: 1.45,
    dashRange: 320,
    shotCooldown: 1.25,
  },
};

export class Enemy {
  x: number;
  y: number;
  w = ENEMY_WIDTH;
  h = ENEMY_HEIGHT;
  vx = 0;
  vy = 0;
  grounded = false;
  alive = true;
  direction: -1 | 1;
  patrolMin: number;
  patrolMax: number;
  tier: EnemyTier;
  hp: number;
  maxHp: number;
  contactDamage: number;
  private readonly speedScale: number;
  private readonly jumpInterval: number;
  private readonly jumpSpeed: number;
  private readonly dashSpeedScale: number;
  private readonly dashDuration: number;
  private readonly dashCooldown: number;
  private readonly dashRange: number;
  private readonly shotCooldown: number;
  private jumpTimer: number;
  private dashTimer = 0;
  private dashCooldownTimer: number;
  private shotCooldownTimer: number;
  private staggerTimer = 0;

  constructor(spawn: EnemySpawn, stageNumber: number, enemyIndex: number) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.direction = spawn.direction ?? 1;
    this.patrolMin = spawn.patrolMin ?? spawn.x - 180;
    this.patrolMax = spawn.patrolMax ?? spawn.x + 180;
    this.tier = spawn.tier ?? pickEnemyTier(stageNumber, enemyIndex);
    const profile = ENEMY_TIER_PROFILES[this.tier];
    this.w = Math.round(ENEMY_WIDTH * profile.widthScale);
    this.h = Math.round(ENEMY_HEIGHT * profile.heightScale);
    this.maxHp = profile.maxHp;
    this.hp = profile.maxHp;
    this.contactDamage = profile.contactDamage;
    this.speedScale = profile.speedScale;
    this.jumpInterval = profile.jumpInterval;
    this.jumpSpeed = profile.jumpSpeed;
    this.dashSpeedScale = profile.dashSpeedScale;
    this.dashDuration = profile.dashDuration;
    this.dashCooldown = profile.dashCooldown;
    this.dashRange = profile.dashRange;
    this.shotCooldown = profile.shotCooldown;
    this.jumpTimer = this.jumpInterval > 0 ? this.jumpInterval * (0.45 + (enemyIndex % 4) * 0.16) : 0;
    const seed = spawnTimingSeed(spawn.x, spawn.y, enemyIndex);
    this.dashCooldownTimer = this.dashCooldown > 0 ? this.dashCooldown * (0.12 + seed * 0.58) : 0;
    this.shotCooldownTimer = this.shotCooldown > 0 ? this.shotCooldown * (0.2 + seed * 0.65) : 0;
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  applyRect(rect: Rect): void {
    this.x = rect.x;
    this.y = rect.y;
  }

  centerX(): number {
    return this.x + this.w * 0.5;
  }

  updateBehavior(dt: number, playerCenterX: number): number {
    if (this.shotCooldownTimer > 0) {
      this.shotCooldownTimer = Math.max(0, this.shotCooldownTimer - dt);
    }
    if (this.staggerTimer > 0) {
      this.staggerTimer = Math.max(0, this.staggerTimer - dt);
      this.vx = 0;
      return 0;
    }

    if (this.jumpInterval > 0) {
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0 && this.grounded) {
        this.vy = -this.jumpSpeed;
        this.grounded = false;
        this.jumpTimer = this.jumpInterval;
      }
    }

    let burstScale = 1;
    if (this.dashSpeedScale > 1) {
      if (this.dashTimer > 0) {
        this.dashTimer = Math.max(0, this.dashTimer - dt);
        burstScale = this.dashSpeedScale;
      } else {
        if (this.dashCooldownTimer > 0) {
          this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
        }
        if (this.dashCooldownTimer <= 0 && Math.abs(playerCenterX - this.centerX()) <= this.dashRange) {
          this.direction = playerCenterX < this.centerX() ? -1 : 1;
          this.dashTimer = this.dashDuration;
          this.dashCooldownTimer = this.dashCooldown;
          burstScale = this.dashSpeedScale;
        }
      }
    }

    return this.speedScale * burstScale;
  }

  applyStompDamage(): boolean {
    this.hp = Math.max(0, this.hp - 1);
    if (this.hp === 0) {
      this.alive = false;
      return true;
    }
    this.staggerTimer = 0.28;
    this.direction *= -1;
    return false;
  }

  isDashing(): boolean {
    return this.dashTimer > 0;
  }

  canFireProjectile(): boolean {
    return this.shotCooldown <= 0 || this.shotCooldownTimer <= 0;
  }

  markProjectileFired(): void {
    if (this.shotCooldown > 0) {
      this.shotCooldownTimer = this.shotCooldown;
    }
  }
}

function pickEnemyTier(stageNumber: number, enemyIndex: number): EnemyTier {
  if (stageNumber <= 1) {
    return "scout";
  }
  if (stageNumber === 2) {
    return enemyIndex % 3 === 0 ? "runner" : "scout";
  }
  if (stageNumber === 3) {
    return enemyIndex % 2 === 0 ? "hopper" : "runner";
  }
  if (stageNumber === 4) {
    if (enemyIndex % 3 === 0) {
      return "guard";
    }
    return enemyIndex % 2 === 0 ? "hopper" : "runner";
  }
  if (enemyIndex % 4 === 0) {
    return "ace";
  }
  if (enemyIndex % 2 === 0) {
    return "guard";
  }
  return "hopper";
}

function spawnTimingSeed(x: number, y: number, enemyIndex: number): number {
  const xSeed = Math.floor(x) * 73856093;
  const ySeed = Math.floor(y) * 19349663;
  const iSeed = enemyIndex * 83492791;
  const hash = Math.abs((xSeed ^ ySeed ^ iSeed) % 1000);
  return hash / 1000;
}
