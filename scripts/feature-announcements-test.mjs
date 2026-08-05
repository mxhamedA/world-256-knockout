import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

assert.match(html, /id="retro1998AnnouncementModal"[\s\S]*World Cup 1998 is here[\s\S]*Play 1998 World Cup/);
assert.match(html, /id="retroCopaAnnouncementModal"[\s\S]*Copa Am(?:é|&eacute;)rica 2024 is coming soon[\s\S]*id="retroCopaAnnouncementAction"[^>]*disabled[\s\S]*Coming soon/);
assert.doesNotMatch(html, /The UCL simulator is here/);
assert.doesNotMatch(html, /data-open-tournament-theme/);
assert.doesNotMatch(html, /class="tournament-theme-setting"/);
assert.doesNotMatch(html, /customFeaturesAnnouncementModal|Custom matches &amp; teams out now/);
assert.doesNotMatch(html, /id="newsModal"|2014 and 2018 WC modes|Achievements added for World Cup|Retro commentary timing/);
assert.doesNotMatch(html, /id="wc2026AnnouncementModal"|WC 2026 mode now out/);
assert.doesNotMatch(html, /id="premierLeagueAnnouncementModal"|Premier League mode is out/);
assert.doesNotMatch(html, /id="retro2006AnnouncementModal"|2006 World Cup mode is out/);
assert.doesNotMatch(html, /id="euro2016AnnouncementModal"|Euro 2016 mode is here/);
assert.doesNotMatch(html, /id="palestineChallengeAnnouncementModal"|Palestine Challenge is here/);
assert.doesNotMatch(html, /id="startingXiAnnouncementModal"/);
assert.doesNotMatch(html, /id="knockoutAchievementsAnnouncementModal"/);
assert.match(app, /RETRO_1998_ANNOUNCEMENT_KEY = "world-256-announcement-retro-1998-v1"/);
assert.doesNotMatch(app, /CUSTOM_FEATURES_ANNOUNCEMENT_KEY|customFeaturesAnnouncement/);
assert.doesNotMatch(app, /WC_2026_ANNOUNCEMENT_KEY|wc2026Announcement/);
assert.doesNotMatch(app, /RETRO_2006_ANNOUNCEMENT_KEY|PREMIER_LEAGUE_ANNOUNCEMENT_KEY/);
assert.doesNotMatch(app, /EURO_2016_ANNOUNCEMENT_KEY|PALESTINE_CHALLENGE_ANNOUNCEMENT_KEY|STARTING_XI_ANNOUNCEMENT_KEY|KNOCKOUT_256_ANNOUNCEMENT_KEY/);
assert.match(
  app,
  /!announcementWasSeen\(RETRO_COPA_2024_ANNOUNCEMENT_KEY\)[\s\S]*retroCopaAnnouncementModal\.showModal\(\)/,
  "The Copa América announcement must appear only when its launch version has not been seen.",
);
assert.match(
  app,
  /retroCopaAnnouncementAction\?\.addEventListener\("click"[\s\S]*setRetroCompetition\("copa"\)[\s\S]*setRetroWorldCupYear\("2024"\)[\s\S]*startRetroWorldCupButton\?\.click\(\)/,
  "The announcement action must launch the Copa América 2024 mode.",
);
assert.match(app, /newsButton\?\.addEventListener\("click", \(\) => els\.retroCopaAnnouncementModal\?\.showModal\(\)\)/, "The shared News button must open the Copa América release announcement.");
assert.match(app, /retroNewsButton\?\.addEventListener\("click", \(\) => els\.newsButton\.click\(\)\)/, "Retro pages must route News through the shared Copa América announcement.");
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-1998 \.feature-announcement-accent/);
assert.match(css, /\.feature-announcement-1998-visual/);
assert.match(css, /\.feature-announcement-copa-2024/);
assert.doesNotMatch(css, /\.feature-announcement-wc-2026|\.feature-announcement-wc-2026-logo/);
assert.doesNotMatch(css, /\.feature-announcement-2006|\.feature-announcement-premier-league/);
assert.doesNotMatch(css, /\.feature-announcement-euro|\.feature-announcement-achievements|\.feature-announcement-pitch|\.feature-announcement-trophy/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
