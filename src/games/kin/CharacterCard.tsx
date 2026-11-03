import type { CSSProperties } from "react";
import { CHARACTERS, type Archetype, type CharacterDef } from "./characters.data";
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

export function CharacterCard({ def, kins, owner, state, onPick, tapped, selectable, selected, ability, borrowedAbility }: {
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
  // The tap ability can be clicked when `reason` is null; otherwise a disabled pill explains why not.
  ability?: { reason: string | null; open: boolean; onUse: () => void };
  borrowedAbility?: string;
}) {
  const kin = kins.find(k => k.id === def.kin);
  const neutral = !kin;
  const borrowed = borrowedAbility ? CHARACTERS.find(character => character.id === borrowedAbility) : undefined;
  const abilities = borrowed?.abilities ?? def.abilities;
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
        {abilities.length === 0 && <p className="char-none">No ability</p>}
        {abilities.map(item => {
          const usable = item.kind === "tap" && ability;
          const body = <><span className="char-icon" title={item.kind === "tap" ? "Tap ability" : "Passive ability"}>{item.icon}</span> {borrowed && <strong>Borrowed from {borrowed.name}: </strong>}<strong>{item.name}</strong> {item.text}</>;
          return usable ? (
            <p key={item.name} className={`char-use ${ability.reason ? "disabled" : ""}`}>
              {ability.reason
                ? <>{body} <span className="kc-disabled-pill" title={ability.reason} tabIndex={0}>Disabled</span></>
                : <button type="button" className={`char-use-button ${ability.open ? "chosen" : ""}`} onClick={event => { event.stopPropagation(); ability.onUse(); }}>{body}</button>}
            </p>
          ) : <p key={item.name}>{body}</p>;
        })}
      </div>
      <footer>
        <span className="char-tags">{def.archetypes.map(a => LABEL[a]).join(" · ")}{kin ? ` · ${kin.name}` : " · Neutral"}</span>
        {owner ? <span className="pill">{owner}</span> : state === "eligible" && onPick && <button type="button" onClick={onPick}>Claim</button>}
      </footer>
      {tapped && <span className="kc-tapped-label">tapped</span>}
    </article>
  );
}
