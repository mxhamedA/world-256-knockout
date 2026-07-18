const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const tournamentCountArgument = process.argv.find((argument) => /^--count=\d+$/.test(argument));
const tournamentCount = tournamentCountArgument ? Number(tournamentCountArgument.split("=")[1]) : 50;
const printFullReport = process.argv.includes("--json");
const profilesOnly = process.argv.includes("--profiles-only");
const targetedMatchArgument = process.argv.find((argument) => /^--targeted-matches=\d+$/.test(argument));
const targetedMatchCount = targetedMatchArgument ? Number(targetedMatchArgument.split("=")[1]) : 0;

if (tournamentCount > 50) throw new Error("Validation is capped at 50 complete tournaments.");
if (targetedMatchCount > 20) throw new Error("Targeted validation is capped at 20 single matches.");

function mockElement() {
  return {
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    checked: false,
    dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    setAttribute() {},
    querySelectorAll() { return []; },
    querySelector() { return mockElement(); },
    appendChild() {},
    insertAdjacentHTML() {},
    remove() {},
    scrollIntoView() {},
    showModal() {},
  };
}

const context = { console };
vm.createContext(context);
const elements = new Map();
context.document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, mockElement());
    return elements.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return mockElement(); },
  addEventListener() {},
  body: mockElement(),
  documentElement: mockElement(),
  activeElement: { tagName: "BODY" },
  fullscreenElement: null,
};
context.window = { addEventListener() {}, scrollTo() {}, matchMedia() { return { matches: false }; } };
context.localStorage = { getItem() { return null; }, setItem() {} };
context.requestAnimationFrame = () => 1;
context.cancelAnimationFrame = () => {};
context.setTimeout = () => 1;
context.clearTimeout = () => {};

const sources = [
  "player-pools.generated.js",
  "data.js",
  "simulation-engine.js",
  "app.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__runBalanceReport = function runBalanceReport(tournamentCount) {
  const report = {
    tournamentCount,
    championRankDistribution: {},
    championRatingDistribution: {},
    finalistRanks: [],
    semiFinalistRanks: [],
    quarterFinalistRanks: [],
    outsideTop20Champions: 0,
    outsideTop32Champions: 0,
    outsideTop50SemiFinalists: 0,
    outsideTop75Finalists: 0,
    nonFifaQuarterFinalists: 0,
    nonFifaSemiFinalists: 0,
    nonFifaFinalists: 0,
    averageGoalsPerMatch: 0,
    averageRedCardsPerMatch: 0,
    extraTimeRate: 0,
    penaltyShootoutRate: 0,
    upsetRateByRound: Array(8).fill(0),
    topScorerGoalTotals: [],
    topScorerTeamRanks: [],
    topScorerPositions: {},
    topScorerPlayerRatings: [],
    goldenBootWinners: [],
  };
  const totals = {
    matches: 0,
    goals: 0,
    redCards: 0,
    extraTime: 0,
    shootouts: 0,
    matchesByRound: Array(8).fill(0),
    upsetsByRound: Array(8).fill(0),
    top20Champions: 0,
    top32Champions: 0,
    finalWithTop10: 0,
    tournamentsWithOutsideTop50SemiFinalist: 0,
    tournamentsWithOutsideTop75Finalist: 0,
    tournamentsWithNonFifaQuarterFinalist: 0,
    tournamentsWithNonFifaSemiFinalist: 0,
    tournamentsWithNonFifaFinalist: 0,
    topScorerTenPlus: 0,
    topScorerForwardOrWinger: 0,
    defenderGoldenBoots: 0,
    earlyExitGoldenBoots: 0,
    sevenPlusWinnerBelow80: 0,
    elitePlayerSamples: {
      "Erling Haaland": { goals: 0, tournaments: 0 },
      "Kylian Mbappé": { goals: 0, tournaments: 0 },
      "Lamine Yamal": { goals: 0, tournaments: 0 },
    },
  };
  const suspicious = [];
  const rankBucket = (rank) => !rank ? "non-FIFA" : rank <= 10 ? "1-10" : rank <= 20 ? "11-20" : rank <= 32 ? "21-32" : rank <= 50 ? "33-50" : rank <= 75 ? "51-75" : rank <= 100 ? "76-100" : "101+";
  const ratingBucket = (rating) => rating >= 90 ? "90+" : rating >= 80 ? "80-89" : rating >= 70 ? "70-79" : rating >= 55 ? "55-69" : rating >= 35 ? "35-54" : "below-35";

  for (let tournamentIndex = 0; tournamentIndex < tournamentCount; tournamentIndex += 1) {
    const drawSeed = 730_000 + tournamentIndex * 7_919;
    state.drawSeed = drawSeed;
    state.settings = { ...defaultSettings, upset: "balanced", goals: "normal", spoiler: false, realNames: true };
    state.rounds = [createFirstRound(drawSeed)];
    const teamGoals = new Map();
    const teamRoundReached = new Map();

    for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        teamRoundReached.set(match.homeId, roundIndex);
        teamRoundReached.set(match.awayId, roundIndex);
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
        totals.matches += 1;
        totals.matchesByRound[roundIndex] += 1;
        totals.goals += match.result.homeGoals + match.result.awayGoals;
        totals.redCards += (match.result.redCards || []).length;
        totals.extraTime += Number(match.result.extraTime);
        totals.shootouts += Number(Boolean(match.result.penalties));
        teamGoals.set(match.homeId, (teamGoals.get(match.homeId) || 0) + match.result.homeGoals);
        teamGoals.set(match.awayId, (teamGoals.get(match.awayId) || 0) + match.result.awayGoals);
        const winner = teamById(match.result.winnerId);
        const loser = match.result.winnerId === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
        if (winner.strength + 0.01 < loser.strength) totals.upsetsByRound[roundIndex] += 1;
      });
      if (roundIndex < 7) buildNextRound(roundIndex);
    }

    const quarterFinalists = state.rounds[5].flatMap((match) => [teamById(match.homeId), teamById(match.awayId)]);
    const semiFinalists = state.rounds[6].flatMap((match) => [teamById(match.homeId), teamById(match.awayId)]);
    const finalists = state.rounds[7].flatMap((match) => [teamById(match.homeId), teamById(match.awayId)]);
    const champion = teamById(state.rounds[7][0].result.winnerId);
    report.quarterFinalistRanks.push(...quarterFinalists.map((team) => team.fifaRank || 999));
    report.semiFinalistRanks.push(...semiFinalists.map((team) => team.fifaRank || 999));
    report.finalistRanks.push(...finalists.map((team) => team.fifaRank || 999));
    report.nonFifaQuarterFinalists += quarterFinalists.filter((team) => !team.fifaRank).length;
    report.nonFifaSemiFinalists += semiFinalists.filter((team) => !team.fifaRank).length;
    report.nonFifaFinalists += finalists.filter((team) => !team.fifaRank).length;
    report.outsideTop50SemiFinalists += semiFinalists.filter((team) => !team.fifaRank || team.fifaRank > 50).length;
    report.outsideTop75Finalists += finalists.filter((team) => !team.fifaRank || team.fifaRank > 75).length;
    totals.tournamentsWithOutsideTop50SemiFinalist += Number(semiFinalists.some((team) => !team.fifaRank || team.fifaRank > 50));
    totals.tournamentsWithOutsideTop75Finalist += Number(finalists.some((team) => !team.fifaRank || team.fifaRank > 75));
    totals.tournamentsWithNonFifaQuarterFinalist += Number(quarterFinalists.some((team) => !team.fifaRank));
    totals.tournamentsWithNonFifaSemiFinalist += Number(semiFinalists.some((team) => !team.fifaRank));
    totals.tournamentsWithNonFifaFinalist += Number(finalists.some((team) => !team.fifaRank));
    totals.finalWithTop10 += Number(finalists.some((team) => team.fifaRank && team.fifaRank <= 10));
    totals.top20Champions += Number(champion.fifaRank && champion.fifaRank <= 20);
    totals.top32Champions += Number(champion.fifaRank && champion.fifaRank <= 32);
    report.outsideTop20Champions += Number(!champion.fifaRank || champion.fifaRank > 20);
    report.outsideTop32Champions += Number(!champion.fifaRank || champion.fifaRank > 32);
    const championRankBucket = rankBucket(champion.fifaRank);
    const championRatingBucket = ratingBucket(champion.rating);
    report.championRankDistribution[championRankBucket] = (report.championRankDistribution[championRankBucket] || 0) + 1;
    report.championRatingDistribution[championRatingBucket] = (report.championRatingDistribution[championRatingBucket] || 0) + 1;

    const scorerTable = calculateGoalscorerTable();
    const topScorer = scorerTable[0];
    if (topScorer) {
      const scorerTeam = teamById(topScorer.teamId);
      report.topScorerGoalTotals.push(topScorer.goals);
      report.topScorerTeamRanks.push(scorerTeam.fifaRank || 999);
      report.topScorerPlayerRatings.push(topScorer.playerOverall);
      report.topScorerPositions[topScorer.position] = (report.topScorerPositions[topScorer.position] || 0) + 1;
      totals.topScorerTenPlus += Number(topScorer.goals >= 10);
      totals.topScorerForwardOrWinger += Number(["ST", "CF", "SS", "LW", "RW", "LF", "RF"].includes(topScorer.position));
      totals.defenderGoldenBoots += Number(["CB", "LB", "RB", "LWB", "RWB"].includes(topScorer.position));
      totals.earlyExitGoldenBoots += Number((teamRoundReached.get(topScorer.teamId) || 0) < 4);
      totals.sevenPlusWinnerBelow80 += Number(topScorer.goals >= 7 && topScorer.playerOverall < 80);
      report.goldenBootWinners.push({
        player: topScorer.player,
        team: scorerTeam.name,
        goals: topScorer.goals,
        penalties: topScorer.penalties,
        appearances: topScorer.matches,
        overall: topScorer.playerOverall,
        finishing: topScorer.finishing,
        teamGoals: teamGoals.get(topScorer.teamId) || 0,
        goalShare: Number((topScorer.goals / Math.max(1, teamGoals.get(topScorer.teamId) || 0)).toFixed(3)),
      });
    }

    const elitePlayers = [
      ["Erling Haaland", "Norway"],
      ["Kylian Mbappé", "France"],
      ["Lamine Yamal", "Spain"],
    ];
    elitePlayers.forEach(([playerName, teamName]) => {
      const team = TEAMS.find((candidate) => candidate.name === teamName);
      const matchesPlayed = (teamRoundReached.get(team.id) ?? -1) + 1;
      if (matchesPlayed < 4) return;
      const entry = scorerTable.find((candidate) => candidate.teamId === team.id && candidate.player === playerName);
      totals.elitePlayerSamples[playerName].goals += entry?.goals || 0;
      totals.elitePlayerSamples[playerName].tournaments += 1;
    });

    scorerTable.forEach((entry) => {
      const scorerTeam = teamById(entry.teamId);
      const profile = playerProfilesForTeam(scorerTeam).find((candidate) => candidate.name === entry.player);
      const reached = teamRoundReached.get(entry.teamId) || 0;
      const scorerShare = entry.goals / Math.max(1, teamGoals.get(entry.teamId) || 0);
      const reasons = [];
      if (entry.goals >= 7 && entry.playerOverall < 80) reasons.push("7+ goals below 80 overall");
      if (scorerShare > 0.55) reasons.push("over 55% of team goals");
      if (entry.matches >= 4 && entry.goals / entry.matches > 1 && entry.playerOverall < 82) {
        reasons.push("over 1.0 goals per appearance below 82 overall");
      }
      if (entry.goals >= 6 && ["CB", "LB", "RB", "LWB", "RWB"].includes(entry.position)) reasons.push("6+ defender goals");
      if (entry.goals >= 5 && ["CDM", "DM"].includes(entry.position)) reasons.push("5+ defensive-midfielder goals");
      if (entry.goals >= 8 && reached < 5) reasons.push("8+ goals before quarter-final");
      if (profile?.generated && entry.goals >= 5 && scorerShare > 0.7) reasons.push("generated scorer share above 70%");
      if (entry.goals > (teamGoals.get(entry.teamId) || 0)) reasons.push("player goals exceed team goals");
      if (entry.goals > 0 && (!entry.matches || !entry.minutes)) reasons.push("goals without appearances/minutes");
      if (reasons.length) suspicious.push({
        playerName: entry.player,
        teamName: scorerTeam.name,
        goals: entry.goals,
        penalties: entry.penalties,
        matches: entry.matches,
        minutes: entry.minutes,
        position: entry.position,
        playerOverall: entry.playerOverall,
        finishing: entry.finishing,
        attackingRole: entry.attackingRole,
        scorerWeight: Number(entry.scorerWeight.toFixed(5)),
        teamRating: scorerTeam.rating,
        teamRank: scorerTeam.fifaRank,
        teamRoundReached: ROUND_NAMES[reached],
        scorerShare: Number(scorerShare.toFixed(3)),
        reasons,
      });
    });
  }

  report.averageGoalsPerMatch = totals.goals / totals.matches;
  report.averageRedCardsPerMatch = totals.redCards / totals.matches;
  report.extraTimeRate = totals.extraTime / totals.matches;
  report.penaltyShootoutRate = totals.shootouts / totals.matches;
  report.upsetRateByRound = totals.upsetsByRound.map((count, index) => count / totals.matchesByRound[index]);
  report.suspiciousGoldenBootPerformances = suspicious
    .sort((a, b) => b.goals - a.goals || b.scorerShare - a.scorerShare || a.playerOverall - b.playerOverall)
    .slice(0, 20);
  report.top15GoldenBootWinners = report.goldenBootWinners
    .sort((a, b) => b.goals - a.goals || a.overall - b.overall || a.player.localeCompare(b.player))
    .slice(0, 15);
  report.eliteAveragesWhenTeamPlayedFourPlus = Object.fromEntries(
    Object.entries(totals.elitePlayerSamples).map(([player, sample]) => [player, {
      averageGoals: sample.tournaments ? sample.goals / sample.tournaments : null,
      qualifyingTournaments: sample.tournaments,
    }]),
  );
  report.summary = {
    top20ChampionRate: totals.top20Champions / tournamentCount,
    top32ChampionRate: totals.top32Champions / tournamentCount,
    finalWithTop10Rate: totals.finalWithTop10 / tournamentCount,
    averageOutsideTop32QuarterFinalists: report.quarterFinalistRanks.filter((rank) => rank > 32).length / tournamentCount,
    tournamentWithOutsideTop50SemiFinalistRate: totals.tournamentsWithOutsideTop50SemiFinalist / tournamentCount,
    tournamentWithOutsideTop75FinalistRate: totals.tournamentsWithOutsideTop75Finalist / tournamentCount,
    tournamentWithNonFifaQuarterFinalistRate: totals.tournamentsWithNonFifaQuarterFinalist / tournamentCount,
    tournamentWithNonFifaSemiFinalistRate: totals.tournamentsWithNonFifaSemiFinalist / tournamentCount,
    tournamentWithNonFifaFinalistRate: totals.tournamentsWithNonFifaFinalist / tournamentCount,
    averageTopScorerGoals: report.topScorerGoalTotals.reduce((sum, goals) => sum + goals, 0) / tournamentCount,
    topScorerTenPlusRate: totals.topScorerTenPlus / tournamentCount,
    topScorerForwardOrWingerRate: totals.topScorerForwardOrWinger / tournamentCount,
    defenderGoldenBootRate: totals.defenderGoldenBoots / tournamentCount,
    earlyExitGoldenBootRate: totals.earlyExitGoldenBoots / tournamentCount,
    sevenPlusGoldenBootWinnersBelow80: totals.sevenPlusWinnerBelow80,
    tenPlusGoldenBootWinners: totals.topScorerTenPlus,
  };
  return report;
};`, context);

if (profilesOnly) {
  const profiles = vm.runInContext(`(() => {
    state.settings = { ...defaultSettings, realNames: true };
    const requested = [
      ["Erling Haaland", "Norway"],
      ["Kylian Mbappé", "France"],
      ["Lamine Yamal", "Spain"],
      ["Mitchell Duke", "Australia"],
      ["Ali Alipour", "Iran"],
    ];
    const inspect = (playerName, teamName, generated = false) => {
      const team = teamById(TEAMS.find((candidate) => candidate.name === teamName).id);
      const squad = generated
        ? buildPlayerProfiles(team, generatedPlayers(team), true)
        : playerProfilesForTeam(team);
      const profile = generated ? squad[0] : squad.find((candidate) => candidate.name === playerName);
      const weights = squad.map((candidate) => calculateScorerWeight(candidate, team, squad));
      const weight = calculateScorerWeight(profile, team, squad);
      return {
        player: profile.name,
        team: team.name,
        overall: profile.overall,
        finishing: profile.finishing,
        role: profile.attackingRole,
        position: profile.position,
        minutesShare: profile.expectedMinutesShare,
        penaltyTaker: profile.penaltyTaker,
        baseScorerWeight: weight,
        normalisedGoalShare: weight / weights.reduce((sum, candidateWeight) => sum + candidateWeight, 0),
        generated: profile.generated,
      };
    };
    return [
      ...requested.map(([playerName, teamName]) => inspect(playerName, teamName)),
      inspect(null, "Sealand", true),
    ];
  })()`, context);
  console.log(JSON.stringify(profiles, null, 2));
  process.exit(0);
}

if (targetedMatchCount) {
  const targeted = vm.runInContext(`((matchCount) => {
    state.settings = { ...defaultSettings, upset: "balanced", goals: "normal", realNames: true };
    const cases = [
      ["Norway", "Erling Haaland"],
      ["France", "Kylian Mbappé"],
      ["Spain", "Lamine Yamal"],
    ];
    const weakTeam = TEAMS.find((team) => team.name === "Sealand");
    const matches = [];
    for (let index = 0; index < matchCount; index += 1) {
      const [teamName, playerName] = cases[index % cases.length];
      const eliteTeam = TEAMS.find((team) => team.name === teamName);
      state.drawSeed = 880000 + index * 7919;
      state.rounds = [[]];
      state.activeRound = 0;
      const result = simulateMatch({
        id: \`targeted-elite-weak-\${index}\`,
        homeId: eliteTeam.id,
        awayId: weakTeam.id,
      }, 0);
      matches.push({
        match: index + 1,
        team: teamName,
        opponent: weakTeam.name,
        score: \`\${result.homeGoals}-\${result.awayGoals}\`,
        player: playerName,
        playerGoals: result.homeEvents.filter((event) => event.scorer === playerName).length,
        teamGoals: result.homeGoals,
      });
    }
    const totals = Object.fromEntries(cases.map(([teamName, playerName]) => {
      const samples = matches.filter((match) => match.player === playerName);
      return [playerName, {
        team: teamName,
        matches: samples.length,
        goals: samples.reduce((sum, match) => sum + match.playerGoals, 0),
        teamGoals: samples.reduce((sum, match) => sum + match.teamGoals, 0),
      }];
    }));
    return { matchCount, matches, totals };
  })(${targetedMatchCount})`, context);
  console.log(JSON.stringify(targeted, null, 2));
  process.exit(0);
}

const startedAt = Date.now();
const report = context.__runBalanceReport(tournamentCount);
const elapsedSeconds = (Date.now() - startedAt) / 1000;

if (printFullReport) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(JSON.stringify({
    tournamentCount: report.tournamentCount,
    elapsedSeconds,
    championRankDistribution: report.championRankDistribution,
    championRatingDistribution: report.championRatingDistribution,
    averageGoalsPerMatch: report.averageGoalsPerMatch,
    averageRedCardsPerMatch: report.averageRedCardsPerMatch,
    extraTimeRate: report.extraTimeRate,
    penaltyShootoutRate: report.penaltyShootoutRate,
    upsetRateByRound: report.upsetRateByRound,
    topScorerPositions: report.topScorerPositions,
    summary: report.summary,
    top15GoldenBootWinners: report.top15GoldenBootWinners,
    eliteAveragesWhenTeamPlayedFourPlus: report.eliteAveragesWhenTeamPlayedFourPlus,
    suspiciousGoldenBootPerformances: report.suspiciousGoldenBootPerformances,
  }, null, 2));
}
