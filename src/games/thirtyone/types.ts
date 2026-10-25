import type { BaseSnapshot } from "../types";

export type Team = "red" | "blue";
export type Role = "captain" | "player";

export interface ThirtyOneSeat {
  id: string;
  username: string;
  team: Team;
  role: Role;
  connected: boolean;
}

export interface ThirtyOneHistoryEntry {
  team: Team;
  describer: string;
  words: { word: string; correct: boolean }[];
}

export interface ThirtyOneSnapshot extends BaseSnapshot {
  game: "thirtyone";
  round: number;
  pointsToWin: number;
  graceSeconds: number;
  turnSeconds: number;
  wordsPerCard: number;
  draftTurn: Team;
  wordPoolSize: number;
  seats: ThirtyOneSeat[];
  scores: Record<Team, number>;
  overtime: boolean;
  turn: Team;
  turnPhase: "ready" | "running";
  describer: { id: string; username: string } | null;
  judge: { id: string; username: string } | null;
  // Only the describer and the judge receive the card, and only once it is open.
  card: string[] | null;
  marks: boolean[] | null;
  endsAt: number | null;
  judgeAt: number | null;
  now: number;
  history: ThirtyOneHistoryEntry[];
  winner: Team | null;
}
