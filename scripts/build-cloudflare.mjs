import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const staticFiles = [
  "app.js",
  "clean.css",
  "data.js",
  "disclaimer.html",
  "legal.css",
  "player-pools.generated.js",
  "privacy.html",
  "simulation-engine.js",
  "styles.css",
  "terms.html",
  "assets/audio/full-time-whistle.mp3",
  "assets/audio/penalty-whistle.mp3",
];

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

for (const relativePath of staticFiles) {
  const destination = join(outputRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(projectRoot, relativePath), destination);
}

const sourceHtml = readFileSync(join(projectRoot, "index.html"), "utf8");
const cloudflareHtml = sourceHtml.replace(
  /\s*<script>\s*window\.va = window\.va \|\| function \(\) \{[\s\S]*?<\/script>\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>/,
  "",
);
writeFileSync(join(outputRoot, "index.html"), cloudflareHtml, "utf8");

console.log(`Cloudflare static build ready: ${staticFiles.length + 1} files.`);
