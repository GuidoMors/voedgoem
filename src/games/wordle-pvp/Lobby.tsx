import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Person } from "../../avatar/Avatar";
import type { GameLobbyProps } from "../types";
import type { WordleFeedback, WordlePvpSnapshot, WordleTeamId, WordlePuzzleSnapshot } from "./types";

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

function PuzzleProgress({ puzzle, team }: { puzzle: WordlePuzzleSnapshot; team: WordleTeamId }) {
  return <li className={`wp-puzzle-spot wp-puzzle-spot-${team} ${puzzle.solved ? "wp-puzzle-spot-solved" : ""}`}>
    <div className="wp-puzzle-history" aria-label={`Wordle guesses, spot ${puzzle.id + 1}`}>
      {(puzzle.history.length ? puzzle.history : [null]).map((guess, row) => <div className="wp-puzzle-history-row" key={row}>
        {Array.from({ length: 5 }, (_, index) => {
          const result = guess?.result[index];
          return <span
            className={`wp-puzzle-history-tile ${result ? `wp-tile-${result}` : ""}`}
            key={index}
            aria-label={result ? `Letter ${index + 1}: ${result}` : `Empty letter ${index + 1}`}
          />;
        })}
      </div>)}
    </div>
    <div className={`wp-puzzle-spot-player ${puzzle.player?.connected === false ? "wp-offline" : ""}`}>
      {puzzle.player
        ? <Person id={puzzle.player.id} name={puzzle.player.username} size={18} />
        : puzzle.solved && <span className="wp-puzzle-spot-status">Solved</span>}
      {puzzle.waitingPlayers.length > 0 && <span className="wp-puzzle-waiting">
        <span>Waiting:</span>
        {puzzle.waitingPlayers.map(player => <span
          className="wp-puzzle-waiting-player"
          key={player.id}
          aria-label={`${player.username} is waiting`}
          title={`${player.username} is waiting`}
        >
          <Person id={player.id} name={player.username} size={16} />
        </span>)}
      </span>}
    </div>
  </li>;
}

function TeamPanel({ snapshot, team, now, send }: {
  snapshot: WordlePvpSnapshot;
  team: WordleTeamId;
  now: number;
  send: (message: Record<string, unknown>) => void;
}) {
  const info = snapshot.teams[team];
  const viewerOnTeam = snapshot.viewer?.team === team;
  const activeClock = info.locked || snapshot.phase !== "playing" || snapshot.matchOver
    ? info.remainingMs
    : Math.max(0, info.remainingMs - Math.max(0, now - snapshot.now));
  const seconds = Math.max(0, Math.ceil(activeClock / 1000));
  return <section className={`wp-team wp-team-${team} ${viewerOnTeam ? "wp-team-own" : "wp-team-opponent"}`} aria-label={`${TEAM_NAMES[team]} team`}>
    <div className="wp-team-timer">
      <strong className={`wp-clock ${seconds <= 60 && !info.locked ? "wp-clock-urgent" : ""}`}>{formatTime(activeClock)}</strong>
    </div>
    <p className={`wp-team-score wp-team-score-${team}`}>
      <span className="wp-team-solved"><strong>{info.solved}</strong> / {info.total} solved</span>
      <span className="wp-team-guesses">{info.guesses} guesses</span>
    </p>
    {snapshot.phase === "playing"
      ? <ol className="wp-puzzle-spots">{info.puzzles.map(puzzle => <PuzzleProgress key={puzzle.id} puzzle={puzzle} team={team} />)}</ol>
      : <ul className="wp-player-list">
          {info.players.map(player => <li className={!player.connected ? "wp-offline" : ""} key={player.id}>
            <Person id={player.id} name={player.username} size={22} />
            {player.isYou && <span className="wp-you">You</span>}
            <span className="wp-player-status">Waiting</span>
          </li>)}
          {info.players.length === 0 && <li className="wp-muted">No players yet.</li>}
        </ul>}
    {snapshot.options.join && (!snapshot.viewer || snapshot.viewer.team !== team) && <button className="wp-join" onClick={() => send({ type: "join", team })}>Join {TEAM_NAMES[team]}</button>}
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

  if (snapshot.phase === "results") {
    const winner = snapshot.winner;
    return <section className="wp-puzzle wp-puzzle-result" aria-live="polite">
      <h2 className={winner && winner !== "draw" ? `wp-winner-${winner}` : ""}>
        {winner === "draw" ? "IT’S A TIE" : `${winner ? TEAM_NAMES[winner].toUpperCase() : "NO"} TEAM WINS`}
      </h2>
    </section>;
  }
  if (!snapshot.viewer || !team) return <section className="wp-puzzle"><p className="wp-muted">Join a team to receive a puzzle.</p></section>;
  if (team.locked && !feedback) return <section className="wp-puzzle"><h2>Your team is done</h2><p className="wp-muted">Your score is locked. The other team can continue until it finishes or runs out of time.</p></section>;
  if (!current) return <section className="wp-puzzle"><h2>Waiting<span className="wp-wait-dots" aria-label="…"><i>.</i><i>.</i><i>.</i></span></h2><p className="wp-muted">Your next Wordle spot is occupied or all puzzles are solved.</p></section>;

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
      {feedback.solved ? "Word solved!" : "Moving to the next Wordle spot..."}
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
    </>}
    {!snapshot.options.guess && !feedback && <p className="wp-muted">Waiting for the team’s timer or next puzzle.</p>}
  </section>;
}

function Results({ snapshot }: {
  snapshot: WordlePvpSnapshot;
}) {
  if (snapshot.phase !== "results") return null;
  return <section className="wp-results" aria-live="polite">
    <div className="wp-result-teams">{TEAM_IDS.map(team => <div className={`wp-result-team wp-team-${team}`} key={team}>
      <h3>{TEAM_NAMES[team]}</h3>
      <strong>{snapshot.teams[team].solved} / 10</strong><span>solved</span>
      <span>{snapshot.teams[team].guesses} guesses</span>
      <span>{formatTime(snapshot.teams[team].remainingMs)} left</span>
      <ul className="wp-result-players">
        {snapshot.teams[team].players.map(player => <li key={player.id}>
          <Person id={player.id} name={player.username} size={22} />
          <span>{player.stats.guesses} guesses · <span className="wp-result-yellow">{player.stats.yellow} new yellow</span> · <span className="wp-result-green">{player.stats.green} new green</span></span>
        </li>)}
      </ul>
    </div>)}</div>
  </section>;
}

export function WordlePvpLobby({ snapshot, isHost, send }: GameLobbyProps<WordlePvpSnapshot>) {
  const [theme, toggleTheme] = useTheme();
  const [themeSlot, setThemeSlot] = useState<HTMLElement | null>(null);
  const [hostControlsOpen, setHostControlsOpen] = useState(true);
  const [roundMinutes, setRoundMinutes] = useState(String(snapshot.settings.roundMinutes));
  const [penaltySeconds, setPenaltySeconds] = useState(String(snapshot.settings.penaltySeconds));
  const now = useGameNow(snapshot);
  useEffect(() => {
    setRoundMinutes(String(snapshot.settings.roundMinutes));
    setPenaltySeconds(String(snapshot.settings.penaltySeconds));
  }, [snapshot.settings.roundMinutes, snapshot.settings.penaltySeconds]);
  useEffect(() => {
    setThemeSlot(document.getElementById("wordle-theme-slot"));
  }, []);
  const saveSettings = (event: FormEvent) => {
    event.preventDefault();
    send({
      type: "update_settings",
      roundMinutes: Number(roundMinutes),
      penaltySeconds: Number(penaltySeconds)
    });
  };
  return <main className={`wordle-pvp wp-${theme}`}>
    {themeSlot && createPortal(
      <button
        className="wordle-theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "day" ? "night" : "day"} mode`}
        title={`Switch to ${theme === "day" ? "night" : "day"} mode`}
      >
        {theme === "day"
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42" /><circle cx="12" cy="12" r="4" /></svg>
          : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" /></svg>}
      </button>,
      themeSlot
    )}
    {snapshot.phase === "lobby" ? <>
      <div className="wp-lobby-layout">
        <div className="wp-teams">{TEAM_IDS.map(team => <TeamPanel key={team} {...{ snapshot, team, now, send }} />)}</div>
        <aside className="wp-spectators" aria-label="Spectators">
          <h2>Spectators <span>{snapshot.spectators.length}</span></h2>
          {snapshot.spectators.length === 0
            ? <p className="wp-muted">No spectators.</p>
            : <ul>{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} size={22} /></li>)}</ul>}
        </aside>
      </div>
    </> : <>
      {snapshot.matchOver && <div className="wp-over" role="status"><strong>Wordling is over</strong><span>Final scores appear shortly.</span></div>}
      <div className={`wp-game-layout${snapshot.phase === "results" ? " wp-results-layout" : ""}`}>
        {snapshot.phase !== "results" && <TeamPanel snapshot={snapshot} team="red" now={now} send={send} />}
        <GuessBoard snapshot={snapshot} send={send} />
        {snapshot.phase !== "results" && <TeamPanel snapshot={snapshot} team="blue" now={now} send={send} />}
      </div>
      <Results snapshot={snapshot} />
    </>}
    {isHost && (snapshot.phase === "lobby" || snapshot.options.endGame || snapshot.options.closeResults) && <section className="wp-host-tab">
      <div className="wp-host-tablist" role="tablist" aria-label="Host options">
        <button
          id="wp-host-tab"
          type="button"
          role="tab"
          aria-selected={hostControlsOpen}
          aria-controls="wp-host-panel"
          onClick={() => setHostControlsOpen(value => !value)}
        >
          Host controls
        </button>
      </div>
      {hostControlsOpen && <div id="wp-host-panel" className="wp-host-panel" role="tabpanel" aria-labelledby="wp-host-tab">
        {snapshot.phase === "lobby" ? <>
          <form className="wp-settings-form" onSubmit={saveSettings}>
            <label>
              Total time (minutes)
              <input type="number" min={1} max={60} step={1} required value={roundMinutes} onChange={event => setRoundMinutes(event.target.value)} />
            </label>
            <label>
              Time lost when other team solves a Wordle (seconds)
              <input type="number" min={0} max={900} step={1} required value={penaltySeconds} onChange={event => setPenaltySeconds(event.target.value)} />
            </label>
            <button type="submit" className="wp-primary">Save settings</button>
          </form>
          <button className="wp-primary" disabled={!snapshot.options.start} onClick={() => send({ type: "start" })}>Start game</button>
          {!snapshot.options.start && <p className="wp-muted">Both teams need at least one player before the game can start.</p>}
        </> : snapshot.options.endGame
          ? <button className="wp-primary" onClick={() => send({ type: "end_game" })}>End game</button>
          : <button className="wp-primary" onClick={() => send({ type: "close_results" })}>Return to lobby</button>}
      </div>}
    </section>}
  </main>;
}
