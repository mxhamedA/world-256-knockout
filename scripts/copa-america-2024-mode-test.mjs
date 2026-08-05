import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
vm.runInContext([
  "retro-data.js",
  "data/retro/copa-america-2024/squads.js",
  "data/retro/copa-america-2024/schedule.js",
  "retro-engine.js",
].map(read).join("\n") + `
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_COPA_2024_SQUADS;
globalThis.__groupSchedule = RETRO_COPA_2024_GROUP_SCHEDULE;
globalThis.__knockoutSchedule = RETRO_COPA_2024_KNOCKOUT_SCHEDULE;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data[2024];
const squads = context.__squads;
const groupSchedule = context.__groupSchedule;
const knockoutSchedule = context.__knockoutSchedule;
const engine = context.__engine;
const groups = [
  ["Argentina", "Peru", "Chile", "Canada"],
  ["Mexico", "Ecuador", "Venezuela", "Jamaica"],
  ["United States", "Uruguay", "Panama", "Bolivia"],
  ["Brazil", "Colombia", "Paraguay", "Costa Rica"],
];

assert.deepEqual(
  ["A", "B", "C", "D"].map((group) => Array.from(data.teams).filter((team) => team.group === group).map((team) => team.name)),
  groups,
  "Copa América 2024 must use the final official groups in order",
);
assert.equal(data.teams.length, 16, "exactly 16 Copa América teams are required");
assert.equal(new Set(data.teams.map((team) => team.name)).size, 16, "Copa América team names must be unique");
assert.ok(!data.teams.some((team) => ["Trinidad and Tobago", "Honduras"].includes(team.name)));
assert.equal(Object.keys(squads).length, 16, "all 16 final squads must be present");
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 26, `${team} must retain its complete 26-player final roster`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 26, `${team} shirt numbers must be unique`);
  assert.equal(squad.startingXI.length, 11, `${team} must have a realistic starting XI`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} starting XI numbers must be unique`);
  assert.ok(squad.players.some((player) => player.position === "GK"), `${team} needs a goalkeeper`);
  assert.ok(squad.captain, `${team} needs a captain`);
  assert.ok(squad.penaltyTakers.length >= 4, `${team} needs suitable penalty takers`);
  const lineup = engine.startingXI(2024, team);
  assert.equal(lineup.players.length, 11, `${team} starting XI must resolve through the shared engine`);
  assert.ok(lineup.players.some((player) => player.position === "GK"), `${team} XI must include a goalkeeper`);
  assert.ok(lineup.players.every((player) => player.positions.includes(player.position)), `${team} positions must be fit-aware`);
});

assert.equal(Object.keys(groupSchedule).length, 24, "the official group schedule must contain 24 fixtures");
const tournament = engine.createTournament({ year: 2024, seed: 20240714, managedTeam: "Argentina" });
assert.equal(tournament.groupMatches.length, 24);
assert.deepEqual(
  Array.from(tournament.groupMatches, (match) => match.schedule.matchNumber),
  Array.from({ length: 24 }, (_, index) => index + 1),
  "group fixtures must preserve the original official match order",
);
assert.deepEqual(
  Array.from(tournament.groupMatches).slice(-4).map((match) => `${match.home}|${match.away}`),
  ["United States|Uruguay", "Bolivia|Panama", "Brazil|Colombia", "Costa Rica|Paraguay"],
  "the final simultaneous group round must preserve its official ordering",
);
assert.equal(Object.keys(knockoutSchedule).length, 8);
assert.equal(new Set([...Object.values(groupSchedule), ...Object.values(knockoutSchedule)].map((match) => match.stadium)).size, 14, "all 14 official stadiums must be represented");
assert.deepEqual(
  Object.values(knockoutSchedule).map((match) => match.matchNumber),
  Array.from({ length: 8 }, (_, index) => index + 25),
);
assert.ok(Object.values(knockoutSchedule).filter((match) => match.directToPenalties).length === 7);
assert.equal(knockoutSchedule["ko-final"].extraTime, true);
assert.equal(knockoutSchedule["ko-final"].directToPenalties, false);
assert.equal(engine.validate(tournament), true);

while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds.length, 3, "Copa América must have quarter-finals, semi-finals and finals rounds");
assert.deepEqual(Array.from(tournament.knockoutRounds, (round) => round.matches.length), [4, 2, 2]);
assert.equal(engine.allMatches(tournament).length, 32, "the complete competition must contain exactly 32 matches");
assert.ok(tournament.knockoutRounds[0].matches.every((match) => match.schedule.pairing));
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-third-place"));
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-final"));
assert.ok(tournament.champion);
assert.ok(engine.goldenBoot(tournament).length > 0);
assert.ok(engine.goldenGlove(tournament).some((award) => award.cleanSheets >= 0));

function groupResult(home, away, homeGoals, awayGoals) {
  return { home, away, result: { homeGoals, awayGoals } };
}

const twoTeamTie = engine.createTournament({ year: 2024, seed: 11 });
const twoTeamResults = [
  groupResult("Argentina", "Canada", 1, 0),
  groupResult("Peru", "Chile", 1, 0),
  groupResult("Chile", "Argentina", 1, 0),
  groupResult("Peru", "Canada", 1, 0),
  groupResult("Argentina", "Peru", 1, 0),
  groupResult("Canada", "Chile", 0, 0),
];
twoTeamResults.forEach((entry) => Object.assign(twoTeamTie.groupMatches.find((match) => match.home === entry.home && match.away === entry.away), { result: entry.result }));
const twoTable = engine.groupStandings(twoTeamTie, "A");
assert.equal(twoTable[0].name, "Argentina", "a two-team tie must use the head-to-head result after global points/GD/GF");
assert.equal(twoTable[1].name, "Peru");

const threeTeamTie = engine.createTournament({ year: 2024, seed: 12 });
const threeTeamResults = [
  groupResult("Mexico", "Ecuador", 2, 3),
  groupResult("Ecuador", "Venezuela", 3, 4),
  groupResult("Venezuela", "Mexico", 0, 1),
  groupResult("Mexico", "Jamaica", 4, 4),
  groupResult("Ecuador", "Jamaica", 1, 1),
  groupResult("Jamaica", "Venezuela", 3, 3),
];
threeTeamResults.forEach((entry) => Object.assign(threeTeamTie.groupMatches.find((match) => match.home === entry.home && match.away === entry.away), { result: entry.result }));
const threeTable = engine.groupStandings(threeTeamTie, "B");
assert.deepEqual(Array.from(threeTable).slice(0, 3).map((row) => row.name), ["Ecuador", "Venezuela", "Mexico"], "a three-team tie must resolve through the H2H mini-table before discipline/seed");

function findTiedKnockoutResult(id, home = "Argentina", away = "Peru") {
  for (let seed = 1; seed < 5000; seed += 1) {
    const sampleTournament = engine.createTournament({ year: 2024, seed });
    const match = { id, stage: "knockout", home, away, result: null };
    const result = engine.simulateMatch(sampleTournament, match);
    if (result.regulationHome === result.regulationAway) return result;
  }
  throw new Error(`Could not find a tied sample for ${id}`);
}
const quarterFinalTie = findTiedKnockoutResult("ko-qf-m1");
assert.equal(quarterFinalTie.extraTime, false, "Copa quarter-finals must skip extra time");
assert.ok(quarterFinalTie.penalties, "Copa quarter-finals must go directly to penalties when level");
const semiFinalTie = findTiedKnockoutResult("ko-sf-m1");
assert.equal(semiFinalTie.extraTime, false, "Copa semi-finals must skip extra time");
assert.ok(semiFinalTie.penalties, "Copa semi-finals must go directly to penalties when level");
const thirdPlaceTie = findTiedKnockoutResult("ko-third-place");
assert.equal(thirdPlaceTie.extraTime, false, "the third-place match must skip extra time");
assert.ok(thirdPlaceTie.penalties, "the third-place match must go directly to penalties when level");
const finalTie = findTiedKnockoutResult("ko-final");
assert.equal(finalTie.extraTime, true, "only the Copa final may use extra time");

const app = read("app.js");
const sourceApp = read("src/web/app/02-tournaments/10-player-profiles-and-rosters.js");
const index = read("index.html");
const worker = read("worker.mjs");
const wrangler = read("wrangler.jsonc");
const css = read("clean.css");
const copaSourceCss = read("src/web/styles/17-wc-1998-final-guards.css");
const service = read("challenge-service.mjs");
const migration = read("migrations/0019_retro_copa_2024_achievements.sql");
assert.match(app, /RETRO_WORLD_CUP_PATHS[\s\S]*2024:\s*"\/copa-america-2024"/);
assert.match(app, /retro-copa-2024-active/);
assert.match(app, /retroMatchAllowsExtraTime[\s\S]*match\?\.id === "ko-final"/);
assert.match(sourceApp, /isCopa2024[\s\S]*managementAttack[\s\S]*managementDefence/);
assert.match(index, /Copa América 2024 is coming soon/);
assert.match(index, /id="retroCopaAnnouncementAction"[^>]*disabled[\s\S]*Coming soon/);
assert.match(index, /data-achievement-year="2024"/);
assert.match(worker, /"\/copa-america-2024"/);
assert.match(wrangler, /"\/copa-america-2024"/);
assert.match(css, /retro-copa-2024-active[\s\S]*copa-america-2024-bg-desktop\.svg/);
assert.match(css, /retro-copa-2024-active[\s\S]*bracket-connector/);
assert.match(css, /retro-copa-2024-active[\s\S]*penalty-targets[\s\S]*border-radius: 50%/);
const copaStart = copaSourceCss.indexOf("/* Copa América USA 2024: isolated broadcast package.");
const copaEnd = copaSourceCss.indexOf("/* France 1998", copaStart);
const copaCss = copaSourceCss.slice(copaStart, copaEnd > copaStart ? copaEnd : undefined);
assert.doesNotMatch(copaCss, /#34c77b|#ffd21f|#5f8cff|#7d9878|#526d56/, "the Copa scoped block must not reintroduce green, yellow or Argentina chrome");
assert.match(service, /retro_copa_2024_attempts/);
assert.match(service, /retro-\(1998\|2002\|2006\|2010\|2014\|2016\|2018\|2022\|2024\|2026\)/);
assert.match(migration, /tournament_seed/);
assert.match(migration, /PRIMARY KEY \(account_id, tournament_seed, team_name\)/);

console.log("Copa América 2024 mode regression checks passed.");
