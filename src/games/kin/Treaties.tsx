import { useState } from "react";
import { cardDef } from "./Cards";
import { CHARACTERS } from "./characters.data";
import type { KinBarterOffer, KinBarterTreaty, KinGoods, KinWorld } from "./types";

const RESOURCES = ["gold", "lumber", "stone", "food", "gear", "mana", "relic", "tradegood"];
const treatyName = (def: string) => cardDef(def)?.name ?? def;
const characterName = (id: string) => CHARACTERS.find(def => def.id === id)?.name ?? id;

function describeGoods(goods: KinGoods, world: KinWorld): string {
  const parts = [
    ...Object.entries(goods.resources).map(([name, amount]) => name === "tradegood" && goods.tradegoodAs ? `${amount} tradegood (as ${goods.tradegoodAs})` : `${amount} ${name}`),
    ...goods.characters.map(characterName),
    ...goods.treaties.map(id => treatyName(world.items.find(item => item.id === id)?.def ?? id))
  ];
  return parts.length > 0 ? parts.join(", ") : "nothing";
}

function describeMint(entry: KinBarterTreaty, offer: KinBarterOffer, names: Record<string, string>): string {
  const giver = entry.giver === "from" ? offer.from : offer.to;
  const extra = [
    entry.duration !== undefined ? `${entry.duration} seasons` : "",
    entry.promise ? `"${entry.promise}"` : "",
    entry.arbiter ? `arbiter ${names[entry.arbiter] ?? entry.arbiter}` : ""
  ].filter(Boolean).join(", ");
  return `a new ${treatyName(entry.def)} given by ${names[giver] ?? giver}${extra ? ` (${extra})` : ""}`;
}

// The offer, as the other player sees it, with Accept and Decline when it is theirs to answer.
export function BarterOfferBanner({ world, offer, userId, names, send }: { world: KinWorld; offer: KinBarterOffer; userId: string; names: Record<string, string>; send: (action: Record<string, unknown>) => void }) {
  const mine = offer.to === userId;
  return (
    <div className="kin-barter-banner" role="alert">
      <p>
        <strong>{names[offer.from]}</strong> offers <strong>{describeGoods(offer.give, world)}</strong> to <strong>{names[offer.to]}</strong>
        {" "}for <strong>{describeGoods(offer.take, world)}</strong>
        {offer.mint.map((entry, index) => <span key={index}>; {describeMint(entry, offer, names)}</span>)}.
      </p>
      {mine
        ? <div className="kin-barter-answer"><button type="button" className="primary" onClick={() => send({ type: "barterRespond", accept: true })}>Accept</button><button type="button" onClick={() => send({ type: "barterRespond", accept: false })}>Decline</button></div>
        : <p className="muted small">Waiting for {names[offer.to]} to answer.</p>}
    </div>
  );
}

// Arbiters of Promise Treaties say whether the promise was broken.
export function VerdictBanner({ world, verdicts, userId, names, send }: { world: KinWorld; verdicts: { treaty: string; arbiter: string }[]; userId: string; names: Record<string, string>; send: (action: Record<string, unknown>) => void }) {
  const mine = verdicts.filter(entry => entry.arbiter === userId);
  if (mine.length === 0) return null;
  return (
    <div className="kin-barter-banner" role="alert">
      {mine.map(entry => {
        const item = world.items.find(candidate => candidate.id === entry.treaty);
        if (!item) return null;
        return (
          <div key={entry.treaty} className="kin-verdict">
            <p>As arbiter, was the promise of <strong>{names[item.giver ?? ""] ?? item.giver}</strong> to <strong>{names[item.owner ?? ""] ?? item.owner}</strong> broken? <em>"{item.promise}"</em></p>
            <div className="kin-barter-answer">
              <button type="button" onClick={() => send({ type: "verdict", treaty: entry.treaty, broken: true })}>Broken</button>
              <button type="button" className="primary" onClick={() => send({ type: "verdict", treaty: entry.treaty, broken: false })}>Kept</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const emptyGoods = (): KinGoods => ({ resources: {}, characters: [], treaties: [] });

function GoodsPicker({ title, goods, onChange, characters, treaties }: { title: string; goods: KinGoods; onChange: (goods: KinGoods) => void; characters: string[]; treaties: { id: string; label: string }[] }) {
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(entry => entry !== id) : [...list, id];
  return (
    <fieldset className="kin-barter-side">
      <legend>{title}</legend>
      <div className="kin-barter-resources">
        {RESOURCES.map(name => (
          <label key={name}>{name}
            <input type="number" min={0} value={goods.resources[name] ?? 0} onChange={event => onChange({ ...goods, resources: { ...goods.resources, [name]: Math.max(0, Math.floor(Number(event.target.value) || 0)) } })} />
          </label>
        ))}
      </div>
      {(goods.resources.tradegood ?? 0) > 0 && (
        <select value={goods.tradegoodAs ?? ""} onChange={event => onChange({ ...goods, tradegoodAs: event.target.value || undefined })} aria-label="Tradegoods become">
          <option value="">Tradegoods become…</option>
          {["gold", "lumber", "stone", "food"].map(res => <option key={res} value={res}>{res}</option>)}
        </select>
      )}
      {characters.map(id => <label key={id} className="kin-barter-check"><input type="checkbox" checked={goods.characters.includes(id)} onChange={() => onChange({ ...goods, characters: toggle(goods.characters, id) })} /> {characterName(id)}</label>)}
      {treaties.map(entry => <label key={entry.id} className="kin-barter-check"><input type="checkbox" checked={goods.treaties.includes(entry.id)} onChange={() => onChange({ ...goods, treaties: toggle(goods.treaties, entry.id) })} /> {entry.label}</label>)}
    </fieldset>
  );
}

// Compose a Barter offer for another player: goods from both sides and new treaties.
export function BarterComposer({ world, userId, names, targets, mintable, source, send, onClose }: {
  world: KinWorld;
  userId: string;
  names: Record<string, string>;
  targets: { player: string; connected: boolean }[];
  mintable: string[];
  source: { kind: string; id: string };
  send: (action: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState(targets[0]?.player ?? "");
  const [give, setGive] = useState<KinGoods>(emptyGoods);
  const [take, setTake] = useState<KinGoods>(emptyGoods);
  const [mint, setMint] = useState<KinBarterTreaty[]>([]);
  const charactersOf = (player: string) => CHARACTERS.filter(def => world.charClaims[def.id] === player && !(source.kind === "character" && source.id === def.id)).map(def => def.id);
  const treatiesOf = (player: string) => world.items
    .filter(item => item.zone === `court:${player}` && item.giver && item.def !== "trade-treaty" && cardDef(item.def)?.kind === "treaty")
    .map(item => ({ id: item.id, label: `${treatyName(item.def)} (from ${names[item.giver!] ?? item.giver})` }));
  const players = Object.keys(names);
  const updateMint = (index: number, patch: Partial<KinBarterTreaty>) => setMint(list => list.map((entry, position) => position === index ? { ...entry, ...patch } : entry));
  const clean = (entry: KinBarterTreaty): KinBarterTreaty => ({
    def: entry.def,
    giver: entry.giver,
    ...(entry.def === "peace-treaty" ? { duration: entry.duration ?? 3 } : {}),
    ...(entry.def === "promise-treaty" ? { promise: entry.promise ?? "", arbiter: entry.arbiter ?? "" } : {})
  });

  return (
    <div className="kin-barter">
      <h3>Barter</h3>
      <label>With <select value={to} onChange={event => setTo(event.target.value)}>
        {targets.map(target => <option key={target.player} value={target.player}>{names[target.player]}{target.connected ? " (connected)" : ""}</option>)}
      </select></label>
      <div className="kin-barter-sides">
        <GoodsPicker title="You give" goods={give} onChange={setGive} characters={charactersOf(userId)} treaties={treatiesOf(userId)} />
        <GoodsPicker title={`${names[to] ?? "They"} give${names[to] ? "s" : ""}`} goods={take} onChange={setTake} characters={charactersOf(to)} treaties={treatiesOf(to)} />
      </div>
      <fieldset className="kin-barter-side">
        <legend>New treaties</legend>
        {mint.map((entry, index) => (
          <div key={index} className="kin-barter-mint">
            <select value={entry.def} onChange={event => updateMint(index, { def: event.target.value })}>
              {mintable.map(type => <option key={type} value={`${type}-treaty`}>{treatyName(`${type}-treaty`)}</option>)}
            </select>
            <select value={entry.giver} onChange={event => updateMint(index, { giver: event.target.value as "from" | "to" })}>
              <option value="from">given by you</option>
              <option value="to">given by {names[to]}</option>
            </select>
            {entry.def === "peace-treaty" && <label>seasons <input type="number" min={1} max={10} value={entry.duration ?? 3} onChange={event => updateMint(index, { duration: Number(event.target.value) })} /></label>}
            {entry.def === "promise-treaty" && (
              <>
                <input type="text" maxLength={200} placeholder="The promise" value={entry.promise ?? ""} onChange={event => updateMint(index, { promise: event.target.value })} />
                <select value={entry.arbiter ?? ""} onChange={event => updateMint(index, { arbiter: event.target.value })}>
                  <option value="">Arbiter…</option>
                  {players.filter(player => player !== (entry.giver === "from" ? userId : to)).map(player => <option key={player} value={player}>{names[player]}</option>)}
                </select>
              </>
            )}
            <button type="button" onClick={() => setMint(list => list.filter((_, position) => position !== index))} aria-label="Remove treaty">✕</button>
          </div>
        ))}
        <button type="button" disabled={mintable.length === 0} title={mintable.length === 0 ? "You know no diplomacy technology" : undefined}
          onClick={() => setMint(list => [...list, { def: `${mintable[0]}-treaty`, giver: "from" }])}>+ Add a treaty</button>
      </fieldset>
      <div className="kin-barter-answer">
        <button type="button" className="primary" disabled={!to} onClick={() => { send({ type: "barter", kind: source.kind, card: source.id, to, give, take, mint: mint.map(clean) }); onClose(); }}>Offer</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
