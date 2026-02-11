import backgroundFarUrl from "../assets/background/bg-far.svg";
import backgroundMidUrl from "../assets/background/bg-mid.svg";
import backgroundNearUrl from "../assets/background/bg-near.svg";
import heroAirUrl from "../assets/sprites/hero-air.png";
import heroIdleUrl from "../assets/sprites/hero-idle.png";
import heroMoveUrl from "../assets/sprites/hero-move.png";
import enemySlimeUrl from "../assets/sprites/enemy-slime.png";
import enemyScoutUrl from "../assets/sprites/enemy-scout.png";
import enemyRunnerUrl from "../assets/sprites/enemy-runner.png";
import enemyHopperUrl from "../assets/sprites/enemy-hopper.png";
import enemyGuardUrl from "../assets/sprites/enemy-guard.png";
import enemyAceUrl from "../assets/sprites/enemy-ace.png";
import coinUrl from "../assets/sprites/coin.svg";
import goalFlagUrl from "../assets/sprites/goal-flag.svg";
import groundTileUrl from "../assets/tiles/ground-tile.svg";
import platformTileUrl from "../assets/tiles/platform-tile.svg";
import decoPlanetUrl from "../assets/decor/deco-planet.svg";
import decoUfoUrl from "../assets/decor/deco-ufo.svg";
import decoSatelliteUrl from "../assets/decor/deco-satellite.svg";

export interface GameAssets {
  backgroundFar: HTMLImageElement;
  backgroundMid: HTMLImageElement;
  backgroundNear: HTMLImageElement;
  heroIdle: HTMLImageElement;
  heroMove: HTMLImageElement;
  heroAir: HTMLImageElement;
  enemySlime: HTMLImageElement;
  enemyScout: HTMLImageElement;
  enemyRunner: HTMLImageElement;
  enemyHopper: HTMLImageElement;
  enemyGuard: HTMLImageElement;
  enemyAce: HTMLImageElement;
  coin: HTMLImageElement;
  goalFlag: HTMLImageElement;
  groundTile: HTMLImageElement;
  platformTile: HTMLImageElement;
  decoPlanet: HTMLImageElement;
  decoUfo: HTMLImageElement;
  decoSatellite: HTMLImageElement;
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
    heroMove,
    heroAir,
    enemySlime,
    enemyScout,
    enemyRunner,
    enemyHopper,
    enemyGuard,
    enemyAce,
    coin,
    goalFlag,
    groundTile,
    platformTile,
    decoPlanet,
    decoUfo,
    decoSatellite,
  ] = await Promise.all([
    loadImage("backgroundFar", backgroundFarUrl),
    loadImage("backgroundMid", backgroundMidUrl),
    loadImage("backgroundNear", backgroundNearUrl),
    loadImage("heroIdle", heroIdleUrl),
    loadImage("heroMove", heroMoveUrl),
    loadImage("heroAir", heroAirUrl),
    loadImage("enemySlime", enemySlimeUrl),
    loadImage("enemyScout", enemyScoutUrl),
    loadImage("enemyRunner", enemyRunnerUrl),
    loadImage("enemyHopper", enemyHopperUrl),
    loadImage("enemyGuard", enemyGuardUrl),
    loadImage("enemyAce", enemyAceUrl),
    loadImage("coin", coinUrl),
    loadImage("goalFlag", goalFlagUrl),
    loadImage("groundTile", groundTileUrl),
    loadImage("platformTile", platformTileUrl),
    loadImage("decoPlanet", decoPlanetUrl),
    loadImage("decoUfo", decoUfoUrl),
    loadImage("decoSatellite", decoSatelliteUrl),
  ]);

  return {
    backgroundFar,
    backgroundMid,
    backgroundNear,
    heroIdle,
    heroMove,
    heroAir,
    enemySlime,
    enemyScout,
    enemyRunner,
    enemyHopper,
    enemyGuard,
    enemyAce,
    coin,
    goalFlag,
    groundTile,
    platformTile,
    decoPlanet,
    decoUfo,
    decoSatellite,
  };
}
