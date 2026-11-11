import type { BaseSnapshot } from "../types";

export interface WaarLandPlayer {
  id: string;
  username: string;
  order: number;
  score: number;
  countriesFound: number;
  correctTrivia: number;
  guesses: number;
  connected: boolean;
}

export interface WaarLandSnapshot extends BaseSnapshot {
  game: "waar-ligt-dat-land";
  step: "draw" | "guess" | "trivia" | "answer" | "turnComplete";
  roundsPerPlayer: number;
  round: number;
  turn: number;
  activePlayerId: string | null;
  reviewerId: string | null;
  players: WaarLandPlayer[];
  countries: { id: string; name: string; nameEn: string }[];
  targetName: string | null;
  targetNameEn: string | null;
  revealedCountryId: string | null;
  wrongGuesses: string[];
  distanceFeedback: { countryId: string; countryName: string; distanceKm: number }[];
  trivia: {
    category: string;
    question: string;
    questionEn: string | null;
    trueFalse: boolean;
    answer: string | null;
    answerEn: string | null;
    explanation: string | null;
    explanationEn: string | null;
    response: boolean | null;
    correct: boolean | null;
  } | null;
  turnMessage: string;
  results: { id: string; username: string; score: number; won: boolean }[];
}
