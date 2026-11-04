import type { BaseSnapshot } from "../types";

export type KinMode = "short" | "long" | "campaign";

export interface KinSeat {
  id: string;
  username: string;
  connected: boolean;
  resources: Record<string, number>;
  relicsTapped: number;
  relicTapReason: string | null;
  // Number of characters in the court.
  characters: number;
  // Population from villages and cities, armies against the army limit, and what the buildings produce at Seasons Change.
  population: number;
  armies: number;
  armyLimit: number;
  production: Record<string, number>;
}

export interface KinSnapshot extends BaseSnapshot {
  game: "kin";
  options: { mode: KinMode; testing: boolean };
  round: number;
  minPlayers: number;
  order: string[];
  seats: KinSeat[];
  testing: boolean;
  seed: number | null;
  you: { id: string; resources: Record<string, number> } | null;
  eventCount: number;
  victory: KinVictory | null;
  world: KinWorld | null;
}

export type KinArea = "population" | "strength" | "treaties" | "mana" | "technologies" | "relics";
export interface KinGameResult {
  winner: string;
  reason: string;
  mode: KinMode;
  chapter: string;
  round: number;
  areas: Record<string, string | null>;
  points: Record<string, number>;
}
export interface KinVictory {
  chapter: string;
  pending?: { player: string; choices: string[] } | null;
  history: { chapter: string; winner: string; round: number }[];
  leader: string | null;
  needed: number;
  standings: Record<string, Record<KinArea, number>>;
  leaders: Record<KinArea, string | null>;
  points: Record<string, number>;
  result: KinGameResult | null;
}

export type KinTerrain = "ocean" | "mountain" | "forest" | "farmland" | "snow" | "desert" | "plains";

export interface KinInfo {
  id: string;
  name: string;
  color: string;
}

export interface KinBuilding {
  id: string;
  def: string;
  owner: string | null;
  kind: "tile" | "center" | "slice" | "cross" | "edge";
  // -1 is the Ark board.
  tile: number;
  side?: number;
  to?: number;
  dedication?: string;
}

export interface KinArmy {
  id: string;
  owner: string;
  tile: number;
  strength: number;
  status?: "exhausted" | "overexhausted";
  embarked?: boolean;
}

// What the player on turn has to place in the starting setup and where they may click.
export interface KinSetup {
  player: string;
  task: string;
  building: string;
  prompt: string;
  tiles: number[];
  tile: number | null;
  sides: number[];
  dedicate?: boolean;
}

export interface KinItem {
  id: string;
  def: string;
  zone: string;
  owner: string | null;
  tapped: boolean;
  giver?: string;
  duration?: number;
  promise?: string;
  arbiter?: string;
}

export interface KinGoods {
  resources: Record<string, number>;
  characters: string[];
  treaties: string[];
  tradegoodAs?: string;
}

export interface KinBarterTreaty {
  def: string;
  giver: "from" | "to";
  duration?: number;
  promise?: string;
  arbiter?: string;
}

export interface KinBarterOffer {
  from: string;
  to: string;
  source: { kind: "character" | "item"; id: string };
  give: KinGoods;
  take: KinGoods;
  mint: KinBarterTreaty[];
}

export interface KinBarterInfo {
  targets: { player: string; connected: boolean; mintable: string[]; giveMintable: string[] }[];
  mintable: string[];
}

export interface KinMoveSource {
  kind: "character" | "item" | "tactic";
  id: string;
  name: string;
  power: number;
}

export interface KinTechOption {
  item: string;
  cost: number;
  owner?: string;
}

export interface KinPlaceOption { tile: number; side?: number; to?: number; power: number; free?: boolean }
export interface KinBuildOption {
  item: string;
  def: string;
  name: string;
  cost: { resources: Record<string, number>; basic: number };
  places: KinPlaceOption[];
}
export interface KinDemolishOption { building: string; power: number }

export type KinDiceKind = "strategic" | "aggressive" | "ambush" | "defensive";
export type KinDiceChoice = Partial<Record<KinDiceKind, number>>;

export interface KinBattleSide {
  player: string;
  general: string | null;
  pool: { general: number; army: number; garrison: number };
  dice: { kind: KinDiceKind; face: number }[];
  hits: number;
  blocks: number;
  selfHits: number;
  ambush: number;
  unblocked: number;
}

export interface KinBattleReport {
  id: number;
  attacker: KinBattleSide;
  defender: KinBattleSide;
  tile: number;
  immediate: boolean;
  disbanded: string[];
  weakened: string[];
  destroyed: string | null;
  hostages: string[];
}

// A battle waiting for its defender, who picks an optional general and the dice.
export interface KinBattle {
  attacker: string;
  defender: string;
  army: string;
  tile: number;
  source: { kind: "character" | "item"; id: string };
  generalPower: number;
  base: { army: number; garrison: number };
  generals: KinMoveSource[];
  dice: KinDiceKind[];
  smite?: boolean;
  predict?: boolean;
  plea?: boolean;
  flee?: { tiles: number[] } | null;
  round?: { stage: "dice" | "ambush" | "after"; report: KinBattleReport } | null;
}

// A pending decision (Dorhor, Iherat, Bulu, ...); only the owner answers, everybody else waits.
export interface KinReaction {
  kind: string;
  owner: string;
  title: string;
  text: string;
  options: { id: string; label: string }[];
  min: number;
  max: number;
}

export interface KinAbilityOption {
  character: string;
  reason: string | null;
  targets?: string[];
  leaps?: { army: string; over: number; tiles: number[] }[];
  take?: string[];
  give?: string[];
  hostages?: string[];
  players?: { player: string; types: string[] }[];
  converts?: string[];
  trample?: string[];
  trades?: string[];
  grog?: { grow: string[]; march: { army: string; tiles: number[] }[]; untap: string[] };
  transfers?: { from: string; to: string[] }[];
  refine?: number;
  ability?: string;
  borrow?: string[];
  rejuvenate?: string[];
  forests?: { forest: number; tiles: number[] }[];
  lumber?: number;
  dedicate?: { building: string; current: string }[];
  shadow?: { army: string; tiles: number[] }[];
}

// Quantum Collapse: the Ethereal chooses cards. The options are empty for everybody else.
export interface KinQuantum {
  player: string;
  kind: "subterfuge" | "laws";
  options: string[];
  pick: number;
  activator: string;
}

export interface KinPlay {
  donation?: { activator: string; order: string[]; donations: Record<string, number> } | null;
  schemer?: { player: string; activator: string; event: string } | null;
  oppose?: { player: string; leader: string } | null;
  selectionStep?: string | null;
  phase: "event" | "discovery" | "expansion" | "control";
  turn: string;
  passes: number;
  forcePass?: string[];
  autoEventPass?: boolean;
  move: { player: string; army: string; source: { kind: "character" | "item"; id: string }; speed: number; moved: boolean; targets: { tile: number; cost: number }[] } | null;
  options: { sources: KinMoveSource[]; armies: string[]; research: KinTechOption[]; publicize: KinTechOption[]; dissolve: string[]; barter: KinBarterInfo | null; build?: KinBuildOption[]; observatory?: { id: string; name: string }[]; deploy?: string[]; demolish?: KinDemolishOption[]; recruit?: string[]; reinforce?: { army: string; partners: string[] }[]; harvest?: string[]; explore?: string[]; oxylium?: number[]; reclaim?: { building: string; tile: number; treasure: number; relic: number }[]; revoke?: boolean; revokeLaws?: string[]; ironGrip?: { laws: string[]; power: number }; rebel?: boolean; craft?: boolean; embark?: { army: string; tiles: number[] }[]; battle?: { army: string; targets: number[] }[]; smite?: boolean; goldRecruit?: boolean; manaRecruit?: boolean; recruitCost?: number; yuguan?: boolean; predict?: boolean; longReach?: boolean; hunt?: { army: string; tiles: number[] }[]; nomads?: { village: string; tiles: number[] }[]; ruthless?: string[]; drift?: number[]; dice?: KinDiceKind[] } | null;
  consent?: { player: string; owner: string; building: string; counterfuge?: string; plea?: boolean } | null;
  predictions?: { player: string; target: string; action: string; character: string; round: number }[];
  calculators?: { players: { player: string; characters: string[] }[]; actions: string[] } | null;
  massHarvest?: { resource: string; count: number } | null;
  sabotaged?: string[];
  barter: KinBarterOffer | null;
  battle?: KinBattle | null;
  reaction?: KinReaction | null;
  report?: KinBattleReport | null;
    // The last Explore, and the event cards that can be activated in the Event phase.
    found?: KinFound | null;
    council?: KinCouncil | null;
    councilResult?: KinCouncilResult | null;
    auction?: KinAuction | null;
    auctionResult?: KinAuctionResult | null;
    abilities?: KinAbilityOption[];
    quantum?: KinQuantum | null;
  notice?: { id: number; text: string } | null;
    tacticOptions?: KinTacticOption[] | null;
    events?: string[];
    // Deep Ones: the secret Chosen Thrall (own only), and the targets of Chosen Thrall and Whispered Gifts.
    thrall?: string | null;
    thrallTargets?: string[];
    whisper?: { players: string[]; cards: string[] } | null;
  // Promise Treaties waiting for their arbiter's verdict.
  verdicts: { treaty: string; arbiter: string }[];
}

export interface KinFound {
  id: number;
  player: string;
  tile: number;
  roll: number;
  result: "warp" | "treasure" | "relic";
}

export interface KinAuction {
  activator: string;
  card: string;
  order: string[];
  active: string[];
  bid: number;
  leader: string | null;
}

export interface KinAuctionResult {
  id: number;
  card: string;
  winner: string | null;
  bid: number;
}

export interface KinTacticCard {
  id: string;
  name: string;
  text: string;
}

export interface KinTacticOption {
  card: string;
  targets: { id: string; label: string }[] | null;
  playable: boolean;
}

export interface KinLaw {
  id: string;
  name: string;
  forbids: string[];
  rewards?: string[];
}

export interface KinCouncil {
  activator: string;
  laws: string[];
  voters: string[];
  votes: Record<string, string>;
  king?: string;
  canGrand?: boolean;
  grandBy?: string[];
}

export interface KinCouncilResult {
  id: number;
  laws: string[];
  tally: Record<string, number>;
  enacted: string | null;
  track?: "rebel" | "kingdom";
}

export interface KinBlock {
  tile: number;
  kind: "ruins" | "treasure" | "relic";
}

export interface KinExploration {
  placed: number;
  target: number;
  placing: boolean;
  player: string | null;
  tiles: number[];
  ruins: number;
}

export interface KinWorld {
  exploration?: KinExploration | null;
  commonwealth?: KinCommonwealth | null;
  kingdom?: KinKingdom | null;
  step: "tiles" | "lastTiles" | "rivers" | "kin" | "setup" | "characters" | "done";
  play: KinPlay | null;
  items: KinItem[];
  buildings: KinBuilding[];
  blocks: KinBlock[];
  // The enacted law, all law cards, and the size of the law deck and its discard pile.
  law?: KinLaw | null;
  lawList?: KinLaw[];
  activeLaws?: string[];
  forbiddenActions?: Record<string, string[]>;
  lawDeck?: { deck: number; discard: number };
  tacticsList?: KinTacticCard[];
  subterfugeList?: KinTacticCard[];
  tactics?: { deck: number; discard: number; hands: Record<string, string[]>; archeologist: boolean };
  subterfuge?: { deck: number; discard: number; mine: string[]; counts: Record<string, number> };
  armies: KinArmy[];
  setup: KinSetup | null;
  pile: Record<"mountain" | "forest" | "farmland", number>;
  // The climate tiles left for setup step 3; null in games saved before that step existed.
  lastPile?: Record<"plains" | "snow" | "desert", number> | null;
  board: KinTerrain[];
  // Edge id -> index of the river it belongs to.
  rivers: Record<string, number>;
  riversDone: number;
  riverTotal: number;
  freeEnd: string | null;
  turn: string | null;
  // Vertices that can be clicked now to start or extend the river.
  riverChoices: string[];
  riverEndChoices?: string[];
  // Player id -> Kin id.
  kinPicks: Record<string, string>;
  retiredKins?: string[];
  kins: KinInfo[];
  // Character id -> owner id, for every claimed character.
  charClaims: Record<string, string>;
  // Ids of the characters that are tapped.
  charTapped: string[];
  borrowed?: Record<string, string>;
  // Ids of the characters in this game: the neutral ones and those of the picked Kin.
  charPool: string[];
  // 0 = a character of your Kin, 1 = Discovery, 2 = Expansion, 3 = Control; null outside the draft.
  charRound: number | null;
  // What the player on turn may claim right now.
  charEligible: string[];
}

export interface KinKingdom {
  king: string;
  rebel: string[];
  kingdom: string[];
  strength: Record<string, number>;
  personalStrength: Record<string, number>;
  directVassals: string[];
}

export interface KinCommonwealth {
  members: string[];
  leader: string;
  oppositionLeader: string | null;
  step: number;
  value: number;
  gold: Record<string, number>;
}
