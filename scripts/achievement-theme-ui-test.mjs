import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const challenge = fs.readFileSync(path.join(root, "challenge.js"), "utf8");

for (const year of [256, 2010, 2014, 2016, 2018, 2022]) {
  assert.match(html, new RegExp(`data-achievement-year="${year}"`, "g"), `${year} needs a tab in both achievement views.`);
}

assert.match(css, /#achievementsScreen\[data-achievement-theme\]/,
  "The shared base achievement theme is missing.");
for (const year of [256, 2010, 2016, 2018, 2022]) {
  assert.match(css, new RegExp(`data-achievement-theme="${year}"`), `${year} needs an achievement theme override.`);
}

assert.match(css, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/,
  "All six achievement tabs must stay in one responsive row.");
assert.match(challenge, /\[256,\s*2010,\s*2014,\s*2016,\s*2018,\s*2022\]/,
  "Euro 2016 must participate in achievement loading.");
assert.match(css, /@media \(max-width: 520px\)[\s\S]*achievement-year-tabs button[\s\S]*font-size:\s*10px/,
  "The single-row tabs need a compact mobile treatment.");
assert.match(css, /#retroAchievementsModal\[data-achievement-theme\] \.achievement-login-button/,
  "The World Cup popup login action must inherit the selected achievement theme.");
assert.match(challenge, /function syncAchievementTheme\(year = activeAchievementYear\)/,
  "Achievement theme changes need one shared controller.");
assert.match(challenge, /\[elements\.achievementsScreen, elements\.retroAchievementModal\][\s\S]*dataset\.achievementTheme = theme/,
  "Home and popup achievement views must receive the same selected theme.");
assert.match(challenge, /syncAchievementTheme\(\);[\s\S]*achievementPayloads\.get\(activeAchievementYear\)/,
  "The selected theme must update whenever achievement content renders.");
assert.match(html, /id="achievementsModeLabel"/);
assert.match(html, /id="retroAchievementModeLabel"/);

console.log("Achievement theme UI checks passed.");
