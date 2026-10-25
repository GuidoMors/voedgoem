import type { BaseSnapshot } from "../types";

export interface PlayerSnapshot {
  id: string;
  username: string;
  alive: boolean;
  score: number;
  lines: number;
  level: number;
  connected: boolean;
  board: string;
  team: number | null;
}

export interface ResultRow {
  id: string;
  username: string;
  score: number;
  lines: number;
  level: number;
}

export interface TeamPiece {
  id: string;
  type: number;
  cells: [number, number][];
  ghost: [number, number][];
}

export interface TeamMember {
  id: string;
  username: string;
  connected: boolean;
  out: boolean;
  next: number | null;
}

export interface TeamSnapshot {
  index: number;
  width: number;
  rows: number;
  board: string;
  alive: boolean;
  score: number;
  lines: number;
  level: number;
  pieces: TeamPiece[];
  members: TeamMember[];
}

export interface TeamResult {
  index: number;
  score: number;
  lines: number;
  level: number;
  members: { id: string; username: string }[];
}

export interface TetrisSnapshot extends BaseSnapshot {
  game: "tetris";
  seed: number;
  round: number;
  // 0 means everyone plays their own board.
  teamCount: number;
  players: PlayerSnapshot[];
  results: ResultRow[];
  teams: TeamSnapshot[];
  teamResults: TeamResult[];
}
