import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

test("game styles are loaded globally and keep each game's themes together", async () => {
  const gamesDir = new URL("./games/", import.meta.url);
  const games = (await readdir(gamesDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  const main = await readFile(new URL("./main.tsx", import.meta.url), "utf8");
  const shared = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  const sharedImport = main.indexOf('import "./styles.css";');
  assert.notEqual(sharedImport, -1, "shared stylesheet must be imported");

  for (const game of games) {
    const css = await readFile(new URL(`./games/${game}/styles.css`, import.meta.url), "utf8");
    const cssImport = `import "./games/${game}/styles.css";`;
    assert.ok(main.indexOf(cssImport) > sharedImport, `${game} styles must follow shared styles`);
    assert.equal(main.split(cssImport).length - 1, 1, `${game} styles must be imported once`);
    assert.ok(css.includes(`.hub-lobby[data-game="${game}"]`), `${game} hub theme is missing`);
    assert.ok(css.includes(`[data-tab-game="${game}"]`), `${game} statistics tab theme is missing`);
    for (const match of css.matchAll(/\[data-(?:tab-)?game=["']([^"']+)["']\]/g)) {
      assert.equal(match[1], game, `${game} stylesheet contains another game's theme`);
    }
    assert.ok(!shared.includes(`[data-game="${game}"]`), `${game} theme remains in shared CSS`);
    assert.ok(!shared.includes(`[data-tab-game="${game}"]`), `${game} statistics tab remains in shared CSS`);
  }
});
