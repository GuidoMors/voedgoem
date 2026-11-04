# Hammers of the Ash

Color: black

Gameplay: **Production** - They wish to create great crafts from their mountain cities.

## Lore
The stout and rugged Ashen-dwarves have dwelt deep in the caverns beneath the mountain peaks. Unopposed and unphased by the outside world, they have dug deep halls into the depths of the earth.

In their excavations, they find all kinds of valuable minerals and metals, with which their craftsdwarves complete unmatched artifacts and projects. Most prized and rare of all their mined valuables is gold, which they gladly trade with the surface dwellers for their artifacts.

Their giant underground fortresses of golden halls and diamond thrones are unmatched in the world above. There they feast upon their fortune and drink their finest grog. What expertise they have in feasting, they lack in diplomacy, subterfuge, or trade. But their unbridled greed for gold has forced them to interact with the surface dwellers.

## Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | mountain | - | no | 3 | - | 0 | no | choose |
| worksite | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| worksite2 | worksite | village | - | farmland, forest, mountain | no | 0 | - | 0 | no | choose |
| university | university | village | - | - | no | 0 | - | 0 | no | choose |

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

**Technologies**
- Claim the following technologies: Tactician Science, Mountain Movement, Smith Construction.


# Faction building Blueprint

## Brewery | building blueprint | ⨺ | 🍺
> Resource cost: 1 lumber, 2 stone
> Build Power cost: 2
> Garrison: 0
> Build conditions: Must be next to a river, inside a tile building. Limit of 1 inside of a tile building.
> Effects: When built, draw a random [[tactics card]].


# Faction Effects

## Master Smiths | effect card | core 
> Your [[Smith]]s reduce build power cost by 2 instead of 1 on that tile.
// Conditions: There are Smiths on the selected tile of the Build action
// Trigger: Build, when calculating the build power cost.
// Effect: Each Smith reduces the build power cost by 2 instead of 1 on that tile.

## Craftdwarves | action card 
> You may [[claim]] the top card of the [[tactics deck]] for 5 [[gold]].
// Phase: Expansion
// Condition: You have at least 5 gold. The tactics deck is not empty.
// On trigger: Select an untapped Expansion Character/Activation Card.
// Payment: Tapping the selected character/activation cards. Pay 5 gold.
// Effect: Take the top card of the tactics deck.

## Finders Keepers | effect card
> During the [[Tacticians]] event, you bid first for a regular [[tactics card]], before everyone else. Then bidding continues in [[natural order]].
// Condition: The Tacticians event is resolving, and the drawn card is a regular tactics card.
// Trigger: Tacticians, when determining the bidding order.
// Effect: You bid first. After your bid, bidding continues in natural order.
// Extra Rules: This ability does not work if the drawn card is a secret tactics card.

## Mountain Folk | effect card
> You may [[Build]] on [[mountains]] as if they were [[plains]].
// Trigger: Build, when checking the Building Conditions for which building blueprints are allowed for that tile.
// Effect: Mountains are treated as plains for the purpose of determining which building blueprints are allowed.



# Characters

## Khaz | Mining Overseer | Expansion | 2 power
> ◫ Bountiful Quarry
> Short description: (3 [[brewery|breweries]]): This character's power is 4.
> Trigger: Seasons Change, after it resolves fully
> Effect: Set this character’s power to 4.

## Daxgrim | Wielder of the Golden Hammer | Control | 2 power
> ↷ Arkenax, the Golden Hammer
> Short description: [2 [[gold]]] - (2 [[brewery|breweries]]): Transfer 1 [[strength]] from an adjacent [[army]] to your army.
> Condition: Own at least 2 breweries. There is an army adjacent to an army you own.
> Trigger: Click this ability ruletext.
> Payment: Pay 2 gold. Tap this character.
> On Trigger: Select an army adjacent to an army you own.
> Effect: Transfer 1 strength from the selected army to your army.

## Uhzrun | Master Gold Smelter | Expansion | 1 power
> ↷ Gold Refiner
> Short description: Turn up to X [[stone]] into X [[gold]], where the maximum of X is the number of [[brewery|breweries]] you control.
> Condition: You control at least 1 brewery and have at least 1 stone.
> Trigger: Click this ability ruletext.
> On Trigger: Choose how much stone to turn into gold, up to the number of breweries you control, and up to the maximum of stone in your court.
> Payment: Tap this character. Pay the chosen amount of stone.
> Effect: Gain gold equal to the amount of stone paid.

## Jaggengrog | Charismatic Conscriptor | Control | 0 power
> ↷ Drunken Conscription
> Short description: Gain 1 [[gold]] for each [[Brewery]] you own.
> Condition: own at least one brewery
> Trigger: click the ability ruletext of this ability
> Payment: tapping this character
> Effect: Gain 1 gold for each brewery owned by this player on the world board.

## Gottrek | Feasting Strategist | Discovery | 0 power
> ◫ Strategic Itinerary
> Short description: This [[character]]’s [[power]] equals the number of [[brewery|breweries]] you own, up to 5.
> Trigger: Seasons Change, after it resolves fully
> Effect: Set this character’s power to the number of breweries you own, up to a maximum of 5.

## Rohdrimbral | The Shrewd Governor | Discovery | 3 power
> ↷ Counterfuge
> Short description: When a [[secret tactics card]] is drawn during a [[tactician]] event, you may discard it and draw a new card for that auction.
> Condition: A subterfuge card is drawn in the Tactician event.
> Trigger: Tactician Event, immediately after a card is drawn.
> On Trigger: Accept or decline.
> Payment: Tap this character.
> Effect: Discard the secret tactics card and draw a new card from the tactics deck.
