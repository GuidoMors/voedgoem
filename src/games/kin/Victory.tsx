import { kinColor } from "./KinCard";
import { chapterName, CommonwealthBoard } from "./Commonwealth";
import { LawCard } from "./Council";
import { ExplorationBoard } from "./Exploration";
import type { KinArea, KinVictory, KinWorld } from "./types";

const AREAS: { id: KinArea; name: string }[] = [
  { id: "population", name: "Population" },
  { id: "strength", name: "Army strength" },
  { id: "treaties", name: "Treaties" },
  { id: "mana", name: "Mana" },
  { id: "technologies", name: "Technologies" },
  { id: "relics", name: "Relics" }
];

// New Dawn: the strict most in four of the six areas wins. A vassal's pieces count for their lord, so vassals have no column.
function KingdomBoard({ world, names }: { world: Pick<KinWorld, "kingdom" | "lawList" | "activeLaws" | "lawDeck">; names: Record<string, string> }) {
  const kingdom = world.kingdom;
  if (!kingdom) return null;
  const laws = world.lawList ?? [];
  const lawCards = (ids: string[]) => ids.map(id => <LawCard key={id} id={id} laws={laws} />);
  const kingStrength = kingdom.strength[kingdom.king] ?? 0;
  const rebels = Object.keys(kingdom.strength).filter(player => player !== kingdom.king);
  const deckEmpty = world.lawDeck ? world.lawDeck.deck + world.lawDeck.discard === 0 : false;
  return <div className="kin-kingdom-board">
    <h3>The King</h3>
    <p><strong>{names[kingdom.king] ?? kingdom.king}</strong> · Personal deployed strength: <strong>{kingdom.personalStrength[kingdom.king] ?? 0}</strong> · Royal faction strength: <strong>{kingStrength}</strong></p>
    <h4>Direct vassals</h4>
    {kingdom.directVassals.length
      ? <ul>{kingdom.directVassals.map(player => <li key={player}>{names[player] ?? player}: personal deployed strength {kingdom.personalStrength[player] ?? 0}</li>)}</ul>
      : <p className="small">No direct vassals.</p>}
    <div className="kin-kingdom-tracks">
      {[{ id: "rebel", title: "Rebel track" }, { id: "kingdom", title: "Kingdom track" }].map(track => {
        const ids = kingdom[track.id as "rebel" | "kingdom"];
        return <section className="kin-law-track" key={track.id}>
          <h4>{track.title} ({ids.length})</h4>
          <div className="kc-row">{lawCards(ids)}</div>
          {ids.length === 0 && <p className="small">No laws enacted.</p>}
        </section>;
      })}
    </div>
    <h3>Rebels</h3>
    {rebels.length
      ? <table className="kin-victory-table">
        <thead><tr><th scope="col">Player</th><th scope="col">Personal strength</th><th scope="col">Faction strength</th></tr></thead>
        <tbody>{rebels.map(player => <tr key={player}>
          <th scope="row">{names[player] ?? player}</th>
          <td>{kingdom.personalStrength[player] ?? 0}</td>
          <td className={kingdom.strength[player] > kingStrength ? "most" : ""}>{kingdom.strength[player] ?? 0}</td>
        </tr>)}</tbody>
      </table>
      : <p className="small">There are no Rebels.</p>}
    <h3>Victory conditions — checked in this order</h3>
    <ol className="kin-kingdom-conditions">
      <li className={deckEmpty ? "met" : ""}>The King wins when the law deck and discard pile are both empty ({world.lawDeck?.deck ?? "?"} in deck, {world.lawDeck?.discard ?? "?"} in discard).</li>
      <li>A Rebel wins only with strictly more deployed world-board strength than the King and all the King's direct and indirect vassals combined, and strictly more than every other Rebel. Ties do not win; vassals cannot win.</li>
    </ol>
  </div>;
}

export function VictoryPanel({ victory, names, world, showResult = true }: { victory: KinVictory; names: Record<string, string>; world: Pick<KinWorld, "kins" | "kinPicks" | "commonwealth" | "kingdom" | "exploration" | "blocks" | "lawList" | "activeLaws" | "lawDeck">; showResult?: boolean }) {
  const players = Object.keys(victory.standings);
  const held = (player: string) => Object.values(victory.leaders).filter(leader => leader === player).length;
  const { result } = victory;
  return (
    <section className="kin-victory" aria-label="Victory conditions">
      <header className="kin-victory-heading">
        <h2>{chapterName(victory.chapter)}</h2>
        {victory.chapter === "new-dawn" && <p>Lead in <strong>{victory.needed} of {AREAS.length} areas</strong> to win.</p>}
      </header>
      {showResult && result && (
        <div className="kin-victory-banner" role="status">
          <h2>{names[result.winner] ?? "?"} wins the game</h2>
          <p>{result.reason} {chapterName(result.chapter)} was won in round {result.round}.</p>
        </div>
      )}
        {victory.chapter === "exploration"
          ? <ExplorationBoard world={world} victory={victory} names={names} />
          : victory.chapter === "kingdom" && world.kingdom
          ? <KingdomBoard world={world} names={names} />
          : victory.chapter === "commonwealth" && world.commonwealth
          ? <CommonwealthBoard commonwealth={world.commonwealth} names={names} />
          : victory.chapter === "new-dawn" && <table className="kin-victory-table">
          <thead>
            <tr>
              <th scope="col">Area</th>
              {players.map(player => {
                const kin = world.kins.find(entry => entry.id === world.kinPicks[player]);
                return <th scope="col" key={player} style={kin ? {
                  backgroundColor: kinColor(kin),
                  color: ["pink", "light blue", "yellow", "grey"].includes(kin.color) ? "#221a10" : "#fff"
                } : undefined}>{names[player] ?? "?"}</th>;
              })}
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
        </table>}
    </section>
  );
}
