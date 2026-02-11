import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_ITERATIONS = 20;
const MAX_PAUSE_MS = 5000;
const MAX_STEPS = 500;
const MAX_FRAMES_PER_STEP = 600;
const MAX_TOTAL_FRAMES = 24000;
const MAX_ACTION_JSON_BYTES = 512 * 1024;
const LOCAL_ONLY_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const buttonNameToKey = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  enter: "Enter",
  space: "Space",
  a: "KeyA",
  b: "KeyB",
  r: "KeyR",
};

const allowedButtons = new Set([
  ...Object.keys(buttonNameToKey),
  "left_mouse_button",
  "right_mouse_button",
]);

function inferMacHostPlatformForArm64() {
  const kernelMajor = Number.parseInt(String(os.release()).split(".")[0] ?? "", 10);
  if (!Number.isInteger(kernelMajor)) {
    return null;
  }
  if (kernelMajor < 18) {
    return "mac10.13-arm64";
  }
  if (kernelMajor === 18) {
    return "mac10.14-arm64";
  }
  if (kernelMajor === 19) {
    return "mac10.15-arm64";
  }
  // Darwin 20 roughly maps to macOS 11; for modern releases we approximate
  // with `major = kernelMajor - 9` and clamp to known Playwright platform ids.
  const hostMajor = Math.min(kernelMajor - 9, 15);
  return `mac${hostMajor}-arm64`;
}

function applyPlaywrightHostPlatformOverride() {
  if (process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
    return;
  }
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    return;
  }
  const cpuModels = os.cpus().map((cpu) => cpu?.model ?? "");
  const alreadyDetectedAsAppleSilicon = cpuModels.some((model) => model.includes("Apple"));
  if (alreadyDetectedAsAppleSilicon) {
    return;
  }
  const inferred = inferMacHostPlatformForArm64();
  if (inferred) {
    process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = inferred;
  }
}

async function resolveChromium() {
  applyPlaywrightHostPlatformOverride();

  let lastError = null;
  for (const moduleName of ["playwright", "playwright-core"]) {
    try {
      const playwrightModule = await import(moduleName);
      if (playwrightModule?.chromium) {
        return playwrightModule.chromium;
      }
    } catch (error) {
      lastError = error;
    }
  }
  const message = [
    "Playwright module is not installed.",
    "Run `npm install -D playwright` in this workspace, then `npx playwright install chromium`.",
  ].join(" ");
  if (lastError) {
    throw new Error(`${message} Last error: ${String(lastError)}`);
  }
  throw new Error(message);
}

function parseBoundedInteger(raw, fieldName, min, max) {
  const normalized = String(raw).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseBoolean(raw, fieldName) {
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "1" || normalized === "true") {
    return true;
  }
  if (normalized === "0" || normalized === "false") {
    return false;
  }
  throw new Error(`${fieldName} must be one of: true, false, 1, 0`);
}

function parseClick(raw) {
  const parts = raw.split(",").map((value) => Number.parseFloat(value.trim()));
  if (parts.length !== 2 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error("--click must be 'x,y' with numeric coordinates");
  }
  return { x: parts[0], y: parts[1] };
}

function parseActionsPayload(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.steps)) {
    return parsed.steps;
  }
  throw new Error("Actions payload must be an array or an object with a steps array");
}

function readActionsFile(actionsFile) {
  const raw = fs.readFileSync(actionsFile, "utf-8");
  if (Buffer.byteLength(raw, "utf-8") > MAX_ACTION_JSON_BYTES) {
    throw new Error(`Action file is too large: ${actionsFile}`);
  }
  const parsed = JSON.parse(raw);
  return parseActionsPayload(parsed);
}

function normalizeSteps(rawSteps, iterations) {
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new Error("Actions must include at least one step");
  }
  if (rawSteps.length > MAX_STEPS) {
    throw new Error(`Actions contain too many steps (max ${MAX_STEPS})`);
  }

  let framesPerIteration = 0;
  const normalizedSteps = rawSteps.map((rawStep, index) => {
    if (!rawStep || typeof rawStep !== "object") {
      throw new Error(`Step ${index} must be an object`);
    }

    const rawButtons = rawStep.buttons ?? [];
    if (!Array.isArray(rawButtons)) {
      throw new Error(`steps[${index}].buttons must be an array`);
    }

    const buttons = rawButtons.map((button) => {
      if (typeof button !== "string" || !allowedButtons.has(button)) {
        throw new Error(`steps[${index}] has unsupported button: ${String(button)}`);
      }
      return button;
    });

    const frames = rawStep.frames === undefined
      ? 1
      : parseBoundedInteger(rawStep.frames, `steps[${index}].frames`, 1, MAX_FRAMES_PER_STEP);

    let mouseX = undefined;
    if (rawStep.mouse_x !== undefined) {
      if (typeof rawStep.mouse_x !== "number" || !Number.isFinite(rawStep.mouse_x)) {
        throw new Error(`steps[${index}].mouse_x must be a finite number`);
      }
      mouseX = rawStep.mouse_x;
    }

    let mouseY = undefined;
    if (rawStep.mouse_y !== undefined) {
      if (typeof rawStep.mouse_y !== "number" || !Number.isFinite(rawStep.mouse_y)) {
        throw new Error(`steps[${index}].mouse_y must be a finite number`);
      }
      mouseY = rawStep.mouse_y;
    }

    framesPerIteration += frames;
    return { buttons, frames, mouse_x: mouseX, mouse_y: mouseY };
  });

  if (framesPerIteration * iterations > MAX_TOTAL_FRAMES) {
    throw new Error(`Total frame budget exceeded (max ${MAX_TOTAL_FRAMES})`);
  }
  return normalizedSteps;
}

function validateTargetUrl(rawUrl, allowRemote) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http:// and https:// URLs are supported");
  }
  if (!allowRemote && !LOCAL_ONLY_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Remote host '${parsed.hostname}' is blocked. Use --allow-remote to override.`,
    );
  }
}

function isWithinRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function ensureExistingDirectory(targetPath, fieldName) {
  let stat;
  try {
    stat = fs.lstatSync(targetPath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`${fieldName} does not exist: ${targetPath}`);
    }
    throw error;
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`${fieldName} must not be a symbolic link: ${targetPath}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`${fieldName} must be a directory: ${targetPath}`);
  }
}

function assertNoSymlinkInPath(rootPath, targetPath) {
  let currentPath = targetPath;
  while (true) {
    if (fs.existsSync(currentPath) && fs.lstatSync(currentPath).isSymbolicLink()) {
      throw new Error(`Symlinks are not allowed in --screenshot-dir path: ${currentPath}`);
    }
    if (currentPath === rootPath) {
      break;
    }
    const parent = path.dirname(currentPath);
    if (parent === currentPath) {
      throw new Error(`--screenshot-dir must be inside safe output root: ${rootPath}`);
    }
    currentPath = parent;
  }
}

function resolveSafeOutputDir(screenshotDir, safeOutputRoot) {
  const rootPath = path.resolve(safeOutputRoot);
  ensureExistingDirectory(rootPath, "--safe-output-root");
  const outputPath = path.resolve(screenshotDir);
  if (!isWithinRoot(rootPath, outputPath)) {
    throw new Error(`--screenshot-dir must be inside safe output root: ${rootPath}`);
  }
  assertNoSymlinkInPath(rootPath, outputPath);
  return outputPath;
}

function parseArgs(argv) {
  const args = {
    url: null,
    iterations: 3,
    pauseMs: 250,
    headless: true,
    screenshotDir: "output/web-game",
    safeOutputRoot: process.cwd(),
    allowRemote: false,
    actionsFile: null,
    actionsJson: null,
    click: null,
    clickSelector: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--url" && next) {
      args.url = next;
      i++;
    } else if (arg === "--iterations" && next) {
      args.iterations = parseBoundedInteger(next, "--iterations", 1, MAX_ITERATIONS);
      i++;
    } else if (arg === "--pause-ms" && next) {
      args.pauseMs = parseBoundedInteger(next, "--pause-ms", 0, MAX_PAUSE_MS);
      i++;
    } else if (arg === "--headless" && next) {
      args.headless = parseBoolean(next, "--headless");
      i++;
    } else if (arg === "--screenshot-dir" && next) {
      args.screenshotDir = next;
      i++;
    } else if (arg === "--safe-output-root" && next) {
      args.safeOutputRoot = next;
      i++;
    } else if (arg === "--allow-remote") {
      args.allowRemote = true;
    } else if (arg === "--actions-file" && next) {
      args.actionsFile = next;
      i++;
    } else if (arg === "--actions-json" && next) {
      args.actionsJson = next;
      i++;
    } else if (arg === "--click" && next) {
      args.click = parseClick(next);
      i++;
    } else if (arg === "--click-selector" && next) {
      args.clickSelector = next;
      i++;
    }
  }
  if (!args.url) {
    throw new Error("--url is required");
  }
  validateTargetUrl(args.url, args.allowRemote);
  return args;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeWriteFile(targetPath, data) {
  if (fs.existsSync(targetPath)) {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink: ${targetPath}`);
    }
    if (!stat.isFile()) {
      throw new Error(`Refusing to overwrite non-file path: ${targetPath}`);
    }
  }
  fs.writeFileSync(targetPath, data);
}

function makeVirtualTimeShim() {
  return `(() => {
    const pending = new Set();
    const origSetTimeout = window.setTimeout.bind(window);
    const origSetInterval = window.setInterval.bind(window);
    const origRequestAnimationFrame = window.requestAnimationFrame.bind(window);

    window.__vt_pending = pending;

    window.setTimeout = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetTimeout(() => {
        pending.delete(task);
        fn(...rest);
      }, t);
    };

    window.setInterval = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetInterval(() => {
        fn(...rest);
      }, t);
    };

    window.requestAnimationFrame = (fn) => {
      const task = {};
      pending.add(task);
      return origRequestAnimationFrame((ts) => {
        pending.delete(task);
        fn(ts);
      });
    };

    window.advanceTime = (ms) => {
      return new Promise((resolve) => {
        const start = performance.now();
        function step(now) {
          if (now - start >= ms) return resolve();
          origRequestAnimationFrame(step);
        }
        origRequestAnimationFrame(step);
      });
    };

    window.__drainVirtualTimePending = () => pending.size;
  })();`;
}

async function getCanvasHandle(page) {
  const handle = await page.evaluateHandle(() => {
    let best = null;
    let bestArea = 0;
    for (const canvas of document.querySelectorAll("canvas")) {
      const area = (canvas.width || canvas.clientWidth || 0) * (canvas.height || canvas.clientHeight || 0);
      if (area > bestArea) {
        bestArea = area;
        best = canvas;
      }
    }
    return best;
  });
  return handle.asElement();
}

async function captureCanvasPngBase64(canvas) {
  return canvas.evaluate((c) => {
    if (!c || typeof c.toDataURL !== "function") return "";
    const data = c.toDataURL("image/png");
    const idx = data.indexOf(",");
    return idx === -1 ? "" : data.slice(idx + 1);
  });
}

async function isCanvasTransparent(canvas) {
  if (!canvas) return true;
  return canvas.evaluate((c) => {
    try {
      const w = c.width || c.clientWidth || 0;
      const h = c.height || c.clientHeight || 0;
      if (!w || !h) return true;
      const size = Math.max(1, Math.min(16, w, h));
      const probe = document.createElement("canvas");
      probe.width = size;
      probe.height = size;
      const ctx = probe.getContext("2d");
      if (!ctx) return true;
      ctx.drawImage(c, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) return false;
      }
      return true;
    } catch {
      return false;
    }
  });
}

async function captureScreenshot(page, canvas, outPath) {
  let buffer = null;
  let base64 = canvas ? await captureCanvasPngBase64(canvas) : "";
  if (base64) {
    buffer = Buffer.from(base64, "base64");
    const transparent = canvas ? await isCanvasTransparent(canvas) : false;
    if (transparent) buffer = null;
  }
  if (!buffer && canvas) {
    try {
      buffer = await canvas.screenshot({ type: "png" });
    } catch {
      buffer = null;
    }
  }
  if (!buffer) {
    const bbox = canvas ? await canvas.boundingBox() : null;
    if (bbox) {
      buffer = await page.screenshot({
        type: "png",
        omitBackground: false,
        clip: bbox,
      });
    } else {
      buffer = await page.screenshot({ type: "png", omitBackground: false });
    }
  }
  safeWriteFile(outPath, buffer);
}

class ConsoleErrorTracker {
  constructor() {
    this._seen = new Set();
    this._errors = [];
  }

  ingest(err) {
    const key = JSON.stringify(err);
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this._errors.push(err);
  }

  drain() {
    const next = [...this._errors];
    this._errors = [];
    return next;
  }
}

async function doChoreography(page, canvas, steps) {
  for (const step of steps) {
    const buttons = new Set(step.buttons || []);
    for (const button of buttons) {
      if (button === "left_mouse_button" || button === "right_mouse_button") {
        const bbox = canvas ? await canvas.boundingBox() : null;
        if (!bbox) continue;
        const x = typeof step.mouse_x === "number" ? step.mouse_x : bbox.width / 2;
        const y = typeof step.mouse_y === "number" ? step.mouse_y : bbox.height / 2;
        await page.mouse.move(bbox.x + x, bbox.y + y);
        await page.mouse.down({ button: button === "left_mouse_button" ? "left" : "right" });
      } else if (buttonNameToKey[button]) {
        await page.keyboard.down(buttonNameToKey[button]);
      }
    }

    const frames = step.frames || 1;
    for (let i = 0; i < frames; i++) {
      await page.evaluate(async () => {
        if (typeof window.advanceTime === "function") {
          await window.advanceTime(1000 / 60);
        }
      });
    }

    for (const button of buttons) {
      if (button === "left_mouse_button" || button === "right_mouse_button") {
        await page.mouse.up({ button: button === "left_mouse_button" ? "left" : "right" });
      } else if (buttonNameToKey[button]) {
        await page.keyboard.up(buttonNameToKey[button]);
      }
    }
  }
}

async function main() {
  const chromium = await resolveChromium();
  const args = parseArgs(process.argv);
  const safeScreenshotDir = resolveSafeOutputDir(args.screenshotDir, args.safeOutputRoot);
  ensureDir(safeScreenshotDir);

  const browser = await chromium.launch({
    headless: args.headless,
    args: ["--use-gl=angle", "--use-angle=swiftshader"],
  });
  const page = await browser.newPage();
  const consoleErrors = new ConsoleErrorTracker();

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    consoleErrors.ingest({ type: "console.error", text: msg.text() });
  });
  page.on("pageerror", (err) => {
    consoleErrors.ingest({ type: "pageerror", text: String(err) });
  });

  await page.addInitScript({ content: makeVirtualTimeShim() });
  await page.goto(args.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("resize"));
  });

  let canvas = await getCanvasHandle(page);

  if (args.clickSelector) {
    try {
      await page.click(args.clickSelector, { timeout: 5000 });
      await page.waitForTimeout(250);
    } catch (err) {
      console.warn("Failed to click selector", args.clickSelector, err);
    }
  }
  let rawSteps = null;
  if (args.actionsFile) {
    rawSteps = readActionsFile(args.actionsFile);
  } else if (args.actionsJson) {
    if (Buffer.byteLength(args.actionsJson, "utf-8") > MAX_ACTION_JSON_BYTES) {
      throw new Error("--actions-json is too large");
    }
    const parsed = JSON.parse(args.actionsJson);
    rawSteps = parseActionsPayload(parsed);
  } else if (args.click) {
    rawSteps = [
      {
        buttons: ["left_mouse_button"],
        frames: 2,
        mouse_x: args.click.x,
        mouse_y: args.click.y,
      },
    ];
  }
  if (!rawSteps) {
    throw new Error("Actions are required. Use --actions-file, --actions-json, or --click.");
  }
  const steps = normalizeSteps(rawSteps, args.iterations);

  for (let i = 0; i < args.iterations; i++) {
    if (!canvas) canvas = await getCanvasHandle(page);
    await doChoreography(page, canvas, steps);
    await sleep(args.pauseMs);

    const shotPath = path.join(safeScreenshotDir, `shot-${i}.png`);
    await captureScreenshot(page, canvas, shotPath);

    const text = await page.evaluate(() => {
      if (typeof window.render_game_to_text === "function") {
        return window.render_game_to_text();
      }
      return null;
    });
    if (text) {
      safeWriteFile(path.join(safeScreenshotDir, `state-${i}.json`), text);
    }

    const freshErrors = consoleErrors.drain();
    if (freshErrors.length) {
      safeWriteFile(
        path.join(safeScreenshotDir, `errors-${i}.json`),
        JSON.stringify(freshErrors, null, 2)
      );
      break;
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
