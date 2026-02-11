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
  tier?: "scout" | "runner" | "hopper" | "guard" | "ace";
}

export type DecorationType = "planet" | "ufo" | "satellite";
export type DecorationLayer = "back" | "front";
export type StageBackgroundStyle =
  | "nebula"
  | "cometStorm"
  | "orbitalGrid"
  | "lunarMist"
  | "redAlert";

export interface DecorationSpawn {
  x: number;
  y: number;
  w: number;
  h: number;
  type: DecorationType;
  layer: DecorationLayer;
  parallax: number;
}

export interface StageVisualTheme {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  nebula: [string, string, string];
  haze: string;
  star: string;
  solidOverlay: string;
  hudStroke: string;
  hudPanel: string;
}

export interface StagePhysicsProfile {
  gravityScale: number;
  windX: number;
  enemySpeedScale: number;
}

export interface LevelData {
  id: string;
  stageNumber: number;
  title: string;
  tagline: string;
  width: number;
  height: number;
  deathY: number;
  spawn: Vec2;
  backgroundStyle: StageBackgroundStyle;
  theme: StageVisualTheme;
  physics: StagePhysicsProfile;
  solids: Rect[];
  coins: CoinSpawn[];
  enemies: EnemySpawn[];
  decorations: DecorationSpawn[];
  goal: Rect;
}

export const TOTAL_STAGES = 5;

const STAGE_THEMES: StageVisualTheme[] = [
  {
    skyTop: "#070a1f",
    skyMid: "#191647",
    skyBottom: "#2b1c5f",
    nebula: ["#4b7fff", "#b86fff", "#58d8ff"],
    haze: "#9e7dff",
    star: "#ffffff",
    solidOverlay: "#8df0ff",
    hudStroke: "#8fd8ff",
    hudPanel: "#0b1438",
  },
  {
    skyTop: "#120b1f",
    skyMid: "#2b1235",
    skyBottom: "#52203c",
    nebula: ["#ff8f52", "#ff5f8f", "#ffd166"],
    haze: "#ff8a65",
    star: "#fff3d6",
    solidOverlay: "#ffd089",
    hudStroke: "#ffad87",
    hudPanel: "#2a1025",
  },
  {
    skyTop: "#071022",
    skyMid: "#0f2445",
    skyBottom: "#1e3f6a",
    nebula: ["#67ddff", "#7ab8ff", "#8f9dff"],
    haze: "#79d6ff",
    star: "#e6f6ff",
    solidOverlay: "#91dcff",
    hudStroke: "#8ed7ff",
    hudPanel: "#0d2341",
  },
  {
    skyTop: "#061a1c",
    skyMid: "#0f3b3c",
    skyBottom: "#1f5d57",
    nebula: ["#79ffd6", "#7dc4ff", "#b4ffa1"],
    haze: "#8cffd5",
    star: "#e7fff5",
    solidOverlay: "#9bffd9",
    hudStroke: "#86ffd4",
    hudPanel: "#0d2b2b",
  },
  {
    skyTop: "#1b0715",
    skyMid: "#38102b",
    skyBottom: "#5e1737",
    nebula: ["#ff6477", "#ff9f5a", "#ff3c8d"],
    haze: "#ff6f8a",
    star: "#ffe0ea",
    solidOverlay: "#ff9ab5",
    hudStroke: "#ff8bac",
    hudPanel: "#2c0c22",
  },
];

const DEFAULT_PHYSICS: StagePhysicsProfile = {
  gravityScale: 1,
  windX: 0,
  enemySpeedScale: 1,
};

export function createStageLevels(): LevelData[] {
  return [
    createStage1(),
    createStage2(),
    createStage3(),
    createStage4(),
    createStage5(),
  ];
}

function createStage1(): LevelData {
  const width = 3600;
  const groundSegments: Rect[] = [
    { x: 0, y: 500, w: 760, h: 40 },
    { x: 900, y: 500, w: 920, h: 40 },
    { x: 1960, y: 500, w: 760, h: 40 },
    { x: 2860, y: 500, w: 740, h: 40 },
  ];
  const platforms: Rect[] = [
    { x: 260, y: 430, w: 220, h: 18 },
    { x: 610, y: 380, w: 180, h: 18 },
    { x: 980, y: 340, w: 200, h: 18 },
    { x: 1320, y: 390, w: 220, h: 18 },
    { x: 1640, y: 330, w: 190, h: 18 },
    { x: 2010, y: 290, w: 180, h: 18 },
    { x: 2340, y: 350, w: 220, h: 18 },
    { x: 2720, y: 300, w: 190, h: 18 },
    { x: 3050, y: 360, w: 210, h: 18 },
    { x: 3330, y: 310, w: 160, h: 18 },
  ];

  const solids = [...groundSegments, ...platforms];
  const coins = [
    ...coinsAbovePlatforms(platforms, 24, 10),
    ...trailCoins(180, 3460, 456, 18, 22),
  ];

  const enemies: EnemySpawn[] = [
    { x: 980, y: 470, patrolMin: 920, patrolMax: 1260, direction: 1 },
    { x: 1710, y: 470, patrolMin: 1500, patrolMax: 1780, direction: -1 },
    { x: 2100, y: 470, patrolMin: 1980, patrolMax: 2450, direction: 1 },
    { x: 3090, y: 470, patrolMin: 2910, patrolMax: 3370, direction: -1 },
    { x: 1040, y: 310, patrolMin: 1000, patrolMax: 1140, direction: 1 },
    { x: 2045, y: 260, patrolMin: 2020, patrolMax: 2170, direction: -1 },
    { x: 2750, y: 270, patrolMin: 2730, patrolMax: 2890, direction: 1 },
    { x: 3348, y: 280, patrolMin: 3340, patrolMax: 3470, direction: 1 },
  ];

  const decorations: DecorationSpawn[] = [];
  for (let x = 120; x < width - 100; x += 420) {
    const pattern = Math.floor(x / 420) % 3;
    if (pattern === 0) {
      decorations.push({ x, y: 84, w: 170, h: 170, type: "planet", layer: "back", parallax: 0.24 });
    } else if (pattern === 1) {
      decorations.push({ x, y: 148, w: 136, h: 92, type: "ufo", layer: "back", parallax: 0.46 });
    } else {
      decorations.push({ x, y: 162, w: 96, h: 122, type: "satellite", layer: "back", parallax: 0.36 });
    }
  }
  for (let x = 350; x < width - 120; x += 700) {
    decorations.push({ x, y: 352, w: 82, h: 100, type: "satellite", layer: "front", parallax: 1 });
  }

  return {
    id: "stage1",
    stageNumber: 1,
    title: "Nebula Garden",
    tagline: "Standard cosmic plains that teach core platforming flow.",
    width,
    height: 540,
    deathY: 760,
    spawn: { x: 80, y: 440 },
    backgroundStyle: "nebula",
    theme: STAGE_THEMES[0],
    physics: { ...DEFAULT_PHYSICS },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 3500, y: 430, w: 44, h: 70 },
  };
}

function createStage2(): LevelData {
  const width = 3700;
  const groundSegments: Rect[] = [
    { x: 0, y: 500, w: 360, h: 40 },
    { x: 500, y: 500, w: 360, h: 40 },
    { x: 1000, y: 500, w: 320, h: 40 },
    { x: 1460, y: 500, w: 340, h: 40 },
    { x: 1940, y: 500, w: 300, h: 40 },
    { x: 2360, y: 500, w: 330, h: 40 },
    { x: 2830, y: 500, w: 320, h: 40 },
    { x: 3290, y: 500, w: 410, h: 40 },
  ];
  const bridgePlatforms: Rect[] = [
    { x: 380, y: 430, w: 110, h: 16 },
    { x: 870, y: 420, w: 120, h: 16 },
    { x: 1330, y: 410, w: 120, h: 16 },
    { x: 1810, y: 400, w: 120, h: 16 },
    { x: 2250, y: 390, w: 120, h: 16 },
    { x: 2720, y: 380, w: 120, h: 16 },
    { x: 3180, y: 370, w: 120, h: 16 },
  ];
  const upperRoute: Rect[] = [
    { x: 1160, y: 330, w: 180, h: 16 },
    { x: 1640, y: 320, w: 180, h: 16 },
    { x: 2120, y: 310, w: 180, h: 16 },
    { x: 2600, y: 300, w: 180, h: 16 },
  ];

  const solids = [...groundSegments, ...bridgePlatforms, ...upperRoute];
  const coins = [
    ...coinsAbovePlatforms(bridgePlatforms, 22, 9),
    ...coinsAbovePlatforms(upperRoute, 22, 10),
    ...trailCoins(120, 3580, 460, 22, 30),
  ];

  const enemies: EnemySpawn[] = [
    { x: 560, y: 470, patrolMin: 510, patrolMax: 820, direction: -1, tier: "scout" },
    { x: 1060, y: 470, patrolMin: 1010, patrolMax: 1290, direction: 1, tier: "runner" },
    { x: 1510, y: 470, patrolMin: 1480, patrolMax: 1780, direction: -1, tier: "scout" },
    { x: 2400, y: 470, patrolMin: 2380, patrolMax: 2660, direction: -1, tier: "runner" },
    { x: 2870, y: 470, patrolMin: 2840, patrolMax: 3130, direction: 1, tier: "scout" },
    { x: 1220, y: 300, patrolMin: 1180, patrolMax: 1320, direction: 1, tier: "scout" },
    { x: 1710, y: 290, patrolMin: 1650, patrolMax: 1800, direction: 1, tier: "runner" },
    { x: 2170, y: 280, patrolMin: 2140, patrolMax: 2280, direction: -1, tier: "scout" },
    { x: 2650, y: 270, patrolMin: 2630, patrolMax: 2760, direction: 1, tier: "runner" },
    { x: 3220, y: 340, patrolMin: 3190, patrolMax: 3280, direction: -1, tier: "scout" },
  ];

  const decorations: DecorationSpawn[] = [];
  for (let x = 80; x < width - 160; x += 360) {
    decorations.push({
      x,
      y: 106 + (Math.floor(x / 360) % 2) * 22,
      w: 132,
      h: 92,
      type: "ufo",
      layer: "back",
      parallax: 0.58,
    });
  }
  for (let x = 200; x < width - 120; x += 520) {
    decorations.push({
      x,
      y: 150,
      w: 98,
      h: 124,
      type: "satellite",
      layer: "back",
      parallax: 0.42,
    });
  }
  for (let x = 430; x < width - 80; x += 600) {
    decorations.push({
      x,
      y: 344,
      w: 88,
      h: 102,
      type: "ufo",
      layer: "front",
      parallax: 1,
    });
  }

  return {
    id: "stage2",
    stageNumber: 2,
    title: "Comet Conveyor",
    tagline: "Constant headwind and broken ground demand chain jumps.",
    width,
    height: 560,
    deathY: 780,
    spawn: { x: 70, y: 452 },
    backgroundStyle: "cometStorm",
    theme: STAGE_THEMES[1],
    physics: { gravityScale: 1, windX: -220, enemySpeedScale: 1.08 },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 3600, y: 430, w: 44, h: 70 },
  };
}

function createStage3(): LevelData {
  const width = 1860;
  const height = 1620;
  const base: Rect[] = [
    { x: 0, y: 1460, w: 460, h: 50 },
    { x: 520, y: 1460, w: 340, h: 50 },
    { x: 940, y: 1460, w: 260, h: 50 },
  ];
  const climb: Rect[] = [
    { x: 240, y: 1360, w: 180, h: 18 },
    { x: 500, y: 1290, w: 170, h: 18 },
    { x: 760, y: 1220, w: 170, h: 18 },
    { x: 1020, y: 1150, w: 170, h: 18 },
    { x: 760, y: 1080, w: 170, h: 18 },
    { x: 500, y: 1010, w: 170, h: 18 },
    { x: 240, y: 940, w: 170, h: 18 },
    { x: 500, y: 870, w: 170, h: 18 },
    { x: 760, y: 800, w: 170, h: 18 },
    { x: 1020, y: 730, w: 170, h: 18 },
    { x: 1260, y: 660, w: 170, h: 18 },
    { x: 1020, y: 590, w: 170, h: 18 },
    { x: 760, y: 520, w: 170, h: 18 },
    { x: 500, y: 450, w: 170, h: 18 },
    { x: 760, y: 380, w: 170, h: 18 },
    { x: 1020, y: 310, w: 170, h: 18 },
    { x: 1260, y: 240, w: 180, h: 18 },
    { x: 1480, y: 170, w: 160, h: 18 },
  ];

  const solids = [...base, ...climb];
  const coins = [
    ...coinsAbovePlatforms(climb, 24, 9),
    ...trailCoins(140, 1120, 1430, 8, 28),
    ...trailCoins(300, 1520, 220, 9, 18),
  ];

  const enemies: EnemySpawn[] = [
    { x: 560, y: 1430, patrolMin: 540, patrolMax: 840, direction: 1 },
    { x: 790, y: 1190, patrolMin: 770, patrolMax: 910, direction: -1 },
    { x: 530, y: 980, patrolMin: 510, patrolMax: 650, direction: 1 },
    { x: 1040, y: 700, patrolMin: 1030, patrolMax: 1180, direction: -1 },
    { x: 770, y: 490, patrolMin: 770, patrolMax: 910, direction: 1 },
    { x: 1270, y: 210, patrolMin: 1260, patrolMax: 1430, direction: -1 },
  ];

  const decorations: DecorationSpawn[] = [];
  for (let y = 1220; y >= 100; y -= 170) {
    decorations.push({
      x: 80 + (Math.floor(y / 170) % 2) * 60,
      y,
      w: 116,
      h: 150,
      type: "satellite",
      layer: "back",
      parallax: 0.28,
    });
  }
  for (let y = 1320; y >= 140; y -= 200) {
    decorations.push({
      x: 1560,
      y,
      w: 150,
      h: 150,
      type: "planet",
      layer: "back",
      parallax: 0.2,
    });
  }
  for (let y = 1360; y >= 240; y -= 260) {
    decorations.push({
      x: 940,
      y: y + 120,
      w: 86,
      h: 100,
      type: "ufo",
      layer: "front",
      parallax: 1,
    });
  }

  return {
    id: "stage3",
    stageNumber: 3,
    title: "Orbit Elevator",
    tagline: "A vertical tower climb focused on upward routing.",
    width,
    height,
    deathY: 1820,
    spawn: { x: 80, y: 1412 },
    backgroundStyle: "orbitalGrid",
    theme: STAGE_THEMES[2],
    physics: { gravityScale: 0.95, windX: 0, enemySpeedScale: 1.14 },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 1660, y: 86, w: 44, h: 70 },
  };
}

function createStage4(): LevelData {
  const width = 4360;
  const groundSegments: Rect[] = [
    { x: 0, y: 730, w: 600, h: 44 },
    { x: 820, y: 730, w: 520, h: 44 },
    { x: 1560, y: 730, w: 480, h: 44 },
    { x: 2260, y: 730, w: 520, h: 44 },
    { x: 3000, y: 730, w: 540, h: 44 },
    { x: 3760, y: 730, w: 600, h: 44 },
  ];
  const islands: Rect[] = [
    { x: 520, y: 610, w: 220, h: 20 },
    { x: 860, y: 560, w: 200, h: 20 },
    { x: 1240, y: 500, w: 220, h: 20 },
    { x: 1620, y: 440, w: 220, h: 20 },
    { x: 2020, y: 380, w: 220, h: 20 },
    { x: 2420, y: 440, w: 220, h: 20 },
    { x: 2820, y: 500, w: 220, h: 20 },
    { x: 3200, y: 560, w: 220, h: 20 },
    { x: 3560, y: 500, w: 220, h: 20 },
    { x: 3920, y: 430, w: 220, h: 20 },
    { x: 4100, y: 360, w: 150, h: 20 },
  ];

  const solids = [...groundSegments, ...islands];
  const coins = [
    ...coinsAbovePlatforms(islands, 24, 9),
    ...trailCoins(120, 4230, 666, 20, 24),
  ];

  const enemies: EnemySpawn[] = [
    { x: 900, y: 700, patrolMin: 840, patrolMax: 1300, direction: 1, tier: "runner" },
    { x: 1600, y: 700, patrolMin: 1570, patrolMax: 1990, direction: -1, tier: "hopper" },
    { x: 2590, y: 700, patrolMin: 2540, patrolMax: 2760, direction: 1, tier: "runner" },
    { x: 3050, y: 700, patrolMin: 3020, patrolMax: 3520, direction: 1, tier: "guard" },
    { x: 1680, y: 410, patrolMin: 1640, patrolMax: 1820, direction: 1, tier: "guard" },
    { x: 2060, y: 350, patrolMin: 2040, patrolMax: 2220, direction: -1, tier: "hopper" },
    { x: 3230, y: 530, patrolMin: 3220, patrolMax: 3400, direction: 1, tier: "runner" },
    { x: 3950, y: 400, patrolMin: 3940, patrolMax: 4120, direction: -1, tier: "runner" },
  ];

  const decorations: DecorationSpawn[] = [];
  for (let x = 120; x < width - 180; x += 520) {
    decorations.push({
      x,
      y: 96,
      w: 176,
      h: 176,
      type: "planet",
      layer: "back",
      parallax: 0.18,
    });
  }
  for (let x = 340; x < width - 120; x += 620) {
    decorations.push({
      x,
      y: 168,
      w: 132,
      h: 92,
      type: "ufo",
      layer: "back",
      parallax: 0.44,
    });
  }
  for (let x = 600; x < width - 120; x += 760) {
    decorations.push({
      x,
      y: 600,
      w: 86,
      h: 104,
      type: "satellite",
      layer: "front",
      parallax: 1,
    });
  }

  return {
    id: "stage4",
    stageNumber: 4,
    title: "Lunar Drift",
    tagline: "Low gravity plus tailwind across drifting floating islands.",
    width,
    height: 860,
    deathY: 1030,
    spawn: { x: 80, y: 682 },
    backgroundStyle: "lunarMist",
    theme: STAGE_THEMES[3],
    physics: { gravityScale: 0.62, windX: 85, enemySpeedScale: 0.92 },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 4210, y: 290, w: 44, h: 70 },
  };
}

function createStage5(): LevelData {
  const width = 3340;
  const groundSegments: Rect[] = [
    { x: 0, y: 560, w: 420, h: 50 },
    { x: 520, y: 560, w: 380, h: 50 },
    { x: 1000, y: 560, w: 360, h: 50 },
    { x: 1460, y: 560, w: 360, h: 50 },
    { x: 1920, y: 560, w: 360, h: 50 },
    { x: 2380, y: 560, w: 360, h: 50 },
    { x: 2840, y: 560, w: 500, h: 50 },
  ];
  const gapBridges: Rect[] = [
    { x: 430, y: 500, w: 90, h: 16 },
    { x: 910, y: 500, w: 90, h: 16 },
    { x: 1370, y: 500, w: 90, h: 16 },
    { x: 1830, y: 500, w: 90, h: 16 },
    { x: 2290, y: 500, w: 90, h: 16 },
    { x: 2750, y: 500, w: 90, h: 16 },
  ];
  const upperRunways: Rect[] = [
    { x: 680, y: 450, w: 150, h: 16 },
    { x: 1150, y: 430, w: 160, h: 16 },
    { x: 1610, y: 450, w: 150, h: 16 },
    { x: 2070, y: 430, w: 160, h: 16 },
    { x: 2530, y: 450, w: 150, h: 16 },
    { x: 2990, y: 430, w: 150, h: 16 },
  ];
  const ceilingBars: Rect[] = [
    { x: 320, y: 400, w: 180, h: 14 },
    { x: 820, y: 390, w: 180, h: 14 },
    { x: 1320, y: 400, w: 180, h: 14 },
    { x: 1820, y: 390, w: 180, h: 14 },
    { x: 2320, y: 400, w: 180, h: 14 },
    { x: 2820, y: 390, w: 180, h: 14 },
  ];

  const solids = [...groundSegments, ...gapBridges, ...upperRunways, ...ceilingBars];
  const coins = [
    ...coinsAbovePlatforms(gapBridges, 22, 8),
    ...coinsAbovePlatforms(upperRunways, 22, 9),
    ...trailCoins(100, 3250, 520, 18, 20),
  ];

  const enemies: EnemySpawn[] = [
    { x: 130, y: 530, patrolMin: 20, patrolMax: 380, direction: 1, tier: "runner" },
    { x: 560, y: 530, patrolMin: 530, patrolMax: 870, direction: -1, tier: "hopper" },
    { x: 1040, y: 530, patrolMin: 1010, patrolMax: 1330, direction: 1, tier: "runner" },
    { x: 1500, y: 530, patrolMin: 1480, patrolMax: 1790, direction: -1, tier: "guard" },
    { x: 1960, y: 530, patrolMin: 1940, patrolMax: 2250, direction: 1, tier: "hopper" },
    { x: 2420, y: 530, patrolMin: 2400, patrolMax: 2710, direction: -1, tier: "ace" },
    { x: 2880, y: 530, patrolMin: 2860, patrolMax: 3210, direction: 1, tier: "runner" },
    { x: 700, y: 420, patrolMin: 690, patrolMax: 820, direction: -1, tier: "hopper" },
    { x: 1160, y: 400, patrolMin: 1160, patrolMax: 1300, direction: 1, tier: "guard" },
    { x: 1630, y: 420, patrolMin: 1620, patrolMax: 1740, direction: -1, tier: "guard" },
    { x: 2090, y: 400, patrolMin: 2080, patrolMax: 2220, direction: 1, tier: "hopper" },
    { x: 2540, y: 420, patrolMin: 2530, patrolMax: 2670, direction: -1, tier: "ace" },
    { x: 3010, y: 400, patrolMin: 3000, patrolMax: 3130, direction: 1, tier: "runner" },
  ];

  const decorations: DecorationSpawn[] = [];
  for (let x = 120; x < width - 120; x += 320) {
    decorations.push({
      x,
      y: 130,
      w: 130,
      h: 90,
      type: "ufo",
      layer: "back",
      parallax: 0.58,
    });
  }
  for (let x = 260; x < width - 120; x += 640) {
    decorations.push({
      x,
      y: 84,
      w: 154,
      h: 154,
      type: "planet",
      layer: "back",
      parallax: 0.22,
    });
  }
  for (let x = 380; x < width - 120; x += 520) {
    decorations.push({
      x,
      y: 470,
      w: 80,
      h: 98,
      type: "satellite",
      layer: "front",
      parallax: 1,
    });
  }

  return {
    id: "stage5",
    stageNumber: 5,
    title: "Alien Armada",
    tagline: "Final high-gravity gauntlet with fast enemies and short reactions.",
    width,
    height: 620,
    deathY: 840,
    spawn: { x: 80, y: 512 },
    backgroundStyle: "redAlert",
    theme: STAGE_THEMES[4],
    physics: { gravityScale: 1.35, windX: 0, enemySpeedScale: 1.65 },
    solids,
    coins,
    enemies,
    decorations,
    goal: { x: 3200, y: 490, w: 44, h: 70 },
  };
}

function coinsAbovePlatforms(platforms: Rect[], offsetY: number, radius: number): CoinSpawn[] {
  const coins: CoinSpawn[] = [];
  for (const platform of platforms) {
    coins.push({ x: platform.x + platform.w * 0.3, y: platform.y - offsetY, r: radius });
    coins.push({ x: platform.x + platform.w * 0.7, y: platform.y - offsetY, r: radius });
  }
  return coins;
}

function trailCoins(startX: number, endX: number, baseY: number, count: number, waveHeight: number): CoinSpawn[] {
  const coins: CoinSpawn[] = [];
  const span = endX - startX;
  for (let index = 0; index < count; index += 1) {
    const t = count <= 1 ? 0 : index / (count - 1);
    coins.push({
      x: startX + span * t,
      y: baseY + Math.sin(t * Math.PI * 3) * waveHeight,
      r: 8,
    });
  }
  return coins;
}
