import { useEffect, useState } from "react";
import { Person } from "../../avatar/Avatar";
import { WorldBoard } from "./Board";
import { ArkBoard, type Spot } from "./Buildings";
import { BUILDINGS } from "./buildings.data";
import { AttackPanel, BattleReport, DefendPanel } from "./Battle";
import { VictoryPanel } from "./Victory";
import { FoundBanner, ReclaimPanel } from "./Archeology";
import { PaymentPanel } from "./Expansion";
import { cardDef, CourtCards, ItemCard, type CardPick } from "./Cards";
import { CharacterCard } from "./CharacterCard";
import { CHARACTERS } from "./characters.data";
import { kinColor } from "./KinCard";
import { BarterComposer, BarterOfferBanner, VerdictBanner } from "./Treaties";
import type { KinItem, KinPlaceOption, KinSnapshot, KinWorld } from "./types";

// Resource symbols from the glossary.
export const RESOURCE_SYMBOLS: { id: string; symbol: string; name: string }[] = [
  { id: "gold", symbol: "⏺", name: "Gold" },
  { id: "lumber", symbol: "█", name: "Lumber" },
  { id: "stone", symbol: "▲", name: "Stone" },
  { id: "food", symbol: "❀", name: "Food" },
  { id: "gear", symbol: "⚙", name: "Gear" },
  { id: "mana", symbol: "✦", name: "Mana" },
  { id: "relic", symbol: "𐚬", name: "Relic" }
];

const PHASES = [
  { id: "event", name: "Event", color: "#8a4fb3" },
  { id: "discovery", name: "Discovery", color: "#3b78c4" },
  { id: "expansion", name: "Expansion", color: "#d9b020" },
  { id: "control", name: "Control", color: "#c9443a" }
];

const BOARDS = [
  { id: "world", name: "World board", icon: "⬢" },
  { id: "building", name: "Building board", icon: "⌂" },
  { id: "technology", name: "Technology board", icon: "⚙" },
  { id: "phase", name: "Phase board", icon: "★" }
] as const;

const COURT_TABS = [
  { id: "characters", name: "Characters" },
  { id: "technologies", name: "Technologies" },
  { id: "buildings", name: "Buildings" },
  { id: "actions", name: "Action cards, faction & chapter effects" },
  { id: "treaties", name: "Treaties & bans" }
] as const;

type BoardId = (typeof BOARDS)[number]["id"];
type CourtTab = (typeof COURT_TABS)[number]["id"];

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;

// The Discovery action cards that can be activated so far.
type ActionId = "move" | "research" | "publicize" | "barter" | "dissolve" | "build" | "deploy" | "demolish" | "reclaim" | "recruit" | "reinforce" | "harvest" | "embark" | "battle" | "explore";
const ACTIONS: ActionId[] = ["move", "research", "publicize", "barter", "dissolve", "build", "deploy", "demolish", "reclaim", "recruit", "reinforce", "harvest", "embark", "battle", "explore"];

function BoardCards({ world, zone, pick }: { world: KinWorld; zone: string; pick?: CardPick }) {
  const items = world.items.filter(item => item.zone === zone);
  return <div className="kc-row">{items.map(item => <ItemCard key={item.id} item={item} kins={world.kins} kinPicks={world.kinPicks} pick={pick} />)}</div>;
}

function BuildingBoard({ world, pick }: { world: KinWorld; pick?: CardPick }) {
  return (
    <div className="kin-building-board">
      <section><h3>Building board</h3><p className="muted small">Blueprints anyone can build.</p><BoardCards world={world} zone="board:building" pick={pick} /></section>
    </div>
  );
}

function TechnologyBoard({ world, names, researchPick, publicizePick }: { world: KinWorld; names: Record<string, string>; researchPick?: CardPick; publicizePick?: CardPick }) {
  const claimed = world.items.filter(item => item.zone.startsWith("court:") && cardDef(item.def)?.kind === "technology");
  const owners = [...new Set(claimed.map(item => item.owner as string))];
  const cardsOf = (zone: string, pick?: CardPick, filter?: (item: KinItem) => boolean) => (
    <div className="kc-row">{world.items.filter(item => item.zone === zone && (!filter || filter(item))).map(item => <ItemCard key={item.id} item={item} kins={world.kins} kinPicks={world.kinPicks} pick={pick} />)}</div>
  );
  return (
    <div className="kin-tech-board">
      <section><h3>Public track</h3><p className="muted small">Technologies that have been publicized appear here.</p>{cardsOf("board:public")}</section>
      <section><h3>Research track</h3>{cardsOf("board:research", researchPick)}</section>
      {publicizePick && (
        <section>
          <h3>Technologies in courts</h3>
          <p className="muted small">Publicizing your own costs no gears; another player's costs its gear cost.</p>
          {owners.map(owner => (
            <div key={owner}>
              <h4>{names[owner] ?? owner}</h4>
              {cardsOf(`court:${owner}`, publicizePick, item => cardDef(item.def)?.kind === "technology")}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function PhaseBoard({ world, pick }: { world: KinWorld; pick?: CardPick }) {
  const onBoard = world.items.filter(item => item.zone === "board:phase");
  const defOf = (item: KinItem) => cardDef(item.def);
  return (
    <div className="kin-phase-board">
      <div className="kin-phase-tracks">
        {PHASES.map(phase => (
          <section key={phase.id} className="kin-phase-track" style={{ ["--phase-color" as string]: phase.color }}>
            <h3>{phase.name}</h3>
            <div className="kc-row">
              {onBoard.filter(item => {
                const def = defOf(item);
                if (!def) return false;
                const isEvent = def.kind === "event" || (def.kind === "faction" && def.form === "event");
                return phase.id === "event" ? isEvent : !isEvent && def.phase === phase.id;
              }).map(item => <ItemCard key={item.id} item={item} kins={world.kins} kinPicks={world.kinPicks} pick={pick} />)}
            </div>
          </section>
        ))}
      </div>
      <section className="kin-laws"><h3>Active laws</h3><p className="muted small">No laws are active.</p></section>
    </div>
  );
}

export function MainGame({ snapshot, userId, isHost, send }: { snapshot: KinSnapshot; userId: string; isHost: boolean; send: (action: Record<string, unknown>) => void }) {
  const world = snapshot.world as KinWorld;
  const [board, setBoard] = useState<BoardId>("world");
  const [courtTab, setCourtTab] = useState<CourtTab>("characters");
  const [zoom, setZoom] = useState(1);
  const myId = snapshot.seats.some(seat => seat.id === userId) ? userId : snapshot.order[0];
  const [selectedId, setSelectedId] = useState(myId);
  const selected = snapshot.seats.find(seat => seat.id === selectedId) ?? snapshot.seats[0];
  const kinOf = (id: string) => world.kins.find(kin => kin.id === world.kinPicks[id]);
  const courtCharacters = CHARACTERS.filter(def => world.charClaims[def.id] === selected?.id);
  const canCheat = snapshot.testing && isHost && selected?.id === userId;
  const turnName = snapshot.seats.find(seat => seat.id === world.turn)?.username;

  const play = world.play;
  const myTurn = !!play && play.turn === userId && snapshot.seats.some(seat => seat.id === userId);
  const move = myTurn ? play.move : null;
  // The block the army brings on its next step: by default the first block on its tile; "none" leaves them all.
  const [carry, setCarry] = useState<"treasure" | "relic" | "none" | null>(null);
  const movingTile = move ? world.armies.find(army => army.id === move.army)?.tile : undefined;
  const carryKinds = (["treasure", "relic"] as const).filter(kind => world.blocks?.some(block => block.tile === movingTile && block.kind === kind));
  const carrying = carry === "none" ? null : carry && carryKinds.includes(carry) ? carry : carryKinds[0] ?? null;
  const [picked, setPicked] = useState<{ kind: "character" | "item"; id: string } | null>(null);
  // The action card that was clicked; its Discovery card (character or activation card) is chosen next, then the target of the action.
  const [action, setAction] = useState<ActionId | null>(null);
  // Build: the blueprint chosen, and the place or building chosen when more cards or resources still have to be paid.
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [target, setTarget] = useState<{ place?: KinPlaceOption; building?: string } | null>(null);
  // Reinforce: the first army and then its partner; Embark: the army whose ocean tile is chosen next.
  const [pair, setPair] = useState<{ first: string; second?: string } | null>(null);
  const [embarkArmy, setEmbarkArmy] = useState<string | null>(null);
  // Battle: the tile that is attacked, once the army is chosen; and the last battle report that was closed.
  const [strikeTile, setStrikeTile] = useState<number | null>(null);
  const [closedReport, setClosedReport] = useState(0);
  // Reclaim: the tile building chosen, and the last Explore result that was closed.
  const [reclaimAt, setReclaimAt] = useState<string | null>(null);
  const [closedFound, setClosedFound] = useState(0);
  const available = myTurn && !move && play.options ? play.options : null;
  const sources = action && !picked && available ? available.sources : [];
  const buildOptions = available?.build ?? [];
  const demolishOptions = available?.demolish ?? [];
  const usable = (def: string) => !!available && available.sources.length > 0 && (
    def === "move" ? available.armies.length > 0
    : def === "research" ? available.research.length > 0
    : def === "publicize" ? available.publicize.length > 0
    : def === "barter" ? (available.barter?.targets.length ?? 0) > 0
    : def === "build" ? buildOptions.length > 0
    : def === "deploy" ? (available.deploy?.length ?? 0) > 0
    : def === "demolish" ? demolishOptions.length > 0
    : def === "recruit" ? (available.recruit?.length ?? 0) > 0
    : def === "reinforce" ? (available.reinforce?.length ?? 0) > 0
    : def === "harvest" ? (available.harvest?.length ?? 0) > 0
    : def === "embark" ? (available.embark?.length ?? 0) > 0
    : def === "battle" ? (available.battle?.length ?? 0) > 0
    : def === "explore" ? (available.explore?.length ?? 0) > 0
    : def === "reclaim" ? (available.reclaim?.length ?? 0) > 0
    : available.dissolve.length > 0
  );
  const actionCardIds = available && !action
    ? world.items.filter(item => (item.zone === "board:phase" || item.zone === `court:${userId}`) && ACTIONS.includes(item.def as ActionId) && usable(item.def)).map(item => item.id)
    : [];
  const sourceKey = (kind: string, id: string) => `${kind}:${id}`;
  const sourceKeys = new Set(sources.map(source => sourceKey(source.kind, source.id)));
  const viewingMyCourt = selected?.id === userId;
  const phaseIndex = PHASES.findIndex(phase => phase.id === play?.phase);
  const phase = PHASES[phaseIndex >= 0 ? phaseIndex : 0];
  // The board where the next choice is made comes to the front: the world for armies and tiles, the technology board for technologies.
  const controlAction = action === "recruit" || action === "reinforce" || action === "harvest" || action === "embark" || action === "battle" || action === "explore";
  const focusBoard: BoardId | null = move || (picked && (action === "move" || controlAction)) || (picked && (action === "deploy" || action === "demolish" || action === "reclaim" || (action === "build" && blueprint))) ? "world"
    : picked && action === "build" ? "building"
    : picked && (action === "research" || action === "publicize") ? "technology" : null;
  const eventsToDo = myTurn && play?.phase === "event" && (play.events?.length ?? 0) > 0;
  useEffect(() => { if (eventsToDo) setBoard("phase"); }, [eventsToDo]);
  useEffect(() => { if (focusBoard) setBoard(focusBoard); }, [focusBoard]);
  // Dissolve is decided in your own court, among the treaties others gave you.
  useEffect(() => { if (picked && action === "dissolve") { setSelectedId(userId); setCourtTab("treaties"); } }, [picked, action, userId]);
  useEffect(() => { if (picked && action === "build" && !blueprint) { setSelectedId(userId); setCourtTab("buildings"); } }, [picked, action, blueprint, userId]);
  useEffect(() => { if (!myTurn || !play?.options) { setPicked(null); setAction(null); setBlueprint(null); setTarget(null); setPair(null); setEmbarkArmy(null); setStrikeTile(null); setReclaimAt(null); } }, [myTurn, play?.options]);
  // Choosing the card to tap happens in your own court.
  useEffect(() => { if (action && !picked) { setSelectedId(userId); setCourtTab("characters"); } }, [action, picked, userId]);

  const choose = (kind: "character" | "item", id: string) => setPicked({ kind, id });
  const cancel = () => { setPicked(null); setAction(null); setBlueprint(null); setTarget(null); setPair(null); setEmbarkArmy(null); setStrikeTile(null); setReclaimAt(null); };
  const pickedSource = picked ? available?.sources.find(source => source.kind === picked.kind && source.id === picked.id) : undefined;
  const placeOf = (place: KinPlaceOption) => ({ tile: place.tile, ...(place.side !== undefined ? { side: place.side } : {}), ...(place.to !== undefined ? { to: place.to } : {}) });
  // Send the Build or Demolish right away when the card that was tapped already pays everything; otherwise ask for the rest.
  const sendBuild = (place: KinPlaceOption, extra: { kind: string; id: string }[] = [], basic: Record<string, number> = {}) => {
    send({ type: "build", kind: picked!.kind, card: picked!.id, def: blueprint, place: placeOf(place), extra, basic });
    cancel();
  };
  const chosenBlueprint = buildOptions.find(option => option.def === blueprint);
  const blueprintPick: CardPick | undefined = picked && action === "build" && !blueprint
    ? {
      ids: new Set(world.items.filter(item => buildOptions.some(option => option.def === item.def) && (item.zone === "board:building" || item.zone === `court:${userId}`)).map(item => item.id)),
      onPick: id => setBlueprint(world.items.find(item => item.id === id)!.def)
    }
    : undefined;
  const spots: Spot[] = [];
  if (picked && pickedSource && !target) {
    const shapeOf = (kind: string, place: { side?: number; to?: number }): Spot["shape"] => place.to !== undefined ? "cross" : place.side === undefined ? "tile" : kind === "edge" ? "edge" : "slice";
    if (action === "build" && chosenBlueprint) {
      const kind = BUILDINGS.find(entry => entry.id === chosenBlueprint.def)?.kind ?? "tile";
      for (const place of chosenBlueprint.places) {
        spots.push({
          key: `${place.tile}-${place.side ?? ""}-${place.to ?? ""}`, shape: shapeOf(kind, place), tile: place.tile, side: place.side, to: place.to,
          title: `Build the ${chosenBlueprint.name} here (build power ${place.power})`,
          onClick: () => place.power <= pickedSource.power && chosenBlueprint.cost.basic === 0 ? sendBuild(place) : setTarget({ place })
        });
      }
    }
    if (action === "deploy") {
      for (const id of available?.deploy ?? []) {
        const building = world.buildings.find(entry => entry.id === id);
        if (building) spots.push({ key: id, shape: shapeOf(building.kind, building), tile: building.tile, side: building.side, title: "Deploy an army here", onClick: () => { send({ type: "deploy", kind: picked.kind, card: picked.id, building: id }); cancel(); } });
      }
    }
    if (action === "demolish") {
      for (const option of demolishOptions) {
        const building = world.buildings.find(entry => entry.id === option.building);
        if (building) spots.push({
          key: option.building, shape: shapeOf(building.kind, building), tile: building.tile, side: building.side,
          title: `Demolish the ${BUILDINGS.find(entry => entry.id === building.def)?.name ?? building.def} (build power ${option.power})`,
          onClick: () => option.power <= pickedSource.power ? (send({ type: "demolish", kind: picked.kind, card: picked.id, building: option.building, extra: [] }), cancel()) : setTarget({ building: option.building })
        });
      }
    }
    if (action === "battle" && embarkArmy && strikeTile === null) {
      for (const tile of available?.battle?.find(option => option.army === embarkArmy)?.targets ?? []) {
        spots.push({ key: `strike-${tile}`, shape: "tile", tile, title: "Attack this tile", onClick: () => setStrikeTile(tile) });
      }
    }
    if (action === "reclaim" && !reclaimAt) {
      for (const option of available?.reclaim ?? []) {
        const building = world.buildings.find(entry => entry.id === option.building);
        if (building) spots.push({
          key: `reclaim-${option.building}`, shape: "tile", tile: building.tile,
          title: `Reclaim ${option.treasure} treasure and ${option.relic} relic block(s)`,
          onClick: () => option.treasure > 0 ? setReclaimAt(option.building) : (send({ type: "reclaim", kind: picked.kind, card: picked.id, building: option.building, basic: {} }), cancel())
        });
      }
    }
    if (action === "embark" && embarkArmy) {
      for (const tile of available?.embark?.find(option => option.army === embarkArmy)?.tiles ?? []) {
        spots.push({ key: `embark-${tile}`, shape: "tile", tile, title: "Embark onto this ocean tile", onClick: () => { send({ type: "embark", kind: picked.kind, card: picked.id, army: embarkArmy, tile }); cancel(); } });
      }
    }
  }
  // The armies that can be clicked for the chosen Control action.
  const armyChoices: string[] | undefined = !picked ? undefined
    : action === "move" ? play?.options?.armies
    : action === "recruit" ? available?.recruit
    : action === "harvest" ? available?.harvest
    : action === "explore" ? available?.explore
    : action === "embark" ? (embarkArmy ? [] : available?.embark?.map(option => option.army))
    : action === "battle" ? (embarkArmy ? [] : available?.battle?.map(option => option.army))
    : action === "reinforce" ? (pair?.second ? [] : pair ? available?.reinforce?.find(option => option.army === pair.first)?.partners : available?.reinforce?.map(option => option.army))
    : undefined;
  const onArmy = (army: string) => {
    if (!picked) return;
    if (action === "move") send({ type: "activateMove", kind: picked.kind, card: picked.id, army });
    else if (action === "recruit" || action === "harvest" || action === "explore") send({ type: action, kind: picked.kind, card: picked.id, army });
    else if (action === "embark" || action === "battle") { setEmbarkArmy(army); return; }
    else if (action === "reinforce") { setPair(pair ? { ...pair, second: army } : { first: army }); return; }
    cancel();
  };
  const reinforceTotal = pair?.second ? (world.armies.find(army => army.id === pair.first)?.strength ?? 0) + (world.armies.find(army => army.id === pair.second)?.strength ?? 0) : 0;
  const itemPick: CardPick | undefined = viewingMyCourt && sources.length > 0
    ? { ids: new Set(sources.filter(source => source.kind === "item").map(source => source.id)), chosen: picked?.kind === "item" ? picked.id : null, onPick: id => choose("item", id) }
    : undefined;
  const actionPick: CardPick | undefined = actionCardIds.length > 0
    ? { ids: new Set(actionCardIds), onPick: id => setAction(world.items.find(item => item.id === id)!.def as ActionId) }
    : undefined;
  // Event cards cost nothing: clicking one on the phase board activates it.
  const eventPick: CardPick | undefined = myTurn && play?.phase === "event" && !play.battle && !play.barter && (play.events?.length ?? 0) > 0
    ? { ids: new Set(world.items.filter(item => item.zone === "board:phase" && play.events!.includes(item.def) && !item.tapped).map(item => item.id)), onPick: id => send({ type: "activateEvent", def: world.items.find(item => item.id === id)!.def }) }
    : undefined;
  // Research and Publicize send their target right away; the technology is the last choice.
  const techAction = (type: "research" | "publicize", options: { item: string }[] | undefined): CardPick | undefined =>
    picked && action === type && options
      ? { ids: new Set(options.map(option => option.item)), onPick: tech => { send({ type, kind: picked.kind, card: picked.id, tech }); cancel(); } }
      : undefined;
  const dissolvePick: CardPick | undefined = picked && action === "dissolve" && available
    ? { ids: new Set(available.dissolve), onPick: treaty => { send({ type: "dissolve", kind: picked.kind, card: picked.id, treaty }); cancel(); } }
    : undefined;
  const names = Object.fromEntries(snapshot.seats.map(seat => [seat.id, seat.username]));

  const actionName = action ? action[0].toUpperCase() + action.slice(1) : "";
  const instruction = move
    ? `Moving: ${Math.floor(move.speed / 2)}${move.speed % 2 ? "½" : ""} speed left. Click a highlighted tile.`
    : picked ? (action === "move" ? "Select an army to move." : action === "research" ? "Select a technology on the research track." : action === "publicize" ? "Select a technology in a court to publicize."
      : action === "barter" ? "Compose your offer."
      : action === "build" ? (!blueprint ? "Select a building blueprint in your court or on the building board." : target ? "Pay for the building." : `Click a highlighted place to build the ${chosenBlueprint?.name ?? "building"}.`)
      : action === "deploy" ? "Click a highlighted building to deploy an army on."
      : action === "demolish" ? (target ? "Tap more Expansion cards to reach the build power." : "Click a highlighted building or wall to demolish.")
      : action === "recruit" ? "Click an army on a Barracks to recruit (2 food)."
      : action === "harvest" ? "Click an army on farmland, a forest or a mountain to harvest."
      : action === "battle" ? (strikeTile !== null ? "Choose your dice." : embarkArmy ? "Click a highlighted tile to attack." : "Click the army that attacks.")
      : action === "embark" ? (embarkArmy ? "Click a highlighted ocean tile." : "Click an army on a Harbor to embark.")
      : action === "explore" ? "Click one of your armies standing on ruins to explore them."
      : action === "reclaim" ? (reclaimAt ? "Choose the basic resources for the treasure." : "Click a highlighted tile building to collect its treasure and relic blocks.")
      : action === "reinforce" ? (pair ? (pair.second ? "Choose how the strength is divided." : "Click an adjacent army to exchange strength with.") : "Click the first army to reinforce.")
      : "Select a treaty in your court to dissolve.")
    : action ? `Select a ${PHASES.find(entry => entry.id === play?.phase)?.name ?? ""} character or activation card to tap for ${actionName}.`
    : play?.battle ? (play.battle.defender === userId ? "You are being attacked: choose your general and dice." : `${names[play.battle.defender]} is answering ${names[play.battle.attacker]}'s attack.`)
    : play?.barter ? `${names[play.barter.from]}'s barter offer is waiting for an answer.`
    : myTurn && play.phase === "event" ? (eventPick ? "Seasons Change has happened. Click an event card on the phase board to activate it for free, or pass." : "Seasons Change has happened. No event card can be activated; pass.")
    : myTurn && play.phase === "discovery" ? (actionCardIds.length > 0 ? "Click an action card (Move, Research, Publicize, Barter or Dissolve) to activate it, or pass." : "Nothing to activate; pass.")
    : myTurn && play.phase === "expansion" ? (actionCardIds.length > 0 ? "Click an action card (Build, Deploy, Demolish or Reclaim) to activate it, or pass." : "Nothing to activate; pass.")
    : myTurn && play.phase === "control" ? (actionCardIds.length > 0 ? "Click an action card (Recruit, Reinforce, Harvest, Embark, Explore or Battle) to activate it, or pass." : "Nothing to activate; pass.")
    : null;

  const topButton = move
    ? <button type="button" className="primary" onClick={() => send({ type: "moveStop" })}>{move.moved ? "Stop moving" : "Stop (card stays tapped)"}</button>
    : picked || action ? <button type="button" className="primary" onClick={cancel}>Decline</button>
    : <button type="button" className="primary" disabled={!myTurn || !!play?.barter || !!play?.battle} title={myTurn ? "End your turn without activating a card" : "It is not your turn"} onClick={() => send({ type: "pass" })}>Pass</button>;

  return (
    <div className="kin-main">
      <header className="kin-main-top">
        <div className="kin-phase-summary">
          <strong>Round {Math.max(snapshot.round, 1)}</strong>
          <span className="kin-phase-chip" style={{ ["--phase-color" as string]: phase.color }}>★ {phase.name} phase</span>
          <span className="muted small">{turnName ? `${turnName} is on turn` : "Waiting for the first round"}</span>
          {instruction && <span className="kin-instruction">{instruction}</span>}
        </div>
        <div className="kin-phase-dots" aria-label="Phases">
          {PHASES.map(entry => <span key={entry.id} className={`kin-phase-dot ${entry.id === phase.id ? "current" : ""}`} style={{ background: entry.color }} title={entry.name} />)}
        </div>
        {topButton}
      </header>

      <nav className="kin-main-left" aria-label="Boards">
        {BOARDS.map(entry => (
          <button key={entry.id} type="button" className={`kin-board-tab ${board === entry.id ? "selected" : ""} ${board !== entry.id && focusBoard === entry.id ? "needed" : ""} ${(actionCardIds.length > 0 || !!eventPick) && entry.id === "phase" ? "needed" : ""}`} onClick={() => setBoard(entry.id)}>
            <span className="kin-board-icon">{entry.icon}</span>
            <span>{entry.name}</span>
          </button>
        ))}
      </nav>

      <main className="kin-main-middle">
        {snapshot.victory && <VictoryPanel victory={snapshot.victory} names={names} />}
        {play?.barter && <BarterOfferBanner world={world} offer={play.barter} userId={userId} names={names} send={send} />}
        {play && play.verdicts.length > 0 && <VerdictBanner world={world} verdicts={play.verdicts} userId={userId} names={names} send={send} />}
        {picked && action === "barter" && available ? (
          <BarterComposer world={world} userId={userId} names={names} targets={available.barter?.targets ?? []} mintable={available.barter?.mintable ?? []} source={{ kind: picked.kind, id: picked.id }} send={send} onClose={cancel} />
        ) : null}
        {picked && pickedSource && target && available && (
          <PaymentPanel
            title={target.place ? `Build the ${chosenBlueprint?.name}` : "Demolish"}
            power={target.place ? target.place.power : demolishOptions.find(option => option.building === target.building)?.power ?? 0}
            picked={pickedSource}
            sources={available.sources}
            basic={target.place ? chosenBlueprint?.cost.basic : 0}
            fixed={chosenBlueprint?.cost.resources}
            stock={snapshot.seats.find(seat => seat.id === userId)?.resources}
            onCancel={() => setTarget(null)}
            onConfirm={(extra, basic) => {
              if (target.place) sendBuild(target.place, extra, basic);
              else { send({ type: "demolish", kind: picked.kind, card: picked.id, building: target.building, extra }); cancel(); }
            }}
          />
        )}
        {play?.battle?.defender === userId && myId === userId && (
          <DefendPanel
            battle={play.battle}
            names={names}
            onConfirm={(general, dice) => send({ type: "battleRespond", general, dice })}
          />
        )}
        {move && carryKinds.length > 0 && (
          <div className="kin-payment">
            <p className="small">The army brings a block along on the next step.</p>
            <div className="kin-payment-buttons">
              {carryKinds.map(kind => <button key={kind} type="button" className={carrying === kind ? "primary" : ""} onClick={() => setCarry(carrying === kind ? "none" : kind)}>{carrying === kind ? `Bringing the ${kind} block` : `Leave the ${kind} block`}</button>)}
            </div>
          </div>
        )}
        {play?.found && play.found.id !== closedFound && <FoundBanner found={play.found} name={names[play.found.player] ?? "?"} onClose={() => setClosedFound(play.found!.id)} />}
        {picked && action === "reclaim" && reclaimAt && (
          <ReclaimPanel
            treasure={available?.reclaim?.find(option => option.building === reclaimAt)?.treasure ?? 0}
            relic={available?.reclaim?.find(option => option.building === reclaimAt)?.relic ?? 0}
            onCancel={cancel}
            onConfirm={basic => { send({ type: "reclaim", kind: picked.kind, card: picked.id, building: reclaimAt, basic }); cancel(); }}
          />
        )}
        {play?.report && play.report.id !== closedReport && (
          <BattleReport report={play.report} names={names} characterNames={Object.fromEntries(CHARACTERS.map(def => [def.id, def.name]))} onClose={() => setClosedReport(play.report!.id)} />
        )}
        {picked && pickedSource && action === "battle" && embarkArmy && strikeTile !== null && (
          <AttackPanel
            pool={pickedSource.power + (world.armies.find(army => army.id === embarkArmy)?.strength ?? 0)}
            kinds={available?.dice ?? ["strategic"]}
            onCancel={cancel}
            onConfirm={dice => { send({ type: "battle", kind: picked.kind, card: picked.id, army: embarkArmy, tile: strikeTile, dice }); cancel(); }}
          />
        )}
        {picked && action === "reinforce" && pair?.second && (
          <div className="kin-payment">
            <h3>Reinforce</h3>
            <p className="small">Choose the new strength of the first army; the second army gets the rest ({reinforceTotal} in total).</p>
            <div className="kin-payment-row">
              {Array.from({ length: Math.max(0, reinforceTotal - 1) }, (_, index) => index + 1)
                .filter(value => value !== world.armies.find(army => army.id === pair.first)?.strength)
                .map(value => (
                  <button key={value} type="button" onClick={() => { send({ type: "reinforce", kind: picked.kind, card: picked.id, first: pair.first, second: pair.second, strength: value }); cancel(); }}>
                    {value} / {reinforceTotal - value}
                  </button>
                ))}
              <button type="button" onClick={() => setPair({ first: pair.first })}>Back</button>
            </div>
          </div>
        )}
        {board === "world" && !(picked && action === "barter") && (
          <div className="kin-board-stage">
            <div className="kin-board-scroll">
              <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
                <WorldBoard
                  world={world}
                  pickableArmies={armyChoices}
                  onArmy={armyChoices ? onArmy : undefined}
                  movingArmy={move?.army}
                  moveTargets={move?.targets}
                  spots={spots}
                  onMoveTile={move ? tile => { send({ type: "moveStep", tile, ...(carrying ? { block: carrying } : {}) }); setCarry(null); } : undefined}
                />
              </div>
            </div>
            <div className="kin-zoom">
              <button type="button" onClick={() => setZoom(value => Math.max(MIN_ZOOM, value - 0.2))} aria-label="Zoom out">−</button>
              <span className="small">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom(value => Math.min(MAX_ZOOM, value + 0.2))} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => setZoom(1)}>Reset</button>
            </div>
            <div className="kin-ark-overlay"><ArkBoard world={world} /></div>
          </div>
        )}
        {board === "building" && !(picked && action === "barter") && <BuildingBoard world={world} pick={blueprintPick} />}
        {board === "technology" && !(picked && action === "barter") && <TechnologyBoard world={world} names={names} researchPick={techAction("research", available?.research)} publicizePick={techAction("publicize", available?.publicize)} />}
        {board === "phase" && !(picked && action === "barter") && <PhaseBoard world={world} pick={actionPick ?? eventPick} />}
      </main>

      <aside className="kin-main-right" aria-label="Players">
        <h2>Players</h2>
        <ol className="kin-player-list">
          {snapshot.order.map(id => {
            const seat = snapshot.seats.find(entry => entry.id === id);
            if (!seat) return null;
            const kin = kinOf(id);
            return (
              <li key={id}>
                <button type="button" className={`kin-player ${selected?.id === id ? "selected" : ""} ${world.turn === id ? "on-turn" : ""}`} style={{ ["--kin-color" as string]: kin ? kinColor(kin) : "#888" }} onClick={() => setSelectedId(id)}>
                  <span className="kin-player-head">
                    <Person id={seat.id} name={seat.username} />
                    {world.turn === id && <span className="pill">turn</span>}
                    {seat.id === userId && <span className="pill">You</span>}
                    {!seat.connected && <span className="pill">offline</span>}
                  </span>
                  <span className="muted small">{kin?.name ?? "No Kin"} · {seat.characters} characters · ⓟ {seat.population} · ≐ {seat.armies}/{seat.armyLimit}</span>
                  <span className="kin-player-resources">
                    {RESOURCE_SYMBOLS.map(res => <span key={res.id} title={res.name}>{res.symbol} {seat.resources[res.id] ?? 0}</span>)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <footer className="kin-main-bottom">
        <div className="kin-court-menu">
          <label className="muted small" htmlFor="kin-court-tab">Court of {selected?.username}</label>
          <select id="kin-court-tab" value={courtTab} onChange={event => setCourtTab(event.target.value as CourtTab)}>
            {COURT_TABS.map(tab => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
          </select>
        </div>
        <div className="kin-court">
          {courtTab === "characters" && courtCharacters.map(def => (
            <CharacterCard
              key={def.id}
              def={def}
              kins={world.kins}
              state="claimed"
              tapped={world.charTapped.includes(def.id)}
              selectable={viewingMyCourt && sourceKeys.has(sourceKey("character", def.id))}
              selected={picked?.kind === "character" && picked.id === def.id}
              onPick={() => choose("character", def.id)}
            />
          ))}
          {courtTab === "characters" && courtCharacters.length === 0 && <p className="muted">No characters in this court.</p>}
          {courtTab === "characters" && selected && <CourtCards world={world} player={selected.id} kinds={["activation"]} pick={itemPick} />}
          {courtTab === "technologies" && selected && <CourtCards world={world} player={selected.id} kinds={["technology"]} />}
          {courtTab === "buildings" && selected && <CourtCards world={world} player={selected.id} kinds={["blueprint"]} pick={viewingMyCourt ? blueprintPick : undefined} />}
          {courtTab === "actions" && selected && <CourtCards world={world} player={selected.id} kinds={["action", "faction", "event"]} pick={viewingMyCourt ? actionPick : undefined} />}
          {courtTab === "treaties" && selected && <CourtCards world={world} player={selected.id} kinds={["treaty", "ban"]} pick={viewingMyCourt ? dissolvePick : undefined} />}
        </div>
        <div className="kin-resources" aria-label="Resources">
          {RESOURCE_SYMBOLS.map(res => {
            const amount = selected?.resources[res.id] ?? 0;
            return (
              <div key={res.id} className="kin-resource-row">
                <span className="kin-resource-symbol" title={res.name}>{res.symbol}</span>
                <span className="kin-resource-name">{res.name}</span>
                <strong>{amount}</strong>
                {/* Relics show tapped / total; the other resources show the production expected at the next Seasons Change. */}
                <span className="muted small">{res.id === "relic" ? `0 / ${amount}` : `(+${selected?.production[res.id] ?? 0})`}</span>
                {canCheat && <button type="button" className="kin-cheat" title="Testing: give yourself 100" onClick={() => send({ type: "giveResource", resource: res.id })}>+100</button>}
              </div>
            );
          })}
          {canCheat && (
            <div className="kin-resource-row">
              {["discovery", "expansion", "control", "universal"].map(kind => (
                <button key={kind} type="button" className="kin-cheat" title="Testing: give yourself an activation card" onClick={() => send({ type: "giveActivation", card: `activation-${kind}` })}>+{kind.slice(0, 3)}</button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
