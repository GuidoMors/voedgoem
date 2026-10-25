import { useEffect, useRef } from "react";
import { COLS, GHOST_OFFSET, PIECE_COLORS, ROWS } from "./engine";

interface Props {
  cells: number[];
  cellSize: number;
  dim?: boolean;
}

export function BoardView({ cells, cellSize, dim }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, COLS * cellSize, ROWS * cellSize);
    context.fillStyle = "rgba(255,255,255,0.04)";
    context.fillRect(0, 0, COLS * cellSize, ROWS * cellSize);
    cells.forEach((value, index) => {
      if (!value) return;
      const x = (index % COLS) * cellSize;
      const y = Math.floor(index / COLS) * cellSize;
      const ghost = value > GHOST_OFFSET;
      const color = PIECE_COLORS[ghost ? value - GHOST_OFFSET : value];
      if (ghost) {
        context.strokeStyle = color;
        context.globalAlpha = 0.5;
        context.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
        context.globalAlpha = 1;
      } else {
        context.fillStyle = color;
        context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      }
    });
  }, [cells, cellSize]);

  return <canvas ref={canvas} className={`board-canvas ${dim ? "dim" : ""}`} width={COLS * cellSize} height={ROWS * cellSize} />;
}

export const parseBoard = (board: string): number[] =>
  board.length === COLS * ROWS ? Array.from(board, char => Number(char)) : Array<number>(COLS * ROWS).fill(0);
