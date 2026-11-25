// makefun-x-reposts-02 entry program (Node 22, standard library only, no network).
// Reads POSTS.json from the repository and writes a deterministic manifest of the
// entered X posts to the output folder. The posts themselves are the entry.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR || ".";
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "./output";

type Post = { url: string; handle: string; id: string };

function parsePost(raw: unknown): Post | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})$/);
  if (!m) return null;
  return { url: raw.trim(), handle: m[1], id: m[2] };
}

const doc = JSON.parse(readFileSync(join(botDir, "POSTS.json"), "utf8"));
const list: unknown[] = Array.isArray(doc?.posts) ? doc.posts : [];
const seen = new Set<string>();
const posts: Post[] = [];
const problems: string[] = [];
for (const raw of list) {
  const p = parsePost(raw);
  if (!p) { problems.push(`not an X status address: ${String(raw)}`); continue; }
  if (seen.has(p.id)) { problems.push(`duplicate post ${p.id}`); continue; }
  seen.add(p.id);
  posts.push(p);
}
if (posts.length > 15) problems.push(`too many posts: ${posts.length} (max 15)`);
const handles = [...new Set(posts.map((p) => p.handle.toLowerCase()))];
if (handles.length > 1) problems.push(`posts come from ${handles.length} accounts, rules allow one`);

// Sort by status id (numeric order via length then lexical) so output never depends on file order.
posts.sort((a, b) => a.id.length - b.id.length || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

mkdirSync(outDir, { recursive: true });
const manifest = { bounty: "makefun-x-reposts-02", account: handles[0] ?? null, count: posts.length, posts, problems };
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`posts: ${posts.length}, problems: ${problems.length}`);
