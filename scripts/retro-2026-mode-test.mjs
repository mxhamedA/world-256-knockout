import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const challengeSource = fs.readFileSync(path.join(root, "challenge.js"), "utf8");
const challengeServiceSource = fs.readFileSync(path.join(root, "challenge-service.mjs"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const cleanCss = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "retro-2026-squads.js",
  "retro-2026-schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_2026_SQUADS;
globalThis.__groupSchedule = RETRO_2026_GROUP_SCHEDULE;
globalThis.__knockoutSchedule = RETRO_2026_KNOCKOUT_SCHEDULE;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data[2026];
const squads = context.__squads;
const groupSchedule = context.__groupSchedule;
const knockoutSchedule = context.__knockoutSchedule;
const engine = context.__engine;

assert.match(indexSource, /data-retro-year="2026"/, "2026 must be selectable on the mode card");
assert.match(indexSource, /retro-2026-schedule\.js/, "the 2026 schedule must load before the tournament engine");
assert.match(
  appSource,
  /match\.schedule\.dateLabel,\s*\[match\.schedule\.stadium, match\.schedule\.city\]/,
  "fixture cards must show only the date and venue metadata",
);
assert.doesNotMatch(indexSource, /data-retro-view="groups"/, "retro navigation should not add a Standings tab");
assert.doesNotMatch(indexSource, /data-retro-view="lineups"/, "retro navigation should not add a Lineups tab");
assert.match(
  appSource,
  /\["2006", "2010", "2014", "2018", "2022", "2026"\]\.includes\(String\(selectedYear\)\)/,
  "the mode card must treat 2026 as playable",
);
assert.match(cleanCss, /retro-2026-active #mainContent :is\(\s*\.match-stage,\s*\.round-board,\s*\.match-analysis,/);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-match-lineups-panel \{/);
assert.match(cleanCss, /retro-2026-active \.retro-tournament-heading > \* \{\s*visibility: hidden;/);
assert.match(cleanCss, /retro-2026-active \.retro-tournament-heading::after \{\s*content: none;/);
assert.match(cleanCss, /retro-2026-active \.retro-view-tabs::before,[\s\S]*?content: none !important;/);
assert.match(cleanCss, /retro-2026-active #mainContent \.team-filter-control \.search-result-popover/);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-manager-player small \{\s*display: none;/);
assert.match(
  cleanCss,
  /retro-2026-active #mainContent \.bracket-fixture \.fixture-team\.winner[\s\S]*?background:\s*transparent !important/,
  "The 2026 knockout bracket must not fill winning team rows with a highlight colour.",
);
assert.match(
  cleanCss,
  /retro-2026-active #mainContent \.bracket-fixture \.fixture-team\.winner \.fixture-winner-marker[\s\S]*?display:\s*none !important/,
  "The 2026 knockout bracket must hide the winner-row arrow.",
);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-pitch-corner-control \[data-retro-manager-formation\][\s\S]*?background: #10286f !important;/);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-pitch-sub-counter[\s\S]*?background: #10286f !important;/);
assert.match(cleanCss, /retro-2026-active #mainContent \.standard-tactic-buttons button \{\s*min-height: 36px !important;/);
assert.match(cleanCss, /retro-2026-active \.retro-tournament-body \.retro-squad-view,/);
assert.match(cleanCss, /retro-2026-active #mainContent \.board-actions :is\(\s*#historyRoundButton,\s*#newerRoundButton/);
assert.match(cleanCss, /retro-2026-active #mainContent :is\(\s*#snapshotButton,\s*\.snapshot-trigger/);
assert.match(cleanCss, /retro-2026-active \.snapshot-modal :is\(\s*\.icon-button,\s*\.close-modal/);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-match-lineups-panel \{/);
assert.match(cleanCss, /retro-2026-active #mainContent :is\(\s*\.retro-live-ratings-side,\s*\.retro-live-rating-list/);
assert.match(cleanCss, /retro-2026-active #mainContent \.retro-live-rating-row \{/);
assert.match(cleanCss, /retro-2026-active #mainContent \.penalty-stage \{[\s\S]*?background:[\s\S]*?#10286f/);
assert.match(cleanCss, /retro-2026-active #mainContent \.penalty-mark\.goal \{[\s\S]*?background: #1ea85b !important;/);
assert.match(cleanCss, /retro-2026-active #mainContent \.penalty-mark\.miss \{[\s\S]*?background: var\(--wc26-red\) !important;/);
assert.match(
  cleanCss,
  /retro-2026-active #mainContent #championStage \.champion-place \{[\s\S]*?background: #0c2468 !important;/,
  "2026 final-standing cards must not inherit the 2014 green podium",
);
assert.match(
  cleanCss,
  /retro-2026-active #mainContent #championStage \.champion-place\.place-1 \{[\s\S]*?background: #12317f !important;/,
  "the 2026 champion card must use the blue/orange winner treatment",
);
assert.match(appSource, /retroYear === 2026[\s\S]*?#ff9e2f[\s\S]*?#3768ff/, "2026 champion confetti must not contain green");
assert.match(
  appSource,
  /function canonicalTournamentPlayerName\(team, name\)[\s\S]*?tournamentPlayerNameKey\(player\.name\) === key/,
  "saved 2026 scorer names must be reconciled with corrected squad display names",
);
assert.match(appSource, /isWorldCup2026 \? "" : ` · Captain/);
assert.doesNotMatch(appSource, /isWorldCup2026 \? `\s*<div class="retro-rating-method"/);
assert.match(appSource, /const RETRO_LINEUP_SLOT_ORDER_VERSION = 10;/);
assert.match(appSource, /retroAchievementsButton\.hidden = false;/, "2026 must expose the in-mode achievement popup button");
assert.match(appSource, /\[2006, 2010, 2014, 2016, 2018, 2022, 2026\]\.includes/, "2026 must use the shared retro achievement popup");
const retroAchievementStateSource = appSource.slice(
  appSource.indexOf("function savedRetroAchievementTournamentStates"),
  appSource.indexOf("function retroTournamentHasProgress"),
);
assert.match(
  retroAchievementStateSource,
  /\[2006, 2010, 2014, 2016, 2018, 2022, 2026\]/g,
  "2026 completed runs must be replayed after login or reload",
);
assert.match(
  appSource,
  /els\.retroWorldCupScreen\?\.hidden === false[\s\S]*?\[2006, 2010, 2014, 2016, 2018, 2022, 2026\]\.includes\(Number\(retroTournament\?\.year\)\)/,
  "the shared achievements button must stay on the 2026 achievement set",
);
assert.match(indexSource, /data-achievement-year="2026"[^>]*>2026</, "2026 must have its own achievement tab");
assert.match(indexSource, /data-achievement-year="pl"[^>]*>PL 26\/27</, "Premier League achievements must remain separate");
assert.match(challengeSource, /activeAchievementYear === 2026 \? 48/, "2026 achievement progress must cover all 48 countries");
assert.match(challengeServiceSource, /retro_2026_attempts/, "2026 achievement attempts must be persisted separately");
assert.match(challengeServiceSource, /retro-\(2006\|2010\|2014\|2016\|2018\|2022\|2026\)/, "the API must expose the 2026 retro achievement endpoint");
assert.match(cleanCss, /data-achievement-theme="2026"[\s\S]*?--achievement-accent: #ff9e2f/, "2026 achievements must use the blue/orange theme");
assert.match(cleanCss, /retro-2026-active :is\(\s*\.settings-modal,\s*\.news-modal,\s*\.bug-report-modal,\s*#retroRestartModal/, "all 2026 utility modals need explicit theme isolation");
assert.match(appSource, /function retroLineupDropTarget\(event\)[\s\S]*?getBoundingClientRect\(\)/, "dragging must resolve the nearest pitch or bench player");
assert.match(appSource, /defaultManagedFinalIndex[\s\S]*?!isThirdPlacePlayoff\(match\)[\s\S]*?match\.homeId === team\.id/, "a managed semi-final winner must advance directly to their final");
["Cabo Verde", "Congo DR", "Côte d'Ivoire", "IR Iran", "Korea Republic"].forEach((country) => {
  assert.match(
    challengeSource,
    new RegExp(`"${country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`),
    `${country} needs a flag alias in the achievement popup`,
  );
});

assert.equal(data.teams.length, 48, "2026 must contain all 48 qualified teams");
assert.equal(Object.keys(squads).length, 48, "2026 must contain 48 official squads");
assert.equal(Object.keys(groupSchedule).length, 72, "2026 must contain all 72 group-stage schedules");
assert.equal(Object.keys(knockoutSchedule).length, 32, "2026 must contain all 32 knockout schedules");
assert.equal(groupSchedule["Mexico|South Africa"].stadium, "Mexico City Stadium");
assert.equal(groupSchedule["Mexico|South Africa"].localTime, "13:00");
assert.equal(knockoutSchedule["ko-final"].stadium, "New York New Jersey Stadium");
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 26, `${team} must have a 26-player squad`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 26, `${team} shirt numbers must be unique`);
  if (squad.ratingBlend.fc26MatchedPlayers > 0) {
    assert.ok(
      squad.players.some((player) => !["GK", "DF", "MF", "FW"].includes(player.position)),
      `${team} must retain detailed FC 26 positions for formation placement`,
    );
  }
  assert.equal(squad.startingXI.length, 11, `${team} must have a starting XI`);
  const lineup = engine.startingXI(2026, team);
  assert.equal(lineup.players.length, 11, `${team} lineup must resolve to 11 official players`);
  assert.ok(lineup.players.some((player) => player.position === "GK"), `${team} lineup must include a goalkeeper`);
  assert.match(squad.ratingBlend.formula, /40% FC 26 squad, 32% FIFA ranking, 28% 2026 tournament performance/);
});

const germanyByNumber = new Map(squads.Germany.players.map((player) => [player.number, player]));
assert.equal(germanyByNumber.get(1).name, "Manuel Neuer", "2026 names should omit middle names");
assert.equal(germanyByNumber.get(7).name, "Kai Havertz", "2026 surnames should use normal display case");
assert.equal(germanyByNumber.get(5).name, "Aleksandar Pavlović", "matched FC 26 names should use canonical spelling");
assert.ok(
  germanyByNumber.get(5).overall >= 75 && germanyByNumber.get(5).overall <= 82,
  "unmatched player ratings should reflect team and tournament strength instead of a flat fallback",
);

const canadaByNumber = new Map(squads.Canada.players.map((player) => [player.number, player]));
assert.equal(canadaByNumber.get(12).name, "Tani Oluwaseyi", "Canada names must use the listed football name, not DOB");
assert.equal(canadaByNumber.get(12).club, "Villarreal CF (ESP)", "Canada clubs must use the correct PDF column");
assert.equal(canadaByNumber.get(12).internationalCaps, 29, "Canada caps must use the correct PDF column");
assert.ok(
  squads.Canada.players.every((player) => !/\d{2}\/\d{2}\/\d{4}/.test(player.name)),
  "Canada player names must never contain dates of birth",
);

const englandByNumber = new Map(squads.England.players.map((player) => [player.number, player]));
assert.equal(englandByNumber.get(25).name, "Djed Spence", "England must use Djed Spence's listed football name");
assert.equal(englandByNumber.get(3).name, "Nico O'Reilly", "England must use Nico O'Reilly's listed football name");
assert.equal(englandByNumber.get(3).position, "LB", "Nico O'Reilly must be listed as a left back");
assert.equal(englandByNumber.get(3).overall, 83, "Nico O'Reilly must be rated 83");
assert.ok(squads.England.startingXI.includes(3), "Nico O'Reilly must start at left back for England");
assert.equal(englandByNumber.get(25).position, "LB", "Djed Spence must be listed as a left back");
assert.equal(englandByNumber.get(25).overall, 82, "Djed Spence must be rated 82");
assert.equal(germanyByNumber.get(25).name, "Assan Ouédraogo", "Germany must use Assan Ouédraogo's listed football name");
const franceByNumber = new Map(squads.France.players.map((player) => [player.number, player]));
assert.equal(franceByNumber.get(24).name, "Rayan Cherki", "France must use Rayan Cherki's listed football name");
assert.equal(squads.France.formation, "4-2-3-1", "France must use its recurring 2026 tournament shape");
assert.deepEqual(
  Array.from(squads.France.startingXI),
  [16, 3, 17, 4, 5, 6, 14, 12, 11, 7, 10],
  "France's default XI must include its actual tournament attacking core",
);
[7, 10, 11, 12].forEach((number) => {
  assert.ok(squads.France.startingXI.includes(number), `France attacker #${number} must start`);
});
assert.ok(franceByNumber.get(10).overall > franceByNumber.get(9).overall, "Mbappé must rate above rotation striker Marcus Thuram");
assert.ok(franceByNumber.get(7).overall >= 90, "Dembélé's tournament output must be reflected in his rating");
assert.ok(franceByNumber.get(11).overall >= 88, "Olise's tournament output must be reflected in his rating");

const spainByNumber = new Map(squads.Spain.players.map((player) => [player.number, player]));
assert.equal(squads.Spain.formation, "4-2-3-1", "Spain must use its World Cup final shape");
assert.ok(!squads.Spain.startingXI.includes(25), "Víctor Muñoz must not start after going unused");
assert.equal(spainByNumber.get(25).name, "Víctor Muñoz", "Víctor Muñoz must use his normal football name order");
assert.equal(spainByNumber.get(25).overall, 68, "Víctor Muñoz must not inherit Spain's elite team-average rating");
assert.equal(spainByNumber.get(25).tournamentRole, "unused", "Víctor Muñoz's tournament role must remain explicit");
[16, 19, 22, 23, 24].forEach((number) => {
  assert.ok(spainByNumber.get(number).overall >= 88, `Spain standout #${number} needs a tournament-level rating`);
});
const caboVerdeByNumber = new Map(squads["Cabo Verde"].players.map((player) => [player.number, player]));
assert.equal(squads["Cabo Verde"].teamRatings.overall, 78, "Cabo Verde must retain its requested ability boost");
assert.equal(caboVerdeByNumber.get(1).name, "Vozinha", "Cabo Verde must use Vozinha's football name");
assert.equal(caboVerdeByNumber.get(1).overall, 79, "Vozinha must remain one of Cabo Verde's strongest players");
assert.equal(caboVerdeByNumber.get(13).name, "Sidny Lopes Cabral", "Sidny Lopes Cabral's display name must be correct");
assert.equal(caboVerdeByNumber.get(13).overall, 78, "Sidny Lopes Cabral must retain his requested boost");

const tournament = engine.createTournament({ year: 2026, seed: 20260719, managedTeam: "Spain" });
assert.equal(engine.teamEntry(2026, "Spain").rating, squads.Spain.teamRatings.overall);
assert.equal(engine.teamEntry(2026, "Argentina").rating, squads.Argentina.teamRatings.overall);
assert.equal(tournament.groupMatches.length, 72, "12 groups must produce 72 group matches");
assert.ok(tournament.groupMatches.every((match) => match.schedule), "every 2026 group match must include date, time, and venue data");
assert.equal(engine.validate(tournament), true, "new 2026 tournaments must validate");

while (tournament.phase === "group") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds[0].name, "Round of 32");
assert.equal(tournament.knockoutRounds[0].matches.length, 16);
assert.equal(new Set(tournament.knockoutRounds[0].matches.flatMap((match) => [match.home, match.away])).size, 32);
assert.equal(tournament.bestThirdPlaced.length, 8);

while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.deepEqual(
  Array.from(tournament.knockoutRounds, (round) => round.name),
  ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Finals"],
);
assert.ok(tournament.champion, "completed tournament must crown a champion");
assert.equal(engine.allMatches(tournament).length, 104, "full 2026 tournament must contain 104 matches");
assert.ok(engine.allMatches(tournament).every((match) => match.schedule), "every 2026 fixture must retain its schedule metadata");

console.log("2026 World Cup squads, ratings, format, and completion flow verified.");
