import { useState } from "react";
import { NumberInput } from "./NumberInput";
import type { KinReaction, KinBattle, KinBattleReport, KinBattleSide, KinDiceChoice, KinDiceKind, KinMoveSource } from "./types";

const DICE_NAMES: Record<KinDiceKind, string> = { strategic: "Strategic", aggressive: "Aggressive", ambush: "Ambush", defensive: "Defensive" };

// Divides the strength pool over the dice the player knows. Everything starts on the strategic dice.
function DiceChooser({ pool, kinds, value, onChange }: { pool: number; kinds: KinDiceKind[]; value: KinDiceChoice; onChange: (value: KinDiceChoice) => void }) {
  const total = kinds.reduce((sum, kind) => sum + (value[kind] ?? 0), 0);
  return (
    <div className="kin-payment-row">
      {kinds.map(kind => (
        <span key={kind} className="small">
          {DICE_NAMES[kind]}{" "}
          <NumberInput aria-label={`${DICE_NAMES[kind]} dice`} min={0} max={pool} value={value[kind] ?? 0} onValueChange={amount => onChange({ ...value, [kind]: Math.max(0, Math.floor(Number(amount) || 0)) })} />
        </span>
      ))}
      <span className={`small ${total === pool ? "" : "kin-bad"}`}>{total} / {pool} dice</span>
    </div>
  );
}

const startDice = (pool: number): KinDiceChoice => ({ strategic: pool });

// Liangzhuge: an optional prediction of the hits against you; an exact guess blocks them all (1 influence).
function PredictInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <span className="small">
      Liangzhuge: predicted hits against you (1 influence)
      <NumberInput aria-label="Predicted hits against you" min={0} value={value} onValueChange={onChange} placeholder="none" />
    </span>
  );
}

// The attacker chooses the dice after the general, the army and the target have been picked.
export function AttackPanel({ pool, kinds, smite, predict, onConfirm, onCancel }: { pool: number; kinds: KinDiceKind[]; smite?: boolean; predict?: boolean; onConfirm: (dice: KinDiceChoice, smite: boolean, predict?: number) => void; onCancel: () => void }) {
  const [smiting, setSmiting] = useState(false);
  const [guess, setGuess] = useState("");
  const full = pool + (smiting ? 2 : 0);
  const [dice, setDice] = useState<KinDiceChoice>(startDice(pool));
  const toggle = (value: boolean) => { setSmiting(value); setDice(startDice(pool + (value ? 2 : 0))); };
  const total = kinds.reduce((sum, kind) => sum + (dice[kind] ?? 0), 0);
  return (
    <div className="kin-payment">
      <h3>Battle</h3>
      <p className="small">Your strength pool is {full} (general and army). Choose the dice you roll.</p>
      {smite && <button type="button" className={smiting ? "primary" : ""} onClick={() => toggle(!smiting)}>{smiting ? "Smiting (+2, costs 2 mana)" : "Smite: pay 2 mana for +2"}</button>}
      <DiceChooser pool={full} kinds={kinds} value={dice} onChange={setDice} />
      {predict && <PredictInput value={guess} onChange={setGuess} />}
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={total !== full} onClick={() => onConfirm(dice, smiting, predict && guess !== "" ? Number(guess) : undefined)}>Attack</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// One panel for every pending battle decision. Only the owner can answer; the dice rolled so far are shown to all.
export function ReactionPanel({ reaction, round, userId, names, onAnswer }: { reaction: KinReaction; round?: KinBattle["round"]; userId: string; names: Record<string, string>; onAnswer: (choices: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const mine = reaction.owner === userId;
  const toggle = (id: string) => setPicked(current => current.includes(id) ? current.filter(entry => entry !== id) : current.length < reaction.max ? [...current, id] : current);
  const side = (label: string, entry: KinBattleSide) => (
    <p className="small">{label}: <span className="kin-dice">{entry.dice.map((die, index) => <span key={index} className={`kin-die kin-die-${die.kind}`} title={DICE_NAMES[die.kind]}>{die.face}</span>)}</span> hits {entry.hits}, blocks {entry.blocks}, ambush {entry.ambush}</p>
  );
  return (
    <div className="kin-payment">
      <h3>{reaction.title}</h3>
      {round && <>{side("Attacker", round.report.attacker)}{side("Defender", round.report.defender)}</>}
      <p className="small">{reaction.text}</p>
      {mine ? (
        <>
          <div className="kin-payment-buttons">
            {reaction.options.map(option => <button key={option.id} type="button" className={picked.includes(option.id) ? "primary" : ""} onClick={() => toggle(option.id)}>{option.label}</button>)}
          </div>
          <div className="kin-payment-buttons">
            <button type="button" className="primary" disabled={picked.length < reaction.min || picked.length > reaction.max} onClick={() => { onAnswer(picked); setPicked([]); }}>{picked.length === 0 && reaction.min === 0 ? "Decline" : "Confirm"}</button>
          </div>
        </>
      ) : <p className="small">Waiting for {names[reaction.owner] ?? reaction.owner}…</p>}
    </div>
  );
}

// The defender may tap a Control character as their general, then chooses the dice. Znort's Cowardly lets them flee instead.
export function DefendPanel({ battle, names, onConfirm, onFlee }: { battle: KinBattle; names: Record<string, string>; onConfirm: (general: string | null, dice: KinDiceChoice, smite: boolean, predict?: number, plea?: boolean) => void; onFlee: (tile: number) => void }) {
  const [general, setGeneral] = useState<KinMoveSource | null>(null);
  const [pleading, setPleading] = useState(false);
  const [guess, setGuess] = useState("");
  const [smiting, setSmiting] = useState(false);
  const [fleeTile, setFleeTile] = useState<number | "">("");
  const poolFor = (source: KinMoveSource | null, smite: boolean) => (source?.power ?? 0) + (smite ? 2 : 0) + battle.base.army + battle.base.garrison;
  const pool = poolFor(general, smiting);
  const [dice, setDice] = useState<KinDiceChoice>(startDice(pool));
  const choose = (next: KinMoveSource | null, smite = false) => { setGeneral(next); setSmiting(smite); setDice(startDice(poolFor(next, smite))); };
  const canSmite = !!battle.smite && general?.id === "barendam";
  const total = battle.dice.reduce((sum, kind) => sum + (dice[kind] ?? 0), 0);
  const flee = battle.flee?.tiles ?? [];
  return (
    <div className="kin-payment">
      <h3>{names[battle.attacker] ?? battle.attacker} attacks you!</h3>
      <p className="small">Your pool: army {battle.base.army} + garrison {battle.base.garrison}{general ? ` + general ${general.power}` : ""}{smiting ? " + smite 2" : ""} = {pool}. Tap a Control character as your general to add its power; a general can be taken hostage.</p>
      <div className="kin-payment-buttons">
        <button type="button" className={general ? "" : "primary"} onClick={() => choose(null)}>No general</button>
        {battle.generals.map(source => (
          <button key={source.id} type="button" className={general?.id === source.id ? "primary" : ""} onClick={() => choose(source)}>{source.name} ({source.power})</button>
        ))}
      </div>
      {canSmite && <button type="button" className={smiting ? "primary" : ""} onClick={() => choose(general, !smiting)}>{smiting ? "Smiting (+2, costs 2 mana)" : "Smite: pay 2 mana for +2"}</button>}
      {pool > 0 && <DiceChooser pool={pool} kinds={battle.dice} value={dice} onChange={setDice} />}
      {battle.predict && general?.id === "liangzhuge" && <PredictInput value={guess} onChange={setGuess} />}
      {battle.plea && general?.id === "qumono" && <button type="button" className={pleading ? "primary" : ""} onClick={() => setPleading(!pleading)}>{pleading ? "Merciful Plea: the attacker must pay 2 gold or cancel (2 mana)" : "Merciful Plea: pay 2 mana to ask for 2 gold"}</button>}
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={total !== pool} onClick={() => onConfirm(general?.id ?? null, dice, smiting, general?.id === "liangzhuge" && guess !== "" ? Number(guess) : undefined, general?.id === "qumono" && pleading)}>Defend</button>
        {flee.length > 0 && (
          <>
            <select value={fleeTile} onChange={event => setFleeTile(event.target.value === "" ? "" : Number(event.target.value))} aria-label="Flee to">
              <option value="">Znort: flee to…</option>
              {flee.map(tile => <option key={tile} value={tile}>Tile {tile}</option>)}
            </select>
            <button type="button" disabled={fleeTile === ""} onClick={() => onFlee(fleeTile as number)}>Flee (taps Znort)</button>
          </>
        )}
      </div>
    </div>
  );
}

function Side({ label, side, names }: { label: string; side: KinBattleSide; names: Record<string, string> }) {
  const pool = side.pool;
  return (
    <div className="kin-battle-side">
      <h4>{label}: {names[side.player] ?? side.player}</h4>
      <p className="small">General: {side.general ?? "none"} ({pool.general}) · army {pool.army}{pool.garrison ? ` · garrison ${pool.garrison}` : ""}</p>
      <p className="kin-dice">{side.dice.map((die, index) => <span key={index} className={`kin-die kin-die-${die.kind}`} title={DICE_NAMES[die.kind]}>{die.face}</span>)}</p>
      <p className="small">✸ {side.hits} hits · ⛊ {side.blocks} blocks · 🌢 {side.selfHits} self hits · 🗡 {side.ambush} ambush</p>
      <p className="small"><strong>{side.unblocked}</strong> unblocked hit{side.unblocked === 1 ? "" : "s"} taken</p>
    </div>
  );
}

// The result of the last battle, visible to everybody until it is closed.
export function BattleReport({ report, names, characterNames, onClose }: { report: KinBattleReport; names: Record<string, string>; characterNames: Record<string, string>; onClose: () => void }) {
  return (
    <div className="kin-payment kin-battle-report">
      <h3>Battle result</h3>
      {report.immediate ? (
        <p className="small">{names[report.attacker.player]} destroyed an undefended building: no dice were needed.</p>
      ) : (
        <div className="kin-battle-sides">
          <Side label="Attacker" side={report.attacker} names={names} />
          <Side label="Defender" side={report.defender} names={names} />
        </div>
      )}
      <ul className="small">
        {report.disbanded.length > 0 && <li>Disbanded: {report.disbanded.join(", ")}</li>}
        {report.weakened.length > 0 && <li>Lost strength: {report.weakened.join(", ")}</li>}
        {report.destroyed && <li>Destroyed building: {report.destroyed}</li>}
        {report.hostages.map(id => <li key={id}>Hostage taken: {characterNames[id] ?? id}</li>)}
      </ul>
      <div className="kin-payment-buttons"><button type="button" onClick={onClose}>Close</button></div>
    </div>
  );
}
