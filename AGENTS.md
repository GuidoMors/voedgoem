# Contributor instructions

- Read [README.md](./README.md) before changing game UI. Preserve its agreed interaction and styling requirements.
- For every new game, complete the README's [Adding a game](./README.md#adding-a-game) checklist, including favicon discovery, hub bar styling, and statistics integration. Backend registration alone is not completion.
- Coordinate protocol, results, and statistics changes with the sibling [server project](../voedgoem-server/PROJECT_CONTEXT.md). Keep authoritative rules and permissions on the server.
- Validate relevant behavior with the existing tests/build and browser checks; visual changes need more than a successful compilation.
- Preserve unrelated work. Local migrations do not authorize remote migrations, deployment, or commits.
