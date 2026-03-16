import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, createGameController, actionFromKey } from "../src/game-core.js";

test("maps required controls", () => {
  assert.equal(actionFromKey("Enter"), "start");
  assert.equal(actionFromKey("p"), "pause");
  assert.equal(actionFromKey("R"), "reset");
});

test("controller advances deterministic game state after start", () => {
  const controller = createGameController(createInitialState());
  controller.dispatch("start");
  controller.advance(2000);
  const state = controller.getState();

  assert.equal(state.mode, "playing");
  assert.ok(Array.isArray(state.boardRows));
  assert.equal(state.boardRows.length, 12);
});

test("special bean clear increases special trigger count", () => {
  const controller = createGameController(createInitialState());
  controller.dispatch("load_scripted_special_clear");
  controller.dispatch("hard_drop");
  const state = controller.getState();

  assert.ok(state.specialsTriggered >= 1);
  assert.ok(state.score >= 120);
});
