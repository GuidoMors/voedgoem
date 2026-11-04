import type { BaseSnapshot } from "../types";

export type WordleTeamId = "red" | "blue";
export type WordleFeedback = "correct" | "present" | "absent";

export interface WordleGuess {
  guess: string;
  result: WordleFeedback[];
}

export interface WordlePuzzleSnapshot {
  id: number;
  solved: boolean;
  history: WordleGuess[];
  player: { id: string; username: string; connected: boolean } | null;
  waitingPlayers: { id: string; username: string; connected: boolean }[];
}

export interface WordleTeamSnapshot {
  solved: number;
  total: number;
  guesses: number;
  remainingMs: number;
  locked: boolean;
  puzzles: WordlePuzzleSnapshot[];
  players: {
    id: string;
    username: string;
    connected: boolean;
    position: number | null;
    waitingFor: number | null;
    stats: { guesses: number; yellow: number; green: number };
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
    feedback: {
      guess: string;
      result: WordleFeedback[];
      solved: boolean;
      remainingMs: number;
    } | null;
  } | null;
  now: number;
  settings: { roundMinutes: number; penaltySeconds: number };
  winner: WordleTeamId | "draw" | null;
  resultsAt: number | null;
  options: {
    join: boolean;
    leave: boolean;
    start: boolean;
    guess: boolean;
    endGame: boolean;
    closeResults: boolean;
  };
}
