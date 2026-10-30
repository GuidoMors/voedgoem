import { useCallback, useEffect, useState } from "react";
import { AvatarsContext, Person } from "../avatar/Avatar";
import { GameLobby } from "../games/registry";
import type { Send } from "../games/types";
import { useLobbyConnection } from "../useLobbyConnection";
import type { LobbySnapshot, User } from "../types";

const noop = () => undefined;

export function LobbyPage({ lobbyId, user, onGameChange }: { lobbyId: string; user: User; onGameChange: (game: string | null) => void }) {
  const { snapshot, status, send, notice, avatars } = useLobbyConnection(lobbyId);
  const [controlling, setControlling] = useState<string | null>(null);

  const gameId = snapshot?.game;
  useEffect(() => {
    onGameChange(gameId ?? null);
    if (!gameId) return;
    document.body.dataset.game = gameId;
    return () => { delete document.body.dataset.game; onGameChange(null); };
  }, [gameId, onGameChange]);

  const sendAsBot = useCallback<Send>(message => {
    if (controlling && !user.isDisplay) send({ type: "bot:act", botId: controlling, message });
  }, [controlling, send, user.isDisplay]);

  if (status === "closed") {
    return <div className="page"><p className="error">This lobby no longer exists or could not be joined.</p><a className="button" href="#/">Back to hub</a></div>;
  }
  if (!snapshot) return <div className="page"><p className="muted">Connecting to lobby…</p></div>;

  const bot = snapshot.bots.find(item => item.id === controlling);
  const botView = bot && snapshot.botViews?.[bot.id];
  const acting = !!bot && !!botView;
  const view = acting ? ({ ...snapshot, ...botView } as LobbySnapshot) : snapshot;

  return (
    <AvatarsContext.Provider value={avatars}>
    <div className="page">
      <div className="row between">
        <h1>{snapshot.name}</h1>
        <div className="row lobby-head-right">
          <span className="host-tag">Hosted by {snapshot.host.name}{status === "reconnecting" && " · reconnecting…"}</span>
          <a className="button" href="#/">Leave lobby</a>
        </div>
      </div>
      {notice && <p className="error">{notice}</p>}

      {acting && <p className="cn-status">Controlling <strong>{bot.username}</strong>. Everything you do is done as this bot.</p>}

      <GameLobby
        key={acting ? bot.id : "me"}
        snapshot={view}
        userId={acting ? bot.id : user.id}
        isHost={acting ? false : snapshot.host.id === user.id}
        send={user.isDisplay ? noop : acting ? sendAsBot : send}
      />

      {user.isAdmin && (
        <section className="card bot-panel">
          <div className="row between">
            <h2>Test bots</h2>
            <button onClick={() => send({ type: "bot:add" })}>Add bot</button>
          </div>
          {snapshot.bots.length === 0 ? <p className="muted small">Add bots to test this game alone. You can play as any bot.</p> : (
            <ul className="names">
              <li className="row between">
                <Person id={user.id} name={`You (${user.username})`} />
                <button className={!acting ? "primary" : ""} disabled={!acting} onClick={() => setControlling(null)}>{acting ? "Play as me" : "Playing"}</button>
              </li>
              {snapshot.bots.map(item => (
                <li key={item.id} className="row between">
                  <Person id={item.id} name={item.username} />
                  <span className="row">
                    <button className={controlling === item.id ? "primary" : ""} disabled={controlling === item.id} onClick={() => setControlling(item.id)}>{controlling === item.id ? "Playing" : "Control"}</button>
                    <button className="danger" onClick={() => { if (controlling === item.id) setControlling(null); send({ type: "bot:remove", botId: item.id }); }}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
    </AvatarsContext.Provider>
  );
}
