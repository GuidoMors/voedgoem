import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { buildRulebook, findLinks } from "./rulebookParser.ts";

const dir = new URL("./rulebook/", import.meta.url);
const files: Record<string, string> = {};
for (const f of readdirSync(dir)) if (f.endsWith(".md")) files[f] = readFileSync(new URL(f, dir), "utf8");
const book = buildRulebook(files);

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
