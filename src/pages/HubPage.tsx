import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { gameFaviconUrl } from "../gameFavicon";
import type { GameInfo, LobbySummary, User } from "../types";

export function HubPage({ user }: { user: User }) {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [lobbies, setLobbies] = useState<LobbySummary[]>([]);
  const [error, setError] = useState("");
  const [gameId, setGameId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const loadLobbies = useCallback(async () => {
    try {
      setLobbies((await api<{ lobbies: LobbySummary[] }>("/api/lobbies")).lobbies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load lobbies.");
    }
  }, []);

  useEffect(() => {
    api<{ games: GameInfo[] }>("/api/games")
      .then(result => {
        setGames(result.games);
        setGameId(current => current || result.games[0]?.id || "");
      })
      .catch(e => setError(e.message));
    void loadLobbies();
    const interval = window.setInterval(() => void loadLobbies(), 5000);
    return () => window.clearInterval(interval);
  }, [loadLobbies]);

  const gameName = (id: string) => games.find(game => game.id === id)?.name ?? id;
  const selected = games.find(game => game.id === gameId);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api<{ lobby: LobbySummary }>("/api/lobbies", { method: "POST", body: JSON.stringify({ game: gameId, name, password }) });
      window.location.hash = `#/lobby/${result.lobby.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create lobby.");
    } finally {
      setBusy(false);
    }
  };

  const close = async (lobby: LobbySummary) => {
    if (!window.confirm(`Close lobby "${lobby.name}"?`)) return;
    try {
      await api(`/api/lobbies/${lobby.id}`, { method: "DELETE" });
      await loadLobbies();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not close lobby.");
    }
  };

  return (
    <div className="page">
      <h1>lobbies</h1>
      {error && <p className="error">{error}</p>}

      {(user.isAdmin || user.isHoster) && (
        <section className="card">
          <h2>create a lobby</h2>
          <form className="row create-lobby" onSubmit={create}>
            <select value={gameId} onChange={e => setGameId(e.target.value)} required>
              {games.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}
            </select>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Lobby name" maxLength={40} required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (optional)" maxLength={128} autoComplete="new-password" />
            <button className="primary" disabled={busy || !gameId}>Create lobby</button>
          </form>
          {selected && <p className="muted small">{selected.description}</p>}
        </section>
      )}

      <section className="card">
        {lobbies.length === 0 ? <p className="muted">No open lobbies{(user.isAdmin || user.isHoster) ? " — create one above." : " yet. Ask an admin or hoster to open one."}</p> : (
          <ul className="lobby-list">
            {lobbies.map(lobby => (
              <li key={lobby.id} className="hub-lobby" data-game={lobby.game}>
                <div>
                  <span className="pill game-pill">
                    {gameFaviconUrl(lobby.game) && <img className="game-favicon" src={gameFaviconUrl(lobby.game)} alt="" aria-hidden="true" />}
                    {gameName(lobby.game)}
                  </span> <strong>{lobby.name}</strong><span className="lobby-player-count">({lobby.playerCount}/{lobby.maxPlayers})</span>{lobby.isPasswordProtected && <span className="pill" aria-label="Password protected">🔒 Password</span>}
                  <span className="muted lobby-hosted-by">hosted by {lobby.hostName}</span>
                </div>
                <div className="row">
                  <a className="button primary hub-join" href={`#/lobby/${lobby.id}`}>{user.isDisplay ? "Show" : "Join"}</a>
                  {(user.isAdmin || lobby.hostId === user.id) && <button className="danger" onClick={() => void close(lobby)}>Close</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
