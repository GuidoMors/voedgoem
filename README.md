# voedgoem

Voedgoem is a React and Vite frontend for a multiplayer game hub. The sibling
[voedgoem-server](../voedgoem-server/) project provides authentication, lobby
WebSockets, statistics, and authoritative game rules and permissions. The
frontend is deployed as a Cloudflare Workers static-assets Worker.

## Features

- Register and sign in with a username and password. An admin can generate a
  recovery key when a player needs to reset their password.
- The hub lists open lobbies, their game, host and player count. Admins and
  hosters can create lobbies, optionally protected by a password. The host or
  an admin can close a lobby. Players join as spectators and take a seat where
  the game permits; protected lobbies prompt for their password.
- Hub and lobby chat are live and lobby-wide. Each retains at most 100 messages,
  expires messages after 30 days, and lobby chat is deleted when the lobby closes.
- The top navigation opens Statistics, History, Chat, Admin and the profile
  editor in modals without navigating away from a game. Available controls
  depend on the account and game. Leave lobby returns to the hub.
- The Statistics modal has a tab per game, personal results and a searchable,
  paginated player table. Game-specific aggregates are defined by the server;
  games without recorded results have an empty state.

## Games

The frontend registry supports Blokus, Codenames, Dworf, Kin, Pass Time,
Tetris, 31 Seconds, Werewolves, Wordle PvP and Plenet.
Game-specific implementation and interaction notes belong under
`src/games/<id>/`, not in this overview.

- [Kin frontend guide](./src/games/kin/README.md)
- [Tetris frontend guide](./src/games/tetris/README.md)
- [Werewolves frontend guide](./src/games/werewolves/README.md)
- [Pass Time theme reference](./src/games/pass-time/README.md)
- [Plenet frontend guide](./src/games/waar-ligt-dat-land/README.md)

## Development

From the frontend repository, start the sibling server in one terminal:

```powershell
cd ..\voedgoem-server
npm install
npm run db:migrate:local
npm run dev
```

From the frontend repository in another terminal:

```powershell
npm install
npm run dev
```

Vite runs on port 5173 and proxies `/api`, including WebSockets, to the server
on port 8787. Local development uses a separate database and lobbies from
production. If a saved lobby URL is not found locally, return to the hub and
join an existing local lobby. Transient connection failures are shown while the
client retries.

Run `npm test` for the frontend rulebook and stylesheet organization tests. The test script currently uses
`tsx` from the sibling server's `node_modules`, so install server dependencies
first. Run `npm run build` for the normal TypeScript and Vite production build.

## Deployment

The frontend Worker serves the Vite `dist` directory. `VITE_API_BASE_URL` is
embedded at build time; `.env.production` supplies the production API origin,
while `.env.example` documents the development default.

1. Validate the changed frontend and server using their relevant tests and
   builds. If a change requires a database migration, review and apply it to
   the intended environment before deploying code that depends on it. Remote
   migrations require explicit authorization.
2. Deploy server changes as needed from `../voedgoem-server` with
   `npm run deploy`.
3. From this directory, run `npm run build`, then `npx wrangler deploy`.
4. Verify the live frontend and API respond and the live HTML references the
   new build; refresh open clients to load the new frontend.

Deployment uses the current working tree and does not commit or push changes.
Do not deploy, migrate a remote database, or commit without authorization.

## Administration and display accounts

The Admin modal lists users, generates recovery keys, manages hoster status,
creates display accounts, reviews word feedback and edits Plenet questions and
explanations in Dutch or English. Plenet edits are applied to games started
after they are saved. A new recovery key invalidates the previous one; copy it
to the player securely.

Admins are granted or revoked through the server project:

```powershell
$username = 'player_name'
npm run admin:grant -- $username --remote
# To revoke instead:
npm run admin:grant -- $username --remote --revoke
```

Omit `--remote` for the local database. Display accounts are intended for a
shared screen: they receive a spectator view, cannot submit gameplay actions or
edit a profile, and show a QR code linking to the current page. They do not
have the normal profile, chat or Statistics controls.

## Avatars

The profile editor lets players choose a body, face, hat and separate colours,
preview different views, and save their avatar. Players without a saved avatar
and test bots receive a stable default. Lobby avatars are delivered separately
from frequent game snapshots.

Artwork lives in `public/avatars/<kind>/<part>/<view>/{mask,outline}.png`;
masks are recoloured in the browser. To refresh artwork, run
`node scripts/import-avatars.mjs <folder containing bodies, faces and hats>`.
The importer replaces `public/avatars` and regenerates
`src/avatar/parts.generated.ts`, so check the source and preserve any intended
asset changes before running it. The server stores part IDs and colours; the
avatar column was introduced in migration `0002_avatar.sql`.

## Test bots

Admins can add and remove bots in a lobby's Test bots panel, control a bot and
return to playing as themselves, or control the bot whose turn it is. **Bots
join game** seats spectator bots in available positions during the lobby phase.
Autopilot lets supported games make automated bot moves; available automation
and behavior vary by game. See the relevant game guide for game-specific modes.

## Multiplayer and viewer privacy

Each game exposes its own frontend snapshot type and lobby component through
`src/games/registry.tsx`; shared types are in `src/games/types.ts`. A lobby
snapshot can depend on the viewer. Preserve private information for the
appropriate player, GM or team, provide a safe display/spectator view, and
ensure an admin controlling a bot uses that bot's own view. Server modules with
viewer-dependent snapshots must opt out of the shared broadcast cache.
Never put private selections or hidden role data into a shared snapshot merely
to simplify frontend rendering.

Server errors should remain visible long enough to act on, including when a
subsequent snapshot arrives. Unconfirmed actions should not be presented as
successful; keep editable drafts available when a submission is rejected.

## Adding a game
Adding a game is a cross-repository task. Complete all of the following before considering it integrated:

1. **Register and render:** create `src/games/<id>/` (`types.ts` for its snapshot and `Lobby.tsx` for its UI). Add the snapshot to `LobbySnapshot` in `src/types.ts` and render it in `src/games/registry.tsx`. Shared contracts are in `src/games/types.ts`. Follow the [server's registration instructions](../voedgoem-server/README.md); its registry is generated, not manually maintained.
2. **Find and apply the favicon:** inspect `../voedgoem-server/content/favicons/` for the supplied artwork before inventing a replacement. Copy the matching asset into `public/favicons/` and add the canonical game ID to `src/gameFavicon.ts`. Asset names may differ from game IDs. The shared mapping powers both hub icons and the in-lobby browser favicon; preserve the Voedgoem favicon outside lobbies. If no asset exists or the match is ambiguous, report it and ask for the asset/choice rather than silently omitting this step.
3. **Add the game stylesheet and theme the hub bar:** put game-specific styling in `src/games/<id>/styles.css` and import it in `src/main.tsx` after the shared `src/styles.css`. Styles must load globally, even outside the game lobby, so that hub bars and statistics tabs are themed. Add `.hub-lobby[data-game="<id>"]` variables there for the bar surface/panel, edge, primary and secondary text, typography, radius, and shadow. Keep Join/Show and Close actions on the shared hub button styling for every game; do not override those buttons to match the game's theme. The hub bar itself can be game-themed, but its shared outer section is not.
4. **Keep game styling scoped:** game-specific rules must be anchored to the canonical game ID, such as `body[data-game="<id>"]`, `.hub-lobby[data-game="<id>"]`, or `.stats-modal[data-game="<id>"]`. Never restyle a shared `.card`, `.page`, generic `button`, or outer hub section because a game happens to be present; avoid broad `:has()` selectors. In particular, the hub's outer section card is shared by every game and is not the game bar.
5. **Theme all lobby controls:** style every game-owned button and input, including primary, secondary, danger, hover, focus-visible, and disabled states. The app header controls (including Leave lobby) inherit global arcade styling, so override them only under `body[data-game="<id>"]`. The admin test-bot panel is rendered outside `GameLobby` in `LobbyPage`; explicitly theme `.page .bot-panel` and its text, card, and enabled/disabled buttons under the game-scoped body selector. Do not let bot-panel rules change generic cards or controls for other games.
6. **Use the standard lobby structure:** a newly created game starts in a pregame lobby with everyone a spectator; never auto-seat users. Players explicitly join an available team, role, or seat, and can return to spectating where the rules permit. Show the live spectator list in a right-side tab/panel. Put host actions in the bottom `HostControlsTab` (including Start game, with clear disabled/readiness guidance); do not bury them in the game board or general lobby content. Admin test-bot controls remain in the shared bottom bot panel. Keep these shared locations consistent across games, even when their contents and game-specific styling differ.
7. **Wire statistics end to end:** implement `takeResult` with accurate per-player `role`, `won`, and game-specific `flag`, `score`, and `extra` values; exclude bots from persisted user results. Register meaningful aggregate definitions in server `src/stats.ts`, using those fields consistently. Keep canonical IDs consistent across registry, results, and `/api/stats/:game`; routes must support hyphenated IDs.
8. **Theme statistics in both contexts:** add the game's `.stats-tab[data-tab-game="<id>"]` variables and normal, hover, and selected states. Also supply `.stats-modal[data-game="<id>"]` variables and theme its panels, cards, text, table, inputs, pagination, and modal controls. A tab must retain its own appearance when selected while a different game's modal theme is active.
9. **Implement and verify every test-bot control:** the admin test-bot panel is shared UI outside `GameLobby`, but each game must support its full lifecycle:
   - **Add bot / Remove:** these are handled by the shared lobby server. Ensure the game's participant, disconnect, capacity, and snapshot logic treats bot IDs like player IDs where appropriate, and removes their game state cleanly.
   - **Bots join game:** implement the server module's `openSpots(state, userId)` to return valid join messages for every available seat/team/role, or `[]` when the bot cannot join. The shared server applies those messages through the normal game handler. Respect lobby phase and capacity; do not make a bot a participant merely because it was added.
   - **Control / Play as me:** admin snapshots include a separate game snapshot for each bot. Keep per-viewer information correct for that bot, and ensure the existing lobby UI can submit normal game actions as the selected bot.
   - **Control bot whose turn it is:** add a case to `getTurnBotId` in `src/pages/LobbyPage.tsx` that identifies the acting bot in the game's current phase/step. Return `null` when no bot needs a manual action; account for games with simultaneous or host-confirmed steps rather than guessing from a stale turn field.
   - **Autopilot:** implement the server module's `botMove(state, botId, options)` to return a legal next game message or `null` when that bot has no automatic action to take. The shared server repeatedly applies legal bot moves while Autopilot is on. Make sure bots do not act when it is off, and that automated moves respect the same validation and phase rules as human moves. If a game has no meaningful automated move, document that limitation rather than presenting a nonfunctional control.
   - **Verify the whole flow:** add tests for available/full join spots, bot actions and removal, plus automatic moves where supported. In a lobby, add multiple bots, join them, control one manually, exercise Autopilot, use turn-based control when a bot is up, and remove bots; check snapshots and team/seat counts update.

   Preserve spectator/display views and never expose hidden information in bot snapshots. Use the existing modal/navigation flow instead of leaving the running lobby to view statistics.
10. **Verify the actual surfaces:** build/typecheck both changed projects and run relevant existing tests. In the browser check the game's hub bar and its actions, lobby browser favicon, spectator list, host tab and readiness states, every lobby control (including disabled bot controls), statistics tab states, authenticated statistics response, and empty-results state. Switch tabs quickly to check that old responses/errors do not overwrite the current game. Verify desktop and narrow layouts. Do not call registration or compilation alone proof of complete integration.
