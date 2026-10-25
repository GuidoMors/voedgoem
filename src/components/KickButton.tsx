import type { Send } from "../games/types";

// Host-only button that removes someone from their position (they go back to spectating).
export function KickButton({ id, name, isHost, send }: { id: string; name: string; isHost: boolean; send: Send }) {
  if (!isHost) return null;
  return <button className="danger kick" title={`Remove ${name} from their position`} aria-label={`Remove ${name} from their position`} onClick={() => send({ type: "kick", userId: id })}>✕</button>;
}
