import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "data/retro/euro-2016/squads.js",
  "data/retro/2018/squads.js",
  "data/retro/2022/squads.js",
  "data/retro/euro-2020/squads.js",
  "data/retro/euro-2020/schedule.js",
  "retro-engine.js",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_EURO_2020_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data[2020];
const squads = context.__squads;
const engine = context.__engine;
assert.equal(data.teams.length, 24);
assert.equal(Object.keys(squads).length, 24);
assert.equal(data.teams.find((team) => team.name === "Italy")?.rating, 91);
assert.equal(data.teams.find((team) => team.name === "Denmark")?.rating, 88);
assert.equal(data.teams.find((team) => team.name === "France")?.rating, 89);
assert.match(data.ratingMethod, /FIFA 21/);
for (const group of "ABCDEF") assert.equal(data.teams.filter((team) => team.group === group).length, 4);
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} must have 23 players`);
  assert.equal(squad.startingXI.length, 11, `${team} must have a starting XI`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 23, `${team} shirt numbers must be unique`);
  assert.ok(squad.players.every((player) => player.overall >= 60 && player.overall <= 92), `${team} ratings must remain in the calibrated range`);
  assert.ok(squad.players.every((player) => /FIFA 21-era ability/.test(player.ratingJustification)), `${team} ratings must document the Euro 2020 blend`);
});
assert.equal(squads.Italy.players.find((player) => player.name === "Gianluigi Donnarumma")?.overall, 86);
assert.equal(squads.Italy.players.find((player) => player.name === "Federico Chiesa")?.overall, 85);
assert.equal(squads.England.players.find((player) => player.name === "Harry Kane")?.overall, 89);
assert.equal(squads.Portugal.players.find((player) => player.name === "Cristiano Ronaldo")?.overall, 92);
assert.equal(squads.Spain.players.find((player) => player.name === "Pedri")?.overall, 84);
assert.ok(!squads.Italy.players.some((player) => player.name === "Gianluigi Buffon"));
assert.ok(!squads.Germany.players.some((player) => player.name === "Mesut Özil"));

const tournament = engine.createTournament({ year: 2020, seed: 2020, managedTeam: "Italy" });
assert.equal(tournament.groupMatches.length, 36);
assert.equal(engine.validate(tournament), true);
assert.ok(tournament.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
while (tournament.phase === "group") engine.simulateActiveStage(tournament);
assert.equal(tournament.bestThirdPlaced.length, 4);
assert.equal(tournament.knockoutRounds[0].matches.length, 8);
while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds.map((round) => round.matches.length).join(","), "8,4,2,1");
assert.equal(engine.allMatches(tournament).length, 51);
assert.ok(!engine.allMatches(tournament).some((match) => match.id === "ko-third-place"));
assert.ok(tournament.champion);

const appSource = readFileSync(join(root, "app.js"), "utf8");
const cssSource = readFileSync(join(root, "clean.css"), "utf8");
const htmlSource = readFileSync(join(root, "index.html"), "utf8");
const engineSource = readFileSync(join(root, "retro-engine.js"), "utf8");
const managementSource = readFileSync(join(root, "src/web/app/02-tournaments/10-player-profiles-and-rosters.js"), "utf8");
const simulationSource = readFileSync(join(root, "src/web/app/02-tournaments/11-match-simulation.js"), "utf8");
const lifecycleSource = readFileSync(join(root, "src/web/app/04-retro/16-retro-mode-lifecycle.js"), "utf8");
const challengeSource = readFileSync(join(root, "challenge.js"), "utf8");
const challengeServiceSource = readFileSync(join(root, "challenge-service.mjs"), "utf8");
const achievementMigration = readFileSync(join(root, "migrations/0021_retro_2020_achievements.sql"), "utf8");
assert.match(appSource, /function renderEuro2020BracketView\(\)/);
assert.match(appSource, /retro-euro-2020-active/);
assert.match(cssSource, /\.euro-2020-road/);
assert.doesNotMatch(htmlSource, /id="euro2020Intro"/);
assert.equal((htmlSource.match(/data-retro-view=/g) || []).length, 2);
assert.match(htmlSource, /data-retro-view="matches"/);
assert.match(htmlSource, /data-retro-view="squads"/);
assert.doesNotMatch(htmlSource, /Euro 2020, coming soon/);
assert.equal((htmlSource.match(/data-achievement-year="2020"/g) || []).length, 2);

assert.match(engineSource, /\[2016, 2020\]\.includes\(Number\(tournament\?\.year\)\)/, "Euro 2020 must receive the managed-team rating boost");
assert.match(managementSource, /function applyControlledTacticalMatchup\(/, "managed matches must apply tactic matchups");
assert.match(managementSource, /function retroManagedTeamSheetImpact\(/, "managed matches must apply lineup and formation quality");
assert.match(simulationSource, /team\.name === retroTournament\?\.managedTeam \? 1\.35 : 0\.8/, "managed substitutions must receive the stronger execution factor");
assert.match(lifecycleSource, /retroTournament\.managerTactic = state\.standardTactic/, "the selected tactic must persist on the Euro tournament");

assert.match(challengeSource, /\[1998, 2002, 2006, 2010, 2014, 2016, 2018, 2020, 2022, 2024, 2026\]\.includes\(year\)/);
assert.match(challengeSource, /function syncAchievementTabSelection\(year = activeAchievementYear\)/);
assert.match(
  challengeSource,
  /activeAchievementYear = normalizeAchievementKey\(year\);[\s\S]*?syncAchievementTheme\(\);[\s\S]*?syncAchievementTabSelection\(\);[\s\S]*?try \{/,
  "achievement tabs must update before the API request completes",
);
assert.match(challengeServiceSource, /id: "retro-2020-european-tour"/);
assert.match(challengeServiceSource, /table: "retro_2020_attempts"/);
assert.match(challengeServiceSource, /const RETRO_2020_TEAMS/);
assert.match(achievementMigration, /CREATE TABLE IF NOT EXISTS retro_2020_attempts/);
assert.match(cssSource, /data-achievement-theme="2020"/);
assert.match(cssSource, /retro-euro-2020-active :is\(\s*#settingsModal,/);
assert.match(cssSource, /retro-euro-2020-active \.retro-screen-header :is\(/);
assert.match(cssSource, /#bugReportModal \.bug-report-submit/);
assert.match(cssSource, /#retroRestartModal \.danger-button/);
assert.match(cssSource, /achievement-year-tabs button\[aria-selected="false"\]:is\(:hover, :focus-visible\)/);
assert.match(cssSource, /achievement-year-tabs button:is\(\.is-selected, \[aria-selected="true"\]\)/);
assert.match(cssSource, /retro-euro-2020-active #mainContent \.penalty-stage/);
assert.match(cssSource, /retro-euro-2020-active #mainContent \.penalty-scene/);
assert.match(cssSource, /retro-euro-2020-active #mainContent \.penalty-mark\s*\{[\s\S]*?border-radius:\s*50%\s*!important/, "Euro 2020 penalty marks should remain circular");
assert.match(cssSource, /retro-euro-2020-active #mainContent \.standard-penalty-targets button\s*\{[\s\S]*?border-radius:\s*50%\s*!important/, "Euro 2020 penalty target pickers should remain circular");
assert.match(cssSource, /retro-euro-2020-active #mainContent \.champion-stage/);
assert.match(cssSource, /retro-euro-2020-active #mainContent \.champion-stage \.flag-orb/);
assert.match(cssSource, /retro-euro-2020-active #mainContent :is\(\s*\.champion-save-button,/);
assert.match(appSource, /retroYear === 2020[\s\S]*?#b9dc18[\s\S]*?#f48a08/, "Euro 2020 must use its own confetti palette");

console.log("Euro 2020 mode, tournament flow, management boost and achievement checks passed.");
