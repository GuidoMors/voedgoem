import { useState } from "react";
import type { KinBattle, KinBattleReport, KinBattleSide, KinDiceChoice, KinDiceKind, KinMoveSource } from "./types";

const DICE_NAMES: Record<KinDiceKind, string> = { strategic: "Strategic", aggressive: "Aggressive", ambush: "Ambush", defensive: "Defensive" };

// Divides the strength pool over the dice the player knows. Everything starts on the strategic dice.
function DiceChooser({ pool, kinds, value, onChange }: { pool: number; kinds: KinDiceKind[]; value: KinDiceChoice; onChange: (value: KinDiceChoice) => void }) {
  const total = kinds.reduce((sum, kind) => sum + (value[kind] ?? 0), 0);
  return (
    <div className="kin-payment-row">
      {kinds.map(kind => (
        <label key={kind} className="small">
          {DICE_NAMES[kind]}{" "}
          <input type="number" min={0} max={pool} value={value[kind] ?? 0} onChange={event => onChange({ ...value, [kind]: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} />
        </label>
      ))}
      <span className={`small ${total === pool ? "" : "kin-bad"}`}>{total} / {pool} dice</span>
    </div>
  );
}

const startDice = (pool: number): KinDiceChoice => ({ strategic: pool });

// The attacker chooses the dice after the general, the army and the target have been picked.
export function AttackPanel({ pool, kinds, onConfirm, onCancel }: { pool: number; kinds: KinDiceKind[]; onConfirm: (dice: KinDiceChoice) => void; onCancel: () => void }) {
  const [dice, setDice] = useState<KinDiceChoice>(startDice(pool));
  const total = kinds.reduce((sum, kind) => sum + (dice[kind] ?? 0), 0);
  return (
    <div className="kin-payment">
      <h3>Battle</h3>
      <p className="small">Your strength pool is {pool} (general and army). Choose the dice you roll.</p>
      <DiceChooser pool={pool} kinds={kinds} value={dice} onChange={setDice} />
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={total !== pool} onClick={() => onConfirm(dice)}>Attack</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// The defender may tap a Control character as their general, then chooses the dice.
export function DefendPanel({ battle, names, onConfirm }: { battle: KinBattle; names: Record<string, string>; onConfirm: (general: string | null, dice: KinDiceChoice) => void }) {
  const [general, setGeneral] = useState<KinMoveSource | null>(null);
  const pool = (general?.power ?? 0) + battle.base.army + battle.base.garrison;
  const [dice, setDice] = useState<KinDiceChoice>(startDice(pool));
  const choose = (next: KinMoveSource | null) => { setGeneral(next); setDice(startDice((next?.power ?? 0) + battle.base.army + battle.base.garrison)); };
  const total = battle.dice.reduce((sum, kind) => sum + (dice[kind] ?? 0), 0);
  return (
    <div className="kin-payment">
      <h3>{names[battle.attacker] ?? battle.attacker} attacks you!</h3>
      <p className="small">Your pool: army {battle.base.army} + garrison {battle.base.garrison}{general ? ` + general ${general.power}` : ""} = {pool}. Tap a Control character as your general to add its power; a general can be taken hostage.</p>
      <div className="kin-payment-buttons">
        <button type="button" className={general ? "" : "primary"} onClick={() => choose(null)}>No general</button>
        {battle.generals.map(source => (
          <button key={source.id} type="button" className={general?.id === source.id ? "primary" : ""} onClick={() => choose(source)}>{source.name} ({source.power})</button>
        ))}
      </div>
      {pool > 0 && <DiceChooser pool={pool} kinds={battle.dice} value={dice} onChange={setDice} />}
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={total !== pool} onClick={() => onConfirm(general?.id ?? null, dice)}>Defend</button>
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
