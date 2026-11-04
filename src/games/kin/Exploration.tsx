import type { KinVictory, KinWorld } from "./types";

export function ExplorationBoard({ world, victory, names }: {
  world: Pick<KinWorld, "exploration" | "blocks">;
  victory: KinVictory;
  names: Record<string, string>;
}) {
  const exploration = world.exploration;
  const ruins = exploration?.ruins ?? world.blocks.filter(block => block.kind === "ruins").length;
  const players = Object.keys(victory.standings);
  const most = Math.max(0, ...players.map(player => victory.standings[player].relics));
  const tied = players.filter(player => victory.standings[player].relics === most);
  return <div className="kin-exploration-board">
    <h3>Ruins</h3>
    {exploration && <p>Additional ruins placed: <strong>{exploration.placed} / {exploration.target}</strong> (up to 9, as space permits).</p>}
    {exploration?.placing && <p role="status">Waiting for {names[exploration.player ?? ""] ?? exploration.player ?? "the next Kin"} to place a ruins block on a highlighted tile. Normal play is paused.</p>}
    <p>Ruins remaining on the world board: <strong>{ruins}</strong></p>
    <p className="small">Archeology Science is public permanently. Explore and Reclaim work normally; all ruins count, including those added later.</p>
    <h3>Victory — checked at the end of Control</h3>
    <p>When all ruins are gone, the eligible player with the most court relics wins. Treasure and relic blocks left on the world board do not delay victory.</p>
    <p className="small">Counts include preexisting and tapped relics, with direct and indirect vassals' relics attributed to their ultimate lord. Vassals cannot win.</p>
    <p className="small">If the most relics are tied (including zero), the chapter leader{victory.leader ? ` (${names[victory.leader] ?? victory.leader})` : ""} wins even if not tied for most, or their ultimate lord if they are a vassal. A vassal cycle has no eligible winner.</p>
    <table className="kin-victory-table">
      <thead><tr><th scope="col">Eligible player</th><th scope="col">Court relics, including vassals</th></tr></thead>
      <tbody>{players.map(player => <tr key={player}>
        <th scope="row">{names[player] ?? player}</th>
        <td className={tied.includes(player) ? tied.length > 1 ? "tied" : "most" : ""}>{victory.standings[player].relics}</td>
      </tr>)}</tbody>
    </table>
    <p className="small">At chapter end, all court relics and tapped relic counts are cleared. World blocks and public Archeology Science remain.</p>
  </div>;
}
