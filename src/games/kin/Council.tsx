import { useState } from "react";
import type { KinCouncil, KinCouncilResult, KinLaw, KinQuantum } from "./types";

const lawName = (laws: KinLaw[], id: string) => laws.find(law => law.id === id)?.name ?? id;
const forbids = (laws: KinLaw[], id: string) => laws.find(law => law.id === id)?.forbids.join(", ") ?? "";

// Quantum Collapse: the Ethereal picks which cards are drawn.
export function QuantumPanel({ quantum, laws, subterfuge, names, userId, onChoose }: { quantum: KinQuantum; laws: KinLaw[]; subterfuge: { id: string; name: string }[]; names: Record<string, string>; userId: string; onChoose: (cards: string[]) => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const label = (id: string) => quantum.kind === "laws" ? lawName(laws, id) : subterfuge.find(card => card.id === id)?.name ?? id;
  if (quantum.player !== userId) return <div className="kin-payment"><h3>Quantum Collapse</h3><p className="small">Waiting for {names[quantum.player] ?? "the Ethereal"} to choose the {quantum.kind === "laws" ? "laws" : "subterfuge card"}.</p></div>;
  const toggle = (id: string) => setChosen(current => current.includes(id) ? current.filter(other => other !== id) : current.length < quantum.pick ? [...current, id] : current);
  return (
    <div className="kin-payment kin-council">
      <h3>Quantum Collapse</h3>
      <p className="small">Choose {quantum.pick} {quantum.kind === "laws" ? "law" : "subterfuge card"}{quantum.pick === 1 ? "" : "s"} to draw.</p>
      <div className="kin-payment-buttons">
        {quantum.options.map(id => <button key={id} type="button" className={chosen.includes(id) ? "primary" : ""} onClick={() => toggle(id)}>{label(id)}</button>)}
      </div>
      <button type="button" disabled={chosen.length !== quantum.pick} onClick={() => { onChoose(chosen); setChosen([]); }}>Draw</button>
    </div>
  );
}

// The voters vote one by one for one of the three laws that were drawn.
export function CouncilPanel({ council, laws, names, userId, onVote }: { council: KinCouncil; laws: KinLaw[]; names: Record<string, string>; userId: string; onVote: (law: string, grand: boolean) => void }) {
  const voting = council.voters.find(voter => !(voter in council.votes));
  const [grand, setGrand] = useState(false);
  return (
    <div className="kin-payment kin-council">
      <h3>Council</h3>
      <p className="small">
        {voting === userId ? "Your vote: choose the law that is enacted. It gets votes equal to your population." : `Waiting for ${names[voting ?? ""] ?? "?"} to vote.`}
        {" "}Voted: {council.voters.filter(voter => voter in council.votes).map(voter => names[voter] ?? voter).join(", ") || "nobody yet"}.
      </p>
      {voting === userId && council.canGrand && <button type="button" className={grand ? "primary" : ""} onClick={() => setGrand(!grand)}>{grand ? "Grand Works: +3 votes (1 influence)" : "Yamanano, Grand Works: pay 1 influence for +3 votes"}</button>}
      <div className="kin-payment-buttons">
        {council.laws.map(law => (
          <button key={law} type="button" disabled={voting !== userId} onClick={() => { onVote(law, grand); setGrand(false); }} title={`Forbids: ${forbids(laws, law)}`}>
            {lawName(laws, law)} <span className="small">(forbids {forbids(laws, law)})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CouncilBanner({ result, laws, onClose }: { result: KinCouncilResult; laws: KinLaw[]; onClose: () => void }) {
  return (
    <div className="kin-victory-banner" role="status">
      <p>
        The council voted: {result.laws.map(law => `${lawName(laws, law)} ${result.tally[law] ?? 0}`).join(", ")}.{" "}
        {result.enacted ? `${lawName(laws, result.enacted)} is enacted.` : "It was a tie: no law is enacted."}
      </p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}
