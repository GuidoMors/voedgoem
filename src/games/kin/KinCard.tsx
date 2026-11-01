import { book } from "./rulebookData";
import { normalize } from "./rulebookParser";
import type { KinInfo } from "./types";

const COLORS: Record<string, string> = {
  pink: "#e58bb8", brown: "#8b5a2b", "light blue": "#7ec8e8", yellow: "#e8c547", "dark red": "#8e1b1b",
  grey: "#8a8f98", black: "#2b2b2b", blue: "#2f5fc4", "dark green": "#2e6b3a", purple: "#7a4fb0"
};

const plain = (text: string) => text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, label?: string) => label ?? target).replace(/\*\*/g, "");

// Card text comes straight from the rulebook: the core ability from the Kin table and the flavour from the Kin's own file.
export function kinText(kin: KinInfo) {
  const table = book.docs.find(doc => doc.file === "12-0-kin.md")?.blocks.find(block => block.t === "table");
  const row = table?.t === "table" ? table.rows.find(r => normalize(plain(r[0])) === normalize(kin.name)) : undefined;
  const doc = book.docs.find(d => d.file.startsWith("12-") && d.title === kin.name);
  const intro = doc?.blocks.find(block => block.t === "p" && !block.text.startsWith("Color:"));
  return {
    ability: row ? plain(row[1]) : "",
    flavour: intro?.t === "p" ? intro.text : "",
    docSlug: doc?.slug
  };
}

export const kinColor = (kin: KinInfo) => COLORS[kin.color] ?? "#888";

export function KinCard({ kin, owner, available, onPick, onRead }: { kin: KinInfo; owner?: string; available: boolean; onPick?: () => void; onRead?: () => void }) {
  const { ability, flavour } = kinText(kin);
  const [title, ...rest] = ability.split(":");
  return (
    <article className={`kin-card ${owner ? "taken" : ""} ${available ? "available" : ""}`} style={{ ["--kin-color" as string]: kinColor(kin) }}>
      <header><span className="kin-card-crest">❖</span><h3>{kin.name}</h3></header>
      <div className="kin-card-art" aria-hidden="true">{kin.name.replace(/^The /, "").charAt(0)}</div>
      <p className="kin-card-ability"><strong>{rest.length ? title : "Core ability"}</strong>{rest.length ? `: ${rest.join(":").trim()}` : ability}</p>
      <p className="kin-card-flavour">{flavour}</p>
      <footer>
        {owner ? <span className="pill">{owner}</span> : <button type="button" disabled={!available || !onPick} onClick={onPick}>Pick</button>}
        {onRead && <button type="button" className="link" onClick={onRead}>Rules</button>}
      </footer>
    </article>
  );
}
