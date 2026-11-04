import { useState } from "react";
import { cardDef, RuleText } from "./Cards";
import { NumberInput } from "./NumberInput";
import type { KinCommonwealth, KinSnapshot, KinWorld } from "./types";

export const chapterName = (chapter: string) => chapter.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");

export function ChapterChoice({ snapshot, userId, send }: { snapshot: KinSnapshot; userId: string; send: (action: Record<string, unknown>) => void }) {
  const pending = snapshot.victory?.pending;
  if (!pending) return null;
  const name = snapshot.seats.find(seat => seat.id === pending.player)?.username ?? pending.player;
  return <section className="card kin-chapter-choice" aria-label="Next chapter">
    <h2>Choose the next chapter</h2>
    <p role="status">{pending.player === userId ? "Choose a chapter to continue the game." : `Waiting for ${name} to choose the next chapter.`}</p>
    <div className="kin-payment-buttons">{pending.choices.filter(chapter => ["commonwealth", "kingdom", "new-dawn", "exploration"].includes(chapter)).map(chapter =>
      <button key={chapter} type="button" className="primary" disabled={pending.player !== userId} onClick={() => send({ type: "chooseChapter", chapter })}>{chapterName(chapter)}</button>
    )}</div>
    {!!snapshot.victory?.history?.length && <ol>{snapshot.victory.history.map((entry, index) =>
      <li key={index}>{chapterName(entry.chapter)}: {snapshot.seats.find(seat => seat.id === entry.winner)?.username ?? entry.winner} won in round {entry.round}.</li>
    )}</ol>}
  </section>;
}

export function CommonwealthBoard({ commonwealth, names }: { commonwealth: KinCommonwealth; names: Record<string, string> }) {
  const players = Object.keys(names).filter(player => !player.startsWith("kin:"));
  const eligible = (player: string | null) => !!player && player in commonwealth.gold;
  const total = Object.values(commonwealth.gold).reduce((sum, gold) => sum + gold, 0);
  return <div className="kin-commonwealth">
    <h3>Commonwealth marker</h3>
    <ol className="kin-commonwealth-track" aria-label={`Commonwealth track: step ${commonwealth.step} of 10`}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map(step =>
        <li key={step} aria-current={commonwealth.step === step ? "step" : undefined}>{step}{commonwealth.step === step && <strong title="Marker value">{commonwealth.value}</strong>}</li>
      )}
    </ol>
    <p>Step <strong>{commonwealth.step}/10</strong> · Donation target: <strong>{commonwealth.value} gold</strong> (1–20)</p>
    <div className="kin-commonwealth-parties">
      {[{ name: "Commonwealth", leader: commonwealth.leader, members: players.filter(player => commonwealth.members.includes(player)) },
        { name: "Opposition", leader: commonwealth.oppositionLeader, members: players.filter(player => !commonwealth.members.includes(player)) }].map(party =>
        <section key={party.name}><h3>{party.name}</h3>
          <p>Leader: <strong>{party.leader ? names[party.leader] ?? party.leader : "None"}</strong></p>
          <p>{party.members.map(player => names[player] ?? player).join(", ") || "No members"}</p>
        </section>
      )}
    </div>
    <h3>Victory conditions — checked in this order</h3>
    <p className="small">At the end of Control, the first satisfied condition wins. Vassals cannot win; their gold counts towards their lord.</p>
    <ol className="kin-commonwealth-conditions">
      <li>Have more gold than all other players combined.</li>
      <li className={commonwealth.step === 10 && eligible(commonwealth.leader) ? "met" : ""}>Commonwealth leader: reach step 10.</li>
      <li className={commonwealth.step === 1 && eligible(commonwealth.oppositionLeader) ? "met" : ""}>Opposition leader: be on step 1 (an Opposition leader must exist).</li>
    </ol>
    <table className="kin-victory-table">
      <thead><tr><th scope="col">Eligible player</th><th scope="col">Gold, including vassals</th><th scope="col">All others</th></tr></thead>
      <tbody>{Object.entries(commonwealth.gold).map(([player, gold]) =>
        <tr key={player}><th scope="row">{names[player] ?? player}</th><td className={gold > total - gold ? "most" : ""}>{gold}</td><td>{total - gold}</td></tr>
      )}</tbody>
    </table>
  </div>;
}

export function CommonwealthDecision({ world, seats, names, userId, send }: { world: KinWorld; seats: KinSnapshot["seats"]; names: Record<string, string>; userId: string; send: (action: Record<string, unknown>) => void }) {
  const [amount, setAmount] = useState("0");
  const play = world.play;
  if (!play) return null;
  const { schemer, oppose, donation } = play;
  if (schemer) return <section className="kin-payment kin-commonwealth-prompt" aria-label="Cautious Schemer">
    <h3>Cautious Schemer</h3>
    <p>{names[schemer.player] ?? schemer.player}: take your turn last in {cardDef(schemer.event)?.name ?? schemer.event}, or keep natural order?</p>
    {userId === schemer.player && <div className="kin-payment-buttons">
      <button type="button" onClick={() => send({ type: "schemerRespond", last: false })}>Keep natural order</button>
      <button type="button" className="primary" onClick={() => send({ type: "schemerRespond", last: true })}>Go last</button>
    </div>}
  </section>;
  if (oppose) return <section className="kin-payment kin-commonwealth-prompt" aria-label="Oppose permission">
    <h3>Oppose — permission</h3>
    <p>{names[oppose.player] ?? oppose.player} wants to join the other party. Waiting for {names[oppose.leader] ?? oppose.leader} to approve.</p>
    <p className="small">The activation source is already tapped. Declining still ends the opposing player's turn.</p>
    {userId === oppose.leader && <div className="kin-payment-buttons">
      <button type="button" onClick={() => send({ type: "opposeRespond", accept: false })}>Decline</button>
      <button type="button" className="primary" onClick={() => send({ type: "opposeRespond", accept: true })}>Approve</button>
    </div>}
  </section>;
  if (!donation) return null;
  const gold = seats.find(seat => seat.id === userId)?.resources.gold ?? 0;
  const valid = amount !== "" && Number.isInteger(Number(amount)) && Number(amount) >= 0 && Number(amount) <= gold;
  const total = Object.values(donation.donations).reduce((sum, value) => sum + value, 0);
  return <section className="kin-payment kin-commonwealth-prompt" aria-label="Commonwealth Donation">
    <h3>Commonwealth Donation</h3>
    <p role="status">{play.turn === userId ? `Choose how much gold to donate (you have ${gold}).` : `Waiting for ${names[play.turn] ?? play.turn} to donate.`}</p>
    <p>Donated: {total} gold · Target: {world.commonwealth?.value ?? "?"} gold.</p>
    <ol>{donation.order.map(player => <li key={player}>{names[player] ?? player}: {player in donation.donations ? `${donation.donations[player]} gold` : "pending"}</li>)}</ol>
    {play.turn === userId && <div className="kin-payment-buttons">
      <label>Gold <NumberInput aria-label="Gold to donate" min={0} max={gold} value={amount} onValueChange={setAmount} /></label>
      <button type="button" className="primary" disabled={!valid} onClick={() => send({ type: "donate", gold: Number(amount) })}>Donate</button>
      <button type="button" onClick={() => send({ type: "donate", gold: 0 })}>Donate nothing</button>
    </div>}
    <p className="small"><RuleText text="Donations leave your court. Half the total, rounded down, goes to the Commonwealth leader." /></p>
  </section>;
}
