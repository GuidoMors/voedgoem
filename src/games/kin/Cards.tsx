import type { CSSProperties, ReactNode } from "react";
import { ARCHETYPE_COLORS } from "./CharacterCard";
import { CARDS, type CardDef } from "./cards.data";
import { kinColor } from "./KinCard";
import { normalize } from "./rulebookParser";
import { book } from "./rulebookData";
import type { KinInfo, KinItem, KinWorld } from "./types";

export const cardDef = (id: string) => CARDS.find(card => card.id === id);
export const TECHNOLOGY_COLORS = {
  Construction: "#b5a15e",
  Science: "#898b90",
  Combat: "#b37373",
  Active: "#bd8fa9",
  Movement: "#7596b5",
  Diplomacy: "#7d9d7b",
  Steampower: "#353535"
};
export const technologyCategory = (def: CardDef) => def.kind === "technology"
  ? (Object.keys(TECHNOLOGY_COLORS) as (keyof typeof TECHNOLOGY_COLORS)[]).find(category => def.name.split(" ").includes(category) || (category === "Combat" && def.id === "greater-army-strength"))
  : undefined;

// Ruletext with [[links]] shown as red links preceded by their glossary symbol; clicking one opens its rulebook page.
export const RULEBOOK_EVENT = "kin-rulebook";
export interface RulebookJump { doc: string; id: string; n?: number }
// Glossary colour class -> display colour of a resource icon.
export const RESOURCE_COLORS: Record<string, string> = {
  gold: "#d4a017", lum: "#8b5a2b", stone: "#7d8590", food: "#3f9b3f", gear: "#5b6b7a", mana: "#2f7de1",
  rel: "#a35bd6", teal: "#16a39a", brown: "#8b5a2b", yellow: "#e8c547", blue: "#2f5fc4", purple: "#8a4fc0", red: "#d6342c",
  "tile-ocean": "#2a9d9f", "tile-mountain": "#5a5a5e", "tile-forest": "#3f9d4b", "tile-farmland": "#e3c540",
  "tile-snow": "#f7f9fb", "tile-desert": "#ead9b0", "tile-plains": "#a9d67c", basic: "#000"
};

// Basic resource: four dots, one in each colour of gold, lumber, stone and food.
const BASIC_DOTS = ["gold", "lum", "stone", "food"];

// A resource written as [[gold]] shows just its coloured icon, with the name on hover.
export function ResourceIcon({ icon, color, name }: { icon: string; color: string; name: string }) {
  const label = name[0].toUpperCase() + name.slice(1);
  if (color === "basic") {
    return <span className="res-icon res-basic" title={label} aria-label={label} role="img">{BASIC_DOTS.map(c => <i key={c} style={{ background: RESOURCE_COLORS[c] }} />)}</span>;
  }
  return <span className={`res-icon ${color.startsWith("tile-") ? "tile-icon" : ""}`} style={{ color: RESOURCE_COLORS[color] }} title={label} aria-label={label} role="img">{icon}</span>;
}

const SPECIAL_WORDS = /\b(influence|authority|virtue|tradegoods?)\b/gi;
const COST_RESOURCES = /\b(basic resources?|gold|lumber|stone|food|gear|mana|relics?|influence|authority|virtue|tradegoods?)\b/gi;

// Costs and Kin-specific resources also support resource names without [[ ]].
function pushPlain(out: ReactNode[], text: string, next: () => number, resources: boolean) {
  let last = 0;
  for (const m of text.matchAll(resources ? COST_RESOURCES : SPECIAL_WORDS)) {
    const word = m[1].toLowerCase();
    const key = word.startsWith("tradegood") ? "tradegoods" : word === "authority" ? "influence" : word;
    const g = book.resolve(key) ?? book.glossary.get(normalize(key));
    if (!g?.icon || !g.color || !RESOURCE_COLORS[g.color]) continue;
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(<ResourceIcon key={next()} icon={g.icon} color={g.color} name={m[1]} />);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
}

export function RuleText({ text, resources = false }: { text: string; resources?: boolean }) {
  const out: ReactNode[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*/g;
  let last = 0;
  let n = 0;
  const next = () => n++;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) pushPlain(out, text.slice(last, m.index), next, resources);
    if (m[1] !== undefined) {
      const target = book.resolve(m[1].trim());
      const icon = target?.icon ?? book.glossary.get(normalize(m[1]))?.icon;
      const color = target?.color ?? book.glossary.get(normalize(m[1]))?.color;
      if (icon && color && RESOURCE_COLORS[color] && normalize(m[1]) !== "warp") {
        out.push(<ResourceIcon key={n++} icon={icon} color={color} name={m[1].trim()} />);
        last = m.index! + m[0].length;
        if (/^s(?![A-Za-z])/.test(text.slice(last))) last++;
        continue;
      }
      const label =  <>{icon && <span className={`kc-icon${target?.building ? " kin-building-icon" : ""}`}>{icon}</span>}{(m[2] ?? m[1]).trim()}</>;
      out.push(target
        ? <a key={n++} className="kc-term kc-link" href={`#${target.id}`} onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          window.dispatchEvent(new CustomEvent<RulebookJump>(RULEBOOK_EVENT, { detail: { doc: target.doc, id: target.id } }));
        }}>{label}</a>
        : <span key={n++} className="kc-term">{label}</span>);
    } else out.push(<strong key={n++}>{m[3]}</strong>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) pushPlain(out, text.slice(last), next, resources);
  return <>{out}</>;
}

const KIND_LABEL: Record<CardDef["kind"], string> = {
  action: "Action", event: "Event", technology: "Technology", blueprint: "Blueprint", faction: "Effect", treaty: "Treaty", ban: "Ban", activation: "Activation"
};

function Lines({ lines }: { lines: [string, string][] }) {
  return <dl className="kc-lines">{lines.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><RuleText text={value} /></dd></div>)}</dl>;
}

function Blueprint({ def }: { def: CardDef }) {
  const s = def.stats!;
  return (
    <>
      <div className="kc-header">
        <span className="kc-shape">{s.shape}</span><h4>{def.name}</h4><span className="kc-icons">{s.icons.join(" ")}</span>
      </div>
      {s.effects && <div className="kc-effects">{s.effects.split("\n").map((line, i) => <p key={i}><RuleText text={line.replace(/^-\s*/, "")} /></p>)}</div>}
      <dl className="kc-lines">
        <div><dt>Cost</dt><dd><RuleText text={s.cost} resources /></dd></div>
        {s.buildPower !== null && <div><dt>Build power</dt><dd>{s.buildPower}</dd></div>}
        {s.garrison !== null && <div><dt>Garrison</dt><dd>⛨ {s.garrison}</dd></div>}
        {s.conditions && <div><dt>Conditions</dt><dd><RuleText text={s.conditions} /></dd></div>}
      </dl>
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

// Card text; lines that start with "- " are a smaller list under the paragraph.
export function CardText({ text }: { text: string }) {
  const rows = text.split("\n");
  const first = rows.findIndex(row => row.startsWith("- "));
  if (first < 0) return <p className="kc-text"><RuleText text={text} /></p>;
  return (
    <>
      {first > 0 && <p className="kc-text"><RuleText text={rows.slice(0, first).join("\n")} /></p>}
      <ul className="kc-list">{rows.slice(first).map((row, i) => <li key={i}><RuleText text={row.replace(/^- /, "")} /></li>)}</ul>
    </>
  );
}

// One card, drawn in the template of its kind. `kins` colours treaties and faction effects; `giver` is the Kin colour of a treaty.
export function GameCard({ def, kins, giver, details, tapped, selectable, selected, disabledReason, onClick }: { def: CardDef; kins: KinInfo[]; giver?: string; details?: string[]; tapped?: boolean; selectable?: boolean; selected?: boolean; disabledReason?: string; onClick?: () => void }) {
  const kin = kins.find(k => k.id === def.kin);
  const style: CSSProperties = {};
  const category = technologyCategory(def);
  if (category) style.borderColor = TECHNOLOGY_COLORS[category];
  // Faction action and event cards look like ordinary ones, with a pill naming the Kin.
  const playForm = def.kind === "faction" && (def.form === "action" || def.form === "event") ? def.form : null;
  const kindClass = playForm ?? def.kind;
  // Action-type cards take their archetype as a class (discovery, expansion, control or universal); the CSS draws the border and background.
  const archetypeClass = def.kind === "action" || (def.kind === "faction" && def.form === "action") ? (def.phase ?? "discovery")
    : def.kind === "activation" ? (def.archetype ?? "universal") : "";
  if (def.kind === "faction" && !playForm && kin) { style.borderColor = kinColor(kin); style.background = `color-mix(in srgb, ${kinColor(kin)} 12%, #f4ead2)`; }
  if (def.kind === "treaty" && giver) style.borderColor = giver;
  const classes = `kc kc-${kindClass} ${archetypeClass} ${def.kind === "faction" && def.core ? "core" : ""} ${tapped ? "tapped" : ""} ${selectable ? "selectable" : ""} ${selected ? "chosen" : ""} ${disabledReason ? "unavailable" : ""} ${def.notes?.length ? "has-info" : ""}`;
  const info = def.notes && def.notes.length > 0 && (
    <span className="kc-info" tabIndex={0} aria-label="Card information" onClick={event => event.stopPropagation()}>ⓘ
      <span className="kc-info-tip" role="tooltip">{def.notes.map((note, i) => <span key={i}><RuleText text={note} /></span>)}</span>
    </span>
  );
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
      <span className="kc-kind">{playForm ? KIND_LABEL[playForm] : KIND_LABEL[def.kind]}{def.kind === "faction" && def.core && <> · <strong>Core</strong></>}{def.kind === "faction" && kin && !playForm ? ` · ${kin.name}` : ""}</span>
      {info}
      {def.kind === "technology" && <p className="kc-gears">⚙ {def.gearCost}</p>}
      {def.kind === "blueprint" ? <Blueprint def={def} /> : (
        <>
          <h4>{def.name}</h4>
          {(def.kind === "action" || playForm === "action") && def.phase && <span className="kc-phase" style={{ background: ARCHETYPE_COLORS[def.phase] }}>{def.phase}</span>}
          {playForm && kin && <span className="kc-phase kc-kin-pill" style={{ background: kinColor(kin), color: ["pink", "light blue", "yellow", "grey"].includes(kin.color.toLowerCase()) ? "#221a10" : "#fff" }}>{kin.name}</span>}
          {def.lines ? <Lines lines={def.lines} /> : <CardText text={def.text} />}
        </>
      )}
      {details && details.length > 0 && <ul className="kc-details">{details.map(line => <li key={line}>{line}</li>)}</ul>}
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
