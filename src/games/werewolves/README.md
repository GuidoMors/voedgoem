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

## Mobile layout

Game styles live in `styles.css`. At widths up to 760px, the village uses
a two-column grid in seat order, with visible seat numbers instead of an
overlapping circle. Desktop keeps the circular table. Role visibility and
the lover, imitation and throat-cut indicators use the same server snapshot
and conditions in both layouts.

Mobile setup uses a compact two-column role picker, with single-column
settings and rules descriptions. Connected/offline pills appear below player
names in the mobile lobby. Buttons and text inputs have at least 44px
touch targets; text inputs use 16px type to avoid focus zoom. GM choices wrap
within the screen, and the confirmation summary appears before its button.
Upcoming steps and public events stack below the village and scroll within
bounded panels. Check 320px, 390px and 760px layouts with long names and a full
village, including GM, player and display views.
