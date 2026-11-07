# Kin frontend guide

This guide covers Kin-specific UI, data generation and interaction requirements.
The sibling server owns game state, validation and rules. For general setup,
testing and deployment, see the [project README](../../../README.md).

The Kin character draft separates draftable and undraftable characters, followed by one section per player's drafted characters. Cards wrap onto new lines within each section.

Setup does not show Building templates or Card templates galleries. Keep the actual setup board and claimed starting cards.

River setup selectors are blue when starting or continuing a river, and red when that placement ends it. The server predicts endings using the same rules as actual river placement.

Kin setup host controls omit the "Host controls & rules" heading, while retaining their controls. During a started game, hide the Test bots panel when no bots exist; retain it in the waiting lobby so admins can add bots.

Claim a draftable character by clicking its card or pressing Enter/Space while focused. Draftable cards keep their archetype borders without an extra highlight outline.

Pick an available Kin by clicking its card or pressing Enter/Space while focused; there is no separate Pick button. Eligible cards enlarge and glow on hover/focus. Each card's top-right information button opens that Kin's rulebook page without picking the Kin.
Kin selection cards show the Gameplay description from their Kin document, followed by the core faction effect rendered with the shared card template in a compact, width-fitting layout.
After a Kin game starts, the site navigation defaults to collapsed. Its fixed top-right arrow reveals the menu over the game header with a fast slide animation, without shifting the board; waiting lobbies and other games retain normal navigation.
Buildings on the world and Ark boards open their blueprint card when clicked or activated with Enter/Space. Inspection is disabled during active board selection so building placement, movement, and other targeting keep priority.

After changing Kin card rules, run `node scripts/gen-cards.mjs` in `voedgoem-server` to regenerate the shared card data. Resource links in blueprint costs must be retained for resource icons; the server parses those links when calculating payments.

## Editing Kin starting setups

The **Starting setup** section of each `rulebook/12-*-kin-*.md` is the single source of truth for that faction's starting buildings, armies, technologies and special extras. Edit the Markdown, then run `node scripts/gen-cards.mjs` in the sibling `voedgoem-server` project. It validates the tables and generates both projects' shared data; do not edit the generated data or add faction-specific rules to the setup engine. Changes apply to new setups, not already placed pieces. Do not reorder or rename steps while a saved game's setup is in progress.
The in-game rulebook presents these setup tables as readable building and army instructions, not tables. Those instructions are generated from the same setup data, so edits do not need a separate prose update.

The building table runs from top to bottom, with one building per row:

- **Step**: a unique identifier for this placement, such as `village` or `village2`. Other rows refer to this identifier.
- **Building**: an existing blueprint ID, such as `village`, `worksite`, `university`, `the-ark`, or `the-great-tree`.
- **Location**: `world` to choose a tile, an earlier world step's identifier to choose a slice inside that building, or `ark-board` for one of the Ark's twelve internal slices.
- **Terrain**: comma-separated allowed world tile types: `ocean`, `plains`, `snow`, `desert`, `farmland`, `forest`, `mountain`. Use `-` for slice buildings. The normal ocean-conversion fallback still applies when no matching unbuilt tile exists.
- **Adjacent terrain**: allowed terrain facing a world-hosted slice, or `-` for no terrain restriction. Worksites must still face an existing tile without another tile building; Ark-board slices ignore this normal Worksite condition.
- **River**: `yes` requires a river touching the world tile; otherwise `no`.
- **Minimum distance**: minimum tile distance from existing tile buildings, or `0` for no separation requirement.
- **Road to** and **Road length**: an earlier world step and a positive distance. The new building must be exactly that far away and is automatically connected by that many neutral roads over land. Use `-` and `0` when no road connection is needed.
- **Dedication**: `yes` lets the player dedicate a starting village to a resource; otherwise `no`.
- **Placement**: `choose` asks the player to click a highlighted tile/slice; `automatic` takes the first legal option. Starting Universities remain `choose`. Steps with no legal placement are skipped, as in the normal setup rules.

For example, change the Wanderers' village **Terrain** cell from `snow` to `desert` to change their required starting terrain. Change the Ark Worksite's **Placement** from `automatic` to `choose` to let its player choose the internal slice, or its **Location** from `ark-board` to `ark` to place it on a slice of the Ark's world tile instead.

The army table controls **Army count**, **Strength**, and **Location** (a world building's Step). Armies are placed when that building is placed. Set count to `0` for no army, or add rows for armies at other starting buildings.

The existing **Claim the following technologies:** list controls starting technologies. The optional **Extra / Enabled** table supports `other-faction-treaties` (`yes`/`no`), which claims treaties from the other selected factions. Every faction also claims its own effect cards and faction blueprints, as noted in each setup comment.

Validate edits in the server with `node --import tsx --test scripts/kin-setup.test.mjs src/games/kin/kin.setup.test.ts`.

During a Kin game, hosts and admins have a **Host controls** court tab. It contains the host controls and, for admins, the existing test-bot tools. The game fits the viewport without page scrolling; the bottom court expands to its content, with internal scrolling only when content exceeds the available space.

Chapter transitions show the server's pending choices to the designated player and pause normal gameplay. Commonwealth displays party membership and leaders, the ten-step marker and donation target, and its ordered victory conditions with lord-attributed gold. Donation, Cautious Schemer ordering, and Oppose approval use dedicated responder panels; normal actions and passing remain blocked until the decision resolves. Oppose taps the selected Control source immediately, even when permission is later declined. Overthrow compares personal gold rather than lord-attributed victory gold. Commonwealth laws reward matching actions only for Commonwealth members.
Kingdom displays the Rebel and Kingdom law tracks, royal faction strength, direct vassals, and ordered victory conditions. During Council the King chooses the enacted law and its track; Revoke and Iron Grip let the player choose the specific law, with Iron Grip also requiring a destination track and normal Control-source payment.
Replacement Kin drafts retain the normal setup flow and mark collapsed Kin as unavailable.

Exploration makes Archeology Science public permanently and pauses ordinary actions, passing, and relic tapping while nine additional ruins are placed one at a time, starting with the first natural-order Kin and cycling (fewer if legal tiles run out). Existing ruins remain. Only the designated placer can click highlighted legal tiles on the world board. The victory panel shows placement progress, all remaining ruins, and server-authoritative court relic totals including tapped/preexisting relics and ultimate-lord vassal aggregation; vassals cannot win. At the end of Control, no ruins means the most relics wins, regardless of leftover treasure/relic blocks. A tie (including zero) awards the chapter leader even if not tied for most, or their ultimate lord if a vassal; cycles have no eligible winner. Normal Archeology continues and later ruins count. Cleanup clears all court relics and tapped counts, leaving world blocks and public Science. The authoritative rules are in `rulebook/11-5-exploration.md`.

The top header shows the round in slightly larger text at font weight 100, followed immediately by a full-Kin-color current-player pill labelled `Name (Kin)`. The larger phase dots on the right replace the redundant phase-name pill. Center next-click guidance on the whole bar for everyone, not only the active player; describe what to click rather than enumerating action cards. Local action selections share only a generic step (card, army, tile, building, technology, treaty, or form), never form contents or secret card choices; gameplay clears the shared step.

Court tabs are disabled when the selected player's corresponding section is empty. Characters includes activation cards, and Tactics & subterfuge includes hidden subterfuge cards when viewing another player. If the selected tab becomes empty, the court displays an available tab instead.

Court resources and player summaries show faction resources only for their Kin: Virtue for the Pride of Lumon, Influence for the Dynasty of Hanshu, and Tradegoods for the Seven Streams Syndicate.

Barter uses paper panels with separate give/receive sections, colored resource icons and accessible quantity inputs. Tradegoods conversion uses icon choices, and incoming offers summarize exchanged goods as chips.

Kin number fields share paper-and-red up/down controls instead of browser-native spinners. They retain direct typing and keyboard arrows, and disable the controls at their minimum/maximum bounds.

Only the Syndicate's side can contribute Tradegoods. The offer composer chooses which basic resource those become, including when requesting Tradegoods from the Syndicate. Switching trade partners clears the requested goods.

Held treaties cannot be offered or requested in Barter. Create a new treaty through the directional treaty selectors, subject to the existing diplomacy requirements.

Add barter characters through the dropdown on either side. Multiple characters can be selected; each appears as a full character card with a Remove button and is excluded from the dropdown until removed.
Incoming Barter offers open in a modal with character and treaty cards grouped under their giver, including treaty terms. Closing the preview does not accept or decline; use View Barter offer to reopen it. Only the recipient can accept or decline.

The composer remains open until the server confirms the pending offer. A rejected
offer retains its draft and displays the server error; closing the composer
explicitly cancels the draft.

Lumon and the Ethereal cannot be offered or requested in Barter.

The barter partner dropdown lists each player's Kin in parentheses and whether they hold a Trade Treaty given by you.

New treaties have separate **I give treaty to you** and **I receive treaty from you** selectors, each using the giver's diplomacy knowledge and the pair's treaty eligibility. Changing partners clears selected new treaties. Each resource shows the corresponding side's available quantity in parentheses; relics instead show tapped/total.

Relics show (tapped/total) in the court Resources tab and both barter sides. Only untapped relics can be bartered. During your turn in any phase, click your relic icon to choose an amount and one basic resource; confirming taps that many relics and grants that many resources without ending your turn. Relics untap at Seasons Change.

Temporary action forms (including Barter, building payment, Reclaim, attack dice, Reinforce, and event configuration) open as large modal popups covering most of the viewport, outside the board's pan/zoom layer. Click the backdrop, press Escape, or close the popup to cancel the unsubmitted action. Optional action settings offer Continue to return to board selection. Existing court/board card choices and mandatory responses retain their existing locations.

Kin test bots default to **Force pass**. Host controls show the current mode separately from explicit **Enable force pass** / **Disable force pass** buttons. Disable force pass for **Normal play** to leave gameplay turns for manual control. Both modes automate setup when global Autopilot is on; with Autopilot off neither mode acts automatically. **Control bot whose turn it is** supports Kin setup and gameplay. Bots can only join before a game starts.

The Force pass button while controlling a bot uses that same persistent mode: enabling it passes the bot's current turn when it is on turn, even with Autopilot off. The mode stays enabled across phases until turned off from the bot's view or host controls. Further automatic turns still require Autopilot.

Choosing an action's activation source opens your Characters court panel, including when it was collapsed. Eligible characters and activation cards glow and enlarge slightly. Character-targeting ability forms also show clickable character cards.

Board buttons glow while a choice is needed on that board, even when it is already selected. Court choices highlight the court dropdown and mark the required option with "Choose here"; native dropdown menus use a gold option highlight because their rendering does not support a reliable glow.

Boards without a saved view start at 75% zoom, at the top edge and horizontally centered between the docks. Reset returns to this view. Each board remembers its pan position and zoom while switching boards. Opening a glowing board or advancing its selection step centers one eligible glowing card, army, or tile in the visible area between the docks, preserving that board's saved zoom. Panning and zooming remain manual afterward; clicking a glowing board button again recenters a target.

Phase tracks use readable phase-colored backgrounds with three cards per row, except the wider Event track which fits four. Player tracks align under Discovery, Expansion, and Control, leaving the Event column empty. An active law appears separately to the left of Events; no law panel is shown when none is active.

Board backdrops use teal (#004b50) for World, Kin paper for Building, Kin ink for Technology, and a muted current-phase tint (15% phase color over Kin paper) for Phase.

Board navigation order is World, Phase, Building, Technology. Give each tab a distinct color, a solid thick Kin-red selected border reaching its edges, and retain the attention glow for activatable choices even when selected.

Player turn entries use their Kin color without resource/card preview pills. The active player has a thick red border; the inspected player's entry glows. Keep the player dock above the court in stacking order. The inspected court is labelled `Name (Kin)` and uses a muted Kin background. Resources have their own court tab with a borderless Kin-paper panel.

Tapped cards rotate upright and return to normal size on hover. Board text is not selectable while panning, but input and textarea text remains selectable.

Victory standings appear only on World, in an always-open paper panel to the left of the board. Gold cells identify sole leaders; the footer shows areas led against the victory requirement.

The Ark's two building tiles sit below the World board, with a muted Archive-grey background, Kin-colored border and no visible title. Each tile supports six slice buildings, one per edge, regardless of build conditions. Smith discounts apply only within the same Ark tile.

The Event track also previews events granted by unresearched technologies as disabled cards, with the required technology in their tooltip. Research replaces the preview with the actual event card.

The shared technology board keeps Public and Research as continuous panels with Construction, Science, Combat (including Greater Army Strength), Active, Movement, Diplomacy, and Steampower rows inside. Each category fits six technologies per row. Player technology boards sit below the shared tracks, two side by side, with six technologies per row and no categories.

Building links throughout the game and rulebook show their blueprint icons (or their shape symbol when no separate icon exists), with a pale backing and shadow for contrast. These icons come from the building headings in the rulebook, including faction buildings.

Rulebook chapter tabs use the chapter markdown's case-insensitive `Color:` metadata, with contrasting text and the existing selected-tab outline.

Kin draft cards and individual Kin rulebook pages share the supplied artwork from `../../../../voedgoem-server/content/kin/kin-image/`. Copy the current top-level WebP files (not the archived `old/` variants) into the frontend repository's `public/images/kin/`; the shared mapping in `KinCard.tsx` handles differences between Kin IDs and artwork filenames. Keep the full image visible without cropping.

The building, technology, and phase boards include a section for every player's privately known blueprints, technologies, and actions respectively. These cards are no longer displayed in the court menu; passive faction effects remain there. All claimed events stay on the shared Event track. This is a display organization only: ownership, knowledge, and activation permissions are unchanged.

The shared building board has Public and Locked tracks. Each track keeps all its buildings on one unwrapped line without an internal scrollbar; use board pan/zoom to navigate. Locked blueprints display their required technology and cannot be selected for building. Researching that technology removes them from Locked and places them on the researching player's building board; publicizing moves them to Public.

Player building boards use two columns with thin light-brown dividers instead of outer borders.

Worksites adjacent to plains use the Rice Field icon 🌾 rather than the default worksite icon.
