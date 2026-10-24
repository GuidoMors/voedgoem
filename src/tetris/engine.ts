export const COLS = 10;
export const ROWS = 20;

// Piece ids 1..7 are I, O, T, S, Z, J, L.
const BASE_SHAPES: Record<number, number[][]> = {
  1: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  2: [[1, 1], [1, 1]],
  3: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  4: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  5: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  6: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  7: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
};

const rotateMatrix = (matrix: number[][]) => matrix[0].map((_, x) => matrix.map(row => row[x]).reverse());

const SHAPES: Record<number, number[][][]> = {};
for (const [type, base] of Object.entries(BASE_SHAPES)) {
  const rotations = [base];
  for (let i = 1; i < 4; i++) rotations.push(rotateMatrix(rotations[i - 1]));
  SHAPES[Number(type)] = rotations;
}

export const PIECE_COLORS = ["", "#22d3ee", "#facc15", "#a855f7", "#4ade80", "#f87171", "#3b82f6", "#fb923c"];
export const GHOST_OFFSET = 8; // view cells 9..15 are ghost versions of pieces 1..7

const LINE_SCORES = [0, 100, 300, 500, 800];
const KICKS: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Piece {
  type: number;
  rotation: number;
  x: number;
  y: number;
}

export class TetrisGame {
  board: number[][] = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
  piece: Piece | null = null;
  queue: number[] = [];
  score = 0;
  lines = 0;
  over = false;
  private random: () => number;

  constructor(seed: number) {
    this.random = mulberry32(seed);
    this.spawn();
  }

  get level() {
    return Math.floor(this.lines / 10) + 1;
  }

  get gravityMs() {
    return Math.max(70, 800 - (this.level - 1) * 65);
  }

  get next() {
    return this.queue[0];
  }

  private refill() {
    while (this.queue.length < 7) {
      const bag = [1, 2, 3, 4, 5, 6, 7];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }

  private spawn() {
    this.refill();
    const type = this.queue.shift()!;
    const width = SHAPES[type][0].length;
    this.piece = { type, rotation: 0, x: Math.floor((COLS - width) / 2), y: type === 1 ? -1 : 0 };
    if (this.collides(this.piece)) {
      this.over = true;
      this.piece = null;
    }
    this.refill();
  }

  private cells(piece: Piece): [number, number][] {
    const result: [number, number][] = [];
    SHAPES[piece.type][piece.rotation].forEach((row, dy) => row.forEach((filled, dx) => {
      if (filled) result.push([piece.x + dx, piece.y + dy]);
    }));
    return result;
  }

  private collides(piece: Piece) {
    return this.cells(piece).some(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x] !== 0));
  }

  private tryMove(dx: number, dy: number) {
    if (!this.piece || this.over) return false;
    const moved = { ...this.piece, x: this.piece.x + dx, y: this.piece.y + dy };
    if (this.collides(moved)) return false;
    this.piece = moved;
    return true;
  }

  moveLeft() { return this.tryMove(-1, 0); }
  moveRight() { return this.tryMove(1, 0); }

  rotate(direction: 1 | -1) {
    if (!this.piece || this.over) return false;
    const rotation = (this.piece.rotation + direction + 4) % 4;
    for (const [kx, ky] of KICKS) {
      const candidate = { ...this.piece, rotation, x: this.piece.x + kx, y: this.piece.y + ky };
      if (!this.collides(candidate)) {
        this.piece = candidate;
        return true;
      }
    }
    return false;
  }

  softDrop() {
    if (this.tryMove(0, 1)) {
      this.score += 1;
      return true;
    }
    return false;
  }

  hardDrop() {
    if (!this.piece || this.over) return;
    let distance = 0;
    while (this.tryMove(0, 1)) distance++;
    this.score += distance * 2;
    this.lock();
  }

  // Advances gravity by one step; locks the piece when it can't fall further.
  tick() {
    if (this.over) return;
    if (!this.tryMove(0, 1)) this.lock();
  }

  private lock() {
    if (!this.piece) return;
    for (const [x, y] of this.cells(this.piece)) {
      if (y < 0) {
        this.over = true;
        this.piece = null;
        return;
      }
      this.board[y][x] = this.piece.type;
    }
    const remaining = this.board.filter(row => row.some(cell => cell === 0));
    const cleared = ROWS - remaining.length;
    if (cleared > 0) {
      this.score += LINE_SCORES[cleared] * this.level;
      this.lines += cleared;
      this.board = [...Array.from({ length: cleared }, () => Array<number>(COLS).fill(0)), ...remaining];
    }
    this.spawn();
  }

  private ghostPiece(): Piece | null {
    if (!this.piece) return null;
    let ghost = this.piece;
    while (!this.collides({ ...ghost, y: ghost.y + 1 })) ghost = { ...ghost, y: ghost.y + 1 };
    return ghost;
  }

  // Locked cells plus the falling piece (0..7), as sent to the server and spectators.
  serialize(): string {
    const grid = this.board.map(row => [...row]);
    if (this.piece) for (const [x, y] of this.cells(this.piece)) if (y >= 0) grid[y][x] = this.piece.type;
    return grid.flat().join("");
  }

  // Same as serialize but also draws the ghost piece, for the local player's own view.
  viewCells(): number[] {
    const grid = this.board.map(row => [...row]);
    const ghost = this.ghostPiece();
    if (ghost) for (const [x, y] of this.cells(ghost)) if (y >= 0 && grid[y][x] === 0) grid[y][x] = ghost.type + GHOST_OFFSET;
    if (this.piece) for (const [x, y] of this.cells(this.piece)) if (y >= 0) grid[y][x] = this.piece.type;
    return grid.flat();
  }
}

export const previewShape = (type: number) => SHAPES[type][0].filter(row => row.some(Boolean));
