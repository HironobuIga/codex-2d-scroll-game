import "./style.css";
import { FIXED_DT, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./game/constants";
import { loadGameAssets } from "./game/assets";
import { Game } from "./game/Game";
import { InputState } from "./game/input";

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
    __vt_pending?: unknown;
  }
}

const shell = document.querySelector<HTMLDivElement>("#game-shell");
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const startButton = document.querySelector<HTMLButtonElement>("#start-btn");

if (!shell || !canvas || !startButton) {
  throw new Error("Required DOM nodes were not found.");
}

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("2D rendering context is unavailable.");
}

canvas.width = VIEWPORT_WIDTH;
canvas.height = VIEWPORT_HEIGHT;

const game = new Game();
const input = new InputState(window);
const testHooksEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_HOOKS === "true";
const deterministicMode = testHooksEnabled && "__vt_pending" in window;

void loadGameAssets()
  .then((assets) => {
    game.setAssets(assets);
  })
  .catch((error) => {
    console.warn("Game assets could not be loaded, falling back to basic shapes.", error);
  });

startButton.addEventListener("click", () => {
  game.startRun();
  startButton.blur();
});

window.addEventListener("keydown", (event) => {
  if (event.code !== "KeyF") {
    return;
  }
  event.preventDefault();
  void toggleFullscreen(shell).catch(() => {
    return;
  });
});

window.addEventListener("resize", () => {
  resizeCanvasDisplay(shell, canvas);
});

document.addEventListener("fullscreenchange", () => {
  resizeCanvasDisplay(shell, canvas);
});

const stepFrame = (): void => {
  game.step(FIXED_DT, input);
  input.endFrame();
};

const drawFrame = (): void => {
  game.render(context);
  syncStartButton(startButton, game);
};

const advanceTimeForTests = async (ms: number): Promise<void> => {
  const stepMs = 1000 / 60;
  const steps = Math.max(1, Math.round(ms / stepMs));
  for (let index = 0; index < steps; index += 1) {
    stepFrame();
  }
  drawFrame();
};

if (testHooksEnabled) {
  window.render_game_to_text = () => game.renderGameToText();
  window.advanceTime = advanceTimeForTests;
}

resizeCanvasDisplay(shell, canvas);
drawFrame();

let animationId = 0;
let accumulator = 0;
let previousNow = performance.now();

if (!deterministicMode) {
  const loop = (now: number): void => {
    const deltaSeconds = Math.min(0.05, (now - previousNow) / 1000);
    previousNow = now;
    accumulator += deltaSeconds;

    while (accumulator >= FIXED_DT) {
      stepFrame();
      accumulator -= FIXED_DT;
    }

    drawFrame();
    animationId = window.requestAnimationFrame(loop);
  };
  animationId = window.requestAnimationFrame(loop);
}

window.addEventListener("beforeunload", () => {
  if (animationId !== 0) {
    window.cancelAnimationFrame(animationId);
  }
  input.destroy(window);
});

function syncStartButton(button: HTMLButtonElement, activeGame: Game): void {
  button.hidden = !activeGame.shouldShowStartButton();
  button.textContent = activeGame.startButtonLabel();
}

function resizeCanvasDisplay(container: HTMLElement, targetCanvas: HTMLCanvasElement): void {
  const maxWidth = container.clientWidth;
  const maxHeight = container.clientHeight;
  const scale = Math.max(0.2, Math.min(maxWidth / VIEWPORT_WIDTH, maxHeight / VIEWPORT_HEIGHT));
  targetCanvas.style.width = `${Math.floor(VIEWPORT_WIDTH * scale)}px`;
  targetCanvas.style.height = `${Math.floor(VIEWPORT_HEIGHT * scale)}px`;
}

async function toggleFullscreen(element: HTMLElement): Promise<void> {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  }
}
