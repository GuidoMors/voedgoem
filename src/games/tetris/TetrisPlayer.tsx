import { useCallback, useEffect, useRef, useState } from "react";
import { BoardView } from "./BoardView";
import { ControlIcon } from "./ControlIcon";
import { PIECE_COLORS, TetrisGame, previewShape } from "./engine";

export interface GameStats {
  board: string;
  score: number;
  lines: number;
  level: number;
}

interface Props {
  seed: number;
  onState: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
}

const REPORT_INTERVAL_MS = 200;

export function TetrisPlayer({ seed, onState, onGameOver }: Props) {
  const game = useRef(new TetrisGame(seed));
  const [, setVersion] = useState(0);
  const callbacks = useRef({ onState, onGameOver });
  callbacks.current = { onState, onGameOver };
  const finished = useRef(false);

  const stats = (): GameStats => ({ board: game.current.serialize(), score: game.current.score, lines: game.current.lines, level: game.current.level });

  const refresh = useCallback(() => {
    setVersion(version => version + 1);
    if (game.current.over && !finished.current) {
      finished.current = true;
      callbacks.current.onGameOver(stats());
    }
  }, []);

  useEffect(() => {
    let timer: number;
    const loop = () => {
      if (finished.current) return;
      game.current.tick();
      refresh();
      timer = window.setTimeout(loop, game.current.gravityMs);
    };
    timer = window.setTimeout(loop, game.current.gravityMs);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!finished.current) callbacks.current.onState(stats());
    }, REPORT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  const act = useCallback((action: (g: TetrisGame) => void) => {
    if (finished.current) return;
    action(game.current);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const actions: Record<string, (g: TetrisGame) => void> = {
        ArrowLeft: g => g.moveLeft(),
        ArrowRight: g => g.moveRight(),
        ArrowDown: g => g.softDrop(),
        ArrowUp: g => g.rotate(1),
        x: g => g.rotate(1),
        z: g => g.rotate(-1),
        " ": g => g.hardDrop()
      };
      const action = actions[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!action) return;
      event.preventDefault();
      act(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  const current = game.current;
  const next = current.next;

  return (
    <div className="tetris-player">
      <div className="touch-controls">
        <button onClick={() => act(g => g.moveLeft())} aria-label="Move left"><ControlIcon name="left" /></button>
        <button onClick={() => act(g => g.moveRight())} aria-label="Move right"><ControlIcon name="right" /></button>
        <button onClick={() => act(g => g.rotate(-1))} aria-label="Rotate left"><ControlIcon name="rotateLeft" /></button>
        <button onClick={() => act(g => g.rotate(1))} aria-label="Rotate right"><ControlIcon name="rotateRight" /></button>
        <button onClick={() => act(g => g.softDrop())} aria-label="Soft drop"><ControlIcon name="down" /></button>
        <button onClick={() => act(g => g.hardDrop())} aria-label="Hard drop"><ControlIcon name="drop" /></button>
      </div>
      <div className="tetris-main">
        <BoardView cells={current.viewCells()} cellSize={26} />
        <div className="tetris-side">
          <div className="stat"><span>Score</span><strong>{current.score}</strong></div>
          <div className="stat"><span>Lines</span><strong>{current.lines}</strong></div>
          <div className="stat"><span>Level</span><strong>{current.level}</strong></div>
          <div className="stat">
            <span>Next</span>
            <div className="next-piece">
              {next && previewShape(next).map((row, y) => (
                <div key={y} className="next-row">{row.map((filled, x) => <i key={x} style={{ background: filled ? PIECE_COLORS[next] : "transparent" }} />)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="muted small">← → move · ↑ / X rotate · Z rotate back · ↓ soft drop · Space hard drop</p>
    </div>
  );
}
