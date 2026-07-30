import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "retro-2006-squads.js",
  "retro-2006-schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__data = RETRO_WORLD_CUPS[2006];
globalThis.__squads = RETRO_2006_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data;
const squads = context.__squads;
const engine = context.__engine;
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const build = fs.readFileSync(path.join(root, "scripts", "build-cloudflare.mjs"), "utf8");
const challenge = fs.readFileSync(path.join(root, "challenge.js"), "utf8");
const challengeService = fs.readFileSync(path.join(root, "challenge-service.mjs"), "utf8");
const achievementMigration = fs.readFileSync(
  path.join(root, "migrations", "0011_retro_2006_achievements.sql"),
  "utf8",
);

assert.equal(data.teams.length, 32, "Germany 2006 must contain all 32 finalists.");
assert.equal(Object.keys(squads).length, 32, "Germany 2006 must contain 32 independent squads.");
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} must have its official 23-player squad.`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 23, `${team} shirt numbers must be unique.`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team} must have three goalkeepers.`);
  assert.equal(squad.startingXI.length, 11, `${team} must have an opening-match XI.`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} opening XI must not repeat players.`);
  assert.ok(squad.players.every((player) => Number.isFinite(player.overall)), `${team} players must all be rated.`);
  assert.ok(squad.players.every((player) => player.club && !/2006 (?:world cup )?squad/i.test(player.club)),
    `${team} players must show their tournament-time club.`);
  assert.ok(squad.teamRatings, `${team} must expose its hybrid team ratings.`);
  const lineup = engine.startingXI(2006, team);
  assert.equal(lineup.players.length, 11, `${team} must resolve a complete shared-manager lineup.`);
});

assert.ok(squads.Italy.players.some((player) => player.name === "Fabio Cannavaro" && player.overall >= 92));
assert.ok(squads.France.players.some((player) => player.name === "Zinedine Zidane" && player.overall >= 92));
assert.ok(squads.Germany.players.some((player) => player.name === "Miroslav Klose" && player.overall >= 87));
assert.equal(squads.Argentina.players.find((player) => player.number === 8)?.club, "Corinthians (BRA)");
assert.equal(engine.historicalGoals(2006, { name: "Miroslav Klose" }), 5);
assert.ok(engine.validate(engine.createTournament({ year: 2006, seed: 20060609 })));

const goldenBootTournament = engine.createTournament({ year: 2006, seed: 20060709 });
while (goldenBootTournament.phase !== "complete") engine.simulateActiveStage(goldenBootTournament);
const goldenBoot = engine.goldenBoot(goldenBootTournament);
assert.ok(goldenBoot.length > 0 && goldenBoot[0].goals > 0,
  "Germany 2006 must retain goalscorers through the completed tournament.");
assert.ok(squads[goldenBoot[0].team].players.some((player) => player.name === goldenBoot[0].player),
  "Germany 2006 Golden Boot winner must resolve to an official squad player.");

const marker = "/* Germany 2006 Retro edition: ice-blue glass, diagonal motion and championship gold.";
const markerIndex = css.indexOf(marker);
assert.ok(markerIndex > 0, "Germany 2006 must have a dedicated final theme block.");
const theme = css.slice(markerIndex);
[
  ".retro-screen-header",
  ".retro-view-tabs",
  ".match-stage",
  ".round-board",
  ".match-analysis",
  ".standard-match-tactics",
  ".fixture",
  ".bracket-heads",
  ".retro-group-table",
  ".retro-squad-view",
  ".retro-lineups-view",
  ".retro-manager-lineup",
  ".match-2d-pitch",
  ".match-penalty-targets",
  ".champion-stage",
  ".snapshot-modal",
  ".retro-achievements-modal",
  ".achievement-unlock-modal",
  ".settings-switch",
  ".settings-keybind-button",
  ".team-filter-chip",
  ".standard-tactic-buttons button",
  ".go-to-top",
  ".toast",
  "::-webkit-scrollbar-thumb",
  "Germany 2006 cascade lock",
  "clip-path: polygon(",
  "border-radius: 2px !important",
  "@media (max-width: 900px)",
  "@media (prefers-reduced-motion: reduce)",
].forEach((token) => assert.ok(theme.includes(token), `Germany 2006 theme must explicitly cover ${token}.`));

assert.doesNotMatch(theme, /brazil-watercolor|south-africa-sunburst|qatar-night|#(?:006b3c|00843d|076f45|16834b|168f5b|087348|07523b|9c143d|a51a16)\b/i,
  "Germany 2006 must not reuse another tournament's assets or signature colours.");
assert.doesNotMatch(css, /retro-mode-active:not\(\.retro-2010-active\):not\(\.retro-2018-active\):not\(\.retro-2022-active\)/,
  "Brazil-only selectors must explicitly exclude Germany 2006.");
assert.match(app, /if \(Number\(year\) === 2006\) return RETRO_2006_SQUADS;/);
assert.match(app, /footer:\s*"GERMANY 2006 WORLD CUP"/,
  "Germany 2006 match snapshots must use the dedicated blue-and-gold palette.");
assert.doesNotMatch(app, /class="retro-squad-summary"/,
  "The squad screen must not render the removed team profile and likely XI summary.");
assert.match(app, /function normalizedMatchStats\(/,
  "Saved matches with partial stats must be normalized before rendering.");
const normalizedMatchStatsSource = app.match(/function normalizedMatchStats\([\s\S]*?\n}\n\nfunction renderMatchAnalysis/)?.[0]
  ?.replace(/\n\nfunction renderMatchAnalysis$/, "");
assert.ok(normalizedMatchStatsSource, "The match stat normalizer must remain independently testable.");
const normalizedStatsContext = vm.createContext({});
vm.runInContext(`${normalizedMatchStatsSource}
globalThis.__normalizedStats = normalizedMatchStats(
  {
    possession: { home: null, away: null },
    xg: { home: 0.7, away: 0.7 },
    shots: { home: 10, away: 8 },
    shotsOnTarget: { home: null, away: undefined },
    yellowCards: { home: NaN, away: null },
    redCards: { home: 0, away: 0 },
  },
  {
    possession: { home: 53, away: 47 },
    shotsOnTarget: { home: 4, away: 3 },
    yellowCards: { home: 2, away: 1 },
  },
);`, normalizedStatsContext);
assert.deepEqual(
  JSON.parse(JSON.stringify(normalizedStatsContext.__normalizedStats)),
  {
    possession: { home: 53, away: 47 },
    xg: { home: 0.7, away: 0.7 },
    shots: { home: 10, away: 8 },
    shotsOnTarget: { home: 4, away: 3 },
    yellowCards: { home: 2, away: 1 },
    redCards: { home: 0, away: 0 },
  },
  "Partial saved stats must use generated fallback values instead of NaN.",
);
assert.match(theme, /Germany 2006 component lock/,
  "Newer lineup, filter and squad components must be locked to the 2006 palette.");
assert.match(theme, /#mainContent \.standard-match-tactics \.standard-tactic-buttons/,
  "The 2006 tactics control must override the shared green container.");
assert.match(theme, /#mainContent \.event-live-clock\s*\{[\s\S]*?background:\s*transparent\s*!important/,
  "The 2006 live timer must remain open and must not inherit a boxed status background.");
assert.match(app, /classList\.toggle\("retro-2006-active", Number\(retroTournament\.year\) === 2006\)/);
assert.match(app, /\[2006, 2010, 2014, 2016, 2018, 2022\]\.forEach\(\(year\) => installRetroTeams\(year\)\)/);
assert.match(
  app,
  /\["2006", "2010", "2014", "2018", "2022"\]\.includes\(String\(selectedYear\)\)/,
  "The landing-card availability gate must expose Germany 2006 as playable.",
);
assert.match(html, /retro-2006-squads\.js/);
assert.match(html, /retro-2006-schedule\.js/);
assert.equal((html.match(/data-achievement-year="2006"/g) || []).length, 2,
  "Germany 2006 must appear in both achievement views.");
assert.match(css, /data-achievement-theme="2006"/,
  "Germany 2006 achievements need their own blue and gold theme.");
assert.match(app, /openRetroModal\(Number\(retroTournament\.year\)\)/,
  "The retro achievement button must open the active tournament year.");
assert.match(app, /function calculateRetroGoalscorerTable\(\)/,
  "The Germany 2006 final screen needs a scorer table sourced from the retro tournament.");
assert.match(
  app,
  /function calculateRetroGoalscorerTable\(\)[\s\S]*if \(!match\?\.result\?\.revealed \|\| match\.result\.bye\) return;/,
  "Retro Golden Boot tables must not count a generated result before the match is revealed.",
);
assert.match(app, /isRetroSimulatorState\(\) && retroTournament && rounds === state\.rounds/,
  "Retro Golden Boot rendering must use the retro scorer tracker.");
assert.match(app, /Number\(year\) === 2006[\s\S]*\.\.\.derivedSimulationRatings[\s\S]*overall:\s*rating/,
  "Germany 2006 teams must fill every shared simulation rating without changing the match engine.");
assert.match(challenge, /2006:\s*"GERMANY 2006"/);
assert.match(challenge, /\[256,\s*2006,\s*2010,\s*2014,\s*2016,\s*2018,\s*2022\]/);
assert.match(challenge, /retro-\(\?:06\|10\|14\|18\|22\)-world-cup/,
  "The profile back route must preserve Germany 2006 like every other retro World Cup.");
assert.equal((challenge.match(/\[256,\s*2006,\s*2010,\s*2014,\s*2016,\s*2018,\s*2022\]/g) || []).length >= 2, true,
  "Germany 2006 must be included in both profile aggregation and account progress loading.");
assert.match(challengeService, /id:\s*"retro-2006-world-tour"/);
assert.match(challengeService, /retro-\(2006\|2010\|2014\|2016\|2018\|2022\)/);
assert.match(achievementMigration, /CREATE TABLE IF NOT EXISTS retro_2006_attempts/);
assert.match(worker, /"\/retro-06-world-cup"/);
assert.match(build, /assets\/retro-2006\/germany-2006-bg\.png/);
assert.ok(fs.statSync(path.join(root, "assets", "retro-2006", "germany-2006-bg.png")).size > 500_000);

const simulations = Math.max(200, Number.parseInt(process.env.RETRO_2006_SIMULATIONS || "800", 10));
const eliteTeams = new Set(["Italy", "France", "Germany", "Portugal", "Argentina", "Brazil", "England", "Netherlands", "Spain"]);
const ratingByTeam = new Map(data.teams.map((team) => [team.name, team.rating]));
const championCounts = new Map();
let eliteTitles = 0;
let lowRatedTitles = 0;

for (let index = 0; index < simulations; index += 1) {
  const tournament = engine.createTournament({ year: 2006, seed: 20060609 + index * 7919 });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
  championCounts.set(tournament.champion, (championCounts.get(tournament.champion) || 0) + 1);
  if (eliteTeams.has(tournament.champion)) eliteTitles += 1;
  if (ratingByTeam.get(tournament.champion) <= 76) lowRatedTitles += 1;
}

const championRanking = [...championCounts.entries()].sort((left, right) => right[1] - left[1]);
assert.ok(eliteTitles / simulations >= 0.63,
  "Germany 2006 elite teams should win at least 63% of Standard simulations.");
assert.ok(lowRatedTitles / simulations <= 0.055,
  "Teams rated 76 or below must not win more than 5.5% of Standard simulations.");
assert.ok((championRanking[0]?.[1] || 0) / simulations <= 0.24,
  "No Germany 2006 team should dominate more than 24% of Standard simulations.");
assert.ok(championRanking.length >= 10,
  "Germany 2006 should retain believable upset variance.");

console.log(JSON.stringify({
  simulations,
  eliteTitleRate: Number((eliteTitles * 100 / simulations).toFixed(1)),
  lowRatedTitleRate: Number((lowRatedTitles * 100 / simulations).toFixed(1)),
  champions: championRanking.slice(0, 12).map(([team, count]) => ({
    team,
    rate: Number((count * 100 / simulations).toFixed(1)),
  })),
}, null, 2));
console.log("Germany 2006 data, balance, route and theme isolation tests passed.");
