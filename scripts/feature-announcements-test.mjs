import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

assert.match(html, /id="euro2016AnnouncementModal"[\s\S]*Euro 2016 mode is here/);
assert.doesNotMatch(html, /id="startingXiAnnouncementModal"/);
assert.doesNotMatch(html, /id="knockoutAchievementsAnnouncementModal"/);
assert.match(app, /EURO_2016_ANNOUNCEMENT_KEY/);
assert.doesNotMatch(app, /STARTING_XI_ANNOUNCEMENT_KEY|KNOCKOUT_256_ANNOUNCEMENT_KEY/);
assert.match(
  app,
  /euro2016AnnouncementModal\.showModal\(\)/,
  "The Euro 2016 announcement must appear for first-time visitors.",
);
assert.match(
  app,
  /euro2016AnnouncementAction\?\.addEventListener\("click"[\s\S]*setRetroCompetition\("euros"\)/,
  "The Euro announcement action must select the Euro 2016 mode.",
);
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-euro \.feature-announcement-accent/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
