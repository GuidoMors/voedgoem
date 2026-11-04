import type { BaseSnapshot } from "../types";

export type WordleTeamId = "red" | "blue";
export type WordleFeedback = "correct" | "present" | "absent";

export interface WordleGuess {
  guess: string;
  result: WordleFeedback[];
}

export interface WordleTeamSnapshot {
  solved: number;
  total: number;
  guesses: number;
  remainingMs: number;
  locked: boolean;
  players: {
    id: string;
    username: string;
    connected: boolean;
    queueCount: number;
    active: boolean;
    isYou: boolean;
  }[];
}

export interface WordlePvpSnapshot extends BaseSnapshot {
  game: "wordle-pvp";
  phase: "lobby" | "playing" | "results";
  matchOver: boolean;
  seats: {
    id: string;
    username: string;
    team: WordleTeamId;
    order: number;
    connected: boolean;
  }[];
  viewer: { id: string; team: WordleTeamId } | null;
  teams: Record<WordleTeamId, WordleTeamSnapshot>;
  current: {
    puzzleId: number;
    history: WordleGuess[];
    queueCount: number;
    feedback: {
      guess: string;
      result: WordleFeedback[];
      solved: boolean;
      remainingMs: number;
    } | null;
  } | null;
  now: number;
  winner: WordleTeamId | "draw" | null;
  resultsAt: number | null;
  options: {
    join: boolean;
    leave: boolean;
    start: boolean;
    guess: boolean;
    closeResults: boolean;
  };
}
