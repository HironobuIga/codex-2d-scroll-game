import { ENEMY_HEIGHT, ENEMY_WIDTH } from "../constants";
import type { EnemySpawn } from "../level";
import type { Rect } from "../types";

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

  constructor(spawn: EnemySpawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.direction = spawn.direction ?? 1;
    this.patrolMin = spawn.patrolMin ?? spawn.x - 180;
    this.patrolMax = spawn.patrolMax ?? spawn.x + 180;
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
}
