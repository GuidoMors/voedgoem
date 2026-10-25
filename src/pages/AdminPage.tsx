import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import type { AdminUser } from "../types";

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<{ username: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [display, setDisplay] = useState({ username: "", password: "" });
  const [displayMessage, setDisplayMessage] = useState("");

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

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: AdminUser[] }>("/api/admin/users")).users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

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

  const copy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.key);
      setCopied(true);
    } catch {
      setError("Could not copy automatically. Select the key and copy it manually.");
    }
  };

  return (
    <div className="page">
      <div className="row between">
        <h1>Admin</h1>
        <button onClick={() => void load()}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}
      {generated && (
        <section className="card key-card">
          <strong>Recovery key for {generated.username}</strong>
          <p className="muted">Shown only once. Share it privately; whoever has it can reset this account's password.</p>
          <code>{generated.key}</code>
          <div className="row">
            <button className="primary" onClick={() => void copy()}>{copied ? "Copied" : "Copy key"}</button>
            <button onClick={() => setGenerated(null)}>Dismiss</button>
          </div>
        </section>
      )}
      <section className="card">
        <h2>Create a display account</h2>
        <p className="muted small">Display accounts can't join games. They show a lobby on a big screen, with a QR code people can scan to log in on their phone.</p>
        <form className="row create-lobby" onSubmit={createDisplay}>
          <input value={display.username} onChange={e => setDisplay({ ...display, username: e.target.value })} placeholder="Username" maxLength={20} required />
          <input type="password" value={display.password} onChange={e => setDisplay({ ...display, password: e.target.value })} placeholder="Password (8+ characters)" minLength={8} required />
          <button className="primary">Create display</button>
        </form>
        {displayMessage && <p className="muted small">{displayMessage}</p>}
      </section>
      <section className="card">
        <h2>Users <span className="pill">{users.length}</span></h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Recovery key</th><th /></tr></thead>
            <tbody>
              {users.map(target => (
                <tr key={target.id}>
                  <td><strong>{target.username}</strong></td>
                  <td>{new Date(target.createdAt).toLocaleDateString()}</td>
                  <td>{target.isAdmin ? "Admin" : target.isDisplay ? "Display" : "User"}</td>
                  <td>{target.hasRecoveryKey ? "Active" : "None"}</td>
                  <td className="right"><button onClick={() => void generate(target)}>Generate key</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
