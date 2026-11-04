import type { Avatar } from "./avatar/model";
import type { CodenamesSnapshot } from "./games/codenames/types";
import type { DworfSnapshot } from "./games/dworf/types";
import type { BlokusSnapshot } from "./games/blokus/types";
import type { TetrisSnapshot } from "./games/tetris/types";
import type { ThirtyOneSnapshot } from "./games/thirtyone/types";
import type { WerewolvesSnapshot } from "./games/werewolves/types";
import type { PassTimeSnapshot } from "./games/pass-time/types";

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
export type LobbySnapshot = TetrisSnapshot | CodenamesSnapshot | ThirtyOneSnapshot | DworfSnapshot | BlokusSnapshot | WerewolvesSnapshot | PassTimeSnapshot;
