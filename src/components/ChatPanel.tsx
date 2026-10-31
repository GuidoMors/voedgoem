import { useEffect, useRef, useState, type FormEvent } from "react";

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  createdAt: number;
}

export function ChatPanel({ messages, onSend, status, error }: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  status?: string;
  error?: string | null;
}) {
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    onSend(message);
    setText("");
  };

  return (
    <div className="chat-panel">
      {status && <p className="muted small chat-status">{status}</p>}
      {error && <p className="error">{error}</p>}
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && <p className="muted chat-empty">No messages yet. Start the conversation.</p>}
        {messages.map(message => (
          <article key={message.id} className="chat-message">
            <div className="chat-message-head">
              <strong>{message.username}</strong>
              <time dateTime={new Date(message.createdAt).toISOString()}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            </div>
            <p>{message.text}</p>
          </article>
        ))}
        <div ref={bottom} />
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <input value={text} onChange={event => setText(event.target.value)} maxLength={500} placeholder="Write a message…" aria-label="Chat message" />
        <button className="primary" type="submit" disabled={!text.trim()}>Send</button>
      </form>
      <p className="muted small chat-retention">The latest 100 messages are kept for up to 30 days.</p>
    </div>
  );
}
