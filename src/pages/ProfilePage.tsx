import { useState } from "react";
import { api } from "../api";
import { Avatar } from "../avatar/Avatar";
import { defaultAvatar, randomAvatar, SWATCHES, VIEWS, type Avatar as AvatarData, type AvatarView } from "../avatar/model";
import { PARTS, type PartInfo } from "../avatar/parts.generated";
import type { User } from "../types";

interface PartRow {
  label: string;
  part: "body" | "face" | "hat";
  list: PartInfo[];
}

const ROWS: PartRow[] = [
  { label: "Body", part: "body", list: PARTS.bodies },
  { label: "Face", part: "face", list: PARTS.faces },
  { label: "Hat", part: "hat", list: PARTS.hats }
];

const same = (a: AvatarData, b: AvatarData) => JSON.stringify(a) === JSON.stringify(b);

export function ProfilePage({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const saved = user.avatar ?? defaultAvatar(user.id);
  const [draft, setDraft] = useState<AvatarData>(saved);
  const [view, setView] = useState<AvatarView>("front");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<AvatarData>) => { setDraft(current => ({ ...current, ...patch })); setStatus(null); };

  const step = (row: PartRow, delta: number) => {
    const index = row.list.findIndex(item => item.id === draft[row.part]);
    const next = row.list[(index + delta + row.list.length) % row.list.length];
    update({ [row.part]: next.id });
  };

  const rotate = (delta: number) => {
    const index = VIEWS.findIndex(item => item.id === view);
    setView(VIEWS[(index + delta + VIEWS.length) % VIEWS.length].id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await api<{ user: User }>("/api/profile/avatar", { method: "PUT", body: JSON.stringify({ avatar: draft }) });
      onSaved(result.user);
      setStatus({ kind: "ok", text: "Avatar saved." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>Your profile</h1>
      <p className="muted">{user.username}</p>
      <section className="card profile">
        <div className="profile-preview">
          <Avatar avatar={draft} view={view} size={200} />
          <div className="row">
            <button onClick={() => rotate(-1)} aria-label="Rotate left">↻</button>
            <span className="muted small">{VIEWS.find(item => item.id === view)!.label}</span>
            <button onClick={() => rotate(1)} aria-label="Rotate right">↺</button>
          </div>
        </div>
        <div className="profile-parts">
          {ROWS.map(row => {
            const colorKey = `${row.part}Color` as "bodyColor" | "faceColor" | "hatColor";
            const current = row.list.find(item => item.id === draft[row.part]);
            return (
              <div key={row.part} className="part-row">
                <h3>{row.label}</h3>
                <div className="row">
                  <button onClick={() => step(row, -1)} aria-label={`Previous ${row.label}`}>‹</button>
                  <select value={draft[row.part]} onChange={event => update({ [row.part]: event.target.value })}>
                    {!current && <option value={draft[row.part]}>{draft[row.part]}</option>}
                    {row.list.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                  <button onClick={() => step(row, 1)} aria-label={`Next ${row.label}`}>›</button>
                  <input type="color" value={draft[colorKey]} onChange={event => update({ [colorKey]: event.target.value })} aria-label={`${row.label} colour`} />
                </div>
                <div className="swatches">
                  {SWATCHES.map(color => (
                    <button key={color} className={`swatch ${draft[colorKey] === color ? "on" : ""}`} style={{ background: color }} onClick={() => update({ [colorKey]: color })} aria-label={color} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="row">
            <button onClick={() => { setDraft(randomAvatar()); setStatus(null); }}>Randomise</button>
            <button disabled={same(draft, saved)} onClick={() => { setDraft(saved); setStatus(null); }}>Reset</button>
            <button className="primary" disabled={saving || same(draft, saved) && !!user.avatar} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button>
          </div>
          {status && <p className={status.kind === "error" ? "error" : "muted"}>{status.text}</p>}
        </div>
      </section>
    </div>
  );
}
