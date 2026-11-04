# Seven Streams Syndicate

Color: blue

Gameplay: **Trade** - They levy their position on rivers to grow rich on trade.

## Lore
The water-dwelling, scaly, and slimy creatures that live in the rivers crisscrossing the world were always lorded over by others. They might have been in a position for domination, but the smartest among them smelled opportunity. While the kings, emperors, and chieftains fought, they sold them arms; while they bickered over laws and grudges, they bribed their diplomats.

Their society revolves around trade, economic deals, and business. Always business. And business is ruthless. The biggest businessmen among them have conglomerated into a syndicate that holds an iron grip on the market. Against their monopoly, no other stands a chance of breaking in.

# Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | plains, snow | - | yes | 3 | - | 0 | no | choose |
| worksite | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| harbor | harbor | village | - | - | no | 0 | - | 0 | no | choose |
| university | university | village | - | - | no | 0 | - | 0 | no | choose |

// The starting Harbor follows normal Harbor conditions: adjacent to a river or ocean, with at most one Harbor per tile building.

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

**Technologies**
- Claim the following technologies: Trade Diplomacy, Harbor Construction, River Movement

# Faction building Blueprint

## Guild Hall | building blueprint | ⨺ | ⚜️
> Resource cost: 2 lumber, 3 gold
> Build Power cost: 3
> Garrison: 0
> Build conditions: Inside a city. Limit 1 per city.
> Effects: When built, convert all your [[tradegoods]] into a basic resource of your choice. Cannot be demolished by the Demolish action.


# Faction Effects

## Tradespeopple | effect card | core
> Gain 1 [[gold]] when you receive a [[Trade Treaty]] from another player.
// Condition: You receive a Trade Treaty from another player in this barter.
// Trigger: Barter, when it resolves.
// Effect: Gain 1 gold.

## Tradegoods | effect card
> Tradegoods are a [[bartering goods]] only you generate. When you [[Barter]] them to another player, assign them a basic resource type. The receiver gets that resource instead. Your [[Harbor]]s [[produce]] 1 Tradegoods, and each [[Trade Treaty]] you hold from another player produces 1 Tradegoods.
// 1 - Trigger: Barter, when selecting to add Tradegoods to a barter offer.
// 1 - Effect: Add a window next to the Tradegoods quantity where you can select which resource the Tradegoods turns into upon a successful barter. The selected resource type determines what resource the receiver gains upon successfully completing the barter.
// Tradegoods can only be contributed from the Syndicate's side. Another player composing an offer with the Syndicate may request its Tradegoods and choose which basic resource they receive upon acceptance.
// 2 - Condition: You own a harbor.
// 2 - Trigger: Seasons Change, before effects.
// 2 - Effect: Each harbor you own produces 1 Tradegoods.
// 3 - Condition: You hold a trade treaty from another player.
// 3 - Trigger: Seasons Change, before effects.
// 3 - Effect: Each trade treaty you hold from another player produces 1 Tradegoods.

## Ruthless Capitalists | action card
> Pay 3 [[Tradegoods]] to exchange [[trade treaty|trade treaties]] with a player you are connected to and do not already have a Trade Treaty with.
// Phase: Discovery
// Condition: You are connected to a played of whom you do not hold a trade treaty, and who does not hold a trade treaty of yours. You have 3 tradegoods.
// On trigger: Select an untapped Discovery Character/Activation Card. Select a player of which you don't hold a trade treaty of, and whom don't hold a trade treaty of yours.
// Payment: Tapping the selected character/activation card. Pay 3 Tradegoods.
// Effect: You and the selected player each gain a [[Trade Treaty]] from the other.

## River Roamers | effect card
> You can [[Build]] a [[village]] on an tile connected by [[river]] to another village you own, without needing an army there or an adjacent building.
// Condition: You are building a village
// Trigger: Build, when checking the eligible tiles to build on
// Effect: Add all tiles to the build location options which are adjacent to rivers which connect through river tiles to a village you own.


# Characters

## Velzero | Opportunist Tollwoman | Control | 1 power
> ◫ River Toll
> Short description: When an [[army]] moves across a [[river]] attached to a [[village]] you own within 3 [[tile distance]], you may demand 1 [[gold]] from its owner.
> Condition: An army is moving across a river attached to a village you own within 3 tiles.
> Trigger: Move, when a speed is spend by an army to move across a river edge.
> On Trigger: You may demand that the army's owner pay 1 gold, or decline. If you demand: They may accept or decline.
> Effect: If they decline, they break all their treaties with you and pay 1 gold per treaty broken. They suffer the consequences as if the treaties were broken through Battle. If they accept: gain 1 gold.
> Extra Rules: If they cannot afford the full amount of gold needing to be paid, they pay all the gold they have in court.

## Anvatsio | Master of Coin | Discovery | 2 power
> ↷ Trickle Down Economics
> Short description: Choose another player with whom you have a [[Trade Treaty]]. They gain 2 [[gold]].
> Condition: You have a trade treaty with another player.
> Trigger: Click this ability ruletext.
> On Trigger: Select another player who holds your trade treaty.
> Payment: Tap this character.
> Effect: The selected player gains 2 gold.

## Koroko | Market Cryer | Discovery | 1 power
> ↷ Marketeer
> Short description: [1 [[tradegood]]]: Gain 2 [[gold]].
> Condition: You have at least 1 tradegood.
> Trigger: Click this ability ruletext.
> Payment: Pay 1 tradegood. Tap this character.
> Effect: Gain 2 gold.

## Carvano | Leader of the Great Caravans | Expansion | 3 power
> ↷ The Great Festival
> Short description: (every other player has your [[trade treaty]]): You gain 1 [[relic]] per [[trade treaty]] in your [[court]]. (You may only use this ability once per [[chapter]])
> Condition: Every other player holds your trade treaty. You have trade treaties in your court. You have not yet used this ability this chapter.
> Trigger: Click this ability ruletext.
> Payment: Tap this character.
> Effect: Gain 1 [[relic]] per trade treaty in your court.

## Qumono | Sly Negotiator | Control | 1 power
> ◫ Merciful Plea
> Short description: When an opponent attacks you while this [[character]] is chosen as your [[defending general]], they must pay you 2 [[gold]] or cancel the attack.
> Condition: An opponent declares an attack against you, and this character is chosen as your defending general.
> Trigger: Battle, before the pool strength step.
> On Trigger: choose to accept or decline
> Payment: Pay 2 [[mana]].
> Effect: The attacking player gets a popup to accept or decline. If they accept they must pay 2 gold. If they decline the Battle is cancelled.
> Extra rules: If they do not have enough gold in their court to pay, they pay all the gold they have.

## Sunumo | The Tidebringer | Discovery | 2 power
> ↷ Tsunami
> Short description: [3 [[mana]]]: Destroy a [[building]] next to an [[ocean]] and within 3 [[tile distance]] of an [[army]] you own. (This counts as an attack and may break [[treaty|treaties]])
> Condition: There is a building next to an ocean and within 3 tiles of an army you own.
> Trigger: Click this ability ruletext.
> On Trigger: Select a building next to an ocean and within 3 tiles of an army you own.
> Payment: Pay 3 mana. Tap this character.
> Effect: Destroy the selected building.
> Extra Rules: This counts as an attack for the purpose of breaking treaties.
