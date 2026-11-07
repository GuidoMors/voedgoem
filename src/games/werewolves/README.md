# Werewolves frontend guide

The game is guided by a GM through setup, night and day steps. The GM sees
upcoming steps and can record or adjust eligible player choices before
confirming the current step. The Previous and Next controls show completed
steps as **read-only history**; they do not undo gameplay.

Private results and prompts are visible only to the intended player and GM.
Where a step requires acknowledgement, the player or GM can record the
response and the GM cannot continue until it is confirmed. Undrafted roles
that are in the role pool can produce a GM-only pretend step, with no player
action or effect; roles outside the pool are skipped.

The village shows public death and reveal information. Lovers and Wolfchild
imitation relationships are always visible to the GM, but players see their
own relationship indicators only during the relevant meeting or acknowledgement
step, or while viewing their secret role. A revealed Throatcutter victim has a
red broken border during the day. A victorious Fool is publicly revealed and
out of play without being recorded as dead.

`Lobby.tsx` renders the village, player actions and GM controls; `types.ts`
describes the frontend snapshot. The sibling server owns the step queue,
validation, role visibility and outcomes. Never infer hidden roles or eligibility
in public UI: use the appropriate viewer-specific server snapshot.

When changing these flows, test GM, affected player, unrelated player and
display views, including required confirmations and historical navigation.
Use isolated fixtures rather than taking actions in a live game.
