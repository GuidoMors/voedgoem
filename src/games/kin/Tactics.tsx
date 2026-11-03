import { useState } from "react";
import type { KinAuction, KinAuctionResult, KinPlay, KinTacticCard, KinWorld } from "./types";

type Send = (action: Record<string, unknown>) => void;

const nameOf = (list: KinTacticCard[] | undefined, id: string) => (id === "secret" ? "Secret tactics card" : list?.find(card => card.id === id)?.name ?? id);

export function AuctionPanel({ auction, world, names, userId, gold, send }: { auction: KinAuction; world: KinWorld; names: Record<string, string>; userId: string; gold: number; send: Send }) {
  const [amount, setAmount] = useState(auction.bid + 1);
  const mine = auction.active[0] === userId;
  const bid = Math.max(auction.bid + 1, amount);
  return (
    <div className="kin-payment">
      <h3>Tactician auction: {nameOf(world.tacticsList, auction.card)}</h3>
      <p className="small">
        Current bid: {auction.bid} gold{auction.leader ? ` by ${names[auction.leader] ?? "?"}` : " (no bids yet)"}. Still in: {auction.active.map(id => names[id] ?? "?").join(", ") || "nobody"}.
      </p>
      {mine ? (
        <div className="kin-payment-row">
          <label className="small">Bid <input type="number" min={auction.bid + 1} max={gold} value={bid} onChange={event => setAmount(Math.floor(Number(event.target.value) || 0))} /></label>
          <button type="button" className="primary" disabled={bid > gold} onClick={() => send({ type: "bid", amount: bid })}>Bid {bid}</button>
          <button type="button" onClick={() => send({ type: "fold" })}>Fold</button>
        </div>
      ) : (
        <p className="small muted">Waiting for {auction.active[0] ? names[auction.active[0]] ?? "?" : "the auction to resolve"}.</p>
      )}
    </div>
  );
}

export function AuctionResultBanner({ result, world, names, onClose }: { result: KinAuctionResult; world: KinWorld; names: Record<string, string>; onClose: () => void }) {
  return (
    <div className="kin-victory-banner" role="status">
      <p>{result.winner ? `${names[result.winner] ?? "?"} won the ${nameOf(world.tacticsList, result.card)} for ${result.bid} gold.` : `Nobody bid: the ${nameOf(world.tacticsList, result.card)} was discarded.`}</p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

export function NoticeBanner({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="kin-victory-banner" role="status">
      <p>{text}</p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

// Tactics cards lie open; subterfuge cards are shown only to their holder.
export function TacticsPanel({ world, play, names, userId, player, myTurn, graphiscopeSelected, graphiscopeUsable, onGraphiscope, send }: {
  world: KinWorld;
  play: KinPlay | null;
  names: Record<string, string>;
  userId: string;
  player: string;
  myTurn: boolean;
  graphiscopeSelected: boolean;
  graphiscopeUsable: boolean;
  onGraphiscope: () => void;
  send: Send;
}) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const tactics = world.tactics;
  const subterfuge = world.subterfuge;
  const hands = (tactics?.hands[player] ?? []).length > 0 ? [[player, tactics!.hands[player]] as [string, string[]]] : [];
  const mine = player === userId ? subterfuge?.mine ?? [] : [];
  const others = player !== userId && (subterfuge?.counts[player] ?? 0) > 0 ? [[player, subterfuge!.counts[player]] as [string, number]] : [];
  const options = play?.tacticOptions ?? [];
  const textOf = (id: string) => world.tacticsList?.find(card => card.id === id)?.text ?? "";
  return (
    <div className="kin-tactics">
      <h3>Tactics &amp; subterfuge</h3>
      <p className="small muted">Tactics deck: {tactics?.deck ?? 0} cards, {tactics?.discard ?? 0} discarded.</p>
      {hands.length === 0 && mine.length === 0 && others.length === 0 && <p className="muted">No tactics or subterfuge cards in this court.</p>}
      <div className="kc-row">
        {hands.flatMap(([owner, cards]) => cards.map((card, index) => {
          const option = owner === userId && myTurn ? options.find(entry => entry.card === card) : undefined;
          const chosen = targets[card] ?? option?.targets?.[0]?.id ?? "";
          const graphiscope = card === "graphiscope" && owner === userId;
          const reason = graphiscope
            ? (graphiscopeUsable ? undefined : "Choose an action card first; the Graphiscope then pays as a power 2 activation card.")
            : owner !== userId ? undefined : option ? (option.playable ? undefined : "Not playable right now.") : myTurn ? "Not playable right now." : "You can play tactics cards on your own turn.";
          return (
            <article key={`${card}-${index}`} className={`kc kc-tactic ${graphiscope && graphiscopeUsable ? "selectable" : ""} ${graphiscopeSelected && graphiscope ? "chosen" : ""} ${reason ? "unavailable" : ""}`} aria-label={nameOf(world.tacticsList, card)} onClick={graphiscope && graphiscopeUsable ? onGraphiscope : undefined}>
              <span className="kc-kind">Tactics card</span>
              <h4>{nameOf(world.tacticsList, card)}</h4>
              <p className="kc-text">{textOf(card)}</p>
              {option && !graphiscope && (
                <>
                  {option.targets && (
                    <select value={chosen} onChange={event => setTargets({ ...targets, [card]: event.target.value })}>
                      {option.targets.map(target => <option key={target.id} value={target.id}>{target.label}</option>)}
                    </select>
                  )}
                  <button type="button" className="primary" disabled={!option.playable || (!!option.targets && !chosen)} onClick={() => send({ type: "playTactic", card, target: option.targets ? chosen : undefined })}>Play</button>
                </>
              )}
              {reason && <span className="kc-disabled-pill" title={reason} tabIndex={0}>Disabled</span>}
            </article>
          );
        }))}
        {mine.map((card, index) => (
          <article key={`s-${card}-${index}`} className="kc kc-subterfuge" aria-label={nameOf(world.subterfugeList, card)}>
            <span className="kc-kind">Subterfuge · hidden from others</span>
            <h4>{nameOf(world.subterfugeList, card)}</h4>
            <p className="kc-text">{world.subterfugeList?.find(entry => entry.id === card)?.text}</p>
          </article>
        ))}
        {others.flatMap(([owner, count]) => Array.from({ length: count }, (_, index) => (
          <article key={`h-${owner}-${index}`} className="kc kc-subterfuge kc-back" aria-label="Hidden subterfuge card">
            <span className="kc-kind">Subterfuge</span>
            <h4>?</h4>
            <p className="kc-text">{names[owner] ?? "?"}'s hidden card.</p>
          </article>
        )))}
      </div>
    </div>
  );
}
