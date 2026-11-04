import { book } from "./rulebookData";
import { GameCard, RuleText, RULEBOOK_EVENT, type RulebookJump } from "./Cards";
import { CARDS } from "./cards.data";
import type { KinInfo } from "./types";

const COLORS: Record<string, string> = {
  pink: "rgb(227 169 198)", brown: "#8b5a2b", "light blue": "#7ec8e8", yellow: "#e8c547", "dark red": "#8e1b1b",
  grey: "#8a8f98", black: "#2b2b2b", blue: "#2f5fc4", "dark green": "#2e6b3a", purple: "#7a4fb0"
};

const KIN_IMAGES: Record<string, string> = {
  ethereal: "the-ethereal",
  hanshu: "dynasty-of-hanshu",
  wanderers: "the-wanderers",
  lumon: "pride-of-lumon",
  beastmen: "beastman-tribes",
  ark: "archive-enclave",
  hammers: "hammers-of-the-ash",
  syndicate: "seven-streams-syndicate",
  tree: "children-of-the-great-tree",
  deepones: "deep-ones"
};

export const kinImage = (id: string) => KIN_IMAGES[id] ? `/images/kin/${KIN_IMAGES[id]}.webp` : undefined;

export function kinText(kin: KinInfo) {
  const doc = book.docs.find(d => d.file.startsWith("12-") && d.title === kin.name);
  const gameplay = doc?.blocks.flatMap(block => block.t === "p" ? [block.text] : [])
    .map(text => /(?:^|\s)Gameplay:\s*(.+)/i.exec(text)?.[1]).find(Boolean);
  return {
    gameplay,
    docSlug: doc?.slug,
    docHeading: doc?.blocks.find(block => block.t === "h")?.id
  };
}

export const kinColor = (kin: KinInfo) => COLORS[kin.color] ?? "#888";

export function KinCard({ kin, owner, unavailableReason, available, onPick, onRead }: { kin: KinInfo; owner?: string; unavailableReason?: string; available: boolean; onPick?: () => void; onRead?: () => void }) {
  const { gameplay, docSlug, docHeading } = kinText(kin);
  const core = CARDS.find(card => card.kind === "faction" && card.kin === kin.id && card.core);
  const pickable = available && !owner && !unavailableReason && !!onPick;
  return (
    <article className={`kin-card ${owner || unavailableReason ? "taken" : ""} ${available ? "available" : ""} ${pickable ? "pickable" : ""}`} style={{ ["--kin-color" as string]: kinColor(kin) }}
      role={pickable ? "button" : undefined} tabIndex={pickable ? 0 : undefined} aria-label={pickable ? `Pick ${kin.name}` : undefined}
      onClick={pickable ? onPick : undefined}
      onKeyDown={pickable ? event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onPick(); } } : undefined}>
      <header>
        <span className="kin-card-crest">❖</span><h3>{kin.name}</h3>
        {(onRead || (docSlug && docHeading)) && <button type="button" className="kin-card-info" aria-label={`Read about ${kin.name}`} title={`Read about ${kin.name}`} onClick={event => {
          event.stopPropagation();
          if (onRead) onRead();
          else if (docSlug && docHeading) window.dispatchEvent(new CustomEvent<RulebookJump>(RULEBOOK_EVENT, { detail: { doc: docSlug, id: docHeading } }));
        }}>ⓘ</button>}
      </header>
      {kinImage(kin.id)
        ? <img className="kin-card-art" src={kinImage(kin.id)} alt={kin.name} />
        : <div className="kin-card-art" aria-hidden="true">{kin.name.replace(/^The /, "").charAt(0)}</div>}
      {gameplay && <p className="kin-card-gameplay"><RuleText text={gameplay} /></p>}
      {core && <div className="kin-card-core"><GameCard def={core} kins={[kin]} /></div>}
      <footer>
        {owner && <span className="pill">{owner}</span>}
        {unavailableReason && <span className="pill">{unavailableReason}</span>}
      </footer>
    </article>
  );
}
