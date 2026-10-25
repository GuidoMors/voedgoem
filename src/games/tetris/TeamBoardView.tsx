import { useEffect, useRef } from "react";
import { PIECE_COLORS } from "./engine";
import type { TeamSnapshot } from "./types";

interface Props {
  team: TeamSnapshot;
  cellSize: number;
  // The viewer's own piece gets a ghost and a bright outline.
  myId?: string;
  dim?: boolean;
}

const LANE_WIDTH = 10;

export function TeamBoardView({ team, cellSize, myId, dim }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = team.width * cellSize;
  const height = team.rows * cellSize;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(255,255,255,0.04)";
    context.fillRect(0, 0, width, height);

    // Lane dividers show where each member's pieces enter.
    context.strokeStyle = "rgba(255,255,255,0.25)";
    context.lineWidth = 1;
    for (let lane = 1; lane < team.width / LANE_WIDTH; lane++) {
      context.beginPath();
      context.moveTo(lane * LANE_WIDTH * cellSize + 0.5, 0);
      context.lineTo(lane * LANE_WIDTH * cellSize + 0.5, height);
      context.stroke();
    }

    for (let index = 0; index < team.board.length; index++) {
      const value = Number(team.board[index]);
      if (!value) continue;
      context.fillStyle = PIECE_COLORS[value];
      context.fillRect((index % team.width) * cellSize + 1, Math.floor(index / team.width) * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    for (const piece of team.pieces) {
      const color = PIECE_COLORS[piece.type];
      if (piece.id === myId) {
        context.strokeStyle = color;
        context.globalAlpha = 0.5;
        for (const [x, y] of piece.ghost) context.strokeRect(x * cellSize + 1.5, y * cellSize + 1.5, cellSize - 3, cellSize - 3);
        context.globalAlpha = 1;
      }
      for (const [x, y] of piece.cells) {
        context.fillStyle = color;
        context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
        if (piece.id === myId) {
          context.strokeStyle = "#fff";
          context.lineWidth = 2;
          context.strokeRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
          context.lineWidth = 1;
        }
      }
    }
  }, [team, cellSize, myId, width, height]);

  return <canvas ref={canvas} className={`board-canvas team-canvas ${dim ? "dim" : ""}`} width={width} height={height} />;
}
