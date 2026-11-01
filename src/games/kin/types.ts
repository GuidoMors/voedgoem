import type { BaseSnapshot } from "../types";

export type KinMode = "short" | "long" | "campaign";

export interface KinSeat {
  id: string;
  username: string;
  connected: boolean;
  resources: Record<string, number>;
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
  task: "village" | "village2" | "worksite" | "ark" | "tree";
  tiles: number[];
  tile: number | null;
  sides: number[];
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
  targets: { player: string; connected: boolean }[];
  mintable: string[];
}

export interface KinMoveSource {
  kind: "character" | "item";
  id: string;
  name: string;
  power: number;
}

export interface KinTechOption {
  item: string;
  cost: number;
  owner?: string;
}

export interface KinPlaceOption { tile: number; side?: number; to?: number; power: number }
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
}

export interface KinPlay {
  phase: "event" | "discovery" | "expansion" | "control";
  turn: string;
  passes: number;
  move: { player: string; army: string; source: { kind: "character" | "item"; id: string }; speed: number; moved: boolean; targets: { tile: number; cost: number }[] } | null;
  options: { sources: KinMoveSource[]; armies: string[]; research: KinTechOption[]; publicize: KinTechOption[]; dissolve: string[]; barter: KinBarterInfo | null; build?: KinBuildOption[]; deploy?: string[]; demolish?: KinDemolishOption[]; recruit?: string[]; reinforce?: { army: string; partners: string[] }[];   harvest?: string[]; explore?: string[]; reclaim?: { building: string; tile: number; treasure: number; relic: number }[]; embark?: { army: string; tiles: number[] }[]; battle?: { army: string; targets: number[] }[]; dice?: KinDiceKind[] } | null;
  barter: KinBarterOffer | null;
  battle?: KinBattle | null;
  report?: KinBattleReport | null;
    // The last Explore, and the event cards that can be activated in the Event phase.
    found?: KinFound | null;
    events?: string[];
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

export interface KinBlock {
  tile: number;
  kind: "ruins" | "treasure" | "relic";
}

export interface KinWorld {
  step: "tiles" | "rivers" | "kin" | "setup" | "characters" | "done";
  play: KinPlay | null;
  items: KinItem[];
  buildings: KinBuilding[];
  blocks: KinBlock[];
  armies: KinArmy[];
  setup: KinSetup | null;
  pile: Record<"mountain" | "forest" | "farmland", number>;
  board: KinTerrain[];
  // Edge id -> index of the river it belongs to.
  rivers: Record<string, number>;
  riversDone: number;
  riverTotal: number;
  freeEnd: string | null;
  turn: string | null;
  // Vertices that can be clicked now to start or extend the river.
  riverChoices: string[];
  // Player id -> Kin id.
  kinPicks: Record<string, string>;
  kins: KinInfo[];
  // Character id -> owner id, for every claimed character.
  charClaims: Record<string, string>;
  // Ids of the characters that are tapped.
  charTapped: string[];
  // Ids of the characters in this game: the neutral ones and those of the picked Kin.
  charPool: string[];
  // 0 = a character of your Kin, 1 = Discovery, 2 = Expansion, 3 = Control; null outside the draft.
  charRound: number | null;
  // What the player on turn may claim right now.
  charEligible: string[];
}
