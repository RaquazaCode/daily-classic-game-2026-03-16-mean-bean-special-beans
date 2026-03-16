# Implementation Plan - 2026-03-16 Mean Bean Special Beans

1. Write failing core tests for start flow, board dimensions, and special-bean scoring behavior.
2. Implement deterministic puzzle loop with movement, rotation, lock, clear, gravity, scoring, and game state transitions.
3. Wire browser controls + hooks (`advanceTime`, `render_game_to_text`).
4. Add Playwright deterministic scenario with schema-compliant action payload artifacts.
5. Run install/test/build/capture and record outcomes.
6. Complete git/GitHub/PR/deploy flow and reconcile automation records.
