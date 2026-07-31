import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

assert.match(html, /id="customFeaturesAnnouncementModal"[\s\S]*Custom matches &amp; teams out now[\s\S]*Create your own teams/);
assert.doesNotMatch(html, /id="wc2026AnnouncementModal"|WC 2026 mode now out/);
assert.doesNotMatch(html, /id="premierLeagueAnnouncementModal"|Premier League mode is out/);
assert.doesNotMatch(html, /id="retro2006AnnouncementModal"|2006 World Cup mode is out/);
assert.doesNotMatch(html, /id="euro2016AnnouncementModal"|Euro 2016 mode is here/);
assert.doesNotMatch(html, /id="palestineChallengeAnnouncementModal"|Palestine Challenge is here/);
assert.doesNotMatch(html, /id="startingXiAnnouncementModal"/);
assert.doesNotMatch(html, /id="knockoutAchievementsAnnouncementModal"/);
assert.match(app, /CUSTOM_FEATURES_ANNOUNCEMENT_KEY = "world-256-announcement-custom-matches-teams-v1"/);
assert.doesNotMatch(app, /WC_2026_ANNOUNCEMENT_KEY|wc2026Announcement/);
assert.doesNotMatch(app, /RETRO_2006_ANNOUNCEMENT_KEY|PREMIER_LEAGUE_ANNOUNCEMENT_KEY/);
assert.doesNotMatch(app, /EURO_2016_ANNOUNCEMENT_KEY|PALESTINE_CHALLENGE_ANNOUNCEMENT_KEY|STARTING_XI_ANNOUNCEMENT_KEY|KNOCKOUT_256_ANNOUNCEMENT_KEY/);
assert.match(
  app,
  /!announcementWasSeen\(CUSTOM_FEATURES_ANNOUNCEMENT_KEY\)[\s\S]*customFeaturesAnnouncementModal\.showModal\(\)/,
  "The custom features announcement must appear only when its launch version has not been seen.",
);
assert.match(
  app,
  /customFeaturesAnnouncementAction\?\.addEventListener\("click"[\s\S]*setAppModeUrl\("home"\)[\s\S]*openCustomTournamentButton[\s\S]*scrollIntoView/,
  "The announcement action must reveal the custom tournament and match card.",
);
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-custom \.feature-announcement-accent/);
assert.match(css, /\.feature-announcement-custom-visual/);
assert.doesNotMatch(css, /\.feature-announcement-wc-2026|\.feature-announcement-wc-2026-logo/);
assert.doesNotMatch(css, /\.feature-announcement-2006|\.feature-announcement-premier-league/);
assert.doesNotMatch(css, /\.feature-announcement-euro|\.feature-announcement-achievements|\.feature-announcement-pitch|\.feature-announcement-trophy/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
