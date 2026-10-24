import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import type { GameInfo, LobbySummary, User } from "../types";

export function HubPage({ user }: { user: User }) {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [lobbies, setLobbies] = useState<LobbySummary[]>([]);
  const [error, setError] = useState("");

  const loadLobbies = useCallback(async () => {
    try {
      setLobbies((await api<{ lobbies: LobbySummary[] }>("/api/lobbies")).lobbies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load lobbies.");
    }
  }, []);

  useEffect(() => {
    api<{ games: GameInfo[] }>("/api/games").then(result => setGames(result.games)).catch(e => setError(e.message));
    void loadLobbies();
    const interval = window.setInterval(() => void loadLobbies(), 5000);
    return () => window.clearInterval(interval);
  }, [loadLobbies]);

  return (
    <div className="page">
      <h1>Games</h1>
      {error && <p className="error">{error}</p>}
      {games.map(game => (
        <GameSection key={game.id} game={game} lobbies={lobbies.filter(lobby => lobby.game === game.id)} user={user} onChanged={loadLobbies} onError={setError} />
      ))}
    </div>
  );
}

function GameSection({ game, lobbies, user, onChanged, onError }: {
  game: GameInfo;
  lobbies: LobbySummary[];
  user: User;
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api<{ lobby: LobbySummary }>("/api/lobbies", { method: "POST", body: JSON.stringify({ game: game.id, name }) });
      window.location.hash = `#/lobby/${result.lobby.id}`;
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not create lobby.");
    } finally {
      setBusy(false);
    }
  };

  const close = async (lobby: LobbySummary) => {
    if (!window.confirm(`Close lobby "${lobby.name}"?`)) return;
    try {
      await api(`/api/lobbies/${lobby.id}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not close lobby.");
    }
  };

  return (
    <section className="card game-card">
      <div className="game-head">
        <div>
          <h2>{game.name}</h2>
          <p className="muted">{game.description}</p>
        </div>
        <span className="pill">up to {game.maxPlayers} players</span>
      </div>
      <h3>Lobbies</h3>
      {lobbies.length === 0 ? <p className="muted">No open lobbies{user.isAdmin ? " — create one below." : " yet. Ask an admin to open one."}</p> : (
        <ul className="lobby-list">
          {lobbies.map(lobby => (
            <li key={lobby.id}>
              <div><strong>{lobby.name}</strong><span className="muted"> hosted by {lobby.hostName}</span></div>
              <div className="row">
                <a className="button primary" href={`#/lobby/${lobby.id}`}>Join</a>
                {(user.isAdmin || lobby.hostId === user.id) && <button className="danger" onClick={() => void close(lobby)}>Close</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {user.isAdmin && (
        <form className="row create-lobby" onSubmit={create}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="New lobby name" maxLength={40} required />
          <button className="primary" disabled={busy}>Create lobby</button>
        </form>
      )}
    </section>
  );
}
