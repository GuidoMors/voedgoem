import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { Person } from "../../avatar/Avatar";
import type { GameLobbyProps, Send } from "../types";
import type { PassTimeCard, PassTimeClock, PassTimeRule, PassTimeSnapshot } from "./types";

type Props = GameLobbyProps<PassTimeSnapshot>;
type RuleType = PassTimeRule["type"];

const boundaryName = (boundary: number) => `Between Segment ${boundary === 0 ? 6 : boundary} and Segment ${boundary + 1}`;

const requiredTurnSegment = (clock: PassTimeClock, turnNumber: number) => {
  const index = clock.rules.findIndex(rules =>
    rules.some(rule => rule.type === "turn-number" && rule.numbers.includes(turnNumber))
  );
  return index < 0 ? null : index;
};

const segmentClipPaths = Array.from({ length: 6 }, (_, segment) => {
  const startAngle = 210 + segment * 60;
  const arc = Array.from({ length: 7 }, (_, point) => {
    const angle = ((startAngle + point * 10) * Math.PI) / 180;
    return `${(50 + 49 * Math.cos(angle)).toFixed(2)}% ${(50 + 49 * Math.sin(angle)).toFixed(2)}%`;
  });
  return `polygon(50% 50%, ${arc.join(", ")})`;
});

function ruleDescription(rule: PassTimeRule): string {
  switch (rule.type) {
    case "clock-two-cards": return "Every segment must contain exactly two cards.";
    case "no-hint": return "Hints cannot be used anywhere on this clock.";
    case "no-number": return `Cards valued ${rule.value - 1}, ${rule.value}, or ${rule.value + 1} cannot be placed here.`;
    case "nothing": return "Cards cannot be placed here while this rule is in the segment.";
    case "most": return "This segment must contain strictly more cards than every other segment.";
    case "sum-near": return `This segment must total ${rule.value - 1}, ${rule.value}, or ${rule.value + 1}.`;
    case "composition": return `Exactly ${rule.black} black and ${rule.white} white cards, and no others.`;
    case "card-count": return `Exactly ${rule.count} cards must be here.`;
    case "turn-number": return `Player-played card ${rule.numbers.map(number => `#${number}`).join(", ")} must be placed here.`;
    case "extreme-card": return `The ${rule.extreme} ${rule.color} card dealt to players must be placed here.`;
    case "draw": return "A random card from the undealt cards is placed here when play begins.";
    case "rotate": return `After a card is placed here, all segment rules rotate ${rule.direction}.`;
  }
}

function ruleLabel(rule: PassTimeRule): string {
  switch (rule.type) {
    case "clock-two-cards": return "2 each";
    case "no-hint": return "No hints";
    case "no-number": return `NO ${rule.value}`;
    case "nothing": return "NOTHING";
    case "most": return "MOST";
    case "sum-near": return `X ${rule.value}`;
    case "composition": return `${"B ".repeat(rule.black)}${"W ".repeat(rule.white)}`.trim() || "No cards";
    case "card-count": return `${rule.count} cards`;
    case "turn-number": return rule.numbers.map(number => `#${number}`).join(" ");
    case "extreme-card": return `${rule.extreme === "highest" ? "+" : "-"} ${rule.color === "black" ? "B" : "W"}`;
    case "draw": return "DRAW";
    case "rotate": return rule.direction === "clockwise" ? "↻" : "↺";
  }
}

function ClockView({ clock, board, handBoundary, selectedSegment, onSelectSegment, interactive = false, requiredSegment, boundarySelection = false, lockCurrentBoundary = false, onSelectBoundary }: {
  clock: PassTimeClock;
  board?: PassTimeCard[][];
  handBoundary: number;
  selectedSegment?: number | null;
  onSelectSegment?: (segment: number) => void;
  interactive?: boolean;
  requiredSegment?: number | null;
  boundarySelection?: boolean;
  lockCurrentBoundary?: boolean;
  onSelectBoundary?: (boundary: number) => void;
}) {
  const global = clock.globalRules ?? [];
  const [ruleTooltip, setRuleTooltip] = useState<{ description: string; left: number; top: number } | null>(null);
  const showRuleTooltip = (element: HTMLElement, description: string) => {
    const rect = element.getBoundingClientRect();
    const horizontalInset = Math.min(142, window.innerWidth / 2);
    setRuleTooltip({
      description,
      left: Math.min(Math.max(rect.left + rect.width / 2, horizontalInset), window.innerWidth - horizontalInset),
      top: Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 80)),
    });
  };
  return (
    <div className="pt-clock-view" onMouseLeave={() => setRuleTooltip(null)}>
      <div className="pt-clock-shell">
      <div className="pt-clock">
        {clock.rules.map((rules, segment) => {
          const cards = board?.[segment] ?? [];
          const centerAngle = ((240 + segment * 60) * Math.PI) / 180;
          const content = (
            <span className="pt-segment-content" style={{
              left: `${50 + 29 * Math.cos(centerAngle)}%`,
              top: `${50 + 29 * Math.sin(centerAngle)}%`,
            }}>
              {rules.length > 0 && <span className="pt-rule-list">{rules.map(rule => {
                const description = ruleDescription(rule);
                return <span
                  key={rule.id}
                  aria-label={description}
                  aria-describedby="pt-rule-tooltip"
                  tabIndex={0}
                  onMouseEnter={event => showRuleTooltip(event.currentTarget, description)}
                  onFocus={event => showRuleTooltip(event.currentTarget, description)}
                  onBlur={() => setRuleTooltip(null)}
                >{ruleLabel(rule)}</span>;
              })}</span>}
            </span>
          );
          const isLocked = interactive && requiredSegment !== null && requiredSegment !== undefined && requiredSegment !== segment;
          const className = `pt-segment${selectedSegment === segment ? " is-selected" : ""}${rules.some(rule => rule.type === "nothing") ? " is-nothing" : ""}${isLocked ? " is-locked" : ""}`;
          const placedCards = cards.length > 0 && <span
            className="pt-board-cards"
            aria-label={`${cards.length} ${cards.length === 1 ? "played card" : "played cards"}`}
            style={{
            left: `${50 + 42 * Math.cos(centerAngle)}%`,
            top: `${50 + 42 * Math.sin(centerAngle)}%`,
              transform: `translate(-50%, -50%) rotate(${centerAngle * 180 / Math.PI - 90}deg)`,
            }}
          >
            {cards.map(card => {
              const faceUp = card.faceUp && card.value !== null && card.color !== null;
              return <span
                key={card.id}
                className={`pt-board-card${card.color ? ` ${card.color}` : ""}${faceUp ? "" : " is-face-down"}`}
                aria-label={faceUp ? `${card.value} ${card.color} card` : `Face-down ${card.color ?? ""} card`}
                title={faceUp ? `${card.value} ${card.color}` : `Face-down ${card.color ?? ""} card`}
              >{faceUp ? card.value : ""}</span>;
            })}
          </span>;
          return <div className="pt-segment-wrapper" key={segment}>
            {interactive
              ? <button
                type="button"
                className={className}
                disabled={isLocked}
                style={{ clipPath: segmentClipPaths[segment] }}
                onClick={() => onSelectSegment?.(segment)}
              >{content}</button>
              : <div className={className} style={{ clipPath: segmentClipPaths[segment] }}>{content}</div>}
            {placedCards}
          </div>;
        })}
        {boundarySelection && [0, 1, 2, 3, 4, 5].map(boundary => (
          <button
            type="button"
            className={`pt-boundary-target${handBoundary === boundary ? " is-selected" : ""}`}
            key={boundary}
            disabled={lockCurrentBoundary && handBoundary === boundary}
            style={{ transform: `rotate(${((boundary + 5) % 6) * 60}deg)` }}
            aria-label={handBoundary === boundary ? "Current hand position" : `Place hand ${boundaryName(boundary)}`}
            title={handBoundary === boundary ? "Current hand position" : `Place hand ${boundaryName(boundary)}`}
            onClick={() => onSelectBoundary?.(boundary)}
          />
        ))}
        <div className={`pt-clock-center${global.length > 0 ? " has-global-rules" : ""}`}>
          {global.length > 0 && <div className="pt-global-rules" aria-label="Clock-wide rules">{global.map(rule => {
            const description = ruleDescription(rule);
            return <span
              key={rule.id}
              title={description}
              aria-label={description}
              tabIndex={0}
              onMouseEnter={event => showRuleTooltip(event.currentTarget, description)}
              onFocus={event => showRuleTooltip(event.currentTarget, description)}
              onBlur={() => setRuleTooltip(null)}
            >{ruleLabel(rule)}</span>;
          })}</div>}
        </div>
        <span className="pt-clock-hand" style={{ transform: `rotate(${((handBoundary + 5) % 6) * 60}deg)` }} aria-hidden="true">
          <span className="pt-clock-hand-tip" />
          <span className="pt-clock-hand-shaft" />
          <span className="pt-clock-hand-pivot" />
        </span>
      </div>
      </div>
      <details className="pt-base-rules">
        <summary>Base clock rules</summary>
        <ul>
          <li>Every segment must contain at least one card by the end.</li>
          <li>No segment total may exceed 24. Exceeding 24 ends the game immediately.</li>
          <li>Starting clockwise from the hand, each segment after the first must total at least as much as the previous segment.</li>
        </ul>
      </details>
      {ruleTooltip && <div
        id="pt-rule-tooltip"
        className="pt-rule-tooltip"
        role="tooltip"
        style={{ left: ruleTooltip.left, top: ruleTooltip.top }}
      >{ruleTooltip.description}</div>}
    </div>
  );
}

function PlayerList({ snapshot, userId, isHost, isAdmin, send }: {
  snapshot: PassTimeSnapshot; userId: string; isHost: boolean; isAdmin: boolean; send: Send;
}) {
  const [order, setOrder] = useState(snapshot.seats.map(seat => seat.id));
  useEffect(() => setOrder(snapshot.seats.map(seat => seat.id)), [snapshot.seats.map(seat => seat.id).join(",")]);
  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const other = index + direction;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    setOrder(next);
    send({ type: "set_order", userIds: next });
  };
  const orderedSeats = order.map(id => snapshot.seats.find(seat => seat.id === id)).filter((seat): seat is PassTimeSnapshot["seats"][number] => !!seat);
  return (
    <section className="pt-player-list">
      <h3>Players <span>{snapshot.seats.length}/{snapshot.maxPlayers}</span></h3>
      {snapshot.seats.length === 0 ? <p className="muted small">No players have joined yet.</p> : <ol>
        {orderedSeats.map((seat, index) => {
          const partner = seat.pairedWith ? snapshot.seats.find(item => item.id === seat.pairedWith) : null;
          return <li key={seat.id} className={`${seat.connected ? "" : "is-offline"}${seat.id === snapshot.currentPlayerId ? " is-current" : ""}`}>
            <span className="pt-seat-order">{index + 1}</span>
            <strong><Person id={seat.id} name={`${seat.username}${seat.id === userId ? " (you)" : ""}`} size={18} /></strong>
            {partner && <small>Paired with {partner.username}</small>}
            {seat.id === snapshot.currentPlayerId && <small>Playing now</small>}
            {!seat.connected && <small>Offline</small>}
            {isHost && snapshot.phase === "lobby" && seat.id !== userId && <button className="pt-remove-player" aria-label={`Remove ${seat.username}`} title={`Remove ${seat.username}`} onClick={() => send({ type: "kick", userId: seat.id })}>×</button>}
            {isAdmin && snapshot.phase === "lobby" && <span className="pt-order-buttons">
              <button aria-label={`Move ${seat.username} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
              <button aria-label={`Move ${seat.username} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>↓</button>
            </span>}
          </li>;
        })}
      </ol>}
    </section>
  );
}

const RULE_TYPES: { type: RuleType; label: string; global?: boolean }[] = [
  { type: "clock-two-cards", label: "CLOCK 2 CARDS", global: true },
  { type: "no-hint", label: "NO HINT", global: true },
  { type: "no-number", label: "NO N" },
  { type: "nothing", label: "NOTHING" },
  { type: "most", label: "MOST" },
  { type: "sum-near", label: "X N" },
  { type: "composition", label: "Color composition" },
  { type: "card-count", label: "N CARDS" },
  { type: "turn-number", label: "#N" },
  { type: "extreme-card", label: "Highest/lowest color card" },
  { type: "draw", label: "DRAW" },
  { type: "rotate", label: "Rotate rules" }
];

function newRule(type: RuleType, value: number, black: number, white: number, color: "black" | "white", direction: "clockwise" | "counter-clockwise", numbers: number[]): PassTimeRule {
  const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case "clock-two-cards": case "no-hint": case "nothing": case "most": case "draw": return { id, type };
    case "no-number": case "sum-near": return { id, type, value };
    case "composition": return { id, type, black, white };
    case "card-count": return { id, type, count: value };
    case "turn-number": return { id, type, numbers };
    case "extreme-card": return { id, type, color, extreme: value >= 0 ? "highest" : "lowest" };
    case "rotate": return { id, type, direction };
  }
}

function ClockEditor({ clocks, onSaved }: { clocks: PassTimeClock[]; onSaved: (clocks: PassTimeClock[]) => void }) {
  const [clockId, setClockId] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [globalRules, setGlobalRules] = useState<PassTimeRule[]>([]);
  const [rules, setRules] = useState<PassTimeRule[][]>(Array.from({ length: 6 }, () => []));
  const [ruleType, setRuleType] = useState<RuleType>("no-number");
  const [segment, setSegment] = useState(0);
  const [value, setValue] = useState(7);
  const [black, setBlack] = useState(1);
  const [white, setWhite] = useState(1);
  const [color, setColor] = useState<"black" | "white">("black");
  const [direction, setDirection] = useState<"clockwise" | "counter-clockwise">("clockwise");
  const [numbers, setNumbers] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClock = (id: string) => {
    setClockId(id);
    const selected = clocks.find(clock => clock.id === id);
    setName(selected?.name ?? "");
    setLevel(selected?.level ?? 1);
    setGlobalRules((selected?.globalRules ?? []).map(item => ({ ...item })));
    setRules(selected?.rules.map(group => group.map(item => ({ ...item }))) ?? Array.from({ length: 6 }, () => []));
    setError(null);
  };

  const addRule = () => {
    const item = newRule(ruleType, value, black, white, color, direction, numbers.split(",").map(entry => Number(entry.trim())));
    if (ruleType === "clock-two-cards" || ruleType === "no-hint") {
      setGlobalRules(current => [...current.filter(rule => rule.type !== ruleType), item]);
    } else {
      setRules(current => current.map((group, index) => index === segment ? [...group, item] : group));
    }
  };

  const removeRule = (ruleId: string) => {
    setGlobalRules(current => current.filter(item => item.id !== ruleId));
    setRules(current => current.map(group => group.filter(item => item.id !== ruleId)));
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const clock: PassTimeClock = { id: clockId || "new", name, level, rules, globalRules };
    try {
      if (clockId) {
        await api(`/api/admin/pass-time/clocks/${encodeURIComponent(clockId)}`, { method: "PUT", body: JSON.stringify({ clock }) });
      } else {
        await api("/api/admin/pass-time/clocks", { method: "POST", body: JSON.stringify({ clock }) });
      }
      const { clocks: updated } = await api<{ clocks: PassTimeClock[] }>("/api/pass-time/clocks");
      onSaved(updated);
      setClockId("");
      setName("");
      setLevel(1);
      setGlobalRules([]);
      setRules(Array.from({ length: 6 }, () => []));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this clock.");
    } finally {
      setBusy(false);
    }
  };

  const removeClock = async () => {
    if (!clockId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/pass-time/clocks/${encodeURIComponent(clockId)}`, { method: "DELETE" });
      const { clocks: updated } = await api<{ clocks: PassTimeClock[] }>("/api/pass-time/clocks");
      onSaved(updated);
      loadClock("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove this clock.");
    } finally {
      setBusy(false);
    }
  };

  const editOptions = useMemo(() => [...clocks].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map(clock => <option key={clock.id} value={clock.id}>{clock.name}</option>), [clocks]);
  const selectedRuleType = RULE_TYPES.find(item => item.type === ruleType);
  const allRules = [...globalRules, ...rules.flat()];

  return (
    <details className="pt-clock-editor">
      <summary>Admin · Edit clock catalog</summary>
      <div className="pt-editor-content">
        <label>Existing clock
          <select value={clockId} onChange={event => loadClock(event.target.value)}>
            <option value="">Create a new clock</option>{editOptions}
          </select>
        </label>
        <div className="pt-editor-fields">
          <label>Clock name<input value={name} onChange={event => setName(event.target.value)} maxLength={80} /></label>
          <label>Level<input type="number" min={0} max={10} value={level} onChange={event => setLevel(Number(event.target.value))} /></label>
        </div>
        <div className="pt-editor-fields">
          <label>Rule<select value={ruleType} onChange={event => setRuleType(event.target.value as RuleType)}>{RULE_TYPES.map(item => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
          {selectedRuleType?.global ? <label>Scope<span className="pt-editor-note">This rule applies to the whole clock.</span></label> : <label>Segment<select value={segment} onChange={event => setSegment(Number(event.target.value))}>{[0, 1, 2, 3, 4, 5].map(index => <option key={index} value={index}>Segment {index + 1}</option>)}</select></label>}
        </div>
        {["no-number", "sum-near", "card-count"].includes(ruleType) && <label>Number<input type="number" min={1} max={24} value={value} onChange={event => setValue(Number(event.target.value))} /></label>}
        {ruleType === "turn-number" && <label>Card numbers, comma-separated<input value={numbers} onChange={event => setNumbers(event.target.value)} placeholder="1, 2" /></label>}
        {ruleType === "composition" && <div className="pt-editor-fields"><label>Black cards<input type="number" min={0} max={24} value={black} onChange={event => setBlack(Number(event.target.value))} /></label><label>White cards<input type="number" min={0} max={24} value={white} onChange={event => setWhite(Number(event.target.value))} /></label></div>}
        {ruleType === "extreme-card" && <div className="pt-editor-fields"><label>Color<select value={color} onChange={event => setColor(event.target.value as "black" | "white")}><option value="black">Black</option><option value="white">White</option></select></label><label>Extreme<select value={value >= 0 ? "highest" : "lowest"} onChange={event => setValue(event.target.value === "highest" ? 1 : -1)}><option value="highest">Highest</option><option value="lowest">Lowest</option></select></label></div>}
        {ruleType === "rotate" && <label>Direction<select value={direction} onChange={event => setDirection(event.target.value as "clockwise" | "counter-clockwise")}><option value="clockwise">Clockwise</option><option value="counter-clockwise">Counter-clockwise</option></select></label>}
        <button type="button" onClick={addRule}>Add rule</button>
        <div className="pt-editor-rule-list">
          {globalRules.length > 0 && <p><strong>Clockwide:</strong> {globalRules.map(item => <button key={item.id} type="button" className="pt-rule-chip" title="Remove rule" onClick={() => removeRule(item.id)}>{ruleLabel(item)} ×</button>)}</p>}
          {rules.map((group, index) => group.length > 0 && <p key={index}><strong>Segment {index + 1}:</strong> {group.map(item => <button key={item.id} type="button" className="pt-rule-chip" title="Remove rule" onClick={() => removeRule(item.id)}>{ruleLabel(item)} ×</button>)}</p>)}
          {allRules.length === 0 && <p className="muted small">No optional rules added yet.</p>}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" className="primary" disabled={busy || !name.trim()} onClick={save}>{busy ? "Saving…" : clockId ? "Save changes" : "Save new clock"}</button>
          {clockId && <button type="button" className="danger" disabled={busy} onClick={removeClock}>Delete clock</button>}
          {clockId && <button type="button" disabled={busy} onClick={() => loadClock("")}>New clock</button>}
        </div>
        <p className="muted small">Rule combinations are validated when saved. Clocks are stored in the shared database catalog.</p>
      </div>
    </details>
  );
}

function Lobby({ snapshot, userId, isHost, isAdmin, isDisplay, send }: Props) {
  const [clocks, setClocks] = useState(snapshot.starterClocks);
  const [selectedClockId, setSelectedClockId] = useState(snapshot.lobbyClock?.id ?? snapshot.starterClocks[0]?.id ?? "");
  const [handBoundary, setHandBoundary] = useState(snapshot.handBoundary);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const selectedClock = isHost
    ? clocks.find(clock => clock.id === selectedClockId) ?? clocks.find(clock => clock.id === snapshot.lobbyClock?.id) ?? clocks[0]
    : snapshot.lobbyClock ?? clocks.find(clock => clock.id === selectedClockId) ?? clocks[0];

  useEffect(() => {
    let active = true;
    api<{ clocks: PassTimeClock[] }>("/api/pass-time/clocks").then(result => {
      if (!active) return;
      setClocks(result.clocks);
      const currentSelection = snapshot.lobbyClock?.id ?? selectedClockId;
      const selected = result.clocks.find(clock => clock.id === currentSelection) ?? result.clocks[0];
      setSelectedClockId(selected?.id ?? "");
      if (isHost && selected) send({ type: "select_clock", clock: selected, handBoundary });
      setCatalogError(null);
    }).catch(reason => {
      if (active) setCatalogError(reason instanceof Error ? reason.message : "Could not load the shared clock catalog.");
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="pass-time-game">
      <header className="pt-header">
        <div><p className="pt-eyebrow">The clockhouse cooperative</p><h2>Pass Time</h2><p>Place your hidden cards. Keep each measure in balance.</p></div>
        <span className="pt-clock-mark" aria-hidden="true">⌛</span>
      </header>
      <div className="pt-lobby-layout">
        <section className="pt-panel">
          <h3>Gather around</h3>
          <PlayerList snapshot={snapshot} userId={userId} isHost={isHost} isAdmin={isAdmin} send={send} />
          {snapshot.options.join && !isDisplay && <button className="primary" onClick={() => send({ type: "join" })}>Join the table</button>}
          {snapshot.options.leave && <button onClick={() => send({ type: "leave" })}>Leave the table</button>}
          {!snapshot.isPlayer && <p className="muted small">Join as a player, or stay to watch the clock.</p>}
        </section>
        <section className="pt-panel">
          <h3>Choose a clock</h3>
          <label className="pt-field">Clock<select disabled={!isHost} value={selectedClock?.id ?? ""} onChange={event => {
            const clock = clocks.find(item => item.id === event.target.value);
            if (!clock) return;
            setSelectedClockId(clock.id);
            send({ type: "select_clock", clock, handBoundary });
          }}>{[...clocks].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map(clock => <option key={clock.id} value={clock.id}>Level {clock.level} · {clock.name}</option>)}</select></label>
          {selectedClock && <ClockView
            clock={selectedClock}
            handBoundary={isHost ? handBoundary : snapshot.handBoundary}
            boundarySelection={isHost}
            onSelectBoundary={boundary => {
              setHandBoundary(boundary);
              send({ type: "select_clock", clock: selectedClock, handBoundary: boundary });
            }}
          />}
          {catalogError && <p className="error small">The shared catalog could not be loaded: {catalogError}. Starter clocks remain available.</p>}
          {isHost && <div className="pt-host-start">
            <p className="pt-hand-instruction">Click a boundary on the clock to place the hand.</p>
            <button className="primary" disabled={!selectedClock || snapshot.seats.length < 2} onClick={() => selectedClock && send({ type: "start", clock: selectedClock, handBoundary })}>Begin deliberation</button>
            {snapshot.seats.length < 2 && <p className="muted small">At least two players must join before the host can start.</p>}
          </div>}
        </section>
      </div>
      {isAdmin && <ClockEditor clocks={clocks} onSaved={setClocks} />}
      <p className="pt-style-note">An old clockhouse welcomes you: take your time, speak quietly, and trust the turning gears.</p>
    </div>
  );
}

function Deliberation({ snapshot, isHost, send }: Props) {
  const clock = snapshot.clock;
  if (!clock) return <p className="error">No clock has been selected.</p>;
  return (
    <div className="pass-time-game">
      <header className="pt-header"><div><p className="pt-eyebrow">Deliberation</p><h2>Study the clock</h2><p>Discuss your plan. No cards are visible until play begins.</p></div><span className="pt-phase-stamp">Before the first tick</span></header>
      <ClockView clock={clock} handBoundary={snapshot.handBoundary} boundarySelection={isHost} onSelectBoundary={boundary => send({ type: "set_hand", boundary })} />
      {isHost && <section className="pt-panel pt-deliberation-controls">
        <p className="pt-hand-instruction">Click a boundary on the clock to move the hand.</p>
        <div className="row"><button className="primary" onClick={() => send({ type: "begin" })}>Start play</button></div>
      </section>}
      {!isHost && <p className="muted">Waiting for the host to finish deliberation and start the clock.</p>}
    </div>
  );
}

function Play({ snapshot, userId, isHost, isDisplay, send }: Props) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [huddleText, setHuddleText] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setSelectedCard(null);
    setHint(false);
  }, [snapshot.currentPlayerId, snapshot.totalPlaced]);
  useEffect(() => {
    if (snapshot.gameStep !== "hand-move") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [snapshot.gameStep]);

  const ownTurn = snapshot.currentPlayerId === userId;
  const canPlay = !isDisplay && snapshot.options.play;
  const canMoveHand = !isDisplay && snapshot.gameStep === "hand-move" && snapshot.options.handMove;
  const secondsLeft = snapshot.handMoveEndsAt ? Math.max(0, Math.ceil((snapshot.handMoveEndsAt - now) / 1000)) : 0;
  const seats = snapshot.seats;
  const currentName = seats.find(seat => seat.id === snapshot.currentPlayerId)?.username;
  const clock = snapshot.clock;
  const requiredSegment = clock ? requiredTurnSegment(clock, snapshot.turnNumber + 1) : null;

  if (!clock) return <p className="error">No clock is active.</p>;
  return (
    <div className="pass-time-game">
      <header className="pt-header">
        <div><p className="pt-eyebrow">The clock is turning</p><h2>{snapshot.gameStep === "hand-move" ? "One last adjustment" : "Place your card"}</h2><p>{snapshot.gameStep === "hand-move" ? "The final hand-move window is open." : currentName ? `${currentName} is choosing where to place a card.` : snapshot.turnNumber === 0 ? "Any player may place the first card." : "Waiting for the next turn."}</p></div>
        <div className="pt-hints">Hints remaining <strong>{snapshot.hintsRemaining}</strong></div>
      </header>
      <div className="pt-play-layout">
        <section className="pt-table">
          <ClockView
            clock={clock}
            board={snapshot.board}
            handBoundary={snapshot.handBoundary}
            interactive={canPlay && selectedCard !== null}
            requiredSegment={requiredSegment}
            boundarySelection={canMoveHand}
            lockCurrentBoundary={canMoveHand}
            onSelectBoundary={boundary => {
              if (canMoveHand) send({ type: "hand_move", boundary });
            }}
            onSelectSegment={segment => {
              if (!selectedCard) return;
              send({ type: "play", cardId: selectedCard, segment, hint });
              setSelectedCard(null);
              setHint(false);
            }}
          />
          <div className="pt-turn-order">{seats.map(seat => <span key={seat.id} className={`${seat.id === snapshot.currentPlayerId ? "is-current" : ""}${!seat.connected ? " is-offline" : ""}`}><Person id={seat.id} name={seat.username} size={16} />{seat.pairedWith && <small>with {seats.find(item => item.id === seat.pairedWith)?.username ?? "partner"}</small>}</span>)}</div>
        </section>
        <aside className="pt-panel pt-hand">
          <h3>{snapshot.gameStep === "hand-move" ? "Final hand move" : "Your hand"}</h3>
          {snapshot.gameStep === "cards" && <>
            {snapshot.hand.length === 0 ? <p className="muted">No cards in your shared hand.</p> : <div className="pt-card-hand">{snapshot.hand.map(card => <button key={card.id} aria-label={`${card.value} ${card.color} card`} className={`pt-playing-card ${card.color}${selectedCard === card.id ? " is-selected" : ""}`} disabled={!canPlay} onClick={() => setSelectedCard(card.id)}><span>{card.value}</span></button>)}</div>}
            {canPlay && <div className="pt-place-controls">
              <p>{requiredSegment !== null
                ? `Card #${snapshot.turnNumber + 1} must be placed in Segment ${requiredSegment + 1}.${selectedCard ? ` Selected card: ${snapshot.hand.find(card => card.id === selectedCard)!.value}.` : ""}`
                : selectedCard ? `Selected card: ${snapshot.hand.find(card => card.id === selectedCard)!.value}. Click a clock segment to place it.` : "Select a card, then click a clock segment to place it."}</p>
              {snapshot.hintAllowed && <label className="pt-hint-toggle"><input type="checkbox" checked={hint} onChange={event => setHint(event.target.checked)} /> Reveal this card as a shared hint</label>}
            </div>}
            {!ownTurn && !canPlay && <p className="muted small">Wait for {currentName ?? "the next player"} to place a card.</p>}
          </>}
          {snapshot.gameStep === "hand-move" && <>
            <p>Click an edge between segments to move the hand there. The first player to move it locks the new position. This changes only the incremental-value comparison.</p>
            <div className={`pt-hand-move-timer${secondsLeft <= 5 ? " is-urgent" : ""}`} role="timer" aria-label={`${secondsLeft} seconds remaining`}>
              <span>Time to move the hand</span>
              <strong>00:{String(secondsLeft).padStart(2, "0")}</strong>
              <div className="pt-hand-move-timer-track" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, (secondsLeft / 20) * 100))}%` }} />
              </div>
            </div>
            {snapshot.options.handMove && <>
              <button className="pt-pass-button" onClick={() => send({ type: "pass_hand_move" })}>Pass on moving the hand</button>
            </>}
            {snapshot.passedHandMove.map(id => <span className="pt-passed" key={id}>{seats.find(seat => seat.id === id)?.username ?? "A player"} passed</span>)}
          </>}
          {seats.find(seat => seat.id === userId)?.pairedWith && <section className="pt-huddle">
            <h4>Huddle <small>Private to your pair</small></h4>
            <div className="pt-huddle-messages" aria-live="polite">
              {snapshot.huddleMessages.length === 0 ? <p className="muted small">Plan quietly with your partner.</p> : snapshot.huddleMessages.map(message => <p key={message.id}><strong>{message.username}:</strong> {message.text}</p>)}
            </div>
            {!isDisplay && <form onSubmit={event => {
              event.preventDefault();
              if (!huddleText.trim()) return;
              send({ type: "huddle_send", text: huddleText });
              setHuddleText("");
            }}>
              <input aria-label="Huddle message" value={huddleText} onChange={event => setHuddleText(event.target.value)} maxLength={300} placeholder="Message your pair…" />
              <button type="submit" disabled={!huddleText.trim()}>Send</button>
            </form>}
          </section>}
        </aside>
      </div>
      {isHost && <details className="pt-host-actions">
        <summary>Game host actions</summary>
        <div className="pt-host-actions-content">
          <p>End this attempt and reveal the cards. The game will be recorded as a loss.</p>
          <button className="danger" onClick={() => send({ type: "end_game" })}>End game</button>
        </div>
      </details>}
      <p className="pt-style-note">Keep the clockhouse quiet; each hidden card leaves a little more mystery in the gears.</p>
    </div>
  );
}

function Results({ snapshot, isHost, send }: Props) {
  const clock = snapshot.clock;
  if (!clock) return <p className="error">The finished clock is unavailable.</p>;
  return (
    <div className="pass-time-game">
      <header className={`pt-header pt-result-header ${snapshot.outcome === "won" ? "won" : "lost"}`}>
        <div><p className="pt-eyebrow">The clock has stopped</p><h2>{snapshot.outcome === "won" ? "Time well spent" : "The clock slipped"}</h2><p>{snapshot.outcomeReason}</p></div>
        <span className="pt-phase-stamp">{snapshot.outcome === "won" ? "All rules kept" : "Attempt ended"}</span>
      </header>
      <ClockView clock={clock} board={snapshot.board} handBoundary={snapshot.handBoundary} />
      <section className="pt-panel pt-reveal">
        <h3>Cards revealed</h3>
        <h4>Dealt to players</h4>
        <div className="pt-revealed-hands">{snapshot.results?.dealtHands?.map(hand => {
          const names = hand.playerIds.map(id => snapshot.seats.find(seat => seat.id === id)?.username).filter((name): name is string => !!name);
          const label = names.length > 1 ? `${names.join(" & ")}'s shared hand` : `${names[0] ?? "Player"}'s hand`;
          return <section className="pt-revealed-hand" key={hand.ownerId}>
            <h5>{label}</h5>
            <div className="pt-revealed-cards">{hand.cards.map(card => <span key={card.id} className={`pt-revealed-card ${card.color ?? ""}`}>{card.value}</span>)}</div>
          </section>;
        })}</div>
        <h4>Not dealt to players</h4>
        <div className="pt-revealed-cards">{snapshot.results?.undealtCards?.map(card => <span key={card.id} className={`pt-revealed-card ${card.color ?? ""}`}>{card.value}</span>)}</div>
        {snapshot.board.some(segment => segment.length < 1) && <p className="muted small">A segment left empty is shown above by its card count.</p>}
      </section>
      <div className="pt-result-actions">
        {isHost && <><button className="primary" onClick={() => send({ type: "retry" })}>Retry this clock</button><button onClick={() => send({ type: "back_to_lobby" })}>Return to lobby</button></>}
        {!isHost && <p className="muted">Waiting for the host to retry or return to the lobby.</p>}
      </div>
    </div>
  );
}

export function PassTimeLobby(props: Props) {
  const { snapshot } = props;
  return (
    <div className="pass-time-page">
      {snapshot.phase === "lobby" && <Lobby {...props} />}
      {snapshot.phase === "draft" && <Deliberation {...props} />}
      {snapshot.phase === "playing" && <Play {...props} />}
      {snapshot.phase === "results" && <Results {...props} />}
    </div>
  );
}
