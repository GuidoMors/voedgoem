export const SIZE = 22;
export const HALF_W = (Math.sqrt(3) / 2) * SIZE;
export const HALF_H = SIZE / 2;
export const COLS = 20;

// Offsets of the six tile corners from the tile center in half-widths and half-heights. Side s runs from corner s to corner s+1
// (0 NE, 1 E, 2 SE, 3 SW, 4 W, 5 NW), the same convention as sideCorners on the server.
const CORNER_DX = [0, 1, 1, 0, -1, -1];
const CORNER_DY = [-2, -1, 1, 2, 1, -1];

export const corner = (side: number): [number, number] => [CORNER_DX[side % 6] * HALF_W, CORNER_DY[side % 6] * HALF_H];

export const tileCenter = (index: number): [number, number] => {
  const row = Math.floor(index / COLS);
  return [(2 * (index % COLS) + (row & 1)) * HALF_W, 3 * row * HALF_H];
};
