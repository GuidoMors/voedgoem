# Dynasty of Hanshu

Color: brown

Gameplay: **Expansion** - They rapidly expand their villages across the map. Using their great population enact their laws.

## Lore

The Hanshu were the first Kin of the world. It was them that first evolved from hunters and beasts into farmers and civilization. Their ancient traditions taught them that the creator of the world and all life is the sun, who shaped all living beings from clay. Just as the sun has given life to all animals, it also feeds the plants in the soil. The harvesting of plants is sacred, and the wasting of it is severely punished.

As the first of the races to evolve, they claim the titles of kings of this world. The ruler of their dynasty has a long heridatery history, whose lineage, according to the Hanshu, can be traced back to the first beings shaped from the clay of the earth.

The apelike Kin of the Hanshu rigorously follow their ancient traditions of martial prowess and worship of their heritage. They believe everyone has their place, for some this means to be a shoemaker and for others this means to be a king. And for the Hanshu, this means to rule all others.

## Starting setup

// Each faction also claims their faction effect cards, faction building blueprint.
// These tables are the setup source of truth. See README.md: Editing Kin starting setups.

| Step | Building | Location | Terrain | Adjacent terrain | River | Minimum distance | Road to | Road length | Dedication | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| village | village | world | plains, snow, farmland | - | no | 3 | - | 0 | no | choose |
| village2 | village | world | plains, snow, farmland | - | no | 3 | village | 3 | no | choose |
| university | university | village | - | - | no | 0 | - | 0 | no | choose |

| Army count | Strength | Location |
| --- | --- | --- |
| 1 | 1 | village |

**Technologies**
- Claim the following technologies: Election Research.

# Faction building

## Daimyo Castle | building blueprint | ◼ | 🏯
> Resource cost: 3 lumber, 3 stone
> Build Power cost: 3
> Garrison: 5
> Build conditions: Cannot be built within 3 tiles of another Daimyo Castle.
> Effects: +1 [[army limit]]. +1 [[population]]. You may Deploy and Recruit on this building.


# Faction Effects

## Imperial Roads | effect card | core
> [[Building]] a [[Road]] [[untap]]s the [[character]] used to build it.
// Condition: You completed a Build action, the character was used to perform that action, and the building built was a Road.
// Trigger: Build, after the action resolves fully.
// Effect: Untap the character used to perform the Build action.

## Expansionists | effect card
> You may [[Build]] a [[village]] on [[farmland]]. A village or [[city]] built on farmland [[produce]]s 1 [[food]].
// 1 - Condition: You are building a village on farmland.
// 1 - Trigger: Build, when checking the build condition.
// 1 - Effect: Farmland is an allowed tile for building a village.
// 2 - Condition: A village or city is on farmland.
// 2 - Trigger: Seasons Change, before effects
// 2 - Effect: The village or city produces 1 food.

## Rice Fields | effect card
> [[Worksite]]s built adjacent to [[plains]] are Rice Fields 🌾 that [[produce]] 1 [[food]].
// 1 - Condition: You are building a Worksite.
// 1 - Trigger: Build, when checking the Building Conditions.
// 1 - Effect: Plains is an allowed tile for the Building Conditions of the Worksite.
// 2 - Condition: A Worksite is adjacent to plains.
// 2 - Trigger: Seasons Change, before effects.
// 2 - Effect: The Worksite is a Rice Field 🌾 that produces 1 food.

## Influential | effect card
> [[Authority]] is a resource only the Hanshu use. You gain 1 authority when the law you voted for is enacted. You gain 1 authority when a law is [[Revoked]] by another player. You may revoke a law card for 1 authority.
// 1 - Condition: The law you voted on is enacted in the Council event.
// 1 - Trigger: Council, after the law is enacted.
// 1 - Effect: Gain 1 influence.
// 2 - Condition: Another player revokes a law.
// 2 - Trigger: Revoke, after the law is revoked.
// 2 - Effect: Gain 1 influence.
// 3 - Condition: You have at least 1 influence and want to revoke a law.
// 3 - Trigger: Revoke, before the Payment step.
// 3 - Payment: Pay 1 influence.
// 3 - Effect: Revoke the selected law without having to tap any sources for build power.
// Extra Rules: Influence cannot be bartered.


# Characters

## Yamanano | Famous Architect | Expansion | 2 power
> ◫ Grand Works
> Short description: You may pay an [[authority]] to increase your votes during [[Council]] by 3.
> Condition: Have 1 or more influence.
> Trigger: Council, before the effect step.
> On trigger: Accept or decline.
> Payment: 1 influence.
> Effect: Your votes for that council are increased by 3.

## Yuguan | Lord of the Magnificent Beard | Control | 3 power
> ◫ Beard of the Ages
> Short description: You may [[Recruit]] for 1 [[authority]].
> Condition: Have 1 or more influence.
> Trigger: Recruit, before on trigger.
> On trigger: Decline trigger or continue.
> Payment: 1 influence.
> Effect: Skip selecting a character to tap for Recruit. Skip default payment of Recruit.

## Liangzhuge | Calculating Elemencer | Discovery and Control | 2 power
> ◫ Strategic Influence
> Short description: [1 [[authority]]]: Predict the number of [[hit]]s the opponent will roll in a [[Battle]] where this [[character]] is a [[general]]. If correct, [[block]] all hits dealt by the opponent.
> Condition: this character is used as a general, attacking or defending.
> Trigger: Battle, before the effect step
> On trigger: you write down a number, or decline the ability.
> Payment: 1 influence.
> Effect: if at the Battle step Resolve Dice the amount of hits is equal to the predicted number this Battle, block all hits of the enemy.

## Beiliu | Virtuous Uncle of the King | Expansion | 1 power
> ↷ Heavenly Virtues
> Short description: [4 [[authority]]]: Convert a [[hostage]] in your [[court]] into a useable [[character]].
> Condition: Expansion Phase. You have a hostage in your court. You have at least 4 influence.
> Trigger: Click this ability ruletext.
> On trigger: Select a hostage in your court.
> Payment: Tap this character. 4 influence.
> Effect: The selected character is no longer a hostage. You can freely use them as your own character.

## Bulu | Flying General | Control | 5 power
> ◫ Disloyal
> Short description: If unblocked hits are dealt to your [[army]] in combat with this [[character]] as its general, you must pay 1 [[authority]], or Bulu joins the opponent's [[court]].
> Condition: This character is used as a general, and the opponent deals unblocked hits to your army.
> Trigger: Battle, before Ambush.
> On trigger: Accept or decline. Accept can only be chosen if you have at least 1 influence.
> Payment: Pay 1 influence.
> Effect: Bulu remains in your court.
> On decline: Bulu leaves your court and joins the opposing player's court. Bulu becomes fully owned by the opposing Kin and retains this ability.

## Loong | Long-armed and Bare-knuckled | Discovery | 2 power
> ◫ Long Reach
> Short description: When you [[Move]] using this [[character]], you may spend 1 [[authority]] to set this character's [[power]] to 6 for the Move.
> Condition: This character is used for a Move, and you have at least 1 influence.
> Trigger: Move, before the Effect step.
> On trigger: Accept or decline.
> Payment: Pay 1 influence.
> Effect: Set this character's power to 6 for the Move.
