import {
  createInitialState,
  createGameController,
  actionFromKey,
  renderBoardLines,
  renderGameToText,
} from "./game-core.js";

const hudEl = document.getElementById("hud");
const boardEl = document.getElementById("board");

const controller = createGameController(createInitialState());

function draw() {
  const state = controller.getState();
  hudEl.innerHTML = [
    `Mode: <strong>${state.mode}</strong>`,
    `Score: <strong>${state.score}</strong>`,
    `Chains: <strong>${state.lastChain}</strong>`,
    `Specials Used: <strong>${state.specialsTriggered}</strong>`,
  ].join(" | ");
  boardEl.textContent = renderBoardLines(state).join("\n");
}

let rafHandle = 0;
let lastTs = performance.now();
function frame(ts) {
  const delta = ts - lastTs;
  lastTs = ts;
  controller.advance(delta);
  draw();
  rafHandle = requestAnimationFrame(frame);
}

document.addEventListener("keydown", (event) => {
  const action = actionFromKey(event.key);
  if (!action) {
    return;
  }
  event.preventDefault();
  controller.dispatch(action);
  draw();
});

window.advanceTime = (ms) => {
  controller.advance(ms);
  draw();
};

window.render_game_to_text = () => renderGameToText(controller.getState());

window.addEventListener("beforeunload", () => {
  if (rafHandle) {
    cancelAnimationFrame(rafHandle);
  }
});

draw();
rafHandle = requestAnimationFrame(frame);
