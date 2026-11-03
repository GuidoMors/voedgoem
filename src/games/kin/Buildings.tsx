import { BUILDINGS, buildingById, type BuildingDef } from "./buildings.data";
import { HALF_H, HALF_W, corner, tileCenter } from "./geometry";
import { kinColor } from "./KinCard";
import type { KinArmy, KinBuilding, KinWorld } from "./types";

const ROAD_COLOR = "#a9815a";
const NEUTRAL_COLOR = "#8b7355";

const points = (list: [number, number][]) => list.map(([x, y]) => `${x},${y}`).join(" ");
const scale = ([x, y]: [number, number], by: number): [number, number] => [x * by, y * by];
const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// The worksite shows the resource of the tile it touches: farmland a farm, mountain a quarry, forest a lumberyard.
const WORKSITE_ICON: Record<string, number> = { mountain: 0, farmland: 1, forest: 2 };

interface ShapeProps {
  def: BuildingDef;
  side?: number;
  // Cross buildings: vector from this tile center to the other one.
  reach?: [number, number];
  color: string;
  icon?: string;
  title?: string;
}

// A building drawn around the center of its tile (0,0). Tile, center and slice buildings carry an icon; cross and edge buildings do not.
export function BuildingShape({ def, side = 0, reach = [2 * HALF_W, 0], color, icon, title }: ShapeProps) {
  const glyph = icon ?? def.icons[0];
  const label = <title>{title ?? def.name}</title>;
  switch (def.kind) {
    case "tile": {
      const hex = [0, 1, 2, 3, 4, 5].map(s => scale(corner(s), 0.72));
      return (
        <g className="kin-building tile">
          <polygon points={points(hex)} fill={def.kin ? "#6b8f4e" : def.id === "city" ? "#8d8f98" : "#9a6b45"} stroke={color} strokeWidth={3}>{label}</polygon>
          <text className="kin-icon" x={0} y={-3} textAnchor="middle" dominantBaseline="middle">{glyph}</text>
        </g>
      );
    }
    case "center":
      return (
        <g className="kin-building center">
          <rect x={-10} y={-10} width={20} height={20} fill={color} stroke="#14122a" strokeWidth={1.5}>{label}</rect>
          <text className="kin-icon" x={0} y={-1} textAnchor="middle" dominantBaseline="middle">{glyph}</text>
        </g>
      );
    case "slice": {
      const a = corner(side);
      const b = corner(side + 1);
      const shape: [number, number][] = [a, b, scale(b, 0.5), scale(a, 0.5)];
      const [ix, iy] = scale(mid(a, b), 0.72);
      return (
        <g className="kin-building slice">
          <polygon points={points(shape)} fill={color} fillOpacity={0.85} stroke="#14122a" strokeWidth={1.2}>{label}</polygon>
          <text className="kin-icon small" x={ix} y={iy} textAnchor="middle" dominantBaseline="middle">{glyph}</text>
        </g>
      );
    }
    case "cross":
      return <line className="kin-building cross" x1={0} y1={0} x2={reach[0]} y2={reach[1]} stroke={color} strokeWidth={4} strokeLinecap="round">{label}</line>;
    default: {
      const [ax, ay] = corner(side);
      const [bx, by] = corner(side + 1);
      return <line className="kin-building edge" x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={5} strokeLinecap="round">{label}</line>;
    }
  }
}

export function ArmyToken({ army, color }: { army: Pick<KinArmy, "strength"> & Partial<Pick<KinArmy, "status" | "embarked">>; color: string }) {
  const note = army.status === "overexhausted" ? ", overexhausted" : army.status === "exhausted" ? ", exhausted" : army.embarked ? ", embarked" : "";
  return (
    <g className={`kin-army ${army.status ? "kin-army-exhausted" : ""}`}>
      <circle cx={0} cy={9} r={6.5} fill={color} stroke={army.embarked ? "#7fd4ff" : "#14122a"} strokeWidth={1.5}><title>{`Army of strength ${army.strength}${note}`}</title></circle>
      <text x={0} y={9.5} textAnchor="middle" dominantBaseline="middle">{army.strength}</text>
      {army.status && <text x={7} y={4} className="kin-army-badge">{army.status === "overexhausted" ? "‼" : "!"}</text>}
    </g>
  );
}

const colorOf = (world: KinWorld, owner: string | null) => {
  const kin = owner ? world.kins.find(k => k.id === world.kinPicks[owner]) : undefined;
  return kin ? kinColor(kin) : NEUTRAL_COLOR;
};

// Deep Ones: the resource a village is dedicated to.
const DEDICATION_ICON: Record<string, string> = { gold: "🪙", lumber: "🪵", stone: "🪨", food: "🌾" };

function iconOf(def: BuildingDef, world: KinWorld, building: KinBuilding) {
  if (def.id !== "worksite" || building.tile < 0) return undefined;
  const next = sideNeighborOf(building.tile, building.side ?? 0);
  return next === null ? undefined : def.icons[WORKSITE_ICON[world.board[next]] ?? 0];
}

// Mirrors sideNeighbor on the server: the tile across side s, or null at the edge of the board.
function sideNeighborOf(tile: number, side: number): number | null {
  const cols = 20;
  const row = Math.floor(tile / cols);
  const col = tile % cols;
  const odd = row & 1;
  const delta: [number, number][] = [[-1, odd], [0, 1], [1, odd], [1, odd - 1], [0, -1], [-1, odd - 1]];
  const [dr, dc] = delta[side];
  const r = row + dr;
  const c = col + dc;
  return r < 0 || r >= 14 || c < 0 || c >= cols ? null : r * cols + c;
}

interface LayerProps {
  world: KinWorld;
  spots?: Spot[];
  onSetupTile?: (index: number) => void;
  onSetupSide?: (side: number) => void;
  // Move: armies the player may pick, the army being moved and the tiles it may step to (cost in halves of speed).
  pickableArmies?: string[];
  onArmy?: (id: string) => void;
  movingArmy?: string;
  moveTargets?: { tile: number; cost: number }[];
  onMoveTile?: (tile: number) => void;
}

const costLabel = (halves: number) => halves === 1 ? "½" : halves % 2 === 0 ? String(halves / 2) : `${Math.floor(halves / 2)}½`;

// A place on the world board where the player can click to Build, Deploy or Demolish: a whole tile, a side of a tile (slice), an edge (wall) or a road between two tiles.
export interface Spot {
  key: string;
  shape: "tile" | "slice" | "edge" | "cross";
  tile: number;
  side?: number;
  to?: number;
  title: string;
  onClick: () => void;
}

export function BuildingLayer({ world, spots, onSetupTile, onSetupSide, pickableArmies, onArmy, movingArmy, moveTargets, onMoveTile }: LayerProps) {
  const ordered = [...world.buildings].filter(b => b.tile >= 0).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  const setup = world.setup;
  return (
    <g className="kin-buildings">
      {ordered.map(building => {
        const def = buildingById(building.def);
        if (!def) return null;
        const [x, y] = tileCenter(building.tile);
        const reach: [number, number] | undefined = building.to === undefined ? undefined : (([tx, ty]) => [tx - x, ty - y] as [number, number])(tileCenter(building.to));
        const color = building.def === "road" ? ROAD_COLOR : colorOf(world, building.owner);
        return (
          <g key={building.id} transform={`translate(${x} ${y})`}>
            <BuildingShape def={def} side={building.side} reach={reach} color={color} icon={iconOf(def, world, building)} />
            {building.dedication && <text x={0} y={22} textAnchor="middle" dominantBaseline="middle" className="kin-dedication">{DEDICATION_ICON[building.dedication] ?? "?"}<title>{`Dedicated to ${building.dedication}`}</title></text>}
          </g>
        );
      })}
      {world.blocks?.map((block, index) => {
        const [x, y] = tileCenter(block.tile);
        const glyph = block.kind === "ruins" ? { text: "♜", color: "#b9a27a", title: "Ruins: an army can Explore them" } : block.kind === "treasure" ? { text: "◆", color: "#f2c94c", title: "Treasure block: Reclaim it for 3 basic resources" } : { text: "𐚬", color: "#c77dff", title: "Relic block: Reclaim it for 1 relic" };
        return (
          <g key={`block-${index}`} transform={`translate(${x - 9 + world.blocks.slice(0, index).filter(other => other.tile === block.tile).length * 8} ${y - 7})`} className={`kin-block kin-block-${block.kind}`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fill={glyph.color}>{glyph.text}<title>{glyph.title}</title></text>
          </g>
        );
      })}
      {world.armies.map(army => {
        const [x, y] = tileCenter(army.tile);
        const pickable = !!onArmy && !!pickableArmies?.includes(army.id);
        return (
          <g key={army.id} transform={`translate(${x} ${y})`} className={`${pickable ? "kin-army-pickable" : ""} ${movingArmy === army.id ? "kin-army-moving" : ""}`} onClick={pickable ? () => onArmy(army.id) : undefined}>
            <ArmyToken army={army} color={colorOf(world, army.owner)} />
          </g>
        );
      })}
      {onMoveTile && moveTargets?.map(({ tile, cost }) => {
        const [x, y] = tileCenter(tile);
        return (
          <g key={`move-${tile}`} transform={`translate(${x} ${y})`}>
            <polygon className="kin-spot" points={points([0, 1, 2, 3, 4, 5].map(s => scale(corner(s), 0.85)))} onClick={() => onMoveTile(tile)}><title>{`Move here for ${costLabel(cost)} speed`}</title></polygon>
            <text className="kin-move-cost" x={0} y={-8} textAnchor="middle" dominantBaseline="middle">{costLabel(cost)}</text>
          </g>
        );
      })}
      {spots?.filter(spot => spot.tile >= 0).map(spot => {
        const [x, y] = tileCenter(spot.tile);
        const a = corner(spot.side ?? 0);
        const b = corner((spot.side ?? 0) + 1);
        let shape;
        if (spot.shape === "tile") shape = <polygon className="kin-spot" points={points([0, 1, 2, 3, 4, 5].map(s => scale(corner(s), 0.85)))} onClick={spot.onClick} />;
        else if (spot.shape === "slice") shape = <polygon className="kin-spot" points={points([a, b, scale(b, 0.5), scale(a, 0.5)])} onClick={spot.onClick} />;
        else if (spot.shape === "edge") shape = <line className="kin-spot-line" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} onClick={spot.onClick} />;
        else {
          const [tx, ty] = tileCenter(spot.to!);
          shape = <line className="kin-spot-line" x1={0} y1={0} x2={tx - x} y2={ty - y} onClick={spot.onClick} />;
        }
        return <g key={spot.key} transform={`translate(${x} ${y})`}>{shape}<title>{spot.title}</title></g>;
      })}
      {onSetupTile && setup?.tiles.map(tile => {
        const [x, y] = tileCenter(tile);
        return (
          <g key={tile} transform={`translate(${x} ${y})`}>
            <polygon className="kin-spot" points={points([0, 1, 2, 3, 4, 5].map(s => scale(corner(s), 0.85)))} onClick={() => onSetupTile(tile)}><title>Build here</title></polygon>
          </g>
        );
      })}
      {onSetupSide && setup?.tile !== null && setup?.tile !== undefined && setup.sides.map(side => {
        const [x, y] = tileCenter(setup.tile!);
        const a = corner(side);
        const b = corner(side + 1);
        return (
          <g key={side} transform={`translate(${x} ${y})`}>
            <polygon className="kin-spot" points={points([a, b, scale(b, 0.5), scale(a, 0.5)])} onClick={() => onSetupSide(side)}><title>Build the worksite on this side</title></polygon>
          </g>
        );
      })}
    </g>
  );
}

// Draw order: roads and edges under tile buildings, slices and centers on top.
const ORDER: Record<string, number> = { cross: 0, edge: 1, tile: 2, slice: 3, center: 4 };

// The Ark's own board holds the buildings with tile -1.
export function ArkBoard({ world, spots }: { world: KinWorld; spots?: Spot[] }) {
  const mine = world.buildings.filter(b => b.tile < 0);
  const places = spots?.filter(spot => spot.tile < 0) ?? [];
  if (mine.length === 0 && places.length === 0) return null;
  return (
    <div className="kin-ark-board">
      <strong>Ark board</strong>
      <svg viewBox="-30 -30 60 60" width={90} height={90}>
        {mine.map(building => {
          const def = buildingById(building.def);
          return def && <BuildingShape key={building.id} def={def} side={building.side} color={colorOf(world, building.owner)} />;
        })}
        {places.map(spot => {
          const a = corner(spot.side ?? 0);
          const b = corner((spot.side ?? 0) + 1);
          return <polygon key={spot.key} className="kin-spot" points={points([a, b, scale(b, 0.5), scale(a, 0.5)])} onClick={spot.onClick}><title>{spot.title}</title></polygon>;
        })}
      </svg>
    </div>
  );
}

// A sample of each building type for the rulebook-style reference under the board.
export function BuildingGallery() {
  const samples: { def: BuildingDef; side?: number; color: string; icon?: string }[] = [
    { def: buildingById("village")!, color: "#d8b25a" },
    { def: buildingById("the-ark")!, color: "#4a7fd0" },
    { def: buildingById("worksite")!, side: 1, color: "#c9553d", icon: "⛏️" },
    { def: buildingById("road")!, color: ROAD_COLOR },
    { def: buildingById("wall") ?? BUILDINGS.find(b => b.kind === "edge") ?? buildingById("road")!, side: 2, color: "#6a6a72" }
  ];
  return (
    <div className="kin-gallery">
      {samples.map(({ def, side, color, icon }) => (
        <figure key={def.id}>
          <svg viewBox="-30 -30 60 60" width={80} height={80}>
            <polygon points={points([0, 1, 2, 3, 4, 5].map(s => corner(s)))} fill="#a9d67c" stroke="#14122a" strokeWidth={0.6} />
            <BuildingShape def={def} side={side} color={color} icon={icon} reach={[HALF_W * 2, 0]} />
          </svg>
          <figcaption>{def.name}<br /><span className="muted small">{def.kind}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}

void HALF_H;
