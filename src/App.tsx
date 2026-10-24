import { useCallback, useEffect, useState } from "react";
import { api, setToken } from "./api";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { HubPage } from "./pages/HubPage";
import { LobbyPage } from "./pages/LobbyPage";
import type { User } from "./types";

const readHash = () => window.location.hash.replace(/^#/, "") || "/";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(readHash());

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me").then(result => setUser(result.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setToken(null);
    setUser(null);
    window.location.hash = "#/";
  }, []);

  if (loading) return <div className="auth-screen"><p className="muted">Loading…</p></div>;
  if (!user) return <AuthPage onAuthenticated={setUser} />;

  const lobbyMatch = route.match(/^\/lobby\/([A-Za-z0-9_-]+)$/);
  const onAdmin = route === "/admin" && user.isAdmin;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">Voedgoem</a>
        <nav>
          <a className={!onAdmin ? "active" : ""} href="#/">Hub</a>
          {user.isAdmin && <a className={onAdmin ? "active" : ""} href="#/admin">Admin</a>}
        </nav>
        <div className="who">{user.username}{user.isAdmin && <span className="pill">admin</span>}<button onClick={() => void logout()}>Sign out</button></div>
      </header>
      <main>
        {onAdmin ? <AdminPage /> : lobbyMatch ? <LobbyPage key={lobbyMatch[1]} lobbyId={lobbyMatch[1]} user={user} /> : <HubPage user={user} />}
      </main>
    </div>
  );
}
