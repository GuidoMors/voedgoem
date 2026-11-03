export type Block =
  | { t: "h"; level: number; text: string; id: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; lines: string[] }
  | { t: "table"; rows: string[][] };

export interface Doc {
  file: string;
  slug: string;
  title: string;
  blocks: Block[];
}

export interface Target {
  doc: string;
  id: string;
  icon?: string;
  color?: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");

export const normalize = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim().replace(/^the /, "");

const headKey = (text: string) => text.split("|")[0].trim();

export function parseDoc(file: string, text: string): Doc {
  const slug = file.replace(/\.md$/, "");
  const blocks: Block[] = [];
  const used = new Set<string>();
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      let id = `${slug}--${slugify(headKey(h[2])) || "section"}`;
      for (let n = 2; used.has(id); n++) id = `${slug}--${slugify(headKey(h[2])) || "section"}-${n}`;
      used.add(id);
      blocks.push({ t: "h", level: h[1].length, text: h[2].trim(), id });
      i++;
    } else if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ t: "quote", lines: q });
    } else if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i++].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!row.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(row);
      }
      blocks.push({ t: "table", rows });
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        const m = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) items.push(m[2]);
        else if (/^\s+\S/.test(lines[i]) && items.length) items[items.length - 1] += " " + lines[i].trim();
        else break;
        i++;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
    } else {
      const p: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|\||\s*([-*]|\d+\.)\s)/.test(lines[i])) p.push(lines[i++].trim());
      blocks.push({ t: "p", text: p.join(" ") });
    }
  }
  const h1 = blocks.find((b) => b.t === "h" && b.level === 1);
  return { file, slug, title: h1 && h1.t === "h" ? headKey(h1.text) : slug, blocks };
}

export interface Glossary {
  icon: string;
  color?: string;
}

export function parseGlossary(doc: Doc): Map<string, Glossary> {
  const map = new Map<string, Glossary>();
  for (const b of doc.blocks) {
    if (b.t !== "h" || b.level !== 2) continue;
    const [key, icon, color] = b.text.split("|").map((s) => s.trim());
    if (key && icon) map.set(normalize(key), { icon, color: color && color !== "plain" ? color : undefined });
  }
  return map;
}

export interface Rulebook {
  docs: Doc[];
  glossary: Map<string, Glossary>;
  resolve(link: string): Target | undefined;
}

// Links whose wording has no heading of its own; they point to the closest rule.
const ALIASES: Record<string, string> = {
  forest: "tile type", mountain: "tile type", mountains: "tile type", desert: "tile type", snow: "tile type",
  plains: "tile type", farmland: "tile type", river: "4. rivers",
  building: "tile building", "path building": "edge building",
  "armies can be moved onto this tile": "tile building",
  authority: "dynasty of hanshu", vassal: "vassal treaty", dedication: "treaty",
  universal: "archetype", resource: "basic resource", distance: "tile distance",
  "law card": "law deck", "natural turn": "natural order", "of power": "power",
  "treaties held": "treaty", revoked: "revoke", "unblocked hit": "unblocked hits",
};

export function buildRulebook(files: Record<string, string>): Rulebook {
  const docs = Object.keys(files)
    .sort()
    .map((f) => parseDoc(f, files[f]));
  const glossDoc = docs.find((d) => d.file === "glossary.md");
  const glossary = glossDoc ? parseGlossary(glossDoc) : new Map<string, Glossary>();
  const index = new Map<string, Target>();
  const add = (key: string, t: Target, override: boolean) => {
    const k = normalize(key);
    if (k && (override || !index.has(k))) index.set(k, t);
  };
  for (const d of docs) {
    for (const b of d.blocks) {
      if (b.t !== "h") continue;
      const key = headKey(b.text);
      const g = glossary.get(normalize(key));
      const target = { doc: d.slug, id: b.id, icon: g?.icon, color: g?.color };
      add(key, target, d.file === "glossary.md");
      const colon = key.indexOf(":");
      if (colon > 0) add(key.slice(0, colon), target, false);
    }
    if (!index.has(normalize(d.title))) add(d.title, { doc: d.slug, id: d.blocks.find((b) => b.t === "h")?.t === "h" ? (d.blocks.find((b) => b.t === "h") as { id: string }).id : "" }, false);
  }
  const lookup = (k: string): Target | undefined => {
    const n = normalize(ALIASES[normalize(k)] ?? k);
    const cands = [n, n + "s"];
    if (n.endsWith(" phase")) cands.push(n.slice(0, -6));
    if (n.endsWith("ie")) cands.push(n.slice(0, -2) + "y");
    if (n.endsWith("e")) cands.push(n.slice(0, -1));
    if (n.endsWith("ies")) cands.push(n.slice(0, -3) + "y");
    if (n.endsWith("es")) cands.push(n.slice(0, -2));
    if (n.endsWith("s")) cands.push(n.slice(0, -1));
    for (const c of cands) {
      const t = index.get(c);
      if (t) return t;
    }
    return undefined;
  };
  return { docs, glossary, resolve: lookup };
}

export interface Link {
  target: string;
  text: string;
}

/** All [[target|text]] links in a markdown string. */
export function findLinks(text: string): Link[] {
  const out: Link[] = [];
  for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) out.push({ target: m[1].trim(), text: (m[2] ?? m[1]).trim() });
  return out;
}
