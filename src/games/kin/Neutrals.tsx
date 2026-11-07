import { useState } from "react";
import { NumberInput } from "./NumberInput";
import { CHARACTERS } from "./characters.data";
import { CharacterCard } from "./CharacterCard";
import type { KinAbilityOption, KinInfo } from "./types";

const characterName = (id: string) => CHARACTERS.find(def => def.id === id)?.name ?? id;

const RESOURCES = ["gold", "lumber", "stone", "food"];

function CharacterChoice({ label, ids = [], value, onChange, kins }: { label: string; ids?: string[]; value: string; onChange: (id: string) => void; kins: KinInfo[] }) {
  return <section className="kin-character-choice" aria-label={label}>
    <h4>{label}</h4>
    <div className="kin-character-choices">{ids.map(id => {
      const def = CHARACTERS.find(character => character.id === id);
      return def ? <CharacterCard key={id} def={def} kins={kins} state="claimed" selectable selected={value === id} onPick={() => onChange(id)} />
        : <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{characterName(id)}</button>;
    })}</div>
  </section>;
}

// Abilities that need no choice are sent straight away when the ruletext is clicked.
export const DIRECT_ABILITIES = ["torke", "steen", "eyir", "prishna", "jaggengrog", "koroko", "carvano"];

// The choices for a tap ability of a neutral character in the player's own court. Using it taps the character and ends the turn.
export function AbilityForm({ option: raw, send, kins, names }: { option: KinAbilityOption; send: (action: Record<string, unknown>) => void; kins: KinInfo[]; names: Record<string, string> }) {
  // Birchawe: the form of the borrowed ability is shown instead of his own.
  const option = { ...raw, character: raw.ability ?? raw.character };
  const [resource, setResource] = useState("gold");
  const [target, setTarget] = useState("");
  const [leap, setLeap] = useState("");
  const [take, setTake] = useState("");
  const [give, setGive] = useState("");
  const [treaty, setTreaty] = useState("");
  const [duration, setDuration] = useState("3");
  const fire = (extra: Record<string, unknown> = {}) => send({ type: "ability", character: raw.character, ...extra });
  const [grow, setGrow] = useState("");
  const [march, setMarch] = useState("");
  const [untap, setUntap] = useState("");
  const [marchArmy, marchTile] = march.split(":");
  const [leapArmy, leapOver, leapTile] = leap.split(":");
  const leapChoice = option.leaps?.find(entry => entry.army === leapArmy && String(entry.over) === leapOver);
  return (
    <div className="kin-ability">
      {option.character === "anvatsio" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Player to receive gold">
            <option value="">Player…</option>
            {option.targets?.map(id => <option key={id} value={id}>{names[id] ?? id}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ target })}>Give 2 gold</button>
        </>
      )}
      {option.character === "sunumo" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Building to wash away">
            <option value="">Building…</option>
            {option.targets?.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ building: target })}>Tsunami (3 mana)</button>
        </>
      )}
      {option.character === "wimblewhisker" && (
        <>
          <select value={resource} onChange={event => setResource(event.target.value)} aria-label="Resource">{RESOURCES.map(res => <option key={res}>{res}</option>)}</select>
          <button type="button" onClick={() => fire({ resource })}>Use</button>
        </>
      )}
      {option.character === "arachonos" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Army to exhaust">
            <option value="">Army…</option>
            {option.targets?.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ army: target })}>Use</button>
        </>
      )}
      {option.character === "ethereal" && (
        <>
          <CharacterChoice label="Character to claim from the deck" ids={option.take} value={take} onChange={setTake} kins={kins} />
          <CharacterChoice label="Character to put into the deck" ids={option.give} value={give} onChange={setGive} kins={kins} />
          <button type="button" disabled={!take || !give} onClick={() => fire({ take, give })}>Foresight</button>
        </>
      )}
      {option.character === "beiliu" && (
        <>
          <CharacterChoice label="Hostage to convert" ids={option.hostages} value={target} onChange={setTarget} kins={kins} />
          <button type="button" disabled={!target} onClick={() => fire({ hostage: target })}>Convert (4 influence)</button>
        </>
      )}
      {option.character === "lumon" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Player">
            <option value="">Player…</option>
            {option.players?.map(entry => <option key={entry.player} value={entry.player}>{names[entry.player] ?? entry.player}</option>)}
          </select>
          <select value={treaty} onChange={event => setTreaty(event.target.value)} aria-label="Treaty">
            <option value="">Treaty…</option>
            {option.players?.find(entry => entry.player === target)?.types.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          {treaty === "peace" && <NumberInput min={1} max={10} value={duration} onValueChange={setDuration} aria-label="Rounds" />}
          <button type="button" disabled={!target || !treaty} onClick={() => fire({ player: target, treaty, ...(treaty === "peace" ? { duration: Number(duration) } : {}) })}>The White Wave (4 mana)</button>
        </>
      )}
      {option.character === "wololay" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Army to convert">
            <option value="">Army…</option>
            {option.converts?.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ army: target })}>Turn (2 mana)</button>
        </>
      )}
      {option.character === "horned-hoof" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Army to trample">
            <option value="">Army…</option>
            {option.trample?.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ army: target })}>Trample (1 mana)</button>
        </>
      )}
      {option.character === "dinker" && (
        <>
          <select value={take} onChange={event => setTake(event.target.value)} aria-label="Resource to pay">
            <option value="">Pay…</option>
            {option.trades?.map(res => <option key={res} value={res}>{res} → {{ food: "stone", stone: "gold", gold: "food" }[res]}</option>)}
          </select>
          <button type="button" disabled={!take} onClick={() => fire({ pay: take })}>Trade</button>
        </>
      )}
      {option.character === "grog-og-n-zog" && (
        <>
          <select value={grow} onChange={event => setGrow(event.target.value)} aria-label="On a 1: grow an army">
            <option value="">1: nothing</option>
            {option.grog?.grow.map(army => <option key={army} value={army}>1: grow {army}</option>)}
          </select>
          <select value={march} onChange={event => setMarch(event.target.value)} aria-label="On a 2: march an army">
            <option value="">2: nothing</option>
            {option.grog?.march.flatMap(entry => entry.tiles.map(tile => <option key={`${entry.army}:${tile}`} value={`${entry.army}:${tile}`}>2: {entry.army} to tile {tile}</option>))}
          </select>
          <select value={untap} onChange={event => setUntap(event.target.value)} aria-label="On a 3: untap a card">
            <option value="">3: nothing</option>
            {option.grog?.untap.map(id => <option key={id} value={id}>3: untap {characterName(id)}</option>)}
          </select>
          <button type="button" onClick={() => fire({ ...(grow ? { grow } : {}), ...(march ? { marchArmy, marchTile: Number(marchTile) } : {}), ...(untap ? { untap } : {}) })}>Roll the d3</button>
        </>
      )}
      {(option.character === "coppygen" || option.character === "nitrosium") && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Building">
            <option value="">Building…</option>
            {option.targets?.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ building: target })}>{option.character === "coppygen" ? "Ask permission" : "Sabotage (1 mana)"}</button>
        </>
      )}
      {option.character === "aurosphoros" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Army to fire on">
            <option value="">Army…</option>
            {option.targets?.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ army: target })}>Fire (2 mana)</button>
        </>
      )}
      {option.character === "daxgrim" && (
        <>
          <select value={target} onChange={event => { setTarget(event.target.value); setTake(""); }} aria-label="Army to take strength from">
            <option value="">Army to take from...</option>
            {option.transfers?.map(entry => <option key={entry.from} value={entry.from}>{entry.from}</option>)}
          </select>
          <select value={take} onChange={event => setTake(event.target.value)} aria-label="Your army that receives the strength">
            <option value="">Your army...</option>
            {option.transfers?.find(entry => entry.from === target)?.to.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target || !take} onClick={() => fire({ from: target, to: take })}>Arkenax (2 gold)</button>
        </>
      )}
      {option.character === "leavavel" && (
        <>
          <select value={resource} onChange={event => setResource(event.target.value)} aria-label="Resource to gain">
            {["gold", "stone", "food"].map(res => <option key={res} value={res}>{res}</option>)}
          </select>
          <NumberInput min={1} max={option.lumber ?? 1} value={duration} onValueChange={setDuration} aria-label="Lumber to convert" />
          <button type="button" onClick={() => fire({ to: resource, amount: Number(duration) })}>Overgrowth (2 mana)</button>
        </>
      )}
      {option.character === "maprassil" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Army on a forest">
            <option value="">Army on a forest…</option>
            {option.rejuvenate?.map(army => <option key={army} value={army}>{army}</option>)}
          </select>
          <button type="button" disabled={!target} onClick={() => fire({ army: target })}>Rejuvenation (2 mana)</button>
        </>
      )}
      {option.character === "birchawe" && (
        <>
          <CharacterChoice label="Character to borrow from" ids={option.borrow} value={target} onChange={setTarget} kins={kins} />
          <button type="button" disabled={!target} onClick={() => fire({ target })}>Nature’s Splendour (2 mana)</button>
        </>
      )}
      {option.character === "yewanna" && (
        <>
          <select value={leap} onChange={event => setLeap(event.target.value)} aria-label="Forest and tile to swap">
            <option value="">Forest and tile…</option>
            {option.forests?.flatMap(entry => entry.tiles.map(tile => <option key={`${entry.forest}:${tile}`} value={`${entry.forest}:${tile}`}>forest {entry.forest} with tile {tile}</option>))}
          </select>
          <button type="button" disabled={!leap} onClick={() => fire({ forest: Number(leap.split(":")[0]), tile: Number(leap.split(":")[1]) })}>Moving Forest (2 mana)</button>
        </>
      )}
      {option.character === "uhzrun" && (
        <>
          <NumberInput min={1} max={option.refine ?? 1} value={duration} onValueChange={setDuration} aria-label="Stone to turn into gold" />
          <button type="button" onClick={() => fire({ amount: Number(duration) })}>Refine stone into gold</button>
        </>
      )}
      {option.character === "sha-shi-oq" && (
        <>
          <select value={target} onChange={event => setTarget(event.target.value)} aria-label="Village or city to rededicate">
            <option value="">Village or city…</option>
            {option.dedicate?.map(entry => <option key={entry.building} value={entry.building}>{entry.building} ({entry.current})</option>)}
          </select>
          <select value={resource} onChange={event => setResource(event.target.value)} aria-label="New dedication">{RESOURCES.map(res => <option key={res}>{res}</option>)}</select>
          <button type="button" disabled={!target} onClick={() => fire({ building: target, resource })}>Change dedication (1 mana)</button>
        </>
      )}
      {option.character === "ogilgalog" && (
        <>
          <select value={march} onChange={event => setMarch(event.target.value)} aria-label="Army and destination">
            <option value="">Army and destination…</option>
            {option.shadow?.flatMap(entry => entry.tiles.map(tile => <option key={`${entry.army}:${tile}`} value={`${entry.army}:${tile}`}>{entry.army} to tile {tile}</option>))}
          </select>
          <button type="button" disabled={!march} onClick={() => fire({ army: marchArmy, tile: Number(marchTile) })}>Shadowmeld</button>
        </>
      )}
      {option.character === "sneachy" && (
        <>
          <select value={leap} onChange={event => setLeap(event.target.value)} aria-label="Leap">
            <option value="">Army and tile…</option>
            {option.leaps?.flatMap(entry => entry.tiles.map(tile => <option key={`${entry.army}:${entry.over}:${tile}`} value={`${entry.army}:${entry.over}:${tile}`}>{entry.army} over tile {entry.over} to tile {tile}</option>))}
          </select>
          <button type="button" disabled={!leapChoice} onClick={() => fire({ army: leapArmy, over: Number(leapOver), tile: Number(leapTile) })}>Leap</button>
        </>
      )}
    </div>
  );
}
