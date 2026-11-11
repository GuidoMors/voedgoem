# Plenet - frontend guide

The frontend is implemented from `C:\Users\Nils\Downloads\Waar ligt dat land_.html`.
Coordinate wire-format and game-rule changes with the sibling server guide at
`../../../../voedgoem-server/src/games/waar-ligt-dat-land/README.md`.

## Game loop and player experience

- The game is a turn-based geography quiz. Each turn, the active player draws a
  country, finds it on a rotatable orthographic globe, and then answers one country
  trivia question if they find it within three attempts.
- Correct country guesses score 3, 2, or 1 points on the first, second, or
  third attempt. Three incorrect guesses score 0; reveal the target country.
- Finding the country leads to one trivia question worth 1 additional point.
  Balance question selection between true/false and open-ended questions.
  True/false questions are checked immediately by the game. For open-ended
  questions, the active player answers first; after the answer is revealed,
  the next connected player in turn order approves or rejects it. If no other
  player is connected, the active player reviews their own answer.
- After the turn's feedback, the active player advances to the next turn. The
  game ends after the configured number of rounds has been played by every
  participant. Rank by total score; equal scores are ties.
- Draw country cards without replacement until the deck is exhausted, then
  reshuffle the country set.

The supplied HTML starts with two local player names, allows 1–8 players, and
defaults to five rounds per player. Preserve the 1–8 limit and 1–50 rounds
range unless product requirements change; validate those limits on the server.
The host chooses rounds before starting. Use the standard game lobby and
explicit participant seating; do not reproduce the standalone Claude room,
custom four-letter room code, or browser-local multiplayer protocol.

## Lobby and turn UI

- Follow the shared lobby lifecycle: start in a waiting room, keep connected
  users as spectators until they explicitly join, and show the live spectator
  list in the shared spectator panel.
- Put the host's rounds-per-player setting and Start game action in the shared
  bottom `HostControlsTab`. Disable Start until there is at least one seated
  participant and show clear readiness guidance.
- Show participant names, scores, and the active-turn highlight throughout
  play. Only the active participant can draw, select a country, answer a
  question, reveal an open-ended answer, or advance the turn. Only open-ended
  answers are reviewed by the next connected participant in turn order.
- Present the country clue on a card and a rotatable, zoomable SVG globe beside
  or below it. Drag to rotate, use the wheel or zoom controls to zoom, and click
  a country to guess. Keep the searchable country input and keyboard controls
  available for accessible input.
- Give immediate feedback for incorrect guesses, including the guessed
  country's name, approximate great-circle distance to the target, and
  remaining attempts. Mark incorrect guesses so they cannot be selected again
  during that turn.
- On a correct guess or exhausted attempts, reveal and highlight the target
  country. On a correct guess, show the trivia card, category, answer controls,
  and scoring feedback. The clue country name is visible from the start, but
  do not reveal its map location while guesses remain.
- Do not show country names as visible globe labels or hover tooltips. Allow
  each player to switch the interface, country names, categories, questions,
  and answers between Dutch and English; keep the language preference local
  to that player. English trivia is currently translated for the Netherlands,
  Belgium, Germany, France, Spain, Italy, Greece, the United Kingdom, Ireland,
  Iceland, Portugal, Sweden, and Norway. Generate English geography questions
  for other countries and show the original Dutch for their other questions
  until translations are available.
- At game end, show a score-ordered results view with ties represented
  accurately. Let the host return to the lobby using the shared host controls.

## Map and content

- The source HTML uses an orthographic globe. The app projects simplified
  Natural Earth 1:110m country paths in `map-data.ts` onto an interactive
  orthographic globe using `d3-geo`, plus point markers for small countries
  without a path. Incorrect guesses are shaded by distance to the target.
  Country IDs are ISO-3166 alpha-3. The
  geometry is public domain from Natural Earth
  (https://www.naturalearthdata.com/); the supplied HTML's fallback points
  are used for microstates/islands. Bundle the map and its projection locally;
  do not rely on the original remote D3/TopoJSON/Datamaps scripts.
- Keep map geometry/presentation in the frontend. The server owns the
  authoritative country IDs, names, question set, current target, question
  selection, and scoring. Ensure map IDs match the server's canonical IDs;
  document any small-country centroid/geometry fallbacks with the map asset.
- The server includes the source's six trivia categories and six questions
  per country in `questions.ts`, with both true/false and open-ended
  questions. Review factual accuracy and wording before release.

## Privacy, accessibility, and resilience

- Do not put the target map ID/geometry or true/false answer in public
  snapshots before reveal/resolution. The clue country name is public. Use the
  server snapshot contract and verify spectator, active-player, and other-
  player views.
- True/false questions are scored immediately by the server. Open-ended
  answers are reviewed once by the next connected player in turn order; only
  when no other player is connected may the active player review their own.
- Make active-player controls visibly disabled for spectators and other
  participants. Include keyboard-accessible country search, arrow-key globe
  rotation, plus/minus zoom, and a reset shortcut in addition to pointer input.
- Provide text alternatives for country highlights, attempt count, question
  category, score changes, and map instructions. Honor reduced motion for globe
  rotation and card transitions.
- Handle a missing country geometry, reconnect, duplicate action, and a
  participant disconnecting mid-turn without wedging the match. The server
  skips that turn and snapshots remain the recovery source; do not depend on
  browser-local game state.

## Integration checklist

- Add the game's snapshot type and lobby renderer to the frontend registry.
- Put CSS in `styles.css`, import it globally, and scope all game, hub-bar,
  bot-panel, and statistics styles to the canonical game ID.
- Follow the main README's [Adding a game](../../../README.md#adding-a-game)
  checklist for favicon discovery, shared controls, statistics, and browser
  verification.
- Coordinate result fields, actions, snapshots, question content, and test-bot
  support with the [server guide](../../../../voedgoem-server/src/games/waar-ligt-dat-land/README.md).
- Add focused tests for map ID handling, active-turn gating, attempts,
  scoring/feedback, trivia grading, round completion, and results.
- Verify desktop and narrow/mobile layouts in a browser; a successful build
  alone does not validate map gestures or readability.
