import { useCallback, useEffect, useRef, useState } from "react";
import { lobbySocketUrl } from "./api";
import type { Avatar } from "./avatar/model";
import type { LobbySnapshot } from "./types";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

export function useLobbyConnection(lobbyId: string) {
  const [snapshot, setSnapshot] = useState<LobbySnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [avatars, setAvatars] = useState<Record<string, Avatar>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let retry: number | undefined;

    const connect = () => {
      const ws = new WebSocket(lobbySocketUrl(lobbyId));
      socket.current = ws;
      ws.onopen = () => setStatus("open");
      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "snapshot") setSnapshot(data as LobbySnapshot);
          else if (data.type === "avatars" && data.avatars) setAvatars(data.avatars as Record<string, Avatar>);
          else if (data.type === "error" && typeof data.message === "string") {
            setNotice(data.message);
            window.clearTimeout(noticeTimer.current);
            noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
          }
        } catch { /* ignore malformed messages */ }
      };
      ws.onclose = event => {
        if (disposed) return;
        if (event.code === 1000) {
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
      socket.current?.close();
    };
  }, [lobbyId]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }, []);

  return { snapshot, status, send, notice, avatars };
}
