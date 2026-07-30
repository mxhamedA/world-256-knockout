import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appSource = readFileSync(join(root, "app.js"), "utf8");
const challengeSource = readFileSync(join(root, "challenge.js"), "utf8");
const challengeServiceSource = readFileSync(join(root, "challenge-service.mjs"), "utf8");
const cssSource = readFileSync(join(root, "clean.css"), "utf8");
const htmlSource = readFileSync(join(root, "index.html"), "utf8");
const buildSource = readFileSync(join(root, "scripts", "build-cloudflare.mjs"), "utf8");
const workerSource = readFileSync(join(root, "worker.mjs"), "utf8");
const wranglerSource = readFileSync(join(root, "wrangler.jsonc"), "utf8");
const euroCompletionLock = cssSource.slice(cssSource.lastIndexOf("/* Euro 2016 control and completion-state lock. */"));
const euroIdentityLock = cssSource.slice(cssSource.lastIndexOf("/* Euro 2016 final colour lock: keep cyan accents without overriding menu geometry. */"));

assert.ok(existsSync(join(root, "assets", "euro-2016-logo.png")), "The Euro 2016 logo asset must exist.");
assert.ok(existsSync(join(root, "retro-euro-2016-squads.js")), "The playable Euro 2016 squads must exist.");
assert.ok(existsSync(join(root, "retro-euro-2016-schedule.js")), "The Euro 2016 schedule must exist.");
assert.ok(existsSync(join(root, "retro-euro-2016-squad-dataset.json")), "The research dataset must exist.");
assert.match(appSource, /logo: "\.\/assets\/euro-2016-logo\.png"/);
assert.match(appSource, /2016: "\/retro-euro-2016"/);
assert.match(appSource, /initialAppMode === "retro" && Number\(initialRetroYear\) === 2016 && !retroTournament/);
assert.match(appSource, /readRetroEuroTeam\(\) \|\| "France"/);
assert.match(appSource, /if \(Number\(year\) === 2016\)[\s\S]*?footer: "UEFA EURO 2016"/);
assert.match(appSource, /const playable = isEuros \|\|/);
assert.match(appSource, /retro-euro-2016-active/);
assert.match(appSource, /"3-4-2-1"/);
assert.match(appSource, /rankLabel:\s*"SF"/);
assert.match(appSource, /label:\s*"Semi-finalist"/);
assert.match(appSource, /honours\.podium\.length > 3 \? " has-four-places"/);
assert.match(appSource, /isEuro2016 \? " is-compact-squad"/);
assert.doesNotMatch(appSource, /class="retro-squad-summary"/);
assert.match(appSource, /record\.theme === "2016"\s*\?\s*"16"/);
assert.match(appSource, /retroRestartModal\.dataset\.restartYear = String\(year\)/);
assert.match(appSource, /localStorage\.removeItem\(retroTournamentStorageKey\(resetYear\)\)/);
assert.match(
  appSource,
  /previous\.retroTournamentYear\) === Number\(retroTournament\.year\)[\s\S]*Number\(previous\.drawSeed\) === Number\(retroTournament\.seed\)/,
  "Euro 2016 must not inherit the selected match or managed team from another retro tournament.",
);
assert.match(
  appSource,
  /retroTournament\.managerTactic = state\.standardTactic/,
  "The managed Euro tactic must persist with the saved tournament.",
);
assert.match(
  appSource,
  /function tournamentHasThirdPlacePlayoff\(\)[\s\S]*Number\(retroTournament\?\.year\) !== 2016/,
  "Euro 2016 must not suppress elimination choices by inventing a third-place match.",
);
assert.match(appSource, /function savedRetroAchievementTournamentStates\(\)/);
assert.match(appSource, /getRetroAchievementTournamentStates = \(\) => \{/);
assert.match(appSource, /window\.AccountAchievements\?\.trackRetroTournament\(retroTournament\)/);
assert.match(appSource, /retroWorldCupScreen\?\.hidden === false[\s\S]*openRetroModal\(Number\(retroTournament\.year\)\)/);
assert.doesNotMatch(appSource, /retroAchievementsButton\.hidden = isEuros/);
assert.match(htmlSource, /retro-euro-2016-squads\.js/);
assert.match(htmlSource, /retro-euro-2016-schedule\.js/);
assert.equal((htmlSource.match(/data-achievement-year="2016"/g) || []).length, 2);
assert.match(challengeSource, /\[2006, 2010, 2014, 2016, 2018, 2022\]\.includes\(year\)/);
assert.match(challengeSource, /function completedRetroChampion\(tournament\)/);
assert.match(challengeSource, /\n\s+champion,\n/);
assert.match(challengeSource, /achievementBanner\.dataset\.achievementTheme = String\(year\)/);
assert.match(challengeSource, /UEFA EURO 2016/);
assert.match(challengeSource, /"Czech Republic":\s*"Czechia"/);
assert.match(challengeSource, /"Turkey":\s*"T\\u00fcrkiye"/);
assert.match(challengeServiceSource, /retro_2016_attempts/);
assert.match(challengeServiceSource, /retro-2016-european-tour/);
assert.ok(existsSync(join(root, "migrations", "0010_retro_2016_achievements.sql")));
assert.match(buildSource, /"assets\/euro-2016-logo\.png"/);
assert.match(buildSource, /"retro-euro-2016-squads\.js"/);
assert.match(buildSource, /"retro-euro-2016-schedule\.js"/);
assert.match(workerSource, /"\/retro-euro-2016"/);
assert.match(wranglerSource, /"\/retro-euro-2016"/);
assert.match(cssSource, /body\.retro-mode-active\.retro-euro-2016-active/);
assert.match(cssSource, /--e16-cyan:\s*#1cc7ee/);
assert.match(cssSource, /\.retro-euro-2016-active \.retro-manager-pitch/);
assert.match(cssSource, /\.retro-euro-2016-active \.retro-squad-summary/);
assert.match(cssSource, /#teamFilterControl #teamSearch/);
assert.match(cssSource, /#matchCommentaryFeed/);
assert.match(cssSource, /#championStage/);
assert.match(cssSource, /#snapshotButton/);
assert.match(cssSource, /#mainContent \.bracket-heads/);
assert.match(cssSource, /\.champion-podium-grid\.has-four-places/);
assert.match(cssSource, /\.retro-squad-view\.is-compact-squad/);
assert.match(cssSource, /\.tournament-history-screen\[data-history-theme="2016"\]/);
assert.match(cssSource, /#retroAchievementsModal\[data-achievement-theme="2016"\]/);
assert.match(cssSource, /\.achievement-unlock-banner\[data-achievement-theme="2016"\]/);
assert.match(cssSource, /\.achievement-unlock-modal\[data-achievement-theme="2016"\]/);
assert.match(cssSource, /\.profile-tournament-history-card\[data-history-theme="2016"\]/);
assert.ok(euroCompletionLock.length > 1000, "The final Euro control lock must remain at the end of the cascade.");
assert.match(euroCompletionLock, /#teamFilterControl #teamSearch[\s\S]*?border:\s*0/);
assert.match(euroCompletionLock, /#matchCommentaryFeed/);
assert.match(euroCompletionLock, /#standardTacticButtons button/);
assert.match(euroCompletionLock, /#championStage/);
assert.match(euroCompletionLock, /#snapshotButton/);
assert.match(euroCompletionLock, /#mainContent \.bracket-heads/);
assert.match(euroCompletionLock, /Euro 2016 penalty shootout final theme lock/);
assert.match(euroCompletionLock, /:is\(\s*\.penalty-stage,\s*\.match-penalty-overlay\s*\)[\s\S]*?linear-gradient\(145deg,\s*#0756aa,\s*#021d58\)/);
assert.match(euroCompletionLock, /:is\(\s*\.match-penalty-scene,\s*\.standard-penalty-scene\s*\)[\s\S]*?linear-gradient\(135deg,\s*#0867b5,\s*#032d75\)/);
assert.match(euroCompletionLock, /\.penalty-mark\.goal[\s\S]*?background:\s*#ffdc38/);
assert.match(euroCompletionLock, /#skipShootoutButton[\s\S]*?background:\s*#ffdc38/);
assert.match(euroCompletionLock, /#skipShootoutButton[\s\S]*?min-width:\s*118px/);
assert.match(euroCompletionLock, /#shootoutSkipControl[\s\S]*?background:\s*transparent/);
assert.ok(euroIdentityLock.length > 1000, "The Euro 2016 cyan identity lock must remain last in the cascade.");
assert.match(euroIdentityLock, /--e16-yellow:\s*#1cc7ee/);
assert.match(euroIdentityLock, /\.mode-card-retro\[data-retro-competition="euros"\] \.retro-start-button[\s\S]*?background:\s*#92ebff/);
assert.match(euroIdentityLock, /#retroDonateButton[\s\S]*?background:\s*#92ebff !important/);
assert.match(euroIdentityLock, /\.retro-match-lineups-panel > summary[\s\S]*?color:\s*#92ebff !important/);
assert.doesNotMatch(
  euroIdentityLock,
  /\.mode-card-retro\[data-retro-competition="euros"\] :is\([\s\S]*?border-radius:\s*2px/,
  "Euro menu controls should retain the established rounded geometry.",
);
assert.match(euroIdentityLock, /#standardTacticButtons button\.active[\s\S]*?background:\s*#92ebff/);
assert.match(euroIdentityLock, /#skipShootoutButton[\s\S]*?background:\s*#92ebff/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2006"\]/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2010"\]/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2014"\]/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2018"\]/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2022"\]/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="wc"\]\[data-retro-edition="2026"\]/);

console.log("Euro 2016 menu, route, data wiring and theme checks passed.");
