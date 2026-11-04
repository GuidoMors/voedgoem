import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Person } from "../../avatar/Avatar";
import type { GameLobbyProps } from "../types";
import type { WordleFeedback, WordlePvpSnapshot, WordleTeamId } from "./types";
import "./styles.css";

const TEAM_IDS: WordleTeamId[] = ["red", "blue"];
const TEAM_NAMES: Record<WordleTeamId, string> = { red: "Red", blue: "Blue" };
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const keyPriority: Record<WordleFeedback, number> = { absent: 1, present: 2, correct: 3 };

function useTheme() {
  const [theme, setTheme] = useState<"day" | "night">(() => {
    const saved = localStorage.getItem("wordle-pvp-theme");
    if (saved === "day" || saved === "night") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  });
  useEffect(() => localStorage.setItem("wordle-pvp-theme", theme), [theme]);
  useEffect(() => {
    document.body.dataset.wordleTheme = theme;
    return () => { delete document.body.dataset.wordleTheme; };
  }, [theme]);
  return [theme, () => setTheme(value => value === "day" ? "night" : "day")] as const;
}

function useGameNow(snapshot: WordlePvpSnapshot) {
  const offset = useMemo(() => snapshot.now - Date.now(), [snapshot.now]);
  const [now, setNow] = useState(snapshot.now);
  useEffect(() => {
    setNow(Date.now() + offset);
    const timer = window.setInterval(() => setNow(Date.now() + offset), 200);
    return () => window.clearInterval(timer);
  }, [offset]);
  return now;
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function TeamPanel({ snapshot, team, now, send }: {
  snapshot: WordlePvpSnapshot;
  team: WordleTeamId;
  now: number;
  send: (message: Record<string, unknown>) => void;
}) {
  const info = snapshot.teams[team];
  const viewerOnTeam = snapshot.viewer?.team === team;
  const activeClock = info.locked ? info.remainingMs : Math.max(0, info.remainingMs - Math.max(0, now - snapshot.now));
  const seconds = Math.max(0, Math.ceil(activeClock / 1000));
  return <section className={`wp-team wp-team-${team}`} aria-label={`${TEAM_NAMES[team]} team`}>
    <header className="wp-team-header">
      <h2>{TEAM_NAMES[team]}</h2>
      <strong className={`wp-clock ${seconds <= 60 && !info.locked ? "wp-clock-urgent" : ""}`}>{formatTime(activeClock)}</strong>
    </header>
    <p className="wp-team-score"><strong>{info.solved}</strong> / {info.total} solved <span>·</span> {info.guesses} guesses</p>
    <ul className="wp-player-list">
      {info.players.map(player => <li className={!player.connected ? "wp-offline" : ""} key={player.id}>
        <Person id={player.id} name={player.username} size={22} />
        {player.isYou && <span className="wp-you">You</span>}
        <span className="wp-player-status">
          {info.locked ? "Done" : player.active ? "Playing" : `Waiting · ${player.queueCount} queued`}
        </span>
      </li>)}
      {info.players.length === 0 && <li className="wp-muted">No players yet.</li>}
    </ul>
    {snapshot.options.join && !snapshot.viewer && <button className="wp-join" onClick={() => send({ type: "join", team })}>Join {TEAM_NAMES[team]}</button>}
    {viewerOnTeam && snapshot.options.leave && <button className="wp-leave" onClick={() => send({ type: "leave" })}>Leave team</button>}
  </section>;
}

function GuessBoard({ snapshot, send }: { snapshot: WordlePvpSnapshot; send: (message: Record<string, unknown>) => void }) {
  const [guess, setGuess] = useState("");
  const [notice, setNotice] = useState("");
  const current = snapshot.current;
  const team = snapshot.viewer ? snapshot.teams[snapshot.viewer.team] : null;
  const feedback = current?.feedback;
  useEffect(() => { setGuess(""); setNotice(""); }, [current?.puzzleId, feedback?.guess]);

  if (!snapshot.viewer || !team) return <section className="wp-puzzle"><p className="wp-muted">Join a team to receive a puzzle.</p></section>;
  if (team.locked && !feedback) return <section className="wp-puzzle"><h2>Your team is done</h2><p className="wp-muted">Your score is locked. The other team can continue until it finishes or runs out of time.</p></section>;
  if (!current) return <section className="wp-puzzle"><h2>Waiting<span className="wp-wait-dots" aria-label="…"><i>.</i><i>.</i><i>.</i></span></h2><p className="wp-muted">A puzzle will appear here when one reaches you.</p></section>;

  const keyboard = new Map<string, WordleFeedback>();
  for (const item of current.history) {
    item.guess.split("").forEach((letter, index) => {
      const state = item.result[index];
      if (!state || keyPriority[state] <= keyPriority[keyboard.get(letter) ?? "absent"]) return;
      keyboard.set(letter, state);
    });
  }
  const addLetter = (letter: string) => {
    if (!snapshot.options.guess || feedback || guess.length >= 5) return;
    setGuess(value => `${value}${letter.toLowerCase()}`);
    setNotice("");
  };
  const submitGuess = (event: FormEvent) => {
    event.preventDefault();
    if (!snapshot.options.guess || guess.length !== 5) return;
    send({ type: "guess", word: guess });
    setNotice("");
  };

  return <section className="wp-puzzle">
    <header className="wp-puzzle-header">
      <div><p className="wp-eyebrow">{TEAM_NAMES[snapshot.viewer.team]} team puzzle</p><h2>Make a guess</h2></div>
      <span className="wp-queue-count">{current.queueCount} queued</span>
    </header>
    <div className="wp-board" aria-label="Wordle guesses">
      {current.history.map((item, row) => <div className="wp-board-row" key={`${row}-${item.guess}`}>
        {item.guess.split("").map((letter, index) => <span className={`wp-tile wp-tile-${item.result[index]}`} key={`${row}-${index}`} aria-label={`${letter}, ${item.result[index]}`}>
          {letter.toUpperCase()}
        </span>)}
      </div>)}
      {!feedback && snapshot.options.guess && <div className="wp-board-row wp-current-row">
        {Array.from({ length: 5 }, (_, index) => <span className={`wp-tile ${guess[index] ? "wp-tile-filled" : ""}`} key={index}>{guess[index]?.toUpperCase() ?? ""}</span>)}
      </div>}
    </div>
    {feedback && <p className={`wp-feedback ${feedback.solved ? "wp-feedback-solved" : ""}`} role="status">
      {feedback.solved ? "Word solved!" : "Guess recorded."} Showing result for 1.5 seconds…
    </p>}
    {notice && <p className="wp-error" role="alert">{notice}</p>}
    {snapshot.options.guess && !feedback && <>
      <form className="wp-guess-form" onSubmit={submitGuess}>
        <input aria-label="Enter a five-letter guess" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={5} value={guess} onChange={event => {
          setGuess(event.target.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5));
          setNotice("");
        }} />
        <button type="submit" disabled={guess.length !== 5}>Guess</button>
      </form>
      <div className="wp-keyboard" aria-label="On-screen keyboard">
        {KEY_ROWS.map((row, index) => <div className="wp-key-row" key={row}>
          {index === 2 && <button className="wp-key wp-key-wide" type="button" onClick={() => {
            if (guess.length === 5 && snapshot.options.guess) send({ type: "guess", word: guess });
          }}>Enter</button>}
          {[...row].map(letter => <button className={`wp-key ${keyboard.has(letter.toLowerCase()) ? `wp-key-${keyboard.get(letter.toLowerCase())}` : ""}`} key={letter} type="button" onClick={() => addLetter(letter)}>{letter}</button>)}
          {index === 2 && <button className="wp-key wp-key-wide" type="button" onClick={() => setGuess(value => value.slice(0, -1))} aria-label="Delete">⌫</button>}
        </div>)}
      </div>
      <p className="wp-muted wp-hint">Only words in the game’s word list are accepted. Invalid guesses do not count.</p>
    </>}
    {!snapshot.options.guess && !feedback && <p className="wp-muted">Waiting for the team’s timer or next puzzle.</p>}
  </section>;
}

function Results({ snapshot, isHost, send }: {
  snapshot: WordlePvpSnapshot;
  isHost: boolean;
  send: (message: Record<string, unknown>) => void;
}) {
  if (snapshot.phase !== "results") return null;
  const winner = snapshot.winner;
  return <section className="wp-results" aria-live="polite">
    <p className="wp-eyebrow">Match complete</p>
    <h2>{winner === "draw" ? "It’s a tie" : `${winner ? TEAM_NAMES[winner] : "No"} team wins`}</h2>
    <div className="wp-result-teams">{TEAM_IDS.map(team => <div className={`wp-result-team wp-team-${team}`} key={team}>
      <h3>{TEAM_NAMES[team]}</h3>
      <strong>{snapshot.teams[team].solved} / 10</strong><span>solved</span>
      <span>{snapshot.teams[team].guesses} guesses</span>
      <span>{formatTime(snapshot.teams[team].remainingMs)} left</span>
    </div>)}</div>
    {isHost && <button onClick={() => send({ type: "close_results" })}>Return to lobby</button>}
  </section>;
}

export function WordlePvpLobby({ snapshot, isHost, send }: GameLobbyProps<WordlePvpSnapshot>) {
  const [theme, toggleTheme] = useTheme();
  const now = useGameNow(snapshot);
  return <main className={`wordle-pvp wp-${theme}`}>
    <header className="wp-header">
      <div><p className="wp-eyebrow">Team word puzzle</p><h1>Wordle PvP</h1></div>
      <button className="wp-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "day" ? "night" : "day"} mode`}>
        {theme === "day" ? "Night mode" : "Day mode"}
      </button>
    </header>
    {snapshot.phase === "lobby" ? <>
      <p className="wp-intro">Solve the same ten words together. Every accepted guess sends the unsolved puzzle to the next teammate.</p>
      <div className="wp-teams">{TEAM_IDS.map(team => <TeamPanel key={team} {...{ snapshot, team, now, send }} />)}</div>
      {snapshot.options.leave && <p className="wp-muted">You can switch teams by leaving and joining the other team.</p>}
      {isHost && <div className="wp-host-controls">
        <button className="wp-primary" disabled={!snapshot.options.start} onClick={() => send({ type: "start" })}>Start game</button>
        {!snapshot.options.start && <p className="wp-muted">Both teams need at least one player before the game can start.</p>}
      </div>}
    </> : <>
      {snapshot.matchOver && <div className="wp-over" role="status"><strong>Wordling is over</strong><span>Final scores appear shortly.</span></div>}
      <div className="wp-scoreboard">{TEAM_IDS.map(team => <TeamPanel key={team} {...{ snapshot, team, now, send }} />)}</div>
      <GuessBoard snapshot={snapshot} send={send} />
      <Results snapshot={snapshot} isHost={isHost} send={send} />
    </>}
    <footer className="wp-footer"><span>Hosted by {snapshot.host.name}</span>{snapshot.phase === "lobby" && <span>{snapshot.seats.length}/20 players</span>}</footer>
  </main>;
}
