import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CARDS, cardById } from "./cards.data.ts";
import { CHARACTERS } from "./characters.data.ts";
import { ExplorationBoard } from "./Exploration.tsx";
import { buildRulebook, findLinks, parseDoc } from "./rulebookParser.ts";
import type { KinVictory, KinWorld } from "./types.ts";

const dir = new URL("./rulebook/", import.meta.url);
const files: Record<string, string> = {};
for (const f of readdirSync(dir)) if (f.endsWith(".md") && !f.startsWith("x-")) files[f] = readFileSync(new URL(f, dir), "utf8");
const book = buildRulebook(files);

test("Kin overview table preserves aliased links inside its two columns", () => {
  const table = book.docs.find(doc => doc.file === "12-0-kin.md")?.blocks.find(block => block.t === "table");
  assert.ok(table?.t === "table");
  assert.equal(table.rows.length, 11);
  assert.ok(table.rows.every(row => row.length === 2));
  assert.ok(table.rows.find(row => row[0] === "[[Wanderers]]")?.[1].includes("[[army|armies]]"));
  assert.ok(table.rows.find(row => row[0] === "[[Archive Ark]]")?.[1].includes("[[technology|technologies]]"));
});

test("table parsing distinguishes column separators from multiple aliased links", () => {
  const doc = parseDoc("table.md", "| First | Second | Third |\n|---|---|---|\n| [[army|armies]] | [[gear]] and [[technology|technologies]] | |");
  assert.deepEqual(doc.blocks, [{ t: "table", rows: [
    ["First", "Second", "Third"],
    ["[[army|armies]]", "[[gear]] and [[technology|technologies]]", ""]
  ] }]);
});

test("Yamanano's Grand Works retains its description", () => {
  const ability = CHARACTERS.find(character => character.id === "yamanano")?.abilities.find(entry => entry.name === "Grand Works");
  assert.equal(ability?.text, "You may pay an [[authority]] to increase your votes during [[Council]] by 3.");
});

test("character information notes do not repeat ability names", () => {
  const character = CHARACTERS.find(character => character.id === "yamanano");
  assert.ok(character?.notes?.includes("Condition: Have 1 or more influence."));
  for (const character of CHARACTERS) {
    for (const note of character.notes ?? []) {
      assert.ok(!character.abilities.some(ability => note.startsWith(`${ability.name} · `)), note);
    }
  }
});

test("every [[link]] in the rulebook resolves", () => {
  const missing = new Set<string>();
  for (const text of Object.values(files)) for (const l of findLinks(text)) if (!book.resolve(l.target)) missing.add(l.target);
  assert.deepEqual([...missing].sort(), []);
});

test("glossary entries carry icons and the rulebook has no build brief", () => {
  assert.ok(book.glossary.size > 40);
  assert.equal(files["build-brief.md"], undefined);
  assert.ok(book.docs.length >= 30);
});

test("building links use blueprint icons throughout the rulebook", () => {
  for (const blueprint of CARDS.filter(card => card.kind === "blueprint")) {
    const target = book.resolve(blueprint.name);
    assert.ok(target, blueprint.name);
    assert.equal(target.building, true, blueprint.name);
    assert.equal(target.icon, blueprint.stats!.icons.join(" ") || blueprint.stats!.shape, blueprint.name);
    assert.equal(target.color, undefined, "building links retain their text and navigation");
    assert.equal(book.resolve(`${blueprint.name}s`)?.icon, target.icon, `${blueprint.name} plural`);
  }
  assert.equal(book.resolve("tile building")?.icon, "⬢");
  assert.equal(book.resolve("gold")?.color, "gold");
});

test("blueprint costs retain resource links for icon rendering", () => {
  for (const [id, cost] of [
    ["village", "2 [[lumber]], 2 [[food]]"],
    ["city", "2 [[stone]], 2 [[gold]]"],
    ["worksite", "2 [[basic resource]]s"],
    ["grand-observatory", "3 of every [[basic resource]]"]
  ]) {
    assert.equal(cardById(id)?.stats?.cost, cost, id);
    for (const { target } of findLinks(cost)) {
      const resource = book.resolve(target);
      assert.ok(resource?.icon, `${target} has an icon`);
      assert.ok(resource?.color, `${target} has a color`);
    }
  }
});

test("Kingdom chapter cards resolve to their generated card definitions", () => {
  const kingdom = files["11-3-kingdom.md"];
  assert.ok(kingdom);
  for (const [id, kind, form] of [
    ["taxation", "event", undefined],
    ["righteous-ruler", "chapter", "passive"],
    ["iron-grip", "action", undefined],
    ["rebel", "action", undefined]
  ] as const) {
    const card = cardById(id);
    assert.equal(card?.kind, kind, id);
    assert.equal(card?.chapter, "kingdom", id);
    if (form) assert.equal(card?.form, form, id);
    assert.ok(kingdom.includes(card!.name), `${id} heading exists in the Kingdom rulebook`);
  }
});

test("Exploration rules retain setup, end-of-Control scoring and complete cleanup", () => {
  const text = files["11-5-exploration.md"];
  for (const rule of [
    "becomes public permanently", "9 additional ruins", "first Kin in natural order",
    "Existing ruins remain", "insufficient legal tiles", "No ordinary actions or passing",
    "Relic and treasure blocks do not prohibit placement",
    "including any placed later", "end of [[Control]]", "ALL ruins",
    "Remaining treasure and relic blocks", "preexisting relics and tapped relics",
    "ultimate lord", "Vassals cannot win", "including a tie at zero",
    "not among those tied", "vassal cycle", "ALL relic resources",
    "tapped relic counts to zero", "Leave all world-board blocks"
  ]) assert.ok(text.includes(rule), rule);
});

const explorationVictory = (relics: Record<string, number>): KinVictory => ({
  chapter: "exploration", history: [], leader: "leader", needed: 0,
  standings: Object.fromEntries(Object.entries(relics).map(([player, relics]) =>
    [player, { population: 0, strength: 0, treaties: 0, mana: 0, technologies: 0, relics }])),
  leaders: { population: null, strength: null, treaties: null, mana: null, technologies: null, relics: null },
  points: {}, result: null
});
const explorationMarkup = (world: Pick<KinWorld, "exploration" | "blocks">, relics = { leader: 1, lord: 8 }) =>
  renderToStaticMarkup(createElement(ExplorationBoard, { world, victory: explorationVictory(relics), names: { leader: "Chapter leader", lord: "Ultimate lord" } }));

test("Exploration displays server-authoritative totals and placement capacity without rescoring", () => {
  const html = explorationMarkup({
    exploration: { placed: 2, target: 4, placing: true, player: "lord", tiles: [5, 6], ruins: 7 },
    blocks: [{ tile: 1, kind: "ruins" }]
  });
  assert.match(html, /Additional ruins placed: <strong>2 \/ 4<\/strong>/);
  assert.match(html, /Waiting for Ultimate lord to place/);
  assert.match(html, /remaining on the world board: <strong>7<\/strong>/);
  assert.match(html, /Ultimate lord<\/th><td class="most">8<\/td>/);
  assert.match(html, /Chapter leader<\/th><td class="">1<\/td>/);
  assert.match(html, /Normal play is paused/);
});

test("Exploration ties include zero and do not require the chapter leader to be tied", () => {
  const html = explorationMarkup({ exploration: null, blocks: [] }, { leader: 0, lord: 0 });
  assert.equal((html.match(/class="tied"/g) ?? []).length, 2);
  assert.match(html, /including zero/);
  assert.match(html, /wins even if not tied for most/);
  assert.match(html, /ultimate lord if they are a vassal/);
  assert.match(html, /vassal cycle has no eligible winner/);
});

test("Exploration's block fallback ignores world relic and treasure blocks", () => {
  const html = explorationMarkup({ blocks: [{ tile: 3, kind: "treasure" }, { tile: 5, kind: "relic" }] });
  assert.match(html, /remaining on the world board: <strong>0<\/strong>/);
  assert.doesNotMatch(html, /Normal play is paused/);
  assert.match(html, /all court relics and tapped relic counts are cleared/);
});
