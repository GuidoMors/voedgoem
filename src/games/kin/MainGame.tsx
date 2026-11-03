import { useEffect, useState } from "react";
import { Person } from "../../avatar/Avatar";
import { WorldBoard } from "./Board";
import { Plane } from "./Plane";
import { ArkBoard, type Spot } from "./Buildings";
import { BUILDINGS } from "./buildings.data";
import { AttackPanel, BattleReport, DefendPanel, ReactionPanel } from "./Battle";
import { AbilityForm, DIRECT_ABILITIES } from "./Neutrals";
import { VictoryPanel } from "./Victory";
import { FoundBanner, ReclaimPanel } from "./Archeology";
import { CouncilBanner, CouncilPanel, QuantumPanel } from "./Council";
import { AuctionPanel, AuctionResultBanner, NoticeBanner, TacticsPanel } from "./Tactics";
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
  { id: "relic", symbol: "𐚬", name: "Relic" },
  { id: "tradegood", symbol: "⚖", name: "Tradegoods" },
  { id: "influence", symbol: "♛", name: "Influence" },
  { id: "virtue", symbol: "☯", name: "Virtue" }
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
  { id: "treaties", name: "Treaties & bans" },
  { id: "tactics", name: "Tactics & subterfuge" }
] as const;

type BoardId = (typeof BOARDS)[number]["id"];
type CourtTab = (typeof COURT_TABS)[number]["id"];

// The Discovery action cards that can be activated so far.
type ActionId = "move" | "nomads" | "drifting-citadel" | "research" | "publicize" | "barter" | "dissolve" | "build" | "deploy" | "demolish" | "reclaim" | "revoke" | "craftdwarves" | "recruit" | "reinforce" | "harvest" | "embark" | "battle" | "explore" | "ruthless-capitalists";
const ACTIONS: ActionId[] = ["move", "nomads", "drifting-citadel", "research", "publicize", "barter", "dissolve", "build", "deploy", "demolish", "reclaim", "revoke", "craftdwarves", "recruit", "reinforce", "harvest", "embark", "battle", "explore", "ruthless-capitalists"];

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

function PhaseBoard({ world, pick, current }: { world: KinWorld; pick?: CardPick; current?: string }) {
  const onBoard = world.items.filter(item => item.zone === "board:phase");
  const defOf = (item: KinItem) => cardDef(item.def);
  return (
    <div className="kin-phase-board">
      <div className="kin-phase-tracks">
        {PHASES.map(phase => (
          <section key={phase.id} className={`kin-phase-track ${current && phase.id !== current ? "inactive" : ""}`} style={{ ["--phase-color" as string]: phase.color }}>
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
      <section className="kin-laws"><h3>Active laws</h3>{world.law
        ? <p><strong>{world.law.name}</strong> <span className="muted small">You may not use: {world.law.forbids.map(id => cardDef(id)?.name ?? id).join(", ")}</span></p>
        : <p className="muted small">No laws are active.</p>}</section>
    </div>
  );
}

export function MainGame({ snapshot, userId, isHost, send }: { snapshot: KinSnapshot; userId: string; isHost: boolean; send: (action: Record<string, unknown>) => void }) {
  const world = snapshot.world as KinWorld;
  const [board, setBoard] = useState<BoardId>("world");
  const [collapsed, setCollapsed] = useState({ left: false, right: false, bottom: false });
  const dockToggle = (side: "left" | "right" | "bottom", arrows: [string, string]) => (
    <button type="button" className="kin-dock-toggle" aria-expanded={!collapsed[side]} aria-label={`${collapsed[side] ? "Show" : "Hide"} ${side} panel`} onClick={() => setCollapsed(current => ({ ...current, [side]: !current[side] }))}>
      {collapsed[side] ? arrows[1] : arrows[0]}
    </button>
  );
  const [courtTab, setCourtTab] = useState<CourtTab>("characters");
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
  // The blocks the army leaves behind on its next step; by default it brings both a treasure and a relic block.
  const [leave, setLeave] = useState<("treasure" | "relic")[]>([]);
  const movingTile = move ? world.armies.find(army => army.id === move.army)?.tile : undefined;
  const carryKinds = (["treasure", "relic"] as const).filter(kind => world.blocks?.some(block => block.tile === movingTile && block.kind === kind));
  const carrying = carryKinds.filter(kind => !leave.includes(kind));
  const [picked, setPicked] = useState<{ kind: "character" | "item" | "tactic"; id: string } | null>(null);
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
  const [payGold, setPayGold] = useState(false);
  const [payMana, setPayMana] = useState(false);
  const [guildResource, setGuildResource] = useState("gold");
  const [dedication, setDedication] = useState("gold");
  const [observatoryKins, setObservatoryKins] = useState<string[]>([]);
  const [payInfluence, setPayInfluence] = useState(false);
  const [openAbility, setOpenAbility] = useState<string | null>(null);
  const [closedFound, setClosedFound] = useState(0);
  const [closedCouncil, setClosedCouncil] = useState(0);
  const [closedAuction, setClosedAuction] = useState(0);
  const [closedNotice, setClosedNotice] = useState(0);
  const [exploreChoice, setExploreChoice] = useState("warp");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calc, setCalc] = useState({ target: "", action: "", character: "" });
  const [deepOpen, setDeepOpen] = useState<"chosen-thrall" | "whispered-gifts" | null>(null);
  const [deep, setDeep] = useState({ character: "", to: "", card: "" });
  const available = myTurn && !move && play.options ? play.options : null;
  const sources = action && !picked && available ? available.sources : [];
  const buildOptions = available?.build ?? [];
  const demolishOptions = available?.demolish ?? [];
  const usable = (def: string) => !!available && available.sources.length > 0 && !world.law?.forbids.includes(def) && (
    def === "revoke" ? !!available.revoke && available.sources.reduce((sum, source) => sum + source.power, 0) >= 5
    : def === "move" ? available.armies.length > 0
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
    : def === "craftdwarves" ? !!available.craft
    : def === "nomads" ? (available.nomads?.length ?? 0) > 0
    : def === "ruthless-capitalists" ? (available.ruthless?.length ?? 0) > 0
    : def === "drifting-citadel" ? (available.drift?.length ?? 0) > 0
    : available.dissolve.length > 0
  );
  const actionCardIds = available && !action
    ? world.items.filter(item => (item.zone === "board:phase" || item.zone === `court:${userId}`) && ACTIONS.includes(item.def as ActionId) && usable(item.def)).map(item => item.id)
    : [];
  const unusableReason = (def: string): string => {
    if (world.law?.forbids.includes(def)) return `${world.law.name} is enacted: this card is forbidden.`;
    if (!available || available.sources.length === 0) return "You have no untapped activation card or character to activate it with.";
    const reasons: Record<string, string> = {
      revoke: !available.revoke ? "No law is enacted." : "Your untapped cards add up to less than 5 power.",
      move: "None of your armies can move.",
      research: "You cannot research any technology.",
      publicize: "You have no technology to publicize.",
      barter: "There is nobody you can barter with.",
      build: "You cannot build anything right now.",
      deploy: "You have no army that can be deployed.",
      demolish: "There is nothing you can demolish.",
      recruit: "You cannot recruit anywhere.",
      reinforce: "No army has a partner to reinforce.",
      harvest: "There is nothing to harvest.",
      embark: "No army can embark.",
      battle: "No army has an enemy to attack.",
      explore: "There is nothing to explore.",
      reclaim: "There is no ruin to reclaim.",
      craftdwarves: "You need 5 gold and a tactics deck that is not empty.",
      nomads: "None of your villages has a free snow tile next to it.",
      "ruthless-capitalists": "You need 3 tradegoods and a connected player with whom you hold no Trade Treaty.",
      "drifting-citadel": "The Ark has no unbuilt tile next to it to drift to.",
      dissolve: "There is no treaty to dissolve."
    };
    return reasons[def] ?? "Not available.";
  };
  const disabledCards: Record<string, string> = {};
  if (available && !action) {
    for (const item of world.items) {
      if (!(item.zone === "board:phase" || item.zone === `court:${userId}`) || !ACTIONS.includes(item.def as ActionId) || usable(item.def)) continue;
      if (cardDef(item.def)?.phase !== play?.phase) continue;
      disabledCards[item.id] = unusableReason(item.def);
    }
  }
  const sourceKey = (kind: string, id: string) => `${kind}:${id}`;
  const sourceKeys = new Set(sources.map(source => sourceKey(source.kind, source.id)));
  const viewingMyCourt = selected?.id === userId;
  const phaseIndex = PHASES.findIndex(phase => phase.id === play?.phase);
  const phase = PHASES[phaseIndex >= 0 ? phaseIndex : 0];
  // The board where the next choice is made comes to the front: the world for armies and tiles, the technology board for technologies.
  const controlAction = action === "recruit" || action === "reinforce" || action === "harvest" || action === "embark" || action === "battle" || action === "explore";
  const focusBoard: BoardId | null = move || (picked && (action === "move" || controlAction)) || (picked && (action === "deploy" || action === "nomads" || action === "drifting-citadel" || action === "demolish" || action === "reclaim" || (action === "build" && blueprint))) ? "world"
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

  const choose = (kind: "character" | "item" | "tactic", id: string) => setPicked({ kind, id });
  const cancel = () => { setPicked(null); setAction(null); setBlueprint(null); setTarget(null); setPair(null); setEmbarkArmy(null); setStrikeTile(null); setReclaimAt(null); setPayGold(false); setPayMana(false); setPayInfluence(false); setObservatoryKins([]); };
  const pickedSource = picked ? available?.sources.find(source => source.kind === picked.kind && source.id === picked.id) : undefined;
  const placeOf = (place: KinPlaceOption) => ({ tile: place.tile, ...(place.side !== undefined ? { side: place.side } : {}), ...(place.to !== undefined ? { to: place.to } : {}) });
  // Send the Build or Demolish right away when the card that was tapped already pays everything; otherwise ask for the rest.
  const hasCult = world.items.some(item => item.def === "underwater-cult" && item.zone === `court:${userId}`);
  const sendBuild = (place: KinPlaceOption, extra: { kind: string; id: string }[] = [], basic: Record<string, number> = {}) => {
    send({ type: "build", kind: picked!.kind, card: picked!.id, def: blueprint, place: placeOf(place), extra, basic, ...(blueprint === "guild-hall" ? { resource: guildResource } : {}), ...(blueprint === "grand-observatory" ? { kins: observatoryKins } : {}), ...(blueprint === "village" && hasCult ? { dedication } : {}) });
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
          title: `Build the ${chosenBlueprint.name} here (build power ${place.power}${place.free ? ", free: Seedling Villages" : ""})`,
          onClick: () => place.power <= pickedSource.power && (chosenBlueprint.cost.basic === 0 || place.free) ? sendBuild(place) : setTarget({ place })
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
    if (action === "nomads") {
      for (const option of available?.nomads ?? []) {
        for (const tile of option.tiles) {
          spots.push({ key: `nomads-${option.village}-${tile}`, shape: "tile", tile, title: "Move your village here", onClick: () => { send({ type: "nomads", kind: picked.kind, card: picked.id, village: option.village, tile }); cancel(); } });
        }
      }
    }
    if (action === "drifting-citadel") {
      for (const tile of available?.drift ?? []) {
        spots.push({ key: `drift-${tile}`, shape: "tile", tile, title: "Drift the Ark here", onClick: () => { send({ type: "driftingCitadel", kind: picked.kind, card: picked.id, tile }); cancel(); } });
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
    if (action === "move") send({ type: "activateMove", kind: picked.kind, card: picked.id, army, ...(payInfluence ? { longReach: true } : {}) });
    else if (action === "explore") send({ type: action, kind: picked.kind, card: picked.id, army, ...(world.tactics?.archeologist ? { choice: exploreChoice } : {}) });
    else if (action === "recruit") send({ type: action, kind: picked.kind, card: picked.id, army, ...(payGold ? { gold: true } : {}), ...(payMana ? { mana: true } : {}), ...(payInfluence ? { yuguan: true } : {}) });
    else if (action === "harvest") send({ type: action, kind: picked.kind, card: picked.id, army });
    else if (action === "embark" || action === "battle") { setEmbarkArmy(army); return; }
    else if (action === "reinforce") { setPair(pair ? { ...pair, second: army } : { first: army }); return; }
    cancel();
  };
  const reinforceTotal = pair?.second ? (world.armies.find(army => army.id === pair.first)?.strength ?? 0) + (world.armies.find(army => army.id === pair.second)?.strength ?? 0) : 0;
  const itemPick: CardPick | undefined = viewingMyCourt && sources.length > 0
    ? { ids: new Set(sources.filter(source => source.kind === "item").map(source => source.id)), chosen: picked?.kind === "item" ? picked.id : null, onPick: id => choose("item", id) }
    : undefined;
  const actionPick: CardPick | undefined = actionCardIds.length > 0 || Object.keys(disabledCards).length > 0
    ? { ids: new Set(actionCardIds), disabled: disabledCards, onPick: id => setAction(world.items.find(item => item.id === id)!.def as ActionId) }
    : undefined;
  const eventReason = (item: KinItem): string => {
    if (item.def === "seasons-change") return "Seasons Change happens automatically at the start of the Event phase.";
    if (item.tapped) return "This event card was already activated this round.";
    const reasons: Record<string, string> = {
      attrition: "No army stands on unbuilt snow.",
      "lapsed-treaties": "No trade treaty is held by a disconnected player and no promise treaty awaits a verdict.",
      archeology: "There is no tile where ruins can be placed.",
      tactician: "The Tactician needs a known Science, a card in the tactics deck and someone with gold to bid.",
      calculators: "Only the Archive Ark can use this, and another player needs a character in their court.",
      "mass-harvest": "The Ark must stand on farmland, a forest or a mountain with a Worksite on the ark board.",
      "chosen-thrall": "Only the Deep Ones can use this, once at a time, and another player needs a character in their court.",
      "whispered-gifts": "Only the Deep Ones can use this, while the subterfuge deck still has a card."
    };
    return reasons[item.def] ?? "This event card cannot be activated now.";
  };
  // Event cards cost nothing: clicking one on the phase board activates it.
  const eventPick: CardPick | undefined = myTurn && play?.phase === "event" && !play.battle && !play.barter && !play.council && !play.auction
    ? (() => {
      const events = world.items.filter(item => item.zone === "board:phase" && (cardDef(item.def)?.kind === "event" || (cardDef(item.def)?.kind === "faction" && cardDef(item.def)?.form === "event")));
      const enabled = events.filter(item => play.events?.includes(item.def) && !item.tapped);
      const disabled = Object.fromEntries(events.filter(item => !enabled.includes(item)).map(item => [item.id, eventReason(item)]));
      return events.length === 0 ? undefined : { ids: new Set(enabled.map(item => item.id)), disabled, onPick: (id: string) => {
        const def = world.items.find(item => item.id === id)!.def;
        if (def === "calculators") setCalcOpen(true);
        else if (def === "chosen-thrall" || def === "whispered-gifts") setDeepOpen(def);
        else send({ type: "activateEvent", def });
      } };
    })()
    : undefined;
  const eventsAvailable = (eventPick?.ids.size ?? 0) > 0;
  // Research and Publicize send their target right away; the technology is the last choice.
  const techAction = (type: "research" | "publicize", options: { item: string }[] | undefined): CardPick | undefined =>
    picked && action === type && options
      ? { ids: new Set(options.map(option => option.item)), onPick: tech => { send({ type, kind: picked.kind, card: picked.id, tech }); cancel(); } }
      : undefined;
  const dissolvePick: CardPick | undefined = picked && action === "dissolve" && available
    ? { ids: new Set(available.dissolve), onPick: treaty => { send({ type: "dissolve", kind: picked.kind, card: picked.id, treaty }); cancel(); } }
    : undefined;
  const names: Record<string, string> = {
    ...Object.fromEntries(snapshot.seats.map(seat => [seat.id, seat.username])),
    ...Object.fromEntries(world.kins.map(kin => [`kin:${kin.id}`, kin.name]))
  };

  const actionName = action ? action[0].toUpperCase() + action.slice(1) : "";
  const instruction = move
    ? `Moving: ${Math.floor(move.speed / 2)}${move.speed % 2 ? "½" : ""} speed left. Click a highlighted tile.`
    : picked ? (action === "move" ? "Select an army to move." : action === "research" ? "Select a technology on the research track." : action === "publicize" ? "Select a technology in a court to publicize."
      : action === "barter" ? "Compose your offer."
      : action === "build" ? (!blueprint ? "Select a building blueprint in your court or on the building board." : target ? "Pay for the building." : `Click a highlighted place to build the ${chosenBlueprint?.name ?? "building"}.`)
      : action === "deploy" ? "Click a highlighted building to deploy an army on."
      : action === "demolish" ? (target ? "Tap more Expansion cards to reach the build power." : "Click a highlighted building or wall to demolish.")
      : action === "revoke" ? `Tap Expansion cards to reach 5 power and revoke ${world.law?.name ?? "the law"}.`
      : action === "recruit" ? `Click an army on a Barracks to recruit (${available?.recruitCost ?? 2} food).`
      : action === "harvest" ? "Click an army on farmland, a forest or a mountain to harvest."
      : action === "battle" ? (strikeTile !== null ? "Choose your dice." : embarkArmy ? "Click a highlighted tile to attack." : "Click the army that attacks.")
      : action === "embark" ? (embarkArmy ? "Click a highlighted ocean tile." : "Click an army on a Harbor to embark.")
      : action === "explore" ? "Click one of your armies standing on ruins to explore them."
      : action === "craftdwarves" ? "Confirm to pay 5 gold and claim the top card of the tactics deck."
      : action === "nomads" ? "Click a highlighted snow tile to move your village there."
      : action === "ruthless-capitalists" ? "Choose a player to exchange Trade Treaties with (3 tradegoods)."
      : action === "drifting-citadel" ? "Click a highlighted unbuilt tile to drift the Ark there."
      : action === "reclaim" ? (reclaimAt ? "Choose the basic resources for the treasure." : "Click a highlighted tile building to collect its treasure and relic blocks.")
      : action === "reinforce" ? (pair ? (pair.second ? "Choose how the strength is divided." : "Click an adjacent army to exchange strength with.") : "Click the first army to reinforce.")
      : "Select a treaty in your court to dissolve.")
    : action ? `Select a ${PHASES.find(entry => entry.id === play?.phase)?.name ?? ""} character or activation card to tap for ${actionName}.`
    : play?.battle ? (play.battle.defender === userId ? "You are being attacked: choose your general and dice." : `${names[play.battle.defender]} is answering ${names[play.battle.attacker]}'s attack.`)
    : play?.auction ? (play.auction.active[0] === userId ? "Tactician auction: bid more gold or fold." : `${names[play.auction.active[0]] ?? "?"} is deciding on the Tactician auction.`)
    : play?.quantum ? (play.quantum.player === userId ? "Quantum Collapse: choose your cards." : `${names[play.quantum.player] ?? "?"} is choosing with Quantum Collapse.`)
    : play?.consent ? (play.consent.plea ? (play.consent.owner === userId ? "Merciful Plea: pay 2 gold or cancel your attack." : `${names[play.consent.owner] ?? "?"} is answering the Merciful Plea.`) : play.consent.counterfuge ? (play.consent.owner === userId ? "Counterfuge: discard the secret tactics card or keep it." : `${names[play.consent.owner] ?? "?"} is deciding on Counterfuge.`) : play.consent.owner === userId ? "Coppygen: agree or decline to trade data with the Ark." : `${names[play.consent.owner] ?? "?"} is answering Coppygen's request.`)
    : play?.council ? (play.turn === userId ? "Council: vote for one of the three laws." : `${names[play.turn] ?? "?"} is voting in the council.`)
    : play?.barter ? `${names[play.barter.from]}'s barter offer is waiting for an answer.`
    : myTurn && play.phase === "event" ? (eventsAvailable ? "Seasons Change has happened. Click an event card on the phase board to activate it for free, or pass." : "Seasons Change has happened. No event card can be activated; pass.")
    : myTurn && play.phase === "discovery" ? (actionCardIds.length > 0 ? "Click an action card (Move, Research, Publicize, Barter or Dissolve) to activate it, or pass." : "Nothing to activate; pass.")
    : myTurn && play.phase === "expansion" ? (actionCardIds.length > 0 ? "Click an action card (Build, Deploy, Demolish, Reclaim, Revoke or Craftdwarves) to activate it, or pass." : "Nothing to activate; pass.")
    : myTurn && play.phase === "control" ? (actionCardIds.length > 0 ? "Click an action card (Recruit, Reinforce, Harvest, Embark, Explore or Battle) to activate it, or pass." : "Nothing to activate; pass.")
    : null;

  const topButton = move
    ? <button type="button" className="primary" onClick={() => send({ type: "moveStop" })}>{move.moved ? "Stop moving" : "Stop (card stays tapped)"}</button>
    : picked || action ? <button type="button" className="primary" onClick={cancel}>Decline</button>
    : <button type="button" className="primary" disabled={!myTurn || !!play?.barter || !!play?.battle || !!play?.council || !!play?.auction || !!play?.quantum || !!play?.consent} title={myTurn ? "End your turn without activating a card" : "It is not your turn"} onClick={() => send({ type: "pass" })}>Pass</button>;

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

      <nav className={`kin-main-left ${collapsed.left ? "collapsed" : ""}`} aria-label="Boards">
        {dockToggle("left", ["◀", "▶"])}
        {BOARDS.map(entry => (
          <button key={entry.id} type="button" className={`kin-board-tab ${board === entry.id ? "selected" : ""} ${board !== entry.id && focusBoard === entry.id ? "needed" : ""} ${(actionCardIds.length > 0 || eventsAvailable) && entry.id === "phase" ? "needed" : ""}`} onClick={() => setBoard(entry.id)}>
            <span className="kin-board-icon">{entry.icon}</span>
            <span>{entry.name}</span>
          </button>
        ))}
      </nav>

      <aside className={`kin-main-right ${collapsed.right ? "collapsed" : ""}`} aria-label="Players">
        {dockToggle("right", ["▶", "◀"])}
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

      <main className="kin-main-middle">
        <Plane key={board}>
        {snapshot.victory && <VictoryPanel victory={snapshot.victory} names={names} />}
        {play?.barter && <BarterOfferBanner world={world} offer={play.barter} userId={userId} names={names} send={send} />}
        {play && play.verdicts.length > 0 && <VerdictBanner world={world} verdicts={play.verdicts} userId={userId} names={names} send={send} />}
        {picked && action === "barter" && available ? (
          <BarterComposer world={world} userId={userId} names={names} targets={available.barter?.targets ?? []} mintable={available.barter?.mintable ?? []} source={{ kind: picked.kind, id: picked.id }} send={send} onClose={cancel} />
        ) : null}
        {play?.auction && <AuctionPanel auction={play.auction} world={world} names={names} userId={userId} gold={snapshot.you?.resources.gold ?? 0} send={send} />}
        {play?.auctionResult && play.auctionResult.id !== closedAuction && <AuctionResultBanner result={play.auctionResult} world={world} names={names} onClose={() => setClosedAuction(play.auctionResult!.id)} />}
        {play?.notice && play.notice.id !== closedNotice && <NoticeBanner text={play.notice.text} onClose={() => setClosedNotice(play.notice!.id)} />}
        {picked && action === "explore" && world.tactics?.archeologist && (
          <div className="kin-payment">
            <p className="small">Great Archeologist: choose what the ruins hold.</p>
            <div className="kin-payment-buttons">
              {["warp", "treasure", "relic"].map(choice => <button key={choice} type="button" className={exploreChoice === choice ? "primary" : ""} onClick={() => setExploreChoice(choice)}>{choice}</button>)}
            </div>
          </div>
        )}
        {play?.consent && (
          <div className="kin-payment">
            <p className="small">{play.consent.plea
              ? (play.consent.owner === userId
                ? `${names[play.consent.player] ?? "?"} pleads for mercy through Qumono: pay 2 gold, or cancel your attack.`
                : `Waiting for ${names[play.consent.owner] ?? "?"} to answer Qumono's Merciful Plea.`)
              : play.consent.counterfuge
              ? (play.consent.owner === userId
                ? "A secret tactics card was drawn for the Tactician auction. Use Rohdrimbral's Counterfuge to discard it and draw a new card?"
                : `Waiting for ${names[play.consent.owner] ?? "?"} to decide on Counterfuge (a secret tactics card was drawn).`)
              : play.consent.owner === userId
              ? `${names[play.consent.player] ?? "?"}'s Coppygen asks to copy data from your building next to the Ark. Both of you gain 1 gear if you agree.`
              : `Waiting for ${names[play.consent.owner] ?? "?"} to answer Coppygen.`}</p>
            {play.consent.owner === userId && (
              <div className="kin-payment-buttons">
                <button type="button" className="primary" onClick={() => send({ type: "consentRespond", accept: true })}>                {play.consent.plea ? "Pay 2 gold" : play.consent.counterfuge ? "Discard it" : "Agree"}</button>
                                <button type="button" onClick={() => send({ type: "consentRespond", accept: false })}>{play.consent.plea ? "Cancel the attack" : play.consent.counterfuge ? "Keep it" : "Decline"}</button>
              </div>
            )}
          </div>
        )}
        {calcOpen && myTurn && play?.calculators && (
          <div className="kin-payment">
            <p className="small">Calculators: secretly predict an action another player will take with a character this round.</p>
            <div className="kin-payment-buttons">
              <select value={calc.target} onChange={event => setCalc({ target: event.target.value, action: calc.action, character: "" })} aria-label="Player">
                <option value="">Player…</option>
                {play.calculators.players.map(entry => <option key={entry.player} value={entry.player}>{names[entry.player] ?? entry.player}</option>)}
              </select>
              <select value={calc.action} onChange={event => setCalc({ ...calc, action: event.target.value })} aria-label="Action card">
                <option value="">Action…</option>
                {play.calculators.actions.map(id => <option key={id} value={id}>{cardDef(id)?.name ?? id}</option>)}
              </select>
              <select value={calc.character} onChange={event => setCalc({ ...calc, character: event.target.value })} aria-label="Character">
                <option value="">Character…</option>
                {play.calculators.players.find(entry => entry.player === calc.target)?.characters.map(id => <option key={id} value={id}>{CHARACTERS.find(def => def.id === id)?.name ?? id}</option>)}
              </select>
              <button type="button" className="primary" disabled={!calc.target || !calc.action || !calc.character} onClick={() => { send({ type: "activateEvent", def: "calculators", ...calc }); setCalcOpen(false); setCalc({ target: "", action: "", character: "" }); }}>Predict</button>
              <button type="button" onClick={() => setCalcOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        {deepOpen === "chosen-thrall" && myTurn && (
          <div className="kin-payment">
            <p className="small">Chosen Thrall: secretly choose a character of another player. If they use it as general against you, or to Move next to your army, it joins your court.</p>
            <div className="kin-payment-buttons">
              <select value={deep.character} onChange={event => setDeep({ ...deep, character: event.target.value })} aria-label="Character">
                <option value="">Character…</option>
                {play?.thrallTargets?.map(id => <option key={id} value={id}>{CHARACTERS.find(def => def.id === id)?.name ?? id}</option>)}
              </select>
              <button type="button" className="primary" disabled={!deep.character} onClick={() => { send({ type: "activateEvent", def: "chosen-thrall", character: deep.character }); setDeepOpen(null); setDeep({ character: "", to: "", card: "" }); }}>Choose</button>
              <button type="button" onClick={() => setDeepOpen(null)}>Cancel</button>
            </div>
          </div>
        )}
        {deepOpen === "whispered-gifts" && myTurn && play?.whisper && (
          <div className="kin-payment">
            <p className="small">Whispered Gifts: give another player a subterfuge card of your choice from the deck.</p>
            <div className="kin-payment-buttons">
              <select value={deep.to} onChange={event => setDeep({ ...deep, to: event.target.value })} aria-label="Player">
                <option value="">Player…</option>
                {play.whisper.players.map(id => <option key={id} value={id}>{names[id] ?? id}</option>)}
              </select>
              <select value={deep.card} onChange={event => setDeep({ ...deep, card: event.target.value })} aria-label="Subterfuge card">
                <option value="">Card…</option>
                {play.whisper.cards.map(id => <option key={id} value={id}>{cardDef(id)?.name ?? id}</option>)}
              </select>
              <button type="button" className="primary" disabled={!deep.to || !deep.card} onClick={() => { send({ type: "activateEvent", def: "whispered-gifts", to: deep.to, card: deep.card }); setDeepOpen(null); setDeep({ character: "", to: "", card: "" }); }}>Give</button>
              <button type="button" onClick={() => setDeepOpen(null)}>Cancel</button>
            </div>
          </div>
        )}
        {play?.thrall && <p className="small muted">Your secret Chosen Thrall: {CHARACTERS.find(def => def.id === play.thrall)?.name ?? play.thrall}.</p>}
        {(play?.predictions?.length ?? 0) > 0 && (
          <p className="small muted">Your secret predictions: {play!.predictions!.map(entry => `${names[entry.target] ?? entry.target} will ${cardDef(entry.action)?.name ?? entry.action} with ${CHARACTERS.find(def => def.id === entry.character)?.name ?? entry.character}`).join("; ")}.</p>
        )}
        {picked && action === "explore" && available?.explore?.includes("ark") && (
          <div className="kin-payment">
            <p className="small">Oxylium: the Ark can explore a ruins on an adjacent tile.</p>
            <div className="kin-payment-buttons">
              {(available.oxylium ?? []).map(tile => (
                <button key={tile} type="button" className="primary" onClick={() => send({ type: "explore", kind: picked.kind, card: picked.id, army: "ark", tile, ...(world.tactics?.archeologist ? { choice: exploreChoice } : {}) })}>Explore tile {tile} with the Ark</button>
              ))}
            </div>
          </div>
        )}
        {play?.council && <CouncilPanel council={play.council} laws={world.lawList ?? []} names={names} userId={userId} onVote={(law, grand) => send({ type: "vote", law, ...(grand ? { grand: true } : {}) })} />}
        {play?.quantum && <QuantumPanel quantum={play.quantum} laws={world.lawList ?? []} subterfuge={world.subterfugeList ?? []} names={names} userId={userId} onChoose={cards => send({ type: "quantum", cards })} />}
        {play?.councilResult && play.councilResult.id !== closedCouncil && <CouncilBanner result={play.councilResult} laws={world.lawList ?? []} onClose={() => setClosedCouncil(play.councilResult!.id)} />}
        {picked && pickedSource && available && action === "revoke" && (
          <PaymentPanel
            title={`Revoke ${world.law?.name ?? "the law"}`}
            power={5}
            picked={pickedSource}
            sources={available.sources}
            onCancel={cancel}
            onConfirm={extra => { send({ type: "revoke", kind: picked.kind, card: picked.id, extra }); cancel(); }}
          />
        )}
        {picked && action === "ruthless-capitalists" && (
          <div className="kin-payment">
            <p className="small">Ruthless Capitalists: pay 3 tradegoods; you and the chosen player each give the other a Trade Treaty.</p>
            <div className="kin-payment-buttons">
              {(available?.ruthless ?? []).map(other => <button key={other} type="button" className="primary" onClick={() => { send({ type: "ruthless", kind: picked.kind, card: picked.id, target: other }); cancel(); }}>{names[other] ?? other}</button>)}
            </div>
          </div>
        )}
        {picked && action === "craftdwarves" && (
          <div className="kin-payment">
            <p className="small">Craftdwarves: pay 5 gold and claim the top card of the tactics deck.</p>
            <div className="kin-payment-buttons">
              <button type="button" className="primary" onClick={() => { send({ type: "craftdwarves", kind: picked.kind, card: picked.id }); cancel(); }}>Pay 5 gold</button>
            </div>
          </div>
        )}
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
        {play?.battle?.defender === userId && myId === userId && !play.battle.round && (
          <DefendPanel
            battle={play.battle}
            names={names}
            onConfirm={(general, dice, smite, predict, plea) => send({ type: "battleRespond", general, dice, ...(smite ? { smite: true } : {}), ...(predict !== undefined ? { predict } : {}), ...(plea ? { plea: true } : {}) })}
            onFlee={tile => send({ type: "flee", tile })}
          />
        )}
        {play?.reaction && (
          <ReactionPanel key={`${play.reaction.kind}-${play.reaction.owner}-${play.reaction.title}`} reaction={play.reaction} round={play.battle?.round} userId={userId} names={names} onAnswer={choices => send({ type: "reactionRespond", choices })} />
        )}
        {picked && action === "build" && blueprint === "village" && hasCult && (
          <div className="kin-payment">
            <p className="small">Underwater Cult: dedicate the village to a resource.</p>
            <select value={dedication} onChange={event => setDedication(event.target.value)} aria-label="Dedicate the village to a resource">
              {["gold", "lumber", "stone", "food"].map(res => <option key={res} value={res}>{res}</option>)}
            </select>
          </div>
        )}
        {picked && action === "build" && blueprint === "guild-hall" && (
          <div className="kin-payment">
            <p className="small">Guild Hall: all your tradegoods are converted into one basic resource when it is built.</p>
            <select value={guildResource} onChange={event => setGuildResource(event.target.value)} aria-label="Resource for the tradegoods">
              {["gold", "lumber", "stone", "food"].map(res => <option key={res} value={res}>{res}</option>)}
            </select>
          </div>
        )}
        {picked && action === "build" && blueprint === "grand-observatory" && (
          <div className="kin-payment">
            <p className="small">Grand Observatory: gain the Faction Treaty of up to 3 Kin that are not in the game.</p>
            {(available?.observatory ?? []).map(kin => (
              <label key={kin.id} style={{ display: "block" }}>
                <input type="checkbox" checked={observatoryKins.includes(kin.id)} disabled={!observatoryKins.includes(kin.id) && observatoryKins.length >= 3}
                  onChange={event => setObservatoryKins(event.target.checked ? [...observatoryKins, kin.id] : observatoryKins.filter(id => id !== kin.id))} /> {kin.name}
              </label>
            ))}
          </div>
        )}
        {picked && action === "recruit" && available?.yuguan && (
          <div className="kin-payment">
            <button type="button" className={payInfluence ? "primary" : ""} onClick={() => setPayInfluence(!payInfluence)}>{payInfluence ? "Yuguan: recruiting for 1 influence, no tap" : "Yuguan: recruit for 1 influence instead"}</button>
          </div>
        )}
        {picked && action === "move" && picked.kind === "character" && picked.id === "loong" && available?.longReach && (
          <div className="kin-payment">
            <button type="button" className={payInfluence ? "primary" : ""} onClick={() => setPayInfluence(!payInfluence)}>{payInfluence ? "Loong: power 6 (1 influence)" : "Loong: pay 1 influence for power 6"}</button>
          </div>
        )}
        {picked && action === "recruit" && available?.goldRecruit && (
          <div className="kin-payment">
            <button type="button" className={payGold ? "primary" : ""} onClick={() => setPayGold(!payGold)}>{payGold ? "Paying 2 gold (Goros)" : "Pay 2 gold instead of food (Goros)"}</button>
          </div>
        )}
                    {picked && action === "recruit" && available?.manaRecruit && (
                      <div className="kin-payment">
                        <button type="button" className={payMana ? "primary" : ""} onClick={() => setPayMana(!payMana)}>{payMana ? `Paying ${available.recruitCost ?? 2} mana (Daegobark)` : `Pay ${available.recruitCost ?? 2} mana instead of food (Daegobark)`}</button>
                      </div>
                    )}
                    {move && carryKinds.length > 0 && (
          <div className="kin-payment">
            <p className="small">The army brings these blocks along on the next step.</p>
            <div className="kin-payment-buttons">
              {carryKinds.map(kind => <button key={kind} type="button" className={carrying.includes(kind) ? "primary" : ""} onClick={() => setLeave(leave.includes(kind) ? leave.filter(other => other !== kind) : [...leave, kind])}>{carrying.includes(kind) ? `Bringing the ${kind} block` : `Leave the ${kind} block`}</button>)}
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
            smite={picked.kind === "character" && picked.id === "barendam" && !!available?.smite}
            predict={picked.kind === "character" && picked.id === "liangzhuge" && !!available?.predict}
            onCancel={cancel}
            onConfirm={(dice, smite, predict) => { send({ type: "battle", kind: picked.kind, card: picked.id, army: embarkArmy, tile: strikeTile, dice, ...(smite ? { smite: true } : {}), ...(predict !== undefined ? { predict }: {}) }); cancel(); }}
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
              <WorldBoard
                world={world}
                pickableArmies={armyChoices}
                onArmy={armyChoices ? onArmy : undefined}
                movingArmy={move?.army}
                moveTargets={move?.targets}
                spots={spots}
                onMoveTile={move ? tile => { send({ type: "moveStep", tile, ...(carrying.length > 0 ? { blocks: carrying } : {}) }); setLeave([]); } : undefined}
              />
            </div>
            <div className="kin-ark-overlay"><ArkBoard world={world} spots={spots} /></div>
          </div>
        )}
        {board === "building" && !(picked && action === "barter") && <BuildingBoard world={world} pick={blueprintPick} />}
        {board === "technology" && !(picked && action === "barter") && <TechnologyBoard world={world} names={names} researchPick={techAction("research", available?.research)} publicizePick={techAction("publicize", available?.publicize)} />}
        {board === "phase" && !(picked && action === "barter") && <PhaseBoard world={world} pick={actionPick ?? eventPick} current={play?.phase} />}
        </Plane>
      </main>

      <footer className={`kin-main-bottom ${collapsed.bottom ? "collapsed" : ""}`}>
        {dockToggle("bottom", ["▼", "▲"])}
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
              borrowedAbility={world.borrowed?.[def.id]}
              kins={world.kins}
              state="claimed"
              tapped={world.charTapped.includes(def.id)}
              selectable={viewingMyCourt && sourceKeys.has(sourceKey("character", def.id))}
              selected={picked?.kind === "character" && picked.id === def.id}
              onPick={() => choose("character", def.id)}
              ability={(() => {
                const option = viewingMyCourt && myTurn ? play?.abilities?.find(entry => entry.character === def.id) : undefined;
                return option ? { reason: option.reason, open: openAbility === def.id, onUse: () => DIRECT_ABILITIES.includes(option.ability ?? def.id) ? send({ type: "ability", character: def.id }) : setOpenAbility(openAbility === def.id ? null : def.id) } : undefined;
              })()}
            />
          ))}
          {courtTab === "characters" && courtCharacters.length === 0 && <p className="muted">No characters in this court.</p>}
          {courtTab === "characters" && viewingMyCourt && myTurn && openAbility && (play?.abilities ?? []).filter(option => option.character === openAbility && !option.reason).map(option => <AbilityForm key={option.character} option={option} send={action => { send(action); setOpenAbility(null); }} />)}
          {courtTab === "characters" && selected && <CourtCards world={world} player={selected.id} kinds={["activation"]} pick={itemPick} />}
          {courtTab === "technologies" && selected && <CourtCards world={world} player={selected.id} kinds={["technology"]} />}
          {courtTab === "buildings" && selected && <CourtCards world={world} player={selected.id} kinds={["blueprint"]} pick={viewingMyCourt ? blueprintPick : undefined} />}
          {courtTab === "actions" && selected && <CourtCards world={world} player={selected.id} kinds={["action", "faction", "event"]} pick={viewingMyCourt ? actionPick : undefined} />}
          {courtTab === "treaties" && selected && <CourtCards world={world} player={selected.id} kinds={["treaty", "ban"]} pick={viewingMyCourt ? dissolvePick : undefined} />}
          {courtTab === "tactics" && selected && <TacticsPanel world={world} play={play} names={names} userId={userId} player={selected.id} myTurn={myTurn} graphiscopeSelected={picked?.kind === "tactic"} graphiscopeUsable={!!action && sourceKeys.has(sourceKey("tactic", "graphiscope"))} onGraphiscope={() => choose("tactic", "graphiscope")} send={send} />}
          {courtTab === "characters" && viewingMyCourt && sourceKeys.has(sourceKey("tactic", "graphiscope")) && (
            <button type="button" className={picked?.kind === "tactic" ? "primary" : ""} onClick={() => choose("tactic", "graphiscope")}>Use the Graphiscope (power 2)</button>
          )}
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
