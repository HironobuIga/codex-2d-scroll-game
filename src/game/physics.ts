import type { Rect } from "./types";

export interface BodyMoveResult {
  rect: Rect;
  vx: number;
  vy: number;
  hitLeft: boolean;
  hitRight: boolean;
  hitTop: boolean;
  hitBottom: boolean;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleIntersectsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function hasGroundAt(x: number, y: number, solids: Rect[]): boolean {
  return solids.some((solid) => x >= solid.x && x <= solid.x + solid.w && y >= solid.y && y <= solid.y + solid.h);
}

export function moveBody(rect: Rect, vx: number, vy: number, dt: number, solids: Rect[]): BodyMoveResult {
  const moved: Rect = { ...rect };
  let nextVx = vx;
  let nextVy = vy;

  moved.x += nextVx * dt;
  let hitLeft = false;
  let hitRight = false;
  for (const solid of solids) {
    if (!rectsOverlap(moved, solid)) {
      continue;
    }
    if (nextVx > 0) {
      moved.x = solid.x - moved.w;
      hitRight = true;
    } else if (nextVx < 0) {
      moved.x = solid.x + solid.w;
      hitLeft = true;
    }
    nextVx = 0;
  }

  moved.y += nextVy * dt;
  let hitTop = false;
  let hitBottom = false;
  for (const solid of solids) {
    if (!rectsOverlap(moved, solid)) {
      continue;
    }
    if (nextVy > 0) {
      moved.y = solid.y - moved.h;
      hitBottom = true;
    } else if (nextVy < 0) {
      moved.y = solid.y + solid.h;
      hitTop = true;
    }
    nextVy = 0;
  }

  return {
    rect: moved,
    vx: nextVx,
    vy: nextVy,
    hitLeft,
    hitRight,
    hitTop,
    hitBottom,
  };
}
