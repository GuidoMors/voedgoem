import { useState } from "react";
import type { KinFound } from "./types";

const BASIC = ["gold", "lumber", "stone", "food"];

// Reclaim: every treasure block gives 3 basic resources of your choice.
export function ReclaimPanel({ treasure, relic, onConfirm, onCancel }: { treasure: number; relic: number; onConfirm: (basic: Record<string, number>) => void; onCancel: () => void }) {
  const [basic, setBasic] = useState<Record<string, number>>({});
  const needed = treasure * 3;
  const total = BASIC.reduce((sum, resource) => sum + (basic[resource] ?? 0), 0);
  return (
    <div className="kin-payment">
      <h3>Reclaim</h3>
      <p className="small">You gain {relic} relic{relic === 1 ? "" : "s"} and {needed} basic resources of your choice.</p>
      <div className="kin-payment-row">
        {BASIC.map(resource => (
          <label key={resource} className="small">
            {resource}{" "}
            <input type="number" min={0} max={needed} value={basic[resource] ?? 0} onChange={event => setBasic({ ...basic, [resource]: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} />
          </label>
        ))}
        <span className={`small ${total === needed ? "" : "kin-bad"}`}>{total} / {needed}</span>
      </div>
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={total !== needed} onClick={() => onConfirm(basic)}>Reclaim</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function FoundBanner({ found, name, onClose }: { found: KinFound; name: string; onClose: () => void }) {
  const text = found.result === "warp" ? "a warp: 2 mana" : found.result === "treasure" ? "a treasure block" : "a relic block";
  return (
    <div className="kin-victory-banner" role="status">
      <p>{name} explored the ruins and {found.roll === 0 ? "chose" : `rolled a ${found.roll}:`} it was {text}.</p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}
