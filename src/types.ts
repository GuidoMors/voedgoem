import type { Avatar } from "./avatar/model";
import type { CodenamesSnapshot } from "./games/codenames/types";
import type { SaboteurSnapshot } from "./games/saboteur/types";
import type { BlokusSnapshot } from "./games/blokus/types";
import type { TetrisSnapshot } from "./games/tetris/types";
import type { ThirtyOneSnapshot } from "./games/thirtyone/types";

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  isHoster: boolean;
  isDisplay: boolean;
  avatar: Avatar | null;
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
  isPasswordProtected: boolean;
  playerCount: number;
  maxPlayers: number;
}

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  isAdmin: boolean;
  isHoster: boolean;
  isDisplay: boolean;
  hasRecoveryKey: boolean;
}

// Add each game's snapshot type here; they are discriminated by `game`.
export type LobbySnapshot = TetrisSnapshot | CodenamesSnapshot | ThirtyOneSnapshot | SaboteurSnapshot | BlokusSnapshot;
