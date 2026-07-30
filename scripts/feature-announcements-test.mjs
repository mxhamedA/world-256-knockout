import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

assert.match(html, /id="premierLeagueAnnouncementModal"[\s\S]*Premier League mode is out[\s\S]*still in beta/);
assert.match(html, /id="retro2006AnnouncementModal"[\s\S]*2006 World Cup mode is out/);
assert.doesNotMatch(html, /id="euro2016AnnouncementModal"|Euro 2016 mode is here/);
assert.doesNotMatch(html, /id="palestineChallengeAnnouncementModal"|Palestine Challenge is here/);
assert.doesNotMatch(html, /id="startingXiAnnouncementModal"/);
assert.doesNotMatch(html, /id="knockoutAchievementsAnnouncementModal"/);
assert.match(app, /RETRO_2006_ANNOUNCEMENT_KEY = "world-256-announcement-retro-2006-v1"/);
assert.match(app, /PREMIER_LEAGUE_ANNOUNCEMENT_KEY = "world-256-announcement-premier-league-beta-v1"/);
assert.doesNotMatch(app, /EURO_2016_ANNOUNCEMENT_KEY|PALESTINE_CHALLENGE_ANNOUNCEMENT_KEY|STARTING_XI_ANNOUNCEMENT_KEY|KNOCKOUT_256_ANNOUNCEMENT_KEY/);
assert.match(
  app,
  /premierLeagueAnnouncementModal\.showModal\(\)[\s\S]*retro2006AnnouncementModal\.showModal\(\)/,
  "The Premier League beta announcement must take priority over the older announcement.",
);
assert.match(
  app,
  /premierLeagueAnnouncementAction\?\.addEventListener\("click"[\s\S]*premierLeagueModeCard[\s\S]*scrollIntoView/,
  "The Premier League announcement action must take visitors to the mode card.",
);
assert.match(
  app,
  /retro2006AnnouncementModal\.showModal\(\)/,
  "The Germany 2006 announcement must appear for first-time visitors.",
);
assert.match(
  app,
  /retro2006AnnouncementAction\?\.addEventListener\("click"[\s\S]*setRetroCompetition\("wc"\)[\s\S]*setRetroWorldCupYear\("2006"\)/,
  "The Germany 2006 announcement action must select the 2006 World Cup mode.",
);
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-2006 \.feature-announcement-accent/);
assert.match(css, /\.feature-announcement-premier-league \.feature-announcement-accent/);
assert.match(
  css,
  /\.feature-announcement-premier-league-logo[\s\S]*background: #e7c9f1/,
  "The Premier League logo must sit on a contrasting surface so its real artwork remains visible.",
);
assert.doesNotMatch(
  css,
  /\.feature-announcement-premier-league-logo[\s\S]{0,300}brightness\(0\)/,
  "The Premier League logo must not be flattened into a white silhouette.",
);
assert.doesNotMatch(css, /\.feature-announcement-euro|\.feature-announcement-achievements|\.feature-announcement-pitch|\.feature-announcement-trophy/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
