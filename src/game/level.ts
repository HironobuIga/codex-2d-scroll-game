import type { Rect, Vec2 } from "./types";

export interface CoinSpawn {
  x: number;
  y: number;
  r: number;
}

export interface EnemySpawn {
  x: number;
  y: number;
  patrolMin?: number;
  patrolMax?: number;
  direction?: -1 | 1;
}

export type DecorationType = "tree" | "crystal" | "ruin";
export type DecorationLayer = "back" | "front";

export interface DecorationSpawn {
  x: number;
  y: number;
  w: number;
  h: number;
  type: DecorationType;
  layer: DecorationLayer;
  parallax: number;
}

export interface LevelData {
  id: string;
  width: number;
  height: number;
  deathY: number;
  spawn: Vec2;
  solids: Rect[];
  coins: CoinSpawn[];
  enemies: EnemySpawn[];
  decorations: DecorationSpawn[];
  goal: Rect;
}

export function createLevel1(): LevelData {
  const solids: Rect[] = [
    { x: 0, y: 500, w: 620, h: 40 },
    { x: 720, y: 500, w: 760, h: 40 },
    { x: 1600, y: 500, w: 860, h: 40 },
    { x: 2580, y: 500, w: 850, h: 40 },
    { x: 3550, y: 500, w: 546, h: 40 },
    { x: 320, y: 430, w: 220, h: 18 },
    { x: 610, y: 395, w: 130, h: 18 },
    { x: 760, y: 360, w: 200, h: 18 },
    { x: 1040, y: 300, w: 180, h: 18 },
    { x: 1320, y: 360, w: 220, h: 18 },
    { x: 1750, y: 320, w: 220, h: 18 },
    { x: 2070, y: 260, w: 160, h: 18 },
    { x: 2300, y: 330, w: 220, h: 18 },
    { x: 2720, y: 290, w: 200, h: 18 },
    { x: 3020, y: 350, w: 220, h: 18 },
    { x: 3340, y: 280, w: 180, h: 18 },
    { x: 3680, y: 300, w: 160, h: 18 },
  ];

  const coins: CoinSpawn[] = [
    { x: 380, y: 398, r: 10 },
    { x: 480, y: 398, r: 10 },
    { x: 650, y: 365, r: 10 },
    { x: 820, y: 332, r: 10 },
    { x: 910, y: 326, r: 10 },
    { x: 1070, y: 270, r: 10 },
    { x: 1180, y: 270, r: 10 },
    { x: 1360, y: 332, r: 10 },
    { x: 1490, y: 332, r: 10 },
    { x: 1800, y: 290, r: 10 },
    { x: 1910, y: 290, r: 10 },
    { x: 2100, y: 230, r: 10 },
    { x: 2200, y: 230, r: 10 },
    { x: 2760, y: 260, r: 10 },
    { x: 2860, y: 260, r: 10 },
    { x: 3390, y: 250, r: 10 },
    { x: 3480, y: 250, r: 10 },
  ];

  const enemies: EnemySpawn[] = [
    { x: 910, y: 470, patrolMin: 740, patrolMax: 1440, direction: 1 },
    { x: 1820, y: 290, patrolMin: 1760, patrolMax: 1920, direction: -1 },
    { x: 2360, y: 300, patrolMin: 2310, patrolMax: 2460, direction: 1 },
    { x: 3100, y: 470, patrolMin: 2620, patrolMax: 3380, direction: -1 },
    { x: 3710, y: 270, patrolMin: 3680, patrolMax: 3820, direction: 1 },
  ];

  const decorations: DecorationSpawn[] = [
    { x: 80, y: 325, w: 140, h: 200, type: "tree", layer: "back", parallax: 0.86 },
    { x: 540, y: 350, w: 110, h: 164, type: "ruin", layer: "back", parallax: 0.9 },
    { x: 900, y: 318, w: 140, h: 200, type: "tree", layer: "back", parallax: 0.88 },
    { x: 1160, y: 372, w: 80, h: 120, type: "crystal", layer: "front", parallax: 1 },
    { x: 1520, y: 332, w: 140, h: 200, type: "tree", layer: "back", parallax: 0.86 },
    { x: 1710, y: 365, w: 80, h: 120, type: "crystal", layer: "front", parallax: 1 },
    { x: 1990, y: 336, w: 110, h: 164, type: "ruin", layer: "back", parallax: 0.9 },
    { x: 2500, y: 320, w: 140, h: 200, type: "tree", layer: "back", parallax: 0.88 },
    { x: 2860, y: 360, w: 80, h: 120, type: "crystal", layer: "front", parallax: 1 },
    { x: 3240, y: 330, w: 110, h: 164, type: "ruin", layer: "back", parallax: 0.9 },
    { x: 3560, y: 318, w: 140, h: 200, type: "tree", layer: "back", parallax: 0.88 },
    { x: 3840, y: 360, w: 80, h: 120, type: "crystal", layer: "front", parallax: 1 },
  ];

  return {
    id: "level1",
    width: 4096,
    height: 540,
    deathY: 700,
    spawn: { x: 80, y: 440 },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 3980, y: 430, w: 40, h: 70 },
  };
}
