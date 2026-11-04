import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Person } from "../../avatar/Avatar";
import { Modal } from "../../components/Modal";
import { HostControlsTab } from "../../components/HostControlsTab";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps } from "../types";
import type { WerewolvesRoleId, WerewolvesSeat, WerewolvesSnapshot, WerewolvesStep } from "./types";

const iconUrl = (icon: string) => `${import.meta.env.BASE_URL}werewolves/roles/${icon === "wolfdog.svg" ? "wolfchild.svg" : icon}`;
const roleName = (snapshot: WerewolvesSnapshot, role?: WerewolvesRoleId | null) =>
  snapshot.roleCatalog.find(item => item.id === role)?.name ?? "Unknown role";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function formatSubmission(snapshot: WerewolvesSnapshot, step: WerewolvesStep, submission: Record<string, unknown>): string {
  const playerName = (id: unknown) =>
    typeof id === "string" ? snapshot.seats.find(seat => seat.id === id)?.username ?? "Unknown player" : "No player selected";
  const hasChoice = Object.entries(submission).some(([key, value]) =>
    key !== "userId" && (Array.isArray(value) ? value.length > 0 : value !== "")
  );
  if (!hasChoice) return "No choice selected yet";

  switch (step.kind) {
    case "mayor-nominations":
      return submission.candidate === true ? "Running for mayor" : "Not running for mayor";
    case "skip-vote":
      return submission.skip === true ? "Vote to skip the lynch" : "Vote to hold the lynch";
    case "mistrust-vote":
      return Array.isArray(submission.targetIds)
        ? submission.targetIds.map(playerName).join(", ")
        : "No players selected";
    case "mayor-election":
    case "executioner-vote":
    case "executioner-tie":
      return playerName(submission.targetId);
    default:
      if (submission.pass === true) return "Pass";
      if (typeof submission.targetId === "string") return playerName(submission.targetId);
      return "Choice selected";
  }
}

function RoleIcon({ snapshot, role, size = 38 }: { snapshot: WerewolvesSnapshot; role?: WerewolvesRoleId | null; size?: number }) {
  const info = snapshot.roleCatalog.find(item => item.id === role);
  if (!info) return null;
  return <img className="werewolves-role-icon" src={iconUrl(info.icon)} alt="" aria-hidden="true" width={size} height={size} />;
}

function RoleCard({ snapshot, role, selected, onClick, disabled }: {
  snapshot: WerewolvesSnapshot;
  role: WerewolvesRoleId;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const info = snapshot.roleCatalog.find(item => item.id === role);
  if (!info) return null;
  const contents = (
    <>
      <RoleIcon snapshot={snapshot} role={role} size={44} />
      <span><strong>{info.name}</strong><small>{info.faction}</small></span>
    </>
  );
  return onClick
    ? <button type="button" className={`werewolves-role-card ${selected ? "selected" : ""}`} disabled={disabled} onClick={onClick}>{contents}</button>
    : <div className="werewolves-role-card">{contents}</div>;
}

function Rules({ snapshot }: { snapshot: WerewolvesSnapshot }) {
  return (
    <div className="werewolves-rules">
      <h2>How to play</h2>
      <ul>{snapshot.rules.general.map((rule, index) => <li key={index}>{rule}</li>)}</ul>
      <h2>Roles in the pool</h2>
      <div className="werewolves-role-grid">
        {snapshot.rolePool.map(role => {
          const item = snapshot.roleCatalog.find(info => info.id === role);
          return item ? <article className="werewolves-rule-role" key={role}>
            <RoleCard snapshot={snapshot} role={role} />
            <p>{item.rule}</p>
          </article> : null;
        })}
      </div>
      {snapshot.settings.moonCards && <>
        <h2>Moon cards</h2>
        <div className="werewolves-role-grid">{snapshot.rules.moonCards.map(card => <article className="werewolves-rule-role" key={card.id}><h3>{card.name}</h3><p>{card.rule}</p></article>)}</div>
      </>}
    </div>
  );
}

function Lobby({ snapshot, userId, isAdmin, isDisplay, send }: GameLobbyProps<WerewolvesSnapshot>) {
  const [rolePool, setRolePool] = useState(snapshot.settings.rolePool);
  const [wolfCount, setWolfCount] = useState(snapshot.settings.wolfCount);
  const [skipLynch, setSkipLynch] = useState(snapshot.settings.skipLynch);
  const [moonCards, setMoonCards] = useState(snapshot.settings.moonCards);
  const [gmId, setGmId] = useState(snapshot.gm?.id ?? "");
  const [seatOrder, setSeatOrder] = useState<string[]>(snapshot.seats.map(seat => seat.id));
  const [showRules, setShowRules] = useState(false);

  const settingsKey = JSON.stringify(snapshot.settings);
  useEffect(() => {
    setRolePool(snapshot.settings.rolePool);
    setWolfCount(snapshot.settings.wolfCount);
    setSkipLynch(snapshot.settings.skipLynch);
    setMoonCards(snapshot.settings.moonCards);
    setGmId(snapshot.gm?.id ?? "");
  }, [settingsKey, snapshot.gm?.id]);

  useEffect(() => setSeatOrder(snapshot.seats.map(seat => seat.id)), [snapshot.seats.map(seat => seat.id).join(",")]);

  const roleOptions = snapshot.roleCatalog;
  const wolfRoles = roleOptions.filter(role => role.faction === "werewolf");
  const wolfPoolCount = rolePool.filter(role => wolfRoles.some(wolf => wolf.id === role)).length;
  const candidatePeople = useMemo(() => {
    const all = [
      ...snapshot.seats.filter(seat => seat.connected).map(seat => ({ id: seat.id, username: seat.username })),
      ...snapshot.spectators.map(person => ({ id: person.id, username: person.username }))
    ];
    if (!all.some(person => person.id === userId)) all.push({ id: userId, username: "You" });
    return [...new Map(all.map(person => [person.id, person])).values()];
  }, [snapshot.seats, snapshot.spectators, userId]);
  const seat = snapshot.seats.find(item => item.id === userId);
  const inVillage = !!seat;

  const toggleRole = (role: WerewolvesRoleId) => {
    const next = rolePool.includes(role) ? rolePool.filter(item => item !== role) : [...rolePool, role];
    const nextWolfCount = next.filter(item => wolfRoles.some(wolf => wolf.id === item)).length;
    setRolePool(next);
    setWolfCount(count => Math.min(count, nextWolfCount));
  };
  const saveSettings = () => send({ type: "configure", rolePool, wolfCount, skipLynch, moonCards });

  return (
    <>
      <div className="werewolves-heading">
        <div><p className="eyebrow">A social deduction game</p><h2>{snapshot.townName || "Werewolves"}</h2></div>
        <button type="button" onClick={() => setShowRules(true)}>Rules &amp; roles</button>
      </div>
      <div className="werewolves-lobby-grid">
        <section className="card">
          <div className="row between"><h2>Village seats</h2><span className="pill">{snapshot.villageCount}/{snapshot.villageCapacity} roles · {snapshot.maxPlayers} participants max</span></div>
          <p className="muted small">The GM has a separate role-free seat. Extra lobby participants can spectate once all role slots are filled.</p>
          {snapshot.gm && <div className="werewolves-gm-seat"><strong>Game Master</strong><Person id={snapshot.gm.id} name={snapshot.gm.username} size={22} />{snapshot.gm.id === userId && <span className="pill">You</span>}</div>}
          {snapshot.seats.length > 0 ? <ol className="werewolves-lobby-seats">
            {snapshot.seats.map((player, index) => <li key={player.id}>
              <span className="werewolves-seat-number">{index + 1}</span><Person id={player.id} name={player.username} size={22} />
              <span className={`pill ${player.connected ? "" : "muted"}`}>{player.connected ? "Connected" : "Offline"}</span>
              {player.id === userId && <span className="pill">You</span>}
              {!isDisplay && <KickButton id={player.id} name={player.username} isHost={isAdmin} send={send} />}
            </li>)}
          </ol> : <p className="muted">No village players have joined yet.</p>}
          {snapshot.options.join && !isDisplay && <button className="primary" onClick={() => send({ type: "join" })}>Join the village</button>}
          {snapshot.options.leave && !isDisplay && <button onClick={() => send({ type: "leave" })}>Leave village (spectate)</button>}
          {!inVillage && !snapshot.options.join && <p className="muted small">You are spectating. The village role pool is full or the game has started.</p>}
        </section>

        <section className="card">
          <h2>Lobby participants</h2>
          {snapshot.spectators.length
            ? <ul className="names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} size={22} /></li>)}</ul>
            : <p className="muted">No spectators.</p>}
          {snapshot.phase === "lobby" && isAdmin && !isDisplay && <div className="werewolves-admin-gm">
            <label>Assign Game Master
              <select value={gmId} onChange={event => setGmId(event.target.value)}>
                <option value="">Choose a connected participant</option>
                {candidatePeople.map(person => <option key={person.id} value={person.id}>{person.username}{person.id === userId ? " (you)" : ""}</option>)}
              </select>
            </label>
            <button disabled={!gmId} onClick={() => send({ type: "set_gm", userId: gmId })}>Assign GM</button>
          </div>}
          {snapshot.gm?.id === userId && snapshot.seats.length > 1 && <div className="werewolves-order">
            <h3>Set seating order</h3>
            <ol>{seatOrder.map((id, index) => {
              const player = snapshot.seats.find(item => item.id === id);
              if (!player) return null;
              return <li key={id}><span>{index + 1}.</span><Person id={id} name={player.username} size={20} />
                <span className="row">
                  <button disabled={index === 0} aria-label={`Move ${player.username} up`} onClick={() => setSeatOrder(current => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>↑</button>
                  <button disabled={index === seatOrder.length - 1} aria-label={`Move ${player.username} down`} onClick={() => setSeatOrder(current => { const next = [...current]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>↓</button>
                </span>
              </li>;
            })}</ol>
            <button onClick={() => send({ type: "set_order", userIds: seatOrder })}>Save seating order</button>
          </div>}
        </section>
      </div>

      {isAdmin && !isDisplay && snapshot.phase === "lobby" && <HostControlsTab>
        <h3>Game setup</h3>
        <p className="muted small">Each selected role can be dealt once. The role pool also determines the village's maximum capacity.</p>
        <div className="werewolves-role-grid">{roleOptions.map(role => <RoleCard key={role.id} snapshot={snapshot} role={role.id} selected={rolePool.includes(role.id)} onClick={() => toggleRole(role.id)} />)}</div>
        <div className="werewolves-settings">
          <label>Werewolf roles to deal
            <input type="number" min={0} max={wolfPoolCount} value={wolfCount} onChange={event => setWolfCount(Math.min(wolfPoolCount, Math.max(0, Number(event.target.value) || 0)))} />
            <small>{wolfPoolCount} Werewolf role(s) currently in the pool</small>
          </label>
          <label className="werewolves-check"><input type="checkbox" checked={skipLynch} onChange={event => setSkipLynch(event.target.checked)} /> Enable unanimous skip-lynch vote</label>
          <label className="werewolves-check"><input type="checkbox" checked={moonCards} onChange={event => setMoonCards(event.target.checked)} /> Enable daily Moon cards</label>
          <button onClick={saveSettings}>Save game settings</button>
        </div>
        <p className="muted small">The GM starts the game after assigning village seats and setting their order.</p>
      </HostControlsTab>}
      {snapshot.gm?.id === userId && !isDisplay && <HostControlsTab>
        <button className="primary" disabled={!snapshot.options.start} onClick={() => send({ type: "start" })}>Start Werewolves</button>
        {!snapshot.gm && <p className="muted small">An admin must assign a GM before the game can start.</p>}
        {snapshot.settings.rolePool.length < snapshot.villageCount && <p className="error">Add roles to the pool before starting.</p>}
        {snapshot.settings.wolfCount > snapshot.villageCount && <p className="error">The Werewolf count exceeds village seats.</p>}
      </HostControlsTab>}
      {showRules && <Modal title="Werewolves rules and roles" onClose={() => setShowRules(false)} wide><Rules snapshot={snapshot} /></Modal>}
    </>
  );
}

function targetChoices(snapshot: WerewolvesSnapshot, step: WerewolvesStep, actorId?: string): WerewolvesSeat[] {
  let candidates = snapshot.seats.filter(seat => seat.alive && !seat.absent);
  const kind = step.kind;
  if (["old-knight-target", "seer-check", "hunter-shot", "lynch-spare", "mistrust-vote"].includes(kind)) {
    candidates = candidates.filter(seat => seat.id !== actorId);
  }
  if (kind === "lynch-spare") {
    const remaining = Array.isArray(step.data?.remaining) ? step.data.remaining.map(String) : undefined;
    if (remaining) candidates = candidates.filter(seat => remaining.includes(seat.id));
  }
  if (kind === "mayor-election" && snapshot.mayorCandidates.length) {
    candidates = candidates.filter(seat => snapshot.mayorCandidates.includes(seat.id));
  }
  if (kind === "executioner-tie") {
    const tied = Array.isArray(step.data?.candidates) ? step.data.candidates.map(String) : [];
    candidates = candidates.filter(seat => tied.includes(seat.id));
  }
  return candidates;
}

type ActionDraft = {
  targetId: string;
  secondTargetId: string;
  name: string;
  candidate: string;
  boolean: string;
  card: string;
  usePotion: boolean;
  usePoison: boolean;
  pass: boolean;
};

function draftFromAction(action?: Record<string, unknown> | null): ActionDraft {
  const targetIds = Array.isArray(action?.targetIds) ? action.targetIds : [];
  return {
    targetId: typeof action?.targetId === "string" ? action.targetId
      : typeof action?.saveTarget === "string" ? action.saveTarget
        : typeof targetIds[0] === "string" ? targetIds[0] : "",
    secondTargetId: typeof action?.poisonTarget === "string" ? action.poisonTarget
      : typeof targetIds[1] === "string" ? targetIds[1] : "",
    name: typeof action?.name === "string" ? action.name : "",
    candidate: typeof action?.candidate === "boolean" ? (action.candidate ? "yes" : "no") : "",
    boolean: typeof action?.skip === "boolean" ? (action.skip ? "yes" : "no")
      : typeof action?.reveal === "boolean" ? (action.reveal ? "yes" : "no") : "",
    card: typeof action?.card === "string" ? action.card : action?.pass === true ? "pass" : "",
    usePotion: action?.usePotion === true,
    usePoison: action?.usePoison === true,
    pass: action?.pass === true
  };
}

function actionFromDraft(kind: string, draft: ActionDraft, optionCount: number): Record<string, unknown> {
  const target = draft.targetId ? { targetId: draft.targetId } : {};
  switch (kind) {
    case "mayor-nominations":
      return draft.candidate ? { candidate: draft.candidate === "yes" } : {};
    case "town-name":
      return { name: draft.name };
    case "lovers":
      return { targetIds: [draft.targetId, draft.secondTargetId].filter(Boolean) };
    case "alchemist-actions":
      return {
        usePotion: draft.usePotion,
        usePoison: draft.usePoison,
        ...(draft.usePotion && draft.targetId ? { saveTarget: draft.targetId } : {}),
        ...(draft.usePoison && (draft.usePotion ? draft.secondTargetId : draft.targetId)
          ? { poisonTarget: draft.usePotion ? draft.secondTargetId : draft.targetId }
          : {})
      };
    case "big-bad-wolf":
    case "silence-target":
    case "hunter-shot":
    case "wolf-target":
      return draft.pass ? { pass: true } : target;
    case "skip-vote":
      return draft.boolean ? { skip: draft.boolean === "yes" } : {};
    case "moon-offer":
      return draft.card === "pass" ? { pass: true } : draft.card ? { card: draft.card } : {};
    case "mistrust-vote":
      return { targetIds: [draft.targetId, ...(optionCount > 1 ? [draft.secondTargetId] : [])].filter(Boolean) };
    case "judge-intervention":
      return draft.boolean ? { reveal: draft.boolean === "yes" } : {};
    case "good-manners-violation":
      return draft.targetId ? { userId: draft.targetId } : {};
    default:
      return target;
  }
}

function ActionForm({ snapshot, step, actorId, title, submitLabel, initialAction, onSubmit, onChange }: {
  snapshot: WerewolvesSnapshot;
  step: WerewolvesStep;
  actorId?: string;
  title?: string;
  submitLabel?: string;
  initialAction?: Record<string, unknown> | null;
  onSubmit?: (value: Record<string, unknown>) => void;
  onChange?: (value: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState(() => draftFromAction(initialAction));
  const [touched, setTouched] = useState(false);
  const options = targetChoices(snapshot, step, actorId ?? step.actorId ?? step.voterId);
  const { targetId, secondTargetId, name, candidate, boolean, card, usePotion, usePoison, pass } = draft;
  const update = (patch: Partial<ActionDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
    setTouched(true);
  };
  useEffect(() => {
    if (touched && onChange) onChange(actionFromDraft(step.kind, draft, options.length));
  }, [draft, touched]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (onSubmit) onSubmit(actionFromDraft(step.kind, draft, options.length));
  };
  const targetStep = [
    "mayor-election", "new-mayor", "wolfchild-target", "old-knight-target", "guard-check", "seer-check",
    "sniffer-check", "little-girl-check", "silence-target", "ghost-choice", "aid-target", "hunter-shot",
    "executioner-lynch", "executioner-vote", "executioner-tie", "lynch-spare", "lynch-result"
  ].includes(step.kind);
  const selectTarget = (value: string, setValue: (value: string) => void, label: string, choices = options) => (
    <label>{label}<select value={value} onChange={event => setValue(event.target.value)}>
      <option value="">Choose a player</option>
      {choices.map(player => <option key={player.id} value={player.id}>{player.username}</option>)}
    </select></label>
  );

  return <form className="werewolves-action-form" onSubmit={submit}>
    {title && <h4>{title}</h4>}
    {step.kind === "mayor-nominations" && <label>Run for mayor?<select value={candidate} onChange={event => update({ candidate: event.target.value })}><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></label>}
    {step.kind === "town-name" && <label>Town name<input value={name} onChange={event => update({ name: event.target.value })} maxLength={60} /></label>}
    {step.kind === "lovers" && <>
      {selectTarget(targetId, value => update({ targetId: value }), "First lover")}
      {selectTarget(secondTargetId, value => update({ secondTargetId: value }), "Second lover", options.filter(player => player.id !== targetId))}
    </>}
    {step.kind === "alchemist-actions" && <>
      {snapshot.resources?.potion && <label className="werewolves-check"><input type="checkbox" checked={usePotion} onChange={event => update({ usePotion: event.target.checked })} /> Use potion</label>}
      {snapshot.resources?.poison && <label className="werewolves-check"><input type="checkbox" checked={usePoison} onChange={event => update({ usePoison: event.target.checked })} /> Use poison</label>}
      {usePotion && selectTarget(targetId, value => update({ targetId: value }), "Save", snapshot.seats.filter(player => player.alive && !player.absent && (player.id === snapshot.nightResolution?.wolfTarget || player.id === snapshot.nightResolution?.oldKnightSaveTarget)))}
      {usePoison && selectTarget(secondTargetId, value => update({ secondTargetId: value }), "Poison", usePotion ? options.filter(player => player.id !== targetId) : options)}
    </>}
    {targetStep && step.kind !== "lovers" && step.kind !== "alchemist-actions" && step.kind !== "good-manners-violation" && !["big-bad-wolf", "silence-target", "hunter-shot"].includes(step.kind)
      && selectTarget(targetId, value => update({ targetId: value }), step.kind === "lynch-spare" ? "Player to spare" : step.kind === "executioner-vote" ? "Executioner vote" : "Choose a player")}
    {step.kind === "good-manners-violation" && selectTarget(targetId, value => update({ targetId: value }), "Player who interrupted")}
    {step.kind === "big-bad-wolf" && <label className="werewolves-check"><input type="checkbox" checked={pass} onChange={event => update({ pass: event.target.checked })} /> Pass</label>}
    {step.kind === "silence-target" && <label className="werewolves-check"><input type="checkbox" checked={pass} onChange={event => update({ pass: event.target.checked })} /> Do not silence anyone</label>}
    {step.kind === "hunter-shot" && <label className="werewolves-check"><input type="checkbox" checked={pass} onChange={event => update({ pass: event.target.checked })} /> Do not shoot</label>}
    {step.kind === "wolf-target" && <>
      {!pass && selectTarget(targetId, value => update({ targetId: value }), "Werewolf target")}
      <label className="werewolves-check"><input type="checkbox" checked={pass} onChange={event => update({ pass: event.target.checked })} /> Skip the attack</label>
      {snapshot.wolfWarning && <p className="error">Wise Wolf warning: this target is protected or dangerous.</p>}
    </>}
    {["big-bad-wolf", "silence-target", "hunter-shot"].includes(step.kind) && !pass
      && selectTarget(targetId, value => update({ targetId: value }), step.kind === "big-bad-wolf" ? "Kill" : step.kind === "silence-target" ? "Silence" : "Shoot")}
    {step.kind === "executioner-tie" && selectTarget(targetId, value => update({ targetId: value }), "Break the tie")}
    {(step.kind === "skip-vote" || step.kind === "judge-intervention") && <label>{step.kind === "skip-vote" ? "Skip the lynch?" : "Reveal as the Judge?"}
      <select value={boolean} onChange={event => update({ boolean: event.target.value })}><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select>
    </label>}
    {step.kind === "moon-offer" && <label>Moon card<select value={card} onChange={event => update({ card: event.target.value })}>
      <option value="">Choose</option>
      <option value="pass">Pass / no card</option>
      {snapshot.moonOffers.map(id => <option key={id} value={id}>{snapshot.moonCatalog.find(item => item.id === id)?.name ?? id}</option>)}
    </select></label>}
    {step.kind === "mistrust-vote" && <>
      {selectTarget(targetId, value => update({ targetId: value }), "Closest friend")}
      {options.length > 1 && selectTarget(secondTargetId, value => update({ secondTargetId: value }), "Second closest friend", options.filter(player => player.id !== targetId))}
    </>}
    {step.kind === "alchemist-actions" && !usePotion && !usePoison && <p className="muted small">{onChange ? "Leave both unused or select an item; the GM confirms your choice." : "Leave both unused or select an item."}</p>}
    {onSubmit && <button className="primary" type="submit">{submitLabel ?? "Save choice"}</button>}
  </form>;
}

function Circle({ snapshot, userId }: { snapshot: WerewolvesSnapshot; userId: string }) {
  const seats = snapshot.seats;
  const sparedIds = new Set(snapshot.sparedPlayerIds);
  const currentVoterId = snapshot.publicStep?.voterId;
  const lynchTargetId = snapshot.publicStep?.lynchTargetId;
  if (!seats.length) return <p className="muted">No village seats.</p>;
  return <div className="werewolves-circle-wrap"><div className="werewolves-circle">
    <div className="werewolves-circle-table"><strong>{snapshot.townName || "The village"}</strong><span>Day {snapshot.day || 0}</span></div>
    {seats.map((player, index) => {
      const angle = (2 * Math.PI * index / seats.length) - Math.PI / 2;
      const x = 50 + Math.cos(angle) * 42;
      const y = 50 + Math.sin(angle) * 42;
      const isViewer = player.id === userId;
      const isSpared = sparedIds.has(player.id);
      const isCurrentVoter = player.id === currentVoterId;
      const isLynchTarget = player.id === lynchTargetId;
      const showRole = snapshot.isGM || player.publiclyRevealed || (snapshot.phase === "results" && player.role);
      return <div key={player.id} className={`werewolves-circle-seat ${player.alive ? "" : "dead"} ${player.mayor ? "mayor" : ""} ${isViewer ? "self" : ""} ${isSpared ? "spared" : ""} ${isCurrentVoter ? "current-voter" : ""} ${isLynchTarget ? "lynch-target" : ""}`} style={{ left: `${x}%`, top: `${y}%` }}>
        <Person id={player.id} name={player.username} size={23} />
        {player.mayor && <span className="pill">Mayor</span>}
        {isCurrentVoter && <span className="werewolves-voting-mark">Voting now</span>}
        {isSpared && <span className="werewolves-spared-mark">Spared</span>}
        {isLynchTarget && <span className="werewolves-lynch-target-mark">About to be lynched</span>}
        {!player.alive && <span className="werewolves-dead-mark" title="Dead">†</span>}
        {showRole && player.role && <span className="werewolves-seat-role"><RoleIcon snapshot={snapshot} role={player.role} size={25} />{roleName(snapshot, player.role)}</span>}
      </div>;
    })}
  </div></div>;
}

function PlayerActions({ snapshot, userId, send }: Pick<GameLobbyProps<WerewolvesSnapshot>, "snapshot" | "userId" | "send">) {
  const step = snapshot.currentStep ?? (snapshot.privatePrompt ? {
    id: snapshot.privatePrompt.id,
    phase: snapshot.publicStep?.phase ?? "night",
    day: snapshot.day,
    kind: snapshot.privatePrompt.kind,
    prompt: snapshot.privatePrompt.prompt,
    actorMode: "role",
    actorId: userId,
    role: snapshot.privatePrompt.role ?? undefined,
    data: snapshot.privatePrompt.data
  } : null);
  if (!snapshot.canAct || !step) return null;
  const value = isRecord(snapshot.action) ? snapshot.action : null;
  return <section className="card werewolves-player-action">
    <h2>Your private action</h2>
    <p>{snapshot.privatePrompt?.prompt}</p>
    <p className="muted small">{value ? "Your current choice is visible to the GM. You can change it until the GM confirms." : "Choose on your device; the GM sees your current choice and confirms what happens."}</p>
    <ActionForm key={`${step.id}-${userId}`} snapshot={snapshot} step={step} actorId={userId} initialAction={value} onChange={action => send({ type: "select_action", value: action })} />
  </section>;
}

function gmInitialAction(snapshot: WerewolvesSnapshot, step: WerewolvesStep): Record<string, unknown> | null {
  if (step.override) return step.override;
  if (step.kind === "mayor-election") {
    const counts = new Map<string, number>();
    for (const submission of Object.values(step.submissions ?? {})) {
      if (typeof submission.targetId === "string") {
        counts.set(submission.targetId, (counts.get(submission.targetId) ?? 0) + 1);
      }
    }
    const highest = Math.max(0, ...counts.values());
    const leaders = [...counts].filter(([, count]) => count === highest);
    if (leaders.length === 1 && highest > 0) return { targetId: leaders[0][0] };
  }
  const actorId = step.actorId ?? step.voterId ?? snapshot.mayorId ?? undefined;
  if (actorId && step.submissions?.[actorId]) return step.submissions[actorId] ?? null;
  const submissions = Object.values(step.submissions ?? {});
  if (step.kind === "wolf-target" && submissions.length) return submissions[0];
  if (typeof step.targetId === "string") return { targetId: step.targetId };
  return null;
}

const GM_CHOICE_STEPS = new Set([
  "mayor-election", "new-mayor", "town-name", "lovers", "wolfchild-target", "old-knight-target",
  "guard-check", "seer-check", "sniffer-check", "little-girl-check", "wolf-target", "silence-target",
  "alchemist-actions", "big-bad-wolf", "moon-offer", "ghost-choice", "executioner-lynch",
  "executioner-tie", "aid-target", "hunter-shot", "judge-intervention", "lynch-spare",
  "lynch-result", "mayor-nominations", "skip-vote", "mistrust-vote", "executioner-vote"
]);

function GMControls({ snapshot, userId, send }: Pick<GameLobbyProps<WerewolvesSnapshot>, "snapshot" | "userId" | "send">) {
  const step = snapshot.currentStep;
  const [groupUser, setGroupUser] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { setGroupUser(""); setNotice(""); }, [step?.id]);
  if (!snapshot.isGM || !step || snapshot.phase !== "playing") return null;

  const groupAction = step.actorMode === "living" || step.actorMode === "voter";
  const submitGM = (value: Record<string, unknown>) => {
    send({ type: "gm_action", value });
    setNotice("GM input recorded.");
  };
  const membersForStep = groupAction
    ? step.actorMode === "voter"
      ? snapshot.seats.filter(seat => seat.id === step.voterId && seat.alive)
      : snapshot.seats.filter(seat => seat.alive && !seat.absent)
    : [];
  const selectedMember = membersForStep.find(seat => seat.id === groupUser) ?? membersForStep[0];
  const showDirect = GM_CHOICE_STEPS.has(step.kind)
    && (!groupAction || step.kind === "wolf-target" || step.kind === "mayor-election");
  const initialGMAction = gmInitialAction(snapshot, step);
  const gmActionStep = { ...step, actorId: step.actorId ?? step.voterId ?? userId };
  const nightResolutionSummary = snapshot.gmActions?.nightResolutionSummary;

  return <HostControlsTab>
    <div className="werewolves-gm-panel">
      <div className="werewolves-step-head">
        <span className="pill">{step.phase} · Day {step.day}</span>
        <span className="pill">{step.kind}</span>
      </div>
      <h2>Game Master: current step</h2>
      <p className="werewolves-step-prompt">{step.prompt}</p>
      {snapshot.publicStep?.lynchTargetId && <p className="werewolves-lynch-announcement">
        {snapshot.seats.find(player => player.id === snapshot.publicStep?.lynchTargetId)?.username ?? "The selected player"} is about to be lynched.
      </p>}
      {isRecord(nightResolutionSummary) && Array.isArray(nightResolutionSummary.events) && <div className="werewolves-submissions">
        <h3>Night events for the GM</h3>
        <p className="muted small">GM-only resolution notes. Keep hidden roles and actions private unless the rules call for revealing them.</p>
        <ol>{nightResolutionSummary.events.map((event, index) => <li key={index}>{String(event)}</li>)}</ol>
      </div>}
      {(step.kind === "day-check" || step.kind.startsWith("day-check-after")) && isRecord(snapshot.gmActions?.lastWinCheck) && <div className="werewolves-submissions">
        <h3>Win condition check — GM announcement</h3>
        <p><strong>{snapshot.gmActions.lastWinCheck.winner === null
          ? "The game continues."
          : snapshot.gmActions.lastWinCheck.winner === "draw"
            ? "The game is a draw."
            : `The ${snapshot.gmActions.lastWinCheck.winner} win.`}</strong></p>
        <p>{String(snapshot.gmActions.lastWinCheck.reason)}</p>
        <p className="muted small">
          Remaining for the check: {String(snapshot.gmActions.lastWinCheck.werewolves)} Werewolf-aligned,
          {" "}{String(snapshot.gmActions.lastWinCheck.villagers)} Villager-aligned,
          {" "}{String(snapshot.gmActions.lastWinCheck.living)} alive. The Fool is excluded from faction counts.
        </p>
      </div>}
      {step.kind === "wolf-target" && <div className="werewolves-submissions">
        <strong>Werewolf submissions</strong>
        {snapshot.seats.filter(player => player.alive && !player.absent && player.faction === "werewolf").map(player => {
          const submission = step.submissions?.[player.id];
          return <p key={player.id}>{player.username}: {submission ? formatSubmission(snapshot, step, submission) : "Waiting"}</p>;
        })}
        {!snapshot.seats.some(player => player.alive && !player.absent && player.faction === "werewolf")
          && <p className="muted">No living Werewolves can choose a target.</p>}
        {step.wiseWolfWarning && <p className="error">Wise Wolf warning: a current target choice is dangerous. The wolves may still keep it unanimously.</p>}
      </div>}
      {groupAction && <div className="werewolves-submissions">
        <strong>Players’ current choices</strong>
        {membersForStep.map(player => {
          const submission = step.submissions?.[player.id];
          return <p key={player.id}>{player.username}: {submission ? formatSubmission(snapshot, step, submission) : "Waiting"}</p>;
        })}
        {membersForStep.length > 0 && <div className="werewolves-gm-entry">
          <label>Record or update a choice for
            <select value={selectedMember?.id ?? ""} onChange={event => setGroupUser(event.target.value)}>
              {membersForStep.map(player => <option key={player.id} value={player.id}>{player.username}{step.submissions?.[player.id] ? " (choice selected)" : ""}</option>)}
            </select>
          </label>
          {selectedMember && <ActionForm
            key={`${step.id}-${selectedMember.id}-${JSON.stringify(step.submissions?.[selectedMember.id] ?? null)}`}
            snapshot={snapshot}
            step={step}
            actorId={selectedMember.id}
            title="Edit this player's choice"
            submitLabel="Save GM choice"
            initialAction={step.submissions?.[selectedMember.id] ?? null}
            onSubmit={value => submitGM({ forUserId: selectedMember.id, vote: value })}
          />}
        </div>}
      </div>}
      {showDirect && <div className="werewolves-gm-entry">
        <ActionForm key={`${step.id}-gm-${JSON.stringify(initialGMAction)}`} snapshot={snapshot} step={gmActionStep} actorId={gmActionStep.actorId} title="GM choice (prefilled from the player's current choice)" initialAction={initialGMAction} submitLabel="Use this GM choice" onSubmit={submitGM} />
      </div>}
      {step.optional && <p className="muted small">Optional step: confirm to pass, or select a GM choice before confirming.</p>}
      {notice && <p className="muted small">{notice}</p>}
      <button className="primary" onClick={() => send({ type: "confirm_step" })}>Confirm step and continue</button>
      {snapshot.stepsRemaining && snapshot.stepsRemaining.length > 1 && <details className="werewolves-step-list">
        <summary>Upcoming steps this phase ({snapshot.stepsRemaining.length - 1})</summary>
        <ol>{snapshot.stepsRemaining.slice(1).map(item => <li key={item.id}>{item.prompt}</li>)}</ol>
      </details>}
      {snapshot.upcomingSteps?.map((group, index) => <details className="werewolves-step-list" key={index}>
        <summary>Next {group.phase}</summary><ol>{group.steps.map(item => <li key={item}>{item}</li>)}</ol>
      </details>)}
      {snapshot.settings.moonCards && step.kind === "discussion" && <p className="muted small">Mark rule violations by selecting the player in the village list below.</p>}
    </div>
  </HostControlsTab>;
}

function ActiveGame({ snapshot, userId, isAdmin, isDisplay, send }: Pick<GameLobbyProps<WerewolvesSnapshot>, "snapshot" | "userId" | "isAdmin" | "isDisplay" | "send">) {
  const [showSecret, setShowSecret] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const viewer = snapshot.viewer;
  const role = viewer?.role ? snapshot.roleCatalog.find(item => item.id === viewer.role) : undefined;
  const gm = snapshot.isGM;
  const privateDataVisible = gm || showSecret;
  const currentStep = snapshot.currentStep;
  const currentKind = currentStep?.kind;

  return <>
    <div className="werewolves-game-header">
      <div><p className="eyebrow">{snapshot.publicStep?.phase ?? snapshot.phase} · Day {snapshot.day || 0}</p><h2>{snapshot.townName || "The village"}</h2></div>
      <div className="row">
        {!isDisplay && !gm && <button className="werewolves-secret-button" aria-pressed={showSecret} onClick={() => setShowSecret(value => !value)}>{showSecret ? "Hide secret role" : "Show secret role"}</button>}
        <button onClick={() => setShowRules(true)}>Rules &amp; roles</button>
      </div>
    </div>
    {role && <div className={`werewolves-private-role ${role.faction}`}>
      {privateDataVisible
        ? <><RoleIcon snapshot={snapshot} role={role.id} size={56} /><div><strong>{role.name}</strong><p>{role.rule}</p>{viewer?.role === "wolfchild" && <small>Your current faction: {viewer.faction}</small>}</div></>
        : <p>Your role is hidden. Use “Show secret role” when it’s safe to view it.</p>}
    </div>}
    {gm && <p className="werewolves-gm-banner"><strong>You are the Game Master.</strong> Private roles and game actions are shown only on your GM view.</p>}
    <div className="werewolves-public-step"><span className="pill">{snapshot.publicStep?.phase ?? "game"}</span><strong>{snapshot.publicStep?.prompt ?? "The game is in progress."}</strong></div>
    <Circle snapshot={snapshot} userId={userId} />
    {snapshot.publicActions.bearGrowl && <p className="werewolves-status">{snapshot.publicActions.bearGrowl.growl ? "The Bearman's bear growls." : "The Bearman's bear does not growl."}</p>}
    {snapshot.publicActions.moonCardName && <p className="werewolves-status">Today's Moon card: <strong>{snapshot.publicActions.moonCardName}</strong></p>}
    {snapshot.lovers?.includes(userId) && <p className="werewolves-status">You are in love with {snapshot.seats.find(seat => seat.id === snapshot.lovers?.find(id => id !== userId))?.username ?? "your partner"}.</p>}
    {privateDataVisible && snapshot.privateResults && Object.keys(snapshot.privateResults).length > 0 && <section className="card werewolves-private-results">
      <h3>Private results</h3>
      {Object.entries(snapshot.privateResults).map(([key, value]) => <p key={key}><strong>{key.replaceAll("-", " ")}:</strong> {isRecord(value) ? JSON.stringify(value) : String(value)}</p>)}
    </section>}
    <PlayerActions {...{ snapshot, userId, send }} />
    <GMControls {...{ snapshot, userId, send }} />

    {snapshot.isGM && <section className="card werewolves-gm-seats">
      <h2>Private role list</h2>
      <ul className="werewolves-player-list">{snapshot.seats.map(player => <li key={player.id} className={`${player.alive ? "" : "dead"} ${player.silenced ? "silenced" : ""}`}>
        <Person id={player.id} name={player.username} size={24} />
        <span>{roleName(snapshot, player.role)}{player.faction ? ` · ${player.faction}` : ""}</span>
        <span>{player.alive ? "Alive" : "Dead"}{player.silenced ? " · Silenced" : ""}{player.absent ? " · Away" : ""}</span>
        {currentKind === "discussion" && snapshot.settings.moonCards && player.alive && <button className="small" onClick={() => send({ type: "record_violation", userId: player.id })}>Record interruption</button>}
      </li>)}</ul>
      {currentKind === "death-reveal" && currentStep && <p className="muted">Reveal: {snapshot.seats.find(seat => seat.id === currentStep.targetId)?.username ?? "selected player"}. Confirm the current step when ready.</p>}
    </section>}

    <section className="card werewolves-events">
      <h2>Village events</h2>
      {snapshot.events.length ? <ol>{[...snapshot.events].reverse().map((event, index) => <li key={`${event}-${index}`}>{event}</li>)}</ol> : <p className="muted">No public events yet.</p>}
      {snapshot.deaths.length > 0 && <><h3>Deaths</h3><ul>{[...snapshot.deaths].sort((a, b) => a.order - b.order).map(death => <li key={`${death.userId}-${death.order}`}>{death.username}{death.role && !snapshot.buried ? ` — ${roleName(snapshot, death.role)}` : ""}</li>)}</ul></>}
    </section>

    {snapshot.result && <section className="card werewolves-results">
      <h2>{snapshot.result.winner === "draw" ? "The game is a draw" : snapshot.result.winner === "lovers" ? "The lovers win!" : `The ${snapshot.result.winner} win!`}</h2>
      <ul>{snapshot.results?.map(player => <li key={player.id} className={player.won ? "winner" : ""}>
        <Person id={player.id} name={player.username} size={22} />
        <RoleIcon snapshot={snapshot} role={player.role} size={28} />{roleName(snapshot, player.role)}
        {player.won ? " · Winner" : ""}
      </li>)}</ul>
      {isAdmin && !isDisplay && <button className="primary" onClick={() => send({ type: "close_results" })}>Return to lobby</button>}
    </section>}
    {showRules && <Modal title="Werewolves rules and roles" onClose={() => setShowRules(false)} wide><Rules snapshot={snapshot} /></Modal>}
  </>;
}

export function WerewolvesLobby(props: GameLobbyProps<WerewolvesSnapshot>) {
  const { snapshot } = props;
  return <div className="werewolves-game">
    {snapshot.phase === "lobby"
      ? <Lobby {...props} />
      : <ActiveGame {...props} />}
  </div>;
}
