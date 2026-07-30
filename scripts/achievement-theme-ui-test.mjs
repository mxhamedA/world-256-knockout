import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const challenge = fs.readFileSync(path.join(root, "challenge.js"), "utf8");

for (const year of [256, 2006, 2010, 2014, 2016, 2018, 2022, 2026]) {
  assert.match(html, new RegExp(`data-achievement-year="${year}"`, "g"), `${year} needs a tab in both achievement views.`);
}

assert.match(css, /#achievementsScreen\[data-achievement-theme\]/,
  "The shared base achievement theme is missing.");
for (const year of [256, 2006, 2010, 2016, 2018, 2022, 2026]) {
  assert.match(css, new RegExp(`data-achievement-theme="${year}"`), `${year} needs an achievement theme override.`);
}

assert.match(css, /grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  "All eight achievement tabs must stay in one responsive row.");
assert.match(challenge, /\[256,\s*2006,\s*2010,\s*2014,\s*2016,\s*2018,\s*2022,\s*2026\]/,
  "Every competition must participate in achievement loading.");
assert.match(css, /@media \(max-width: 520px\)[\s\S]*achievement-year-tabs button[\s\S]*font-size:\s*10px/,
  "The single-row tabs need a compact mobile treatment.");
assert.match(css, /#retroAchievementsModal\[data-achievement-theme\] \.achievement-login-button/,
  "The World Cup popup login action must inherit the selected achievement theme.");
assert.match(challenge, /function syncAchievementTheme\(year = activeAchievementYear\)/,
  "Achievement theme changes need one shared controller.");
assert.match(challenge, /\[elements\.achievementsScreen, elements\.retroAchievementModal\][\s\S]*dataset\.achievementTheme = theme/,
  "Home and popup achievement views must receive the same selected theme.");
assert.match(challenge, /if \(team\.badge\)[\s\S]*achievement-club-badge[\s\S]*team\.badge/,
  "Premier League achievements must render club badges instead of national flags.");
assert.match(
  challenge,
  /function openRetroAchievementsModal\(year = 2014\)[\s\S]*Number\(year\) === 2026[\s\S]*achievementState\?\.\(\)[\s\S]*trackPremierLeagueSeason\(savedSeason\)[\s\S]*loadAchievements\(year\)/,
  "Opening PL achievements must recover and sync a completed local season before loading progress.",
);
assert.match(css, /\.achievement-country-flag\.achievement-club-badge[\s\S]*object-fit:\s*contain/,
  "Premier League achievement badges must fit inside their cards without being cropped.");
assert.match(challenge, /syncAchievementTheme\(\);[\s\S]*achievementPayloads\.get\(activeAchievementYear\)/,
  "The selected theme must update whenever achievement content renders.");
assert.match(html, /id="achievementsModeLabel"/);
assert.match(html, /id="retroAchievementModeLabel"/);

console.log("Achievement theme UI checks passed.");
