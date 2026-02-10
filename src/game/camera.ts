import { clamp } from "./physics";

export class Camera {
  x = 0;
  y = 0;

  constructor(
    public readonly viewportWidth: number,
    public readonly viewportHeight: number,
  ) {}

  follow(targetX: number, targetY: number, worldWidth: number, worldHeight: number): void {
    const maxX = Math.max(0, worldWidth - this.viewportWidth);
    const maxY = Math.max(0, worldHeight - this.viewportHeight);
    this.x = clamp(targetX - this.viewportWidth * 0.5, 0, maxX);
    this.y = clamp(targetY - this.viewportHeight * 0.5, 0, maxY);
  }
}
