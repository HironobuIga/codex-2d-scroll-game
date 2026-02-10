export type GameMode = "title" | "playing" | "paused" | "gameover" | "clear";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Aabb = Rect;
