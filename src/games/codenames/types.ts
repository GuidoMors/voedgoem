import type { BaseSnapshot } from "../types";

export type Team = "red" | "blue";
export type CardColor = Team | "neutral" | "assassin";
export type Role = "spymaster" | "operative";

export interface CodenamesSeat {
  id: string;
  username: string;
  team: Team;
  role: Role;
  connected: boolean;
}

export interface CodenamesCard {
  word: string;
  revealed: boolean;
  color: CardColor | null;
  hint: "received" | "given" | null;
  hintTeam: Team | null;
  hintTo: string | null;
  tags: string[];
}

export interface CodenamesHistoryEntry {
  team: Team;
  clue: string;
  number: number | null;
  guesses: { word: string; color: CardColor }[];
}

export interface CodenamesSnapshot extends BaseSnapshot {
  game: "codenames";
  round: number;
  wordCount: number;
  draftTurn: Team;
  hintLimit: number;
  hintsLeft: number | null;
  wordPoolSize: number;
  seats: CodenamesSeat[];
  board: CodenamesCard[];
  turn: Team;
  startTeam: Team;
  clue: { word: string; number: number | null; max: number | null; guesses: number } | null;
  history: CodenamesHistoryEntry[];
  winner: Team | null;
  endReason: "agents" | "assassin" | null;
  remaining: { red: number; blue: number } | null;
  turnEndsAt: number | null;
  timeBank: { red: number; blue: number } | null;
  now: number;
}
