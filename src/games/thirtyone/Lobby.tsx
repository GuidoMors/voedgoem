import { useEffect, useMemo, useState } from "react";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { HistoryPanel } from "../../components/HistoryPanel";
import { KickButton } from "../../components/KickButton";
import { Modal } from "../../components/Modal";
import type { GameLobbyProps, Send } from "../types";
import type { Role, ThirtyOneHistoryEntry, ThirtyOneSeat, ThirtyOneSnapshot, Team } from "./types";

const TEAMS: Team[] = ["red", "blue"];
const label = (team: Team) => (team === "red" ? "Red" : "Blue");

type Props = { snapshot: ThirtyOneSnapshot; seat?: ThirtyOneSeat; isHost: boolean; send: Send };

export function ThirtyOneLobby({ snapshot, userId, isHost, send }: GameLobbyProps<ThirtyOneSnapshot>) {
  const seat = snapshot.seats.find(item => item.id === userId);
  if (snapshot.phase === "lobby") return <Waiting {...{ snapshot, seat, isHost, send }} />;
  if (snapshot.phase === "draft") return <Draft {...{ snapshot, seat, isHost, send }} />;
  return <Table {...{ snapshot, seat, isHost, send }} userId={userId} />;
}

function TeamBoxes({ snapshot, isHost, send }: { snapshot: ThirtyOneSnapshot; isHost: boolean; send: Send }) {
  return (
    <div className="teams">
      {TEAMS.map(team => {
        const members = snapshot.seats.filter(item => item.team === team);
        const captain = members.find(item => item.role === "captain");
        const players = members.filter(item => item.role === "player");
        return (
          <div key={team} className={`team-box team-${team}`}>
            <h3>{label(team)} team</h3>
            <p className="small muted">Captain</p>
            <p className="row">{captain ? <><Person id={captain.id} name={captain.username} />{snapshot.phase === "lobby" && <KickButton id={captain.id} name={captain.username} isHost={isHost} send={send} />}</> : <span className="muted">Empty</span>}</p>
            <p className="small muted">Players</p>
            {players.length === 0 ? <p className="muted">None yet</p> : <ul className="names">{players.map(item => <li key={item.id} className={`row between ${item.connected ? "" : "offline"}`}><Person id={item.id} name={item.username} /><KickButton id={item.id} name={item.username} isHost={isHost} send={send} /></li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}

function Waiting({ snapshot, seat, isHost, send }: Props) {
  const [pointsToWin, setPointsToWin] = useState(snapshot.pointsToWin);
  const [graceSeconds, setGraceSeconds] = useState(snapshot.graceSeconds);
  const full = snapshot.seats.length >= snapshot.maxPlayers;

  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Teams <span className="pill">{snapshot.seats.length}/{snapshot.maxPlayers}</span></h2>
        <div className="teams">
          {TEAMS.map(team => {
            const members = snapshot.seats.filter(item => item.team === team);
            const captain = members.find(item => item.role === "captain");
            const players = members.filter(item => item.role === "player");
            const sit = (role: Role) => send({ type: "seat", team, role });
            const is = (role: Role) => seat?.team === team && seat.role === role;
            return (
              <div key={team} className={`team-box team-${team}`}>
                <h3>{label(team)} team</h3>
                <p className="small muted">Captain</p>
                <p className="row">{captain ? <><Person id={captain.id} name={captain.username} />{snapshot.phase === "lobby" && <KickButton id={captain.id} name={captain.username} isHost={isHost} send={send} />}</> : <span className="muted">Empty</span>}</p>
                <button disabled={is("captain") || (!!captain && captain.id !== seat?.id)} onClick={() => sit("captain")}>Be captain</button>
                <p className="small muted">Players</p>
                {players.length === 0 ? <p className="muted">None yet</p> : <ul className="names">{players.map(item => <li key={item.id} className={`row between ${item.connected ? "" : "offline"}`}><Person id={item.id} name={item.username} /><KickButton id={item.id} name={item.username} isHost={isHost} send={send} /></li>)}</ul>}
                <button disabled={is("player") || (full && !seat)} onClick={() => sit("player")}>Be player</button>
              </div>
            );
          })}
        </div>
        {seat && <button onClick={() => send({ type: "unseat" })}>Back to spectating</button>}
      </section>
      <section className="card">
        <h2>Spectators <span className="pill">{snapshot.spectators.length}</span></h2>
        {snapshot.spectators.length === 0 ? <p className="muted">No spectators.</p> : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>}
        {!isHost && <p className="muted small">Waiting for {snapshot.host.name} to start the draft.</p>}
      </section>
    </div>
    {isHost && <HostControlsTab>
      <div className="host-actions">
        <label className="field">
          Points to win
          <input type="number" min={1} max={200} value={pointsToWin} onChange={event => setPointsToWin(Number(event.target.value))} />
        </label>
        <label className="field">
          Grace period after the timer (seconds)
          <input type="number" min={0} max={15} value={graceSeconds} onChange={event => setGraceSeconds(Number(event.target.value))} />
        </label>
        <div className="row">
          <button onClick={() => send({ type: "scramble_teams" })}>Scramble teams</button>
          <button onClick={() => send({ type: "scramble" })}>Scramble captains</button>
        </div>
        <button className="primary" onClick={() => send({ type: "start", pointsToWin, graceSeconds })}>Start draft</button>
        <p className="muted small">Scramble teams assigns everyone connected to balanced teams with one captain per team. Scramble captains only reassigns the two captain roles.</p>
      </div>
    </HostControlsTab>}
    </>
  );
}

function Draft({ snapshot, seat, isHost, send }: Props) {
  const canPick = seat?.role === "captain" && seat.team === snapshot.draftTurn;
  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Draft</h2>
        <p className={`cn-status team-${snapshot.draftTurn}`}><strong>{label(snapshot.draftTurn)} captain picks next</strong></p>
        <TeamBoxes snapshot={snapshot} isHost={isHost} send={send} />
      </section>
      <section className="card">
        <h2>Available players <span className="pill">{snapshot.spectators.length}</span></h2>
        {snapshot.spectators.length === 0 ? <p className="muted">Nobody left to draft.</p> : (
          <ul className="names">
            {snapshot.spectators.map(person => (
              <li key={person.id} className="row between">
                <Person id={person.id} name={person.username} />
                {canPick && <button className="primary" onClick={() => send({ type: "draft", userId: person.id })}>Draft</button>}
              </li>
            ))}
          </ul>
        )}
        {!isHost && <p className="muted small">Captains take turns drafting. {snapshot.host.name} starts the game.</p>}
      </section>
    </div>
    {isHost && <HostControlsTab>
      <div className="host-actions">
        <button className="primary" onClick={() => send({ type: "begin" })}>Start game</button>
        <button onClick={() => send({ type: "abort" })}>Back to lobby</button>
        <p className="muted small">You can start at any point; each team needs at least two players.</p>
      </div>
    </HostControlsTab>}
    </>
  );
}

// The server sends its own clock with every snapshot, so countdowns are right even if this device's clock is off.
function useServerClock(snapshot: ThirtyOneSnapshot, active: boolean) {
  const offset = useMemo(() => snapshot.now - Date.now(), [snapshot]);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => tick(value => value + 1), 200);
    return () => window.clearInterval(timer);
  }, [active]);
  return Date.now() + offset;
}

function Scoreboard({ snapshot }: { snapshot: ThirtyOneSnapshot }) {
  const { red, blue } = snapshot.scores;
  let banner = "";
  if (snapshot.overtime) {
    banner = snapshot.turn === "blue" && red > blue
      ? `Last chance: Blue needs ${red - blue} to tie or ${red - blue + 1} to win.`
      : "Sudden death: whoever leads after a full round wins.";
  }
  return (
    <>
    <div className="teams">
      {TEAMS.map(team => (
        <div key={team} className={`team-box team-${team} score-box`}>
          <h3>{label(team)}</h3>
          <div className="score">{snapshot.scores[team]}<span className="muted small"> / {snapshot.pointsToWin}</span></div>
        </div>
      ))}
    </div>
    {banner && <p className="cn-status team-blue"><strong>{banner}</strong></p>}
    </>
  );
}

function History({ entries }: { entries: ThirtyOneHistoryEntry[] }) {
  return (
    <HistoryPanel title="Previous cards">
      {entries.length === 0 ? <p className="muted">No cards played yet.</p> : (
      <ul className="ts-history">
        {[...entries].reverse().map((entry, index) => (
          <li key={entries.length - index} className={`team-${entry.team}`}>
            <strong>{label(entry.team)}</strong> · {entry.describer} · {entry.words.filter(item => item.correct).length}/{entry.words.length}
            <div className="ts-words-inline">{entry.words.map(item => <span key={item.word} className={item.correct ? "yes" : "no"}>{item.correct ? "✓" : "✗"} {item.word}</span>)}</div>
          </li>
        ))}
      </ul>
      )}
    </HistoryPanel>
  );
}

function Table({ snapshot, seat, isHost, send, userId }: Props & { userId: string }) {
  const playing = snapshot.phase === "playing";
  const running = playing && snapshot.turnPhase === "running";
  const now = useServerClock(snapshot, running);
  const isDescriber = playing && snapshot.describer?.id === userId;
  const isJudge = playing && snapshot.judge?.id === userId;
  const endsAt = snapshot.endsAt ?? 0;
  const judgeAt = snapshot.judgeAt ?? 0;
  const stage = !running ? "ready" : now < endsAt ? "timer" : now < judgeAt ? "grace" : "judging";
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const marks = snapshot.marks ?? [];
  const correct = marks.filter(Boolean).length;
  const myTeamTurn = seat?.team === snapshot.turn;

  return (
    <div className="ts-table">
      <History entries={snapshot.history} />
      <Scoreboard snapshot={snapshot} />
      {snapshot.phase === "results" ? (
        <section className="card">
          <h2>{snapshot.winner ? `${label(snapshot.winner)} team wins!` : "Game over"}</h2>
          <p className="muted">{snapshot.scores.red} – {snapshot.scores.blue}</p>
          {isHost ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button> : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>}
        </section>
      ) : (
        <section className="card">
          <p className={`cn-status team-${snapshot.turn}`}>
            <strong>{label(snapshot.turn)} team's turn</strong>
            {snapshot.describer && <> · describing: <Person id={snapshot.describer.id} name={snapshot.describer.username} /></>}
          </p>

          {stage === "ready" && (isDescriber ? (
            <div className="ts-center">
              <p>Get ready to describe the words on your card!
                Don't say the word on the card, or parts of it, or guessing it doesn't count.</p>
              <button className="primary ts-big" onClick={() => send({ type: "open" })}>Open card and start {snapshot.turnSeconds}s</button>
              <button onClick={() => send({ type: "skip" })}>Pass to a teammate</button>
            </div>
          ) : (
            <div className="ts-center">
              <p className="muted">Waiting for {snapshot.describer?.username ?? "the describer"} to open the card.</p>
              {isHost && <button onClick={() => send({ type: "skip" })}>Pass card to next player</button>}
            </div>
          ))}

          {running && (
            <div className="ts-center">
              {stage === "timer" && <div className={`ts-clock ${secondsLeft <= 5 ? "low" : ""}`}>{secondsLeft}</div>}
              {stage === "grace" && <div className="ts-clock grace">Grace period</div>}
              {stage === "judging" && <div className="ts-clock done">Time's up</div>}
              {stage !== "timer" && !isJudge && <p className="muted">{snapshot.judge ? `${snapshot.judge.username} is scoring this card…` : "Waiting for someone to score this card…"}</p>}
            </div>
          )}

          {running && snapshot.card && (
            <>
              <ul className="ts-words">
                {snapshot.card.map((word, index) => {
                  const scoring = isJudge && stage === "judging";
                  const classes = `ts-word ${marks[index] ? "correct" : ""}`;
                  return (
                    <li key={word}>
                      {scoring
                        ? <button className={classes} onClick={() => send({ type: "mark", index })}>{marks[index] ? "✓" : "○"} {word}</button>
                        : <span className={classes}>{stage === "judging" && (marks[index] ? "✓ " : "○ ")}{word}</span>}
                    </li>
                  );
                })}
              </ul>
              {isJudge && stage !== "judging" && <p className="muted small">You will score these words when the time is up. Listen for the describer saying a word on the card.</p>}
              {isJudge && stage === "judging" && <button className="primary" onClick={() => send({ type: "confirm" })}>Confirm {correct} point{correct === 1 ? "" : "s"} for {label(snapshot.turn)}</button>}
              {isDescriber && stage === "timer" && <button onClick={() => send({ type: "stop" })}>All done, stop the clock</button>}
            </>
          )}

          {running && myTeamTurn && !isDescriber && <p className="muted">Guess what {snapshot.describer?.username} is describing!</p>}
        </section>
      )}
      {playing && isHost && snapshot.spectators.length > 0 && (
        <section className="card">
          <h2>Spectators ({snapshot.spectators.length})</h2>
          <ul className="names">
            {snapshot.spectators.map(person => (
              <li key={person.id} className="row between">
                <Person id={person.id} name={person.username} size={20} />
                <span className="row">
                  {TEAMS.map(team => <button key={team} className={`text-${team}`} onClick={() => send({ type: "assign", userId: person.id, team })}>Add to {label(team)}</button>)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {isHost && playing && <AbortCard send={send} />}
    </div>
  );
}

function AbortCard({ send }: { send: Send }) {
  const [asking, setAsking] = useState(false);
  return (
    <section className="card abort-card">
      <button className="danger" onClick={() => setAsking(true)}>Abort game</button>
      {asking && (
        <Modal title="Abort game?" onClose={() => setAsking(false)}>
          <p>Are you sure? The game ends for everyone and nobody gets a result.</p>
          <div className="row">
            <button className="danger" onClick={() => { setAsking(false); send({ type: "abort" }); }}>Yes, abort</button>
            <button onClick={() => setAsking(false)}>Keep playing</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
