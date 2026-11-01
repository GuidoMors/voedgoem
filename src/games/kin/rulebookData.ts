import { buildRulebook } from "./rulebookParser";

const raw = import.meta.glob("./rulebook/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const files: Record<string, string> = {};
for (const [path, text] of Object.entries(raw)) files[path.split("/").pop()!] = text;

export const book = buildRulebook(files);
