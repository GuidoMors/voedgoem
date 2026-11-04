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
    ? <button type="button" className={`werewolves-role-card ${info.faction} ${selected ? "selected" : ""}`} aria-pressed={selected} disabled={disabled} onClick={onClick}>{contents}</button>
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
          return item ? <article className={`werewolves-rule-role ${item.faction}`} key={role}>
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
  const [showRules, setShowRules] = useState(false);

  const settingsKey = JSON.stringify(snapshot.settings);
  useEffect(() => {
    setRolePool(snapshot.settings.rolePool);
    setWolfCount(snapshot.settings.wolfCount);
    setSkipLynch(snapshot.settings.skipLynch);
    setMoonCards(snapshot.settings.moonCards);
    setGmId(snapshot.gm?.id ?? "");
  }, [settingsKey, snapshot.gm?.id]);

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
  const moveSeat = (index: number, direction: -1 | 1) => {
    const userIds = snapshot.seats.map(player => player.id);
    const destination = index + direction;
    if (destination < 0 || destination >= userIds.length) return;
    [userIds[index], userIds[destination]] = [userIds[destination], userIds[index]];
    send({ type: "set_order", userIds });
  };

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
              {snapshot.gm?.id === userId && !isDisplay && <span className="row">
                <button type="button" disabled={index === 0} aria-label={`Move ${player.username} up`} onClick={() => moveSeat(index, -1)}>↑</button>
                <button type="button" disabled={index === snapshot.seats.length - 1} aria-label={`Move ${player.username} down`} onClick={() => moveSeat(index, 1)}>↓</button>
              </span>}
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
  if (kind === "wolf-target") {
    candidates = candidates.filter(seat => seat.faction !== "werewolf" && !seat.packRevealed);
  }
  if (kind === "silence-target") {
    const eligible = Array.isArray(step.data?.eligibleTargetIds) ? step.data.eligibleTargetIds : [];
    candidates = candidates.filter(seat => eligible.includes(seat.id));
  }
  if (["old-knight-target", "seer-check", "hunter-shot", "lynch-spare", "mistrust-vote", "fool-win"].includes(kind)) {
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

function ActionForm({ snapshot, step, actorId, title, submitLabel, initialAction, onSubmit, onChange, inline = false }: {
  snapshot: WerewolvesSnapshot;
  step: WerewolvesStep;
  actorId?: string;
  title?: string;
  submitLabel?: string;
  initialAction?: Record<string, unknown> | null;
  onSubmit?: (value: Record<string, unknown>) => void;
  onChange?: (value: Record<string, unknown>) => void;
  inline?: boolean;
}) {
  const [draft, setDraft] = useState(() => draftFromAction(initialAction));
  const [touched, setTouched] = useState(false);
  const recordedName = typeof initialAction?.name === "string" ? initialAction.name : "";
  useEffect(() => {
    if (step.kind !== "town-name") return;
    setDraft(current => current.name === recordedName ? current : { ...current, name: recordedName });
    setTouched(false);
  }, [step.kind, recordedName]);
  const options = targetChoices(snapshot, step, actorId ?? step.actorId ?? step.voterId);
  const { targetId, secondTargetId, name, candidate, boolean, card, usePotion, usePoison, pass } = draft;
  const update = (patch: Partial<ActionDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
    setTouched(true);
  };
  useEffect(() => {
    if (!touched || !onChange) return;
    const action = actionFromDraft(step.kind, draft, options.length);
    if (inline) {
      if (step.kind === "town-name" && !name.trim()) return;
      if (["lovers", "mistrust-vote"].includes(step.kind)) {
        const targets = action.targetIds as string[];
        const needed = step.kind === "lovers" ? 2 : Math.min(2, options.length);
        if (targets.length !== needed || new Set(targets).size !== targets.length) return;
      }
      if (step.kind === "alchemist-actions" && ((usePotion && !action.saveTarget) || (usePoison && !action.poisonTarget))) return;
      if (Object.keys(action).length === 0) return;
    }
    onChange(action);
  }, [draft, touched]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (onSubmit) onSubmit(actionFromDraft(step.kind, draft, options.length));
  };
  const targetStep = [
    "mayor-election", "new-mayor", "fool-win", "wolfchild-target", "old-knight-target", "guard-check", "seer-check",
    "sniffer-check", "little-girl-check", "silence-target", "ghost-choice", "aid-target", "hunter-shot",
    "executioner-lynch", "executioner-vote", "executioner-tie", "lynch-spare", "lynch-result"
  ].includes(step.kind);
  const selectTarget = (value: string, setValue: (value: string) => void, label: string, choices = options) => inline ? (
    <div role="group" aria-label={label} className="werewolves-inline-options">
      {["lovers", "mistrust-vote", "alchemist-actions"].includes(step.kind) && <span>{label}</span>}
      {choices.map(player => <button key={player.id} type="button" aria-pressed={!pass && value === player.id}
        onClick={() => { if (pass) update({ pass: false }); setValue(player.id); }}>
        {snapshot.isGM && <RoleIcon snapshot={snapshot} role={player.role} size={24} />}
        {player.username}
      </button>)}
    </div>
  ) : (
    <label>{label}<select value={value} onChange={event => setValue(event.target.value)}>
      <option value="">Choose a player</option>
      {choices.map(player => <option key={player.id} value={player.id}>{player.username}</option>)}
    </select></label>
  );
  const passControl = (label: string) => inline
    ? <button type="button" aria-pressed={pass} onClick={() => update({ pass: true })}>{label}</button>
    : <label className="werewolves-check"><input type="checkbox" checked={pass} onChange={event => update({ pass: event.target.checked })} /> {label}</label>;

  return <form className={`werewolves-action-form${inline ? " werewolves-action-inline" : ""}`} onSubmit={submit}>
    {title && <h4>{title}</h4>}
    {step.kind === "mayor-nominations" && <div role="group" aria-label="Run for mayor?">
      {!inline && <span>Run for mayor?</span>}
      <div className="row">
        <button type="button" aria-pressed={candidate === "yes"} onClick={() => update({ candidate: "yes" })}>Yes</button>
        <button type="button" aria-pressed={candidate === "no"} onClick={() => update({ candidate: "no" })}>No</button>
      </div>
    </div>}
    {step.kind === "town-name" && <label>Town name<input value={name} onChange={event => update({ name: event.target.value })} maxLength={60} /></label>}
    {step.kind === "lovers" && <>
      {selectTarget(targetId, value => update({ targetId: value }), "First lover")}
      {selectTarget(secondTargetId, value => update({ secondTargetId: value }), "Second lover", options.filter(player => player.id !== targetId))}
    </>}
    {step.kind === "alchemist-actions" && <>
      <div className="row werewolves-potion-controls">
      {snapshot.resources?.potion && (inline
        ? <button type="button" aria-pressed={usePotion} onClick={() => update({ usePotion: !usePotion })}>Use potion</button>
        : <label className="werewolves-check"><input type="checkbox" checked={usePotion} onChange={event => update({ usePotion: event.target.checked })} /> Use potion</label>)}
      {snapshot.resources?.poison && (inline
        ? <button type="button" aria-pressed={usePoison} onClick={() => update({ usePoison: !usePoison })}>Use poison</button>
        : <label className="werewolves-check"><input type="checkbox" checked={usePoison} onChange={event => update({ usePoison: event.target.checked })} /> Use poison</label>)}
      {inline && <button type="button" aria-pressed={!!initialAction && !usePotion && !usePoison} onClick={() => update({ usePotion: false, usePoison: false })}>Use neither</button>}
      </div>
      {usePotion && <div className="werewolves-potion-targets">
        {selectTarget(targetId, value => update({ targetId: value }), "Save", snapshot.seats.filter(player => player.alive && !player.absent && (player.id === snapshot.nightResolution?.wolfTarget || player.id === snapshot.nightResolution?.oldKnightSaveTarget)))}
      </div>}
      {usePoison && <div className="werewolves-potion-targets">
        {selectTarget(inline && !usePotion ? targetId : secondTargetId, value => update(inline && !usePotion ? { targetId: value } : { secondTargetId: value }), "Poison", usePotion ? options.filter(player => player.id !== targetId) : options)}
      </div>}
    </>}
    {targetStep && step.kind !== "lovers" && step.kind !== "alchemist-actions" && step.kind !== "good-manners-violation" && !["big-bad-wolf", "silence-target", "hunter-shot"].includes(step.kind)
      && selectTarget(targetId, value => update({ targetId: value }), step.kind === "lynch-spare" ? "Player to spare" : step.kind === "executioner-vote" ? "Executioner vote" : "Choose a player")}
    {step.kind === "good-manners-violation" && selectTarget(targetId, value => update({ targetId: value }), "Player who interrupted")}
    {step.kind === "big-bad-wolf" && passControl("Pass")}
    {step.kind === "silence-target" && passControl("Do not silence anyone")}
    {step.kind === "hunter-shot" && passControl("Do not shoot")}
    {step.kind === "wolf-target" && <>
      {(inline || !pass) && selectTarget(targetId, value => update({ targetId: value }), "Werewolf target")}
      {passControl("Skip the attack")}
      {snapshot.wolfWarning && <p className="error">Wise Wolf warning: this target is protected or dangerous.</p>}
    </>}
    {["big-bad-wolf", "silence-target", "hunter-shot"].includes(step.kind) && (inline || !pass)
      && selectTarget(targetId, value => update({ targetId: value }), step.kind === "big-bad-wolf" ? "Kill" : step.kind === "silence-target" ? "Silence" : "Shoot")}
    {step.kind === "executioner-tie" && !inline && selectTarget(targetId, value => update({ targetId: value }), "Break the tie")}
    {(step.kind === "skip-vote" || step.kind === "judge-intervention") && (inline
      ? <div role="group" aria-label={step.kind === "skip-vote" ? "Skip the lynch?" : "Reveal as the Judge?"} className="row">
        <button type="button" aria-pressed={boolean === "yes"} onClick={() => update({ boolean: "yes" })}>Yes</button>
        <button type="button" aria-pressed={boolean === "no"} onClick={() => update({ boolean: "no" })}>No</button>
      </div>
      : <label>{step.kind === "skip-vote" ? "Skip the lynch?" : "Reveal as the Judge?"}
      <select value={boolean} onChange={event => update({ boolean: event.target.value })}><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select>
    </label>)}
    {step.kind === "moon-offer" && (inline ? <div role="group" aria-label="Moon card" className="row">
      <button type="button" aria-pressed={card === "pass"} onClick={() => update({ card: "pass" })}>Pass / no card</button>
      {snapshot.moonOffers.map(id => <button key={id} type="button" aria-pressed={card === id} onClick={() => update({ card: id })}>
        {snapshot.moonCatalog.find(item => item.id === id)?.name ?? id}
      </button>)}
    </div> : <label>Moon card<select value={card} onChange={event => update({ card: event.target.value })}>
      <option value="">Choose</option>
      <option value="pass">Pass / no card</option>
      {snapshot.moonOffers.map(id => <option key={id} value={id}>{snapshot.moonCatalog.find(item => item.id === id)?.name ?? id}</option>)}
    </select></label>)}
    {step.kind === "mistrust-vote" && <>
      {selectTarget(targetId, value => update({ targetId: value }), "Closest friend")}
      {options.length > 1 && selectTarget(secondTargetId, value => update({ secondTargetId: value }), "Second closest friend", options.filter(player => player.id !== targetId))}
    </>}
    {step.kind === "alchemist-actions" && !usePotion && !usePoison && <p className="muted small">{onChange ? "Leave both unused or select an item; the GM confirms your choice." : "Leave both unused or select an item."}</p>}
    {onSubmit && <button className="primary" type="submit">{submitLabel ?? "Save choice"}</button>}
  </form>;
}

function Circle({ snapshot, userId, showLovers, showImitation }: { snapshot: WerewolvesSnapshot; userId: string; showLovers: boolean; showImitation: boolean }) {
  const seats = snapshot.seats;
  const sparedIds = new Set(snapshot.sparedPlayerIds);
  const currentVoterId = snapshot.publicStep?.voterId;
  const lynchTargetId = snapshot.publicStep?.lynchTargetId;
  const imitationTargetId = showImitation ? snapshot.wolfchildTarget : null;
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
      const showRole = snapshot.isGM || player.publiclyRevealed || player.packRevealed || (snapshot.phase === "results" && player.role);
      const faction = player.faction ?? (player.role === "wolfchild" ? "villager" : snapshot.roleCatalog.find(role => role.id === player.role)?.faction);
      return <div key={player.id} className={`werewolves-circle-seat ${player.alive ? "" : "dead"} ${player.mayor ? "mayor" : ""} ${isViewer ? "self" : ""} ${isSpared ? "spared" : ""} ${isCurrentVoter ? "current-voter" : ""} ${isLynchTarget ? "lynch-target" : ""} ${player.id === imitationTargetId ? "imitated" : ""} ${showLovers && snapshot.lovers?.includes(player.id) ? "lover" : ""} ${player.throatCut ? "throat-cut" : ""}`} style={{ left: `${x}%`, top: `${y}%` }}>
        <Person id={player.id} name={player.username} size={23} />
        {player.mayor && <span className="pill">Mayor</span>}
        {player.throatCut && <span className="pill">Throat cut · Cannot speak</span>}
        {isCurrentVoter && <span className="werewolves-voting-mark">Voting now</span>}
        {isSpared && <span className="werewolves-spared-mark">Spared</span>}
        {isLynchTarget && <span className="werewolves-lynch-target-mark">About to be lynched</span>}
        {player.inactive && <span className="pill">Won · Out of play</span>}
        {!player.alive && !player.inactive && <span className="werewolves-dead-mark" title="Dead">†</span>}
        {showRole && player.role && <span className={`werewolves-seat-role ${faction ?? ""}`}><RoleIcon snapshot={snapshot} role={player.role} size={25} />{roleName(snapshot, player.role)}</span>}
      </div>;
    })}
  </div></div>;
}

const PRIVATE_RESULT_STEPS = new Set(["seer-result", "sniffer-result", "guard-result", "little-girl-result", "feeling-watched"]);
const resultObserver = (step: WerewolvesStep) => ({
  "seer-result": "Seer", "sniffer-result": "Sniffer", "guard-result": "Guard", "little-girl-result": "Little Girl", "feeling-watched": "imitated player"
}[step.kind] ?? "Player");

function RoleCheckResult({ snapshot, step }: { snapshot: WerewolvesSnapshot; step: WerewolvesStep }) {
  if (step.kind === "feeling-watched") return <div className="werewolves-sniffer-result">
    <h3>Feeling watched</h3>
    <p>{snapshot.isGM
      ? `${snapshot.seats.find(player => player.id === step.data?.targetId)?.username ?? "The chosen player"} is being imitated by a Wolfchild. Wait for their acknowledgement.`
      : "A Wolfchild has chosen to imitate you. Confirm when you have seen this message."}</p>
  </div>;
  const revealedRole = snapshot.roleCatalog.find(role => role.id === step.data?.role);
  const target = snapshot.seats.find(player => player.id === step.data?.targetId);
  return <div className="werewolves-sniffer-result">
    <h3>{resultObserver(step)} result</h3>
    <p>{target?.username ?? "The checked player"}: {step.kind === "little-girl-result"
      ? <strong>{step.data?.visited
        ? `Visited: ${Array.isArray(step.data.visitedIds) && step.data.visitedIds.length
          ? step.data.visitedIds.map(id => snapshot.seats.find(player => player.id === id)?.username ?? String(id)).join(", ")
          : "a player (destination was not recorded)"}.`
        : "Did not visit anyone tonight."}</strong>
      : step.kind === "guard-result"
      ? <strong>{step.data?.result === "thumbs-up" ? "Thumbs-up — the dog detected a Werewolf." : "Thumbs-down — the dog did not detect a Werewolf."}</strong>
      : revealedRole
      ? <span className={`werewolves-revealed-role ${revealedRole.faction}`}><RoleIcon snapshot={snapshot} role={revealedRole.id} size={44} /> <strong>{revealedRole.name}</strong></span>
      : <strong>{step.kind === "seer-result" ? "Thumbs-down — this player's role is hidden from the Seer." : "Thumbs-down — a Werewolf on the first night. Check another player after this step."}</strong>}</p>
  </div>;
}

function ResultConfirmation({ value, onChange }: { value?: Record<string, unknown> | null; onChange: (value: Record<string, unknown>) => void }) {
  return <div className="werewolves-action-inline" role="group" aria-label="Seen the private result?">
    <button type="button" aria-pressed={value?.acknowledged === true} onClick={() => onChange({ acknowledged: true })}>Seen it</button>
    <button type="button" aria-pressed={value?.acknowledged === false} onClick={() => onChange({ acknowledged: false })}>Not yet</button>
  </div>;
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
  if (PRIVATE_RESULT_STEPS.has(step.kind)) return <section className="card werewolves-player-action">
    <RoleCheckResult snapshot={snapshot} step={step} />
    <ResultConfirmation value={value} onChange={value => send({ type: "select_action", value })} />
    <p className="muted small">The GM can continue after the result is marked as seen.</p>
  </section>;
  return <section className="card werewolves-player-action">
    <p>{snapshot.privatePrompt?.prompt}</p>
    <ActionForm key={`${step.id}-${userId}-${step.kind === "town-name" ? "" : JSON.stringify(value)}`} snapshot={snapshot} step={step} actorId={userId} inline initialAction={value} onChange={action => send({ type: "select_action", value: action })} />
  </section>;
}

function gmInitialAction(snapshot: WerewolvesSnapshot, step: WerewolvesStep): Record<string, unknown> | null {
  if (step.kind === "lynch-result" && step.targetId) return { targetId: step.targetId };
  if (step.override) return step.override;
  const actorId = step.actorId ?? step.voterId ?? snapshot.mayorId ?? undefined;
  if (actorId && step.submissions?.[actorId]) return step.submissions[actorId] ?? null;
  return null;
}

const GM_CHOICE_STEPS = new Set([
  "mayor-election", "new-mayor", "fool-win", "town-name", "lovers", "wolfchild-target", "old-knight-target",
  "guard-check", "seer-check", "sniffer-check", "little-girl-check", "wolf-target", "silence-target",
  "alchemist-actions", "big-bad-wolf", "moon-offer", "ghost-choice", "executioner-lynch",
  "executioner-tie", "aid-target", "hunter-shot", "judge-intervention", "lynch-spare",
  "lynch-result", "mayor-nominations", "skip-vote", "mistrust-vote", "executioner-vote"
]);

function confirmationSummary(snapshot: WerewolvesSnapshot, step: WerewolvesStep): string {
  const playerName = (id: unknown) => snapshot.seats.find(player => player.id === id)?.username ?? String(id);
  if (step.kind === "lynch-result" && step.targetId) return `Lynch: ${playerName(step.targetId)}`;
  const formatValue = (value: unknown): string => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.map(playerName).join(" + ");
    return playerName(value);
  };
  const describe = (action: Record<string, unknown>): string => {
    if (action.pass === true) return step.kind === "wolf-target" ? "Skip the attack" : "Pass";
    const labels: Record<string, string> = {
      targetId: "Target", targetIds: "Targets", candidate: "Run for mayor", skip: "Skip lynch",
      reveal: "Reveal Judge", acknowledged: "Seen it", name: "Town name",
      usePotion: "Use potion", usePoison: "Use poison", saveTarget: "Save", poisonTarget: "Poison", card: "Moon card"
    };
    return Object.entries(action).filter(([key]) => key !== "userId" && key !== "pass")
      .map(([key, value]) => `${labels[key] ?? key}: ${key === "card"
        ? snapshot.moonCatalog.find(card => card.id === value)?.name ?? String(value)
        : key === "name" ? String(value) : formatValue(value)}`).join("; ") || "No choice recorded";
  };
  const submissions = step.submissions ?? {};
  const participants = snapshot.seats.filter(player => player.alive && !player.absent
    && (step.kind !== "wolf-target" || player.faction === "werewolf"));
  if (step.kind === "wolf-target") {
    if (step.override) return describe(step.override);
    if (!participants.length) return "No participating Werewolves — no attack";
    if (participants.some(player => !submissions[player.id])) return "Waiting for every Werewolf to choose a target";
    const choices = participants.map(player => submissions[player.id].pass === true ? null : submissions[player.id].targetId);
    if (choices.some(choice => choice !== choices[0])) return "Werewolves disagree — no target to confirm";
    return choices[0] === null ? "Skip the attack" : `Werewolf target: ${playerName(choices[0])}`;
  }
  if (step.kind === "mayor-nominations") {
    const names = Object.entries(submissions).filter(([, value]) => value.candidate === true).map(([id]) => playerName(id));
    const waiting = participants.filter(player => !submissions[player.id]).length;
    return `Running for mayor: ${names.join(", ") || "Nobody"}${waiting ? ` — waiting for ${waiting} choice(s)` : ""}`;
  }
  if (step.kind === "skip-vote") {
    const waiting = participants.filter(player => !submissions[player.id]).length;
    if (waiting) return `Skip lynch vote — waiting for ${waiting} choice(s)`;
    return participants.length && participants.every(player => submissions[player.id]?.skip === true)
      ? "Unanimous yes — skip the lynch" : "Not unanimous — proceed to lynch";
  }
  if (PRIVATE_RESULT_STEPS.has(step.kind)) {
    const role = snapshot.roleCatalog.find(role => role.id === step.data?.role);
    const observer = resultObserver(step);
    const result = step.kind === "feeling-watched" ? "A Wolfchild is imitating this player"
      : step.kind === "little-girl-result"
      ? step.data?.visited ? `Visited: ${Array.isArray(step.data.visitedIds) && step.data.visitedIds.length ? step.data.visitedIds.map(playerName).join(", ") : "destination not recorded"}` : "Did not visit anyone"
      : step.kind === "guard-result" ? String(step.data?.result) : role?.name ?? "Thumbs-down";
    return `${playerName(step.data?.targetId)}: ${result} — ${
      gmInitialAction(snapshot, step)?.acknowledged === true ? `Seen by the ${observer}` : `Waiting for the ${observer}'s acknowledgement`}`;
  }
  if (step.override) return describe(step.override);
  if (step.actorMode === "living") {
    const choices = participants.map(player => `${player.username}: ${submissions[player.id] ? describe(submissions[player.id]) : "Waiting"}`);
    return choices.join(" · ") || "No eligible players";
  }
  const actorId = step.actorId ?? step.voterId ?? (step.actorMode === "mayor" ? snapshot.mayorId : null);
  if (actorId && submissions[actorId]) return describe(submissions[actorId]);
  if (step.targetId) return `${step.kind === "death-reveal" ? "Reveal death" : "Target"}: ${playerName(step.targetId)}`;
  if (step.kind === "night-deaths") {
    return "Resolve the night deaths listed above";
  }
  if (step.kind === "bearman-growl" && isRecord(snapshot.gmActions?.bearman)) {
    return snapshot.gmActions.bearman.growl ? "The Bearman's bear growls" : "The Bearman's bear does not growl";
  }
  if ((step.kind === "day-check" || step.kind.startsWith("day-check-after")) && isRecord(snapshot.gmActions?.lastWinCheck)) {
    const check = snapshot.gmActions.lastWinCheck;
    return check.winner === null ? "The game continues" : check.winner === "draw" ? "The game is a draw" : `The ${String(check.winner)} win`;
  }
  if (GM_CHOICE_STEPS.has(step.kind)) return step.optional ? "Pass — no action selected" : "No choice recorded yet";
  return step.prompt;
}

function GMControls({ snapshot, userId, send }: Pick<GameLobbyProps<WerewolvesSnapshot>, "snapshot" | "userId" | "send">) {
  const step = snapshot.currentStep;
  const [notice, setNotice] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  useEffect(() => { setNotice(""); }, [step?.id]);
  if (!snapshot.isGM || !step || snapshot.phase !== "playing") return null;
  const history = snapshot.stepHistory ?? [];
  const viewedIndex = historyIndex === null ? history.length : Math.min(historyIndex, history.length);
  const previous = history[viewedIndex];
  const historyNavigation = <div className="row werewolves-gm-navigation" aria-label="GM step navigation">
    <button type="button" disabled={viewedIndex === 0} onClick={() => setHistoryIndex(viewedIndex - 1)}>Previous step</button>
    {previous && <>
      <button type="button" onClick={() => setHistoryIndex(viewedIndex + 1 < history.length ? viewedIndex + 1 : null)}>Next step</button>
      <button type="button" onClick={() => setHistoryIndex(null)}>Return to current step</button>
    </>}
  </div>;
  if (previous) {
    const formatValue = (value: unknown): string => {
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "string") return previous.names[value] ?? snapshot.moonCatalog.find(card => card.id === value)?.name ?? value;
      if (Array.isArray(value)) return value.map(formatValue).join(", ");
      return String(value);
    };
    const choice = (value: Record<string, unknown>) => Object.entries(value)
      .filter(([key]) => key !== "userId")
      .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1")}: ${formatValue(value)}`).join(" · ");
    return <HostControlsTab>
      <div className="werewolves-gm-panel">
        <p className="muted">Previous step — read only. The live game has not changed.</p>
        <div className="werewolves-step-head">
          <span className="pill">{previous.step.phase} · Day {previous.step.day}</span>
          <span className="pill">{previous.step.kind}</span>
        </div>
        <p className="werewolves-step-prompt">{previous.step.prompt}</p>
        {Object.entries(previous.submissions).map(([id, value]) => <p key={id}><strong>{previous.names[id] ?? id}:</strong> {choice(value)}</p>)}
        {previous.override && <p><strong>GM choice:</strong> {choice(previous.override)}</p>}
        {!previous.override && Object.keys(previous.submissions).length === 0 && previous.chosen && <p><strong>Recorded choice:</strong> {choice(previous.chosen)}</p>}
        {!previous.override && !previous.chosen && Object.keys(previous.submissions).length === 0 && <p className="muted">No player choice was recorded for this step.</p>}
        {historyNavigation}
      </div>
    </HostControlsTab>;
  }

  const groupAction = step.actorMode === "living" || step.actorMode === "voter" || step.kind === "wolf-target";
  const submitGM = (value: Record<string, unknown>) => {
    send({ type: "gm_action", value });
  };
  const membersForStep = groupAction
    ? step.kind === "wolf-target"
      ? snapshot.seats.filter(seat => seat.alive && !seat.absent && seat.faction === "werewolf")
      : step.actorMode === "voter"
      ? snapshot.seats.filter(seat => seat.id === step.voterId && seat.alive)
      : snapshot.seats.filter(seat => seat.alive && !seat.absent)
    : [];
  const showDirect = GM_CHOICE_STEPS.has(step.kind)
    && !(step.kind === "fool-win" && step.actorMode !== "role")
    && !(step.kind === "lynch-result" && step.targetId)
    && !groupAction;
  const initialGMAction = gmInitialAction(snapshot, step);
  const gmActionStep = { ...step, actorId: step.actorId ?? step.voterId
    ?? (step.actorMode === "mayor" ? snapshot.mayorId ?? undefined : undefined)
    ?? userId };
  const nightResolutionSummary = snapshot.gmActions?.nightResolutionSummary;

  return <HostControlsTab>
    <div className="werewolves-gm-panel">
      <div className="werewolves-step-head">
        <span className="pill">{step.phase} · Day {step.day}</span>
        <span className="pill">{step.kind}</span>
      </div>
      <p className="werewolves-step-prompt">{step.prompt}</p>
      {step.kind === "bearman-growl" && isRecord(snapshot.gmActions?.bearman) && <div>
        <p><strong>{snapshot.gmActions.bearman.growl ? "The bear growls." : "The bear does not growl."}</strong></p>
        {Array.isArray(snapshot.gmActions.bearman.reasons) && <ul>{snapshot.gmActions.bearman.reasons.map((reason, index) =>
          <li key={index}>{String(reason)}</li>
        )}</ul>}
      </div>}
      {step.kind === "night-deaths" && (snapshot.nightDeathPreview ? <>
        {snapshot.nightDeathPreview.deaths.length > 0
          ? <ul aria-label="Night deaths">{snapshot.nightDeathPreview.deaths.map(death => {
            const player = snapshot.seats.find(player => player.id === death.id);
            return <li key={death.id}><RoleIcon snapshot={snapshot} role={player?.role} size={25} /> <strong>{player?.username ?? death.id}</strong> — {death.reason}</li>;
          })}</ul>
          : <p>No deaths tonight.</p>}
        {snapshot.nightDeathPreview.notes.map((note, index) => <p className="muted small" key={index}>{note}</p>)}
      </> : <p className="muted small">Waiting for the night-death summary from the server.</p>)}
      {PRIVATE_RESULT_STEPS.has(step.kind) && <>
        <RoleCheckResult snapshot={snapshot} step={step} />
        <ResultConfirmation value={initialGMAction} onChange={submitGM} />
        <p className="muted">{initialGMAction?.acknowledged === true
          ? `The ${resultObserver(step)} has seen the result.`
          : `Waiting for the ${resultObserver(step)} to confirm seeing the result.`}</p>
      </>}
      {step.kind === "mayor-speeches" && <div className="werewolves-mayor-candidates">
        <h3>Running for mayor</h3>
        {snapshot.mayorCandidates.length > 0
          ? <ul className="names">{snapshot.seats.filter(player => snapshot.mayorCandidates.includes(player.id)).map(player =>
            <li key={player.id}><Person id={player.id} name={player.username} size={24} /></li>
          )}</ul>
          : <p className="muted">No players are running for mayor.</p>}
      </div>}
      {snapshot.publicStep?.lynchTargetId && <p className="werewolves-lynch-announcement">
        {snapshot.seats.find(player => player.id === snapshot.publicStep?.lynchTargetId)?.username ?? "The selected player"} is about to be lynched.
      </p>}
      {step.phase !== "day" && isRecord(nightResolutionSummary) && Array.isArray(nightResolutionSummary.events) && <div className="werewolves-submissions">
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
      {step.kind === "wolf-target" && step.wiseWolfWarning && <p className="error">Wise Wolf warning: a current target choice is dangerous. The wolves may still keep it unanimously.</p>}
      {groupAction && <div className="werewolves-submissions">
        <strong>Players’ current choices</strong>
        {membersForStep.map(player => {
          const submission = step.submissions?.[player.id];
          return <div key={player.id} className="werewolves-gm-choice-row">
            <strong>{step.kind === "wolf-target" && <RoleIcon snapshot={snapshot} role={player.role} size={25} />}{player.username}</strong>
            <ActionForm
              key={`${step.id}-${player.id}-${JSON.stringify(submission ?? null)}`}
              snapshot={snapshot} step={step} actorId={player.id} inline
              initialAction={submission}
              onChange={value => submitGM({ forUserId: player.id, vote: value })}
            />
          </div>;
        })}
        {membersForStep.length === 0 && <p className="muted">No eligible players for this step.</p>}
      </div>}
      {showDirect && <div className="werewolves-gm-entry">
        <div className="werewolves-gm-choice-row">
          <strong>{snapshot.seats.find(player => player.id === gmActionStep.actorId)?.username ?? "GM choice"}</strong>
          <ActionForm key={`${step.id}-gm-${step.kind === "town-name" ? "" : JSON.stringify(initialGMAction)}`} snapshot={snapshot} step={gmActionStep} actorId={gmActionStep.actorId} inline initialAction={initialGMAction} onChange={submitGM} />
        </div>
      </div>}
      {step.optional && <p className="muted small">Optional step: confirm to pass, or select a GM choice before confirming.</p>}
      {notice && <p className="muted small">{notice}</p>}
      {snapshot.settings.moonCards && step.kind === "discussion" && <p className="muted small">Mark rule violations by selecting the player in the village list below.</p>}
      <div className="werewolves-gm-footer">
        <button className="primary" disabled={PRIVATE_RESULT_STEPS.has(step.kind) && initialGMAction?.acknowledged !== true} onClick={() => send({ type: "confirm_step" })}>Confirm step and continue</button>
        <span className="werewolves-confirm-summary" aria-live="polite"><strong>Confirming:</strong> {confirmationSummary(snapshot, step)}</span>
        {historyNavigation}
      </div>
    </div>
  </HostControlsTab>;
}

function ActiveGame({ snapshot, userId, isHost, isAdmin, isDisplay, send }: Pick<GameLobbyProps<WerewolvesSnapshot>, "snapshot" | "userId" | "isHost" | "isAdmin" | "isDisplay" | "send">) {
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
    {role && privateDataVisible && <div className={`werewolves-private-role ${role.faction}`}>
      <RoleIcon snapshot={snapshot} role={role.id} size={56} /><div><strong>{role.name}</strong><p>{role.rule}</p>{viewer?.role === "wolfchild" && <small>Your current faction: {viewer.faction}</small>}</div>
    </div>}
    {gm && <p className="werewolves-gm-banner"><strong>You are the Game Master.</strong> Private roles and game actions are shown only on your GM view.</p>}
    <div className="werewolves-public-step"><span className="pill">{snapshot.publicStep?.phase ?? "game"}</span><strong>{snapshot.publicStep?.prompt ?? "The game is in progress."}</strong></div>
    <div className="werewolves-village-layout">
      {gm && !isDisplay && <aside className="card werewolves-upcoming" aria-label="GM upcoming steps">
        <h2>Upcoming steps</h2>
        {snapshot.stepsRemaining?.some((item, index) => index > 0 && item.phase === snapshot.currentStep?.phase) && <details className="werewolves-step-list" open>
          <summary>Upcoming steps this phase</summary>
          <ol>{snapshot.stepsRemaining.slice(1).filter(item => item.phase === snapshot.currentStep?.phase).map(item => <li key={item.id}>{item.prompt}</li>)}</ol>
        </details>}
        {snapshot.upcomingSteps?.map((group, index) => <details className="werewolves-step-list" key={index} open>
          <summary>{group.current ? "Upcoming steps this" : "Next"} {group.phase}</summary><ol>{group.steps.map(item => <li key={`${index}-${item}`}>{item}</li>)}</ol>
        </details>)}
      </aside>}
      <Circle snapshot={snapshot} userId={userId}
        showLovers={!isDisplay && (privateDataVisible || snapshot.privatePrompt?.kind === "lovers-meet" || snapshot.currentStep?.kind === "lovers-meet")}
        showImitation={!isDisplay && (privateDataVisible || snapshot.privatePrompt?.kind === "feeling-watched")} />
      <section className="card werewolves-events">
        <h2>Village events</h2>
        {snapshot.events.length ? <ol>{[...snapshot.events].reverse().map((event, index) => <li key={`${event}-${index}`}>{event}</li>)}</ol> : <p className="muted">No public events yet.</p>}
        {snapshot.deaths.length > 0 && <><h3>Deaths</h3><ul>{[...snapshot.deaths].sort((a, b) => a.order - b.order).map(death => <li key={`${death.userId}-${death.order}`}>{death.username}{death.role && !snapshot.buried ? ` — ${roleName(snapshot, death.role)}` : ""}{death.reason ? ` (${death.reason})` : ""}</li>)}</ul></>}
      </section>
    </div>
    {snapshot.publicActions.bearGrowl && <p className="werewolves-status">{snapshot.publicActions.bearGrowl.growl ? "The Bearman's bear growls." : "The Bearman's bear does not growl."}</p>}
    {snapshot.publicActions.moonCardName && <p className="werewolves-status">Today's Moon card: <strong>{snapshot.publicActions.moonCardName}</strong></p>}
    {!isDisplay && !gm && showSecret && snapshot.wolfchildTarget === userId && <p className="werewolves-status">A Wolfchild is imitating you.</p>}
    {!isDisplay && (privateDataVisible || snapshot.privatePrompt?.kind === "lovers-meet") && snapshot.lovers?.includes(userId) && <p className="werewolves-status">{snapshot.privatePrompt?.kind === "lovers-meet" && "Wake up and meet your lover. "}You are in love with {snapshot.seats.find(seat => seat.id === snapshot.lovers?.find(id => id !== userId))?.username ?? "your partner"}.</p>}
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
        <span>{player.inactive ? "Won · Out of play" : player.alive ? "Alive" : "Dead"}{player.silenced ? " · Silenced" : ""}{player.absent ? " · Away" : ""}</span>
        {currentKind === "discussion" && snapshot.settings.moonCards && player.alive && <button className="small" onClick={() => send({ type: "record_violation", userId: player.id })}>Record interruption</button>}
      </li>)}</ul>
      {currentKind === "death-reveal" && currentStep && <p className="muted">Reveal: {snapshot.seats.find(seat => seat.id === currentStep.targetId)?.username ?? "selected player"}. Confirm the current step when ready.</p>}
    </section>}

    {snapshot.result && <section className="card werewolves-results">
      <h2>{snapshot.result.winner === "draw" ? "The game is a draw" : snapshot.result.winner === "lovers" ? "The lovers win!" : `The ${snapshot.result.winner} win!`}</h2>
      <ul>{snapshot.results?.map(player => <li key={player.id} className={player.won ? "winner" : ""}>
        <Person id={player.id} name={player.username} size={22} />
        <RoleIcon snapshot={snapshot} role={player.role} size={28} />{roleName(snapshot, player.role)}
        {player.won ? " · Winner" : ""}
      </li>)}</ul>
      {isAdmin && !isDisplay && <button className="primary" onClick={() => send({ type: "close_results" })}>Return to lobby</button>}
    </section>}
    {isHost && !isDisplay && snapshot.phase === "playing" && <HostControlsTab>
      <button className="danger" onClick={() => window.confirm("Exit this game and return everyone to the lobby? The current game will be discarded.") && send({ type: "abort" })}>Exit game</button>
    </HostControlsTab>}
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
