import { useState, type ReactNode } from "react";
import { RuleText } from "./Cards";
import { NumberInput } from "./NumberInput";
import type { KinMoveSource } from "./types";

const BASIC = ["gold", "lumber", "stone", "food"];

interface PanelProps {
  title: string;
  // Required activation power.
  power: number;
  powerLabel?: string;
  // The activation source already committed to the action and the other sources that can add power.
  picked: KinMoveSource;
  sources: KinMoveSource[];
  // Building cost: basic resources to choose, the fixed resources, and what the player has.
  basic?: number;
  fixed?: Record<string, number>;
  stock?: Record<string, number>;
  canConfirm?: boolean;
  children?: ReactNode;
  onConfirm: (extra: { kind: string; id: string }[], basic: Record<string, number>) => void;
  onCancel: () => void;
}

// Pays an action's remaining activation power, plus any required basic resources.
export function PaymentPanel({ title, power, powerLabel = "Build power", picked, sources, basic = 0, fixed = {}, stock = {}, canConfirm = true, children, onConfirm, onCancel }: PanelProps) {
  const [extra, setExtra] = useState<string[]>([]);
  const [paid, setPaid] = useState<Record<string, number>>({});
  const key = (source: KinMoveSource) => `${source.kind}:${source.id}`;
  const others = sources.filter(source => key(source) !== key(picked));
  const chosen = [picked, ...others.filter(source => extra.includes(key(source)))];
  const total = chosen.reduce((sum, source) => sum + source.power, 0);
  const overpaid = chosen.slice(1).some(source => total - source.power >= power);
  const basicTotal = BASIC.reduce((sum, resource) => sum + (paid[resource] ?? 0), 0);
  const spare = (resource: string) => (stock[resource] ?? 0) - (fixed[resource] ?? 0);
  const basicOk = basic === basicTotal && BASIC.every(resource => (paid[resource] ?? 0) <= spare(resource));
  const ready = total >= power && !overpaid && basicOk;
  return (
    <section className="kin-payment kin-build-payment" aria-label={title}>
      <h3>{title}</h3>
      <p>{powerLabel}: <strong>{total}</strong> / {power}{overpaid ? " (more cards than needed)" : ""}</p>
      {children}
      <div className="kin-payment-cards">
        <span className="kin-pay-card tapped">{picked.name} ({picked.power})</span>
        {others.map(source => (
          <label key={key(source)} className="kin-pay-card">
            <input type="checkbox" checked={extra.includes(key(source))} onChange={event => setExtra(list => event.target.checked ? [...list, key(source)] : list.filter(entry => entry !== key(source)))} />
            {source.name} ({source.power})
          </label>
        ))}
      </div>
      {basic > 0 && (
        <div className="kin-payment-basic">
          <p>Pay {basic} basic resources: <strong>{basicTotal}</strong> / {basic}</p>
          {BASIC.map(resource => (
            <div className="kin-payment-resource" key={resource}>
              <RuleText text={`[[${resource}]]`} />
              <span className="kin-payment-available" aria-label={`(${resource})`}>{Math.max(0, spare(resource))} available</span>
              <NumberInput aria-label={`Pay ${resource}`} min={0} max={Math.max(0, spare(resource))} value={paid[resource] ?? 0} onValueChange={value => setPaid(current => ({ ...current, [resource]: Math.max(0, Number(value) || 0) }))} />
            </div>
          ))}
        </div>
      )}
      <div className="kin-payment-buttons">
        <button type="button" className="primary" disabled={!ready || !canConfirm} onClick={() => onConfirm(others.filter(source => extra.includes(key(source))).map(source => ({ kind: source.kind, id: source.id })), Object.fromEntries(Object.entries(paid).filter(([, amount]) => amount > 0)))}>Confirm</button>
        <button type="button" onClick={onCancel}>Back</button>
      </div>
    </section>
  );
}
