# Contributor instructions

- Read [README.md](./README.md) and the affected game's guide, if present, before changing game UI. Preserve their agreed interaction and styling requirements.
- Keep game-specific technical and interaction documentation in that game's `src/games/<id>/` folder; keep cross-game guidance in the project README.
- For every new game, complete the README's [Adding a game](./README.md#adding-a-game) checklist, including favicon discovery, hub bar styling, and statistics integration. Backend registration alone is not completion.
- Coordinate protocol, results, and statistics changes with the sibling [server project](../voedgoem-server/PROJECT_CONTEXT.md). Keep authoritative rules and permissions on the server.
- Validate relevant behavior with the existing tests/build and browser checks; visual changes need more than a successful compilation.
- Preserve unrelated work. Local migrations do not authorize remote migrations, deployment, or commits.
