# Security Best Practices Report

## Executive summary
対象は TypeScript + Vite のフロントエンドゲームと、Node.js 製のローカル Playwright 補助ツールです。`Critical`/`High` はありませんが、防御層の有効性を下げる CSP 設定と、ファイル出力制限のバイパス余地を確認しました。優先度は `Medium` 2件、`Low` 2件です。

## Scope and method
- In scope: `index.html`, `src/**`, `tools/web_game_playwright_client.js`, `package.json`
- Stack evidence:
  - Frontend: TypeScript + Vite (`package.json:6`, `package.json:11`)
  - Entrypoint: `src/main.ts:1`
  - Local tool: `tools/web_game_playwright_client.js:1`
- Security guidance used:
  - `/Users/hironobu.iga/.codex/skills/security-best-practices/references/javascript-general-web-frontend-security.md`

## Critical findings
- なし

## High findings
- なし

## Medium findings

### SBP-001: 出力先ルート制限がシンボリックリンクで迂回可能
- Rule ID: JS-GEN-LOCAL-001
- Severity: Medium
- Location: `tools/web_game_playwright_client.js:158`, `tools/web_game_playwright_client.js:161`, `tools/web_game_playwright_client.js:420`, `tools/web_game_playwright_client.js:484`
- Evidence:
  - `resolveSafeOutputDir()` が `path.resolve()` + `path.relative()` でのみ判定している。
  - 実際の書き込みは `fs.writeFileSync(path.join(safeScreenshotDir, ...))`。
- Impact:
  - `safeScreenshotDir` 配下に symlink があると、意図したルート外への書き込みが発生し得ます（CI/共有環境でのファイル破壊リスク）。
- Fix:
  - `safeOutputRoot` と出力先の実体パスを `fs.realpathSync` ベースで比較する。
  - 出力先ディレクトリが symlink でないことを `lstat` で検証する。
  - 可能なら `safe-output-root` は固定値にし、CLI 引数での任意変更を避ける。
- Mitigation:
  - CI では一時ディレクトリを専用に作成し、その外への書き込み権限を与えない。
- False positive notes:
  - 単独ローカル利用のみで symlink を作らない運用なら実害可能性は低いです。

### SBP-002: `connect-src` が広すぎ、CSP の外向き通信制限が弱い
- Rule ID: JS-CSP-001
- Severity: Medium
- Location: `index.html:8`
- Evidence:
  - `connect-src 'self' ws: wss:;`
- Impact:
  - 何らかのスクリプト実行が成立した場合、任意の WebSocket 宛先への通信を許し、データ持ち出し抑止力が下がります。
- Fix:
  - 本番 CSP は `connect-src 'self'` を基本にし、開発時のみ必要な接続先を別ポリシーで許可する。
- Mitigation:
  - 開発/本番で CSP を分離し、本番ビルドに開発向け `ws:` 許可を残さない。
- False positive notes:
  - 開発中の HMR には追加許可が必要な場合があります。

## Low findings

### SBP-003: `style-src 'unsafe-inline'` によりスタイル注入耐性が低下
- Rule ID: JS-CSP-002
- Severity: Low
- Location: `index.html:8`
- Evidence:
  - `style-src 'self' 'unsafe-inline';`
- Impact:
  - スタイル注入による UI 偽装やクリック誘導を防ぎにくくなります。
- Fix:
  - 可能な範囲で inline style を減らし、`style-src 'self'` を目指す。
  - 難しい場合は、適用理由をドキュメント化した上で限定的に許可する。
- Mitigation:
  - `script-src` を厳格に保ち、DOM への未検証 HTML 挿入を継続的に禁止する。
- False positive notes:
  - 本件は即時 RCE を意味するものではなく、主に防御層の強度低下です。

### SBP-004: Meta CSP のため `frame-ancestors` を強制できない
- Rule ID: JS-CSP-003
- Severity: Low
- Location: `index.html:7`
- Evidence:
  - CSP は `<meta http-equiv="Content-Security-Policy">` で配信されている。
- Impact:
  - クリックジャッキング対策として有効な `frame-ancestors` は meta 配信では効かず、ヘッダ側設定が別途必要です。
- Fix:
  - 配信基盤で `Content-Security-Policy` ヘッダを設定し、`frame-ancestors 'none'`（または許可先限定）を明示する。
- Mitigation:
  - 最低限、公開環境でレスポンスヘッダの実効値を検証する。
- False positive notes:
  - 既に CDN/リバースプロキシでヘッダ設定済みなら本件は解消済みです（リポジトリ内では未確認）。

## Positive observations
- 代表的な DOM XSS シンク（`innerHTML`, `document.write`, `eval`, `new Function`）は `src/**` と `tools/**` で未検出。
- Playwright 補助ツールは URL スキーム制限、localhost デフォルト制限、入力上限（step/frame/size）を実装済み（`tools/web_game_playwright_client.js:5`, `tools/web_game_playwright_client.js:136`, `tools/web_game_playwright_client.js:188`, `tools/web_game_playwright_client.js:459`）。
- テスト用フックは本番常時公開ではなく、`import.meta.env.DEV` または明示フラグ時のみ公開（`src/main.ts:33`, `src/main.ts:86`）。

## Recommended execution order
1. `SBP-001`（出力先制約の実体パス検証）
2. `SBP-002`（本番 CSP の `connect-src` 引き締め）
3. `SBP-004`（ヘッダ CSP 導入で `frame-ancestors` を有効化）
4. `SBP-003`（`unsafe-inline` 依存の段階的削減）
