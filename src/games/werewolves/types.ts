import type { BaseSnapshot } from "../types";

export type WerewolvesRoleId =
  | "big-bad-wolf" | "cloaked-wolf" | "wise-wolf" | "throatcutter" | "sniffer"
  | "wolfchild" | "fool" | "cupido" | "elder" | "hunter" | "alchemist"
  | "old-knight" | "judge" | "little-girl" | "guard" | "bearman" | "seer";

export type WerewolvesFaction = "werewolf" | "villager" | "neutral";

export interface WerewolvesRole {
  id: WerewolvesRoleId;
  name: string;
  faction: WerewolvesFaction;
  icon: string;
  iconPath: string;
  rule: string;
}

export interface WerewolvesSeat {
  id: string;
  username: string;
  order: number;
  alive: boolean;
  connected: boolean;
  mayor: boolean;
  silenced: boolean;
  absent: boolean;
  publiclyRevealed: boolean;
  role?: WerewolvesRoleId | null;
  faction?: WerewolvesFaction;
}

export interface WerewolvesStep {
  id: string;
  phase: string;
  day: number;
  kind: string;
  prompt: string;
  actorMode: string;
  role?: WerewolvesRoleId;
  actorId?: string;
  voterId?: string;
  targetId?: string;
  required?: boolean;
  optional?: boolean;
  data?: Record<string, unknown>;
  submissions?: Record<string, Record<string, unknown>>;
  override?: Record<string, unknown> | null;
  wiseWolfWarning?: boolean;
}

export interface WerewolvesSnapshot extends BaseSnapshot {
  game: "werewolves";
  day: number;
  firstNight: boolean;
  settings: {
    rolePool: WerewolvesRoleId[];
    wolfCount: number;
    skipLynch: boolean;
    moonCards: boolean;
  };
  roleCatalog: WerewolvesRole[];
  rolePool: WerewolvesRoleId[];
  wolfCount: number;
  gm: { id: string; username: string; connected: boolean } | null;
  isGM: boolean;
  viewer: { id: string; role: WerewolvesRoleId | null; alive: boolean; faction: WerewolvesFaction | null } | null;
  seats: WerewolvesSeat[];
  villageCapacity: number;
  villageCount: number;
  townName: string;
  mayorId: string | null;
  mayorCandidates: string[];
  lovers: [string, string] | null;
  wolfchildTarget: string | null;
  publicStep: { phase: string; day: number; kind: string; prompt: string; voterId?: string; lynchTargetId?: string } | null;
  privatePrompt: { id: string; kind: string; prompt: string; role: WerewolvesRoleId | null; data?: Record<string, unknown> } | null;
  currentStep: WerewolvesStep | null;
  sparedPlayerIds: string[];
  stepsRemaining?: WerewolvesStep[];
  upcomingSteps?: { phase: string; steps: string[] }[];
  canAct: boolean;
  action: Record<string, unknown> | null;
  privateResults: Record<string, unknown>;
  gmPrivateResults?: Record<string, Record<string, unknown>>;
  gmActions?: Record<string, unknown>;
  nightResolution?: Record<string, unknown>;
  wolfSubmissions?: { userId: string; targetId: string | null }[];
  wolfTarget?: string | null;
  wolfWarning?: boolean;
  publicActions: {
    bearGrowl: { growl: boolean } | null;
    bigBadRevealed: boolean;
    moonCard: string | null;
    moonCardName: string | null;
  };
  moonCatalog: { id: string; name: string; rule: string }[];
  moonOffers: string[];
  moonDeckRemaining: number;
  resources?: { potion: boolean; poison: boolean };
  deaths: { userId: string; username?: string; reason?: string; role?: WerewolvesRoleId; order: number }[];
  events: string[];
  buried: boolean;
  result: { winner: string; winners: string[] } | null;
  results?: { id: string; username: string; role: WerewolvesRoleId | null; alive: boolean; won: boolean }[];
  options: {
    join: boolean;
    leave: boolean;
    configure: boolean;
    setGM: boolean;
    start: boolean;
    selectAction: boolean;
    gmAction: boolean;
    confirmStep: boolean;
  };
  rules: {
    general: string[];
    roles: WerewolvesRole[];
    moonCards: { id: string; name: string; rule: string }[];
  };
}
