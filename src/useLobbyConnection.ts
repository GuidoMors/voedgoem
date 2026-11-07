import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, lobbySocketUrl } from "./api";
import type { Avatar } from "./avatar/model";
import type { LobbySnapshot } from "./types";
import type { ChatMessage } from "./components/ChatPanel";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

export function useLobbyConnection(lobbyId: string) {
  const [snapshot, setSnapshot] = useState<LobbySnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [avatars, setAvatars] = useState<Record<string, Avatar>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const noticeTimer = useRef<number | undefined>(undefined);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let retry: number | undefined;

    setSnapshot(null);
    setStatus("connecting");
    setNotice(null);
    setPasswordRequired(false);
    setAvatars({});
    setChatMessages([]);

    const connect = async () => {
      try {
        await api(`/api/lobbies/${encodeURIComponent(lobbyId)}`);
      } catch (cause) {
        if (disposed) return;
        const terminal = cause instanceof ApiError && [400, 401, 403, 404].includes(cause.status);
        setNotice(cause instanceof Error ? cause.message : "Could not connect to the lobby.");
        setStatus(terminal ? "closed" : "reconnecting");
        if (!terminal) retry = window.setTimeout(connect, 1500);
        return;
      }
      if (disposed) return;
      const ws = new WebSocket(lobbySocketUrl(lobbyId));
      socket.current = ws;
      ws.onopen = () => setStatus("open");
      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "snapshot") {
            setSnapshot(data as LobbySnapshot);
            setPasswordRequired(false);
            if (noticeTimer.current === undefined) setNotice(null);
          }
          else if (data.type === "password_required") {
            setPasswordRequired(true);
            setNotice(typeof data.message === "string" ? data.message : null);
          }
          else if (data.type === "avatars" && data.avatars) setAvatars(data.avatars as Record<string, Avatar>);
          else if (data.type === "chat:history" && Array.isArray(data.messages)) setChatMessages(data.messages as ChatMessage[]);
          else if (data.type === "chat:message" && data.message) setChatMessages(current => [...current, data.message as ChatMessage].slice(-100));
          else if (data.type === "error" && typeof data.message === "string") {
            setNotice(data.message);
            window.clearTimeout(noticeTimer.current);
            noticeTimer.current = window.setTimeout(() => {
              noticeTimer.current = undefined;
              setNotice(null);
            }, 5000);
          }
        } catch { /* ignore malformed messages */ }
      };
      ws.onclose = event => {
        if (disposed) return;
        if (event.code === 1000 || event.code === 1008) {
          if (event.reason) setNotice(event.reason);
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
        retry = window.setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retry);
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = undefined;
      socket.current?.close();
    };
  }, [lobbyId]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }, []);

  const submitPassword = useCallback((password: string) => {
    send({ type: "lobby:password", password });
  }, [send]);

  return { snapshot, status, send, notice, avatars, chatMessages, passwordRequired, submitPassword };
}
