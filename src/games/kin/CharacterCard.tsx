import type { CSSProperties } from "react";
import type { Archetype, CharacterDef } from "./characters.data";
import { kinColor } from "./KinCard";
import type { KinInfo } from "./types";

export const ARCHETYPE_COLORS: Record<Archetype | "event", string> = {
  discovery: "#2f7de1", expansion: "#e8c020", control: "#d6342c", universal: "#888", event: "#8a4fc0"
};

// Single archetype: all sides. Two archetypes: first on top and left, second on bottom and right.
// Universal: left discovery blue, bottom expansion yellow, right control red, top event purple.
export function archetypeBorder(archetypes: Archetype[]): CSSProperties {
  const c = ARCHETYPE_COLORS;
  if (archetypes.includes("universal")) return { borderColor: `${c.event} ${c.control} ${c.expansion} ${c.discovery}` };
  const [a, b = a] = archetypes;
  return { borderColor: `${c[a]} ${c[b]} ${c[b]} ${c[a]}` };
}

const NEUTRAL = "#efe4c8";
const LABEL: Record<Archetype, string> = { discovery: "Discovery", expansion: "Expansion", control: "Control", universal: "Universal" };

export function CharacterCard({ def, kins, owner, state, onPick, tapped, selectable, selected }: {
  def: CharacterDef;
  kins: KinInfo[];
  owner?: string;
  // "eligible" can be claimed, "ineligible" is greyed out, "claimed" belongs to a player.
  state: "eligible" | "ineligible" | "claimed";
  onPick?: () => void;
  tapped?: boolean;
  // Can be tapped for the action being activated; `onPick` is then called on click.
  selectable?: boolean;
  selected?: boolean;
}) {
  const kin = kins.find(k => k.id === def.kin);
  const neutral = !kin;
  const style = { ...archetypeBorder(def.archetypes), background: kin ? kinColor(kin) : NEUTRAL } as CSSProperties;
  const behaviour = selectable ? { onClick: onPick, role: "button", tabIndex: 0 } : {};
  return (
    <article className={`char-card ${state} ${neutral ? "neutral" : ""} ${tapped ? "tapped" : ""} ${selectable ? "selectable" : ""} ${selected ? "chosen" : ""}`} style={style} aria-label={def.name} {...behaviour}>
      <header>
        <h3>{def.name}</h3>
        <span className="char-power" title="Power">{def.power}</span>
      </header>
      <p className="char-title">{def.title}</p>
      <div className="char-ability">
        {def.abilities.length === 0 && <p className="char-none">No ability</p>}
        {def.abilities.map(ability => (
          <p key={ability.name}><span className="char-icon" title={ability.kind === "tap" ? "Tap ability" : "Passive ability"}>{ability.icon}</span> <strong>{ability.name}</strong> {ability.text}</p>
        ))}
      </div>
      <footer>
        <span className="char-tags">{def.archetypes.map(a => LABEL[a]).join(" · ")}{kin ? ` · ${kin.name}` : " · Neutral"}</span>
        {owner ? <span className="pill">{owner}</span> : state === "eligible" && onPick && <button type="button" onClick={onPick}>Claim</button>}
      </footer>
      {tapped && <span className="kc-tapped-label">tapped</span>}
    </article>
  );
}
