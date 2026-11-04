import { useState } from "react";
import { cardDef, RuleText } from "./Cards";
import { CHARACTERS } from "./characters.data";
import { CharacterCard } from "./CharacterCard";
import { NumberInput } from "./NumberInput";
import type { KinBarterOffer, KinBarterTreaty, KinGoods, KinSeat, KinWorld } from "./types";

const RESOURCES = ["gold", "lumber", "stone", "food", "gear", "mana", "relic", "tradegood"];
const treatyName = (def: string) => cardDef(def)?.name ?? def;
const characterName = (id: string) => CHARACTERS.find(def => def.id === id)?.name ?? id;

function BarterResource({ name }: { name: string }) {
  return <RuleText text={`[[${name === "tradegood" ? "tradegoods" : name}]]`} />;
}

function GoodsSummary({ goods, world }: { goods: KinGoods; world: KinWorld }) {
  const resources = Object.entries(goods.resources).filter(([, amount]) => amount > 0);
  return <div className="kin-barter-goods">
    {resources.map(([name, amount]) => <span className="kin-barter-chip" key={name}>
      <strong>{amount}</strong> <BarterResource name={name} />
      {name === "tradegood" && goods.tradegoodAs && <> <span aria-label="becomes">&rarr;</span> <BarterResource name={goods.tradegoodAs} /></>}
    </span>)}
    {goods.characters.map(id => <span className="kin-barter-chip" key={id}>{characterName(id)}</span>)}
    {goods.treaties.map(id => <span className="kin-barter-chip" key={id}>{treatyName(world.items.find(item => item.id === id)?.def ?? id)}</span>)}
    {resources.length + goods.characters.length + goods.treaties.length === 0 && <span className="muted small">Nothing</span>}
  </div>;
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
      <h3>Barter offer</h3>
      <div className="kin-barter-sides">
        <section className="kin-barter-side"><h4>{names[offer.from]} gives</h4><GoodsSummary goods={offer.give} world={world} /></section>
        <section className="kin-barter-side"><h4>{names[offer.to]} gives</h4><GoodsSummary goods={offer.take} world={world} /></section>
      </div>
      {offer.mint.length > 0 && <ul>{offer.mint.map((entry, index) => <li key={index}>{describeMint(entry, offer, names)}</li>)}</ul>}
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

function GoodsPicker({ title, goods, onChange, characters, tradegoods, world, stock, relicsTapped }: { title: string; goods: KinGoods; onChange: (goods: KinGoods) => void; characters: string[]; tradegoods: boolean; world: KinWorld; stock: Record<string, number>; relicsTapped: number }) {
  const remainingCharacters = characters.filter(id => !goods.characters.includes(id));
  return (
    <fieldset className="kin-barter-side">
      <legend>{title}</legend>
      <div className="kin-barter-resources">
        {RESOURCES.filter(name => name !== "tradegood" || tradegoods).map(name => (
          <div className="kin-barter-resource" key={name} title={name === "tradegood" ? "Tradegoods" : name}>
            <BarterResource name={name} />
            <span className="kin-barter-stock" aria-label={`${title}: ${name} available`}>({name === "relic" ? `${relicsTapped}/` : ""}{stock[name] ?? 0})</span>
            <NumberInput aria-label={`${title}: ${name}`} min={0} max={name === "relic" ? Math.max(0, (stock.relic ?? 0) - relicsTapped) : undefined} value={goods.resources[name] ?? 0} onValueChange={value => onChange({ ...goods, resources: { ...goods.resources, [name]: Math.min(name === "relic" ? Math.max(0, (stock.relic ?? 0) - relicsTapped) : Infinity, Math.max(0, Math.floor(Number(value) || 0))) } })} />
          </div>
        ))}
      </div>
      {tradegoods && (goods.resources.tradegood ?? 0) > 0 && (
        <fieldset className="kin-barter-conversion">
          <legend><BarterResource name="tradegood" /> Convert to</legend>
          {["gold", "lumber", "stone", "food"].map(res => <label key={res} title={res}>
            <input type="radio" aria-label={`${title}: tradegoods become ${res}`} checked={goods.tradegoodAs === res} onChange={() => onChange({ ...goods, tradegoodAs: res })} />
            <BarterResource name={res} />
          </label>)}
        </fieldset>
      )}
      <label className="kin-barter-characters">
        Characters
        <select aria-label={`${title}: add character`} value="" disabled={remainingCharacters.length === 0} onChange={event => {
          if (remainingCharacters.includes(event.target.value)) onChange({ ...goods, characters: [...goods.characters, event.target.value] });
        }}>
          <option value="">{remainingCharacters.length > 0 ? "Add character..." : "No characters available"}</option>
          {remainingCharacters.map(id => <option key={id} value={id}>{characterName(id)}</option>)}
        </select>
      </label>
      {goods.characters.length > 0 && <div className="kin-barter-character-cards">
        {CHARACTERS.filter(def => goods.characters.includes(def.id)).map(def => <div className="kin-barter-character" key={def.id}>
          <CharacterCard def={def} kins={world.kins} state="claimed" borrowedAbility={world.borrowed?.[def.id]} />
          <button type="button" aria-label={`${title}: remove ${def.name}`} onClick={() => onChange({ ...goods, characters: goods.characters.filter(character => character !== def.id) })}>Remove</button>
        </div>)}
      </div>}
    </fieldset>
  );
}

// Compose a Barter offer for another player: goods from both sides and new treaties.
export function BarterComposer({ world, players: seats, userId, names, targets, mintable, source, send, onClose }: {
  world: KinWorld;
  players: KinSeat[];
  userId: string;
  names: Record<string, string>;
  targets: { player: string; connected: boolean; mintable: string[]; giveMintable: string[] }[];
  mintable: string[];
  source: { kind: string; id: string };
  send: (action: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState(targets[0]?.player ?? "");
  const [give, setGive] = useState<KinGoods>(emptyGoods);
  const [take, setTake] = useState<KinGoods>(emptyGoods);
  const [mint, setMint] = useState<KinBarterTreaty[]>([]);
  const charactersOf = (player: string) => CHARACTERS.filter(def => world.charClaims[def.id] === player && def.id !== "lumon" && def.id !== "ethereal" && !(source.kind === "character" && source.id === def.id)).map(def => def.id);
  const players = Object.keys(names);
  const receiveMintable = targets.find(target => target.player === to)?.mintable ?? [];
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
      <label className="kin-barter-partner">Trade with <select value={to} onChange={event => { setTo(event.target.value); setTake(emptyGoods()); setMint([]); }}>
        {targets.map(target => {
          const kin = world.kins.find(entry => entry.id === world.kinPicks[target.player]);
          const holdsTradeTreaty = world.items.some(item => item.def === "trade-treaty" && item.zone === `court:${target.player}` && item.owner === target.player && item.giver === userId);
          return <option key={target.player} value={target.player}>{names[target.player]} ({kin?.name ?? "No Kin"}) - {holdsTradeTreaty ? "Holds your Trade Treaty" : "No Trade Treaty from you"}</option>;
        })}
      </select></label>
      <div className="kin-barter-sides">
        <GoodsPicker title="You give" goods={give} onChange={setGive} characters={charactersOf(userId)} tradegoods={world.kinPicks[userId] === "syndicate"} world={world} stock={seats.find(player => player.id === userId)?.resources ?? {}} relicsTapped={seats.find(player => player.id === userId)?.relicsTapped ?? 0} />
        <GoodsPicker title="You receive" goods={take} onChange={setTake} characters={charactersOf(to)} tradegoods={world.kinPicks[to] === "syndicate"} world={world} stock={seats.find(player => player.id === to)?.resources ?? {}} relicsTapped={seats.find(player => player.id === to)?.relicsTapped ?? 0} />
      </div>
      <div className="kin-barter-sides">
      {(["from", "to"] as const).map(giver => {
        const options = giver === "from" ? (targets.find(target => target.player === to)?.giveMintable ?? mintable) : receiveMintable;
        const title = giver === "from" ? "I give treaty to you" : "I receive treaty from you";
        return <fieldset key={giver} className="kin-barter-side">
        <legend>{title}</legend>
        <select aria-label={title} value="" disabled={options.length === 0} onChange={event => {
          if (options.includes(event.target.value)) setMint(list => [...list, { def: `${event.target.value}-treaty`, giver }]);
        }}>
          <option value="">{options.length ? "Add a treaty..." : "No treaties available"}</option>
          {options.map(type => <option key={type} value={type}>{treatyName(`${type}-treaty`)}</option>)}
        </select>
        {mint.map((entry, index) => entry.giver === giver && (
          <div key={index} className="kin-barter-mint">
            <select value={entry.def} onChange={event => updateMint(index, { def: event.target.value })}>
              {options.map(type => <option key={type} value={`${type}-treaty`}>{treatyName(`${type}-treaty`)}</option>)}
            </select>
            {entry.def === "peace-treaty" && <span>seasons <NumberInput aria-label="Treaty seasons" min={1} max={10} value={entry.duration ?? 3} onValueChange={value => updateMint(index, { duration: Number(value) })} /></span>}
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
      </fieldset>;
      })}
      </div>
      <div className="kin-barter-answer">
        <button type="button" className="primary" disabled={!to} onClick={() => { send({ type: "barter", kind: source.kind, card: source.id, to, give, take, mint: mint.map(clean) }); onClose(); }}>Offer</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
