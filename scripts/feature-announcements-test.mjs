import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const matchThemesCss = fs.readFileSync(path.join(root, "match-themes.css"), "utf8");

assert.match(html, /id="matchThemesAnnouncementModal"[\s\S]*Match themes are here[\s\S]*Choose a match theme/);
assert.match(html, /id="retro1998AnnouncementModal"[\s\S]*World Cup 1998 is here[\s\S]*Play 1998 World Cup/);
assert.match(html, /id="retroEuro2020AnnouncementModal"[\s\S]*UEFA Euro 2020 is live[\s\S]*Play Euro 2020/);
assert.match(html, /id="retroCopaAnnouncementModal"[\s\S]*Copa Am(?:é|&eacute;)rica 2024 is here[\s\S]*Play Copa Am(?:é|&eacute;)rica 2024/);
assert.doesNotMatch(html, /The UCL simulator is here/);
assert.doesNotMatch(html, /data-open-tournament-theme/);
assert.match(html, /class="tournament-theme-setting"/, "The restored match-theme setting should remain independent of feature announcements.");
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
assert.match(app, /MATCH_THEMES_ANNOUNCEMENT_KEY = "world-256-announcement-match-themes-v1"/);
assert.match(app, /RETRO_EURO_2020_ANNOUNCEMENT_KEY = "world-256-announcement-euro-2020-launch-v1"/);
assert.match(
  app,
  /!announcementWasSeen\(RETRO_EURO_2020_ANNOUNCEMENT_KEY\)[\s\S]*retroEuro2020AnnouncementModal\.showModal\(\)[\s\S]*!announcementWasSeen\(MATCH_THEMES_ANNOUNCEMENT_KEY\)/,
  "The Euro 2020 launch announcement must be the first unseen announcement shown.",
);
assert.match(
  app,
  /retroEuro2020AnnouncementAction\?\.addEventListener\("click"[\s\S]*setRetroEuroYear\("2020"\)[\s\S]*startRetroWorldCupButton\?\.click\(\)/,
  "The Euro 2020 announcement action must launch the playable mode.",
);
assert.match(
  app,
  /!announcementWasSeen\(MATCH_THEMES_ANNOUNCEMENT_KEY\)[\s\S]*matchThemesAnnouncementModal\.showModal\(\)/,
  "The match-theme announcement must appear once for its launch version.",
);
assert.match(
  app,
  /matchThemesAnnouncementAction\?\.addEventListener\("click"[\s\S]*settingsButton\?\.click\(\)/,
  "The match-theme announcement action must open Settings.",
);
assert.match(matchThemesCss, /\.feature-announcement-match-themes[\s\S]*\.match-themes-announcement-visual/);
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
assert.match(app, /newsButton\?\.addEventListener\("click", \(\) => els\.retroEuro2020AnnouncementModal\?\.showModal\(\)\)/, "The shared News button must open the Euro 2020 release announcement.");
assert.match(app, /retroNewsButton\?\.addEventListener\("click", \(\) => els\.newsButton\.click\(\)\)/, "Retro pages must route News through the latest release announcement.");
assert.match(app, /document\.querySelectorAll\("dialog\[open\]"\)/);
assert.match(css, /\.feature-announcement-modal\[open\][\s\S]*feature-announcement-in/);
assert.match(css, /\.feature-announcement-1998 \.feature-announcement-accent/);
assert.match(css, /\.feature-announcement-1998-visual/);
assert.match(css, /\.feature-announcement-copa-2024/);
assert.match(css, /\.feature-announcement-euro-2020/);
assert.doesNotMatch(css, /\.feature-announcement-wc-2026|\.feature-announcement-wc-2026-logo/);
assert.doesNotMatch(css, /\.feature-announcement-2006|\.feature-announcement-premier-league/);
assert.doesNotMatch(css, /\.feature-announcement-achievements|\.feature-announcement-pitch|\.feature-announcement-trophy/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Feature announcement checks passed.");
