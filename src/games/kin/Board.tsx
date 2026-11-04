import { useMemo } from "react";
import { BuildingLayer, type Spot } from "./Buildings";
import { HALF_H, HALF_W } from "./geometry";
import type { KinTerrain, KinWorld } from "./types";

export const ROWS = 14;
export const COLS = 20;

export const TERRAIN_COLORS: Record<KinTerrain, string> = {
  ocean: "#2a9d9f",
  mountain: "#5a5a5e",
  forest: "#3f9d4b",
  farmland: "#e3c540",
  snow: "#f7f9fb",
  desert: "#ead9b0",
  plains: "#a9d67c"
};

export const TERRAIN_NAMES: Record<KinTerrain, string> = {
  ocean: "Ocean", mountain: "Mountain", forest: "Forest", farmland: "Farmland", snow: "Snow", desert: "Desert", plains: "Plains"
};

// Vertices are "X,Y" ids shared with the server: the tile at (row, col) is centered at X = 2*col + (row & 1), Y = 3*row.
const point = (vertex: string): [number, number] => {
  const [x, y] = vertex.split(",").map(Number);
  return [x * HALF_W, y * HALF_H];
};

const cornersOf = (index: number) => {
  const row = Math.floor(index / COLS);
  const x = 2 * (index % COLS) + (row & 1);
  const y = 3 * row;
  return [[x, y - 2], [x + 1, y - 1], [x + 1, y + 1], [x, y + 2], [x - 1, y + 1], [x - 1, y - 1]].map(([cx, cy]) => `${cx},${cy}`);
};

interface BoardProps {
  world: KinWorld;
  // Called with a tile index when a tile is clicked; only set while tiles can be placed.
  onTile?: (index: number) => void;
  // Ocean tiles this returns false for are shown as blocked and cannot be clicked.
  tileAllowed?: (index: number) => boolean;
  onVertex?: (vertex: string) => void;
  // Starting setup: tile and worksite side choices.
  onSetupTile?: (index: number) => void;
  onSetupSide?: (side: number) => void;
  pickableArmies?: string[];
  onArmy?: (id: string) => void;
  movingArmy?: string;
  moveTargets?: { tile: number; cost: number }[];
  onMoveTile?: (tile: number) => void;
  spots?: Spot[];
}

export function WorldBoard({ world, onTile, tileAllowed, onVertex, onSetupTile, onSetupSide, pickableArmies, onArmy, movingArmy, moveTargets, onMoveTile, spots }: BoardProps) {
  const polygons = useMemo(() => Array.from({ length: ROWS * COLS }, (_, index) => cornersOf(index).map(point)), []);
  const minX = -HALF_W - 4;
  const minY = -2 * HALF_H - 4;
  const width = 41 * HALF_W + 8;
  const height = 43 * HALF_H + 8;
  return (
    <svg className="kin-board" viewBox={`${minX} ${minY} ${width} ${height}`} role="img" aria-label="World board">
      <g>
        {polygons.map((corners, index) => {
          const terrain = world.board[index];
          const placeable = !!onTile && terrain === "ocean";
          const blocked = placeable && !!tileAllowed && !tileAllowed(index);
          const clickable = placeable && !blocked;
          return (
            <polygon
              key={index}
              className={`kin-tile ${clickable ? "clickable" : ""} ${blocked ? "blocked" : ""}`}
              points={corners.map(([x, y]) => `${x},${y}`).join(" ")}
              fill={TERRAIN_COLORS[terrain]}
              onClick={clickable ? () => onTile(index) : undefined}
            >
              <title>{`${TERRAIN_NAMES[terrain]} (row ${Math.floor(index / COLS) + 1}, column ${(index % COLS) + 1})`}</title>
            </polygon>
          );
        })}
      </g>
      <g className="kin-rivers">
        {Object.keys(world.rivers).map(edge => {
          const [a, b] = edge.split("|").map(point);
          return <line key={edge} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}><title>River</title></line>;
        })}
      </g>
      <BuildingLayer world={world} spots={spots} onSetupTile={onSetupTile} onSetupSide={onSetupSide} pickableArmies={pickableArmies} onArmy={onArmy} movingArmy={movingArmy} moveTargets={moveTargets} onMoveTile={onMoveTile} />
      {world.freeEnd && (() => {
        const [x, y] = point(world.freeEnd);
        return <circle className="kin-free-end" cx={x} cy={y} r={5}><title>Free end of the river</title></circle>;
      })()}
      {onVertex && world.riverChoices.map(vertex => {
        const [x, y] = point(vertex);
        return (
          <circle key={vertex} className="kin-vertex-choice" cx={x} cy={y} r={5.5} onClick={() => onVertex(vertex)}>
            <title>{world.freeEnd ? "Extend the river here" : "Start the river here"}</title>
          </circle>
        );
      })}
    </svg>
  );
}
