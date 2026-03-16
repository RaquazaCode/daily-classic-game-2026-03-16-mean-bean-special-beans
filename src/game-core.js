export function createInitialState() {
  return {
    mode: "title",
    score: 0,
    lastChain: 0,
    specialsTriggered: 0,
    lines: ["Scaffold pending implementation"],
  };
}

export function createGameController(initialState) {
  let state = structuredClone(initialState);
  return {
    getState() {
      return state;
    },
    dispatch() {
      return state;
    },
    advance() {
      return state;
    },
  };
}

export function actionFromKey(key) {
  const map = {
    Enter: "start",
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowDown: "soft_drop",
    z: "rotate_ccw",
    Z: "rotate_ccw",
    x: "rotate_cw",
    X: "rotate_cw",
    " ": "hard_drop",
    p: "pause",
    P: "pause",
    r: "reset",
    R: "reset",
  };
  return map[key] ?? null;
}

export function renderBoardLines(state) {
  return state.lines;
}

export function renderGameToText(state) {
  return JSON.stringify(state);
}
