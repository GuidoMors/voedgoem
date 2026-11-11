import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api";
import type { AdminUser } from "../types";
import { PlenetQuestionEditor } from "./PlenetQuestionEditor";

type AdminTab = "players" | "recovery" | "hosters" | "displays" | "wordFeedback" | "plenetQuestions";

interface WordFeedbackEntry {
  wordKey: string;
  word: string;
  reported: boolean;
  recommended: boolean;
  submittedAt: string;
}

const tabs: { id: AdminTab; label: string }[] = [
  { id: "players", label: "Players" },
  { id: "recovery", label: "Recovery keys" },
  { id: "hosters", label: "Hosters" },
  { id: "displays", label: "Display accounts" },
  { id: "wordFeedback", label: "31 Seconds words" },
  { id: "plenetQuestions", label: "Edit Plenet questions" }
];

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<{ username: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [display, setDisplay] = useState({ username: "", password: "" });
  const [displayMessage, setDisplayMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("players");
  const [search, setSearch] = useState("");
  const [wordFeedback, setWordFeedback] = useState<WordFeedbackEntry[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [editorDirty, setEditorDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: AdminUser[] }>("/api/admin/users")).users);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadWordFeedback = useCallback(async () => {
    try {
      setWordFeedback((await api<{ words: WordFeedbackEntry[] }>("/api/admin/word-feedback")).words);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load word feedback.");
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return users.filter(target => target.username.toLocaleLowerCase().includes(query));
  }, [search, users]);

  const changeTab = (tab: AdminTab) => {
    if (activeTab === "plenetQuestions" && editorDirty && !window.confirm("Discard your unsaved Plenet question edits?")) return;
    setActiveTab(tab);
    setSearch("");
    setError("");
    if (tab === "wordFeedback") void loadWordFeedback();
    if (tab === "plenetQuestions") setEditorKey(key => key + 1);
  };

  const removeWordFeedback = async (entry: WordFeedbackEntry) => {
    setError("");
    try {
      await api("/api/admin/word-feedback", {
        method: "DELETE",
        body: JSON.stringify({ wordKey: entry.wordKey })
      });
      setWordFeedback(entries => entries.filter(item => item.wordKey !== entry.wordKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not remove feedback for "${entry.word}".`);
    }
  };

  const createDisplay = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setDisplayMessage("");
    try {
      await api("/api/admin/displays", { method: "POST", body: JSON.stringify(display) });
      setDisplayMessage(`Display account "${display.username}" created.`);
      setDisplay({ username: "", password: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the display account.");
    }
  };

  const generate = async (target: AdminUser) => {
    if (!window.confirm(`Generate a new recovery key for ${target.username}? Any previous key stops working.`)) return;
    setError("");
    setCopied(false);
    try {
      const result = await api<{ recoveryKey: string }>(`/api/admin/users/${encodeURIComponent(target.id)}/recovery-key`, { method: "POST" });
      setGenerated({ username: target.username, key: result.recoveryKey });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate a key.");
    }
  };

  const setHoster = async (target: AdminUser) => {
    const isHoster = !target.isHoster;
    const confirmation = isHoster ? `Make ${target.username} a hoster?` : `Remove ${target.username} as a hoster?`;
    if (!window.confirm(confirmation)) return;
    setError("");
    try {
      await api(`/api/admin/users/${encodeURIComponent(target.id)}/hoster`, {
        method: "POST",
        body: JSON.stringify({ isHoster })
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not ${isHoster ? "make" : "remove"} ${target.username} ${isHoster ? "a hoster" : "as a hoster"}.`);
    }
  };

  const copy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.key);
      setCopied(true);
    } catch {
      setError("Could not copy automatically. Select the key and copy it manually.");
    }
  };

  const playerTable = (mode: "players" | "recovery" | "hosters") => (
    <>
      <label className="admin-search">
        <span className="muted small">Search players</span>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by username" />
      </label>
      <div className="table-wrap">
        <table>
          <thead>
            {mode === "players" && <tr><th>Player</th><th>Joined</th><th>Role</th></tr>}
            {mode === "recovery" && <tr><th>Player</th><th>Recovery key</th><th /></tr>}
            {mode === "hosters" && <tr><th>Player</th><th>Role</th><th /></tr>}
          </thead>
          <tbody>
            {filteredUsers.map(target => (
              <tr key={target.id}>
                <td><strong>{target.username}</strong></td>
                {mode === "players" && <>
                  <td>{new Date(target.createdAt).toLocaleDateString()}</td>
                  <td>{target.isAdmin ? `Admin${target.isHoster ? " · Hoster" : ""}` : target.isHoster ? "Hoster" : target.isDisplay ? "Display" : "User"}</td>
                </>}
                {mode === "recovery" && <>
                  <td>{target.hasRecoveryKey ? "Active" : "None"}</td>
                  <td className="right"><button onClick={() => void generate(target)}>Generate key</button></td>
                </>}
                {mode === "hosters" && <>
                  <td>{target.isAdmin ? "Admin" : target.isHoster ? "Hoster" : target.isDisplay ? "Display" : "User"}</td>
                  <td className="right">
                    {!target.isDisplay && !target.isAdmin && <button onClick={() => void setHoster(target)}>{target.isHoster ? "Remove Hoster" : "Make Hoster"}</button>}
                  </td>
                </>}
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan={3} className="muted">No players found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="page admin-page">
      <div className="row between">
        <h1>Admin</h1>
        <button onClick={() => {
          if (activeTab === "wordFeedback") void loadWordFeedback();
          else if (activeTab === "plenetQuestions") {
            if (!editorDirty || window.confirm("Reload and discard your unsaved Plenet question edits?")) {
              setEditorDirty(false);
              setEditorKey(key => key + 1);
            }
          }
          else void load();
        }}>Refresh</button>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map(tab => (
          <button key={tab.id} id={`admin-tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls={`admin-panel-${tab.id}`}
            className={activeTab === tab.id ? "active" : ""} onClick={() => changeTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <section id={`admin-panel-${activeTab}`} role="tabpanel" aria-labelledby={`admin-tab-${activeTab}`} className="card admin-panel">
        {activeTab === "players" && <>
          <h2>All players <span className="pill">{users.length}</span></h2>
          {playerTable("players")}
        </>}
        {activeTab === "recovery" && <>
          <h2>Generate recovery keys</h2>
          <p className="muted small">A new key invalidates any previous key and is shown only once.</p>
          {generated && (
            <section className="key-card">
              <strong>Recovery key for {generated.username}</strong>
              <p className="muted">Share it privately; whoever has it can reset this account's password.</p>
              <code>{generated.key}</code>
              <div className="row">
                <button className="primary" onClick={() => void copy()}>{copied ? "Copied" : "Copy key"}</button>
                <button onClick={() => setGenerated(null)}>Dismiss</button>
              </div>
            </section>
          )}
          {playerTable("recovery")}
        </>}
        {activeTab === "hosters" && <>
          <h2>Set hosters</h2>
          <p className="muted small">Hosters can create lobbies. Admin accounts already have this permission.</p>
          {playerTable("hosters")}
        </>}
        {activeTab === "displays" && <>
          <h2>Create a display account</h2>
          <p className="muted small">Display accounts can't join games. They show a lobby on a big screen, with a QR code people can scan to log in on their phone.</p>
          <form className="row create-lobby" onSubmit={createDisplay}>
            <input value={display.username} onChange={event => setDisplay({ ...display, username: event.target.value })} placeholder="Username" maxLength={20} required />
            <input type="password" value={display.password} onChange={event => setDisplay({ ...display, password: event.target.value })} placeholder="Password (3+ characters)" minLength={3} required />
            <button className="primary">Create display</button>
          </form>
          {displayMessage && <p className="muted small">{displayMessage}</p>}
        </>}
        {activeTab === "wordFeedback" && <>
          <h2>31 Seconds word feedback <span className="pill">{wordFeedback.length}</span></h2>
          <p className="muted small">Reports and recommendations are kept separate from the active game word list. Removing a word clears both entries.</p>
          {wordFeedback.length === 0 ? <p className="muted">No words have been reported or recommended.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Word</th><th>Feedback</th><th>Submitted</th><th /></tr></thead>
                <tbody>
                  {wordFeedback.map(entry => (
                    <tr key={entry.wordKey}>
                      <td><strong>{entry.word}</strong></td>
                      <td>{[entry.reported && "Reported", entry.recommended && "Recommended"].filter(Boolean).join(" · ")}</td>
                      <td>{new Date(entry.submittedAt).toLocaleDateString()}</td>
                      <td className="right"><button className="danger" title={`Remove ${entry.word} from reports and recommendations`} aria-label={`Remove ${entry.word} from reports and recommendations`} onClick={() => void removeWordFeedback(entry)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>}
        <div hidden={activeTab !== "plenetQuestions"}>
          <PlenetQuestionEditor key={editorKey} onDirtyChange={setEditorDirty} />
        </div>
      </section>
    </div>
  );
}
