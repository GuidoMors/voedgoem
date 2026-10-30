import { useCallback, useEffect, useState } from "react";
import { api, setToken } from "./api";
import { DisplayQr } from "./components/DisplayQr";
import { HistoryContext } from "./components/HistoryPanel";
import { Modal } from "./components/Modal";
import { Avatar } from "./avatar/Avatar";
import { defaultAvatar } from "./avatar/model";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { HubPage } from "./pages/HubPage";
import { LobbyPage } from "./pages/LobbyPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StatsPage } from "./pages/StatsPage";
import type { User } from "./types";

const readHash = () => window.location.hash.replace(/^#/, "") || "/";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(readHash());
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<"stats" | "history" | "admin" | "profile" | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [lobbyGame, setLobbyGame] = useState<string | null>(null);
  const [statsGame, setStatsGame] = useState<string | null>(null);
  const closeModal = useCallback(() => setModal(null), []);
  const updateLobbyGame = useCallback((game: string | null) => setLobbyGame(game), []);

  useEffect(() => {
    const onHash = () => { setRoute(readHash()); setMenuOpen(false); setModal(null); };
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
  const inGame = !!lobbyMatch;
  const onProfile = route === "/profile";
  const onHub = !onProfile;
  const openModal = (event: React.MouseEvent, name: "stats" | "history" | "admin" | "profile") => {
    event.preventDefault();
    if (name === "stats") setStatsGame(inGame ? lobbyGame : null);
    setModal(name);
    setMenuOpen(false);
  };

  return (
    <div className="shell">
      {user.isDisplay && <DisplayQr url={window.location.href} />}
      <header className="topbar">
        <a className="brand" href="#/" onClick={event => inGame && event.preventDefault()}>Voedgoem</a>
        <button className="burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? "✕" : "☰"}</button>
        <div className={`menu ${menuOpen ? "open" : ""}`}>
        <nav>
          <a className={onHub ? "active" : ""} href="#/" onClick={event => { if (inGame) { event.preventDefault(); setMenuOpen(false); } }}>{inGame ? "Game" : "Hub"}</a>
          {!user.isDisplay && <a href="#/stats" onClick={event => openModal(event, "stats")}>Statistics</a>}
          {hasHistory && <a href="#/history" onClick={event => openModal(event, "history")}>History</a>}
          {user.isAdmin && <a href="#/admin" onClick={event => openModal(event, "admin")}>Admin</a>}
        </nav>
        <div className="who">
          {user.isDisplay
            ? <span className="pill">display</span>
            : <a className={`profile-link ${onProfile ? "active" : ""}`} href="#/profile" title="Edit profile" onClick={event => openModal(event, "profile")}><Avatar avatar={user.avatar ?? defaultAvatar(user.id)} size={26} />{user.username}</a>}
          {user.isHoster && <span className="pill">hoster</span>}
          {user.isAdmin && <span className="pill">admin</span>}<button onClick={() => void logout()}>Sign out</button>
        </div>
        </div>
      </header>
      <main>
        <HistoryContext.Provider value={{ open: modal === "history", setAvailable: setHasHistory, close: closeModal }}>
        {onProfile && !user.isDisplay ? <ProfilePage user={user} onSaved={setUser} /> : lobbyMatch ? <LobbyPage key={lobbyMatch[1]} lobbyId={lobbyMatch[1]} user={user} onGameChange={updateLobbyGame} /> : <HubPage user={user} />}
        </HistoryContext.Provider>
      </main>
      {modal === "stats" && !user.isDisplay && <Modal title="Statistics" onClose={closeModal} gameTheme={statsGame}><StatsPage userId={user.id} defaultGame={inGame ? lobbyGame : null} onGameChange={setStatsGame} /></Modal>}
      {modal === "admin" && user.isAdmin && <Modal title="Admin" onClose={closeModal}><AdminPage /></Modal>}
      {modal === "profile" && !user.isDisplay && <Modal title="Your profile" onClose={closeModal}><ProfilePage user={user} onSaved={setUser} /></Modal>}
    </div>
  );
}
