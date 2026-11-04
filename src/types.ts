import type { Avatar } from "./avatar/model";
import type { CodenamesSnapshot } from "./games/codenames/types";
import type { DworfSnapshot } from "./games/dworf/types";
import type { BlokusSnapshot } from "./games/blokus/types";
import type { KinSnapshot } from "./games/kin/types";
import type { TetrisSnapshot } from "./games/tetris/types";
import type { ThirtyOneSnapshot } from "./games/thirtyone/types";
import type { WerewolvesSnapshot } from "./games/werewolves/types";
import type { PassTimeSnapshot } from "./games/pass-time/types";
import type { WordlePvpSnapshot } from "./games/wordle-pvp/types";

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

// Keep one snapshot type per line so parallel game additions touch separate lines.
export type LobbySnapshot =
  | BlokusSnapshot
  | CodenamesSnapshot
  | DworfSnapshot
  | KinSnapshot
  | PassTimeSnapshot
  | TetrisSnapshot
  | ThirtyOneSnapshot
  | WerewolvesSnapshot
  | WordlePvpSnapshot;
