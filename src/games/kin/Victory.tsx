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
    <section className="kin-victory" aria-label="Victory conditions">
      <header className="kin-victory-heading">
        <h2>New Dawn</h2>
        <p>Lead in <strong>{victory.needed} of {AREAS.length} areas</strong> to win.</p>
      </header>
      {result && (
        <div className="kin-victory-banner" role="status">
          <h2>{names[result.winner] ?? "?"} wins the game</h2>
          <p>{result.reason} The New Dawn was won in round {result.round}.</p>
        </div>
      )}
        <table className="kin-victory-table">
          <thead>
            <tr>
              <th scope="col">Area</th>
              {players.map(player => <th scope="col" key={player}>{names[player] ?? "?"}</th>)}
            </tr>
          </thead>
          <tbody>
            {AREAS.map(area => {
              const highest = Math.max(...players.map(player => victory.standings[player][area.id]));
              const tied = players.filter(player => victory.standings[player][area.id] === highest);
              return (
              <tr key={area.id}>
                <th scope="row">{area.name}</th>
                {players.map(player => {
                  const sharedFirst = tied.length > 1 && tied.includes(player);
                  const leader = victory.leaders[area.id] === player;
                  return <td key={player} className={sharedFirst ? "tied" : leader ? "most" : ""} title={sharedFirst ? "Tied for first place" : leader ? "Sole leader" : undefined}>{victory.standings[player][area.id]}</td>;
                })}
              </tr>
            );})}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Areas led</th>
              {players.map(player => <td key={player}><strong>{held(player)} / {victory.needed}</strong></td>)}
            </tr>
          </tfoot>
        </table>
    </section>
  );
}
