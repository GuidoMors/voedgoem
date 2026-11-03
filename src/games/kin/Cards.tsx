import type { CSSProperties, ReactNode } from "react";
import { ARCHETYPE_COLORS, archetypeBorder } from "./CharacterCard";
import { CARDS, type CardDef } from "./cards.data";
import { kinColor } from "./KinCard";
import { normalize } from "./rulebookParser";
import { book } from "./rulebookData";
import type { KinInfo, KinItem, KinWorld } from "./types";

export const cardDef = (id: string) => CARDS.find(card => card.id === id);

// Ruletext with [[links]] shown as underlined terms preceded by their glossary symbol.
export function RuleText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const icon = book.resolve(m[1].trim())?.icon ?? book.glossary.get(normalize(m[1]))?.icon;
      out.push(<span key={n++} className="kc-term">{icon && <span className="kc-icon">{icon}</span>}{(m[2] ?? m[1]).trim()}</span>);
    } else out.push(<strong key={n++}>{m[3]}</strong>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

const KIND_LABEL: Record<CardDef["kind"], string> = {
  action: "Action", event: "Event", technology: "Technology", blueprint: "Blueprint", faction: "Faction effect", treaty: "Treaty", ban: "Ban", activation: "Activation"
};

function Lines({ lines }: { lines: [string, string][] }) {
  return <dl className="kc-lines">{lines.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><RuleText text={value} /></dd></div>)}</dl>;
}

function Blueprint({ def }: { def: CardDef }) {
  const s = def.stats!;
  return (
    <>
      <h4>{def.name}</h4>
      <p className="kc-shape"><span>{s.shape}</span> <span>{s.icons.join(" ")}</span></p>
      <dl className="kc-lines">
        <div><dt>Cost</dt><dd><RuleText text={s.cost} /></dd></div>
        {s.buildPower !== null && <div><dt>Build power</dt><dd>{s.buildPower}</dd></div>}
        {s.garrison !== null && <div><dt>Garrison</dt><dd>⛨ {s.garrison}</dd></div>}
        {s.conditions && <div><dt>Conditions</dt><dd><RuleText text={s.conditions} /></dd></div>}
      </dl>
      {s.effects && <div className="kc-effects">{s.effects.split("\n").map((line, i) => <p key={i}><RuleText text={line.replace(/^-\s*/, "")} /></p>)}</div>}
    </>
  );
}

export interface CardPick {
  // Items that may be clicked, the one currently chosen and the click handler.
  ids: ReadonlySet<string>;
  chosen?: string | null;
  onPick: (id: string) => void;
  // Cards that cannot be clicked, with the reason shown on a grey pill.
  disabled?: Readonly<Record<string, string>>;
}

// One card, drawn in the template of its kind. `kins` colours treaties and faction effects; `giver` is the Kin colour of a treaty.
export function GameCard({ def, kins, giver, details, tapped, selectable, selected, disabledReason, onClick }: { def: CardDef; kins: KinInfo[]; giver?: string; details?: string[]; tapped?: boolean; selectable?: boolean; selected?: boolean; disabledReason?: string; onClick?: () => void }) {
  const kin = kins.find(k => k.id === def.kin);
  const style: CSSProperties = {};
  const kindClass = def.kind === "faction" && def.form && def.form !== "passive" ? def.form : def.kind;
  if (def.kind === "action") Object.assign(style, archetypeBorder([def.phase ?? "discovery"]));
  if (def.kind === "faction" && def.form === "action") Object.assign(style, archetypeBorder([def.phase ?? "discovery"]));
  if (def.kind === "activation") Object.assign(style, archetypeBorder([def.archetype ?? "universal"]));
  if (def.kind === "faction" && def.form === "passive" && kin) style.borderLeftColor = kinColor(kin);
  if (def.kind === "treaty" && giver) style.borderColor = giver;
  const classes = `kc kc-${kindClass} ${tapped ? "tapped" : ""} ${selectable ? "selectable" : ""} ${selected ? "chosen" : ""} ${disabledReason ? "unavailable" : ""}`;
  const behaviour = selectable ? { onClick, role: "button", tabIndex: 0 } : {};
  if (def.kind === "activation") {
    const archetype = def.archetype ?? "universal";
    return (
      <article className={`${classes} kc-${archetype}`} style={style} aria-label={def.name} {...behaviour}>
        <span className="kc-kind">Activation card</span>
        <h4>{archetype === "universal" ? "Universal" : archetype[0].toUpperCase() + archetype.slice(1)}</h4>
        <div className="kc-power-badge" title="Power"><span>⬥</span><strong>{def.power}</strong></div>
        <p className="kc-text">Tap to activate a {archetype === "universal" ? "card of any phase" : `${archetype} action card`}.</p>
        {tapped && <span className="kc-tapped-label">tapped</span>}
      </article>
    );
  }
  return (
    <article className={classes} style={style} aria-label={def.name} {...behaviour}>
      <span className="kc-kind">{KIND_LABEL[def.kind]}{def.kind === "faction" && kin ? ` · ${kin.name}` : ""}</span>
      {def.kind === "technology" && <p className="kc-gears">⚙ {def.gearCost}</p>}
      {def.kind === "blueprint" ? <Blueprint def={def} /> : (
        <>
          <h4>{def.name}</h4>
          {def.lines ? <Lines lines={def.lines} /> : <p className="kc-text"><RuleText text={def.text} /></p>}
        </>
      )}
      {details && details.length > 0 && <ul className="kc-details">{details.map(line => <li key={line}>{line}</li>)}</ul>}
      {def.kind === "action" && def.phase && <span className="kc-phase" style={{ background: ARCHETYPE_COLORS[def.phase] }}>{def.phase}</span>}
      {disabledReason && <span className="kc-disabled-pill" title={disabledReason} tabIndex={0}>Disabled</span>}
    </article>
  );
}


// Every card of a kind, for the "Card templates" gallery.
export function CardGallery({ kins }: { kins: KinInfo[] }) {
  const kinds: CardDef["kind"][] = ["technology", "event", "action", "blueprint", "faction", "treaty", "ban", "activation"];
  return (
    <div className="kc-gallery">
      {kinds.map(kind => (
        <section key={kind}>
          <h3>{KIND_LABEL[kind]} cards</h3>
          <div className="kc-row">{CARDS.filter(card => card.kind === kind).map(card => <GameCard key={card.id} def={card} kins={kins} giver={card.kind === "treaty" ? "#c9443a" : undefined} />)}</div>
        </section>
      ))}
    </div>
  );
}

// The cards of a player's court, without the characters.
export function CourtCards({ world, player, kinds, pick }: { world: KinWorld; player: string; kinds?: CardDef["kind"][]; pick?: CardPick }) {
  const items = world.items.filter(item => item.zone === `court:${player}` && (!kinds || kinds.includes(cardDef(item.def)?.kind as CardDef["kind"])));
  if (items.length === 0) return;
  return <div className="kc-row">{items.map(item => <ItemCard key={item.id} item={item} kins={world.kins} kinPicks={world.kinPicks} pick={pick} />)}</div>;
}

export function ItemCard({ item, kins, kinPicks, pick }: { item: KinItem; kins: KinInfo[]; kinPicks: Record<string, string>; pick?: CardPick }) {
  const def = cardDef(item.def);
  if (!def) return null;
  const kinOfGiver = (id: string) => kins.find(k => k.id === (id.startsWith("kin:") ? id.slice(4) : kinPicks[id]));
  const giverKin = item.giver ? kinOfGiver(item.giver) : undefined;
  const selectable = !!pick?.ids.has(item.id);
  const kinName = (player?: string) => kins.find(k => k.id === kinPicks[player ?? ""])?.name ?? "?";
  const details = [
    ...(giverKin ? [`Given by ${giverKin.name}`] : []),
    ...(item.duration !== undefined ? [`${item.duration} season${item.duration === 1 ? "" : "s"} left`] : []),
    ...(item.promise ? [`Promise: ${item.promise}`] : []),
    ...(item.arbiter ? [`Arbiter: ${kinName(item.arbiter)}`] : [])
  ];
  return <GameCard def={def} kins={kins} giver={giverKin ? kinColor(giverKin) : undefined} details={details} tapped={item.tapped} selectable={selectable} selected={pick?.chosen === item.id} disabledReason={pick?.disabled?.[item.id]} onClick={() => pick?.onPick(item.id)} />;
}
