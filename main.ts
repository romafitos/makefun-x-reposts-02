// makefun-x-reposts-02 entry (Node 22, standard library only, no network).
// The entry is the quote posts themselves, all from @sofianeouafir, each quoting a different
// @makefunai pool post. This program hands them in: it checks POSTS.json in the bot folder and
// writes it to the output folder as POSTS.json, the file the house gate reads.
//
// r1 wrote ./output/manifest.json instead, so the gate found no POSTS.json (valid 0). Fixed here.
//
// In the grader container the folders are /bot and /output. Locally:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const STATUS = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})$/;

function fail(msg: string): never {
  console.error(`POSTS.json: ${msg}`);
  process.exit(1);
}

let doc: { posts?: unknown };
try {
  doc = JSON.parse(readFileSync(join(BOT_DIR, "POSTS.json"), "utf8"));
} catch (err) {
  fail(`could not be read from ${BOT_DIR}: ${(err as Error).message}`);
}
if (!Array.isArray(doc.posts) || doc.posts.length === 0) fail("posts must be a non-empty list");

const posts: string[] = [];
for (const raw of doc.posts) {
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!STATUS.test(url)) fail(`not an X status address: ${String(raw)}`);
  posts.push(url);
}
if (posts.length > 15) fail(`at most 15 posts, got ${posts.length}`);
if (new Set(posts).size !== posts.length) fail("a post is named twice");
const accounts = new Set(posts.map((u) => (u.match(STATUS) as RegExpMatchArray)[1].toLowerCase()));
if (accounts.size !== 1) fail(`posts come from ${accounts.size} accounts, one is allowed`);

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, "POSTS.json"), JSON.stringify({ posts }) + "\n");
console.log(`handed in ${posts.length} posts`);
