import type { BaseSnapshot } from "../types";

export type BlokusColor = "blue" | "yellow" | "red" | "green";

export interface BlokusCell {
  x: number;
  y: number;
}

export interface BlokusPlayer {
  id: string;
  username: string;
  color: BlokusColor;
  connected: boolean;
  out: boolean;
  remaining: string[];
  remainingSquares: number;
  piecesPlaced: number;
  lastPiece: string | null;
}

export interface BlokusPiece {
  id: string;
  cells: [number, number][];
}

export interface BlokusResult {
  id: string;
  username: string;
  color: BlokusColor;
  remainingSquares: number;
  piecesPlaced: number;
  lastPiece: string | null;
}

export interface BlokusSnapshot extends BaseSnapshot {
  game: "blokus";
  round: number;
  boardSize: number;
  board: number[];
  colors: BlokusColor[];
  pieces: BlokusPiece[];
  players: BlokusPlayer[];
  turn: string | null;
  results: BlokusResult[];
}
