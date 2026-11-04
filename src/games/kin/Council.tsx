import { useState } from "react";
import { RuleText } from "./Cards";
import { book } from "./rulebookData";
import { slugify } from "./rulebookParser";
import type { KinCouncil, KinCouncilResult, KinLaw, KinQuantum } from "./types";

const lawName = (laws: KinLaw[], id: string) => laws.find(law => law.id === id)?.name ?? id;

export function LawCard({ id, laws, selected, onChoose }: { id: string; laws: KinLaw[]; selected?: boolean; onChoose?: () => void }) {
  const law = laws.find(law => law.id === id);
  const rewarding = !!law?.rewards?.length;
  const doc = book.docs.find(doc => doc.file === (rewarding ? "11-2-1-commonwealth-laws.md" : "25-laws.md"));
  const index = doc?.blocks.findIndex(block => block.t === "h" && slugify(block.text.split("|")[0].trim()) === id) ?? -1;
  const rules = index >= 0 ? doc?.blocks[index + 1] : undefined;
  return <article className={`kc kc-law ${onChoose ? "selectable" : ""} ${selected ? "chosen" : ""}`}
    role={onChoose ? "button" : undefined} tabIndex={onChoose ? 0 : undefined} aria-label={lawName(laws, id)} aria-pressed={selected}
    onClick={onChoose} onKeyDown={event => {
      if (onChoose && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onChoose(); }
    }}>
    <span className="kc-kind">{rewarding ? "Commonwealth law" : "Law"}</span>
    <h4>{lawName(laws, id)}</h4>
    <p className="kc-text"><RuleText text={rewarding
      ? `Commonwealth members: gain 1 [[gold]] once per successfully completed matching action: ${law.rewards!.map(action => `[[${action}]]`).join(", ")}.`
      : rules?.t === "quote" ? rules.lines.join(" ") : `Forbids: ${law?.forbids.join(", ") ?? ""}`} /></p>
  </article>;
}

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
      <div className={quantum.kind === "laws" ? "kc-row kin-quantum-laws" : "kin-payment-buttons"}>
        {quantum.options.map(id => {
          if (quantum.kind !== "laws") return <button key={id} type="button" className={chosen.includes(id) ? "primary" : ""} onClick={() => toggle(id)}>{label(id)}</button>;
          return <LawCard key={id} id={id} laws={laws} selected={chosen.includes(id)} onChoose={() => toggle(id)} />;
        })}
      </div>
      <button type="button" disabled={chosen.length !== quantum.pick} onClick={() => { onChoose(chosen); setChosen([]); }}>Draw</button>
    </div>
  );
}

// The voters vote one by one for one of the three laws that were drawn.
export function CouncilPanel({ council, laws, names, userId, onVote, onRoyalEnact }: { council: KinCouncil; laws: KinLaw[]; names: Record<string, string>; userId: string; onVote: (law: string, grand: boolean) => void; onRoyalEnact: (law: string, track: "rebel" | "kingdom") => void }) {
  const voting = council.voters.find(voter => !(voter in council.votes));
  const [grand, setGrand] = useState(false);
  const [track, setTrack] = useState<"rebel" | "kingdom">("rebel");
  if (council.king) return (
    <div className="kin-payment kin-council">
      <h3>Council — royal enactment</h3>
      <p className="small">{council.king === userId ? "Choose one law and a track for the Kingdom law board." : `Waiting for ${names[council.king] ?? "the King"} to choose a law.`}</p>
      {council.king === userId && <div className="kin-payment-buttons" aria-label="Law track">
        {(["rebel", "kingdom"] as const).map(value => <button key={value} type="button" className={track === value ? "primary" : ""} aria-pressed={track === value} onClick={() => setTrack(value)}>{value === "rebel" ? "Rebel track" : "Kingdom track"}</button>)}
      </div>}
      <div className="kc-row">
        {council.laws.map(law => (
          <LawCard key={law} id={law} laws={laws} onChoose={council.king === userId ? () => onRoyalEnact(law, track) : undefined} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="kin-payment kin-council">
      <h3>Council</h3>
      <p className="small">
        {voting === userId ? "Your vote: choose the law that is enacted. It gets votes equal to your population." : `Waiting for ${names[voting ?? ""] ?? "?"} to vote.`}
        {" "}Voted: {council.voters.filter(voter => voter in council.votes).map(voter => names[voter] ?? voter).join(", ") || "nobody yet"}.
      </p>
      {voting === userId && council.canGrand && <button type="button" className={grand ? "primary" : ""} onClick={() => setGrand(!grand)}>{grand ? "Grand Works: +3 votes (1 influence)" : "Yamanano, Grand Works: pay 1 influence for +3 votes"}</button>}
      <div className="kc-row">
        {council.laws.map(law => (
          <LawCard key={law} id={law} laws={laws} onChoose={voting === userId ? () => { onVote(law, grand); setGrand(false); } : undefined} />
        ))}
      </div>
    </div>
  );
}

export function CouncilBanner({ result, laws, onClose }: { result: KinCouncilResult; laws: KinLaw[]; onClose: () => void }) {
  return (
    <div className="kin-victory-banner" role="status">
      <p>
        {result.track
          ? `${lawName(laws, result.enacted ?? "")} is enacted on the ${result.track} track.`
          : <>The council voted: {result.laws.map(law => `${lawName(laws, law)} ${result.tally[law] ?? 0}`).join(", ")}.{" "}
            {result.enacted ? `${lawName(laws, result.enacted)} is enacted.` : "It was a tie: no law is enacted."}</>}
      </p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}
