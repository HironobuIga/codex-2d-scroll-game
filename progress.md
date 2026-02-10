Original prompt: 現在のプロジェクト設定をベースに2dスクロールゲームを作成する計画を立ててください。

## Progress Notes
- Bootstrapped Vite + TypeScript + Canvas2D files for the new game project.
- Added game modules for physics, camera, input, entities, level data, rendering, and state machine.
- Implemented deterministic hooks: `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Added smoke action payload for Playwright-based gameplay checks.
- Copied `tools/web_game_playwright_client.js` from the `develop-web-game` skill script.
- Validation attempt: `npm run build` currently fails with `sh: tsc: command not found` because dependencies are not installed.
- Validation attempt: `node tools/web_game_playwright_client.js ...` fails with `ERR_MODULE_NOT_FOUND` for `playwright`.
- Added polished SVG asset pack under `src/assets/**` (hero poses, enemy, coin, goal flag, layered backgrounds, tiles, decorations).
- Upgraded renderer to support image assets with fallback primitives and added parallax layer drawing + decoration layers.
- Expanded level layout with richer platform flow, additional enemies/coins, and decorative props.
- Validation updated: `npm run build` succeeds after dependency installation.
- Tried `imagegen` live generation and confirmed it is blocked by missing `OPENAI_API_KEY`.
- Added batch prompt set for `imagegen` at `tools/imagegen/game-assets.jsonl` and validated with `--dry-run`.
- Attempted `npm install -D playwright` for automated screenshot checks; blocked by network (`ENOTFOUND registry.npmjs.org`).
- Tuned jump/movement (`PLAYER_JUMP_SPEED`, `PLAYER_MAX_SPEED_X`) and inserted a mid-step platform at `x:610,y:395` so upper routes are reachable.
- Applied security hardening patch set: baseline CSP meta, test-hook exposure gating, and stricter Playwright helper validation (URL allowlist, safe output root, action budget limits).

## TODO
- Install `playwright` package and browser binaries, then run the scripted gameplay screenshots.
- If AI-generated bitmap assets are desired, set `OPENAI_API_KEY` and run `~/.codex/skills/imagegen/scripts/image_gen.py`.
