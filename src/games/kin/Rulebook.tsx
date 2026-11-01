import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { normalize, type Block, type Doc, type Rulebook as Book } from "./rulebookParser";
import { book } from "./rulebookData";

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
      out.push(t
        ? <a key={k} className={`rb-link ${t.color ?? ""}`} href={`#${t.id}`} onClick={e => { e.preventDefault(); go(t.doc, t.id); }}>{icon && <span className="rb-icon">{icon}</span>}{label}</a>
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
  const [name, ...tags] = b.text.split("|").map(s => s.trim());
  const icon = book.glossary.get(normalize(name))?.icon;
  const Tag = `h${Math.min(b.level + 1, 6)}` as "h2";
  return <Tag id={b.id} className={`rb-h rb-h${b.level}`}>{icon && <span className="rb-icon">{icon}</span>}{inline(name, go, b.id)}{tags.length > 0 && <small className="rb-tags">{tags.join(" · ")}</small>}</Tag>;
}

function BlockView({ b, go, k }: { b: Block; go: (d: string, i: string) => void; k: string }) {
  switch (b.t) {
    case "h": return <Heading b={b} go={go} />;
    case "p": return <p>{inline(b.text, go, k)}</p>;
    case "ul": return <ul>{b.items.map((t, i) => <li key={i}>{inline(t, go, `${k}${i}`)}</li>)}</ul>;
    case "ol": return <ol>{b.items.map((t, i) => <li key={i}>{inline(t, go, `${k}${i}`)}</li>)}</ol>;
    case "quote": return (
      <div className="rb-rule">
        {b.lines.map((l, i) => {
          const m = /^(\*\*)?([A-Z][A-Za-z ]{1,24}):(\*\*)?\s*(.*)$/.exec(l);
          return m
            ? <div key={i} className="rb-field"><span className="rb-key">{m[2]}</span><span>{inline(m[4], go, `${k}${i}`)}</span></div>
            : <div key={i} className="rb-field rb-plain">{inline(l, go, `${k}${i}`)}</div>;
        })}
      </div>
    );
    case "table": return (
      <div className="rb-table"><table>
        <thead><tr>{b.rows[0].map((c, i) => <th key={i}>{inline(c, go, `${k}h${i}`)}</th>)}</tr></thead>
        <tbody>{b.rows.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, i) => <td key={i}>{inline(c, go, `${k}${ri}-${i}`)}</td>)}</tr>)}</tbody>
      </table></div>
    );
  }
}

export function RulebookView({ book: b = book }: { book?: Book }) {
  const docs: Doc[] = b.docs;
  const [pos, setPos] = useState<Pos>({ doc: docs[0]?.slug ?? "" });
  const [history, setHistory] = useState<Pos[]>([]);
  const body = useRef<HTMLDivElement>(null);
  const doc = docs.find(d => d.slug === pos.doc) ?? docs[0];

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

  const content = useMemo(() => doc?.blocks.map((blk, i) => <BlockView key={i} b={blk} k={`${doc.slug}${i}`} go={go} />), [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rulebook">
      <nav className="rb-tabs" aria-label="Rulebook sections">
        {docs.map(d => (
          <button key={d.slug} className={d.slug === doc.slug ? "active" : ""} onClick={() => { setHistory(h => [...h, pos]); setPos({ doc: d.slug }); }}>{d.title}</button>
        ))}
      </nav>
      <div className="rb-body" ref={body}>
        <div className="rb-bar">
          <button onClick={back} disabled={history.length === 0}>← Back</button>
          <span className="rb-logo">❖</span>
        </div>
        <Fragment key={doc.slug}>{content}</Fragment>
      </div>
    </div>
  );
}
