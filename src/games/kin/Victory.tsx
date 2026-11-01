import type { KinArea, KinVictory } from "./types";

const AREAS: { id: KinArea; name: string }[] = [
  { id: "population", name: "Population" },
  { id: "strength", name: "Army strength" },
  { id: "treaties", name: "Treaties" },
  { id: "mana", name: "Mana" },
  { id: "technologies", name: "Technologies" },
  { id: "relics", name: "Relics" }
];

// New Dawn: the strict most in four of the six areas wins. A vassal's pieces count for their lord, so vassals have no column.
export function VictoryPanel({ victory, names }: { victory: KinVictory; names: Record<string, string> }) {
  const players = Object.keys(victory.standings);
  const held = (player: string) => Object.values(victory.leaders).filter(leader => leader === player).length;
  const { result } = victory;
  return (
    <>
      {result && (
        <div className="kin-victory-banner" role="status">
          <h2>{names[result.winner] ?? "?"} wins the game</h2>
          <p>{result.reason} The New Dawn was won in round {result.round}.</p>
        </div>
      )}
      <details className="kin-templates kin-victory" open={!!result}>
        <summary>New Dawn standings (need {victory.needed} of 6 areas)</summary>
        <table className="kin-victory-table">
          <thead>
            <tr>
              <th>Area</th>
              {players.map(player => <th key={player}>{names[player] ?? "?"}</th>)}
            </tr>
          </thead>
          <tbody>
            {AREAS.map(area => (
              <tr key={area.id}>
                <th>{area.name}</th>
                {players.map(player => <td key={player} className={victory.leaders[area.id] === player ? "most" : ""}>{victory.standings[player][area.id]}</td>)}
              </tr>
            ))}
            <tr>
              <th>Areas held</th>
              {players.map(player => <td key={player}><strong>{held(player)}</strong></td>)}
            </tr>
          </tbody>
        </table>
        <p className="muted small">Ties do not count, and the check happens at the end of every Control phase.</p>
      </details>
    </>
  );
}
