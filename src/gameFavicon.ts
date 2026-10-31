const GAME_FAVICONS: Record<string, string> = {
  tetris: "tetrys.ico",
  codenames: "woerdgoem.ico",
  thirtyone: "31seconds.ico",
  dworf: "dworf.ico"
};

export function gameFaviconUrl(game: string): string | undefined {
  const favicon = GAME_FAVICONS[game];
  return favicon ? `/favicons/${favicon}` : undefined;
}
