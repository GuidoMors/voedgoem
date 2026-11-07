# Tetris frontend guide

Players start as spectators and join a free-for-all game or a team in the
waiting lobby. The host chooses free-for-all or up to eight teams, can shuffle
teams and starts the game when at least one player has joined. Results remain
visible until the host returns the lobby to the waiting room.

In free-for-all each player has a separate board with the same piece sequence.
Team members instead share one board, ten columns wide per member, with a
separate entry lane for each player. Team score, lines and level are shared.
The server simulates team play; the solo game runs on the client.

`Lobby.tsx` selects the waiting, playing and results views. `TetrisPlayer.tsx`
and `BoardView.tsx` render solo play, while `TeamPlayer.tsx` and
`TeamBoardView.tsx` render team play. Coordinate protocol or rules changes with
the sibling server's Tetris implementation and preserve spectator views.

On narrow screens the touch controls appear above the board. Verify both solo
and team views, controls, score presentation and results in a browser when
changing the layout.
