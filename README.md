# voedgoem

React + Vite frontend for Voedgoem: a game hub with lobbies. The first game is multiplayer Tetris. Intended to be hosted on Cloudflare Pages; the API lives in the `voedgoem-server` repository.

## Features

- Register with just a username and password; sign in; reset a password with an admin-issued recovery key.
- Hub with the available games and open lobbies. Anyone can join a lobby.
- Admins get an **Admin** tab (all users, generate recovery keys) and can create/close lobbies from the hub.
- Tetris lobby: everyone starts as a spectator and can choose to join. The lobby host starts the game, every player gets their own board (same piece sequence), and opponents' boards are visible live. When the last player tops out, a score screen is shown to everyone and the host returns the lobby to the waiting room.

## Development

```
npm install
npm run dev
```

Run the API alongside it (`npm run dev` in `voedgoem-server`, port 8787). Vite proxies `/api` (including WebSockets) to it.

For a production build set `VITE_API_BASE_URL` to the deployed API origin (see `.env.example`).
