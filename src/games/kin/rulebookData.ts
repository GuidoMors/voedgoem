import { buildRulebook } from "./rulebookParser";

const raw = import.meta.glob("./rulebook/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const files: Record<string, string> = {};
// Files starting with "x-" are developer notes and are not part of the rulebook.
for (const [path, text] of Object.entries(raw)) {
  const name = path.split("/").pop()!;
  if (!name.startsWith("x-")) files[name] = text;
}

export const book = buildRulebook(files);
