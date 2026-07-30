import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "./generate-draft-catalog.mjs";
import "./generate-legacy-catalog.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const staticFiles = [
  "_headers",
  "ads.txt",
  "analytics.js",
  "favicon.png",
  "app.js",
  "retro-data.js",
  "retro-2006-squads.js",
  "retro-2006-schedule.js",
  "retro-2010-squads.js",
  "retro-2010-schedule.js",
  "retro-2014-squads.js",
  "retro-2014-schedule.js",
  "retro-euro-2016-squads.js",
  "retro-euro-2016-schedule.js",
  "retro-2018-squads.js",
  "retro-2018-schedule.js",
  "retro-2022-squads.js",
  "retro-2022-schedule.js",
  "retro-engine.js",
  "challenge.js",
  "clean.css",
  "content.css",
  "data.js",
  "about.html",
  "disclaimer.html",
  "faq.html",
  "guides.html",
  "how-it-works.html",
  "legal.css",
  "methodology.html",
  "player-pools.generated.js",
  "privacy.html",
  "presentation-engine.js",
  "premier-league.css",
  "premier-league-data.js",
  "premier-league-squads.generated.js",
  "premier-league.js",
  "redirect.js",
  "robots.txt",
  "sitemap.xml",
  "simulation-engine.js",
  "styles.css",
  "terms.html",
  "team-field.html",
  "assets/audio/full-time-whistle.mp3",
    "assets/audio/penalty-whistle.mp3",
    "assets/audio/achievement-unlock.mp3",
    "assets/256-teams-icon.svg",
    "assets/retro-world-cup-2006.png",
    "assets/retro-2006/germany-2006-bg.png",
    "assets/retro-world-cup-2014.png",
    "assets/retro-world-cup-2018.png",
    "assets/retro-world-cup-2022.png",
    "assets/euro-2016-logo.png",
    "assets/copa-america-2024-logo.png",
    "assets/prem-logo.webp",
    "assets/world-cup-2026-logo.png",
    "assets/retro-2010/south-africa-sunburst-desktop.webp",
    "assets/retro-2010/south-africa-sunburst-portrait.webp",
    "assets/retro-2010/south-africa-football-emblem.webp",
    "assets/retro-2010/worldcup-2010-logo.png",
    "assets/retro-2014/brazil-watercolor-bg.webp",
    "assets/retro-2014/brazil-watercolor-stadium.webp",
    "assets/retro-2014/brazil-watercolor-mobile.webp",
    "assets/retro-2014/brazil-watercolor-ipad.webp",
    "assets/retro-2014/brazil-watercolor-iphone.webp",
    "assets/retro-2022/qatar-night-landscape.png",
    "assets/retro-2022/qatar-night-portrait.png",
    "site.webmanifest",
];

mkdirSync(outputRoot, { recursive: true });

for (const relativePath of staticFiles) {
  const destination = join(outputRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(projectRoot, relativePath), destination);
}

const legacyDataRoot = join(projectRoot, "legacy-data");
if (existsSync(legacyDataRoot)) {
  cpSync(legacyDataRoot, join(outputRoot, "legacy-data"), { recursive: true });
}

const flagAssetsRoot = join(projectRoot, "assets", "flags");
if (existsSync(flagAssetsRoot)) {
  cpSync(flagAssetsRoot, join(outputRoot, "assets", "flags"), { recursive: true });
}

const premierLeagueAssetPackRoot = join(projectRoot, "assets", "pl-26-27");
if (existsSync(premierLeagueAssetPackRoot)) {
  cpSync(premierLeagueAssetPackRoot, join(outputRoot, "assets", "pl-26-27"), { recursive: true });
}

const sourceHtml = readFileSync(join(projectRoot, "index.html"), "utf8");
const cloudflareHtml = sourceHtml.replace(
  /\s*<script>\s*window\.va = window\.va \|\| function \(\) \{[\s\S]*?<\/script>\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>/,
  "",
);
writeFileSync(join(outputRoot, "index.html"), cloudflareHtml, "utf8");

console.log(`Cloudflare static build ready: ${staticFiles.length + 1} files.`);
