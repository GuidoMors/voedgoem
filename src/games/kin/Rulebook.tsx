import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { normalize, slugify, type Block, type Doc, type Rulebook as Book } from "./rulebookParser";
import { book } from "./rulebookData";
import { GameCard, RESOURCE_COLORS, ResourceIcon, RuleText } from "./Cards";
import { CharacterCard } from "./CharacterCard";
import { kinColor } from "./KinCard";
import { CHARACTERS } from "./characters.data";
import { cardById, type CardDef } from "./cards.data";
import type { KinInfo } from "./types";

interface Pos {
  doc: string;
  id?: string;
}

function inline(text: string, go: (doc: string, id: string) => void, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1] !== undefined) {
      const label = (m[2] ?? m[1]).trim();
      const t = book.resolve(m[1].trim());
      const icon = t?.icon ?? book.glossary.get(normalize(m[1]))?.icon;
      const color = t?.color ?? book.glossary.get(normalize(m[1]))?.color;
      if (icon && color && RESOURCE_COLORS[color] && normalize(m[1]) !== "warp") {
        out.push(<ResourceIcon key={k} icon={icon} color={color} name={m[1].trim()} />);
        last = m.index! + m[0].length;
        // "[[gear]]s" is just the icon
        if (/^s(?![A-Za-z])/.test(text.slice(last))) last++;
        continue;
      }
      out.push(t
        ? <a key={k} className={`rb-link ${t.color ?? ""}`} href={`#${t.id}`} onClick={e => { e.preventDefault(); go(t.doc, t.id); }}>{icon && <span className={`rb-icon${t.building ? " kin-building-icon" : ""}`}>{icon}</span>}{label}</a>
        : <span key={k} className="rb-link dead">{label}</span>);
    } else if (m[3] !== undefined) out.push(<strong key={k}>{inline(m[3], go, k)}</strong>);
    else if (m[4] !== undefined) out.push(<code key={k}>{m[4]}</code>);
    else out.push(<em key={k}>{inline(m[5], go, k)}</em>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Heading({ b, go }: { b: Extract<Block, { t: "h" }>; go: (d: string, i: string) => void }) {
  const [name] = b.text.split("|").map(s => s.trim());
  const icon = book.resolve(name)?.icon ?? book.glossary.get(normalize(name))?.icon;
  const level = b.id.startsWith("glossary--") && b.level === 2 ? 3 : b.level;
  const Tag = `h${Math.min(level + 1, 6)}` as "h2";
 return (
  <Tag
    id={b.id}
    className={`rb-h rb-h${level}`}
  >
    {icon && (
      <span className={`rb-icon${book.resolve(name)?.building ? " kin-building-icon" : ""}`}>
        {icon}
      </span>
    )}

    {inline(name, go, b.id)}

    {b.notes && b.notes.length > 0 && (
      <span
        className="rb-info"
        tabIndex={0}
        aria-label="Notes"
      >
        ⓘ

        <span
          className="rb-info-tip"
          role="tooltip"
        >
          {b.notes.map((n, i) => (
            <span key={i}>
              {inline(n, go, `${b.id}n${i}`)}
            </span>
          ))}
        </span>
      </span>
    )}
  </Tag>
);
}

function BlockView({ b, go, k, head }: { b: Block; go: (d: string, i: string) => void; k: string; head?: Extract<Block, { t: "h" }> }) {
  switch (b.t) {
    case "h": return <Heading b={b} go={go} />;
    case "p": return <p>{inline(b.text, go, k)}</p>;
    case "ul": return <ul>{b.items.map((t, i) => <li key={i}>{inline(t, go, `${k}${i}`)}</li>)}</ul>;
    case "ol": return <ol>{b.items.map((t, i) => <li key={i}>{inline(t, go, `${k}${i}`)}</li>)}</ol>;
    case "quote": return (
      <div className={`rb-rule ${head ? "rb-card" : ""}`}>
        {head && <Heading b={head} go={go} />}
        {b.lines.map((l, i) => {
          // A line that began with ">>" is a side note: italic and a bit smaller.
          if (l.startsWith(">")) return <div key={i} className="rb-note">{inline(l.replace(/^>\s?/, ""), go, `${k}${i}`)}</div>;
          const m = /^(\*\*)?([A-Z][A-Za-z ]{1,24}):(\*\*)?\s*(.*)$/.exec(l);
          return m
            ? <div key={i} className="rb-field"><span className="rb-key">{m[2]}</span><span>{inline(m[4], go, `${k}${i}`)}</span></div>
            : <div key={i} className="rb-field rb-plain">{inline(l, go, `${k}${i}`)}</div>;
        })}
      </div>
    );
    case "table": return (
      <details className="rb-table"><summary>Table: {b.rows[0].join(" · ")}</summary><table>
        <thead><tr>{b.rows[0].map((c, i) => <th key={i}>{inline(c, go, `${k}h${i}`)}</th>)}</tr></thead>
        <tbody>{b.rows.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, i) => <td key={i}>{inline(c, go, `${k}${ri}-${i}`)}</td>)}</tr>)}</tbody>
      </table></details>
    );
  }
}

// The Kin a faction card belongs to, read from its rulebook file, so the card shows the Kin name and colour.
function kinsOf(doc: Doc, def: CardDef): KinInfo[] {
  const color = doc.blocks.map(b => b.t === "p" ? /^Color:\s*(.+)$/i.exec(b.text)?.[1].trim() : undefined).find(Boolean);
  return def.kin && color ? [{ id: def.kin, name: doc.title, color }] : [];
}

interface TabNode {
  doc: Doc;
  depth: number;
  children: TabNode[];
}

// File names start with numbers: "11-0-chapters" is a tab that owns "11-1-…", and "11-2-0-…" is a tab inside it that owns "11-2-1-…".
function fileNumbers(file: string): number[] {
  const nums: number[] = [];
  for (const part of file.replace(/\.md$/, "").split("-")) {
    if (!/^\d+$/.test(part)) break;
    nums.push(Number(part));
  }
  return nums;
}

function buildTabs(docs: Doc[]): TabNode[] {
  const nodes = docs.map(doc => ({ doc, nums: fileNumbers(doc.file), node: { doc, depth: 0, children: [] as TabNode[] } }));
  const heads = new Map<string, TabNode>();
  for (const item of nodes) {
    if (item.nums.length > 1 && item.nums[item.nums.length - 1] === 0) heads.set(item.nums.slice(0, -1).join("-"), item.node);
  }
  const roots: TabNode[] = [];
  const compare = (a: typeof nodes[number], b: typeof nodes[number]) => {
    for (let i = 0; i < Math.max(a.nums.length, b.nums.length); i++) {
      const diff = (a.nums[i] ?? -1) - (b.nums[i] ?? -1);
      if (diff) return diff;
    }
    return 0;
  };
  for (const item of [...nodes].sort(compare)) {
    const isHead = item.nums.length > 1 && item.nums[item.nums.length - 1] === 0;
    const parent = heads.get(item.nums.slice(0, isHead ? -2 : -1).join("-"));
    if (parent && parent !== item.node && item.nums.length > 1) parent.children.push(item.node);
    else roots.push(item.node);
  }
  // Keep the original order for top-level tabs, where the files do not nest.
  roots.sort((a, b) => docs.indexOf(a.doc) - docs.indexOf(b.doc));
  const setDepth = (list: TabNode[], depth: number) => list.forEach(n => { n.depth = depth; setDepth(n.children, depth + 1); });
  setDepth(roots, 0);
  return roots;
}

const ancestorsOf = (tree: TabNode[], slug: string, trail: string[] = []): string[] | null => {
  for (const node of tree) {
    if (node.doc.slug === slug) return trail;
    const found = ancestorsOf(node.children, slug, [...trail, node.doc.slug]);
    if (found) return found;
  }
  return null;
};

export function RulebookView({ book: b = book, jump }: { book?: Book; jump?: { doc: string; id: string; n?: number } }) {
  const docs: Doc[] = b.docs;
  const [pos, setPos] = useState<Pos>(jump ? { doc: jump.doc, id: jump.id } : { doc: docs[0]?.slug ?? "" });
  const [history, setHistory] = useState<Pos[]>([]);
  const body = useRef<HTMLDivElement>(null);
  const doc = docs.find(d => d.slug === pos.doc) ?? docs[0];
  const tree = useMemo(() => buildTabs(docs), [docs]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (slug: string) => setOpen(prev => {
    const next = new Set(prev);
    if (!next.delete(slug)) next.add(slug);
    return next;
  });

  // Jumping to a page inside a collapsed tab opens the tabs above it.
  useEffect(() => {
    const trail = ancestorsOf(tree, pos.doc);
    if (trail?.some(slug => !open.has(slug))) setOpen(prev => new Set([...prev, ...trail]));
  }, [pos.doc]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderTabs = (list: TabNode[]): ReactNode => list.map(node => {
    const kinColorName = node.doc.file.startsWith("12-") && !node.doc.file.startsWith("12-0")
      ? node.doc.blocks.map(b => b.t === "p" ? /^Color:\s*(.+)$/i.exec(b.text)?.[1].trim() : undefined).find(Boolean) : undefined;
    const tint = kinColorName ? kinColor({ id: "", name: node.doc.title, color: kinColorName }) : undefined;
    const light = ["pink", "light blue", "yellow", "grey"].includes((kinColorName ?? "").toLowerCase());
    const tabStyle = tint ? { "--rb-kin": tint, "--rb-kin-text": light ? "#221a10" : "#fff" } as React.CSSProperties : undefined;
    const cardTab = node.doc.file === "10-1-neutral-characters.md" ? "rb-neutral-tab"
      : node.doc.file === "03-1-events.md" ? "rb-event-tab"
      : node.doc.file === "03-2-actions.md" ? "rb-actions-tab" : "";
    return (
    <Fragment key={node.doc.slug}>
      <div className="rb-tab-row" style={{ "--rb-depth": node.depth } as React.CSSProperties}>

        <button className={`rb-tab ${tint ? "rb-kin-tab" : ""} ${cardTab ? `rb-card-tab ${cardTab}` : ""} ${node.doc.slug === doc.slug ? "active" : ""}`} style={tabStyle} onClick={() => { setHistory(h => [...h, pos]); setPos({ doc: node.doc.slug }); }}>{node.doc.title}</button>
                  
        {node.children.length > 0 ? (
            <button
                className="rb-toggle"
                aria-expanded={open.has(node.doc.slug)}
                aria-label={`${open.has(node.doc.slug) ? "Collapse" : "Expand"} ${node.doc.title}`}
                onClick={() => toggle(node.doc.slug)}
            >
                {open.has(node.doc.slug) ? "−" : "+"}
            </button>
        ) : null}
        
      </div>
      {node.children.length > 0 && open.has(node.doc.slug) && renderTabs(node.children)}
    </Fragment>
    );
  });
  const go = (docSlug: string, id?: string) => {
    setHistory(h => [...h, pos]);
    setPos({ doc: docSlug, id });
  };
  const back = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setPos(prev);
      return h.slice(0, -1);
    });
  };

  useEffect(() => {
    const el = pos.id ? document.getElementById(pos.id) : null;
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("rb-flash");
      const t = window.setTimeout(() => el.classList.remove("rb-flash"), 1600);
      return () => window.clearTimeout(t);
    }
    body.current?.scrollTo({ top: 0 });
  }, [pos]);

  // A link clicked on a card while the rulebook is already open.
  const firstJump = useRef(jump?.n);
  useEffect(() => {
    if (jump && jump.n !== firstJump.current) { go(jump.doc, jump.id); firstJump.current = jump.n; }
  }, [jump?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const content = useMemo(() => {
    if (!doc) return null;
    const out: ReactNode[] = [];
    let run: ReactNode[] = [];
    const flush = () => {
      if (run.length === 1) out.push(run[0]);
      else if (run.length > 1) out.push(<div key={`cards${out.length}`} className="rb-cards">{run}</div>);
      run = [];
    };
    const blocks = doc.blocks;
    for (let i = 0; i < blocks.length; i++) {
      const blk = blocks[i];
      const next = blocks[i + 1];
      // A card is a sub-heading directly followed by its rule box: the heading is drawn inside the box.
      if (blk.t === "h" && blk.level >= 2 && next?.t === "quote") {
        const [name, ...tags] = blk.text.split("|").map(s => s.trim());
        const found = cardById(slugify(name));
        const isKinFile = doc.file.startsWith("12-");
        const character = tags.length >= 3 ? CHARACTERS.find(c => c.id === slugify(name)) : undefined;
        // Event, action, blueprint, technology, treaty and ban headings, and the faction effects in a Kin file, are drawn as the in-game card.
        const def = found && (
          (found.kind === "event" && tags[0] === "event card")
          || (found.kind === "action" && tags[0] === "action card")
          || (found.kind === "blueprint" && tags[0] === "building blueprint")
          || (found.kind === "technology" && tags[0] === "technology card")
          || ((found.kind === "treaty" || found.kind === "ban") && doc.file.startsWith("09-") && tags.length === 0)
          || (found.kind === "faction" && isKinFile)
        ) ? found : undefined;
        const charKins = character?.kin ? kinsOf(doc, { kin: character.kin } as CardDef) : [];
        const lore = tags[0] === "𝌭" || tags[0] === "䷓" ? "law" : tags[0] === "🕀" ? "tactic" : tags[0] === "☽" ? "subterfuge" : undefined;
        const loreText = (() => {
          if (!lore || next.t !== "quote") return "";
          const labelled = (label: string) => next.lines.map(l => l.match(/^([\w ]+):\s*(.*)$/)).find(m => m && m[1].toLowerCase() === label)?.[2];
          if (lore === "law") return next.lines.join(" ");
          const short = labelled("short description");
          // A subterfuge's short description is followed by a "Then:" line.
          const then = labelled("then");
          if (short !== undefined && then !== undefined) return `${short}\nThen: ${then}`;
          return short ?? labelled("effect") ?? "";
        })();
        run.push(lore && loreText
          ? <div key={i + 1} id={blk.id} className="rb-gamecard"><article className={`kc kc-${lore}`}><span className="kc-kind">{lore === "law" ? "Law" : lore === "tactic" ? "Tactics" : "Subterfuge"}</span><h4>{name}</h4>{loreText.split("\n").map((part, n) => <p key={n} className="kc-text"><RuleText text={part} /></p>)}</article></div>
          : character
          ? <div key={i + 1} id={blk.id} className="rb-gamecard"><CharacterCard def={character} kins={charKins} state="claimed" /></div>
          : def
          ? <div key={i + 1} id={blk.id} className="rb-gamecard"><GameCard def={def} kins={kinsOf(doc, def)} giver={def.kind === "treaty" ? "#c9443a" : undefined} /></div>
          : <BlockView key={i + 1} b={next} head={blk} k={`${doc.slug}${i + 1}`} go={go} />);
        i++;
        continue;
      }
      flush();
      out.push(<BlockView key={i} b={blk} k={`${doc.slug}${i}`} go={go} />);
    }
    flush();
    return out;
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  const previous = docs.find(d => d.slug === history[history.length - 1]?.doc);

  return (
    <div className="rulebook">
      <div className="rb-side">
        <nav className="rb-tabs" aria-label="Rulebook sections">
          {renderTabs(tree)}
        </nav>
        <div className="rb-bar">
          <button onClick={back} disabled={history.length === 0} title={previous ? `Back to ${previous.title}` : undefined}>
            {previous ? <>← Back to <strong>{previous.title}</strong></> : "← Back"}
          </button>
          <span className="rb-logo">❖</span>
        </div>
      </div>
      <div className="rb-body" ref={body}>
        <Fragment key={doc.slug}>{content}</Fragment>
      </div>
    </div>
  );
}
