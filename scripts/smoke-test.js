const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const playerPoolSource = fs.readFileSync(path.join(root, "player-pools.generated.js"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "data.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const context = { console };
vm.createContext(context);
vm.runInContext(
  `${playerPoolSource}\n${dataSource}\n;globalThis.__teams = TEAMS; globalThis.__rounds = ROUND_NAMES;`,
  context,
);

const teams = context.__teams;
assert.equal(teams.length, 256, "The tournament must contain exactly 256 teams.");
assert.equal(teams.filter((team) => team.confed !== "INVITED").length, 211);
assert.equal(teams.filter((team) => team.confed === "INVITED").length, 45);
assert.equal(new Set(teams.map((team) => team.id)).size, 256, "Team IDs must be unique.");
assert.equal(new Set(teams.map((team) => team.name)).size, 256, "Team names must be unique.");
assert.equal(
  teams.map((team) => team.seed).join(","),
  Array.from({ length: 256 }, (_, index) => index + 1).join(","),
);
assert.equal(context.__rounds.length, 8);
assert.ok(
  teams.filter((team) => team.confed !== "INVITED").every((team) => team.players?.length >= 4),
  "Every established national team must have a recent real-player pool.",
);
const chilePlayers = teams.find((team) => team.name === "Chile").players;
assert.ok(chilePlayers.includes("Darío Osorio") && chilePlayers.includes("Lucas Cepeda"));
assert.ok(!chilePlayers.some((player) => /Smith|Williams|García/.test(player)));
const englandPlayers = teams.find((team) => team.name === "England").players;
assert.deepEqual(
  Array.from(englandPlayers),
  ["Bukayo Saka", "Cole Palmer", "Phil Foden", "Jude Bellingham", "Liam Delap", "Harry Kane", "Max Dowman", "Ethan Nwaneri", "Noni Madueke", "Rio Ngumoha", "Kobbie Mainoo"],
);
assert.ok(!englandPlayers.some((player) => ["Ivan Toney", "Ollie Watkins", "Marcus Rashford"].includes(player)));
assert.equal(englandPlayers.indexOf("Harry Kane"), 5, "Kane should remain a backup rather than England's primary scorer.");
const moroccoPlayers = teams.find((team) => team.name === "Morocco").players;
assert.ok(["Bilal El Khannouss", "Eliesse Ben Seghir", "Amine Adli"].every((player) => moroccoPlayers.includes(player)));
assert.equal(moroccoPlayers[1], "Ismael Saibari");
assert.ok(!moroccoPlayers.some((player) => ["Ayoub El Kaabi", "Youssef En-Nesyri"].includes(player)));
const austriaPlayers = teams.find((team) => team.name === "Austria").players;
const switzerlandPlayers = teams.find((team) => team.name === "Switzerland").players;
const brazilPlayers = teams.find((team) => team.name === "Brazil").players;
assert.ok(brazilPlayers.includes("Neymar"), "Brazil should list Neymar without a retirement suffix.");
assert.ok(!teams.flatMap((team) => team.players).some((player) => /\(RET\)|RET$/.test(player)));
assert.ok(!austriaPlayers.some((player) => player.includes("Arnautović") || player.includes("RET")));
assert.ok(austriaPlayers.includes("Christoph Baumgartner"));
assert.ok(switzerlandPlayers.includes("Johan Manzambi"));
assert.equal(teams.find((team) => team.name === "Kiribati").nameCulture, "micronesian");
const greecePlayers = teams.find((team) => team.name === "Greece").players;
assert.equal(greecePlayers.at(-1), "Georgios Masouras", "Masouras should remain a low-priority Greece scorer.");
assert.equal(greecePlayers[0], "Christos Tzolis", "Greece's leading scorer weight should belong to Tzolis.");

const htmlIds = new Set([...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const duplicateIds = [...htmlSource.matchAll(/\bid="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id, index, all) => all.indexOf(id) !== index);
assert.deepEqual(duplicateIds, [], "HTML IDs must be unique.");

const staticSelectors = [...appSource.matchAll(/\$\("#([^"]+)"\)/g)]
  .map((match) => match[1].split(/[\s>+~.:[#]/)[0]);
const missingSelectors = staticSelectors.filter((id) => !htmlIds.has(id));
assert.deepEqual(missingSelectors, [], `Missing HTML IDs: ${missingSelectors.join(", ")}`);

function mockElement() {
  return {
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    checked: false,
    dataset: {},
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; },
    },
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

const elementCache = new Map();
context.document = {
  querySelector(selector) {
    if (!elementCache.has(selector)) elementCache.set(selector, mockElement());
    return elementCache.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return mockElement(); },
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
};
context.localStorage = {
  getItem() { return null; },
  setItem() {},
};
context.requestAnimationFrame = () => 1;
context.cancelAnimationFrame = () => {};
context.setTimeout = () => 1;
context.clearTimeout = () => {};

vm.runInContext(
  `${appSource}
  ;globalThis.__simulateMatch = simulateMatch;
  globalThis.__weightedScorer = weightedScorer;
  globalThis.__scoringRunBrake = scoringRunBrake;
  globalThis.__suspendedPlayersForTeam = suspendedPlayersForTeam;
  globalThis.__applyScorelineCeiling = applyScorelineCeiling;
  globalThis.__renderChampionConfetti = renderChampionConfetti;
  globalThis.__fixtureScoreMarkup = fixtureScoreMarkup;
  globalThis.__preferredPenaltyFoot = preferredPenaltyFoot;
  globalThis.__calculateTopGoalscorer = calculateTopGoalscorer;
  globalThis.__roundHistoryTargets = roundHistoryTargets;
  globalThis.__teamJourneyMatches = teamJourneyMatches;
  globalThis.__runtimeTeams = TEAMS;
  globalThis.__runtimeState = state;
  globalThis.__simulateTournament = (drawSeed) => {
    state.drawSeed = drawSeed;
    state.settings = { ...defaultSettings, upset: "balanced", spoiler: false };
    state.rounds = [createFirstRound(drawSeed)];
    for (let roundIndex = 0; roundIndex < 7; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
      });
      buildNextRound(roundIndex);
    }
    const lastEight = state.rounds[5].flatMap((match) => [match.homeId, match.awayId]);
    const final = state.rounds[7][0];
    return {
      lastEight,
      finalists: [final.homeId, final.awayId],
    };
  };
  globalThis.__exerciseSpeedMemory = () => {
    preferredMatchSpeed = 1;
    livePlayback = { speed: 1, phase: "match" };
    cycleLiveSpeed();
    const remembered = preferredMatchSpeed;
    livePlayback = { speed: 1, phase: "shootout", shootout: [], shootoutIndex: 0, shootoutStep: "setup", penaltyHomeScore: 0, penaltyAwayScore: 0 };
    cycleLiveSpeed();
    const shootoutSpeed = livePlayback.speed;
    const preferenceAfterShootout = preferredMatchSpeed;
    livePlayback = null;
    return { remembered, shootoutSpeed, preferenceAfterShootout };
  };
  globalThis.__exercisePause = () => {
    livePlayback = {
      ending: false,
      paused: false,
      frame: 1,
      lastTimestamp: 24,
    };
    toggleLivePause();
    const paused = livePlayback.paused && livePlayback.frame === null;
    toggleLivePause();
    const resumed = !livePlayback.paused && livePlayback.lastTimestamp === 0;
    livePlayback = null;
    return { paused, resumed };
  };`,
  context,
);

assert.equal(
  context.__fixtureScoreMarkup(
    { homeGoals: 1, awayGoals: 1, penalties: { home: 4, away: 2 } },
    "home",
    true,
  ),
  "1<small>(4)</small>",
  "Shootout scores must appear in brackets beside the tied match score.",
);

const franceForFootCheck = context.__runtimeTeams.find((team) => team.name === "France");
const spainForFootCheck = context.__runtimeTeams.find((team) => team.name === "Spain");
const englandForFootCheck = context.__runtimeTeams.find((team) => team.name === "England");
const moroccoForFootCheck = context.__runtimeTeams.find((team) => team.name === "Morocco");
const netherlandsForFootCheck = context.__runtimeTeams.find((team) => team.name === "Netherlands");
assert.equal(context.__preferredPenaltyFoot(franceForFootCheck, "Michael Olise", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(franceForFootCheck, "Kylian Mbappé", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(spainForFootCheck, "Lamine Yamal", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(spainForFootCheck, "Nico Williams", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Cole Palmer", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Ethan Nwaneri", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Max Dowman", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Rio Ngumoha", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Liam Delap", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Kobbie Mainoo", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Amine Adli", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Bilal El Khannouss", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Brahim Díaz", () => 0.1), "left");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Brahim Díaz", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Micky van de Ven", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Xavi Simons", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Ryan Gravenberch", () => 0.9), "right");
assert.equal(netherlandsForFootCheck.players[0], "Xavi Simons", "Xavi Simons should lead the Netherlands scorer weighting.");
assert.equal(netherlandsForFootCheck.players.at(-1), "Micky van de Ven", "Van de Ven should stay low in scorer weighting as a defender.");
assert.ok(!netherlandsForFootCheck.players.includes("Wout Weghorst"));
assert.ok(!netherlandsForFootCheck.players.includes("Marten de Roon"));
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__exerciseSpeedMemory())),
  { remembered: 2, shootoutSpeed: 2, preferenceAfterShootout: 2 },
  "Shootouts should start at 1x, remain adjustable, and not overwrite the saved match speed.",
);

const runtimeTeams = context.__runtimeTeams;
const iranPlayers = runtimeTeams.find((team) => team.name === "Iran").players;
const turkeyPlayers = runtimeTeams.find((team) => team.name === "Türkiye").players;
const uruguayPlayers = runtimeTeams.find((team) => team.name === "Uruguay").players;
const ivoryCoastPlayers = runtimeTeams.find((team) => team.name === "Ivory Coast").players;
const usaPlayers = runtimeTeams.find((team) => team.name === "USA").players;
const italyPlayers = runtimeTeams.find((team) => team.name === "Italy").players;
const japanPlayers = runtimeTeams.find((team) => team.name === "Japan").players;
const scorerSampleRandom = (() => {
  let seed = 246813579;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
})();
const sampleScorers = (team, count = 5000) => Array.from(
  { length: count },
  () => context.__weightedScorer(team, scorerSampleRandom),
);
const croatiaScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Croatia"));
const netherlandsScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Netherlands"));
const denmarkScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Denmark"));
const colombiaScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Colombia"));
const spainScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Spain"));
const englandScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "England"));
const moroccoScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Morocco"));
const countScorer = (sample, player) => sample.filter((name) => name === player).length;
const croatiaDefenderShare = croatiaScorerSample.filter((name) => ["Joško Gvardiol", "Luka Vušković"].includes(name)).length
  / croatiaScorerSample.length;
assert.ok(croatiaDefenderShare > 0.18 && croatiaDefenderShare < 0.36, "Deeper Croatia players should receive a meaningful but controlled share of goals.");
assert.ok(countScorer(croatiaScorerSample, "Luka Vušković") > 0, "Luka Vušković must be capable of scoring.");
assert.ok(countScorer(netherlandsScorerSample, "Micky van de Ven") > 0, "Micky van de Ven must be capable of scoring.");
assert.ok(countScorer(croatiaScorerSample, "Bruno Durdov") > countScorer(croatiaScorerSample, "Luka Vušković"));
assert.ok(countScorer(netherlandsScorerSample, "Xavi Simons") > countScorer(netherlandsScorerSample, "Micky van de Ven"));
assert.ok(countScorer(denmarkScorerSample, "Christian Eriksen") > countScorer(denmarkScorerSample, "Rasmus Højlund"));
assert.ok(countScorer(colombiaScorerSample, "Luis Díaz") > countScorer(colombiaScorerSample, "Jhon Córdoba") * 2);
assert.ok(countScorer(spainScorerSample, "Lamine Yamal") > countScorer(spainScorerSample, "Nico Williams") * 2);
assert.ok(countScorer(englandScorerSample, "Bukayo Saka") / englandScorerSample.length < 0.4);
assert.ok(countScorer(moroccoScorerSample, "Ismael Saibari") > countScorer(moroccoScorerSample, "Eliesse Ben Seghir"));
assert.ok(!iranPlayers.includes("Mehdi Taremi"));
assert.equal(turkeyPlayers[0], "Arda Güler");
assert.equal(turkeyPlayers[1], "Kenan Yıldız");
assert.equal(turkeyPlayers.at(-1), "Deniz Gül");
assert.deepEqual(
  JSON.parse(JSON.stringify(uruguayPlayers)),
  ["Darwin Núñez", "Federico Valverde", "Facundo Pellistri", "Maxi Araújo", "Manuel Ugarte"],
);
assert.ok(!uruguayPlayers.includes("Federico Viñas"));
assert.deepEqual(
  JSON.parse(JSON.stringify(ivoryCoastPlayers.slice(0, 3))),
  ["Yan Diomande", "Amad Diallo", "Karim Konaté"],
);
assert.equal(usaPlayers[0], "Christian Pulisic");
assert.equal(usaPlayers[1], "Cavan Sullivan");
assert.equal(usaPlayers.at(-1), "Ricardo Pepi");
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "USA"), "Cavan Sullivan", () => 0.9), "left");
assert.equal(italyPlayers.at(-1), "Alessio Cacciamani");
assert.equal(japanPlayers[0], "Takefusa Kubo");
assert.equal(japanPlayers.at(-1), "Shūto Machino");
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "Japan"), "Takefusa Kubo", () => 0.9), "left");
assert.equal(context.__scoringRunBrake(7), 0.55);
assert.equal(context.__scoringRunBrake(10), 0, "A player must stop receiving goals after reaching ten in one tournament.");
assert.doesNotThrow(() => context.__renderChampionConfetti("team-1"), "Champion confetti must render without crashing the winner screen.");
const portugalPlayers = runtimeTeams.find((team) => team.name === "Portugal").players;
assert.ok(portugalPlayers.includes("Carlos Forbs"));
assert.ok(!portugalPlayers.includes("Gonçalo Guedes"));
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "Portugal"), "Carlos Forbs", () => 0.9), "left");
const belgiumPlayers = runtimeTeams.find((team) => team.name === "Belgium").players;
assert.equal(belgiumPlayers[0], "Jérémy Doku");
assert.equal(belgiumPlayers.at(-1), "Romelu Lukaku");
assert.equal(runtimeTeams.find((team) => team.name === "England").players[0], "Bukayo Saka");
assert.equal(runtimeTeams.find((team) => team.name === "Switzerland").players[2], "Breel Embolo");
const spainPlayers = runtimeTeams.find((team) => team.name === "Spain").players;
assert.equal(spainPlayers[0], "Lamine Yamal");
assert.equal(spainPlayers[2], "Samu Aghehowa");
assert.ok(!spainPlayers.includes("Borja Iglesias"));
const argentinaPlayers = runtimeTeams.find((team) => team.name === "Argentina").players;
const francePlayers = runtimeTeams.find((team) => team.name === "France").players;
const norwayPlayers = runtimeTeams.find((team) => team.name === "Norway").players;
const croatiaPlayers = runtimeTeams.find((team) => team.name === "Croatia").players;
assert.equal(argentinaPlayers[0], "Julián Alvarez");
assert.equal(argentinaPlayers[1], "Lautaro Martínez");
assert.equal(argentinaPlayers[2], "Lionel Messi");
assert.equal(argentinaPlayers.at(-1), "José Manuel López");
assert.equal(francePlayers[0], "Kylian Mbappé");
assert.equal(francePlayers.at(-1), "Marcus Thuram");
assert.equal(norwayPlayers[0], "Erling Haaland");
assert.deepEqual(
  JSON.parse(JSON.stringify(croatiaPlayers)),
  ["Bruno Durdov", "Luka Sučić", "Martin Baturina", "Petar Sučić", "Joško Gvardiol", "Luka Vušković"],
);
assert.equal(runtimeTeams.find((team) => team.name === "Uzbekistan").players.at(-1), "Eldor Shomurodov");
assert.equal(runtimeTeams.find((team) => team.name === "Costa Rica").players.at(-1), "Manfred Ugalde");
assert.equal(runtimeTeams.find((team) => team.name === "Thailand").players.at(-1), "Jehhanafee Mamah");
assert.equal(runtimeTeams.find((team) => team.name === "Honduras").players.at(-1), "Jorge Benguché");
const fifaTeams = runtimeTeams.filter((team) => team.confed !== "INVITED");
const guestTeams = runtimeTeams.filter((team) => team.confed === "INVITED");
assert.equal(fifaTeams.filter((team) => team.fifaRank).length, 211, "Every FIFA member needs a FIFA rank.");
assert.ok(fifaTeams.every((team) => team.rating >= 35 && team.rating <= 100));
assert.ok(guestTeams.every((team) => team.rating >= 18 && team.rating <= 34));
assert.equal(runtimeTeams.find((team) => team.name === "Argentina").rating, 90);
assert.equal(runtimeTeams.findIndex((team) => team.name === "Argentina") + 1, 8);
assert.equal(runtimeTeams.find((team) => team.name === "Germany").rating, 89);
assert.equal(runtimeTeams.find((team) => team.name === "Mexico").rating, 85);
assert.equal(runtimeTeams.find((team) => team.name === "Norway").rating, 88);
assert.equal(runtimeTeams.find((team) => team.name === "Iran").rating, 80);
assert.equal(runtimeTeams.find((team) => team.name === "Denmark").rating, 81);
assert.equal(runtimeTeams.find((team) => team.name === "Ecuador").rating, 81);
assert.ok(runtimeTeams.find((team) => team.name === "Argentina").rating < runtimeTeams.find((team) => team.name === "France").rating);
assert.ok(runtimeTeams.find((team) => team.name === "France").rating > runtimeTeams.find((team) => team.name === "Peru").rating);
assert.ok(runtimeTeams.find((team) => team.name === "Peru").rating > runtimeTeams.find((team) => team.name === "Sri Lanka").rating);
const england = runtimeTeams.find((team) => team.name === "England");
const sealand = runtimeTeams.find((team) => team.name === "Sealand");
const moldova = runtimeTeams.find((team) => team.name === "Moldova");
const israel = runtimeTeams.find((team) => team.name === "Israel");
const italy = runtimeTeams.find((team) => team.name === "Italy");
const ireland = runtimeTeams.find((team) => team.name === "Republic of Ireland");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__applyScorelineCeiling(ireland, italy, 0, 8))),
  { homeGoals: 0, awayGoals: 5 },
  "Established countries must be protected from implausible eight-goal defeats.",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__applyScorelineCeiling(sealand, italy, 0, 8))),
  { homeGoals: 0, awayGoals: 8 },
  "Huge scorelines should remain possible against guest and micronation teams.",
);
const roundsBeforeSuspensionCheck = context.__runtimeState.rounds;
context.__runtimeState.rounds = [[{
  homeId: england.id,
  awayId: sealand.id,
  result: {
    winnerId: england.id,
    redCards: [{ teamId: england.id, side: "home", player: "Cole Palmer", minute: 71 }],
  },
}]];
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__suspendedPlayersForTeam(england.id, 1))),
  ["Cole Palmer"],
  "A player sent off must be suspended for their team's next match.",
);
context.__runtimeState.rounds = roundsBeforeSuspensionCheck;
const goldenBootProof = context.__calculateTopGoalscorer([
  [{
    homeId: england.id,
    awayId: sealand.id,
    result: {
      revealed: true,
      homeEvents: [{ scorer: "Bukayo Saka" }, { scorer: "Bukayo Saka" }],
      awayEvents: [{ scorer: "Alex Mercer" }],
    },
  }],
  [{
    homeId: sealand.id,
    awayId: england.id,
    result: {
      revealed: true,
      homeEvents: [],
      awayEvents: [{ scorer: "Bukayo Saka" }],
      shootout: [{ player: "Alex Mercer", scored: true }],
    },
  }],
]);
assert.deepEqual(
  { player: goldenBootProof.player, teamId: goldenBootProof.teamId, goals: goldenBootProof.goals },
  { player: "Bukayo Saka", teamId: england.id, goals: 3 },
  "The Golden Boot must count match goals across rounds and exclude shootout kicks.",
);
assert.ok(moldova.players.includes("Amenyah"), "Amenyah must be in Moldova's player pool.");
context.__runtimeState.settings.upset = "balanced";
context.__runtimeState.settings.goals = "normal";

for (let index = 0; index < 50; index += 1) {
  const israelAtHome = context.__simulateMatch({
    id: `israel-home-loss-proof-${index}`,
    homeId: israel.id,
    awayId: sealand.id,
  }, index % 8);
  assert.equal(israelAtHome.homeGoals, 0, "Israel must never score.");
  assert.ok(israelAtHome.awayGoals >= 4, "Israel must lose by at least four goals.");
  assert.equal(israelAtHome.winnerId, sealand.id);
  assert.equal(israelAtHome.homeEvents.length, 0);
  assert.equal(israelAtHome.awayEvents.length, israelAtHome.awayGoals);
  assert.equal(israelAtHome.extraTime, false);
  assert.equal(israelAtHome.penalties, null);

  const israelAway = context.__simulateMatch({
    id: `israel-away-loss-proof-${index}`,
    homeId: sealand.id,
    awayId: israel.id,
  }, index % 8);
  assert.equal(israelAway.awayGoals, 0, "Israel must never score away from home.");
  assert.ok(israelAway.homeGoals >= 4, "Israel must lose away by at least four goals.");
  assert.equal(israelAway.winnerId, sealand.id);
  assert.equal(israelAway.awayEvents.length, 0);
  assert.equal(israelAway.homeEvents.length, israelAway.homeGoals);
  assert.equal(israelAway.extraTime, false);
  assert.equal(israelAway.penalties, null);
}

let laterRoundWithoutAmenyahGoal = false;
for (let index = 0; index < 100; index += 1) {
  const openingResult = context.__simulateMatch({
    id: `amenyah-opening-proof-${index}`,
    homeId: moldova.id,
    awayId: england.id,
  }, 0);
  assert.ok(
    openingResult.homeEvents.some((goal) => goal.scorer === "Amenyah"),
    "Amenyah must score for Moldova in every Round of 256 simulation.",
  );

  const awayOpeningResult = context.__simulateMatch({
    id: `amenyah-away-opening-proof-${index}`,
    homeId: england.id,
    awayId: moldova.id,
  }, 0);
  assert.ok(
    awayOpeningResult.awayEvents.some((goal) => goal.scorer === "Amenyah"),
    "Amenyah's opening-round goal must work from either side of the fixture.",
  );

  const laterResult = context.__simulateMatch({
    id: `amenyah-later-round-proof-${index}`,
    homeId: moldova.id,
    awayId: england.id,
  }, 1);
  if (!laterResult.homeEvents.some((goal) => goal.scorer === "Amenyah")) {
    laterRoundWithoutAmenyahGoal = true;
  }
}
assert.ok(laterRoundWithoutAmenyahGoal, "Amenyah must not be guaranteed to score after the opening round.");

let sealandWins = 0;
let redCardMatches = 0;
let penaltyShootouts = 0;
let penaltyKicks = 0;
let scoredPenaltyKicks = 0;
for (let index = 0; index < 500; index += 1) {
  const result = context.__simulateMatch({
    id: `giant-killing-proof-${index}`,
    homeId: england.id,
    awayId: sealand.id,
  }, 0);
  assert.equal(result.homeEvents.length, result.homeGoals);
  assert.equal(result.awayEvents.length, result.awayGoals);
  for (const card of result.redCards) {
    const laterGoals = card.side === "home" ? result.homeEvents : result.awayEvents;
    assert.ok(
      !laterGoals.some((goal) => goal.minute > card.minute && goal.scorer === card.player),
      "A dismissed player cannot score later in the match.",
    );
  }
  if (result.winnerId === sealand.id) sealandWins += 1;
  if (result.redCards.length) redCardMatches += 1;
  if (result.penalties) {
    penaltyShootouts += 1;
    penaltyKicks += result.shootout.length;
    scoredPenaltyKicks += result.shootout.filter((kick) => kick.scored).length;
    assert.ok(result.shootout.length >= 10 && result.shootout.length % 2 === 0);
    assert.ok(result.shootout.every((kick, kickIndex) => (
      kick.side === (kickIndex % 2 === 0 ? "home" : "away")
      && ["left", "centre", "right"].includes(kick.direction)
      && ["left", "centre", "right"].includes(kick.keeperDive)
      && ["left", "right"].includes(kick.foot)
      && typeof kick.player === "string"
      && kick.player.length > 2
    )));
    assert.equal(result.shootout.filter((kick) => kick.side === "home" && kick.scored).length, result.penalties.home);
    assert.equal(result.shootout.filter((kick) => kick.side === "away" && kick.scored).length, result.penalties.away);
  }
}

assert.ok(sealandWins > 0, "Balanced mode must allow a minnow to eliminate England.");
assert.ok(sealandWins < 50, "Balanced mode must keep extreme upsets exceptional rather than routine.");
assert.ok(redCardMatches > 0, "The simulation must be capable of producing red cards.");
assert.ok(penaltyShootouts > 0, "The simulation must produce animated penalty sequences.");
assert.ok(scoredPenaltyKicks / penaltyKicks < 0.6, "World Cup shootouts should remain nervy, with fewer than 60% of kicks scored.");
let outsiderQuarterFinalists = 0;
let extremeQuarterFinalists = 0;
let eliteFinalists = 0;
const tournamentSamples = 100;
for (let seed = 1; seed <= tournamentSamples; seed += 1) {
  const sample = context.__simulateTournament(710000 + seed * 7919);
  sample.lastEight.forEach((teamId) => {
    const team = runtimeTeams.find((candidate) => candidate.id === teamId);
    if (!team.fifaRank || team.fifaRank > 32) outsiderQuarterFinalists += 1;
    if (!team.fifaRank || team.fifaRank > 100) extremeQuarterFinalists += 1;
  });
  sample.finalists.forEach((teamId) => {
    const team = runtimeTeams.find((candidate) => candidate.id === teamId);
    if (team.fifaRank && team.fifaRank <= 20) eliteFinalists += 1;
  });
}
const averageOutsiders = outsiderQuarterFinalists / tournamentSamples;
const averageExtremeOutsiders = extremeQuarterFinalists / tournamentSamples;
assert.ok(averageOutsiders >= 0.5 && averageOutsiders <= 2.5, "The last eight should usually contain one or two believable outsiders.");
assert.ok(averageExtremeOutsiders < 0.35, "Very weak sides must almost never reach the last eight.");
assert.ok(eliteFinalists / (tournamentSamples * 2) >= 0.65, "Finals should usually feature elite nations.");
context.__runtimeState.activeRound = 7;
context.__runtimeState.rounds[7][0].result = context.__simulateMatch(context.__runtimeState.rounds[7][0], 7);
context.__runtimeState.rounds[7][0].result.revealed = true;
const championJourney = context.__teamJourneyMatches(context.__runtimeState.rounds[7][0].result.winnerId);
assert.equal(championJourney.length, 8, "The champion filter should show one match from every round.");
assert.deepEqual(Array.from(championJourney, (entry) => entry.roundIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
const openingMatch = context.__runtimeState.rounds[0][0];
const openingLoserId = openingMatch.result.winnerId === openingMatch.homeId ? openingMatch.awayId : openingMatch.homeId;
assert.equal(context.__teamJourneyMatches(openingLoserId).length, 1, "An opening-round elimination should show only that team's single match.");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__roundHistoryTargets())),
  { older: 3, newer: null },
  "The completed bracket should link back to the Round of 32 archive.",
);
context.__runtimeState.activeRound = 3;
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__roundHistoryTargets())),
  { older: 2, newer: 7 },
  "Round of 32 history must allow both older results and a return to the bracket.",
);
context.__runtimeState.activeRound = 2;
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__roundHistoryTargets())),
  { older: 1, newer: 3 },
  "Archive navigation should continue in both directions through every round.",
);
const pauseCheck = context.__exercisePause();
assert.equal(pauseCheck.paused, true, "Pausing must stop the live simulation frame.");
assert.equal(pauseCheck.resumed, true, "Resuming must preserve the simulation position.");

console.log("World 256 smoke test passed.");
console.log("256 teams = 211 FIFA members + 45 guest sides.");
console.log(`Giant-killing proof: Sealand beat England ${sealandWins} times in 500 balanced simulations.`);
console.log(`Discipline proof: ${redCardMatches} of those simulations included a red card.`);
console.log(`Shootout proof: ${penaltyShootouts} included complete kick-by-kick penalty data.`);
console.log(`Balance proof: ${averageOutsiders.toFixed(2)} teams outside FIFA's top 32 reached each last eight on average.`);
console.log(`Final proof: ${Math.round(eliteFinalists / (tournamentSamples * 2) * 100)}% of finalists were FIFA top-20 teams.`);
