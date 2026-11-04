import { CodenamesLobby } from "./codenames/Lobby";
import { BlokusLobby } from "./blokus/Lobby";
import { DworfLobby } from "./dworf/Lobby";
import { KinLobby } from "./kin/Lobby";
import { TetrisLobby } from "./tetris/Lobby";
import { ThirtyOneLobby } from "./thirtyone/Lobby";
import { WerewolvesLobby } from "./werewolves/Lobby";
import type { LobbySnapshot } from "../types";
import type { Send } from "./types";
import type { ReactNode } from "react";

// To add a game: create src/games/<id>/ with types.ts and Lobby.tsx, add its snapshot to LobbySnapshot in ../types.ts, and render it here.
export function GameLobby({ snapshot, userId, isHost, isAdmin, isDisplay, send, hostControls }: { snapshot: LobbySnapshot; userId: string; isHost: boolean; isAdmin: boolean; isDisplay?: boolean; send: Send; hostControls?: ReactNode }) {
  switch (snapshot.game) {
    case "tetris": return <TetrisLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "blokus": return <BlokusLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "codenames": return <CodenamesLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "thirtyone": return <ThirtyOneLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "dworf": return <DworfLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "werewolves": return <WerewolvesLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "kin": return <KinLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send, hostControls }} />;
  }
}
