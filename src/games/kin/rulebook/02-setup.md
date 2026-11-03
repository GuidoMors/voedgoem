# Setup

## 1. Build the world

- The [[world board]] is 14 rows by 20 columns of pointy-top hexes. These empty tiles are [[ocean]] tiles. Rows are counted from the top, and every odd row (the 2nd, 4th, ...) is shifted half a hex to the right.
- Make a pile of 36 land tiles: 12 [[mountain]], 12 [[forest]], 12 [[farmland]].
- Starting with the host player and going clockwise, each player places one tile from the pile on an ocean tile until the pile is gone. The player chooses which type of tile to take; the number of tiles left of each type is public.

## 2. Fill by climate

Every ocean tile next to a mountain, forest or farmland tile becomes a climate tile based on its own row, regardless of the adjacent land type:
- [[snow]], in the top 2 or bottom 2 rows.
- [[desert]], in the middle 2 rows.
- [[plains]], in every other row.


## 3. The last tiles

- Make a pile of 12 land tiles: 4 [[plains]], 4 [[snow]], 4 [[desert]].
- Starting with the host player and going clockwise, each player places one tile from the pile on an ocean tile (matching climate) until the pile is gone. The player chooses which type of tile to take; the number of tiles left of each type is public.

## 4. Rivers

Starting with the host player, clockwise, each player creates a river until six exist.

These are the rules to create a river:
- Choose a vertex which is adjacent to a [[mountain]]. This is the river's free end.
- Choose an adjacent vertex to the free end, then place a [[river]] on that edge.
- Continue the river edge by edge from its free end; its path may bend, but may not share an edge with or cross another river.
- Stop when the free end touches a [[river]] or [[ocean]], or when no legal continuation remains. A river may not start on a vertex that already has a river on it.

## 5. Kin

5.1 Picking Kin: Starting with the host player, clockwise, each player picks a different [[Kin]].
5.2 Kin Setup: In [[natural order]], complete the steps in the [[starting setup]] of your Kin.

Starting buildings obey their normal Build conditions. If no tile is available for a starting building, a player may choose an ocean tile in the climate zone required by that building, convert it to the required tile type, and place the building there. The tile must satisfy the building's other conditions.

# Natural order

1. [[The Ethereal]]
2. [[Dynasty of Hanshu]]
3. [[Wanderers]]
4. [[Pride of Lumon]]
5. [[Beastmen Tribes]]
6. [[Archive Ark]]
7. [[Hammers of the Ash]]
8. [[Seven Streams Syndicate]]
9. [[Children of the Great Tree]]
10. [[Deep Ones]]

## 6. Characters

- Stack the neutral characters and the regular characters of the picked [[Kin]]. Sort them by [[archetype]].
- In natural order each player [[claim]]s a characer belonging to their Kin. ([[The Pride of Lumon]] must pick [[Lumon]] in this step. [[The Ethereal]] must pick the [[Ethereal]] in this step.)
- In natural order each player [[claim]]s a [[Discovery]] character.
- In natural order each player [[claim]]s an [[Expansion]] character.
- In natural order each player [[claim]]s a [[Control]] character.
- Leftover characters form the [[character deck]].
