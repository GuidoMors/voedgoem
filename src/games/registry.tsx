import { CodenamesLobby } from "./codenames/Lobby";
import { BlokusLobby } from "./blokus/Lobby";
import { DworfLobby } from "./dworf/Lobby";
import { KinLobby } from "./kin/Lobby";
import { TetrisLobby } from "./tetris/Lobby";
import { ThirtyOneLobby } from "./thirtyone/Lobby";
import { WerewolvesLobby } from "./werewolves/Lobby";
import { PassTimeLobby } from "./pass-time/Lobby";
import type { LobbySnapshot } from "../types";
import type { Send } from "./types";
import type { ReactNode } from "react";

// Keep each game's import and switch case on its own line to reduce merge overlap.
export function GameLobby({ snapshot, userId, isHost, isAdmin, isDisplay, send, hostControls }: { snapshot: LobbySnapshot; userId: string; isHost: boolean; isAdmin: boolean; isDisplay?: boolean; send: Send; hostControls?: ReactNode }) {
  switch (snapshot.game) {
    case "blokus": return <BlokusLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "codenames": return <CodenamesLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "dworf": return <DworfLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "kin": return <KinLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send, hostControls }} />;
    case "pass-time": return <PassTimeLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "tetris": return <TetrisLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "thirtyone": return <ThirtyOneLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
    case "werewolves": return <WerewolvesLobby {...{ snapshot, userId, isHost, isAdmin, isDisplay, send }} />;
  }
}
