# fantasy-draft

A single-page assistant for running a **live, in-person** fantasy football draft. The real draft happens on a whiteboard with stickers; this app runs alongside it as a personal tool to track every pick as it happens, keep the pool of available players current, and help you decide who to take when you're on the clock.

Built with React 19 + TypeScript + Vite. Everything runs locally in the browser — no backend, no accounts. Draft state and the player pool persist to `localStorage`, so a refresh (or a closed laptop) won't lose the board.

## League setup

- 12-manager snake draft (order reverses each round).
- 16 rounds.
- Managers and which one is *you* (`myManagerId`) are configured in `defaultSettings` in `src/App.tsx`.
- Rankings come from a bundled FantasyPros 2026 CSV, enriched with depth-chart data (`src/data/`).

## Using it during a draft

- **Record picks as they happen.** The player search box (top right) targets whoever is on the clock. Type a name, use ↑/↓ to highlight, `Enter` to commit. Typing anywhere on the page jumps focus back to that box.
- **Available players** stay in sync — drafted players drop out automatically, grouped by position and tier.
- **Edit any slot** by clicking its cell on the board: set, replace, or clear the player there.
- **Undo** reverts the last change (in-memory history; not persisted across reloads).

## Keepers

Keepers are entered **in advance, before pick 1**, using manual slot entry: click the board cell for the round/manager that owns the keeper and choose the player. Tick **★ Keeper** in that editor to mark it — keeper cells show a gold star and outline so they're easy to tell apart from live picks. You can toggle the flag on an already-placed player without re-picking them.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # eslint
npx vitest       # run unit tests
```

### Project layout

- `src/App.tsx` — top-level wiring, league settings, the on-the-clock picker, and the cell editor.
- `src/draft/` — draft logic: `state.ts` (reducer), `snake.ts` (snake-order math), `selectors.ts`.
- `src/components/` — `DraftBoard`, `PickCell`, `PlayerPicker`, `AvailablePlayers`.
- `src/parse.ts` / `src/parseDepthCharts.ts` — CSV parsing.
- `src/storage.ts` — `localStorage` persistence and integrity checks.
- `src/data/` — bundled rankings and depth-chart CSVs.
