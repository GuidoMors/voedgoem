import { CodenamesLobby } from "./codenames/Lobby";
import { SaboteurLobby } from "./saboteur/Lobby";
import { TetrisLobby } from "./tetris/Lobby";
import { ThirtyOneLobby } from "./thirtyone/Lobby";
import type { LobbySnapshot } from "../types";
import type { Send } from "./types";

// To add a game: create src/games/<id>/ with types.ts and Lobby.tsx, add its snapshot to LobbySnapshot in ../types.ts, and render it here.
export function GameLobby({ snapshot, userId, isHost, send }: { snapshot: LobbySnapshot; userId: string; isHost: boolean; send: Send }) {
  switch (snapshot.game) {
    case "tetris": return <TetrisLobby {...{ snapshot, userId, isHost, send }} />;
    case "codenames": return <CodenamesLobby {...{ snapshot, userId, isHost, send }} />;
    case "thirtyone": return <ThirtyOneLobby {...{ snapshot, userId, isHost, send }} />;
    case "saboteur": return <SaboteurLobby {...{ snapshot, userId, isHost, send }} />;
  }
}
