import type { BaseSnapshot } from "../types";

export type Role = "cultist" | "explorer";
export type GoalType = "gold" | "monster";
export type AbilityType = "lookGoal" | "lookDwarf" | "destroyTunnel" | "destroyPickaxe" | "fixPickaxe" | "destroyLantern" | "fixLantern";

export interface DworfPlayer {
  id: string;
  username: string;
  connected: boolean;
  tunnels: number;
  abilities: number;
  pickaxeBroken: boolean;
  lanternBroken: boolean;
  // Only your own role, dwarves you looked at, and everyone's at the end.
  role: Role | null;
}

export interface DworfSnapshot extends BaseSnapshot {
  game: "dworf";
  round: number;
  minPlayers: number;
  seats: { id: string; username: string; connected: boolean }[];
  rows: number;
  cols: number;
  ladder: number;
  abilityNames: Record<AbilityType, string>;
  players: DworfPlayer[];
  turnId: string | null;
  step: "turn" | "gift" | "monster";
  tunnels: { cell: number; sides: string }[];
  goals: { index: number; cell: number; type: GoalType | null; revealed: boolean }[];
  gems: number[];
  monsters: number[];
  lastTurn: string[];
  monsterNext: { from: number; to: number }[];
  row: AbilityType[];
  deckCount: number;
  log: string[];
  winner: Role | null;
  endReason: "gold" | "monster" | "tunnels" | null;
  me: { role: Role; tunnels: string[]; abilities: AbilityType[] } | null;
  // Hand index -> rotation (0 or 1, a half turn) -> cells where that card fits. Only for the dwarf whose turn it is.
  placeable: Record<number, Record<number, number[]>> | null;
  monsterOptions: number[] | null;
}
