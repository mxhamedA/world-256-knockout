import engine from "../ucl-engine.js";
import squadModule from "../ucl-squads.generated.js";
import calibration from "../ucl-squad-calibration.js";

const runs = Math.max(100, Number(process.argv[2]) || 5000);
const squads = squadModule.UCL_FC27_SQUADS;
const calibrationIssues = calibration.apply(squads, engine);
if (calibrationIssues.length) throw new Error(calibrationIssues.join("\n"));

engine.TEAM_DATA.forEach((team) => {
  const ratings = squads[team.id]?.simulationRatings;
  if (ratings) engine.applySimulationRatings(team.id, ratings);
});

const totals = new Map(engine.TEAM_DATA.map((team) => [team.id, {
  team: team.name,
  rating: engine.team(team.id).rating,
  entries: 0,
  points: 0,
  positions: 0,
  top8: 0,
  top24: 0,
  titles: 0,
}]));
let totalLeagueGoals = 0;
let totalLeagueMatches = 0;

for (let seed = 1; seed <= runs; seed += 1) {
  const season = engine.createSeason(null, seed);
  for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
    engine.ensureMatchdayResults(season, roundIndex).forEach((match) => {
      totalLeagueGoals += match.result.home + match.result.away;
      totalLeagueMatches += 1;
    });
    engine.completeMatchday(season, roundIndex);
  }
  const table = engine.leagueTable(season);
  table.forEach((row) => {
    const record = totals.get(row.team.id);
    record.entries += 1;
    record.points += row.points;
    record.positions += row.position;
    if (row.position <= 8) record.top8 += 1;
    if (row.position <= 24) record.top24 += 1;
  });
  for (const round of engine.ROUND_CONFIG) {
    engine.ensureKnockoutResults(season, round.key);
    engine.completeKnockoutRound(season, round.key);
  }
  totals.get(season.championId).titles += 1;
}

const percent = (value, total) => total ? Number((value * 100 / total).toFixed(1)) : 0;
const average = (value, total) => total ? Number((value / total).toFixed(2)) : 0;
const rows = [...totals.values()]
  .filter((row) => row.entries)
  .map((row) => ({
    club: row.team,
    rating: row.rating,
    entries: row.entries,
    avgPoints: average(row.points, row.entries),
    avgPosition: average(row.positions, row.entries),
    top8Pct: percent(row.top8, row.entries),
    top24Pct: percent(row.top24, row.entries),
    titlePct: percent(row.titles, row.entries),
  }))
  .sort((left, right) => right.titlePct - left.titlePct || left.avgPosition - right.avgPosition);

console.log(JSON.stringify({
  runs,
  averageLeagueGoalsPerMatch: average(totalLeagueGoals, totalLeagueMatches),
  teams: rows,
}, null, 2));
