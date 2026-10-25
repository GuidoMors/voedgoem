import { useEffect, useState } from "react";
import { api } from "../api";
import { Person } from "../avatar/Avatar";
import type { GameInfo } from "../types";

interface StatDef {
  key: string;
  label: string;
  format: "number" | "percent";
}

interface PlayerRow {
  id: string;
  username: string;
  values: Record<string, number | null>;
}

interface GameStats {
  stats: StatDef[];
  me: PlayerRow | null;
  players: PlayerRow[];
}

const show = (value: number | null | undefined, def: StatDef) =>
  value === null || value === undefined ? "–" : def.format === "percent" ? `${value}%` : value.toLocaleString();

export function StatsPage({ userId }: { userId: string }) {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [game, setGame] = useState("");
  const [data, setData] = useState<GameStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ games: GameInfo[] }>("/api/games")
      .then(result => { setGames(result.games); setGame(current => current || result.games[0]?.id || ""); })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!game) return;
    setData(null);
    api<GameStats>(`/api/stats/${game}`).then(setData).catch(e => setError(e.message));
  }, [game]);

  const name = games.find(item => item.id === game)?.name ?? game;

  return (
    <div className="page">
      <h1>Statistics</h1>
      <div className="row stats-tabs" role="tablist">
        {games.map(item => (
          <button key={item.id} role="tab" aria-selected={item.id === game} className={item.id === game ? "primary" : ""} onClick={() => setGame(item.id)}>{item.name}</button>
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
            <p className="muted small">Only finished games with real players count. Aborted games and bots are ignored.</p>
          </section>
          <section className="card">
            <h2>All players <span className="pill">{data.players.length}</span></h2>
            {data.players.length === 0 ? <p className="muted">No finished {name} games yet.</p> : (
              <div className="table-wrap">
                <table className="stats-table">
                  <thead><tr><th>Player</th>{data.stats.map(def => <th key={def.key} title={def.label}>{def.label}</th>)}</tr></thead>
                  <tbody>
                    {data.players.map(player => (
                      <tr key={player.id} className={player.id === userId ? "me" : ""}>
                        <td><Person id={player.id} name={player.username} size={20} /></td>
                        {data.stats.map(def => <td key={def.key}>{show(player.values[def.key], def)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
