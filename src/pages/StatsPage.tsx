import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { Person } from "../avatar/Avatar";
import type { Avatar } from "../avatar/model";
import type { GameInfo } from "../types";

interface StatDef {
  key: string;
  label: string;
  format: "number" | "percent";
}

interface PlayerRow {
  id: string;
  username: string;
  avatar: Avatar | null;
  values: Record<string, number | null>;
}

interface GameStats {
  stats: StatDef[];
  me: PlayerRow | null;
  players: PlayerRow[];
}

const show = (value: number | null | undefined, def: StatDef) =>
  value === null || value === undefined ? "–" : def.format === "percent" ? `${value}%` : value.toLocaleString();

const PLAYERS_PER_PAGE = 10;

export function StatsPage({ userId, defaultGame, onGameChange }: { userId: string; defaultGame: string | null; onGameChange: (game: string | null) => void }) {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [game, setGame] = useState(defaultGame ?? "");
  const [data, setData] = useState<GameStats | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerSearchError, setPlayerSearchError] = useState("");

  useEffect(() => {
    api<{ games: GameInfo[] }>("/api/games")
      .then(result => { setGames(result.games); setGame(current => current || defaultGame || result.games[0]?.id || ""); })
      .catch(e => setError(e.message));
  }, [defaultGame]);

  useEffect(() => {
    if (defaultGame) setGame(defaultGame);
  }, [defaultGame]);

  useEffect(() => {
    if (!game) return;
    setData(null);
    setPage(1);
    setPageInput("1");
    api<GameStats>(`/api/stats/${game}`).then(setData).catch(e => setError(e.message));
  }, [game]);

  useEffect(() => {
    onGameChange(game || null);
  }, [game, onGameChange]);

  const name = games.find(item => item.id === game)?.name ?? game;
  const pageCount = Math.max(1, Math.ceil((data?.players.length ?? 0) / PLAYERS_PER_PAGE));
  const visiblePlayers = data?.players.slice((page - 1) * PLAYERS_PER_PAGE, page * PLAYERS_PER_PAGE) ?? [];

  const goToPage = (event: FormEvent) => {
    event.preventDefault();
    const requestedPage = Number(pageInput);
    if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > pageCount) {
      setPlayerSearchError(`Enter a page from 1 to ${pageCount}.`);
      return;
    }
    setPage(requestedPage);
    setPlayerSearchError("");
  };

  const findPlayer = (event: FormEvent) => {
    event.preventDefault();
    const query = playerSearch.trim().toLocaleLowerCase();
    const index = data?.players.findIndex(player => player.username.toLocaleLowerCase().includes(query)) ?? -1;
    if (!query || index < 0) {
      setPlayerSearchError(query ? `No player matching "${playerSearch.trim()}" was found.` : "Enter a player name to search.");
      return;
    }
    const playerPage = Math.floor(index / PLAYERS_PER_PAGE) + 1;
    setPage(playerPage);
    setPageInput(String(playerPage));
    setPlayerSearchError("");
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setPageInput(String(nextPage));
    setPlayerSearchError("");
  };

  return (
    <div className="page stats-page" data-game={game || undefined}>
      <h1>Statistics</h1>
      <div className="row stats-tabs" role="tablist">
        {games.map(item => (
          <button key={item.id} role="tab" aria-selected={item.id === game} className={`stats-tab ${item.id === game ? "active" : ""}`} onClick={() => setGame(item.id)}>{item.name}</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {!data ? <p className="muted">Loading…</p> : (
        <>
          <section className="card">
            <h2>Your {name} statistics</h2>
            <div className="stat-grid">
              {data.stats.map(def => (
                <div key={def.key} className="stat">
                  <strong>{show(data.me?.values[def.key] ?? (def.key === "games" ? 0 : null), def)}</strong>
                  <span>{def.label}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>All players <span className="pill">{data.players.length}</span></h2>
            {data.players.length === 0 ? <p className="muted">No finished {name} games yet.</p> : (
              <>
                <div className="row stats-player-tools">
                  <form className="row" onSubmit={findPlayer}>
                    <input value={playerSearch} onChange={event => setPlayerSearch(event.target.value)} placeholder="Search player" aria-label="Search players" />
                    <button type="submit">Find player</button>
                  </form>
                  <form className="row" onSubmit={goToPage}>
                    <label className="row">Page
                      <input className="stats-page-input" type="number" min={1} max={pageCount} value={pageInput} onChange={event => setPageInput(event.target.value)} aria-label="Page number" />
                      of {pageCount}
                    </label>
                    <button type="submit">Go</button>
                  </form>
                </div>
                {playerSearchError && <p className="error" role="status">{playerSearchError}</p>}
                <div className="table-wrap">
                  <table className="stats-table">
                    <thead><tr><th>Player</th>{data.stats.map(def => <th key={def.key} title={def.label}>{def.label}</th>)}</tr></thead>
                    <tbody>
                      {visiblePlayers.map(player => (
                        <tr key={player.id} className={player.id === userId ? "me" : ""}>
                          <td><Person id={player.id} name={player.username} size={20} avatar={player.avatar} /></td>
                          {data.stats.map(def => <td key={def.key}>{show(player.values[def.key], def)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row between stats-pagination" aria-label="Player pages">
                  <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1}>Previous</button>
                  <span className="muted">Page {page} of {pageCount} · Showing {(page - 1) * PLAYERS_PER_PAGE + 1}–{Math.min(page * PLAYERS_PER_PAGE, data.players.length)} of {data.players.length}</span>
                  <button type="button" onClick={() => changePage(page + 1)} disabled={page === pageCount}>Next</button>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
