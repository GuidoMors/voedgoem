import { useEffect, useMemo, useState } from "react";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps } from "../types";
import type { BlokusColor, BlokusPiece, BlokusPlayer, BlokusSnapshot } from "./types";

const COLORS: BlokusColor[] = ["blue", "yellow", "red", "green"];
const COLOR_NAMES: Record<BlokusColor, string> = { blue: "Blue", yellow: "Yellow", red: "Red", green: "Green" };
const COLOR_VALUES: Record<BlokusColor, number> = { blue: 1, yellow: 2, red: 3, green: 4 };
const CORNERS: [number, number][] = [[0, 0], [19, 0], [0, 19], [19, 19]];
const PIECE_COUNT = 21;

type Cell = [number, number];
type Anchor = { x: number; y: number };

function orient(cells: Cell[], rotation: number, flipped: boolean): Cell[] {
  let transformed = cells.map(([x, y]) => [flipped ? -x : x, y] as Cell);
  for (let turn = 0; turn < rotation; turn++) transformed = transformed.map(([x, y]) => [-y, x] as Cell);
  const minX = Math.min(...transformed.map(([x]) => x));
  const minY = Math.min(...transformed.map(([, y]) => y));
  return transformed.map(([x, y]) => [x - minX, y - minY]);
}

function validPlacement(snapshot: BlokusSnapshot, player: BlokusPlayer, cells: Cell[], anchor: Anchor): boolean {
  const ownValue = COLOR_VALUES[player.color];
  const firstMove = player.remaining.length === PIECE_COUNT;
  let touchesCorner = false;
  for (const [dx, dy] of cells) {
    const x = anchor.x + dx;
    const y = anchor.y + dy;
    if (x < 0 || x >= snapshot.boardSize || y < 0 || y >= snapshot.boardSize) return false;
    if (snapshot.board[y * snapshot.boardSize + x] !== 0) return false;
    if (firstMove && CORNERS.some(([cx, cy]) => cx === x && cy === y)) touchesCorner = true;
  }
  if (firstMove) return touchesCorner;

  for (const [dx, dy] of cells) {
    const x = anchor.x + dx;
    const y = anchor.y + dy;
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as Cell[]) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx >= 0 && nx < snapshot.boardSize && ny >= 0 && ny < snapshot.boardSize && snapshot.board[ny * snapshot.boardSize + nx] === ownValue) return false;
    }
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as Cell[]) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx >= 0 && nx < snapshot.boardSize && ny >= 0 && ny < snapshot.boardSize && snapshot.board[ny * snapshot.boardSize + nx] === ownValue) touchesCorner = true;
    }
  }
  return touchesCorner;
}

function PiecePreview({ cells, className = "" }: { cells: Cell[]; className?: string }) {
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  const height = Math.max(...cells.map(([, y]) => y)) + 1;
  const filled = new Set(cells.map(([x, y]) => `${x},${y}`));
  return (
    <span className={`blokus-piece-shape ${className}`} style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
      {Array.from({ length: width * height }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        return <i key={index} className={filled.has(`${x},${y}`) ? "filled" : ""} />;
      })}
    </span>
  );
}

function SpectatorList({ snapshot }: { snapshot: BlokusSnapshot }) {
  return snapshot.spectators.length === 0
    ? <p className="muted">No spectators.</p>
    : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>;
}

function Waiting({ snapshot, userId, isHost, send }: GameLobbyProps<BlokusSnapshot>) {
  const [lobbyTab, setLobbyTab] = useState<"rules" | "spectators">("rules");
  const me = snapshot.players.find(player => player.id === userId);
  const full = snapshot.players.length >= snapshot.maxPlayers;
  return (
    <>
      <div className="grid-2">
        <section className="card">
          <h2>Players <span className="pill">{snapshot.players.length}/{snapshot.maxPlayers}</span></h2>
          <div className="blokus-seats">
            {COLORS.map(color => {
              const occupant = snapshot.players.find(player => player.color === color);
              return (
                <div key={color} className={`blokus-seat ${color}`}>
                  <strong>{COLOR_NAMES[color]}</strong>
                  {occupant ? (
                    <div className="row between">
                      <Person id={occupant.id} name={occupant.username} />
                      <span className="row">
                        {occupant.id === userId && <span className="pill">You</span>}
                        <KickButton id={occupant.id} name={occupant.username} isHost={isHost} send={send} />
                      </span>
                    </div>
                  ) : <span className="muted small">Open</span>}
                  {!occupant && (!me || me.color !== color) && (
                    <button className={`blokus-color-button ${color}`} disabled={full && !me} onClick={() => send({ type: "join", color })}>
                      {me ? `Switch to ${COLOR_NAMES[color]}` : `Join as ${COLOR_NAMES[color]}`}
                    </button>
                  )}
                  {me?.color === color && <button onClick={() => send({ type: "leave" })}>Back to spectating</button>}
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <div className="blokus-tabs" role="tablist" aria-label="Lobby information">
            <button type="button" role="tab" aria-selected={lobbyTab === "rules"} className={lobbyTab === "rules" ? "active" : ""} onClick={() => setLobbyTab("rules")}>Rules</button>
            <button type="button" role="tab" aria-selected={lobbyTab === "spectators"} className={lobbyTab === "spectators" ? "active" : ""} onClick={() => setLobbyTab("spectators")}>Spectators <span className="pill">{snapshot.spectators.length}</span></button>
          </div>
          {lobbyTab === "rules" ? (
            <>
              <h2>Rules</h2>
              <ul className="blokus-rules">
                <li>Place one piece each turn, in Blue, Yellow, Red, Green order.</li>
                <li>Your first piece must cover any free board corner.</li>
                <li>Later pieces must touch your color at a corner, never along an edge.</li>
                <li>Pieces may touch other colors in any way. No legal moves means you are out.</li>
                <li>The player with the fewest unplaced squares wins.</li>
              </ul>
              {!isHost && <p className="muted small">Waiting for {snapshot.host.name} to start the game.</p>}
            </>
          ) : <><h2>Spectators</h2><SpectatorList snapshot={snapshot} /></>}
        </section>
      </div>
      {isHost && <HostControlsTab>
        <div className="host-actions">
          <button className="primary" disabled={snapshot.players.length !== 4} onClick={() => send({ type: "start" })}>Start Blokus</button>
          {snapshot.players.length !== 4 && <p className="muted small">All four colors must be filled before starting.</p>}
        </div>
      </HostControlsTab>}
    </>
  );
}

function Board({ snapshot, piece, rotation, flipped, anchor, setAnchor, canPlace, onPlace }: {
  snapshot: BlokusSnapshot;
  piece: BlokusPiece | undefined;
  rotation: number;
  flipped: boolean;
  anchor: Anchor | null;
  setAnchor: (anchor: Anchor) => void;
  canPlace: boolean;
  onPlace: (anchor: Anchor) => void;
}) {
  const shape = piece ? orient(piece.cells, rotation, flipped) : [];
  const preview = new Set(anchor && piece ? shape.map(([dx, dy]) => `${anchor.x + dx},${anchor.y + dy}`) : []);
  return (
    <div className="blokus-board" role="grid" aria-label="Blokus board">
      {snapshot.board.map((value, index) => {
        const x = index % snapshot.boardSize;
        const y = Math.floor(index / snapshot.boardSize);
        const owner = COLORS[value - 1];
        const isPreview = preview.has(`${x},${y}`);
        const className = ["blokus-cell", owner ? `occupied ${owner}` : "", isPreview ? `preview ${canPlace ? "legal" : "illegal"}` : ""].filter(Boolean).join(" ");
        return (
          <button
            key={index}
            className={className}
            role="gridcell"
            aria-label={`Row ${y + 1}, column ${x + 1}${owner ? `, ${COLOR_NAMES[owner]}` : ""}${isPreview ? ", proposed placement" : ""}`}
            onMouseEnter={() => piece && setAnchor({ x, y })}
            onFocus={() => piece && setAnchor({ x, y })}
            onClick={() => {
              if (!piece) return;
              const target = { x, y };
              setAnchor(target);
              onPlace(target);
            }}
            type="button"
          />
        );
      })}
    </div>
  );
}

function Playing({ snapshot, userId, isHost, send }: GameLobbyProps<BlokusSnapshot>) {
  const player = snapshot.players.find(item => item.id === userId);
  const turn = snapshot.players.find(item => item.id === snapshot.turn);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"players" | "spectators">("players");
  const selectedPiece = snapshot.pieces.find(piece => piece.id === selectedId);
  const shape = useMemo(() => selectedPiece ? orient(selectedPiece.cells, rotation, flipped) : [], [selectedPiece, rotation, flipped]);
  const canAct = !!player && !player.out && snapshot.turn === userId;
  const canPlace = !!player && !!anchor && !!selectedPiece && validPlacement(snapshot, player, shape, anchor);
  const usedCells = selectedPiece ? shape.map(([x, y]) => [x + (anchor?.x ?? 0), y + (anchor?.y ?? 0)] as Cell) : [];

  useEffect(() => {
    setSelectedId(null);
    setAnchor(null);
    setRotation(0);
    setFlipped(false);
  }, [snapshot.turn, snapshot.round]);

  const choosePiece = (pieceId: string) => {
    setSelectedId(pieceId);
    setRotation(0);
    setFlipped(false);
    setAnchor(null);
  };
  const placeAt = (target: Anchor) => {
    if (!canAct || !player || !selectedId || !validPlacement(snapshot, player, shape, target)) return;
    send({ type: "place", pieceId: selectedId, x: target.x, y: target.y, rotation, flipped });
    setSelectedId(null);
    setAnchor(null);
  };

  return (
    <div className="blokus-game">
      <div className="blokus-turn-bar">
        <strong>{turn ? `${COLOR_NAMES[turn.color]}'s turn` : "Game over"}</strong>
        <span>{snapshot.players.filter(item => !item.out).length} players still playing</span>
      </div>
      <div className="blokus-layout">
        <section className="card blokus-board-card">
          <Board snapshot={snapshot} piece={selectedPiece} rotation={rotation} flipped={flipped} anchor={anchor} setAnchor={setAnchor} canPlace={canPlace} onPlace={placeAt} />
          {canAct && selectedPiece && (
            <div className="blokus-placement-tools">
              <p className="muted small">Click a board square to place {selectedPiece.id}{anchor ? ` at column ${anchor.x + 1}, row ${anchor.y + 1}` : ""}. {canPlace ? "Legal placement." : "Choose a legal corner placement."}</p>
              <div className="row">
                <button onClick={() => { setRotation(value => (value + 3) % 4); setAnchor(null); }}>Rotate left</button>
                <button onClick={() => { setRotation(value => (value + 1) % 4); setAnchor(null); }}>Rotate right</button>
                <button onClick={() => { setFlipped(value => !value); setAnchor(null); }}>Flip</button>
              </div>
              <PiecePreview cells={shape} className={player.color} />
              <span className="muted small">Preview: {usedCells.length} squares</span>
            </div>
          )}
          {player?.out && <p className="muted">You are out of moves. Your placed pieces stay on the board.</p>}
          {player && snapshot.turn !== userId && !player.out && <p className="muted small">Waiting for {turn ? `${turn.username} (${COLOR_NAMES[turn.color]})` : "the next turn"}.</p>}
          {!player && <p className="muted small">Spectating. {turn ? `${turn.username} is taking a turn.` : ""}</p>}
          {player && (
            <p className="muted small">Your color: <strong className={player.color}>{COLOR_NAMES[player.color]}</strong> · {player.remainingSquares} squares in {player.remaining.length} pieces.</p>
          )}
        </section>
        <aside className="blokus-sidebar">
          <section className="card">
            <div className="blokus-tabs" role="tablist" aria-label="Game information">
              <button type="button" role="tab" aria-selected={sidebarTab === "players"} className={sidebarTab === "players" ? "active" : ""} onClick={() => setSidebarTab("players")}>Players</button>
              <button type="button" role="tab" aria-selected={sidebarTab === "spectators"} className={sidebarTab === "spectators" ? "active" : ""} onClick={() => setSidebarTab("spectators")}>Spectators <span className="pill">{snapshot.spectators.length}</span></button>
            </div>
            {sidebarTab === "players" ? (
              <>
                <h2>Players</h2>
                <ol className="blokus-player-list">
                  {snapshot.players.map(item => (
                    <li key={item.id} className={`${item.color} ${item.out ? "out" : ""} ${item.id === snapshot.turn ? "on-turn" : ""}`}>
                      <Person id={item.id} name={item.username} size={22} />
                      <span>{COLOR_NAMES[item.color]}{item.out ? " · out" : ""}</span>
                      <strong>{item.remainingSquares}</strong>
                    </li>
                  ))}
                </ol>
              </>
            ) : <><h2>Spectators</h2><SpectatorList snapshot={snapshot} /></>}
          </section>
          {canAct && (
            <section className="card blokus-hand">
              <h2>Your pieces <span className="pill">{player.remaining.length}</span></h2>
              <div className="blokus-piece-list">
                {snapshot.pieces.filter(piece => player.remaining.includes(piece.id)).map(piece => (
                  <button key={piece.id} className={`blokus-piece-choice ${player.color} ${selectedId === piece.id ? "selected" : ""}`} onClick={() => choosePiece(piece.id)} aria-pressed={selectedId === piece.id}>
                    <PiecePreview cells={piece.cells} />
                    <span>{piece.id}</span>
                  </button>
                ))}
              </div>
              <p className="muted small">Choose any unused piece. Rotate or flip it, then select its top-left board square.</p>
            </section>
          )}
          {isHost && <section className="card"><button className="danger" onClick={() => send({ type: "abort" })}>Abort game</button></section>}
        </aside>
      </div>
    </div>
  );
}

function Results({ snapshot, userId, isHost, send }: GameLobbyProps<BlokusSnapshot>) {
  const winners = snapshot.results.length ? snapshot.results.filter(result => result.remainingSquares === snapshot.results[0].remainingSquares) : [];
  return (
    <section className="card results blokus-results">
      <h2>{winners.length === 1 ? `${winners[0].username} wins!` : winners.length ? "It's a tie!" : "Game over"}</h2>
      <p className="muted">{winners.map(winner => COLOR_NAMES[winner.color]).join(" and ")} {winners.length === 1 ? "wins" : "share the victory"} with the fewest squares unplaced.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Player</th><th>Unplaced squares</th><th>Pieces placed</th><th>Last piece</th></tr></thead>
          <tbody>
            {snapshot.results.map((result, index) => (
              <tr key={result.id} className={`${result.id === userId ? "me" : ""} ${winners.some(winner => winner.id === result.id) ? "blokus-winner" : ""}`}>
                <td>{index + 1}</td>
                <td><Person id={result.id} name={result.username} /></td>
                <td>{result.remainingSquares}</td>
                <td>{result.piecesPlaced}/21</td>
                <td>{result.lastPiece ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isHost ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button> : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>}
    </section>
  );
}

export function BlokusLobby({ snapshot, userId, isHost, isAdmin, send }: GameLobbyProps<BlokusSnapshot>) {
  if (snapshot.phase === "lobby") return <Waiting {...{ snapshot, userId, isHost, isAdmin, send }} />;
  if (snapshot.phase === "results") return <Results {...{ snapshot, userId, isHost, isAdmin, send }} />;
  return <Playing {...{ snapshot, userId, isHost, isAdmin, send }} />;
}
