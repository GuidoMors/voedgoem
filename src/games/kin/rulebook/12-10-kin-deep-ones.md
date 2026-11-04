# Deep Ones

Color: purple

Gameplay: **Subterfuge** - Through their scheming ways, they try to pit the other Kin against eachother.

## Lore
Dwelling in the deep lurk the Deep Ones. They have patiently kept an eye on the races living above the waterline, learning and scheming. The more they learn, the bolder they become; the more they scheme, the more naïve the landwalkers seem. Slowly, they pit them against each other from the shadowy background. A little betrayal here, a little sabotage there; emperors have fallen over less.

From the deep depths of the ocean, their sorcerers commune. Their rites and prophecies have revealed to them their destiny: conquering the world above is only the first of many steps toward domination of the vast galaxy in the stars above.

## Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | ocean | - | no | 3 | - | 0 | yes | choose |
| worksite | worksite | village | - | - | no | 0 | - | 0 | no | choose |
| worksite2 | worksite | village | - | - | no | 0 | - | 0 | no | choose |
| university | university | village | - | - | no | 0 | - | 0 | no | choose |

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

**Technologies**
- Claim the following technologies: Subterfuge Science.

# Faction building Blueprint

## Sleeping City | building blueprint | ◼ | 🔱
> Resource cost: 10 gold
> Build Power cost: 4
> Garrison: 6
> Build conditions: Must be built on an ocean tile.
> Effects: Worth 4 population. Produces 4 gold. +1 [[army limit]].

# Faction Effects

## Veil of the Deep | effect card | core
> [[Subterfuge card]]s cannot be played against you.
// Trigger: when deciding whether a subterfuge card can trigger against this player or not
// Effect: the subterfuge card cannot trigger

## Chosen Thrall | event card
> Secretly choose a [[character]] from another player's court. If that character is ever used as a [[general]] in combat against you, or used to [[Move]] an [[army]] adjacent to one of your armies, put it in your [[court]]. Then discard this card.
// Effect: The first time this is activated Deep Ones get a pop-up. There they select a character from another player's court in a dropdown. If that selected character is used as a general in combat against the Deep Ones, or if the Move action card is ever used to move an army adjacent to an army the Deep Ones own and the selected character was tapped to activate the Move, then the selected character is put into the court of the Deep Ones. The Move or Battle action card is immediately cancelled. No Battle or Move further takes place. This is still the end of that player's round. Then discard this card.
// Extra rules: when it is put into your court, it is not a hostage. They own the character fully and can use its ability and tap it to active cards. When this card is discard, it is gone from play. It cannot be found in any board or any discard pile. It cannot be recovered or ever activated again.

## Underwater Cult | effect card
> You can only [[Build]] [[villages]] on [[ocean]]s. Villages on ocean tiles must be dedicated to a [[resource]]. [[Worksite]]s on ocean tiles can be built in your villages and cities regardless of what tile is adjacent. Those Worksites [[produce]] the dedicated resource of their tile building, instead of what they would usually produce.
// 1 - Trigger: Build, when checking the Building Conditions.
// 1 - Effect: Ocean is the only allowed tile for building the village.
// 2 - Condition: You are building a village on an ocean tile.
// 2 - Trigger: Build, when determining the dedication of the village.
// 2 - On trigger: get a pop-up where a choice has to be made between gold, lumber, stone, or food. A choice MUST be made. this cannot be declined.
// 2 - Effect: the chosen resource becomes the dedicated resource of that village. Show an icon on the village to indicate what it is dediated to.
// 3 - Condition: a worksite is chosen for the Build action card
// 3 - Trigger: Build, when checking the Building Conditions for which building blueprints are allowed for that tile.
// 3 - Effect: Worksites can be built in villages and cities regardless of the adjacent tile.
// 4 - Condition: A Worksite is on an ocean tile in one of your tile buildings.
// 4 - Trigger: Seasons Change, before effects.
// 4 - Effect: The Worksite produces 1 resource of the type that the tile building, it is on is dedicated to.

## Benthic Walkers | effect card
> Short description: [[ocean]]s do not block you. Oceans have a tile speed cost for you of ½. You cannot [[Embark]], and your [[army|armies]] cannot be [[embarked]].
> 1 - Trigger: Move, when checking which tiles are allowed to be moved to.
> 1 - Effect: Oceans do not block you, and they have a tile speed cost of ½.
> 2 - Trigger: Embark, when checking whether you can take the action.
> 2 - Effect: You cannot take the Embark action.
> 3 - Trigger: Embark, when checking whether an army can be embarked.
> 3 - Effect: Your armies cannot be embarked.

## Whispered Gifts | event card
> Short description: The Deep Ones give another player a [[Subterfuge card]] of their choice.
> Condition: There is a card left in the subterfuge deck.
> Effect: During the Event Phase, choose another player. Then choose a remaining card from the subterfuge deck and give it to them. This card taps.


# Characters

## Iherat | Manipulating Mind Flayer | Discovery | 1 power
> ◫ Conversion
> Short description: [5 [[mana]]]: Add 2 [[ambush]] dice to the outcome of one side of a [[Battle]]. (You may choose either side and don't need to be a parcipant in the Battle)
> Trigger: Battle, before the ambush step
> On Trigger: Select one side of a Battle.
> Payment: Pay 5 mana. Tap this character.
> Effect: Add 2 ambush dice to the outcome of the selected side of the Battle.

## Sha’shi’oq | Shapeshifting Octopus | Expansion | 2 power
> ↷ Shapeshifter
> Short description: [1 [[mana]]]: Change the [[dedication]] of a [[village]] or [[city]] to another resource.
> Condition: You are the Deep Ones. There is a tile building whose dedication can be changed.
> Trigger: Click this ability ruletext.
> On Trigger: Select a tile building you own. Then select a resource to which you want to change its dedication.
> Payment: Pay 1 mana. Tap this character.
> Effect: Change the dedication of the selected village to the selected resource.
> Extra Rules: Only usable by the Deep Ones.

## Jahatri | Sworn Cultist | Expansion | 2 power
> ◫ Depthdelver
> Short description: [[Sleeping City|Sleeping Cities]] cost you 1 less [[gold]] to [[Build]].
> Trigger: Build, before the Payment step.
> Effect: Reduce the gold cost of Sleeping Cities by 1.

## Raheskah | Psychic Tentacle Abomination | Control | 1 power
> ◫ Dominator
> Short description: When this [[character]] is used as a [[general]], the opposing [[general]]'s [[power]] is set to 0 for this [[Battle]].
> Condition: This character is used as a general in a Battle.
> Trigger: Battle, before the Pool Strength step.
> Effect: Set the opposing general's power to 0 for this Battle.

## Ogilgalog | Slithering Ooze | Discovery | 1 power
> ↷ Shadowmelder
> Short description: Move an [[army]] on a [[city]], [[village]], or [[Sleeping City]] you control to another without an army.
> Condition: You control a city, village, or Sleeping City with an army. Another city, village, or Sleeping City you control has no army.
> Trigger: Click this ability ruletext.
> On Trigger: Select an army on a city, village, or Sleeping City you control, then select another city, village, or Sleeping City you control that has no army.
> Payment: Tap this character.
> Effect: Move the selected army to the selected destination.

## Dolomor Darkeye | Cunning Manta Pirate | Control | 1 power
> ◫ Cunning Deception
> Short description: After winning a [[Battle]] in which this [[character]] was the [[attacking general]], you may activate the effects of an opponent's [[subterfuge card]], regardless of its activation condition.
> Condition: You win a Battle in which this character was the attacking general. The opponent holds a subterfuge card.
> Trigger: Battle, after it resolves fully.
> On Trigger: Select a subterfuge card held by the opponent.
> Effect: Activate the effects of the selected subterfuge card against the opponent, regardless of its activation condition.

## Goahl’fiesj | Enchanted Anglerfish | Universal | 0 power
> ◫ Courtdweller
> Short description: If you have more [[character]]s in your [[court]] than any other player, this character has 1 [[power]].
> Condition: You have more characters in your court than any other player.
> Trigger: Seasons Change, after it resolves fully.
> Effect: Set this character’s power to 1 if you have more characters in your court than any other player; otherwise, set its power to 0.