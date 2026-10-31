import { useContext, useEffect, useState } from "react";
import { Avatar, AvatarsContext, Person } from "../../avatar/Avatar";
import { defaultAvatar } from "../../avatar/model";
import { HostControlsTab } from "../../components/HostControlsTab";
import { HistoryPanel } from "../../components/HistoryPanel";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps } from "../types";
import type { AbilityType, DworfPlayer, DworfSnapshot } from "./types";

const SIDE_VECTORS: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const rotate = (sides: string) => [...sides].map(side => ({ N: "S", E: "W", S: "N", W: "E" }[side])).sort((a, b) => "NESW".indexOf(a!) - "NESW".indexOf(b!)).join("");
const turned = (sides: string, rot: number) => { let out = sides; for (let i = 0; i < rot; i++) out = rotate(out); return out; };

// A square tunnel piece: a hub in the middle with a path to each open side.
function TunnelPiece({ sides, size = 48 }: { sides: string; size?: number }) {
  return (
    <svg className="dworf-piece" width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="4" fill="#6b4a2f" />
      {[...sides].map(side => {
        const [dx, dy] = SIDE_VECTORS[side];
        return <line key={side} x1="20" y1="20" x2={20 + dx * 20} y2={20 + dy * 20} stroke="#e9d8b4" strokeWidth="11" />;
      })}
      <circle cx="20" cy="20" r="8" fill="#e9d8b4" />
    </svg>
  );
}

const ABILITY_ICON: Record<AbilityType, string> = {
  lookGoal: "🔍", lookDwarf: "👁️", destroyTunnel: "💥", destroyPickaxe: "⛏️", fixPickaxe: "🔧", destroyLantern: "🏮", fixLantern: "🧵"
};

const ABILITY_HELP: Record<AbilityType, string> = {
  lookGoal: "Secretly check one of the three goal cards.",
  lookDwarf: "Secretly check another dwarf's role.",
  destroyTunnel: "Remove a tunnel from the board.",
  destroyPickaxe: "A dwarf can't place tunnels until it's fixed.",
  fixPickaxe: "Repair another dwarf's pickaxe.",
  destroyLantern: "A dwarf can't place tunnels until it's fixed.",
  fixLantern: "Repair another dwarf's lantern."
};

type Mode =
  | { kind: "tunnel"; index: number; rot: 0 | 1 | 2 | 3 }
  | { kind: "ability"; card: AbilityType }
  | { kind: "pass" }
  | { kind: "gift"; card: AbilityType | null }
  | null;

export function DworfLobby({ snapshot, userId, isHost, isAdmin, send }: GameLobbyProps<DworfSnapshot>) {
  if (snapshot.phase === "lobby") return <Waiting {...{ snapshot, userId, isHost, isAdmin, send }} />;
  return <Table {...{ snapshot, userId, isHost, isAdmin, send }} />;
}

function Waiting({ snapshot, userId, isHost, send }: GameLobbyProps<DworfSnapshot>) {
  const seated = snapshot.seats.some(item => item.id === userId);
  const full = snapshot.seats.length >= snapshot.maxPlayers;
  const enough = snapshot.seats.length >= snapshot.minPlayers;
  return (
    <>
    <div className="grid-2">
      <section className="card">
        <h2>Dwarves <span className="pill">{snapshot.seats.length}/{snapshot.maxPlayers}</span></h2>
        {snapshot.seats.length === 0 ? <p className="muted">Nobody has joined yet.</p> : (
          <ul className="names">{snapshot.seats.map(item => <li key={item.id} className={`row between ${item.connected ? "" : "offline"}`}><Person id={item.id} name={item.username} /><KickButton id={item.id} name={item.username} isHost={isHost} send={send} /></li>)}</ul>
        )}
        {seated
          ? <button onClick={() => send({ type: "unseat" })}>Leave the expedition</button>
          : <button className="primary" disabled={full} onClick={() => send({ type: "seat" })}>Join the expedition</button>}
        <p className="muted small">{snapshot.minPlayers}–{snapshot.maxPlayers} players. Cultists are secretly chosen when the game starts.</p>
      </section>
      <section className="card">
        <h2>Spectators <span className="pill">{snapshot.spectators.length}</span></h2>
        {snapshot.spectators.length === 0 ? <p className="muted">No spectators.</p> : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>}
        {!isHost && <p className="muted small">Waiting for {snapshot.host.name} to start the game.</p>}
      </section>
    </div>
    {isHost && <HostControlsTab>
      <div className="host-actions">
        <button className="primary" disabled={!enough} onClick={() => send({ type: "start" })}>Start game</button>
        {!enough && <p className="muted small">Needs at least {snapshot.minPlayers} dwarves.</p>}
      </div>
    </HostControlsTab>}
    </>
  );
}

function Table({ snapshot, userId, isHost, isDisplay, send }: GameLobbyProps<DworfSnapshot>) {
  const avatars = useContext(AvatarsContext);
  const [showSecretInfo, setShowSecretInfo] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rots, setRots] = useState<Record<number, 0 | 1 | 2 | 3>>({});
  const visibleSnapshot: DworfSnapshot = showSecretInfo ? snapshot : {
    ...snapshot,
    players: snapshot.players.map(player => ({ ...player, role: null })),
    goals: snapshot.goals.map(goal => ({
      ...goal,
      type: goal.revealed ? goal.type : null,
      monsterType: goal.revealed ? goal.monsterType : null
    })),
    me: null
  };
  snapshot = visibleSnapshot;
  const handKey = snapshot.me?.tunnels.join(",") ?? "";
  useEffect(() => setRots({}), [handKey]);
  useEffect(() => {
    if (snapshot.step === "gift") setShopOpen(true);
  }, [snapshot.step]);
  const { cols, rows } = snapshot;
  const me = snapshot.me;
  const playing = snapshot.phase === "playing";
  const myTurn = playing && snapshot.turnId === userId;
  const turnPlayer = snapshot.players.find(player => player.id === snapshot.turnId);
  const broken = !!snapshot.players.find(player => player.id === userId && (player.pickaxeBroken || player.lanternBroken));
  const tunnelAt = new Map(snapshot.tunnels.map(item => [item.cell, item.sides]));
  const goalAt = new Map(snapshot.goals.map(goal => [goal.cell, goal]));

  const choose = (next: Mode) => { setMode(current => (JSON.stringify(current) === JSON.stringify(next) ? null : next)); setNotice(null); };
  const done = () => setMode(null);
  const toggleSecretInfo = () => {
    setShowSecretInfo(value => !value);
    setMode(null);
  };
  const renderSecretToggle = () => (
    <button
      type="button"
      className="dworf-secret-toggle"
      aria-label={showSecretInfo ? "Hide secret information" : "Show secret information"}
      title={showSecretInfo ? "Hide secret information" : "Show secret information"}
      aria-pressed={showSecretInfo}
      onClick={toggleSecretInfo}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!showSecretInfo && <path d="m3 3 18 18" />}
      </svg>
    </button>
  );

  const valid = new Set<number>();
  if (mode?.kind === "tunnel") for (const cell of snapshot.placeable?.[mode.index]?.[mode.rot] ?? []) valid.add(cell);
  if (mode?.kind === "ability" && mode.card === "destroyTunnel") for (const item of snapshot.tunnels) if (!snapshot.monsters.includes(item.cell)) valid.add(item.cell);
  if (mode?.kind === "ability" && mode.card === "lookGoal") for (const goal of snapshot.goals) if (!goal.revealed) valid.add(goal.cell);
  if (snapshot.monsterOptions) for (const cell of snapshot.monsterOptions) valid.add(cell);

  const onCell = (cell: number) => {
    if (!myTurn) return;
    if (snapshot.step === "monster" && snapshot.monsterOptions?.includes(cell)) { send({ type: "monster", cell }); return; }
    if (mode?.kind === "tunnel" && valid.has(cell)) { send({ type: "place", index: mode.index, rot: mode.rot, cell }); done(); return; }
    if (mode?.kind === "ability" && mode.card === "destroyTunnel" && valid.has(cell)) { send({ type: "ability", card: mode.card, cell }); done(); return; }
    if (mode?.kind === "ability" && mode.card === "lookGoal") {
      const goal = goalAt.get(cell);
      if (goal && !goal.revealed) { send({ type: "ability", card: mode.card, goal: goal.index }); done(); }
    }
  };

  const needsPlayer = (mode?.kind === "ability" && ["lookDwarf", "destroyPickaxe", "fixPickaxe", "destroyLantern", "fixLantern"].includes(mode.card)) || (mode?.kind === "gift" && mode.card !== null);
  const selfBlocked = (player: DworfPlayer) => player.id === userId && !(mode?.kind === "ability" && (mode.card === "destroyPickaxe" || mode.card === "destroyLantern"));
  const onPlayer = (player: DworfPlayer) => {
    if (mode?.kind === "ability") send({ type: "ability", card: mode.card, target: player.id });
    else if (mode?.kind === "gift" && mode.card) send({ type: "gift", card: mode.card, target: player.id });
    done();
  };

  let prompt = "";
  if (!playing) prompt = "";
  else if (!myTurn) prompt = turnPlayer ? "is taking their turn." : "Someone is taking their turn.";
  else if (snapshot.step === "monster") prompt = "Two routes are equally short. Click where the monster should crawl.";
  else if (snapshot.step === "gift") prompt = "You found a gem! Pick a card from The Shop, then the dwarf who gets it.";
  else if (mode?.kind === "tunnel") prompt = "Click a highlighted spot to place the tunnel. Use Turn to flip it.";
  else if (mode?.kind === "pass") prompt = "Pick a tunnel card from your hand to discard.";
  else if (mode?.kind === "ability") prompt = mode.card === "destroyTunnel" ? "Click the tunnel to destroy." : mode.card === "lookGoal" ? "Click a goal card to peek at." : "Pick a dwarf on the right.";
  else prompt = "Your turn: place a tunnel, play an ability card, or pass.";

  const handClick = (kind: "tunnel" | "ability", index: number, card?: AbilityType) => {
    if (!myTurn || snapshot.step !== "turn") return;
    if (mode?.kind === "pass") {
      if (kind === "tunnel") { send({ type: "pass", kind, index }); done(); }
      return;
    }
    if (kind === "tunnel") {
      if (broken) { setNotice("Your pickaxe or lantern is broken, so you can't place tunnels. Fix it, or play another card."); return; }
      choose({ kind: "tunnel", index, rot: rots[index] ?? 0 });
    } else choose({ kind: "ability", card: card! });
  };

  const rotateCard = (index: number) => {
    const rot = rots[index] === 1 ? 0 : 1;
    setRots(current => ({ ...current, [index]: rot }));
    setMode(current => (current?.kind === "tunnel" && current.index === index ? { ...current, rot } : current));
  };

  const cells = [];
  for (let cell = 0; cell < rows * cols; cell++) {
    const sides = tunnelAt.get(cell);
    const goal = goalAt.get(cell);
    const goalCard = goal && !(goal.revealed && goal.type === "monster") ? goal : null;
    const isGem = snapshot.gems.includes(cell);
    const monsters = snapshot.monsters.flatMap((item, index) => item === cell ? [index] : []);
    const occupants = snapshot.players.filter(player => player.cell === cell);
    const highlight = valid.has(cell);
    const arrows = (snapshot.monsterNext ?? []).filter(item => item.from === cell);
    const targeted = (snapshot.monsterNext ?? []).some(item => item.to === cell);
    cells.push(
      <button key={cell} className={`dworf-cell ${highlight ? "valid" : ""} ${goalCard ? "goal" : ""} ${cell === snapshot.ladder ? "ladder" : ""} ${targeted ? "monster-target" : ""}`} disabled={!highlight && !(mode?.kind === "ability" && mode.card === "lookGoal" && goal && !goal.revealed)} onClick={() => onCell(cell)}>
        {cell === snapshot.ladder && (
          <>
            <TunnelPiece sides="NESW" size={44} />
            <svg className="dworf-ladder-icon" viewBox="0 0 32 40" role="img" aria-label="Ladder">
              <path d="M7 3 12 37M25 3 20 37M9 10h14M10 18h12M11 26h10M12 34h8" fill="none" stroke="#f3e3c3" strokeWidth="3" strokeLinecap="square" />
            </svg>
          </>
        )}
        {sides && <TunnelPiece sides={sides} size={44} />}
        {goalCard && <span className={`dworf-goal ${goalCard.revealed ? "open" : ""}`}>
          {goalCard.type === "gold" ? "💰" : goalCard.type === "monster" && goalCard.monsterType
            ? <img src={`${import.meta.env.BASE_URL}dworf/monsters/${goalCard.monsterType}.svg`} alt="" />
            : "?"}
          {goalCard.type && <small>{goalCard.type}</small>}
        </span>}
        {isGem && !sides && <span className="dworf-gem">💎</span>}
        {arrows.map(item => {
          const delta = item.to - cell;
          const [angle, shift] = delta === 1 ? [0, "50%, 0"] : delta === -1 ? [180, "-50%, 0"] : delta > 0 ? [90, "0, 50%"] : [270, "0, -50%"];
          return <svg key={item.to} className="dworf-arrow" viewBox="0 0 56 56" aria-hidden style={{ transform: `translate(${shift}) rotate(${angle}deg)` }}><path d="M12 28 H44 M33 17 L44 28 L33 39" fill="none" stroke="#ff3b30" strokeWidth="5" strokeLinecap="square" /></svg>;
        })}
        {(occupants.length > 0 || monsters.length > 0) && (
          <span className="dworf-occupants">
            {occupants.map(player => (
              <span className="dworf-occupant-avatar" key={player.id} title={player.username}>
                <Avatar avatar={avatars[player.id] ?? defaultAvatar(player.id)} size={16.8} resolutionScale={1.25} />
                {player.dead && <span className="dworf-avatar-skull" aria-label="Eliminated">💀</span>}
              </span>
            ))}
            {monsters.map(index => (
              <span className="dworf-occupant-monster" key={index} title="Monster">
                {snapshot.monsterTypes[index]
                  ? <img src={`${import.meta.env.BASE_URL}dworf/monsters/${snapshot.monsterTypes[index]}.svg`} alt="" />
                  : "👹"}
              </span>
            ))}
          </span>
        )}
        {mode?.kind === "tunnel" && highlight && <span className="dworf-ghost"><TunnelPiece sides={turned(me!.tunnels[mode.index], mode.rot)} size={44} /></span>}
      </button>
    );
  }

  const reason = snapshot.endReason === "gold" ? "The tunnel reached the gold!" : snapshot.endReason === "monster" ? "A monster reached the ladder!" : snapshot.endReason === "elimination" ? "The monsters eliminated all explorers!" : "The tunnel cards ran out!";

  return (
    <div className="cn-layout">
      <div className="cn-main">
        {me && snapshot.phase !== "lobby" && (
          <div className={`dworf-role-banner ${me.role}`}>
            <strong>{me.role === "cultist" ? "CULTIST" : "EXPLORER"}</strong>
            <span>{me.role === "cultist"
              ? "Keep the gold hidden and help a monster reach the ladder."
              : "Reach the gold before a monster reaches the ladder."}</span>
          </div>
        )}
        {snapshot.phase === "results" ? (
          <div className={`cn-status ${snapshot.winner === "explorer" ? "team-blue" : "team-red"}`}>
            <strong>{snapshot.winner === "explorer" ? "The explorers win!" : "The cultists win!"}</strong> {reason}
          </div>
        ) : (
          <>
          <div className={`cn-status dworf-current-turn ${myTurn ? "team-blue" : ""}`}>
            {turnPlayer && <Person id={turnPlayer.id} name={turnPlayer.username} size={22} />}
            <strong>{prompt}</strong>
          </div>
          <div className="cn-status dworf-last-turn"><span className="muted small">Previous turn: </span>{snapshot.lastTurn?.length ? snapshot.lastTurn.join(" ") : "none yet"}</div>
          </>
        )}
        {notice && <p className="error">{notice}</p>}

        {playing && turnPlayer && (
          <div className="dworf-player turn dworf-turn-mobile">
            <Person id={turnPlayer.id} name={turnPlayer.username} size={22} />
            <div className="dworf-badges">
              {turnPlayer.pickaxeBroken && <span title="Pickaxe broken">⛏✖</span>}
              {turnPlayer.lanternBroken && <span title="Lantern broken">🏮✖</span>}
              <span className="muted small">{turnPlayer.tunnels}+{turnPlayer.abilities}</span>
            </div>
          </div>
        )}

        <div className="dworf-board-controls">
          {!isDisplay && (
            <div className="dworf-secret-toggle-mobile">{renderSecretToggle()}</div>
          )}
          <div className="dworf-board-wrap">
            <div className="dworf-board" style={{ gridTemplateColumns: `repeat(${cols}, 52px)`, gridTemplateRows: `repeat(${rows}, 52px)` }}>{cells}</div>
          </div>
        </div>

        {me && playing && (
          <section className="card">
            <div className="row">
              <h2>Your hand</h2>
              <span className="muted small">Tunnel Draw Pile: {snapshot.deckCount}</span>
            </div>
            <div className="dworf-hand-split">
            <div className="dworf-hand dworf-tunnel-hand">
              {me.tunnels.map((sides, index) => {
                const selected = mode?.kind === "tunnel" && mode.index === index;
                const shown = turned(sides, rots[index] ?? 0);
                const cantTurn = rotate(sides) === sides;
                return (
                  <div key={`t${index}`} className="dworf-card-wrap">
                    <button className={`dworf-card ${selected ? "selected" : ""} ${mode?.kind === "pass" ? "discardable" : ""}`} disabled={!myTurn || snapshot.step !== "turn"} onClick={() => handClick("tunnel", index)}>
                      <TunnelPiece sides={shown} size={56} />
                      <span className="small">Tunnel</span>
                    </button>
                    <button className="small dworf-rotate" title={cantTurn ? "This tunnel looks the same when turned" : "Turn this tunnel 180 degrees"} disabled={cantTurn} onClick={() => rotateCard(index)}>↻ 180°</button>
                  </div>
                );
              })}
              {myTurn && snapshot.step === "turn" && (
                <button
                  type="button"
                  className={`dworf-card dworf-pass-card ${mode?.kind === "pass" ? "selected" : ""}`}
                  onClick={() => (mode?.kind === "pass"
                    ? done()
                    : me.tunnels.length === 0
                      ? send({ type: "pass" })
                      : choose({ kind: "pass" }))}
                >
                  <strong>Pass</strong>
                  <span>{me.tunnels.length === 0 ? "Nothing to discard" : "Discard a tunnel"}</span>
                </button>
              )}
            </div>
            <div className="dworf-hand dworf-hand-abilities">
              {me.abilities.map((card, index) => (
                <button key={`a${index}`} className={`dworf-card ability ${mode?.kind === "ability" && mode.card === card ? "selected" : ""}`} disabled={!myTurn || snapshot.step !== "turn" || mode?.kind === "pass"} title={ABILITY_HELP[card]} onClick={() => handClick("ability", index, card)}>
                  <span className="dworf-icon big">{ABILITY_ICON[card]}</span>
                  <span className="small">{snapshot.abilityNames[card]}</span>
                </button>
              ))}
            </div>
            </div>
            {myTurn && snapshot.step === "turn" && (
              <div className="row">
                {mode && mode.kind !== "pass" && <button onClick={done}>Cancel</button>}
              </div>
            )}
            {mode?.kind === "ability" && <p className="muted small">{ABILITY_HELP[mode.card]}</p>}
          </section>
        )}

        <div className="dworf-shop-controls">
          <section className="card dworf-shop">
            <button
              type="button"
              className="dworf-shop-toggle"
              aria-expanded={shopOpen}
              onClick={() => setShopOpen(open => !open)}
            >
              <span>The Shop</span>
              <span aria-hidden="true">{shopOpen ? "−" : "+"}</span>
            </button>
            {shopOpen && (
              <>
                {snapshot.row.length === 0 ? <p className="muted">None left.</p> : (
                  <div className="dworf-hand">
                    {snapshot.row.map((card, index) => {
                      const giving = myTurn && snapshot.step === "gift";
                      return (
                        <button key={index} className={`dworf-card dworf-shop-card ability ${giving ? "shop-selectable" : ""} ${mode?.kind === "gift" && mode.card === card ? "selected" : ""}`} disabled={!giving} title={ABILITY_HELP[card]} onClick={() => choose({ kind: "gift", card })}>
                          <span className="dworf-icon big">{ABILITY_ICON[card]}</span>
                          <span className="small">{snapshot.abilityNames[card]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {myTurn && snapshot.step === "gift" && <div className="row"><button onClick={() => { send({ type: "skipgift" }); done(); }}>Don't give a card</button></div>}
              </>
            )}
          </section>
          {!isDisplay && <div className="dworf-secret-toggle-desktop">{renderSecretToggle()}</div>}
        </div>

        <HistoryPanel title="Log">
          <ul className="names dworf-log">{[...snapshot.log].reverse().map((line, index) => <li key={index}>{line}</li>)}</ul>
        </HistoryPanel>

        {isHost && playing && (
          <div className="row">
            {turnPlayer && !turnPlayer.connected && <button onClick={() => send({ type: "forceskip" })}>Skip {turnPlayer.username} (offline)</button>}
            <button onClick={() => send({ type: "abort" })}>Abort game</button>
          </div>
        )}
        {snapshot.phase === "results" && (isHost
          ? <button className="primary" onClick={() => send({ type: "exit" })}>Back to lobby</button>
          : <p className="muted small">Waiting for {snapshot.host.name} to return to the lobby.</p>)}
      </div>

      <aside className="cn-side dworf-side">
        <h3>Dwarves</h3>
        <ul className="names">
          {snapshot.players.map(player => (
            <li key={player.id} className={`dworf-player ${player.id === snapshot.turnId && playing ? "turn" : ""} ${player.connected ? "" : "offline"} ${player.dead ? "eliminated" : ""}`}>
              <Person id={player.id} name={player.username} size={22} />
              <div className="dworf-badges">
                {player.role && <span className={`pill ${player.role}`}>{player.role === "cultist" ? "cultist" : "explorer"}</span>}
                {player.dead && <span title="Eliminated">💀</span>}
                {player.pickaxeBroken && <span title="Pickaxe broken">⛏️✖</span>}
                {player.lanternBroken && <span title="Lantern broken">🏮✖</span>}
                {playing && <span className="muted small" title="Tunnel and ability cards in hand">{player.tunnels}+{player.abilities}</span>}
              </div>
              {needsPlayer && myTurn && <button className="primary small" onClick={() => onPlayer(player)} disabled={selfBlocked(player)}>{selfBlocked(player) ? "Can't choose yourself" : "Choose"}</button>}
            </li>
          ))}
        </ul>
        <p className="muted small">Cards: tunnels + abilities.</p>
      </aside>
    </div>
  );
}
