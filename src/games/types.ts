export type Phase = "lobby" | "draft" | "playing" | "results";

export type Send = (message: Record<string, unknown>) => void;

// Fields every game's lobby snapshot has; each game adds its own state on top.
export interface BaseSnapshot {
  type: "snapshot";
  name: string;
  host: { id: string; name: string };
  maxPlayers: number;
  spectators: { id: string; username: string }[];
  phase: Phase;
  bots: { id: string; username: string }[];
  // Only sent to admins: each bot's own view of the game, so they can play as the bot.
  botViews?: Record<string, Record<string, unknown>>;
}

export interface GameLobbyProps<S> {
  snapshot: S;
  userId: string;
  isHost: boolean;
  isAdmin: boolean;
  isDisplay?: boolean;
  send: Send;
}
