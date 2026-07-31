import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const countArgument = process.argv.find((argument) => /^--count=\d+$/.test(argument));
const seasonCount = countArgument ? Number(countArgument.split("=")[1]) : 20;
if (seasonCount < 1 || seasonCount > 30) throw new Error("PL balance validation supports 1-30 seasons.");

function mockElement() {
  return {
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    checked: false,
    parentElement: null,
    parentNode: null,
    dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return mockElement(); },
    appendChild() {},
    insertAdjacentHTML() {},
    after() {},
    before() {},
    insertBefore() {},
    remove() {},
    replaceChildren() {},
    scrollIntoView() {},
    showModal() {},
    close() {},
    focus() {},
    click() {},
    closest() { return null; },
  };
}

const elements = new Map();
const context = {
  console,
  assert,
  URL,
  URLSearchParams,
  Object,
  Array,
  Map,
  Set,
  Math,
  Date,
  JSON,
  Intl,
  Number,
  String,
  Boolean,
  Error,
  TypeError,
  ReferenceError,
  Promise,
  isNaN,
  parseInt,
  parseFloat,
  setTimeout: () => 1,
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
};
context.document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, mockElement());
    return elements.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return mockElement(); },
  createComment() { return mockElement(); },
  addEventListener() {},
  body: mockElement(),
  documentElement: mockElement(),
  activeElement: { tagName: "BODY" },
  fullscreenElement: null,
};
context.window = {
  addEventListener() {},
  scrollTo() {},
  matchMedia() { return { matches: false }; },
  location: { pathname: "/", search: "", hash: "", href: "http://localhost/" },
  history: { replaceState() {}, pushState() {} },
  setTimeout: () => 1,
  setInterval: () => 1,
};
context.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
context.navigator = {};
context.window.navigator = context.navigator;
vm.createContext(context);

const files = [
  "player-pools.generated.js",
  "data.js",
  "retro-data.js",
  "retro-2006-squads.js",
  "retro-2006-schedule.js",
  "retro-2010-squads.js",
  "retro-2010-schedule.js",
  "retro-2014-squads.js",
  "retro-2014-schedule.js",
  "retro-euro-2016-squads.js",
  "retro-euro-2016-schedule.js",
  "retro-2018-squads.js",
  "retro-2018-schedule.js",
  "retro-2022-squads.js",
  "retro-2022-schedule.js",
  "retro-2026-squads.js",
  "retro-engine.js",
  "presentation-engine.js",
  "simulation-engine.js",
  "legacy-data/catalog.generated.js",
  "premier-league-squads.generated.js",
  "premier-league-fc26-ratings.js",
  "premier-league-data.js",
  "app.js",
];
const sources = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__runPremierLeagueBalance = function runPremierLeagueBalance(seasonCount) {
  const clubs = window.PREMIER_LEAGUE_2026_27_CLUBS;
  const plClubById = new Map(clubs.map((club) => [club.id, club]));
  clubs.forEach((club) => {
    TEAM_BY_ID.set(club.id, club);
    clearPlayerProfileCacheForTeam(club.id);
  });
  const report = {
    seasons: [],
    totalGoals: 0,
    totalMatches: 0,
    topScorerGoals: [],
    topScorerAppearances: [],
    scorerRows: 0,
    scorerRowsWith38Appearances: 0,
    topAssistCounts: [],
    championPoints: [],
    bottomPoints: [],
    sakaGoals: [],
    assistedGoals: 0,
    assistEligibleGoals: 0,
    maximumCentreBackAssists: 0,
    forestPositions: [],
    forestPoints: [],
    homeGoals: 0,
    awayGoals: 0,
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    penaltyGoals: 0,
  };
  clubs.forEach((club) => {
    const profiles = playerProfilesForTeam(club);
    const penaltyTakers = profiles.filter((player) => player.penaltyTaker);
    assert.equal(penaltyTakers.length, 1, club.name + " must have exactly one designated penalty taker.");
    assert.ok(
      ["ST", "CF", "SS", "LW", "RW", "CAM", "AM"].includes(penaltyTakers[0].position),
      club.name + "'s designated penalty taker cannot be a defender: " + JSON.stringify(penaltyTakers[0]),
    );
    assert.equal(
      penaltyTakers[0].startingXI,
      true,
      club.name + "'s designated penalty taker must be part of the likely starting XI: " + JSON.stringify(penaltyTakers[0]),
    );
  });
  for (let seasonIndex = 0; seasonIndex < seasonCount; seasonIndex += 1) {
    state.drawSeed = 8_100_000 + seasonIndex * 91_919;
    state.settings = { ...defaultSettings, upset: "balanced", goals: "normal", realNames: true, realPlayersOnly: true };
    state.rounds = window.createPremierLeagueSchedule();
    state.activeRound = 0;
    state.started = true;
    state.spectateTeamId = null;
    state.neutralView = true;
    state.standardTactic = "balanced";
    state.premierLeagueSeason = true;
    for (let roundIndex = 0; roundIndex < 38; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
        report.totalGoals += match.result.homeGoals + match.result.awayGoals;
        report.totalMatches += 1;
        [
          [match.homeId, match.result.homeEvents || []],
          [match.awayId, match.result.awayEvents || []],
        ].forEach(([teamId, events]) => events.forEach((event) => {
          if (event.goalType !== "penalty") return;
          report.penaltyGoals += 1;
          const scorer = playerProfilesForTeam(plClubById.get(teamId))
            .find((player) => player.name === event.scorer);
          assert.ok(scorer, "A Premier League penalty scorer must belong to the scoring club: " + event.scorer);
          assert.ok(
            !["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "DM"].includes(scorer.position),
            "A defender cannot take a Premier League regulation penalty: " + JSON.stringify({ scorer, event }),
          );
        }));
        report.homeGoals += match.result.homeGoals;
        report.awayGoals += match.result.awayGoals;
        if (match.result.homeGoals > match.result.awayGoals) report.homeWins += 1;
        else if (match.result.awayGoals > match.result.homeGoals) report.awayWins += 1;
        else report.draws += 1;
      });
    }
    const rows = new Map(clubs.map((club) => [club.id, {
      club, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    }]));
    state.rounds.flat().forEach((match) => {
      const home = rows.get(match.homeId);
      const away = rows.get(match.awayId);
      const hg = match.result.homeGoals;
      const ag = match.result.awayGoals;
      home.played += 1; away.played += 1;
      home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
      if (hg > ag) { home.won += 1; away.lost += 1; home.points += 3; }
      else if (ag > hg) { away.won += 1; home.lost += 1; away.points += 3; }
      else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
    });
    const table = [...rows.values()]
      .map((row) => ({ ...row, gd: row.gf - row.ga }))
      .sort((left, right) => right.points - left.points || right.gd - left.gd || right.gf - left.gf);
    const scorers = calculateGoalscorerTable();
    const topScorer = scorers[0];
    scorers.forEach((row) => {
      assert.ok(row.matches >= row.goals,
        row.player + " cannot score " + row.goals + " goals in only " + row.matches + " appearances.");
      report.scorerRows += 1;
      if (row.matches === 38) report.scorerRowsWith38Appearances += 1;
    });
    const saka = scorers.find((row) => row.player === "Bukayo Saka");
    const assists = new Map();
    state.rounds.flat().forEach((match) => {
      [
        [match.homeId, match.result.homeEvents || []],
        [match.awayId, match.result.awayEvents || []],
      ].forEach(([teamId, events]) => events.forEach((event) => {
        if (event.ownGoal || event.goalType === "ownGoal") return;
        report.assistEligibleGoals += 1;
        const assistName = event.assist || event.metadata?.assist || null;
        if (!assistName) return;
        assert.notEqual(assistName, event.scorer,
          "A scorer cannot assist their own goal: " + JSON.stringify(event));
        assert.ok(plClubById.get(teamId).playerProfiles.some((player) => player.name === assistName),
          assistName + " must belong to the credited team.");
        report.assistedGoals += 1;
        const assistKey = teamId + ":" + assistName;
        const assisterProfile = plClubById.get(teamId).playerProfiles.find((player) => player.name === assistName);
        const assistRow = assists.get(assistKey) || {
          count: 0,
          position: assisterProfile?.position || null,
        };
        assistRow.count += 1;
        assists.set(assistKey, assistRow);
      }));
    });
    report.topAssistCounts.push(Math.max(0, ...[...assists.values()].map((row) => row.count)));
    report.maximumCentreBackAssists = Math.max(
      report.maximumCentreBackAssists,
      0,
      ...[...assists.values()]
        .filter((row) => row.position === "CB")
        .map((row) => row.count),
    );
    const forestPosition = table.findIndex((row) => row.club.id === "nottingham-forest");
    report.forestPositions.push(forestPosition + 1);
    report.forestPoints.push(table[forestPosition]?.points || 0);
    report.championPoints.push(table[0].points);
    report.bottomPoints.push(table.at(-1).points);
    report.topScorerGoals.push(topScorer?.goals || 0);
    report.topScorerAppearances.push(topScorer?.matches || 0);
    report.sakaGoals.push(saka?.goals || 0);
    report.seasons.push({
      champion: table[0].club.name,
      championPoints: table[0].points,
      bottom: table.at(-1).club.name,
      bottomPoints: table.at(-1).points,
      topScorer: topScorer?.player || "None",
      topScorerGoals: topScorer?.goals || 0,
    });
  }
  return report;
};`, context);

const report = context.__runPremierLeagueBalance(seasonCount);
const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;
const goalsPerMatch = report.totalGoals / report.totalMatches;
const averageTopScorer = average(report.topScorerGoals);
const maximumTopScorer = Math.max(...report.topScorerGoals);
const averageTopScorerAppearances = average(report.topScorerAppearances);
const maximumTopScorerAppearances = Math.max(...report.topScorerAppearances);
const fullSeasonScorerRate = report.scorerRowsWith38Appearances / Math.max(1, report.scorerRows);
const averageChampionPoints = average(report.championPoints);
const averageBottomPoints = average(report.bottomPoints);
const distinctGoldenBootWinners = new Set(report.seasons.map((season) => season.topScorer)).size;
const goldenBootWinnerCounts = report.seasons.reduce((counts, season) => {
  counts[season.topScorer] = (counts[season.topScorer] || 0) + 1;
  return counts;
}, {});
const mostGoldenBootsByOnePlayer = Math.max(...Object.values(goldenBootWinnerCounts));
const assistedGoalRate = report.assistedGoals / Math.max(1, report.assistEligibleGoals);
const averageTopAssists = average(report.topAssistCounts);
const averageForestPosition = average(report.forestPositions);
const averageForestPoints = average(report.forestPoints);
const homeWinRate = report.homeWins / report.totalMatches;
const awayWinRate = report.awayWins / report.totalMatches;
const drawRate = report.draws / report.totalMatches;
const homeGoalShare = report.homeGoals / Math.max(1, report.homeGoals + report.awayGoals);

console.log(`PL balance raw: ${goalsPerMatch.toFixed(2)} GPM, ${(homeWinRate * 100).toFixed(1)}% home wins, ${(awayWinRate * 100).toFixed(1)}% away wins, ${(homeGoalShare * 100).toFixed(1)}% home goal share, ${averageTopScorer.toFixed(1)} average boot in ${averageTopScorerAppearances.toFixed(1)} apps, ${(fullSeasonScorerRate * 100).toFixed(1)}% of scorers on 38 apps, ${averageChampionPoints.toFixed(1)} champion points, ${averageBottomPoints.toFixed(1)} bottom points.`);

assert.ok(goalsPerMatch >= 2.35 && goalsPerMatch <= 3.35,
  `PL goals per match must remain realistic; received ${goalsPerMatch.toFixed(2)}.`);
assert.ok(homeWinRate >= 0.37 && homeWinRate <= 0.52,
  `PL home-win rate must remain realistic; received ${(homeWinRate * 100).toFixed(1)}%.`);
assert.ok(awayWinRate >= 0.22 && awayWinRate <= 0.39,
  `PL away-win rate must remain realistic; received ${(awayWinRate * 100).toFixed(1)}%.`);
assert.ok(homeWinRate - awayWinRate >= 0.05,
  `Home advantage must materially affect PL results; received a ${((homeWinRate - awayWinRate) * 100).toFixed(1)} point gap.`);
assert.ok(homeGoalShare >= 0.52 && homeGoalShare <= 0.58,
  `Home teams must score a plausible share of PL goals; received ${(homeGoalShare * 100).toFixed(1)}%.`);
assert.ok(drawRate >= 0.17 && drawRate <= 0.31,
  `PL draw rate must remain plausible; received ${(drawRate * 100).toFixed(1)}%.`);
assert.ok(averageTopScorer >= 17 && averageTopScorer <= 32,
  `Average Golden Boot total must be realistic; received ${averageTopScorer.toFixed(1)}.`);
assert.ok(maximumTopScorer <= 40,
  `No Golden Boot winner should exceed 40 league goals; received ${maximumTopScorer}.`);
assert.ok(averageTopScorerAppearances >= 28 && averageTopScorerAppearances <= 37,
  `Golden Boot appearance totals must reflect rotation; received ${averageTopScorerAppearances.toFixed(1)}.`);
assert.ok(fullSeasonScorerRate <= 0.18,
  `Too many scoring players are credited with all 38 matches; received ${(fullSeasonScorerRate * 100).toFixed(1)}%.`);
assert.ok(Math.max(...report.sakaGoals) <= 40,
  `Saka must not produce an implausible 40+ goal league season; received ${Math.max(...report.sakaGoals)}.`);
assert.ok(distinctGoldenBootWinners >= Math.min(4, seasonCount),
  `Golden Boot results must not collapse onto one player; received ${distinctGoldenBootWinners} distinct winners.`);
assert.ok(report.penaltyGoals > 0, "The balance sample must exercise regulation-time penalty selection.");
if (seasonCount >= 10) {
  assert.ok(
    mostGoldenBootsByOnePlayer <= Math.ceil(seasonCount * 0.35),
    `Golden Boot winners must vary by season; one player won ${mostGoldenBootsByOnePlayer} of ${seasonCount}.`,
  );
}
assert.ok(assistedGoalRate >= 0.4 && assistedGoalRate <= 0.72,
  `Assists must be recorded at a plausible rate; received ${(assistedGoalRate * 100).toFixed(1)}%.`);
assert.ok(averageTopAssists >= 7 && averageTopAssists <= 22,
  `Season assist leaders must have plausible totals; received ${averageTopAssists.toFixed(1)}.`);
assert.ok(report.maximumCentreBackAssists <= 6,
  `Centre-backs must not post playmaker-level assist totals; received ${report.maximumCentreBackAssists}.`);
assert.ok(averageForestPosition >= 7 && averageForestPosition <= 16,
  `Nottingham Forest must settle into a plausible mid-table range; received ${averageForestPosition.toFixed(1)}.`);
assert.ok(averageChampionPoints >= 70 && averageChampionPoints <= 96,
  `Average champion points must be plausible; received ${averageChampionPoints.toFixed(1)}.`);
assert.ok(averageBottomPoints >= 12 && averageBottomPoints <= 42,
  `Average bottom-club points must be plausible; received ${averageBottomPoints.toFixed(1)}.`);

console.log(JSON.stringify({
  seasonCount,
  goalsPerMatch: Number(goalsPerMatch.toFixed(2)),
  homeWinRate: Number(homeWinRate.toFixed(3)),
  drawRate: Number(drawRate.toFixed(3)),
  awayWinRate: Number(awayWinRate.toFixed(3)),
  homeGoalShare: Number(homeGoalShare.toFixed(3)),
  averageTopScorer: Number(averageTopScorer.toFixed(1)),
  maximumTopScorer,
  averageTopScorerAppearances: Number(averageTopScorerAppearances.toFixed(1)),
  maximumTopScorerAppearances,
  fullSeasonScorerRate: Number(fullSeasonScorerRate.toFixed(3)),
  assistedGoalRate: Number(assistedGoalRate.toFixed(3)),
  averageTopAssists: Number(averageTopAssists.toFixed(1)),
  maximumCentreBackAssists: report.maximumCentreBackAssists,
  averageForestPosition: Number(averageForestPosition.toFixed(1)),
  averageForestPoints: Number(averageForestPoints.toFixed(1)),
  averageChampionPoints: Number(averageChampionPoints.toFixed(1)),
  averageBottomPoints: Number(averageBottomPoints.toFixed(1)),
  champions: Object.fromEntries(
    Object.entries(report.seasons.reduce((counts, season) => {
      counts[season.champion] = (counts[season.champion] || 0) + 1;
      return counts;
    }, {})).sort((left, right) => right[1] - left[1]),
  ),
  goldenBoots: report.seasons.map((season) => `${season.topScorer} (${season.topScorerGoals})`),
  goldenBootWinnerCounts,
}, null, 2));
