# Design - Mean Bean Special Beans

## Goal
Ship a deterministic single-player falling-bean puzzle MVP inspired by Dr. Robotnik's Mean Bean Machine with one twist: special beans that trigger color-wide clears.

## MVP Scope
- 6x12 board, falling two-bean pieces, lateral/rotation/drop controls.
- Resolve clears for groups >= 4 with gravity and chain processing.
- Deterministic piece stream to make test and capture runs stable.
- Score system with per-bean clear points, chain multipliers, and special-trigger bonus.
- Pause/reset/restart controls and game-over handling.

## Determinism and Automation
- Fixed-seed RNG and pure update loop.
- `window.advanceTime(ms)` advances the simulation without real-time input.
- `window.render_game_to_text()` emits a JSON snapshot with score, mode, chains, piece state, and board rows.
