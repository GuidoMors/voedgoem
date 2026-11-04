import type { BaseSnapshot } from "../types";

export type PassTimeRule =
  | { id: string; type: "clock-two-cards" | "no-hint" | "nothing" | "most" | "draw" }
  | { id: string; type: "no-number"; value: number }
  | { id: string; type: "sum-near"; value: number }
  | { id: string; type: "composition"; black: number; white: number }
  | { id: string; type: "card-count"; count: number }
  | { id: string; type: "turn-number"; numbers: number[] }
  | { id: string; type: "extreme-card"; color: "black" | "white"; extreme: "highest" | "lowest" }
  | { id: string; type: "rotate"; direction: "clockwise" | "counter-clockwise" };

export interface PassTimeClock {
  id: string;
  name: string;
  level: number;
  rules: PassTimeRule[][];
  globalRules?: PassTimeRule[];
}

export interface PassTimeCard {
  id: string;
  value: number | null;
  color: "black" | "white" | null;
  faceUp: boolean;
}

export interface PassTimeSnapshot extends BaseSnapshot {
  game: "pass-time";
  gameStep: "cards" | "hand-move";
  seats: {
    id: string;
    username: string;
    order: number;
    connected: boolean;
    pairedWith: string | null;
  }[];
  huddleMessages: { id: string; userId: string; username: string; text: string; createdAt: number }[];
  isPlayer: boolean;
  currentPlayerId: string | null;
  clock: PassTimeClock | null;
  lobbyClock: PassTimeClock | null;
  starterClocks: PassTimeClock[];
  handBoundary: number;
  hand: { id: string; value: number; color: "black" | "white" }[];
  board: PassTimeCard[][];
  totalPlaced: number;
  turnNumber: number;
  hintsRemaining: number;
  hintAllowed: boolean;
  passedHandMove: string[];
  handMoveEndsAt: number | null;
  outcome: "won" | "lost" | null;
  outcomeReason: string | null;
  results: {
    dealtHands: { ownerId: string; playerIds: string[]; cards: PassTimeCard[] }[];
    undealtCards: PassTimeCard[];
  } | null;
  options: {
    join: boolean;
    leave: boolean;
    start: boolean;
    begin: boolean;
    play: boolean;
    handMove: boolean;
    retry: boolean;
    backToLobby: boolean;
  };
}
