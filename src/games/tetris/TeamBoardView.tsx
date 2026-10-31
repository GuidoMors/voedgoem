import { useEffect, useRef, useState } from "react";
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
const MOBILE_VIEW_COLUMNS = 20;
const DESKTOP_VIEW_COLUMNS = 50;

export function TeamBoardView({ team, cellSize, myId, dim }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const mobileCanvas = useRef<HTMLCanvasElement>(null);
  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const [mobileCellSize, setMobileCellSize] = useState(() => Math.max(8, Math.min(20, Math.floor((window.innerWidth - 64) / MOBILE_VIEW_COLUMNS))));
  const isPlayerBoard = myId !== undefined;
  const mobileColumns = Math.min(team.width, isPlayerBoard ? MOBILE_VIEW_COLUMNS : team.width);
  const mobileWidth = mobileColumns * mobileCellSize;
  const mobileHeight = team.rows * mobileCellSize;
  const desktopColumns = Math.min(team.width, isPlayerBoard ? DESKTOP_VIEW_COLUMNS : team.width);
  const desktopWidth = desktopColumns * cellSize;
  const desktopHeight = team.rows * cellSize;

  useEffect(() => {
    const resize = () => setMobileCellSize(Math.max(8, Math.min(20, Math.floor((window.innerWidth - 64) / MOBILE_VIEW_COLUMNS))));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const draw = (target: HTMLCanvasElement | null, size: number, columns: number, startColumn: number) => {
      const context = target?.getContext("2d");
      if (!context) return;
      const targetWidth = columns * size;
      const targetHeight = team.rows * size;
      context.clearRect(0, 0, targetWidth, targetHeight);
      context.fillStyle = "rgba(255,255,255,0.04)";
      context.fillRect(0, 0, targetWidth, targetHeight);

      // Lane dividers show where each member's pieces enter.
      context.save();
      context.translate(-startColumn * size, 0);
      context.beginPath();
      context.rect(startColumn * size, 0, targetWidth, targetHeight);
      context.clip();
      context.strokeStyle = "rgba(255,255,255,0.25)";
      context.lineWidth = 1;
      for (let lane = 1; lane < team.width / LANE_WIDTH; lane++) {
        context.beginPath();
        context.moveTo(lane * LANE_WIDTH * size + 0.5, 0);
        context.lineTo(lane * LANE_WIDTH * size + 0.5, targetHeight);
        context.stroke();
      }

      for (let index = 0; index < team.board.length; index++) {
        const value = Number(team.board[index]);
        if (!value) continue;
        context.fillStyle = PIECE_COLORS[value];
        context.fillRect((index % team.width) * size + 1, Math.floor(index / team.width) * size + 1, size - 2, size - 2);
      }

      for (const piece of team.pieces) {
        const color = PIECE_COLORS[piece.type];
        if (piece.id === myId) {
          context.strokeStyle = color;
          context.globalAlpha = 0.5;
          for (const [x, y] of piece.ghost) context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);
          context.globalAlpha = 1;
        }
        for (const [x, y] of piece.cells) {
          context.fillStyle = color;
          context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
          if (piece.id === myId) {
            context.strokeStyle = "#fff";
            context.lineWidth = 2;
            context.strokeRect(x * size + 2, y * size + 2, size - 4, size - 4);
            context.lineWidth = 1;
          }
        }
      }
      context.restore();
    };

    const myPiece = team.pieces.find(piece => piece.id === myId);
    const laneIndex = team.members.findIndex(member => member.id === myId);
    const focusColumn = myPiece?.cells.length
      ? myPiece.cells.reduce((sum, [x]) => sum + x, 0) / myPiece.cells.length
      : laneIndex >= 0 ? laneIndex * LANE_WIDTH + LANE_WIDTH / 2 : team.width / 2;
    const mobileStart = Math.max(0, Math.min(team.width - mobileColumns, Math.floor(focusColumn - mobileColumns / 2)));
    const desktopStart = Math.max(0, Math.min(team.width - desktopColumns, Math.floor(focusColumn - desktopColumns / 2)));
    draw(canvas.current, cellSize, desktopColumns, desktopStart);
    draw(mobileCanvas.current, mobileCellSize, mobileColumns, mobileStart);
    if (isPlayerBoard && team.width > MOBILE_VIEW_COLUMNS) draw(previewCanvas.current, Math.max(2, Math.floor(360 / team.width)), team.width, 0);
  }, [team, cellSize, mobileCellSize, mobileColumns, desktopColumns, myId, isPlayerBoard]);

  return (
    <>
      <canvas ref={canvas} className={`board-canvas team-canvas team-canvas-desktop ${dim ? "dim" : ""}`} width={desktopWidth} height={desktopHeight} />
      <canvas ref={mobileCanvas} className={`board-canvas team-canvas team-canvas-mobile ${dim ? "dim" : ""}`} width={mobileWidth} height={mobileHeight} />
      {isPlayerBoard && team.width > MOBILE_VIEW_COLUMNS && (
        <div className={`team-board-preview-wrap ${team.width > DESKTOP_VIEW_COLUMNS ? "team-board-preview-desktop" : ""}`}>
          <p className="muted small">Entire team board</p>
          <canvas ref={previewCanvas} className={`board-canvas team-canvas team-board-preview ${dim ? "dim" : ""}`} width={team.width * Math.max(2, Math.floor(360 / team.width))} height={team.rows * Math.max(2, Math.floor(360 / team.width))} />
        </div>
      )}
    </>
  );
}
