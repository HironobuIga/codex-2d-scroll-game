import backgroundFarUrl from "../assets/background/bg-far.svg";
import backgroundMidUrl from "../assets/background/bg-mid.svg";
import backgroundNearUrl from "../assets/background/bg-near.svg";
import heroAirUrl from "../assets/sprites/hero-air.svg";
import heroIdleUrl from "../assets/sprites/hero-idle.svg";
import enemySlimeUrl from "../assets/sprites/enemy-slime.svg";
import coinUrl from "../assets/sprites/coin.svg";
import goalFlagUrl from "../assets/sprites/goal-flag.svg";
import groundTileUrl from "../assets/tiles/ground-tile.svg";
import platformTileUrl from "../assets/tiles/platform-tile.svg";
import decoTreeUrl from "../assets/decor/deco-tree.svg";
import decoCrystalUrl from "../assets/decor/deco-crystal.svg";
import decoRuinUrl from "../assets/decor/deco-ruin.svg";

export interface GameAssets {
  backgroundFar: HTMLImageElement;
  backgroundMid: HTMLImageElement;
  backgroundNear: HTMLImageElement;
  heroIdle: HTMLImageElement;
  heroAir: HTMLImageElement;
  enemySlime: HTMLImageElement;
  coin: HTMLImageElement;
  goalFlag: HTMLImageElement;
  groundTile: HTMLImageElement;
  platformTile: HTMLImageElement;
  decoTree: HTMLImageElement;
  decoCrystal: HTMLImageElement;
  decoRuin: HTMLImageElement;
}

async function loadImage(name: string, source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${name} from ${source}`));
    image.src = source;
  });
}

export async function loadGameAssets(): Promise<GameAssets> {
  const [
    backgroundFar,
    backgroundMid,
    backgroundNear,
    heroIdle,
    heroAir,
    enemySlime,
    coin,
    goalFlag,
    groundTile,
    platformTile,
    decoTree,
    decoCrystal,
    decoRuin,
  ] = await Promise.all([
    loadImage("backgroundFar", backgroundFarUrl),
    loadImage("backgroundMid", backgroundMidUrl),
    loadImage("backgroundNear", backgroundNearUrl),
    loadImage("heroIdle", heroIdleUrl),
    loadImage("heroAir", heroAirUrl),
    loadImage("enemySlime", enemySlimeUrl),
    loadImage("coin", coinUrl),
    loadImage("goalFlag", goalFlagUrl),
    loadImage("groundTile", groundTileUrl),
    loadImage("platformTile", platformTileUrl),
    loadImage("decoTree", decoTreeUrl),
    loadImage("decoCrystal", decoCrystalUrl),
    loadImage("decoRuin", decoRuinUrl),
  ]);

  return {
    backgroundFar,
    backgroundMid,
    backgroundNear,
    heroIdle,
    heroAir,
    enemySlime,
    coin,
    goalFlag,
    groundTile,
    platformTile,
    decoTree,
    decoCrystal,
    decoRuin,
  };
}
