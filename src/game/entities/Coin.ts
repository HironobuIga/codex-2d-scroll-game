import type { CoinSpawn } from "../level";

export class Coin {
  x: number;
  y: number;
  r: number;
  collected = false;

  constructor(spawn: CoinSpawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.r = spawn.r;
  }
}
