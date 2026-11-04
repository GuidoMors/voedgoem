import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AvatarsContext, Person } from "../avatar/Avatar";
import { ChatPanel } from "../components/ChatPanel";
import { GameLobby } from "../games/registry";
import type { Send } from "../games/types";
import { useLobbyConnection } from "../useLobbyConnection";
import { Modal } from "../components/Modal";
import type { LobbySnapshot, User } from "../types";

const noop = () => undefined;

function getTurnBotId(snapshot: LobbySnapshot): string | null {
  const botIds = new Set(snapshot.bots.map(bot => bot.id));

  // Keep each game's bot-turn handling in its own case.
  switch (snapshot.game) {
    case "blokus":
      return snapshot.phase === "playing" && snapshot.turn && botIds.has(snapshot.turn) ? snapshot.turn : null;
    case "dworf":
      return snapshot.phase === "playing" && snapshot.turnId && botIds.has(snapshot.turnId) ? snapshot.turnId : null;
    case "thirtyone": {
      if (snapshot.phase !== "playing") return null;
      const judging = snapshot.turnPhase === "running" && snapshot.judgeAt !== null && snapshot.now >= snapshot.judgeAt;
      const turnPlayerId = judging ? snapshot.judge?.id : snapshot.describer?.id;
      return turnPlayerId && botIds.has(turnPlayerId) ? turnPlayerId : null;
    }
    case "codenames": {
      if (snapshot.phase !== "playing") return null;
      const role = snapshot.clue ? "operative" : "spymaster";
      return snapshot.seats.find(seat => botIds.has(seat.id) && seat.team === snapshot.turn && seat.role === role)?.id ?? null;
    }
    case "tetris":
      return null;
    case "werewolves":
      return null;
    case "pass-time":
      return snapshot.phase === "playing" && snapshot.gameStep === "cards" && botIds.has(snapshot.currentPlayerId ?? "")
        ? snapshot.currentPlayerId
        : null;
    case "kin": {
      const turn = snapshot.world?.play?.turn ?? snapshot.world?.turn;
      return turn && botIds.has(turn) ? turn : null;
    }
  }
}

export function LobbyPage({ lobbyId, user, onGameChange, chatOpen, onChatClose }: { lobbyId: string; user: User; onGameChange: (game: string | null, started?: boolean) => void; chatOpen: boolean; onChatClose: () => void }) {
  const { snapshot, status, send, notice, avatars, chatMessages, passwordRequired, submitPassword } = useLobbyConnection(lobbyId);
  const [controlling, setControlling] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const joinWithPassword = (event: FormEvent) => {
    event.preventDefault();
    submitPassword(password);
    setPassword("");
  };

  const gameId = snapshot?.game;
  const started = !!snapshot && snapshot.phase !== "lobby";
  useEffect(() => {
    onGameChange(gameId ?? null, started);
    if (!gameId) return;
    document.body.dataset.game = gameId;
    return () => { delete document.body.dataset.game; onGameChange(null); };
  }, [gameId, started, onGameChange]);

  const sendAsBot = useCallback<Send>(message => {
    if (controlling && !user.isDisplay) {
      if (message.type === "bot:forcePass") send({ ...message, botId: controlling });
      else send({ type: "bot:act", botId: controlling, message });
    }
  }, [controlling, send, user.isDisplay]);

  if (status === "closed") {
    return <div className="page"><p className="error">{notice ?? "This lobby no longer exists or could not be joined."}</p><a className="button" href="#/">Back to hub</a></div>;
  }
  if (passwordRequired) {
    return (
      <div className="page lobby-password-screen">
        <section className="card auth-card lobby-password-card">
          <h1>Lobby password</h1>
          <p className="muted">Enter the password to join {snapshot?.name ?? "this lobby"}.</p>
          {notice && <p className="error">{notice}</p>}
          <form onSubmit={joinWithPassword}>
            <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} maxLength={128} autoComplete="current-password" autoFocus required /></label>
            <div className="lobby-password-actions">
              <button className="primary" type="submit">Join lobby</button>
              <a className="button" href="#/">Back to hub</a>
            </div>
          </form>
        </section>
      </div>
    );
  }
  if (!snapshot) return <div className="page"><p className="muted">{status === "reconnecting" ? "Reconnecting to lobby…" : "Connecting to lobby…"}</p>{notice && <p className="error">{notice}</p>}<a className="button" href="#/">Back to hub</a></div>;

  const bot = snapshot.bots.find(item => item.id === controlling);
  const botView = bot && snapshot.botViews?.[bot.id];
  const acting = !!bot && !!botView;
  const view = acting ? ({ ...snapshot, ...botView } as LobbySnapshot) : snapshot;
  const turnBotId = getTurnBotId(snapshot);

  const botControls = user.isAdmin && (snapshot.phase === "lobby" || snapshot.bots.length > 0) && (
        <section className="card bot-panel">
          <div className="row between">
            <h2>Test bots</h2>
            <span className="row">
              <button disabled={!turnBotId || controlling === turnBotId} onClick={() => turnBotId && setControlling(turnBotId)}>Control bot whose turn it is</button>
              <button className={snapshot.autoBots ? "primary" : ""} disabled={snapshot.bots.length === 0} onClick={() => send({ type: "bot:auto", enabled: !snapshot.autoBots })}>{snapshot.autoBots ? "Autopilot on" : "Autopilot off"}</button>
              <button disabled={snapshot.bots.length === 0 || snapshot.phase !== "lobby"} onClick={() => send({ type: "bot:join" })}>Bots join game</button>
              <button onClick={() => send({ type: "bot:add" })}>Add bot</button>
            </span>
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
                    {snapshot.game === "kin" && <>
                      <span className="small">{item.forcePass !== false ? "Force pass enabled" : "Normal play"}</span>
                      <button aria-pressed={item.forcePass !== false} title="Enabling passes this bot's current turn; Autopilot handles its later turns." onClick={() => send({ type: "bot:forcePass", botId: item.id, enabled: item.forcePass === false })}>{item.forcePass !== false ? "Disable force pass" : "Enable force pass"}</button>
                    </>}
                    <button className={controlling === item.id ? "primary" : ""} disabled={controlling === item.id} onClick={() => setControlling(item.id)}>{controlling === item.id ? "Playing" : "Control"}</button>
                    <button className="danger" onClick={() => { if (controlling === item.id) setControlling(null); send({ type: "bot:remove", botId: item.id }); }}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      );

  return (
    <AvatarsContext.Provider value={avatars}>
    <div className="page">
          <div className="row between">
            <h1>{snapshot.name}</h1>
            <div className="row lobby-head-right">
              <span className="host-tag">Hosted by {snapshot.host.name}{status === "reconnecting" && " · reconnecting…"}</span>
            </div>
          </div>
          {notice && <p className="error">{notice}</p>}
          {acting && <p className="cn-status">Controlling <strong>{bot.username}</strong>. Everything you do is done as this bot.</p>}
          <GameLobby
            key={acting ? bot.id : "me"}
            snapshot={view}
            userId={acting ? bot.id : user.id}
            isHost={acting ? false : snapshot.host.id === user.id}
            isAdmin={!acting && user.isAdmin}
            isDisplay={user.isDisplay}
            send={user.isDisplay ? noop : acting ? sendAsBot : send}
            hostControls={snapshot.game === "kin" && !user.isDisplay && (snapshot.host.id === user.id || user.isAdmin) ? <>
              <section className="card host-controls-panel">
                <h2>Host controls &amp; rules</h2>
                <button disabled={snapshot.host.id !== user.id} onClick={() => window.confirm("Return to the lobby and discard this game?") && send({ type: "abort" })}>Back to lobby</button>
                {snapshot.host.id !== user.id && <p className="muted small">Only the host can return the game to the lobby.</p>}
              </section>
              {botControls}
            </> : undefined}
          />
          {chatOpen && !user.isDisplay && <Modal title="Chat" onClose={onChatClose} wide themeGame={gameId} className="chat-modal"><ChatPanel messages={chatMessages} status={status === "open" ? undefined : status === "connecting" ? "Connecting…" : "Reconnecting…"} error={notice} onSend={text => send({ type: "chat:send", text })} /></Modal>}
          {!(snapshot.game === "kin" && snapshot.world?.step === "done") && botControls}
    </div>
    </AvatarsContext.Provider>
  );
}
