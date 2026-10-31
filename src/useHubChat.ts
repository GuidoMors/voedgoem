import { useCallback, useEffect, useRef, useState } from "react";
import { hubChatSocketUrl } from "./api";
import type { ChatMessage } from "./components/ChatPanel";

export function useHubChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let retry: number | undefined;

    const connect = () => {
      try {
        const ws = new WebSocket(hubChatSocketUrl());
        socket.current = ws;
        ws.onopen = () => { setStatus(""); setError(null); };
        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data as string);
            if (data.type === "chat:history" && Array.isArray(data.messages)) setMessages(data.messages as ChatMessage[]);
            else if (data.type === "chat:message" && data.message) setMessages(current => [...current, data.message as ChatMessage].slice(-100));
            else if (data.type === "error" && typeof data.message === "string") setError(data.message);
          } catch { /* ignore malformed messages */ }
        };
        ws.onclose = event => {
          if (disposed) return;
          if (event.code === 1000 || event.code === 1008) {
            setStatus("");
            setError(event.reason || "Chat connection closed.");
            return;
          }
          setStatus("Reconnecting…");
          setError("Chat connection lost; reconnecting.");
          retry = window.setTimeout(connect, 1500);
        };
        ws.onerror = () => setError("Could not connect to chat. Check that the backend is running and try again.");
      } catch (cause) {
        setStatus("Reconnecting…");
        setError(cause instanceof Error ? `Could not connect to chat: ${cause.message}` : "Could not connect to chat.");
        retry = window.setTimeout(connect, 1500);
      }
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retry);
      socket.current?.close();
    };
  }, []);

  const send = useCallback((text: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      setError("Chat is not connected yet. Try again in a moment.");
      return;
    }
    socket.current.send(JSON.stringify({ type: "chat:send", text }));
    setError(null);
  }, []);

  return { messages, status, error, send };
}
