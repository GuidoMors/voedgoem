const GAME_FAVICONS: Record<string, string> = {
  tetris: "tetrys.ico",
  codenames: "woerdgoem.ico",
  thirtyone: "31seconds.ico",
  dworf: "dworf.ico",
  blokus: "blokus.ico",
  werewolves: "werewolves.ico",
  kin: "kin.ico",
  "pass-time": "pass-time.ico",
  "wordle-pvp": "wordle-pvp.ico",
  "waar-ligt-dat-land": "waar-ligt-dat-land.svg"
};

export function gameFaviconUrl(game: string): string | undefined {
  const favicon = GAME_FAVICONS[game];
  return favicon ? `/favicons/${favicon}` : undefined;
}
