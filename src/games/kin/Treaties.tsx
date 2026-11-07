import { useState } from "react";
import { Modal } from "../../components/Modal";
import { cardDef, GameCard, ItemCard, RuleText } from "./Cards";
import { CHARACTERS } from "./characters.data";
import { CharacterCard } from "./CharacterCard";
import { NumberInput } from "./NumberInput";
import { kinColor } from "./KinCard";
import type { KinBarterOffer, KinBarterTreaty, KinGoods, KinInfo, KinSeat, KinWorld } from "./types";

const RESOURCES = ["gold", "lumber", "stone", "food", "gear", "mana", "relic", "tradegood"];
const treatyName = (def: string) => cardDef(def)?.name ?? def;
const characterName = (id: string) => CHARACTERS.find(def => def.id === id)?.name ?? id;
const partnerColors = (kin: KinInfo | undefined) => kin ? {
  backgroundColor: kinColor(kin),
  color: ["pink", "light blue", "yellow", "grey"].includes(kin.color.toLowerCase()) ? "#221a10" : "#fff"
} : undefined;

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
    {CHARACTERS.filter(def => goods.characters.includes(def.id)).map(def => <CharacterCard key={def.id} def={def} kins={world.kins} state="claimed" borrowedAbility={world.borrowed?.[def.id]} />)}
    {goods.treaties.map(id => {
      const item = world.items.find(item => item.id === id);
      return item && <ItemCard key={id} item={item} kins={world.kins} kinPicks={world.kinPicks} />;
    })}
    {resources.length === 0 && <span className="muted small">No resources</span>}
  </div>;
}

// The offer, as the other player sees it, with Accept and Decline when it is theirs to answer.
export function BarterOfferBanner({ world, offer, userId, names, send }: { world: KinWorld; offer: KinBarterOffer; userId: string; names: Record<string, string>; send: (action: Record<string, unknown>) => void }) {
  const mine = offer.to === userId;
  const [open, setOpen] = useState(true);
  if (!open) return <button type="button" onClick={() => setOpen(true)}>View Barter offer</button>;
  return (
    <Modal title="Barter offer" onClose={() => setOpen(false)} wide className="kin-action-modal">
    <div className="kin-barter-banner" role="alert">
      <div className="kin-barter-sides">
        {(["from", "to"] as const).map(side => {
          const giver = offer[side];
          const kin = world.kins.find(kin => kin.id === world.kinPicks[giver]);
          return <section key={side} className="kin-barter-side">
            <h4>{names[giver]} gives</h4>
            <GoodsSummary goods={side === "from" ? offer.give : offer.take} world={world} />
            <div className="kin-barter-goods">{offer.mint.filter(entry => entry.giver === side).map((entry, index) => <GameCard
              key={index} def={cardDef(entry.def)!} kins={world.kins} giver={kin ? kinColor(kin) : undefined}
              details={[
                `Given by ${names[giver]}`,
                ...(entry.duration !== undefined ? [`${entry.duration} seasons`] : []),
                ...(entry.promise ? [`Promise: ${entry.promise}`] : []),
                ...(entry.arbiter ? [`Arbiter: ${names[entry.arbiter] ?? entry.arbiter}`] : [])
              ]}
            />)}</div>
          </section>;
        })}
      </div>
      {mine
        ? <div className="kin-barter-answer"><button type="button" className="primary" onClick={() => send({ type: "barterRespond", accept: true })}>Accept</button><button type="button" onClick={() => send({ type: "barterRespond", accept: false })}>Decline</button></div>
        : <p className="muted small">Waiting for {names[offer.to]} to answer.</p>}
    </div>
    </Modal>
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
  const selectedKin = world.kins.find(kin => kin.id === world.kinPicks[to]);
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
      <label className="kin-barter-partner">Trade with <select value={to} style={partnerColors(selectedKin)} onChange={event => { setTo(event.target.value); setTake(emptyGoods()); setMint([]); }}>
        {targets.map(target => {
          const kin = world.kins.find(entry => entry.id === world.kinPicks[target.player]);
          const holdsTradeTreaty = world.items.some(item => item.def === "trade-treaty" && item.zone === `court:${target.player}` && item.owner === target.player && item.giver === userId);
          return <option key={target.player} value={target.player} style={partnerColors(kin)} data-light={kin && ["pink", "light blue", "yellow", "grey"].includes(kin.color.toLowerCase())}>{names[target.player]} ({kin?.name ?? "No Kin"}) - {holdsTradeTreaty ? "Holds your Trade Treaty" : "No Trade Treaty from you"}</option>;
        })}
      </select></label>
      <div className="kin-barter-sides">
        <GoodsPicker title="You give" goods={give} onChange={setGive} characters={charactersOf(userId)} tradegoods={world.kinPicks[userId] === "syndicate"} world={world} stock={seats.find(player => player.id === userId)?.resources ?? {}} relicsTapped={seats.find(player => player.id === userId)?.relicsTapped ?? 0} />
        <GoodsPicker title="You receive" goods={take} onChange={setTake} characters={charactersOf(to)} tradegoods={world.kinPicks[to] === "syndicate"} world={world} stock={seats.find(player => player.id === to)?.resources ?? {}} relicsTapped={seats.find(player => player.id === to)?.relicsTapped ?? 0} />
      </div>
      <div className="kin-barter-sides">
      {(["from", "to"] as const).map(giver => {
        const available = giver === "from" ? (targets.find(target => target.player === to)?.giveMintable ?? mintable) : receiveMintable;
        const title = giver === "from" ? "I give treaty to you" : "I receive treaty from you";
        const treatyGiver = giver === "from" ? userId : to;
        const treatyReceiver = giver === "from" ? to : userId;
        const alreadyHoldsTrade = world.items.some(item => item.def === "trade-treaty" && item.zone === `court:${treatyReceiver}` && item.giver === treatyGiver);
        const options = available.filter(type => type !== "trade" || (!alreadyHoldsTrade && !mint.some(entry => entry.giver === giver && entry.def === "trade-treaty")));
        const knowsTradeDiplomacy = world.items.some(item => item.def === "trade-diplomacy" && (item.zone === `court:${treatyGiver}` || item.zone === "board:public"));
        const disconnected = targets.find(target => target.player === to)?.connected === false;
        return <fieldset key={giver} className="kin-barter-side">
        <legend>{title}</legend>
        <select aria-label={title} value="" disabled={options.length === 0} onChange={event => {
          const type = event.target.value;
          if (options.includes(type)) setMint(list => type === "trade" && list.some(entry => entry.giver === giver && entry.def === "trade-treaty") ? list : [...list, { def: `${type}-treaty`, giver }]);
        }}>
          <option value="">{options.length ? "Add a treaty..." : "No treaties available"}</option>
          {options.map(type => <option key={type} value={type}>{treatyName(`${type}-treaty`)}</option>)}
        </select>
        {knowsTradeDiplomacy && disconnected && !options.includes("trade") && <p className="muted small">
          {giver === "from" ? "You cannot give a Trade Treaty" : `${names[to]} cannot give you a Trade Treaty`} because you are not connected. Connect your buildings, or connect either player's Harbor to the other player's tile building through rivers and ocean tiles.
        </p>}
        {mint.map((entry, index) => {
          if (entry.giver !== giver) return null;
          const def = cardDef(entry.def)!;
          const giverKin = world.kins.find(kin => kin.id === world.kinPicks[treatyGiver]);
          return (
          <div key={index} className="kin-barter-mint">
            <GameCard def={def} kins={world.kins} giver={giverKin ? kinColor(giverKin) : undefined} details={[`Given by ${names[treatyGiver]}`]} />
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
        ); })}
      </fieldset>;
      })}
      </div>
      <div className="kin-barter-answer">
        <button type="button" className="primary" disabled={!to} onClick={() => send({ type: "barter", kind: source.kind, card: source.id, to, give, take, mint: mint.map(clean) })}>Offer</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
