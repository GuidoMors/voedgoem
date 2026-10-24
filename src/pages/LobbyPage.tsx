import { useState } from "react";
import { BoardView, parseBoard } from "../tetris/BoardView";
import { TetrisPlayer } from "../tetris/TetrisPlayer";
import { useLobbyConnection } from "../useLobbyConnection";
import type { LobbySnapshot, User } from "../types";

export function LobbyPage({ lobbyId, user }: { lobbyId: string; user: User }) {
  const { snapshot, status, send } = useLobbyConnection(lobbyId);

  if (status === "closed") {
    return <div className="page"><p className="error">This lobby no longer exists or could not be joined.</p><a className="button" href="#/">Back to hub</a></div>;
  }
  if (!snapshot) return <div className="page"><p className="muted">Connecting to lobby…</p></div>;

  const me = snapshot.players.find(player => player.id === user.id);
  const isHost = snapshot.host.id === user.id;

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1>{snapshot.name}</h1>
          <p className="muted">Hosted by {snapshot.host.name}{status === "reconnecting" && " · reconnecting…"}</p>
        </div>
        <a className="button" href="#/">Leave lobby</a>
      </div>
      {snapshot.phase === "lobby" && <Waiting snapshot={snapshot} joined={!!me} isHost={isHost} send={send} />}
      {snapshot.phase === "playing" && <Playing snapshot={snapshot} userId={user.id} send={send} />}
      {snapshot.phase === "results" && <Results snapshot={snapshot} userId={user.id} isHost={isHost} send={send} />}
    </div>
  );
}

type Send = (message: Record<string, unknown>) => void;

function Waiting({ snapshot, joined, isHost, send }: { snapshot: LobbySnapshot; joined: boolean; isHost: boolean; send: Send }) {
  const full = snapshot.players.length >= snapshot.maxPlayers;
  return (
    <div className="grid-2">
      <section className="card">
        <h2>Players <span className="pill">{snapshot.players.length}/{snapshot.maxPlayers}</span></h2>
        {snapshot.players.length === 0 ? <p className="muted">Nobody has joined the game yet.</p> : (
          <ul className="names">{snapshot.players.map(player => <li key={player.id} className={player.connected ? "" : "offline"}>{player.username}</li>)}</ul>
        )}
        {joined
          ? <button onClick={() => send({ type: "leave" })}>Back to spectating</button>
          : <button className="primary" disabled={full} onClick={() => send({ type: "join" })}>{full ? "Game is full" : "Join the game"}</button>}
      </section>
      <section className="card">
        <h2>Spectators <span className="pill">{snapshot.spectators.length}</span></h2>
        {snapshot.spectators.length === 0 ? <p className="muted">No spectators.</p> : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}>{person.username}</li>)}</ul>}
        {isHost && (
          <div className="host-actions">
            <button className="primary" disabled={snapshot.players.length === 0} onClick={() => send({ type: "start" })}>Start game</button>
            {snapshot.players.length === 0 && <p className="muted small">At least one player must join first.</p>}
          </div>
        )}
        {!isHost && <p className="muted small">Waiting for {snapshot.host.name} to start the game.</p>}
      </section>
    </div>
  );
}

function Playing({ snapshot, userId, send }: { snapshot: LobbySnapshot; userId: string; send: Send }) {
  const me = snapshot.players.find(player => player.id === userId);
  const [, setFinished] = useState(false);
  const others = snapshot.players.filter(player => player.id !== userId);
  const alive = snapshot.players.filter(player => player.alive).length;

  return (
    <div>
      <p className="muted">{alive} player{alive === 1 ? "" : "s"} still playing.</p>
      <div className="playing-layout">
        {me?.alive && (
          <section className="card">
            <h2>Your game</h2>
            <TetrisPlayer
              key={snapshot.round}
              seed={snapshot.seed}
              onState={stats => send({ type: "state", ...stats })}
              onGameOver={stats => { setFinished(true); send({ type: "gameover", score: stats.score, lines: stats.lines, level: stats.level }); }}
            />
          </section>
        )}
        {me && !me.alive && <section className="card"><h2>You're out</h2><p>Final score <strong>{me.score}</strong> · {me.lines} lines. Waiting for the others to finish…</p></section>}
        {!me && <section className="card"><h2>Spectating</h2><p className="muted">A round is in progress. You'll be able to join the next one.</p></section>}
        <section className="boards">
          {(me ? others : snapshot.players).map(player => (
            <div key={player.id} className={`mini-board ${player.alive ? "" : "out"}`}>
              <BoardView cells={parseBoard(player.board)} cellSize={12} dim={!player.alive} />
              <div className="mini-name">{player.username}{!player.alive && " · out"}</div>
              <div className="muted small">{player.score}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Results({ snapshot, userId, isHost, send }: { snapshot: LobbySnapshot; userId: string; isHost: boolean; send: Send }) {
  return (
    <section className="card results">
      <h2>Final scores</h2>
      <table>
        <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Lines</th><th>Level</th></tr></thead>
        <tbody>
          {snapshot.results.map((row, index) => (
            <tr key={row.id} className={row.id === userId ? "me" : ""}>
              <td>{index + 1}</td><td>{row.username}</td><td>{row.score}</td><td>{row.lines}</td><td>{row.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isHost
        ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button>
        : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>}
    </section>
  );
}
