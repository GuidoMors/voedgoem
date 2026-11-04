import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { CARDS, cardById } from "./cards.data.ts";
import { CHARACTERS } from "./characters.data.ts";
import { buildRulebook, findLinks } from "./rulebookParser.ts";

const dir = new URL("./rulebook/", import.meta.url);
const files: Record<string, string> = {};
for (const f of readdirSync(dir)) if (f.endsWith(".md") && !f.startsWith("x-")) files[f] = readFileSync(new URL(f, dir), "utf8");
const book = buildRulebook(files);

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
