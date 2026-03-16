const WIDTH = 6;
const HEIGHT = 12;
const COLORS = ["R", "G", "B", "Y"];
const DROP_INTERVAL_MS = 650;

function emptyBoard() {
  return Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => null));
}

function cloneCell(cell) {
  if (!cell) return null;
  return { color: cell.color, special: Boolean(cell.special) };
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => cloneCell(cell)));
}

function randomFromSeed(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { nextSeed: next, value: next / 4294967296 };
}

function makeBean(seed) {
  const a = randomFromSeed(seed);
  const b = randomFromSeed(a.nextSeed);
  const color = COLORS[Math.floor(a.value * COLORS.length) % COLORS.length];
  const special = b.value < 0.12;
  return { bean: { color, special }, nextSeed: b.nextSeed };
}

function makePair(seed) {
  const first = makeBean(seed);
  const second = makeBean(first.nextSeed);
  return {
    pair: {
      x: 2,
      y: 1,
      orientation: 0,
      beans: [first.bean, second.bean],
    },
    nextSeed: second.nextSeed,
  };
}

function getOffsets(orientation) {
  const normalized = ((orientation % 4) + 4) % 4;
  if (normalized === 0) return [[0, 0], [0, -1]];
  if (normalized === 1) return [[0, 0], [1, 0]];
  if (normalized === 2) return [[0, 0], [0, 1]];
  return [[0, 0], [-1, 0]];
}

function pairCells(pair) {
  const offsets = getOffsets(pair.orientation);
  return offsets.map(([dx, dy], idx) => ({
    x: pair.x + dx,
    y: pair.y + dy,
    bean: pair.beans[idx],
  }));
}

function isBlocked(board, x, y) {
  if (x < 0 || x >= WIDTH || y >= HEIGHT) return true;
  if (y < 0) return false;
  return board[y][x] !== null;
}

function canPlacePair(board, pair) {
  const cells = pairCells(pair);
  for (const cell of cells) {
    if (isBlocked(board, cell.x, cell.y)) {
      return false;
    }
  }
  return true;
}

function attemptMove(state, dx, dy) {
  if (!state.activePair || state.mode !== "playing") return false;
  const candidate = {
    ...state.activePair,
    x: state.activePair.x + dx,
    y: state.activePair.y + dy,
  };
  if (!canPlacePair(state.board, candidate)) {
    return false;
  }
  state.activePair = candidate;
  return true;
}

function attemptRotate(state, delta) {
  if (!state.activePair || state.mode !== "playing") return false;
  const candidate = {
    ...state.activePair,
    orientation: state.activePair.orientation + delta,
  };

  const kicks = [0, -1, 1];
  for (const kick of kicks) {
    const kicked = { ...candidate, x: candidate.x + kick };
    if (canPlacePair(state.board, kicked)) {
      state.activePair = kicked;
      return true;
    }
  }
  return false;
}

function applyGravity(board) {
  for (let x = 0; x < WIDTH; x += 1) {
    let writeY = HEIGHT - 1;
    for (let y = HEIGHT - 1; y >= 0; y -= 1) {
      const cell = board[y][x];
      if (!cell) continue;
      if (writeY !== y) {
        board[writeY][x] = cell;
        board[y][x] = null;
      }
      writeY -= 1;
    }
    for (let y = writeY; y >= 0; y -= 1) {
      board[y][x] = null;
    }
  }
}

function floodGroup(board, x, y, seen) {
  const cell = board[y][x];
  if (!cell) return [];
  const key = `${x},${y}`;
  if (seen.has(key)) return [];

  const color = cell.color;
  const queue = [{ x, y }];
  const group = [];
  seen.add(key);

  while (queue.length > 0) {
    const node = queue.pop();
    group.push(node);

    const neighbors = [
      { x: node.x + 1, y: node.y },
      { x: node.x - 1, y: node.y },
      { x: node.x, y: node.y + 1 },
      { x: node.x, y: node.y - 1 },
    ];

    for (const next of neighbors) {
      if (next.x < 0 || next.x >= WIDTH || next.y < 0 || next.y >= HEIGHT) {
        continue;
      }
      const nextCell = board[next.y][next.x];
      if (!nextCell || nextCell.color !== color) {
        continue;
      }
      const nextKey = `${next.x},${next.y}`;
      if (seen.has(nextKey)) {
        continue;
      }
      seen.add(nextKey);
      queue.push(next);
    }
  }

  return group;
}

function resolveBoard(state) {
  let chain = 0;
  let totalCleared = 0;
  let specialsTriggered = 0;
  let scoreGain = 0;

  while (true) {
    const seen = new Set();
    const toClear = new Set();
    const specialColors = [];

    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (!state.board[y][x]) continue;
        const group = floodGroup(state.board, x, y, seen);
        if (group.length >= 4) {
          for (const node of group) {
            toClear.add(`${node.x},${node.y}`);
            if (state.board[node.y][node.x]?.special) {
              specialsTriggered += 1;
              specialColors.push(state.board[node.y][node.x].color);
            }
          }
        }
      }
    }

    if (toClear.size === 0) {
      break;
    }

    for (const color of specialColors) {
      for (let y = 0; y < HEIGHT; y += 1) {
        for (let x = 0; x < WIDTH; x += 1) {
          const cell = state.board[y][x];
          if (cell && cell.color === color) {
            toClear.add(`${x},${y}`);
          }
        }
      }
    }

    chain += 1;
    let clearedThisWave = 0;
    for (const key of toClear) {
      const [xStr, yStr] = key.split(",");
      const x = Number(xStr);
      const y = Number(yStr);
      if (state.board[y][x]) {
        state.board[y][x] = null;
        clearedThisWave += 1;
      }
    }

    totalCleared += clearedThisWave;
    scoreGain += clearedThisWave * 10 * chain;
    applyGravity(state.board);
  }

  if (specialsTriggered > 0) {
    scoreGain += specialsTriggered * 100;
  }

  return { chain, totalCleared, specialsTriggered, scoreGain };
}

function lockActivePair(state) {
  if (!state.activePair) return;
  const cells = pairCells(state.activePair);
  for (const cell of cells) {
    if (cell.y < 0) {
      state.mode = "gameover";
      state.activePair = null;
      return;
    }
    state.board[cell.y][cell.x] = cloneCell(cell.bean);
  }

  const resolution = resolveBoard(state);
  state.lastChain = resolution.chain;
  state.score += resolution.scoreGain;
  state.totalCleared += resolution.totalCleared;
  state.specialsTriggered += resolution.specialsTriggered;

  state.activePair = null;
  spawnNextPair(state);
}

function spawnNextPair(state) {
  if (state.mode !== "playing") return;

  if (!state.nextPair) {
    const created = makePair(state.rngSeed);
    state.nextPair = created.pair;
    state.rngSeed = created.nextSeed;
  }

  state.activePair = {
    x: 2,
    y: 1,
    orientation: 0,
    beans: [cloneCell(state.nextPair.beans[0]), cloneCell(state.nextPair.beans[1])],
  };

  const created = makePair(state.rngSeed);
  state.nextPair = created.pair;
  state.rngSeed = created.nextSeed;

  if (!canPlacePair(state.board, state.activePair)) {
    state.mode = "gameover";
    state.activePair = null;
  }
}

function beginPlaying(state) {
  state.mode = "playing";
  state.board = emptyBoard();
  state.score = 0;
  state.lastChain = 0;
  state.totalCleared = 0;
  state.specialsTriggered = 0;
  state.dropAccumulatorMs = 0;
  state.activePair = null;
  state.nextPair = null;
  spawnNextPair(state);
}

function loadScriptedSpecialClear(state) {
  beginPlaying(state);
  state.board = emptyBoard();
  state.score = 0;
  state.lastChain = 0;
  state.totalCleared = 0;
  state.specialsTriggered = 0;
  state.nextPair = {
    x: 2,
    y: 1,
    orientation: 0,
    beans: [{ color: "R", special: false }, { color: "B", special: false }],
  };

  state.board[11][2] = { color: "R", special: false };
  state.board[11][3] = { color: "R", special: true };
  state.board[11][4] = { color: "R", special: false };
  state.board[10][4] = { color: "R", special: false };
  state.board[9][1] = { color: "R", special: false };
  state.board[8][5] = { color: "R", special: false };

  state.activePair = {
    x: 3,
    y: 1,
    orientation: 0,
    beans: [{ color: "Y", special: false }, { color: "G", special: false }],
  };
}

function boardWithActive(state) {
  const board = cloneBoard(state.board);
  if (!state.activePair || state.mode === "title") return board;
  for (const cell of pairCells(state.activePair)) {
    if (cell.y < 0 || cell.y >= HEIGHT || cell.x < 0 || cell.x >= WIDTH) continue;
    board[cell.y][cell.x] = cloneCell(cell.bean);
  }
  return board;
}

function symbolForCell(cell) {
  if (!cell) return ".";
  return cell.special ? `${cell.color.toLowerCase()}*` : `${cell.color} `;
}

function rowToText(row) {
  return row.map((cell) => symbolForCell(cell)).join(" ");
}

function toSnapshot(state) {
  const board = boardWithActive(state);
  const boardRows = board.map((row) => rowToText(row));
  return {
    mode: state.mode,
    score: state.score,
    lastChain: state.lastChain,
    totalCleared: state.totalCleared,
    specialsTriggered: state.specialsTriggered,
    dropIntervalMs: state.dropIntervalMs,
    boardRows,
    activePair: state.activePair
      ? {
          x: state.activePair.x,
          y: state.activePair.y,
          orientation: ((state.activePair.orientation % 4) + 4) % 4,
          beans: state.activePair.beans.map((bean) => ({ color: bean.color, special: Boolean(bean.special) })),
        }
      : null,
    nextPair: state.nextPair
      ? {
          beans: state.nextPair.beans.map((bean) => ({ color: bean.color, special: Boolean(bean.special) })),
        }
      : null,
  };
}

export function createInitialState() {
  return {
    mode: "title",
    score: 0,
    lastChain: 0,
    totalCleared: 0,
    specialsTriggered: 0,
    board: emptyBoard(),
    activePair: null,
    nextPair: null,
    rngSeed: 1337,
    dropAccumulatorMs: 0,
    dropIntervalMs: DROP_INTERVAL_MS,
  };
}

export function createGameController(initialState) {
  let state = structuredClone(initialState);

  return {
    getState() {
      return toSnapshot(state);
    },
    dispatch(action) {
      if (action === "start") {
        if (state.mode === "title" || state.mode === "gameover") {
          beginPlaying(state);
        }
        return toSnapshot(state);
      }
      if (action === "pause") {
        if (state.mode === "playing") state.mode = "paused";
        else if (state.mode === "paused") state.mode = "playing";
        return toSnapshot(state);
      }
      if (action === "reset") {
        state = createInitialState();
        return toSnapshot(state);
      }
      if (action === "load_scripted_special_clear") {
        loadScriptedSpecialClear(state);
        return toSnapshot(state);
      }

      if (state.mode !== "playing") {
        return toSnapshot(state);
      }

      if (action === "left") attemptMove(state, -1, 0);
      else if (action === "right") attemptMove(state, 1, 0);
      else if (action === "soft_drop") {
        if (!attemptMove(state, 0, 1)) {
          lockActivePair(state);
        } else {
          state.score += 1;
        }
      } else if (action === "hard_drop") {
        while (attemptMove(state, 0, 1)) {
          state.score += 1;
        }
        lockActivePair(state);
      } else if (action === "rotate_cw") {
        attemptRotate(state, 1);
      } else if (action === "rotate_ccw") {
        attemptRotate(state, -1);
      }

      return toSnapshot(state);
    },
    advance(ms) {
      if (state.mode !== "playing") {
        return toSnapshot(state);
      }

      state.dropAccumulatorMs += Math.max(0, ms);
      while (state.dropAccumulatorMs >= state.dropIntervalMs && state.mode === "playing") {
        state.dropAccumulatorMs -= state.dropIntervalMs;
        if (!attemptMove(state, 0, 1)) {
          lockActivePair(state);
        }
      }
      return toSnapshot(state);
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

export function renderBoardLines(snapshot) {
  const lines = [
    "Columns: 1  2  3  4  5  6",
    ...snapshot.boardRows,
    `Mode: ${snapshot.mode} | Score: ${snapshot.score} | Chain: ${snapshot.lastChain}`,
  ];
  if (snapshot.mode === "title") {
    lines.push("Press Enter to start");
  }
  if (snapshot.mode === "paused") {
    lines.push("Paused: press P to resume");
  }
  if (snapshot.mode === "gameover") {
    lines.push("Game over: press Enter to restart");
  }
  return lines;
}

export function renderGameToText(snapshot) {
  return JSON.stringify(snapshot);
}
