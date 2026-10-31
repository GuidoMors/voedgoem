import { useEffect, useMemo, useRef, useState } from "react";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { HistoryPanel } from "../../components/HistoryPanel";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps, Send } from "../types";
import type { CodenamesSnapshot, CodenamesSeat, Role, Team } from "./types";

const TEAMS: Team[] = ["red", "blue"];
const label = (team: Team) => (team === "red" ? "Red" : "Blue");

export function CodenamesLobby({ snapshot, userId, isHost, send }: GameLobbyProps<CodenamesSnapshot>) {
  const seat = snapshot.seats.find(item => item.id === userId);
  if (snapshot.phase === "lobby") return <Waiting {...{ snapshot, seat, isHost, send }} />;
  if (snapshot.phase === "draft") return <Draft {...{ snapshot, seat, isHost, send }} />;
  return <Table {...{ snapshot, seat, isHost, send }} />;
}

function TeamBoxes({ snapshot, isHost, send }: { snapshot: CodenamesSnapshot; isHost: boolean; send: Send }) {
  return (
    <div className="teams">
      {TEAMS.map(team => {
        const members = snapshot.seats.filter(item => item.team === team);
        const spymaster = members.find(item => item.role === "spymaster");
        const operatives = members.filter(item => item.role === "operative");
        return (
          <div key={team} className={`team-box team-${team}`}>
            <h3>{label(team)} team</h3>
            <p className="small muted">Spymaster</p>
            <p className="row">{spymaster ? <><Person id={spymaster.id} name={spymaster.username} />{snapshot.phase === "lobby" && <KickButton id={spymaster.id} name={spymaster.username} isHost={isHost} send={send} />}</> : <span className="muted">Empty</span>}</p>
            <p className="small muted">Operatives</p>
            {operatives.length === 0 ? <p className="muted">None yet</p> : <ul className="names">{operatives.map(item => <li key={item.id} className={`row between ${item.connected ? "" : "offline"}`}><Person id={item.id} name={item.username} /><KickButton id={item.id} name={item.username} isHost={isHost} send={send} /></li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}

function Draft({ snapshot, seat, isHost, send }: { snapshot: CodenamesSnapshot; seat?: CodenamesSeat; isHost: boolean; send: Send }) {
  const canPick = seat?.role === "spymaster" && seat.team === snapshot.draftTurn;
  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Draft</h2>
        <p className={`cn-status team-${snapshot.draftTurn}`}><strong>{label(snapshot.draftTurn)} spymaster picks next</strong></p>
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
        {!isHost && <p className="muted small">Spymasters take turns drafting. {snapshot.host.name} starts the game.</p>}
      </section>
    </div>
    {isHost && <HostControlsTab>
      <div className="host-actions">
        <button className="primary" onClick={() => send({ type: "begin" })}>Start game</button>
        <button onClick={() => send({ type: "abort" })}>Back to lobby</button>
        <p className="muted small">You can start at any point; each team needs at least one operative.</p>
      </div>
    </HostControlsTab>}
    </>
  );
}

function Waiting({ snapshot, seat, isHost, send }: { snapshot: CodenamesSnapshot; seat?: CodenamesSeat; isHost: boolean; send: Send }) {
  const [wordCount, setWordCount] = useState(snapshot.wordCount);
  const [hintLimit, setHintLimit] = useState(snapshot.hintLimit);
  const full = snapshot.seats.length >= snapshot.maxPlayers;

  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Teams <span className="pill">{snapshot.seats.length}/{snapshot.maxPlayers}</span></h2>
        <div className="teams">
          {TEAMS.map(team => {
            const members = snapshot.seats.filter(item => item.team === team);
            const spymaster = members.find(item => item.role === "spymaster");
            const operatives = members.filter(item => item.role === "operative");
            const sit = (role: Role) => send({ type: "seat", team, role });
            const is = (role: Role) => seat?.team === team && seat.role === role;
            return (
              <div key={team} className={`team-box team-${team}`}>
                <h3>{label(team)} team</h3>
                <p className="small muted">Spymaster</p>
                <p className="row">{spymaster ? <><Person id={spymaster.id} name={spymaster.username} />{snapshot.phase === "lobby" && <KickButton id={spymaster.id} name={spymaster.username} isHost={isHost} send={send} />}</> : <span className="muted">Empty</span>}</p>
                <button disabled={is("spymaster") || (!!spymaster && spymaster.id !== seat?.id)} onClick={() => sit("spymaster")}>Be spymaster</button>
                <p className="small muted">Operatives</p>
                {operatives.length === 0 ? <p className="muted">None yet</p> : <ul className="names">{operatives.map(item => <li key={item.id} className={`row between ${item.connected ? "" : "offline"}`}><Person id={item.id} name={item.username} /><KickButton id={item.id} name={item.username} isHost={isHost} send={send} /></li>)}</ul>}
                <button disabled={is("operative") || (full && !seat)} onClick={() => sit("operative")}>Be operative</button>
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
          Number of words ({snapshot.wordPoolSize} available)
          <input type="number" min={9} max={Math.min(60, snapshot.wordPoolSize)} value={wordCount} onChange={event => setWordCount(Number(event.target.value))} />
        </label>
        <label className="field">
          Hints per spymaster
          <input type="number" min={0} max={10} value={hintLimit} onChange={event => setHintLimit(Number(event.target.value))} />
        </label>
        <div className="row">
          <button onClick={() => send({ type: "scramble_teams" })}>Scramble teams</button>
          <button onClick={() => send({ type: "scramble" })}>Scramble spymasters</button>
        </div>
        <button className="primary" onClick={() => send({ type: "start", wordCount, hintLimit })}>Start draft</button>
        <p className="muted small">Scramble teams assigns everyone connected to balanced teams with one spymaster per team. Scramble spymasters only reassigns the two spymaster roles.</p>
      </div>
    </HostControlsTab>}
    </>
  );
}

function useViewportWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function Table({ snapshot, seat, isHost, send }: { snapshot: CodenamesSnapshot; seat?: CodenamesSeat; isHost: boolean; send: Send }) {
  const [clueWord, setClueWord] = useState("");
  const [clueNumber, setClueNumber] = useState("1");
  const playing = snapshot.phase === "playing";
  const viewport = useViewportWidth();
  const longest = snapshot.board.reduce((max, card) => Math.max(max, card.word.length), 0);
  const wide = Math.ceil(Math.sqrt(snapshot.board.length));
  // On phones, use as many columns as fit the longest word on one line.
  const columns = viewport > 700 ? wide : Math.max(2, Math.min(wide, Math.floor((viewport - 40) / (longest * 8 + 22))));
  const myTurn = playing && seat?.team === snapshot.turn;
  const canClue = myTurn && seat?.role === "spymaster" && !snapshot.clue;
  const canGuess = myTurn && seat?.role === "operative" && !!snapshot.clue;
  const canTag = myTurn && seat?.role === "operative";
  const pressTimer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);
  const lastPointer = useRef("mouse");
  const canHint = myTurn && seat?.role === "spymaster";
  const [hintMode, setHintMode] = useState(false);
  const clue = snapshot.clue;

  const submitClue = () => {
    send({ type: "clue", word: clueWord.trim(), number: clueNumber === "unlimited" ? null : Number(clueNumber) });
    setClueWord("");
  };

  let status: string;
  if (!playing) {
    status = snapshot.endReason === "assassin"
      ? `${label(snapshot.winner!)} team wins — the other team found the assassin!`
      : `${label(snapshot.winner!)} team wins — all agents found!`;
  } else if (clue) {
    const left = clue.max === null ? "unlimited" : `${clue.max - clue.guesses} left`;
    status = `${label(snapshot.turn)} operatives guess · clue “${clue.word}” ${clue.number ?? "∞"} · guesses ${left}`;
  } else {
    status = `${label(snapshot.turn)} spymaster is thinking of a clue…`;
  }

  return (
    <div className="cn-layout">
    <div className="cn-main">
      <HistoryPanel title="History">
        {snapshot.history.length === 0 ? <p className="muted">No clues yet.</p> : (
          <ul className="names">
            {[...snapshot.history].reverse().map((entry, index) => (
              <li key={index}>
                <strong className={`text-${entry.team}`}>{label(entry.team)}</strong> “{entry.clue}” {entry.number ?? "∞"}:{" "}
                {entry.guesses.length === 0 ? <span className="muted">no guesses</span> : entry.guesses.map((guess, i) => <span key={i} className={`guess g-${guess.color}`}>{guess.word}</span>)}
              </li>
            ))}
          </ul>
        )}
      </HistoryPanel>
      <div className={`cn-status cn-status-bar team-${snapshot.winner ?? snapshot.turn}`}>
        <strong>{status}</strong>
        {playing && snapshot.turnEndsAt && <TurnTimer snapshot={snapshot} />}
        {snapshot.remaining && <span className="small cn-remaining">Red <strong>{snapshot.remaining.red}</strong> · Blue <strong>{snapshot.remaining.blue}</strong></span>}
      </div>
      <p className="muted small">
        {seat
          ? <>You are <strong className={`text-${seat.team}`}>{label(seat.team)} {seat.role}</strong>.</>
          : "You are spectating."}
        {playing && seat?.role === "spymaster" && " You can see every card."}
      </p>

      <div className="cn-board" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {snapshot.board.map((card, index) => {
          const hintable = canHint && hintMode && !card.revealed && seat && card.color === (seat.team === "red" ? "blue" : "red") && !card.hint;
          return (
            <button
              key={index}
              className={`cn-card ${card.color ? `c-${card.color}` : ""} ${card.revealed ? "revealed" : card.color ? "hinted" : ""} ${card.hint ? `hint-${card.hint} hint-${card.hintTeam}` : ""} ${hintable ? "hintable" : ""}`}
              disabled={card.revealed || !(canGuess || hintable || canTag)}
              onClick={() => {
                if (longPressed.current) { longPressed.current = false; return; }
                if (hintable) { send({ type: "hint", index }); setHintMode(false); }
                else if (canGuess) send({ type: "guess", index });
              }}
              onContextMenu={event => {
                event.preventDefault();
                if (canTag && !card.revealed && lastPointer.current !== "touch") send({ type: "tag", index });
              }}
              onPointerDown={event => {
                lastPointer.current = event.pointerType;
                if (event.pointerType !== "touch" || !canTag || card.revealed) return;
                clearTimeout(pressTimer.current);
                pressTimer.current = window.setTimeout(() => { longPressed.current = true; send({ type: "tag", index }); }, 500);
              }}
              onPointerUp={() => clearTimeout(pressTimer.current)}
              onPointerLeave={() => clearTimeout(pressTimer.current)}
              onPointerCancel={() => clearTimeout(pressTimer.current)}
            >
              {card.tags.length > 0 && <span className="tag-stack">{card.tags.map(name => <span key={name} className={`tag-label tag-${snapshot.turn}`}>{name}</span>)}</span>}
              {card.hint === "received" && <span className="hint-tag">Hint</span>}
              {card.hint === "given" && <span className="hint-tag">{card.hintTo ?? "Hinted"}</span>}
              {card.word}
            </button>
          );
        })}
      </div>

      {canHint && (
        <div className="row">
          <button className={hintMode ? "primary" : ""} disabled={!snapshot.hintsLeft} onClick={() => setHintMode(mode => !mode)}>
            {hintMode ? "Pick one of your words…" : `Hint a word (${snapshot.hintsLeft} left)`}
          </button>
          <span className="muted small">A hint secretly marks one of the other team's agents (a word to avoid) for one random operative.</span>
        </div>
      )}
      {seat?.role === "operative" && snapshot.board.some(card => card.hint === "received") && <p className="muted small">A spymaster sent you a hint: the tinted card marked “Hint” is one of the other team's agents, so avoid it. Only you can see it.</p>}

      {canClue && (
        <section className="card">
          <h2>Give a clue</h2>
          <div className="row">
            <input placeholder="One word" value={clueWord} maxLength={30} onChange={event => setClueWord(event.target.value)} onKeyDown={event => event.key === "Enter" && submitClue()} />
            <select value={clueNumber} onChange={event => setClueNumber(event.target.value)}>
              {Array.from({ length: 10 }, (_, n) => <option key={n} value={n}>{n}</option>)}
              <option value="unlimited">Unlimited</option>
            </select>
            <button className="primary" disabled={!clueWord.trim()} onClick={submitClue}>Send clue</button>
          </div>
        </section>
      )}
      {canGuess && <button onClick={() => send({ type: "endturn" })}>End turn early</button>}

      {isHost && playing && <button onClick={() => send({ type: "abort" })}>Abort game</button>}
      {!playing && (isHost
        ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button>
        : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>)}
    </div>
    <aside className="cn-side">
      <h3>Players</h3>
      {TEAMS.map(team => {
        const members = snapshot.seats.filter(item => item.team === team);
        return (
          <div key={team} className={`team-box team-${team} ${playing && snapshot.turn === team ? "active" : ""}`}>
            <h4>{label(team)}{playing && <TeamTime snapshot={snapshot} team={team} />}</h4>
            <ul className="names">
              {[...members.filter(item => item.role === "spymaster"), ...members.filter(item => item.role === "operative")].map(item => (
                <li key={item.id} className={item.connected ? "" : "offline"}>
                  <Person id={item.id} name={item.username} size={20} />{item.role === "spymaster" && <span className="pill">spy</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {snapshot.spectators.length > 0 && (
        <section className="card cn-spectators">
          <h4>Spectators ({snapshot.spectators.length})</h4>
          <ul className="names">
            {snapshot.spectators.map(person => (
              <li key={person.id} className="row between">
                <Person id={person.id} name={person.username} size={20} />
                {isHost && playing && <span className="row">
                  {TEAMS.map(team => <button key={team} className={`text-${team}`} onClick={() => send({ type: "assign", userId: person.id, team })}>Add {label(team)}</button>)}
                </span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
    </div>
  );
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// Seconds left in the running turn, re-rendered several times a second.
function useSecondsLeft(snapshot: CodenamesSnapshot) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick(value => value + 1), 250);
    return () => window.clearInterval(timer);
  }, []);
  // The offset is fixed when the snapshot arrives; recomputing it every render would cancel the elapsed time out.
  const offset = useMemo(() => snapshot.now - Date.now(), [snapshot.now]);
  return Math.max(0, Math.ceil(((snapshot.turnEndsAt ?? 0) - (Date.now() + offset)) / 1000));
}

function TurnTimer({ snapshot }: { snapshot: CodenamesSnapshot }) {
  const seconds = useSecondsLeft(snapshot);
  return <span className={`cn-timer ${seconds <= 15 ? "low" : ""}`} title="Time left for this team's turn">⏱ {clock(seconds)}</span>;
}

// The team on turn shows its live countdown; the other team shows the time it has banked for its next turn.
function TeamTime({ snapshot, team }: { snapshot: CodenamesSnapshot; team: Team }) {
  const seconds = useSecondsLeft(snapshot);
  if (snapshot.turn === team) return <span className={`cn-team-time ${seconds <= 15 ? "low" : ""}`}>⏱ {clock(seconds)}</span>;
  const banked = Math.round((snapshot.timeBank?.[team] ?? 0) / 1000);
  return <span className="cn-team-time muted" title="Time left over from the previous turn, added to the next one">{banked > 0 ? `+${clock(banked)} banked` : "no time banked"}</span>;
}