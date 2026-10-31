import { useState, type FormEvent } from "react";
import { api, setToken } from "../api";
import type { User } from "../types";

type Mode = "login" | "register" | "reset";

export function AuthPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "reset") {
        const result = await api<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ username, recoveryKey, password }) });
        setNotice(result.message);
        setMode("login");
        setPassword("");
        setRecoveryKey("");
      } else {
        const result = await api<{ token: string; user: User }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({ username, password }) });
        setToken(result.token);
        onAuthenticated(result.user);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Voedgoem</h1>
        <label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required minLength={2} maxLength={20} /></label>
        {mode === "reset" && <label>Recovery key<input value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" required /></label>}
        <label>{mode === "reset" ? "New password" : "Password"}<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} /></label>
        {error && <p className="error">{error}</p>}
        {notice && <p className="success">{notice}</p>}
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Play" : mode === "register" ? "Create account" : "Reset password"}</button>
        <div className="auth-links">
          {mode !== "login" && <button type="button" className="link" onClick={() => switchMode("login")}>Back to sign in</button>}
          {mode === "login" && <button type="button" className="link" onClick={() => switchMode("register")}>Create account</button>}
          {mode === "login" && <button type="button" className="link" onClick={() => switchMode("reset")}>Recover account</button>}
        </div>
      </form>
    </div>
  );
}
