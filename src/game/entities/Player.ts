import {
  PLAYER_HEIGHT,
  PLAYER_MAX_HP,
  PLAYER_WIDTH,
} from "../constants";
import type { Rect, Vec2 } from "../types";

export class Player {
  x = 0;
  y = 0;
  w = PLAYER_WIDTH;
  h = PLAYER_HEIGHT;
  facing: -1 | 1 = 1;
  vx = 0;
  vy = 0;
  hp = PLAYER_MAX_HP;
  grounded = false;
  invincibleTimer = 0;
  airJumpsRemaining = 1;
  dashTimer = 0;
  dashCooldownTimer = 0;
  pulseTimer = 0;
  pulseCooldownTimer = 0;

  constructor(spawn: Vec2) {
    this.reset(spawn);
  }

  reset(spawn: Vec2): void {
    this.x = spawn.x;
    this.y = spawn.y;
    this.facing = 1;
    this.vx = 0;
    this.vy = 0;
    this.hp = PLAYER_MAX_HP;
    this.grounded = false;
    this.invincibleTimer = 0;
    this.airJumpsRemaining = 1;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.pulseTimer = 0;
    this.pulseCooldownTimer = 0;
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

  centerY(): number {
    return this.y + this.h * 0.5;
  }

  bottom(): number {
    return this.y + this.h;
  }
}
