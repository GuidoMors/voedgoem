# Beastmen Tribes

Color: dark red

Gameplay: **War** - They wish for armies to face eachother in mortal combat.

## Lore
Those that have been outcast from the civilizations of the world have nowhere else to turn than the Beastmen Tribes. Slowly, these outcasts’ bodies have become warped and mangled over time due to cross-species breeding. Bits and pieces of every species can be found if you look close enough at the body of a Beastman.

They call the resource-starved deserts their home, the only place the others would allow them to live.

But against the odds, they have not just survived; they have thrived. Their numbers grow and grow, and slowly but surely, the tables have turned against those that had once forsaken them. Now the time has come for them to reap what they have sown.

Their evolution has left them with little brains but lots of brawn. They have no gods but the strongest among them, their tribal chieftains, who lead them in great raids of greener pastures.

## Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | desert | - | no | 3 | - | 0 | no | choose |
| worksite | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| worksite2 | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| barracks | barracks | village | - | - | no | 0 | - | 0 | no | choose |

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

**Technologies**
- Claim the following technologies: Desert Movement, Greater Army Strength.

# Faction building

## Warband Camp | building blueprint | ◼ | 🛖
> Resource cost: 1 lumber
> Build Power cost: 1
> Garrison: 1
> Build conditions: Must be built on [[desert]].
> Effects: You may [[Recruit]] and [[Deploy]] on it as if it was a [[Barracks]].

# Faction Effects

## Honorless | effect card | core
> Recruiting [[army]] strength costs 1 [[food]] instead of 2.
// Trigger: Recruit, when calculating the cost.
// Effect: set the cost for the recruit to 1 food instead of 2 food.

## Salvage | effect card
> When you [[Demolish]], you gain back the resources spent on the building.
// Trigger: Demolish, when it resolves.
// Effect: Gain the resources of the resource cost of the building type of the demolished building.

## Desert Dwellers | effect card
> You may [[Build]] on [[desert]] tiles as if they were [[plains]].
// Trigger: Build, when checking the Building Conditions for which building blueprints are allowed for that tile.
// Effect: Desert tiles are treated as plains for the purpose of determining which building blueprints are allowed.

## Great Feasts | effect card
> When an [[army]] in a [[Battle]] is [[disband]]ed because of you, gain 1 [[food]], even if the disbanded army is your own.
// Condition: An army in a Battle is disbanded.
// Trigger: Battle, when the action has fully resolved.
// Effect: Gain 1 food.


# Characters

## Horned Hoof | Satyr with Barbed Hoofs | Discovery | 2 power
> ↷ Trampler
> Short description: [1 [[mana]]]: Choose an [[army]] of 1 [[strength]] adjacent to an army you own. Deal 1 [[hit]] to it.
> Condition: There is an army of strength 1 adjacent to an army you own.
> Trigger: Click this ability ruletext.
> Payment: Pay 1 mana. Tap this character.
> Effect: Choose an army of strength 1 adjacent to an army you own. Deal 1 hit to it.

## Bull of Akantash | Giant Minotaur Three Stories Tall | Control | 3 power
> ◫ Feast on Slaughter
> Short description: When this [[character]] is used as an [[attacking general]] and your [[army]] survives, it gains 1 [[strength]].
> Condition: This character is used to declare Battle, and the attacking army survives.
> Trigger: Battle, after the action fully resolves.
> Effect: The attacking army gains 1 strength.

## Grog, Og ’n Zog | The Three Dumbest and Fattest Orcs | Expansion | 3 power
> ↷ Of Three Minds
> Short description: Randomly either: 
> - gain 1 [[strength]], 
> - [[move]] an [[army]] to a [[desert]], 
> - [[untap]] another [[character]] in your [[court]].
> Condition: Expansion Phase.
> Trigger: Click this ability ruletext.
> On trigger: tap this character. roll a d3. on dice result 1: select an army not at maximum strength. on dice result 2: select an army adjacent to a desert, then select an adjacent desert. on dice result 3: select a tapped character in your court. or decline.
> Effect: on dice result 1: gain 1 strength on the selected army. on dice result 2: move the selected army to the selected tile. on dice result 3: untap the tapped character

## Dinker | Half-Orcen “Philosopher” | Discovery | 1 power
> ↷ Out Thinkin’
> Short description: Choose one: 
> pay 1 [[food]] to gain 1 [[stone]], 
> pay 1 [[stone]] to gain 1 [[gold]], 
> pay 1 [[gold]] to gain 1 food.
> Condition: Discovery Phase. You can pay the resource cost of at least one option.
> Trigger: Click this ability ruletext.
> On Trigger: select one of the options. You must be able to pay the resource of the option.
> Payment: Tap this character. pay the selected resource to be paid.
> Effect: gain the selected resource to be gained.

## Gorengar the Black | Orc Chieftain Covered in Scars and Tar | Control | 2 power
> ◫ Black Tar Skin
> Short description: When this [[character]] is used as a [[general]], attacking or defending, add 2 [[blocks]] to your combat result.
> Condition: This character is used as a general, attacking or defending.
> Trigger: Battle, before the Resolve Dice step.
> Effect: Add 2 blocks to your dice result.

## Dorhor of Norvador | Troll King of the Hill Trolls | Control | 1 power
> ◫ Troll King Stash
> Short description: When this character is the [[attacking general]] in [[Battle]], you may reroll up to 3 [[combat dice]] after seeing the results.
> Condition: This character is the attacking general.
> Trigger: Battle, before the Resolve Dice step.
> On Trigger: accept or decline. Then select 3 of the dice this player rolled this combat.
> Effect: Reroll the selected dice.