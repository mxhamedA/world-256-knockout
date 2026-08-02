import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

assert.match(html, /id="uclFeaturesAnnouncementModal"[\s\S]*The UCL simulator is here[\s\S]*Play UCL mode/);
assert.doesNotMatch(html, /customFeaturesAnnouncementModal|Custom matches &amp; teams out now/);
assert.doesNotMatch(html, /id="newsModal"|2014 and 2018 WC modes|Achievements added for World Cup|Retro commentary timing/);
assert.doesNotMatch(html, /id="wc2026AnnouncementModal"|WC 2026 mode now out/);
assert.doesNotMatch(html, /id="premierLeagueAnnouncementModal"|Premier League mode is out/);
assert.doesNotMatch(html, /id="retro2006AnnouncementModal"|2006 World Cup mode is out/);
assert.doesNotMatch(html, /id="euro2016AnnouncementModal"|Euro 2016 mode is here/);
assert.doesNotMatch(html, /id="palestineChallengeAnnouncementModal"|Palestine Challenge is here/);
assert.doesNotMatch(html, /id="startingXiAnnouncementModal"/);
assert.doesNotMatch(html, /id="knockoutAchievementsAnnouncementModal"/);
assert.match(app, /UCL_FEATURES_ANNOUNCEMENT_KEY = "world-256-announcement-ucl-mode-v1"/);
assert.doesNotMatch(app, /CUSTOM_FEATURES_ANNOUNCEMENT_KEY|customFeaturesAnnouncement/);
assert.doesNotMatch(app, /WC_2026_ANNOUNCEMENT_KEY|wc2026Announcement/);
assert.doesNotMatch(app, /RETRO_2006_ANNOUNCEMENT_KEY|PREMIER_LEAGUE_ANNOUNCEMENT_KEY/);
assert.doesNotMatch(app, /EURO_2016_ANNOUNCEMENT_KEY|PALESTINE_CHALLENGE_ANNOUNCEMENT_KEY|STARTING_XI_ANNOUNCEMENT_KEY|KNOCKOUT_256_ANNOUNCEMENT_KEY/);
assert.match(
  app,
  /!announcementWasSeen\(UCL_FEATURES_ANNOUNCEMENT_KEY\)[\s\S]*uclFeaturesAnnouncementModal\.showModal\(\)/,
  "The UCL announcement must appear only when its launch version has not been seen.",
);
assert.match(
  app,
  /uclFeaturesAnnouncementAction\?\.addEventListener\("click"[\s\S]*setAppModeUrl\("home"\)[\s\S]*startUclSimulatorButton[\s\S]*click\(\)/,
  "The announcement action must launch UCL mode.",
);
assert.match(app, /newsButton\?\.addEventListener\("click", \(\) => els\.uclFeaturesAnnouncementModal\?\.showModal\(\)\)/, "The shared News button must open the UCL release announcement.");
assert.match(app, /retroNewsButton\?\.addEventListener\("click", \(\) => els\.newsButton\.click\(\)\)/, "Retro pages must route News through the shared UCL announcement.");
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-ucl \.feature-announcement-accent/);
assert.match(css, /\.feature-announcement-ucl-visual/);
assert.doesNotMatch(css, /\.feature-announcement-wc-2026|\.feature-announcement-wc-2026-logo/);
assert.doesNotMatch(css, /\.feature-announcement-2006|\.feature-announcement-premier-league/);
assert.doesNotMatch(css, /\.feature-announcement-euro|\.feature-announcement-achievements|\.feature-announcement-pitch|\.feature-announcement-trophy/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
