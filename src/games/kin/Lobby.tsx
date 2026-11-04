import { useState, type ReactNode } from "react";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps } from "../types";
import { TERRAIN_NAMES, WorldBoard } from "./Board";
import { ArkBoard, BuildingGallery } from "./Buildings";
import { CardGallery, CourtCards } from "./Cards";
import { MainGame } from "./MainGame";
import { KinCard, kinColor } from "./KinCard";
import { CharacterCard } from "./CharacterCard";
import { CHARACTERS } from "./characters.data";
import type { KinMode, KinSnapshot, KinWorld } from "./types";

const MODES: { id: KinMode; name: string; text: string }[] = [
  { id: "short", name: "Short game", text: 
    "In a short game you only play the first chapter: New Dawn. The winner of the chapter wins the game." },
  { id: "long", name: "Long game", text: 
    "In a long game chapters are played until someone wins two chapters in a row." },
  { id: "campaign", name: "Campaign", text: 
    "In a campaign you play through chapters until there are none left. The winner is the player who won the most chapters" }
];

function Waiting({ snapshot, userId, isHost, send }: GameLobbyProps<KinSnapshot>) {
  const [tab, setTab] = useState<"about" | "spectators">("about");
  const me = snapshot.seats.some(seat => seat.id === userId);
  const full = snapshot.seats.length >= snapshot.maxPlayers;
  const canStart = snapshot.seats.length >= snapshot.minPlayers;
  return (
    <div className="kin-waiting">
      <div className="grid-2">
        <section className="card">
          <h2>Players <span className="pill">{snapshot.seats.length}/{snapshot.maxPlayers}</span></h2>
          <ol className="kin-seats">
            {Array.from({ length: snapshot.maxPlayers }, (_, index) => {
              const seat = snapshot.seats[index];
              return (
                <li key={index} className={seat ? "taken" : "open"}>
                  <span className="kin-seat-number">{index + 1}</span>
                  {seat ? (
                    <span className="row between">
                      <Person id={seat.id} name={seat.username} />
                      <span className="row">
                        {seat.id === snapshot.host.id && <span className="pill">Host</span>}
                        {seat.id === userId && <span className="pill">You</span>}
                        <KickButton id={seat.id} name={seat.username} isHost={isHost} send={send} />
                      </span>
                    </span>
                  ) : <span className="muted small">Open</span>}
                </li>
              );
            })}
          </ol>
          {me
            ? <button onClick={() => send({ type: "leave" })}>Back to spectating</button>
            : <button className="primary" disabled={full} onClick={() => send({ type: "join" })}>{full ? "All slots are taken" : "Take a player slot"}</button>}
        </section>
        <section className="card">
          <div className="kin-tabs" role="tablist" aria-label="Lobby information">
            <button type="button" role="tab" aria-selected={tab === "about"} className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}>Game</button>
            <button type="button" role="tab" aria-selected={tab === "spectators"} className={tab === "spectators" ? "active" : ""} onClick={() => setTab("spectators")}>Spectators <span className="pill">{snapshot.spectators.length}</span></button>
          </div>
          {tab === "about" ? (
            <>
              <h2>{MODES.find(mode => mode.id === snapshot.options.mode)?.name}</h2>
              <p>{MODES.find(mode => mode.id === snapshot.options.mode)?.text}</p>
              {snapshot.options.testing && <p><span className="pill">Testing</span> The host has testing tools.</p>}
              <p className="muted small">{snapshot.minPlayers}–{snapshot.maxPlayers} players. Up to 20 users can be in the lobby; everyone without a slot spectates.</p>
              {!isHost && <p className="muted small">Waiting for {snapshot.host.name} to start the game.</p>}
            </>
          ) : (
            <>
              <h2>Spectators</h2>
              {snapshot.spectators.length === 0
                ? <p className="muted">No spectators.</p>
                : <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>}
            </>
          )}
        </section>
      </div>
      {isHost && (
        <HostControlsTab>
          <div className="host-actions kin-host-options">
            <label>Game type{" "}
              <select value={snapshot.options.mode} onChange={event => send({ type: "setOptions", mode: event.target.value })}>
                {MODES.map(mode => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
              </select>
            </label>
            <label>
              <input type="checkbox" checked={snapshot.options.testing} onChange={event => send({ type: "setOptions", testing: event.target.checked })} /> Testing (host cheats)
            </label>
            <button className="primary" disabled={!canStart} onClick={() => send({ type: "start" })}>Start Kin</button>
            {!canStart && <p className="muted small">At least {snapshot.minPlayers} players are needed to start.</p>}
          </div>
        </HostControlsTab>
      )}
    </div>
  );
}

const PILE_TYPES = ["mountain", "forest", "farmland"] as const;
const LAST_TYPES = ["plains", "snow", "desert"] as const;

const CHARACTER_PROMPTS = [
  "claim a character of your own Kin.",
  "claim a second character of your own Kin.",
  "claim a Discovery character.",
  "claim an Expansion character.",
  "claim a Control character."
];

// Mirrors the server's climateOfRow: snow in the top 2 and bottom 2 rows, desert in the middle 2, plains elsewhere.
const rowClimate = (row: number) => row < 2 || row >= 12 ? "snow" : row === 6 || row === 7 ? "desert" : "plains";

function setupPrompt(world: KinWorld) {
  switch (world.setup?.task) {
    case "worksite": return "Your turn: click a highlighted side of your village to build your Worksite.";
    case "village2": return "Your turn: click a highlighted tile for your second village, three tiles from the first. Roads will connect them.";
    case "ark": return "Your turn: click a highlighted tile to place the Ark. Its Worksite goes on the Ark board.";
    case "tree": return "Your turn: click a highlighted forest tile to plant the Great Tree.";
    default: return "Your turn: click a highlighted tile to build your village.";
  }
}

function stepTitle(world: KinWorld) {
  if (world.step === "tiles") return "1. Build the world";
  if (world.step === "lastTiles") return "3. The last tiles";
  if (world.step === "rivers") return "4. Rivers";
  if (world.step === "kin") return "5. Pick your Kin";
  if (world.step === "setup") return "4.2 Starting setup";
  return "5. Characters";
}

function Started(props: GameLobbyProps<KinSnapshot> & { hostControls?: ReactNode }) {
  const { snapshot, userId, isHost, send, hostControls } = props;
  if (snapshot.world?.step === "done") {
    return (
      <MainGame snapshot={snapshot} userId={userId} isHost={isHost} send={send} hostControls={hostControls} />
    );
  }
  return <SetupScreen {...props} />;
}

function SetupScreen({ snapshot, userId, isHost, send }: GameLobbyProps<KinSnapshot>) {
  const [pick, setPick] = useState<(typeof PILE_TYPES)[number]>("mountain");
  const [dedication, setDedication] = useState("gold");
  const names = new Map(snapshot.seats.map(seat => [seat.id, seat]));
  const world = snapshot.world;
  const myTurn = !!world && world.turn === userId;
  const turnName = world?.turn ? names.get(world.turn)?.username ?? "?" : null;
  const pickable = world ? PILE_TYPES.filter(type => world.pile[type] > 0) : [];
  const chosen = world && world.pile[pick] > 0 ? pick : pickable[0];
  const left = world ? PILE_TYPES.reduce((sum, type) => sum + world.pile[type], 0) : 0;
  const [lastPick, setLastPick] = useState<(typeof LAST_TYPES)[number]>("plains");
  const lastPile = world?.lastPile;
  const lastPickable = lastPile ? LAST_TYPES.filter(type => lastPile[type] > 0) : [];
  const lastChosen = lastPile && lastPile[lastPick] > 0 ? lastPick : lastPickable[0];
  const lastLeft = lastPile ? LAST_TYPES.reduce((sum, type) => sum + lastPile[type], 0) : 0;
  const draftCharacters = CHARACTERS.filter(def => world?.charPool.includes(def.id));
  const draftRows = world ? [
    { id: "eligible", title: "Draftable now", characters: draftCharacters.filter(def => !world.charClaims[def.id] && world.charEligible.includes(def.id)) },
    { id: "ineligible", title: "Undraftable", characters: draftCharacters.filter(def => !world.charClaims[def.id] && !world.charEligible.includes(def.id)) },
    ...snapshot.order.map(id => ({
      id,
      title: `${names.get(id)?.username ?? "Player"}'s drafted characters`,
      characters: draftCharacters.filter(def => world.charClaims[def.id] === id)
    }))
  ] : [];
  return (
    <>
      <div className="kin-setup">
        <section className="card kin-setup-main">
          {world ? (
            <>
              <div className="kin-setup-top">
                <h2>{stepTitle(world)}</h2>
                {world.step === "tiles" && (
                  <div className="kin-pile" aria-label="Tiles left in the pile">
                    <span className="muted small">Pile: {left} left</span>
                    {PILE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`kin-pile-type ${type} ${chosen === type && myTurn ? "selected" : ""}`}
                        disabled={!myTurn || world.pile[type] === 0}
                        onClick={() => setPick(type)}
                      >{TERRAIN_NAMES[type]} <span className="pill">{world.pile[type]}</span></button>
                    ))}
                  </div>
                )}
                {world.step === "lastTiles" && lastPile && (
                  <div className="kin-pile" aria-label="Last tiles left in the pile">
                    <span className="muted small">Pile: {lastLeft} left</span>
                    {LAST_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`kin-pile-type ${type} ${lastChosen === type && myTurn ? "selected" : ""}`}
                        disabled={!myTurn || lastPile[type] === 0}
                        onClick={() => setLastPick(type)}
                      >{TERRAIN_NAMES[type]} <span className="pill">{lastPile[type]}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <p className={myTurn ? "kin-prompt mine" : "kin-prompt muted"}>
                {world.step === "tiles" && (myTurn ? `Your turn: choose a pile above, then click an ocean tile to place a ${chosen ?? "land"} tile.` : `Waiting for ${turnName} to place a tile.`)}
                {world.step === "lastTiles" && (myTurn ? `Your turn: choose a pile above, then click an ocean tile in a ${lastChosen ?? "matching"} row to place a ${lastChosen ?? "climate"} tile.` : `Waiting for ${turnName} to place a tile.`)}
                {world.step === "rivers" && (myTurn
                  ? (world.freeEnd ? "Click a highlighted corner to extend your river. It ends when it touches a river or the ocean." : "Click a highlighted corner of a mountain to start your river.")
                  : `Waiting for ${turnName} to draw river ${world.riversDone + 1} of ${world.riverTotal}.`)}
                {world.step === "kin" && (myTurn ? "Your turn: pick a Kin. Each Kin can only be taken once." : `Waiting for ${turnName} to pick a Kin.`)}
                {world.step === "setup" && (myTurn ? setupPrompt(world) : `Waiting for ${turnName} to place their starting buildings.`)}
                {world.step === "setup" && myTurn && world.setup?.dedicate && (
                  <select value={dedication} onChange={event => setDedication(event.target.value)} aria-label="Dedicate the village to a resource">
                    {["gold", "lumber", "stone", "food"].map(res => <option key={res} value={res}>Dedicated to {res}</option>)}
                  </select>
                )}
                {world.step === "characters" && (myTurn ? `Your turn: ${CHARACTER_PROMPTS[world.charRound ?? 0]}` : `Waiting for ${turnName}: ${CHARACTER_PROMPTS[world.charRound ?? 0]}`)}
                {world.step === "done" && "The character draft is complete. The starting setup arrives in a later milestone."}
              </p>
              {world.step === "kin" && (
                <div className="kin-cards">
                  {world.kins.map(kin => {
                    const ownerId = Object.keys(world.kinPicks).find(id => world.kinPicks[id] === kin.id);
                    return <KinCard key={kin.id} kin={kin} owner={ownerId && (names.get(ownerId)?.username ?? "?")} available={myTurn && !ownerId} onPick={() => send({ type: "pickKin", kin: kin.id })} />;
                  })}
                </div>
              )}
              {(world.step === "characters" || world.step === "done") && (
                <div className="kin-draft-rows">
                  {draftRows.map(row => <section key={row.id} className="kin-draft-row" aria-label={row.title}>
                    <h3>{row.title} <span className="pill">{row.characters.length}</span></h3>
                    <div className="char-cards">
                  {row.characters.map(def => {
                    const ownerId = world.charClaims[def.id];
                    const state = ownerId ? "claimed" : world.charEligible.includes(def.id) ? "eligible" : "ineligible";
                    return <CharacterCard key={def.id} def={def} kins={world.kins} state={state} owner={ownerId && (names.get(ownerId)?.username ?? "?")} onPick={myTurn ? () => send({ type: "pickCharacter", character: def.id }) : undefined} />;
                  })}
                    </div>
                    {row.characters.length === 0 && <p className="muted small">No characters.</p>}
                  </section>)}
                </div>
              )}
              {world.step !== "characters" && <WorldBoard
                world={world}
                onTile={world.step === "tiles" && myTurn && chosen ? index => send({ type: "placeTile", tile: index, terrain: chosen })
                  : world.step === "lastTiles" && myTurn && lastChosen ? index => send({ type: "placeLastTile", tile: index, terrain: lastChosen }) : undefined}
                tileAllowed={world.step === "lastTiles" && lastChosen ? index => rowClimate(Math.floor(index / 20)) === lastChosen : undefined}
                onVertex={world.step === "rivers" && myTurn ? vertex => send({ type: world.freeEnd ? "riverExtend" : "riverStart", vertex }) : undefined}
                onSetupTile={world.step === "setup" && myTurn ? tile => send({ type: "setupPlace", tile, ...(world.setup?.dedicate ? { dedication } : {}) }) : undefined}
                onSetupSide={world.step === "setup" && myTurn ? side => send({ type: "setupPlace", side }) : undefined}
              />}
              {world.step !== "characters" && world.step !== "tiles" && world.step !== "lastTiles" && world.step !== "rivers" && world.step !== "kin" && <ArkBoard world={world} />}
              {world.step !== "characters" && (
                <details className="kin-templates">
                  <summary>Building templates</summary>
                  <BuildingGallery />
                </details>
              )}
              {world.step === "setup" && (
                <details className="kin-templates" open>
                  <summary>Claimed starting cards</summary>
                  <CourtCards world={world} player={snapshot.seats.some(s => s.id === userId) ? userId : snapshot.order[0]} />
                </details>
              )}
              {world.step !== "characters" && (
                <details className="kin-templates">
                  <summary>Card templates</summary>
                  <CardGallery kins={world.kins} />
                </details>
              )}
            </>
          ) : <p className="muted">Loading the world�</p>}
        </section>
        <aside className="card kin-setup-side">
          <h2>Players</h2>
          <ol className="kin-seats">
            {snapshot.order.map((id, index) => {
              const seat = names.get(id);
              const kin = world?.kins.find(entry => entry.id === world.kinPicks[id]);
              const dark = kin && ["brown", "dark red", "black", "blue", "dark green", "purple"].includes(kin.color);
              return seat && (
                <li key={id} className={`taken ${world?.turn === id ? "on-turn" : ""}`} style={{ background: kin ? kinColor(kin) : undefined, color: dark ? "#fffaf0" : "#2a1f14" }}>
                  <span className="kin-seat-number">{index + 1}</span>
                  <div className="kin-setup-player-info">
                  <Person id={seat.id} name={seat.username} />
                  {kin && <span className="kin-setup-player-kin">{kin.name}</span>}
                  <span className="kin-setup-player-status">
                    {[world?.turn === id && "Turn", !seat.connected && "Offline", seat.id === userId && "You"].filter(Boolean).join(" · ")}
                  </span>
                  </div>
                </li>
              );
            })}
          </ol>
          {world && world.step !== "tiles" && world.step !== "lastTiles" && <p className="muted small">Rivers drawn: {world.riversDone} / {world.riverTotal}</p>}
          {snapshot.testing && isHost && snapshot.seed !== null && <p className="muted small">Testing seed: {snapshot.seed}</p>}
        </aside>
      </div>
      {isHost && (
        <HostControlsTab>
          <div className="host-actions">
            <button onClick={() => window.confirm("Return to the lobby and discard this game?") && send({ type: "abort" })}>Back to lobby</button>
          </div>
        </HostControlsTab>
      )}
    </>
  );
}
export function KinLobby(props: GameLobbyProps<KinSnapshot> & { hostControls?: ReactNode }) {
  return props.snapshot.phase === "lobby" ? <Waiting {...props} /> : <Started {...props} />;
}
