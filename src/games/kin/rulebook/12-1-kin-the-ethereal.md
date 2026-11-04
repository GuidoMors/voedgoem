# The Ethereal

Color: pink

Gameplay: **Versatility** - They start with a faction effect from every other faction, and can cycle characters from their court.

## Lore
On a day like any other, from a distant place beyond our horizons, an ethereal being landed on our planet. Its origins unknown, its intentions unclear. At first the citizens of the world were hesitant or even outright aggressive.

But regardless of how they tried, they could not harm it and it did not seem as if it could harm them.

But what it could do is talk, and talk it did. Great knowledge it revealed to those that were patient enough to listen; about the stars, about the nature of life, and about the secrets of the earth. The truth of its words could not be doubted, as experiment after experiment proved its preachings to be true.

Kin began to worship it as a God, which it seemed to enjoy. It ordered its believers around, to build cities, universities and sanctuaries of learning and contemplation. But its detractors saw a more sinister intent behind its actions. Why would a God need armies? Why would a God try to replace their kings and leaders? Only time will tell how benevolent the Ethereal really is.

## Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | plains, snow | - | no | 3 | - | 0 | no | choose |
| worksite | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| worksite2 | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| university | university | village | - | - | no | 0 | - | 0 | no | choose |

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

| Extra | Enabled |
| --- | --- |
| other-faction-treaties | yes |

**Technologies**
- Claim the following technologies: [[Faction Diplomacy]].


# Faction building

## Grand Observatory | building blueprint | ⨺ | 🌙
> Resource cost: 3 of every [[basic resource]]
> Build Power cost: 4
> Garrison: 0
> Build conditions: Inside a [[city]]. Limit 1 per game.
> Effects: When built, gain up to 3 [[Faction Treaty|Faction Treaties]] of [[Kin]] not in the game that you do not already hold.


# Faction Effects

## Open Source | effect card | core
> When you [[Publicize]], gain 1 [[gear]].
// Trigger: Publicize, after it resolves fully.
// Effect: Gain 1 gear.

## Otherworldly Presence | effect card 
> You must draft the [[Ethereal]] as the first character in the character draft. The Ethereal cannot be used as a [[general]], held [[hostage]] by other players, or traded through [[Barter]].
// 1 - Condition: You are drafting characters.
// 1 - Trigger: Character draft, when you draft your first character.
// 1 - Effect: You must draft the Ethereal as your first character.
// 2 - Condition: The Ethereal is in your court.
// 2 - Trigger: Whenever a player attempts to use the Ethereal as a general or take it hostage.
// 2 - Effect: The Ethereal cannot be used as a general or taken hostage by another player.

## Student of the Ways | effect card
> You cannot break [[Faction Treaties]].
// Condition: You are about to break a Faction Treaty.
// Trigger: Treaty, before the effect that would break the treaty resolves.
// Effect: You cannot break the Faction Treaty.

## Quantum Collapse | effect card
> Random effects are predicted by the Ethereal:
> - You choose the [[subterfuge card]] when you win a [[Tactician]] bid.
> - You choose the outcome of [[ruins]] when [[Explore|Exploring]].
> - You choose the 3 [[law card]]s for the [[Council]] event.
// 1 - Condition: You win the bid for a secret tactics card.
// 1 - Trigger: Secret tactics card bidding, after you win the bid and before drawing a subterfuge card.
// 1 - Effect: Choose which subterfuge card to draw from the subterfuge deck.
// 2 - Trigger: Explore, when determining the ruins's contents.
// 2 - Effect: Choose whether the ruins contains a warp, treasure block, or relic block.
// 3 - Trigger: Council event, before drawing the 3 laws.
// 3 - Effect: Choose which 3 laws are drawn.


# Characters

## Ethereal | Otherwordly Presence | Universal | 4 power
> ↷ Foresight
> Short description: [[Claim]] a [[character]] from the [[character deck]], then put another character from your [[court]] into the character deck.
> Condition: Discovery Phase.
> On trigger: Select a character from the character deck, then select a character from your court. You cannot select the Ethereal. You cannot select a hostage in your court.
> Effect: Tap this character. Put the selected character from your court into the character deck. Claim the selected character from the character deck.
