export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
}

export interface LobbySummary {
  id: string;
  game: string;
  name: string;
  hostId: string;
  hostName: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  isAdmin: boolean;
  hasRecoveryKey: boolean;
}

export type Phase = "lobby" | "playing" | "results";

export interface PlayerSnapshot {
  id: string;
  username: string;
  alive: boolean;
  score: number;
  lines: number;
  level: number;
  connected: boolean;
  board: string;
}

export interface ResultRow {
  id: string;
  username: string;
  score: number;
  lines: number;
  level: number;
}

export interface LobbySnapshot {
  type: "snapshot";
  game: string;
  name: string;
  host: { id: string; name: string };
  phase: Phase;
  seed: number;
  round: number;
  maxPlayers: number;
  players: PlayerSnapshot[];
  spectators: { id: string; username: string }[];
  results: ResultRow[];
}
