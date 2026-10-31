import { useEffect } from "react";
import { Person } from "../../avatar/Avatar";
import { ControlIcon } from "./ControlIcon";
import type { Send } from "../types";
import { PIECE_COLORS, previewShape } from "./engine";
import { TeamBoardView } from "./TeamBoardView";
import type { TeamSnapshot } from "./types";

export const TEAM_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#14b8a6", "#ec4899"];

const KEYS: Record<string, string> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "rotate",
  a: "left", d: "right", s: "down", w: "rotate",
  x: "rotate", z: "rotateBack", " ": "hard"
};

// The shared board lives on the server; this only sends key presses and draws the result.
export function TeamPlayer({ team, userId, send }: { team: TeamSnapshot; userId: string; send: Send }) {
  const me = team.members.find(member => member.id === userId);
  const lane = team.members.findIndex(member => member.id === userId) + 1;
  const active = !!me && !me.out && team.alive;

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      const action = KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!action) return;
      event.preventDefault();
      send({ type: "input", action });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, send]);

  const next = me?.next ?? null;
  const press = (action: string) => send({ type: "input", action });

  return (
    <div className="tetris-player">
      {active && (
        <div className="touch-controls">
          <button onClick={() => press("left")} aria-label="Move left"><ControlIcon name="left" /></button>
          <button onClick={() => press("right")} aria-label="Move right"><ControlIcon name="right" /></button>
          <button onClick={() => press("rotateBack")} aria-label="Rotate left"><ControlIcon name="rotateLeft" /></button>
          <button onClick={() => press("rotate")} aria-label="Rotate right"><ControlIcon name="rotateRight" /></button>
          <button onClick={() => press("down")} aria-label="Soft drop"><ControlIcon name="down" /></button>
          <button onClick={() => press("hard")} aria-label="Hard drop"><ControlIcon name="drop" /></button>
        </div>
      )}
      <div className="tetris-main">
        <TeamBoardView team={team} cellSize={Math.max(10, Math.min(26, Math.floor(780 / team.width)))} myId={userId} dim={!team.alive} />
        <div className="tetris-side">
          <div className="stat"><span>Team score</span><strong>{team.score}</strong></div>
          <div className="stat phone-hide"><span>Lines</span><strong>{team.lines}</strong></div>
          <div className="stat phone-hide"><span>Level</span><strong>{team.level}</strong></div>
          <div className="stat phone-hide"><span>Your lane</span><strong>{lane || "–"}</strong></div>
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
      {active && (
        <>
          <p className="muted small">Your piece has a white outline. ← → / A D move · ↑ / W / X rotate · Z rotate back · ↓ / S soft drop · Space hard drop</p>
        </>
      )}
      <ul className="names team-members">
        {team.members.map((member, index) => (
          <li key={member.id} className={member.out ? "offline" : ""}>
            <Person id={member.id} name={member.username} size={22} /> <span className="muted small">lane {index + 1}{member.out ? " · out" : !member.connected ? " · reconnecting" : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
