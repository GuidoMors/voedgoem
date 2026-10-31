import { useState } from "react";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps, Send } from "../types";
import { BoardView, parseBoard } from "./BoardView";
import { TeamBoardView } from "./TeamBoardView";
import { TEAM_COLORS, TeamPlayer } from "./TeamPlayer";
import { TetrisPlayer } from "./TetrisPlayer";
import type { TetrisSnapshot } from "./types";

type LobbySnapshot = TetrisSnapshot;

export function TetrisLobby({ snapshot, userId, isHost, send }: GameLobbyProps<TetrisSnapshot>) {
  const me = snapshot.players.find(player => player.id === userId);
  return (
    <>
      {snapshot.phase === "lobby" && <Waiting snapshot={snapshot} joined={!!me} isHost={isHost} send={send} />}
      {snapshot.phase === "playing" && (snapshot.teamCount > 0
        ? <TeamsPlaying snapshot={snapshot} userId={userId} send={send} />
        : <Playing snapshot={snapshot} userId={userId} send={send} />)}
      {snapshot.phase === "results" && (snapshot.teamCount > 0
        ? <TeamResults snapshot={snapshot} userId={userId} isHost={isHost} send={send} />
        : <Results snapshot={snapshot} userId={userId} isHost={isHost} send={send} />)}
    </>
  );
}

function Waiting({ snapshot, joined, isHost, send }: { snapshot: LobbySnapshot; joined: boolean; isHost: boolean; send: Send }) {
  const full = snapshot.players.length >= snapshot.maxPlayers;
  const teamMode = snapshot.teamCount > 0;
  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Players <span className="pill">{snapshot.players.length}/{snapshot.maxPlayers}</span></h2>
        {teamMode ? (
          <div className="teams">
            {Array.from({ length: snapshot.teamCount }, (_, index) => {
              const members = snapshot.players.filter(player => player.team === index);
              return (
                <div key={index} className="team-box" style={{ borderColor: TEAM_COLORS[index % TEAM_COLORS.length] }}>
                  <strong style={{ color: TEAM_COLORS[index % TEAM_COLORS.length] }}>Team {index + 1}</strong>
                  <span className="muted small"> · board {members.length * 10 || 10} wide</span>
                  {members.length === 0 ? <p className="muted small">Empty.</p> : <ul className="names">{members.map(player => <li key={player.id} className={`row between ${player.connected ? "" : "offline"}`}><Person id={player.id} name={player.username} /><KickButton id={player.id} name={player.username} isHost={isHost} send={send} /></li>)}</ul>}
                  <button disabled={!joined && full} onClick={() => send(joined ? { type: "team", team: index } : { type: "join", team: index })}>
                    {joined ? "Switch to this team" : "Join this team"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : snapshot.players.length === 0 ? <p className="muted">Nobody has joined the game yet.</p> : (
          <ul className="names">{snapshot.players.map(player => <li key={player.id} className={`row between ${player.connected ? "" : "offline"}`}><Person id={player.id} name={player.username} /><KickButton id={player.id} name={player.username} isHost={isHost} send={send} /></li>)}</ul>
        )}
        {joined
          ? <button onClick={() => send({ type: "leave" })}>Back to spectating</button>
          : !teamMode && <button className="primary" disabled={full} onClick={() => send({ type: "join" })}>{full ? "Game is full" : "Join the game"}</button>}
      </section>
      <section className="card">
        <h2>Spectators <span className="pill">{snapshot.spectators.length}</span></h2>
        {snapshot.spectators.length === 0 ? <p className="muted">No spectators.</p> : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>}
        {!isHost && <p className="muted small">{teamMode ? `Teams game (${snapshot.teamCount} teams). ` : ""}Waiting for {snapshot.host.name} to start the game.</p>}
      </section>
    </div>
    {isHost && <HostControlsTab>
      <div className="host-actions">
        <label className="row">Teams
          <select value={snapshot.teamCount} onChange={event => send({ type: "config", teams: Number(event.target.value) })}>
            <option value={0}>Free for all</option>
            <option value={1}>1 team (everyone together)</option>
            {Array.from({ length: 7 }, (_, index) => <option key={index} value={index + 2}>{index + 2} teams</option>)}
          </select>
        </label>
        {teamMode && <p className="muted small">{snapshot.teamCount === 1 ? "Everyone shares one board, 10 columns per player. Each player's pieces drop in at their own lane." : "Teammates share one board, 10 columns per player. Each player's pieces drop in at their own lane."}</p>}
        {teamMode && <button disabled={snapshot.players.length < 2} onClick={() => send({ type: "shuffle" })}>Shuffle teams</button>}
        <button className="primary" disabled={snapshot.players.length === 0} onClick={() => send({ type: "start" })}>Start game</button>
        {snapshot.players.length === 0 && <p className="muted small">At least one player must join first.</p>}
      </div>
    </HostControlsTab>}
    </>
  );
}

function TeamsPlaying({ snapshot, userId, send }: { snapshot: LobbySnapshot; userId: string; send: Send }) {
  const mine = snapshot.teams.find(team => team.members.some(member => member.id === userId));
  const others = snapshot.teams.filter(team => team !== mine);
  const alive = snapshot.teams.filter(team => team.alive).length;
  return (
    <div>
      <div className="playing-layout">
        {mine && (
          <section className="card team-card" style={{ borderColor: TEAM_COLORS[mine.index % TEAM_COLORS.length] }}>
            <h2 style={{ color: TEAM_COLORS[mine.index % TEAM_COLORS.length] }}>Team {mine.index + 1}{!mine.alive && " · out"}</h2>
            <TeamPlayer team={mine} userId={userId} send={send} />
            <p className="muted small tetris-alive-count">{alive} team{alive === 1 ? "" : "s"} still playing.</p>
          </section>
        )}
        {!mine && <section className="card"><h2>Spectating</h2><p className="muted">A round is in progress. You'll be able to join the next one.</p><p className="muted small tetris-alive-count">{alive} team{alive === 1 ? "" : "s"} still playing.</p></section>}
        <section className="boards">
          {(mine ? others : snapshot.teams).map(team => (
            <div key={team.index} className={`mini-board ${team.alive ? "" : "out"}`}>
              <TeamBoardView team={team} cellSize={Math.max(4, Math.min(12, Math.floor(360 / team.width)))} dim={!team.alive} />
              <div className="mini-name" style={{ color: TEAM_COLORS[team.index % TEAM_COLORS.length] }}>Team {team.index + 1}{!team.alive && " · out"}</div>
              <div className="muted small">{team.members.map(member => member.username).join(", ")}</div>
              <div className="muted small other-score">Score: {team.score}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function TeamResults({ snapshot, userId, isHost, send }: { snapshot: LobbySnapshot; userId: string; isHost: boolean; send: Send }) {
  return (
    <section className="card results">
      <h2>Final team scores</h2>
      <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Team</th><th>Players</th><th>Score</th><th>Lines</th><th>Level</th></tr></thead>
        <tbody>
          {snapshot.teamResults.map((row, index) => (
            <tr key={row.index} className={row.members.some(member => member.id === userId) ? "me" : ""}>
              <td>{index + 1}</td>
              <td style={{ color: TEAM_COLORS[row.index % TEAM_COLORS.length] }}>Team {row.index + 1}</td>
              <td>{row.members.map(member => <span key={member.id} className="team-result-person"><Person id={member.id} name={member.username} size={20} /></span>)}</td>
              <td>{row.score}</td><td>{row.lines}</td><td>{row.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {isHost
        ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button>
        : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>}
    </section>
  );
}

function Playing({ snapshot, userId, send }: { snapshot: LobbySnapshot; userId: string; send: Send }) {
  const me = snapshot.players.find(player => player.id === userId);
  const [, setFinished] = useState(false);
  const others = snapshot.players.filter(player => player.id !== userId);
  const alive = snapshot.players.filter(player => player.alive).length;

  return (
    <div>
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
            <p className="muted small tetris-alive-count">{alive} player{alive === 1 ? "" : "s"} still playing.</p>
          </section>
        )}
        {me && !me.alive && <section className="card"><h2>You're out</h2><p>Final score <strong>{me.score}</strong> · {me.lines} lines. Waiting for the others to finish…</p><p className="muted small tetris-alive-count">{alive} player{alive === 1 ? "" : "s"} still playing.</p></section>}
        {!me && <section className="card"><h2>Spectating</h2><p className="muted">A round is in progress. You'll be able to join the next one.</p><p className="muted small tetris-alive-count">{alive} player{alive === 1 ? "" : "s"} still playing.</p></section>}
        <section className="boards">
          {(me ? others : snapshot.players).map(player => (
            <div key={player.id} className={`mini-board ${player.alive ? "" : "out"}`}>
              <BoardView cells={parseBoard(player.board)} cellSize={12} dim={!player.alive} />
              <div className="mini-name"><Person id={player.id} name={player.username} size={22} />{!player.alive && " · out"}</div>
              <div className="muted small other-score">Score: {player.score}</div>
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
      <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Lines</th><th>Level</th></tr></thead>
        <tbody>
          {snapshot.results.map((row, index) => (
            <tr key={row.id} className={row.id === userId ? "me" : ""}>
              <td>{index + 1}</td><td><Person id={row.id} name={row.username} /></td><td>{row.score}</td><td>{row.lines}</td><td>{row.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {isHost
        ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button>
        : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>}
    </section>
  );
}
