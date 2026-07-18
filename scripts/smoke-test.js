const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const playerPoolSource = fs.readFileSync(path.join(root, "player-pools.generated.js"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "data.js"), "utf8");
const simulationEngineSource = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
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
assert.ok(htmlIds.has("snapshotButton") && htmlIds.has("snapshotModal") && htmlIds.has("snapshotImage"));
assert.ok(appSource.includes("new ClipboardItem") && appSource.includes("navigator.share"));
assert.ok(appSource.includes('canvas.toBlob') && appSource.includes('link.download = snapshotFilename'));
assert.ok(/id="snapshotButton"[^>]*hidden/.test(htmlSource), "The snapshot control must start hidden until a match is complete.");
assert.ok(appSource.includes("els.snapshotButton.hidden = !revealed"), "Only revealed finished matches should expose snapshots.");
assert.ok(appSource.includes("drawSnapshotGoldenBoot") && appSource.includes("drawSnapshotConfetti"), "Champion snapshots must include the Golden Boot and confetti.");

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
const storage = new Map();
context.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
context.requestAnimationFrame = () => 1;
context.cancelAnimationFrame = () => {};
context.setTimeout = () => 1;
context.clearTimeout = () => {};

vm.runInContext(
  `${simulationEngineSource}\n${appSource}
  ;globalThis.__simulateMatch = simulateMatch;
  globalThis.__amenyahGoalGuaranteeSide = amenyahGoalGuaranteeSide;
  globalThis.__forceOpeningRoundIsraelLoss = forceOpeningRoundIsraelLoss;
  globalThis.__weightedScorer = weightedScorer;
  globalThis.__scoringRunBrake = scoringRunBrake;
  globalThis.__playerProfilesForTeam = playerProfilesForTeam;
  globalThis.__calculateScorerWeight = calculateScorerWeight;
  globalThis.__matchupScorerMultiplier = matchupScorerMultiplier;
  globalThis.__teamGoalShareMultiplier = teamGoalShareMultiplier;
  globalThis.__calculateExpectedGoals = calculateExpectedGoals;
  globalThis.__simulationConfig = SIMULATION_CONFIG;
  globalThis.__calculateTournamentFatigue = calculateTournamentFatigue;
  globalThis.__goalEvents = goalEvents;
  globalThis.__simulatePenaltyShootout = simulatePenaltyShootout;
  globalThis.__setPenaltySceneElement = setPenaltySceneElement;
  globalThis.__chooseGoalType = chooseGoalType;
  globalThis.__suspendedPlayersForTeam = suspendedPlayersForTeam;
  globalThis.__applyScorelineCeiling = applyScorelineCeiling;
  globalThis.__renderChampionConfetti = renderChampionConfetti;
  globalThis.__fixtureScoreMarkup = fixtureScoreMarkup;
  globalThis.__preferredPenaltyFoot = preferredPenaltyFoot;
  globalThis.__snapshotGoalLines = snapshotGoalLines;
  globalThis.__calculateGoalscorerTable = calculateGoalscorerTable;
  globalThis.__calculateTopGoalscorer = calculateTopGoalscorer;
  globalThis.__roundHistoryTargets = roundHistoryTargets;
  globalThis.__teamJourneyMatches = teamJourneyMatches;
  globalThis.__playbackEvents = playbackEvents;
  globalThis.__runtimeTeams = TEAMS;
  globalThis.__runtimeState = state;
  globalThis.__loadState = loadState;
  globalThis.__storageKey = STORAGE_KEY;
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
  globalThis.__simulateCompleteTournament = (drawSeed) => {
    state.drawSeed = drawSeed;
    state.settings = { ...defaultSettings, upset: "balanced", spoiler: false };
    state.rounds = [createFirstRound(drawSeed)];
    for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
      });
      if (roundIndex < 7) buildNextRound(roundIndex);
    }
    return {
      championId: state.rounds[7][0].result.winnerId,
      winnerSignature: state.rounds.flat().map((match) => match.result.winnerId).join("|"),
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
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__snapshotGoalLines([
    { minute: 47, scorer: "Leandro Trossard" },
    { minute: 7, scorer: "Leandro Trossard" },
    { minute: 14, scorer: "Leandro Trossard" },
    { minute: 62, scorer: "Kevin De Bruyne" },
  ]))),
  ["Leandro Trossard  7', 14', 47'", "Kevin De Bruyne  62'"],
  "Snapshot goals should group every scorer's minutes without a '+ more' line.",
);
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
const spainScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Spain"));
const countScorer = (sample, player) => sample.filter((name) => name === player).length;
const croatiaDefenderShare = croatiaScorerSample.filter((name) => ["Joško Gvardiol", "Luka Vušković"].includes(name)).length
  / croatiaScorerSample.length;
assert.ok(croatiaDefenderShare < 0.04, "Defenders must receive only a small open-play scorer share.");
assert.ok(countScorer(croatiaScorerSample, "Luka Vušković") > 0, "Luka Vušković must be capable of scoring.");
assert.ok(countScorer(netherlandsScorerSample, "Micky van de Ven") > 0, "Micky van de Ven must be capable of scoring.");
assert.ok(countScorer(croatiaScorerSample, "Bruno Durdov") > countScorer(croatiaScorerSample, "Luka Vušković"));
assert.ok(countScorer(netherlandsScorerSample, "Xavi Simons") > countScorer(netherlandsScorerSample, "Micky van de Ven"));
const spainProfilesForWeight = context.__playerProfilesForTeam(spainForFootCheck);
assert.ok(
  context.__calculateScorerWeight(spainProfilesForWeight.find((profile) => profile.name === "Lamine Yamal"))
    > context.__calculateScorerWeight(spainProfilesForWeight.find((profile) => profile.name === "Nico Williams")),
);

const franceExpected = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Sealand"), 0);
assert.ok(franceExpected.homeXG > franceExpected.awayXG, "An elite team must receive more xG than a weak opponent.");
const chaosLateMismatch = context.__calculateExpectedGoals(
  franceForFootCheck,
  runtimeTeams.find((team) => team.name === "Sealand"),
  7,
  "chaos",
);
const balancedLateMismatch = context.__calculateExpectedGoals(
  franceForFootCheck,
  runtimeTeams.find((team) => team.name === "Sealand"),
  7,
  "balanced",
);
assert.ok(
  chaosLateMismatch.awayXG > balancedLateMismatch.awayXG * 2,
  "Pure Chaos must preserve substantially more late-round underdog xG.",
);
assert.ok(context.__simulationConfig.modes.chaos.shockChance >= 0.18);
assert.ok(context.__simulationConfig.modes.chaos.redCardChance >= 0.14);
const equalExpectedEarly = context.__calculateExpectedGoals(franceForFootCheck, franceForFootCheck, 0);
const equalExpectedLate = context.__calculateExpectedGoals(franceForFootCheck, franceForFootCheck, 7);
assert.ok(Math.abs(equalExpectedEarly.homeXG - equalExpectedEarly.awayXG) < 0.000001);
assert.ok(Math.abs(equalExpectedLate.homeXG - equalExpectedLate.awayXG) < 0.000001, "Round strength must not bias equal teams.");
const eliteEarly = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Iran"), 0);
const eliteLate = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Iran"), 7);
assert.ok(eliteLate.homeXG / eliteLate.awayXG > eliteEarly.homeXG / eliteEarly.awayXG, "Later rounds must strengthen a meaningful favourite.");
assert.ok(context.__calculateTournamentFatigue({ squadDepth: 55 }, 6) > 0.05);
assert.equal(context.__calculateTournamentFatigue({ squadDepth: 90 }, 6), 0);

const franceProfiles = context.__playerProfilesForTeam(franceForFootCheck);
const mbappeProfile = franceProfiles.find((profile) => profile.name === "Kylian Mbappé");
const syntheticDefender = { ...mbappeProfile, position: "CB", attackingRole: "defensive" };
const lowRatedStriker = { ...mbappeProfile, overall: 55, finishing: 55 };
assert.ok(context.__calculateScorerWeight(mbappeProfile) > context.__calculateScorerWeight(syntheticDefender));
assert.ok(context.__calculateScorerWeight(mbappeProfile) > context.__calculateScorerWeight(lowRatedStriker));
const englandProfilesForHierarchy = context.__playerProfilesForTeam(englandForFootCheck);
const englandScorerWeight = (name) => context.__calculateScorerWeight(
  englandProfilesForHierarchy.find((profile) => profile.name === name),
  englandForFootCheck,
  englandProfilesForHierarchy,
);
assert.ok(englandScorerWeight("Jude Bellingham") > englandScorerWeight("Bukayo Saka"));
assert.ok(englandScorerWeight("Bukayo Saka") > englandScorerWeight("Max Dowman"));
assert.ok(englandScorerWeight("Max Dowman") > englandScorerWeight("Phil Foden"));
const norwayForWeight = runtimeTeams.find((team) => team.name === "Norway");
const australiaForWeight = runtimeTeams.find((team) => team.name === "Australia");
const iranForWeight = runtimeTeams.find((team) => team.name === "Iran");
const norwayProfiles = context.__playerProfilesForTeam(norwayForWeight);
const australiaProfiles = context.__playerProfilesForTeam(australiaForWeight);
const iranProfiles = context.__playerProfilesForTeam(iranForWeight);
const haalandProfile = norwayProfiles.find((profile) => profile.name === "Erling Haaland");
const dukeProfile = australiaProfiles.find((profile) => profile.name === "Mitchell Duke");
const alipourProfile = iranProfiles.find((profile) => profile.name === "Ali Alipour");
const hosseinzadehProfile = iranProfiles.find((profile) => profile.name === "Amirhossein Hosseinzadeh");
assert.deepEqual(
  {
    overall: hosseinzadehProfile.overall,
    finishing: hosseinzadehProfile.finishing,
    role: hosseinzadehProfile.attackingRole,
    penaltyTaker: hosseinzadehProfile.penaltyTaker,
  },
  { overall: 76, finishing: 74, role: "support", penaltyTaker: false },
  "Hosseinzadeh must remain a supporting scorer rather than Iran's elite focal point.",
);
const haalandWeight = context.__calculateScorerWeight(haalandProfile, norwayForWeight, norwayProfiles);
const dukeWeight = context.__calculateScorerWeight(dukeProfile, australiaForWeight, australiaProfiles);
const mbappeWeight = context.__calculateScorerWeight(mbappeProfile, franceForFootCheck, franceProfiles);
const alipourWeight = context.__calculateScorerWeight(alipourProfile, iranForWeight, iranProfiles);
assert.ok(haalandWeight > dukeWeight * 10, "Haaland must have a much higher base scorer weight than Mitchell Duke.");
assert.ok(mbappeWeight > alipourWeight * 4, "Mbappe must have a much higher base scorer weight than an average striker.");
assert.ok(
  context.__matchupScorerMultiplier(haalandProfile, norwayForWeight, runtimeTeams.find((team) => team.name === "Sealand")) > 1.5,
  "Elite finishers must gain a scorer bonus against extremely weak defences.",
);
assert.ok(
  context.__matchupScorerMultiplier(dukeProfile, australiaForWeight, runtimeTeams.find((team) => team.name === "Sealand")) <= 1,
  "Average finishers must not receive the elite weak-opponent bonus.",
);
assert.equal(context.__teamGoalShareMultiplier(dukeProfile, 4, 6), 0.58);
assert.equal(context.__teamGoalShareMultiplier(haalandProfile, 4, 6), 0.76);

const penaltySample = Array.from(
  { length: 3000 },
  () => context.__weightedScorer(franceForFootCheck, scorerSampleRandom, [], new Map(), "penalty"),
);
assert.ok(countScorer(penaltySample, "Kylian Mbappé") / penaltySample.length > 0.55, "The designated taker must receive most penalty goals.");
const savedRealNames = context.__runtimeState.settings.realNames;
context.__runtimeState.settings.realNames = false;
const generatedProfilesFirst = JSON.parse(JSON.stringify(context.__playerProfilesForTeam(franceForFootCheck)));
const generatedProfilesSecond = JSON.parse(JSON.stringify(context.__playerProfilesForTeam(franceForFootCheck)));
assert.deepEqual(generatedProfilesFirst, generatedProfilesSecond, "Generated player attributes must be stable.");
const generatedGoalkeepers = new Set(generatedProfilesFirst.filter((profile) => profile.position === "GK").map((profile) => profile.name));
const generatedScorers = sampleScorers(franceForFootCheck, 10000);
assert.ok(generatedScorers.filter((name) => generatedGoalkeepers.has(name)).length <= 1, "Goalkeepers must almost never score normal goals.");
context.__runtimeState.settings.realNames = savedRealNames;
const compatibleSave = JSON.parse(JSON.stringify(context.__runtimeState));
compatibleSave.settings = { realNames: false };
context.localStorage.setItem(context.__storageKey, JSON.stringify(compatibleSave));
const reloadedSave = context.__loadState();
assert.equal(reloadedSave.drawSeed, compatibleSave.drawSeed, "An existing version-2 save must reload with its seed intact.");
assert.equal(reloadedSave.rounds[0].length, 128, "An existing save must retain the complete opening round.");
assert.equal(reloadedSave.settings.realNames, true, "Real-name player profiles must remain enabled after reload.");
assert.equal(reloadedSave.settings.goals, "normal", "New default settings must merge into an existing save.");
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
assert.equal(context.__scoringRunBrake(10), 1, "Tournament totals must not be hard-capped.");
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
const simulationRatingKeys = ["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"];
assert.ok(runtimeTeams.every((team) => simulationRatingKeys.every((key) => Number.isFinite(team.simulationRatings[key]))));
assert.ok(runtimeTeams.every((team) => team.simulationRatings.discipline >= 35 && team.simulationRatings.discipline <= 95));
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
const specialGoalTable = context.__calculateGoalscorerTable([[{
  homeId: england.id,
  awayId: sealand.id,
  result: {
    revealed: true,
    homeEvents: [
      { scorer: "Bukayo Saka", minute: 110, goalType: "openPlay" },
      { scorer: "Alex Mercer (OG)", minute: 72, goalType: "ownGoal", ownGoal: true },
    ],
    awayEvents: [],
  },
}]]);
assert.equal(specialGoalTable.find((entry) => entry.player === "Bukayo Saka").goals, 1, "Extra-time goals must count.");
assert.ok(!specialGoalTable.some((entry) => entry.player.includes("OG")), "Own goals must not enter Golden Boot totals.");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__calculateGoalscorerTable(JSON.parse(JSON.stringify([[{
    homeId: england.id,
    awayId: sealand.id,
    result: { revealed: true, homeEvents: [{ scorer: "Bukayo Saka" }], awayEvents: [] },
  }]]))))),
  JSON.parse(JSON.stringify(context.__calculateGoalscorerTable([[{
    homeId: england.id,
    awayId: sealand.id,
    result: { revealed: true, homeEvents: [{ scorer: "Bukayo Saka" }], awayEvents: [] },
  }]]))),
  "Serializing and restoring a tournament must not duplicate player statistics.",
);
assert.ok(moldova.players.includes("Amenyah"), "Amenyah must be in Moldova's player pool.");
context.__runtimeState.settings.upset = "balanced";
context.__runtimeState.settings.goals = "normal";

for (let index = 0; index < 50; index += 1) {
  const israelAtHome = context.__simulateMatch({
    id: `israel-home-loss-proof-${index}`,
    homeId: israel.id,
    awayId: sealand.id,
  }, 0);
  assert.ok(israelAtHome.homeGoals < israelAtHome.awayGoals, "Israel must lose its Round of 256 match.");
  assert.equal(israelAtHome.winnerId, sealand.id);
  assert.equal(israelAtHome.homeEvents.length, israelAtHome.homeGoals);
  assert.equal(israelAtHome.awayEvents.length, israelAtHome.awayGoals);
  assert.equal(israelAtHome.extraTime, false);
  assert.equal(israelAtHome.penalties, null);

  const israelAway = context.__simulateMatch({
    id: `israel-away-loss-proof-${index}`,
    homeId: sealand.id,
    awayId: israel.id,
  }, 0);
  assert.ok(israelAway.awayGoals < israelAway.homeGoals, "Israel must lose its away Round of 256 match.");
  assert.equal(israelAway.winnerId, sealand.id);
  assert.equal(israelAway.awayEvents.length, israelAway.awayGoals);
  assert.equal(israelAway.homeEvents.length, israelAway.homeGoals);
  assert.equal(israelAway.extraTime, false);
  assert.equal(israelAway.penalties, null);
}

assert.deepEqual(
  JSON.parse(JSON.stringify(context.__forceOpeningRoundIsraelLoss(israel, sealand, 1, 3, 0))),
  { homeGoals: 3, awayGoals: 0 },
  "Israel's forced loss must not apply after the Round of 256.",
);

let laterRoundWithoutAmenyahGoal = false;
let top32OpeningWithoutAmenyahGoal = false;
let moldovaOpeningLosses = 0;
for (let index = 0; index < 100; index += 1) {
  const openingResult = context.__simulateMatch({
    id: `amenyah-opening-proof-${index}`,
    homeId: moldova.id,
    awayId: sealand.id,
  }, 0);
  assert.ok(
    openingResult.homeEvents.some((goal) => goal.scorer === "Amenyah"),
    "Amenyah must score in the Round of 256 when Moldova faces a weaker team.",
  );

  const awayOpeningResult = context.__simulateMatch({
    id: `amenyah-away-opening-proof-${index}`,
    homeId: sealand.id,
    awayId: moldova.id,
  }, 0);
  assert.ok(
    awayOpeningResult.awayEvents.some((goal) => goal.scorer === "Amenyah"),
    "Amenyah's opening-round goal must work from either side of the fixture.",
  );

  const top32OpeningResult = context.__simulateMatch({
    id: `amenyah-top-32-proof-${index}`,
    homeId: moldova.id,
    awayId: england.id,
  }, 0);
  if (!top32OpeningResult.homeEvents.some((goal) => goal.scorer === "Amenyah")) {
    top32OpeningWithoutAmenyahGoal = true;
  }

  const strongerNonTop32OpeningResult = context.__simulateMatch({
    id: `amenyah-stronger-non-top-32-proof-${index}`,
    homeId: moldova.id,
    awayId: ireland.id,
  }, 0);
  assert.ok(
    strongerNonTop32OpeningResult.homeEvents.some((goal) => goal.scorer === "Amenyah"),
    "Amenyah's goal must be guaranteed against an opponent outside the top 32.",
  );
  if (strongerNonTop32OpeningResult.winnerId !== moldova.id) moldovaOpeningLosses += 1;

  const laterResult = context.__simulateMatch({
    id: `amenyah-later-round-proof-${index}`,
    homeId: moldova.id,
    awayId: england.id,
  }, 1);
  if (!laterResult.homeEvents.some((goal) => goal.scorer === "Amenyah")) {
    laterRoundWithoutAmenyahGoal = true;
  }
}
assert.ok(top32OpeningWithoutAmenyahGoal, "Amenyah must not be guaranteed to score against a top-32 team.");
assert.ok(moldovaOpeningLosses > 0, "Amenyah's guaranteed goal must not guarantee Moldova a win.");
assert.ok(laterRoundWithoutAmenyahGoal, "Amenyah must not be guaranteed to score after the opening round.");

const playbackMatch = { id: "live-fast-equivalence", homeId: england.id, awayId: sealand.id };
const playbackResult = context.__simulateMatch(playbackMatch, 0);
playbackMatch.result = playbackResult;
const playbackSnapshot = JSON.stringify(playbackResult);
const playbackEvents = context.__playbackEvents(playbackMatch);
assert.equal(JSON.stringify(playbackResult), playbackSnapshot, "Live playback must not resimulate or mutate the fast result.");
assert.equal(
  playbackEvents.filter((event) => event.type === "goal").length,
  playbackResult.homeGoals + playbackResult.awayGoals,
  "Live and fast simulation must use the same goal events.",
);

let sealandWins = 0;
let redCardMatches = 0;
let penaltyShootouts = 0;
let penaltyKicks = 0;
let scoredPenaltyKicks = 0;
let savedPenaltyMisses = 0;
let widePenaltyMisses = 0;
for (let index = 0; index < 500; index += 1) {
  const result = context.__simulateMatch({
    id: `giant-killing-proof-${index}`,
    homeId: england.id,
    awayId: sealand.id,
  }, 0);
  assert.equal(result.homeEvents.length, result.homeGoals);
  assert.equal(result.awayEvents.length, result.awayGoals);
  const goalMinutes = [...result.homeEvents, ...result.awayEvents].map((goal) => goal.minute);
  assert.equal(
    new Set(goalMinutes).size,
    goalMinutes.length,
    "Two goals in the same match must not share a displayed minute.",
  );
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
      && ["left", "centre", "right", "wide-left", "wide-right"].includes(kick.direction)
      && ["left", "centre", "right"].includes(kick.keeperDive)
      && ["left", "right"].includes(kick.foot)
      && typeof kick.player === "string"
      && kick.player.length > 2
      && (kick.scored ? kick.missType === null : ["save", "wide"].includes(kick.missType))
    )));
    result.shootout.filter((kick) => kick.scored).forEach((kick) => {
      assert.notEqual(
        kick.direction,
        kick.keeperDive,
        "A successful penalty cannot show the keeper covering the shot direction.",
      );
    });
    result.shootout.filter((kick) => !kick.scored).forEach((kick) => {
      if (kick.missType === "wide") {
        widePenaltyMisses += 1;
        assert.ok(kick.direction === "wide-left" || kick.direction === "wide-right");
      } else {
        savedPenaltyMisses += 1;
        assert.equal(kick.direction, kick.keeperDive);
      }
    });
    assert.equal(result.shootout.filter((kick) => kick.side === "home" && kick.scored).length, result.penalties.home);
    assert.equal(result.shootout.filter((kick) => kick.side === "away" && kick.scored).length, result.penalties.away);
  }
}

assert.ok(sealandWins > 0, "Balanced mode must allow a minnow to eliminate England.");
assert.ok(sealandWins < 50, "Balanced mode must keep extreme upsets exceptional rather than routine.");
assert.ok(redCardMatches > 0, "The simulation must be capable of producing red cards.");
assert.ok(penaltyShootouts > 0, "The simulation must produce animated penalty sequences.");
assert.ok(savedPenaltyMisses > 0, "Shootouts must include visible goalkeeper saves.");
assert.ok(widePenaltyMisses > 0, "Shootouts must include penalties sent wide.");
assert.ok(scoredPenaltyKicks / penaltyKicks > 0.65 && scoredPenaltyKicks / penaltyKicks < 0.86, "Shootout conversion should remain plausible.");

const penaltySceneProof = mockElement();
context.__setPenaltySceneElement(penaltySceneProof, {
  direction: "left", keeperDive: "left", foot: "right", scored: false, missType: "save",
}, "result");
assert.equal(penaltySceneProof.dataset.result, "save");
context.__setPenaltySceneElement(penaltySceneProof, {
  direction: "wide-right", keeperDive: "left", foot: "left", scored: false, missType: "wide",
}, "result");
assert.equal(penaltySceneProof.dataset.result, "wide");
assert.equal(penaltySceneProof.dataset.direction, "wide-right");
const deterministicMatch = { id: "same-seed-scorer-proof", homeId: franceForFootCheck.id, awayId: sealand.id };
context.__runtimeState.drawSeed = 987654321;
const deterministicA = context.__simulateMatch(deterministicMatch, 0);
const deterministicB = context.__simulateMatch(deterministicMatch, 0);
assert.deepEqual(
  JSON.parse(JSON.stringify(deterministicA)),
  JSON.parse(JSON.stringify(deterministicB)),
  "The same seed, settings and fixture must reproduce the same score and scorer events.",
);
const pauseCheck = context.__exercisePause();
assert.equal(pauseCheck.paused, true, "Pausing must stop the live simulation frame.");
assert.equal(pauseCheck.resumed, true, "Resuming must preserve the simulation position.");

console.log("256 TEAMS WC smoke test passed.");
console.log("256 teams = 211 FIFA members + 45 guest sides.");
console.log(`Giant-killing proof: Sealand beat England ${sealandWins} times in 500 balanced simulations.`);
console.log(`Discipline proof: ${redCardMatches} of those simulations included a red card.`);
console.log(`Shootout proof: ${penaltyShootouts} included complete kick-by-kick penalty data.`);
console.log("Determinism proof: identical seed and fixture reproduced the complete score and scorer event stream.");
console.log("Save proof: the existing version-2 save shape reloaded and merged current defaults.");
