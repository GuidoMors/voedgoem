import { useCallback, useEffect, useRef, useState } from "react";
import { lobbySocketUrl } from "./api";
import type { LobbySnapshot } from "./types";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

export function useLobbyConnection(lobbyId: string) {
  const [snapshot, setSnapshot] = useState<LobbySnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
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

  return { snapshot, status, send };
}
