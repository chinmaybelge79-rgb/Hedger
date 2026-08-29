# AGENTS.md

## Project Architecture

- Single-file SPA: `Frontend/index.html` (CSS + JS + HTML in one file, ~1150 lines). No build step, no framework.
- Logo images are base64-encoded PNGs embedded in HTML (two copies: `.light` and `.dark` classes). The `.dark` variant has `filter: invert(1)` in light mode and `filter: none` in dark mode — inverted from what you'd expect.
- Ticker data (priceHistory, income, balance, cashflow) is hardcoded in a JS object for 4 tickers: MSFT, AAPL, NVDA, GOOGL. ~120 lines of data.
- Chart uses SVG with catmull-rom spline smoothing. ViewBox is 800×400; legend at y=h-16 inside viewBox.

## Hidden Pitfalls

- `sed` with base64 data fails silently — base64 strings contain `/`, `+`, `=` which break sed delimiters. Use Node.js `fs.readFileSync` + `string.replace()` for any edit touching lines near base64 content.
- The `.profile-panel` CSS sets `width: 100%` on all child `button` elements. Any toggle/button inside the panel needs `width: Xpx !important` to prevent stretching.
- `preview_type` tool does not fire DOM `input` event listeners in the headless webview. Use `preview_evaluate` with `renderCmdResults(value)` directly instead of typing into inputs.
- `head -N` + `tail -n +M` file splicing fails when line variables are empty (sed regex didn't match). Always verify `grep -n` results before using them in splice operations.
- `launchctl submit` creates a one-shot job that may not persist. Use `~/Library/LaunchAgents/*.plist` with `KeepAlive` for persistent dev servers.

## User Preferences

- Dark mode toggle, reading mode toggle: compact pill switches (40×22px), not oversized. Remove emojis from labels.
- Reading mode = warm colors ONLY (#f5f0e8 bg, #3d3426 text). Do not change font-size, line-height, max-width, or any structural properties.
- Logo: text-only "HEDGER" in nav (no image icon). Light mode = inverted logo (white bg, black H). Dark mode = original logo (black bg, white H).
- Chart benchmark lines: inflation (2.5%), 7%/10%/15% CAGR from start price. Legend at bottom of chart.
- Nav search bar should be elongated (flex:1, max-width:400px) and also duplicated below the hero tagline.

## Commands

- Dev server: `node /tmp/hedger_server.js` (port 5173) or `python3 -m http.server` from `Frontend/`
- No build/test commands — validation is done via live browser assertions with `preview_evaluate`
- Git commits follow style: `action: short description` (e.g., "Rebuild frontend: clean CSS, fix ticker data bugs")
