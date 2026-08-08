import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { uclAchievementDefinition } from "../challenge-service.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const engine = require(path.join(root, "ucl-engine.js"));
const drawSolver = require(path.join(root, "ucl-draw-solver.js"));
const squadData = require(path.join(root, "ucl-squads.generated.js"));
const squadCalibration = require(path.join(root, "ucl-squad-calibration.js"));
const squadCalibrationIssues = squadCalibration.apply(squadData.UCL_FC27_SQUADS, engine);
assert.deepEqual(squadCalibrationIssues, [], "UCL squad calibration must resolve every configured preferred XI.");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const cleanCss = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const simulatorSource = fs.readFileSync(path.join(root, "ucl-simulator.js"), "utf8");
const simulatorCss = fs.readFileSync(path.join(root, "ucl-simulator.css"), "utf8");
const engineSource = fs.readFileSync(path.join(root, "ucl-engine.js"), "utf8");
const simulationSource = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const challengeSource = fs.readFileSync(path.join(root, "challenge.js"), "utf8");
const buildSource = fs.readFileSync(path.join(root, "scripts", "build-cloudflare.mjs"), "utf8");

assert.equal(engine.TEAM_DATA.length, 39, "The selectable pool must contain 29 core clubs and ten qualifying candidates.");
assert.equal(engine.QUALIFIER_POOL.length, 10, "The qualifying candidate pool must contain all ten requested clubs.");
assert.equal(new Set(engine.TEAM_DATA.map((team) => team.id)).size, 39, "UCL club ids must be unique.");
engine.TEAM_DATA.forEach((team) => {
  const definition = uclAchievementDefinition(team.id);
  assert.ok(definition, `${team.name} must have a UCL achievement definition.`);
  assert.equal(definition.teamName, team.name, `${team.name} must use the same stable display name in achievements.`);
  assert.ok(Number.isInteger(definition.targetStageIndex), `${team.name} must have an integer UCL target stage.`);
  assert.ok(Number.isInteger(definition.points) && definition.points > 0, `${team.name} must have positive UCL points.`);
});
assert.equal(new Set(engine.TEAM_DATA.map((team) => uclAchievementDefinition(team.id).points)).size, 8, "UCL objectives must retain the approved points tiers.");
assert.match(challengeSource, /trackUclSeason/, "The account achievement client must expose UCL tracking.");
assert.match(challengeSource, /\/achievements\/ucl/, "The account achievement client must use the UCL endpoint.");
assert.match(simulatorSource, /achievementState/, "The UCL simulator must publish achievement state as it progresses.");
assert.equal(Object.keys(squadData.UCL_FC27_SQUADS).length, 39, "Every selectable UCL club must have a squad pack.");
assert.equal(engine.team("union-saint-gilloise").name, "Union SG", "The club must display as Union SG while keeping its stable team id.");
assert.equal(squadData.UCL_FC27_SQUADS["union-saint-gilloise"].team, "Union SG", "The generated squad metadata must use the short Union SG name.");
assert.doesNotMatch(appSource, /Royale Union Saint-Gilloise/, "The app team list must not reintroduce the long Union club name.");
assert.doesNotMatch(simulatorSource, /picker\.disabled = hasSeason/,
  "The UCL club picker must remain tappable on mobile when a saved season exists.");
assert.match(simulatorSource, /picker\.dataset\.seasonLocked = hasSeason \? "true" : "false"/);
assert.match(appSource, /function openUclTeamPicker\(\) \{\s*if \(window\.UclSimulator\?\.hasStarted\?\.\(\)\)/,
  "A locked UCL picker must explain that the season needs restarting instead of silently ignoring taps.");
const expectedShortNames = {
  "manchester-city": "Man City",
  "olympique-lyonnais": "Lyon",
  "manchester-united": "Man United",
  "paris-saint-germain": "PSG",
  "gnk-dinamo-zagreb": "Dinamo Zagreb",
};
Object.entries(expectedShortNames).forEach(([teamId, expectedName]) => {
  assert.equal(engine.team(teamId).name, expectedName, `${teamId} must use its requested short display name.`);
  assert.equal(squadData.UCL_FC27_SQUADS[teamId].team, expectedName, `${teamId}'s generated squad metadata must use its requested short display name.`);
});
const barcelonaSquadNames = squadData.UCL_FC27_SQUADS.barcelona.players.map((player) => player.name).join(" | ");
assert.doesNotMatch(barcelonaSquadNames, /Lewandowski/i, "Barcelona must not retain Lewandowski after his transfer.");
assert.match(squadData.UCL_FC27_SQUADS.barcelona.source, /transfermarkt/i, "Squad packs must identify the current-roster source.");
assert.match(squadData.UCL_FC27_SQUADS.barcelona.ratingEdition, /current 26\/27 roster/i, "Squad packs must describe the current-roster overlay.");
engine.TEAM_DATA.forEach((team) => {
  const squad = squadData.UCL_FC27_SQUADS[team.id];
  assert.ok(squad, `${team.name} must have a generated squad pack.`);
  assert.ok(squad.players.length >= 11, `${team.name} must have at least an XI of real players.`);
  assert.equal(squad.players.filter((player) => player.startingXI).length, 11, `${team.name} must have exactly 11 starters.`);
  assert.ok(squad.players.every((player) => player.name && player.position && Number.isInteger(player.overall)), `${team.name} players must include positions and ratings.`);
  assert.ok(squad.players.every((player) => player.simulatorRating === true), `${team.name} players must use direct simulator ratings.`);
  assert.ok(Number.isInteger(squad.simulationRatings?.overall), `${team.name} must include squad-derived team ratings.`);
});

const seed = 20260801;
const season = engine.createSeason("real-madrid", seed);
const activeTeams = season.leagueTeamIds.map((teamId) => engine.team(teamId));
assert.equal(activeTeams.length, 36, "Every season must select exactly 36 league-phase clubs.");

const potCounts = new Map();
activeTeams.forEach((team) => potCounts.set(team.pot, (potCounts.get(team.pot) || 0) + 1));
assert.deepEqual(
  [...potCounts.entries()].sort(([left], [right]) => left - right),
  [[1, 9], [2, 9], [3, 9], [4, 9]],
  "The draw must use four pots of nine clubs.",
);

assert.equal(season.league.length, 8, "The league phase must contain eight matchdays.");
assert.ok(
  season.league.every((round) => round.length === 18),
  "Every league-phase matchday must contain 18 fixtures.",
);
assert.equal(season.league.flat().length, 144, "The league phase must contain 144 matches.");
assert.ok(
  season.league.flat().every((match) => match.stage === "league" && match.allowDraw === true),
  "Every league-phase fixture must end at full time and allow a draw.",
);
assert.deepEqual(engine.validateSchedule(season.league), { valid: true, errors: [] });

activeTeams.forEach((club) => {
  const matches = season.league
    .flat()
    .filter((match) => match.homeId === club.id || match.awayId === club.id);
  const opponentIds = matches.map((match) => (
    match.homeId === club.id ? match.awayId : match.homeId
  ));
  const opponentPotCounts = new Map();
  const homePotCounts = new Map();
  const awayPotCounts = new Map();
  const foreignAssociationCounts = new Map();
  opponentIds.forEach((opponentId) => {
    const opponent = engine.team(opponentId);
    opponentPotCounts.set(opponent.pot, (opponentPotCounts.get(opponent.pot) || 0) + 1);
  });
  matches.forEach((match) => {
    const isHome = match.homeId === club.id;
    const opponent = engine.team(isHome ? match.awayId : match.homeId);
    const target = isHome ? homePotCounts : awayPotCounts;
    target.set(opponent.pot, (target.get(opponent.pot) || 0) + 1);
    const clubAssociation = club.provisional ? club.id : club.association;
    const opponentAssociation = opponent.provisional ? opponent.id : opponent.association;
    assert.notEqual(opponentAssociation, clubAssociation, `${club.name} must not face a club from its own association.`);
    foreignAssociationCounts.set(opponentAssociation, (foreignAssociationCounts.get(opponentAssociation) || 0) + 1);
  });

  assert.equal(matches.length, 8, `${club.name} must play eight league-phase fixtures.`);
  assert.equal(new Set(opponentIds).size, 8, `${club.name} must face eight unique opponents.`);
  assert.equal(
    matches.filter((match) => match.homeId === club.id).length,
    4,
    `${club.name} must play four home fixtures.`,
  );
  assert.equal(
    matches.filter((match) => match.awayId === club.id).length,
    4,
    `${club.name} must play four away fixtures.`,
  );
  assert.deepEqual(
    [1, 2, 3, 4].map((pot) => opponentPotCounts.get(pot) || 0),
    [2, 2, 2, 2],
    `${club.name} must face two opponents from every pot.`,
  );
  assert.deepEqual(
    [1, 2, 3, 4].map((pot) => [homePotCounts.get(pot) || 0, awayPotCounts.get(pot) || 0]),
    [[1, 1], [1, 1], [1, 1], [1, 1]],
    `${club.name} must have one home and one away opponent from every pot.`,
  );
  assert.ok(
    [...foreignAssociationCounts.values()].every((count) => count <= 2),
    `${club.name} must face no more than two clubs from one foreign association.`,
  );
});

const typedSolverSchedule = drawSolver.generateChampionsLeagueSchedule(
  activeTeams.map((team) => ({
    id: team.id,
    name: team.name,
    country: team.provisional ? team.id : team.association,
    pot: team.pot,
  })),
  { seed },
);
assert.equal(typedSolverSchedule.flat().length, 144, "The standalone typed solver must return 144 matches.");

engine.QUALIFIER_POOL.forEach((qualifier, index) => {
  const managedQualifierSeason = engine.createSeason(qualifier.id, seed + index);
  assert.equal(managedQualifierSeason.managedTeamId, qualifier.id, `${qualifier.name} must be selectable in team mode.`);
  assert.ok(managedQualifierSeason.leagueTeamIds.includes(qualifier.id), `${qualifier.name} must occupy one of the seven qualifying places when managed.`);
  assert.equal(engine.managedFixtures(managedQualifierSeason).length, 8, `${qualifier.name} must receive eight opponents.`);
});

[0, 1, 2, 99, 2026].forEach((drawSeed) => {
  assert.deepEqual(
    engine.validateSchedule(engine.createSeason(null, drawSeed).league),
    { valid: true, errors: [] },
    `Seed ${drawSeed} must produce a valid association-aware draw.`,
  );
});

const originalRandom = Math.random;
const originalNow = Date.now;
Math.random = () => 0.25;
Date.now = () => 123456789;
const generatedSeedSeason = engine.createSeason();
Math.random = originalRandom;
Date.now = originalNow;
assert.notEqual(generatedSeedSeason.seed, 0, "A normal new season must not silently reuse fixed seed zero.");

const progressionGuard = engine.createSeason(null, 55);
engine.completeMatchday(progressionGuard, 7);
assert.equal(progressionGuard.activeMatchday, 0, "A later matchday cannot complete before the active one.");
assert.equal(progressionGuard.phase, "league", "Out-of-order completion cannot jump directly to the knockouts.");

const repeatedSeason = engine.createSeason("real-madrid", seed);
assert.deepEqual(
  repeatedSeason.league.map((round) => round.map(({ id, homeId, awayId }) => ({ id, homeId, awayId }))),
  season.league.map((round) => round.map(({ id, homeId, awayId }) => ({ id, homeId, awayId }))),
  "The same seed must reproduce the same league-phase draw.",
);

for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
  const firstResults = engine.ensureMatchdayResults(season, roundIndex)
    .map((match) => [match.id, match.result.home, match.result.away]);
  const repeatedResults = engine.ensureMatchdayResults(repeatedSeason, roundIndex)
    .map((match) => [match.id, match.result.home, match.result.away]);
  assert.deepEqual(
    repeatedResults,
    firstResults,
    `Matchday ${roundIndex + 1} scorelines must be deterministic for the same seed.`,
  );
  engine.completeMatchday(season, roundIndex);
  engine.completeMatchday(repeatedSeason, roundIndex);
}

const finalTable = engine.leagueTable(season);
assert.equal(finalTable.length, 36, "The completed league table must contain every club.");
assert.ok(finalTable.every((row) => row.played === 8), "Every club must finish with eight matches played.");

const qualificationCounts = { qualified: 0, playoffs: 0, eliminated: 0 };
finalTable.forEach((row) => {
  const status = engine.qualificationStatus(season, row.team.id);
  const expectedKey = row.position <= 8
    ? "qualified"
    : row.position <= 24
      ? "playoffs"
      : "eliminated";
  assert.equal(status.position, row.position, `${row.team.name} must retain its table position.`);
  assert.equal(status.key, expectedKey, `Position ${row.position} must use the correct qualification zone.`);
  qualificationCounts[status.key] += 1;
});
assert.deepEqual(
  qualificationCounts,
  { qualified: 8, playoffs: 16, eliminated: 12 },
  "Qualification zones must contain 8 direct qualifiers, 16 play-off clubs, and 12 eliminated clubs.",
);

const expectedKnockoutRounds = [
  ["playoffs", 8],
  ["round-of-16", 8],
  ["quarter-finals", 4],
  ["semi-finals", 2],
  ["final", 1],
];
let previousWinners = null;
expectedKnockoutRounds.forEach(([key, tieCount], roundIndex) => {
  const round = engine.prepareKnockoutRound(season, key);
  const entrants = round.ties.flatMap((tie) => [tie.teamAId, tie.teamBId]);
  assert.equal(round.ties.length, tieCount, `${round.label} must contain ${tieCount} ties.`);
  assert.equal(round.drawComplete, roundIndex >= 2, `${round.label} must ${roundIndex >= 2 ? "inherit the fixed bracket without a draw" : "wait for its required draw"}.`);
  assert.equal(entrants.length, tieCount * 2, `${round.label} must contain the correct number of entrants.`);
  assert.equal(new Set(entrants).size, entrants.length, `${round.label} must not repeat an entrant.`);
  if (previousWinners) {
    previousWinners.forEach((winnerId) => {
      assert.ok(entrants.includes(winnerId), `${engine.team(winnerId).name} must advance into ${round.label}.`);
    });
    if (roundIndex >= 2) {
      assert.deepEqual(entrants, previousWinners, `${round.label} must inherit the established bracket path without a redraw.`);
    }
  } else {
    const playoffIds = new Set(finalTable.slice(8, 24).map((row) => row.team.id));
    assert.ok(entrants.every((teamId) => playoffIds.has(teamId)), "Only positions 9-24 may enter the play-offs.");
    const seededBands = [[8, 10], [10, 12], [12, 14], [14, 16]];
    const unseededBands = [[22, 24], [20, 22], [18, 20], [16, 18]];
    round.ties.forEach((tie, index) => {
      const group = Math.floor(index / 2);
      const seededIds = new Set(finalTable.slice(...seededBands[group]).map((row) => row.team.id));
      const unseededIds = new Set(finalTable.slice(...unseededBands[group]).map((row) => row.team.id));
      assert.ok(seededIds.has(tie.teamAId), `Play-off tie ${index + 1} must use its UEFA seeded ranking pair.`);
      assert.ok(unseededIds.has(tie.teamBId), `Play-off tie ${index + 1} must use its UEFA unseeded ranking pair.`);
    });
  }

  const completedRound = engine.ensureKnockoutResults(season, key);
  assert.ok(
    completedRound.ties.every((tie) => tie.result && tie.winnerId),
    `${completedRound.label} must produce a score and winner for every tie.`,
  );
  previousWinners = completedRound.ties.map((tie) => tie.winnerId);
  engine.completeKnockoutRound(season, key);

  if (roundIndex === 0) {
    const roundOf16 = season.knockout.rounds["round-of-16"];
    const automaticIds = new Set(finalTable.slice(0, 8).map((row) => row.team.id));
    const roundOf16Entrants = roundOf16.ties.flatMap((tie) => [tie.teamAId, tie.teamBId]);
    assert.equal(
      roundOf16Entrants.filter((teamId) => automaticIds.has(teamId)).length,
      8,
      "All eight automatic qualifiers must enter the round of 16.",
    );
    assert.ok(
      roundOf16.ties.every((tie) => automaticIds.has(tie.teamAId)),
      "Every round-of-16 tie must place a top-eight qualifier on the seeded side.",
    );
    const playoffGroupByWinner = new Map(
      completedRound.ties.map((tie) => [tie.winnerId, tie.bracketGroup]),
    );
    const roundOf16SlotByAutomaticTeam = new Map(
      roundOf16.ties.map((tie, tieIndex) => [tie.teamAId, tieIndex]),
    );
    roundOf16.ties.forEach((tie) => {
      const automaticPosition = finalTable.findIndex((row) => row.team.id === tie.teamAId) + 1;
      const seededPairIndex = Math.floor((automaticPosition - 1) / 2);
      assert.equal(
        playoffGroupByWinner.get(tie.teamBId),
        3 - seededPairIndex,
        `Automatic qualifier ${automaticPosition} must receive the winner from its pre-mapped play-off ranking band.`,
      );
    });
    [[0, 1], [2, 3], [4, 5], [6, 7]].forEach(([firstIndex, secondIndex]) => {
      const firstSlot = roundOf16SlotByAutomaticTeam.get(finalTable[firstIndex].team.id);
      const secondSlot = roundOf16SlotByAutomaticTeam.get(finalTable[secondIndex].team.id);
      assert.equal(
        Math.abs(firstSlot - secondSlot),
        4,
        `League positions ${firstIndex + 1} and ${secondIndex + 1} must occupy opposite halves of the fixed bracket.`,
      );
    });
  }
});

assert.equal(season.phase, "complete", "Completing the final must complete the tournament.");
assert.ok(engine.team(season.championId), "A completed UCL tournament must crown a valid champion.");
assert.equal(season.knockout.rounds.final.ties[0].winnerId, season.championId);

const requiredControlIds = [
  "uclTeamPickerButton",
  "startUclSimulatorButton",
  "restartUclSimulatorButton",
  "uclSimulatorScreen",
  "uclPrimaryActionButton",
  "uclSimulateAllButton",
  "uclPauseDrawButton",
  "uclSkipDrawButton",
  "uclSkipRevealsButton",
  "uclMusicDialog",
  "uclMusicFileInput",
];
requiredControlIds.forEach((id) => {
  assert.match(html, new RegExp(`\\bid="${id}"`), `The UCL integration must include #${id}.`);
});
const uclLaunchButton = html.match(/<button[^>]*id="startUclSimulatorButton"[^>]*>[\s\S]*?<\/button>/)?.[0] || "";
assert.match(uclLaunchButton, /Play UCL mode/, "The home card must present UCL as playable.");
assert.doesNotMatch(uclLaunchButton, /\bdisabled\b|aria-disabled="true"/, "The released UCL launch button must be enabled.");
assert.match(cleanCss, /\.mode-card-ucl \.ucl-launch-button\s*{[^}]*#244fae[^}]*#102e70/, "The UCL launch button must use the dark-blue mode treatment.");
assert.match(cleanCss, /\.mode-card-ucl \.premier-league-menu-restart\s*{[^}]*min-height:\s*34px[^}]*padding:\s*0 12px[^}]*font-size:\s*10px/, "The UCL restart action must remain visually secondary and compact.");
assert.match(simulatorSource, /hasSeason \? "Resume UCL mode" : "Play UCL mode"/, "The runtime must keep the released UCL action playable and resumable.");
assert.doesNotMatch(simulatorSource, /startButton\.textContent = "Coming soon"|startButton\.disabled = true/, "The UCL runtime must not restore the old release gate.");
["overview", "fixtures", "table", "knockout"].forEach((view) => {
  assert.match(html, new RegExp(`data-ucl-view="${view}"`), `The UCL header must include the ${view} tab.`);
});

const engineScriptIndex = html.indexOf('<script src="./ucl-engine.js');
const squadScriptIndex = html.indexOf('<script src="./ucl-squads.generated.js');
const drawSolverScriptIndex = html.indexOf('<script src="./ucl-draw-solver.js');
const simulatorScriptIndex = html.indexOf('<script src="./ucl-simulator.js');
assert.ok(drawSolverScriptIndex >= 0, "The page must load the typed UCL draw solver.");
assert.ok(engineScriptIndex > drawSolverScriptIndex, "The UCL draw solver must load before the engine.");
assert.ok(engineScriptIndex >= 0, "The page must load the UCL engine.");
assert.ok(squadScriptIndex > engineScriptIndex, "The generated UCL squad pack must load after the engine.");
assert.ok(simulatorScriptIndex > engineScriptIndex, "The UCL engine must load before the simulator UI.");
assert.ok(simulatorScriptIndex > squadScriptIndex, "The squad pack must load before the simulator UI.");
assert.match(html, /<link[^>]+href="\.\/ucl-simulator\.css[^>]*>/, "The page must load the UCL stylesheet.");

[
  "ucl-engine.js",
  "ucl-draw-solver.js",
  "ucl-simulator.js",
  "ucl-squads.generated.js",
  "ucl-simulator.css",
  "assets/audio/ucl-legacy-anthem.mp3",
].forEach((relativePath) => {
  const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(buildSource, new RegExp(`"${escapedPath}"`), `${relativePath} must be in the static build allowlist.`);
});
assert.match(
  buildSource,
  /const uclAssetPackRoot[\s\S]*?cpSync\(uclAssetPackRoot,[\s\S]*?recursive:\s*true/,
  "The static build must copy the optional UCL badge asset pack.",
);
assert.doesNotMatch(html, /ucl-draw-hand|ucl-paper-scroll/, "The draw must not render the removed hand or paper scroll.");
assert.match(simulatorCss, /@keyframes\s+ucl-pot-ball-bounce/, "The white pot balls must use a dedicated bounce animation.");
assert.doesNotMatch(simulatorCss, /\.ucl-mini-ball[\s\S]{0,500}rotate[XY]\(/, "Pot balls must never flatten through 3D rotation.");
assert.match(html, /ucl-feature-ball-half is-top[\s\S]*ucl-feature-ball-half is-bottom[\s\S]*ucl-feature-ball-crack/, "The selected draw ball must visibly crack into two halves.");
assert.match(simulatorCss, /data-phase="revealed"[^}]*\.ucl-feature-ball-half\.is-top[\s\S]{0,180}rotate\(-9deg\)/, "The upper ball shell must split away during the reveal.");
assert.match(html, /id="uclSettingsButton"/, "The UCL utility header must include Settings.");
assert.match(html, /id="uclFeedbackButton"/, "The UCL utility header must include Feedback.");
assert.match(html, /id="uclAchievementsButton"/, "The UCL utility header must include Achievements.");
assert.match(html, /id="uclDonateButton"/, "The UCL utility header must include Donate.");
assert.match(html, /id="uclAccountButton"/, "The UCL utility header must include the account control.");
assert.match(simulatorSource, /<header><h3>Top Scorers<\/h3><\/header>/, "The UCL scoring card must use the Top Scorers label.");
assert.doesNotMatch(simulatorSource, /<small>TOP \$\{/, "The Top Scorers card must not render a limit label.");
assert.match(simulatorCss, /\.ucl-overview-grid\.has-golden-boot \.ucl-table\.is-compact\s*\{[\s\S]{0,180}min-width:\s*0/, "The desktop overview table must fit its grid column.");
assert.match(simulatorCss, /\.ucl-team-mark-small\[data-team-id\][\s\S]{0,220}overflow:\s*visible\s*!important/, "Badge frames must leave crowns, stars and wide marks visible.");
assert.match(simulatorCss, /\.ucl-team-mark-small\[data-team-id\] img[\s\S]{0,260}max-width:\s*100%\s*!important[\s\S]{0,160}object-fit:\s*contain/, "Badge images must use non-cropping contain sizing.");
assert.doesNotMatch(simulatorCss, /data-team-id="(?:shakhtar-donetsk|porto)"[\s\S]{0,180}overflow:\s*hidden/, "Tall crests must not use badge-specific clipping rules.");
assert.match(simulatorSource, /Engine\.managedFixtures\(season\)[\s\S]{0,900}TEAM MODE/, "Team mode must draw only the managed club's eight opponents.");
assert.match(simulatorSource, /title:\s*"Your league phase opponents"/, "The managed draw must identify the opponent-only ceremony.");
assert.match(simulatorSource, /teamMode \? "<h2>Your opponents<\/h2>"/, "The managed overview must label the draw Your opponents.");
assert.doesNotMatch(simulatorSource, /YOUR LEAGUE-PHASE DRAW|Eight opponents|LIVE RANKING/, "The overview must not render the removed UCL kicker labels.");
assert.doesNotMatch(simulatorSource, /4 HOME\s*·\s*4 AWAY/, "The managed overview must not render the home/away summary chip.");
assert.match(simulatorSource, /ucl-opponent-score/, "Played opponent cards must use a plain score treatment.");
assert.match(simulatorSource, /ucl-opponent-venue-label/, "Unplayed opponent cards must put HOME/AWAY beneath the club name.");
assert.match(simulatorSource, /<h2>League phase table<\/h2>/, "The overview must retain League phase table as the table heading.");
assert.match(simulatorSource, /has-golden-boot/, "The team overview must reserve a desktop column for Golden Boot.");
assert.match(simulatorSource, /function\s+drawDelay\([\s\S]{0,500}currentDraw\?\.paused/, "The draw sequence must wait while its pause state is active.");
assert.match(simulatorSource, /event\.code !== "Space"/, "The draw must support Space-bar pause toggling.");
assert.match(simulatorSource, /ceremonyScene\.dataset\.phase = "resetting"[\s\S]{0,320}revealName\.textContent = ""/, "A revealed club must fully hide and clear before the next club is loaded.");
assert.doesNotMatch(simulatorSource, /sounds\.paper\(\)/, "Opening a draw ball must not play the removed drop sound.");
assert.doesNotMatch(simulatorSource, /const y = \(\(index \* 41\)/, "Pot balls must no longer be distributed through the full vertical pot area.");
assert.equal(engine.team("napoli").badge, "./assets/ucl-26-27/badges/napoli-2007.png", "Napoli must use the supplied 2007 crest.");
assert.match(simulatorSource, /function\s+openManagedMatchday\(/, "Team mode must hand the managed fixture to the live match engine.");
assert.match(simulatorSource, /function\s+openManagedKnockoutMatch\(/, "Managed knockout ties must open in the live match engine.");
assert.match(
  simulatorSource,
  /allowDraw:\s*round\.legs === 2 && legIndex === 0[\s\S]{0,120}uclAggregateBefore:\s*aggregateBefore/,
  "Only a two-legged tie's first leg may end as a draw; the deciding leg must carry its aggregate score into extra time.",
);
assert.match(
  appSource,
  /function decidingMatchIsLevel[\s\S]{0,260}decidingMatchScore[\s\S]{0,160}score\.home === score\.away/,
  "Extra time and penalties must be decided from the knockout aggregate score.",
);
assert.match(
  appSource,
  /function startPenaltyShootout[\s\S]{0,700}controlledStandardShootoutSide\(match\)[\s\S]{0,260}createInteractiveShootoutSequence\(match, controlledSide\)/,
  "A managed club's knockout shootout must switch to interactive user control.",
);
assert.match(
  appSource,
  /function createInteractiveShootoutSequence[\s\S]{0,2200}interactionRole:\s*"keeper"[\s\S]{0,1200}interactionRole:\s*"taker"/,
  "Managed shootouts must let the user control both their takers and their goalkeeper dives.",
);
assert.match(
  appSource,
  /const isManagedUclMode[\s\S]{0,500}attack:\s*1\.03 \+ underdogScale \* 0\.015[\s\S]{0,120}defence:\s*0\.98 - underdogScale \* 0\.01/,
  "Managing a UCL club must apply only a small managed-team assistance boost in addition to tactical effects.",
);
assert.match(simulatorSource, /function\s+openKnockoutMatch\([\s\S]{0,2600}season\.spectateTeamId = managedMatch \? season\.managedTeamId : null[\s\S]{0,120}season\.neutralView = !managedMatch/, "Any current knockout tie must open in managed or spectator mode as appropriate.");
assert.match(simulatorSource, /function knockoutTieWatchable\([\s\S]{0,500}round\.key === season\?\.knockout\?\.currentKey[\s\S]{0,300}!tie\.result/, "Only unplayed ties in the active knockout round may be watched.");
assert.match(simulatorSource, /function knockoutTieViewable[\s\S]*?visibleKnockoutLegs\(tie\)\.some\(Boolean\)/, "Played knockout ties must remain viewable from the bracket.");
assert.match(simulatorSource, /function openKnockoutMatch\(roundKey, tieId, options = \{\}\)[\s\S]*?availableLegIndices[\s\S]*?reviewOnly/, "The knockout match viewer must open a selected saved leg without replaying it.");
assert.match(simulatorSource, /const leagueDrawPending = season\.phase === "league" && !season\.drawComplete[\s\S]{0,500}if \(leagueDrawPending\) renderPendingLeagueDraw\(\)/, "Undrawn UCL seasons must not render their prebuilt fixtures or opponents.");
assert.match(simulatorSource, /if \(!season\.drawComplete\) \{\s*startLeagueDraw\(\);\s*return;/, "The UCL draw layer must open before asynchronous audio setup can expose fixtures.");
assert.match(simulatorSource, /canWatchNextLeg[\s\S]{0,320}tie\.playedLegs\?\.filter\(Boolean\)\.length/, "An active partially played tie must still open its next unplayed leg by default.");
assert.match(simulatorSource, /watchable && !playable \? "is-watchable"[\s\S]{0,500}managedMatch \? "Play match" : "Watch match"/, "Non-managed bracket ties must advertise their watch action.");
assert.match(html, /id="uclLegSwitcher"[\s\S]*?id="uclPreviousLegButton"[\s\S]*?id="uclNextLegButton"/, "Completed two-leg ties must provide previous and next leg controls beneath the match.");
assert.match(simulatorCss, /\.ucl-leg-switcher[\s\S]{0,1400}\.ucl-leg-switcher button:active/, "The knockout leg switcher must use the UCL styling and responsive press feedback.");
assert.match(simulatorSource, /data-ucl-fixture-id\], \[data-ucl-knockout-tie\][\s\S]{0,220}interactiveMatch\.click\(\)/, "Keyboard users must be able to open knockout ties with Enter or Space.");
assert.match(simulatorSource, /const knockoutMatches = round\.ties\.map[\s\S]{0,500}season\.rounds = \[knockoutMatches\]/, "A managed knockout match must show every tie from that round in the fixtures board.");
assert.match(simulatorSource, /function\s+finishManagedKnockoutMatch\(/, "Managed knockout legs must be committed back to their bracket tie.");
assert.match(simulatorSource, /function closeSimulator[\s\S]{0,1100}ucl-match-mode-active[\s\S]{0,600}state = standardStateBeforeMatch \|\| standardTournamentState[\s\S]{0,500}window\.render\?\.\(\)/, "Leaving UCL after a match must clear the match shell and render the mode picker.");
assert.doesNotMatch(simulatorSource, /ucl-current-round-panel/, "The removed current-round knockout panel must not be rendered.");
assert.match(simulatorSource, /uclGoldenBootMarkup\(10,\s*"overview"\)/, "Team overview must show the extended Golden Boot list.");
assert.doesNotMatch(simulatorSource, /uclGoldenBootMarkup\(5,\s*"live"\)/, "The UCL table panel must not duplicate the shared live Golden Boot panel.");
assert.match(simulatorSource, /UCL_FC27_SQUADS/, "Managed UCL matches must load the generated real-player squad pack.");
assert.match(simulatorSource, /syncEngineSquadRatings/, "The UCL engine must synchronize its simulation ratings from the generated squad pack.");
assert.match(simulatorSource, /Engine\.applySimulationRatings/, "The UCL simulator must apply squad-derived ratings to league simulations.");
assert.match(simulatorSource, /players:\s*playerNames/, "Managed UCL teams must expose real player names to the match engine.");
assert.match(simulatorSource, /realNames:\s*true/, "Managed UCL matches must use real player names.");
assert.match(simulatorSource, /realPlayersOnly:\s*true/, "Managed UCL matches must exclude fictional players.");
assert.doesNotMatch(simulatorSource, /players:\s*\[\],\s*\n\s*playerProfiles:\s*\[\]/, "Managed UCL teams must not install empty squads.");
assert.match(simulatorSource, /finishManagedMatchday[\s\S]{0,900}Engine\.completeMatchday/, "The remaining matchday must resolve only after the managed match finishes.");
assert.match(simulatorSource, /returnToManagedMatchday/, "Watching another UCL fixture must provide a return path to the managed match.");
assert.match(appSource, /window\.UclSeason\?\.returnToManagedMatchday/, "The live match action must return from a watched fixture to the managed match.");
assert.match(
  appSource,
  /function\s+acceptPresentationEvent\(event\)[\s\S]*playedEventKeys\?\.has\(eventKey\)[\s\S]*return;[\s\S]*applyLiveEvent\(event/,
  "Managed-match tactical rebuilds must not apply the same logical goal more than once.",
);
const liveEventKeySource = appSource.slice(
  appSource.indexOf("function match2dEventKey(event)"),
  appSource.indexOf("function initializeLivePlayerRatings(match)"),
);
const liveEventKey = Function(`${liveEventKeySource}; return match2dEventKey;`)();
const rebuiltGoal = {
  id: "rebuilt-presentation-id",
  type: "goal",
  side: "home",
  minute: 85,
  metadata: { scorer: "Jeremy Jacquet" },
  scoreAfter: { home: 1, away: 0 },
};
assert.equal(
  liveEventKey(rebuiltGoal),
  liveEventKey({ ...rebuiltGoal, id: "another-rebuilt-id" }),
  "A rebuilt copy of the same goal must retain the same logical event key.",
);
assert.notEqual(
  liveEventKey(rebuiltGoal),
  liveEventKey({ ...rebuiltGoal, id: "legitimate-second-goal", scoreAfter: { home: 2, away: 0 } }),
  "A legitimate same-minute second goal must remain distinct through its score progression.",
);
assert.match(appSource, /PREFERRED_FOOT_OVERRIDES/, "Penalty takers must support explicit preferred-foot corrections.");
assert.match(appSource, /\["Erling Haaland",\s*"left"\]/, "Haaland must use his left foot for penalties.");
assert.match(html, /id="uclLiveBackButton"/, "The live UCL match must provide a route back to the competition.");
assert.match(html, /id="uclEngineTablePanel"/, "The live UCL match must show league-phase context.");
assert.doesNotMatch(html, /id="ucl(?:FastMode|Music|Sound)(?:Header)?Button"/, "Removed UCL playback controls must not remain in the page markup.");
assert.match(simulatorSource, /event\.key !== "Enter"[\s\S]{0,800}activeView === "overview"[\s\S]{0,350}openManagedMatchday\(\)/, "Enter on the overview must open the managed club's next fixture.");
assert.match(simulatorSource, /activeView === "knockout"[\s\S]{0,350}handleKnockoutAction\(\)/, "Enter on the knockout view must advance its current action.");
const leagueRevealSource = simulatorSource.match(/async function revealMatchday\([\s\S]*?\n  \}/)?.[0] || "";
const knockoutRevealSource = simulatorSource.match(/async function revealKnockoutRound\([\s\S]*?\n  \}/)?.[0] || "";
assert.doesNotMatch(leagueRevealSource, /sounds\.(?:whistle|startCrowd|duckMusic|goal|gasp|tension)\(/, "League score reveals must not play synthetic sound effects.");
assert.doesNotMatch(knockoutRevealSource, /sounds\.(?:whistle|startCrowd|duckMusic|goal|gasp|tension)\(/, "Knockout score reveals must not play synthetic sound effects.");
assert.doesNotMatch(simulatorSource, /startLeagueDraw\([\s\S]{0,2600}sounds\.startCrowd\(/, "The league draw must not layer synthetic crowd ambience over UCL music.");
assert.doesNotMatch(simulatorSource, /startKnockoutDraw\([\s\S]{0,1800}sounds\.startCrowd\(/, "Knockout draws must not layer synthetic crowd ambience over UCL music.");
assert.doesNotMatch(simulatorSource, /bundledRemoved/, "The bundled UCL music must never be permanently removable.");
assert.match(simulatorSource, /musicSource\(\)[\s\S]{0,260}return \{ key: "bundled", url: BUNDLED_ADDON\.url \}/, "Music playback must always fall back to the bundled UCL track.");
assert.match(simulatorSource, /removeMusicButton\.hidden = !customMusicRecord\?\.blob/, "Only imported music may expose a remove action.");
assert.match(simulatorSource, /Imported music removed\. The bundled UCL music has been restored\./, "Removing custom music must clearly restore the bundled UCL track.");
assert.match(engineSource, /const requiresDraw = key === "playoffs" \|\| key === "round-of-16";[\s\S]{0,300}drawComplete: !requiresDraw/, "Only the play-offs and round of 16 may require a knockout draw.");
assert.match(simulatorSource, /\["quarter-finals", "semi-finals", "final"\][\s\S]{0,260}round\.drawComplete = true/, "Existing fixed-bracket rounds must migrate past the obsolete draw state.");
assert.match(simulatorSource, /const centeredKnockoutRound = Boolean\(knockoutRound && !finalComplete\)/, "Every active knockout round must use the centered header treatment.");
assert.match(simulatorSource, /classList\.toggle\("is-fixed-knockout", season\.phase !== "league" && centeredKnockoutRound\)/, "Play-offs and every later knockout round must center the title and UCL icon.");
assert.match(simulatorSource, /matchdayDate\.textContent = finalComplete \? "5 JUN 2027 · MADRID" : ""/, "Active knockout headers must not show two-legs copy.");
assert.match(simulatorSource, /progressLabel\.textContent = finalComplete \? "Competition complete" : ""/, "Active knockout headers must not show draw-status copy.");
assert.match(simulatorCss, /ucl-action-row\.is-fixed-knockout \.ucl-stage-heading[\s\S]{0,100}grid-column:\s*2[\s\S]{0,100}justify-self:\s*center/, "The fixed knockout round title and UCL icon must be centered on desktop.");
assert.match(simulatorSource, /classList\.toggle\("is-league-phase", season\.phase === "league"\)/, "The league-phase header must use its compact Premier League-style state.");
assert.match(simulatorSource, /progressLabel\.textContent = `Matchday \$\{index \+ 1\}`/, "The compact UCL header must center the current matchday rather than progress copy.");
assert.match(simulatorCss, /ucl-action-row\.is-league-phase \.ucl-stage-heading[\s\S]{0,160}display:\s*flex[\s\S]{0,160}grid-column:\s*2/, "The compact league-phase header must keep the UCL icon beside its centered matchday copy.");
assert.match(simulatorCss, /ucl-action-row\.is-league-phase \.ucl-stage-heading > span\s*\{\s*display:\s*none/, "The duplicate league-phase title copy must stay hidden while its UCL icon remains visible.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active \.content[\s\S]{0,220}grid-template-columns:\s*repeat\(2,[\s\S]{0,180}"stage stage"[\s\S]{0,80}"stats table"[\s\S]{0,80}"boot boot"[\s\S]{0,80}"tactics tactics"[\s\S]{0,80}"board board"/, "The UCL mobile match screen must place Stats and League phase side by side, followed immediately by Golden Boot.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active \.insight-right\s*\{\s*display:\s*contents\s*!important/, "The mobile Stats panel must be independently placeable beside the League phase table.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active #matchAnalysis\s*\{\s*grid-area:\s*stats\s*!important/, "The mobile Stats panel must occupy the named grid slot beside the League phase table.");
assert.match(simulatorCss, /@media \(max-width: 640px\)[\s\S]{0,1800}\.ucl-primary-actions\s*\{[\s\S]{0,220}position:\s*static[\s\S]{0,220}grid-column:\s*3/, "The mobile matchday action must stay in the top header instead of floating at the bottom of the screen.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active \.team h2\.team-name > span[\s\S]{0,360}text-overflow:\s*ellipsis[\s\S]{0,160}white-space:\s*nowrap\s*!important/, "UCL mobile team names must use the same contained single-line treatment as Premier League matches.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active \.match-stage\.pl-full-time \.stage-action\s*\{[\s\S]{0,100}margin-top:\s*var\(--pl-result-event-clearance, 0px\)/, "Completed UCL matches must move their action below long goalscorer lists on desktop too.");
assert.match(simulatorCss, /@media \(max-width: 560px\)[\s\S]{0,180}#roundBoard \.fixture-grid:not\(\.bracket-mode\)[\s\S]{0,100}grid-template-columns:\s*repeat\(2,/, "Matchday fixtures must remain in two columns at phone widths.");
assert.match(simulatorSource, /managedGoals > opponentGoals[\s\S]{0,100}"is-win"[\s\S]{0,120}managedGoals < opponentGoals[\s\S]{0,100}"is-loss"[\s\S]{0,100}"is-draw"/, "Opponent scores must be classified from the managed club's perspective.");
assert.match(simulatorCss, /\.ucl-opponent-score\.is-draw\s*\{\s*color:\s*#f2b84b/, "Drawn opponent scores must use amber text.");
assert.match(simulatorCss, /\.ucl-opponent-score\.is-loss\s*\{\s*color:\s*#ff6f7f/, "Lost opponent scores must use red text.");
assert.match(simulatorSource, /data-ucl-fixture-round=[\s\S]{0,180}data-ucl-fixture-id=[\s\S]{0,260}role="button"/, "Played league fixtures must expose an interactive result target.");
assert.match(simulatorSource, /function openLeagueFixtureResult\([\s\S]{0,2200}matchViewActive = true/, "A completed fixture must reopen in the match result view.");
assert.match(simulatorSource, /const homeGoals = Number\(match\.result\.homeGoals \?\? match\.result\.home\)[\s\S]{0,500}match\.result\.homeGoals = homeGoals/, "Reopened UCL results must normalize engine scores for the shared match view.");
assert.match(simulatorSource, /season\.league\.flat\(\)\.filter\(\(fixture\) => fixture\.result\?\.revealed\)\.forEach\(engineResultToLeagueResult\)/, "Opening a historical result must normalize every completed fixture shown below it.");
assert.match(simulatorCss, /ucl-club-flag:is\([\s\S]{0,160}shakhtar-donetsk[\s\S]{0,100}crvena-zvezda[\s\S]{0,160}translateY\(-6px\) scale\(0\.8\)/, "Tall Shakhtar and Crvena crests must sit above the fixture-card edge.");

const clubBruggePlayers = squadData.UCL_FC27_SQUADS["club-brugge"].players;
assert.equal(clubBruggePlayers.find((player) => player.name === "Carlos Forbs")?.startingXI, true, "Carlos Forbs must start for Club Brugge.");
assert.equal(clubBruggePlayers.find((player) => player.name === "Andrej Vasovic")?.startingXI, false, "Carlos Forbs must replace the extra centre-forward in Club Brugge's XI.");
assert.match(simulatorSource, /winner\.name} through on pens \$\{winnerScore}–\$\{loserScore}/, "Penalty-decided ties must name the advancing club and shootout score.");
assert.match(simulatorSource, /ucl-fixture-list ucl-fixture-grid/, "The fixtures view must render its match list in a two-column grid.");
assert.match(simulatorSource, /is-no-matchday/, "Fixture cards without a matchday label must use the balanced three-column layout.");
assert.doesNotMatch(simulatorSource, /18 fixtures · all clubs play once/, "The fixtures view must not render the removed matchday summary text.");
assert.doesNotMatch(simulatorSource, /ucl-fixtures-date/, "The fixtures view must not render the removed matchday date block.");
assert.doesNotMatch(simulatorSource, /ucl-venue-chip/, "Fixture rows must not render the removed UCL/HOME/AWAY box.");
assert.doesNotMatch(simulatorSource, /36 CLUBS · ONE TABLE/, "The standings view must not render the removed table kicker.");
assert.match(simulatorSource, /<h2>League phase standings<\/h2>/, "The standings view must use League phase standings as its heading.");
assert.match(simulatorCss, /\.ucl-fixture-grid\s*\{[\s\S]{0,160}grid-template-columns:\s*repeat\(2,/, "The fixtures view must define two desktop columns.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active #roundBoard[\s\S]{0,220}display:\s*block\s*!important/, "The live UCL screen must show the full matchday board beneath the match.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active \.content[\s\S]{0,180}"board board boot"/, "The live UCL layout must keep the table beside the match and put Golden Boot lower down.");
assert.match(simulatorCss, /team-match-events \.timeline-event b[\s\S]{0,100}color:\s*#b9ceff/, "UCL goal minutes must use light blue instead of Premier League purple.");
assert.match(simulatorCss, /ucl-knockout-score-reveal/, "Knockout scores must reveal with an in-bracket animation.");
assert.match(html, /id="uclChampionShareButton"[^>]*>Share image<\/button>/, "The UCL champion screen must provide a share-image action.");
assert.match(simulatorSource, /<header><h3>Top Scorers<\/h3><\/header>/, "UCL scoring panels must be labelled Top Scorers.");
assert.doesNotMatch(simulatorSource, /<header><h3>Golden Boot<\/h3><\/header>/, "UCL panels must not retain the Golden Boot heading.");
assert.match(appSource, /state\?\.uclSeason \? "TOP SCORERS" : "GOLDEN BOOT"/, "The live UCL match panel must also be labelled Top Scorers.");
assert.match(appSource, /state\.uclKnockoutMatch \? "Back to knockouts"/, "A watched knockout match must return to the bracket after full time.");
assert.match(simulatorSource, /ucl-overview-table[\s\S]*?uclGoldenBootMarkup\(10, "overview"\)/, "The desktop overview must place the league table before Top Scorers.");
assert.match(simulatorSource, /ucl-overview-grid has-golden-boot is-knockout-overview[\s\S]*?data-ucl-open-view="knockout">View all<[\s\S]*?visibleTies\.map\(\(tie\) => bracketTieMarkup\(tie, current\.key\)\)[\s\S]*?uclGoldenBootMarkup\(10, "overview"\)/, "The knockout overview must show the current round, a full-bracket action, and Top Scorers.");
assert.match(simulatorSource, /ucl-complete-overview-grid[\s\S]*?ucl-champion-card is-embedded[\s\S]*?uclGoldenBootMarkup\(10, "overview"\)/, "Top Scorers must remain visible on the completed-season overview.");
assert.match(simulatorCss, /\.ucl-overview-grid\.is-knockout-overview[\s\S]{0,180}grid-template-columns:/, "The knockout overview must use a dedicated desktop grid.");
assert.doesNotMatch(simulatorSource, /Math\.min\(5, candidates\.length\)/, "Simulated UCL goals must not be restricted to the same five scorer candidates.");
assert.match(simulatorSource, /function uclFallbackScorer[\s\S]*?previousGoals[\s\S]*?positionWeight/, "Simulated UCL scorer selection must account for position and prior scoring concentration.");
assert.match(simulatorSource, /function repairUclScorerEvents[\s\S]*?season\.league\?\.flat\(\)[\s\S]*?Engine\.ROUND_CONFIG/, "Existing league and knockout results must be backfilled with saved scorer events.");
assert.match(simulatorSource, /homeEvents:\s*\(result\.homeEvents \|\| \[\]\)[\s\S]{0,220}awayEvents:\s*\(result\.awayEvents \|\| \[\]\)/, "Played knockout legs must preserve their goalscorer events.");
assert.match(simulatorSource, /function uclGoldenBootRows[\s\S]*?Engine\.ROUND_CONFIG[\s\S]*?visibleKnockoutLegs/, "UCL Top Scorers must combine league-phase and knockout goals.");
assert.match(appSource, /window\.UclSeason\?\.topScorerRows[\s\S]{0,160}window\.UclSeason\.topScorerRows\(500\)/, "The live match Top Scorers panel must use the full UCL competition ranking.");
assert.match(simulationSource, /function uclSeasonScorerMultiplier[\s\S]*?teamGoals >= 3[\s\S]*?ucl-scorer-form/, "Played UCL matches must spread scoring through UCL-specific concentration and form weighting.");
assert.match(simulationSource, /context\.team\?\.uclClub[\s\S]*?uclSeasonScorerMultiplier[\s\S]*?else if \(context\.team\?\.premierLeague\)/, "UCL clubs must not reuse Premier League scorer concentration rules.");
assert.match(simulatorCss, /data-team-id="shakhtar-donetsk"[\s\S]{0,180}--ucl-badge-y:\s*-6px/, "Shakhtar's badge must be lifted within shared table and overview slots.");
assert.match(simulatorCss, /data-team-id="porto"[\s\S]{0,180}--ucl-badge-y:\s*-5px/, "Porto's badge must be lifted within shared table and overview slots.");
assert.match(simulatorCss, /data-team-id="gnk-dinamo-zagreb"[\s\S]{0,180}--ucl-badge-y:\s*-2px/, "Dinamo Zagreb's badge must be lifted within shared table and overview slots.");
assert.match(simulatorCss, /data-team-id="slovan-bratislava"[\s\S]{0,180}--ucl-badge-y:\s*-4px/, "Slovan Bratislava's badge must be lifted within shared table and overview slots.");
assert.match(simulatorCss, /data-team-id="club-brugge"[\s\S]{0,180}--ucl-badge-y:\s*-2px/, "Club Brugge's badge must be lifted within shared table and overview slots.");
assert.match(simulatorCss, /data-team-id="olympiacos"[\s\S]{0,180}--ucl-badge-y:\s*-4px/, "Olympiacos' badge must be lifted within shared table and overview slots.");
assert.match(simulatorSource, /openUclSeasonSnapshotModal\?\.\(uclChampionSnapshotSummary\(\), championShareButton\)/, "The UCL champion share action must open the winners-image modal.");
assert.match(simulatorSource, /season\.phase === "complete" && season\.championId[\s\S]*?ucl-champion-card is-embedded[\s\S]*?data-ucl-champion-action="share"[\s\S]*?data-ucl-champion-action="bracket"/, "The completed UCL overview must permanently show the winners screen with share and bracket actions.");
assert.match(simulatorCss, /\.ucl-champion-card\.is-embedded\s*\{[\s\S]{0,100}animation:\s*none/, "The permanent winners screen must not replay the full-screen entrance animation.");
assert.match(simulatorSource, /UCL_YOUNG_PLAYER_NAMES[\s\S]*?playerOfTheSeason[\s\S]*?youngPlayerOfTheSeason[\s\S]*?topScorer/, "The UCL snapshot summary must calculate POTS, YPOTS, and Top Scorer.");
assert.match(appSource, /async function createUclSeasonSnapshotCanvas\(summary\)[\s\S]*?label: "POTS"[\s\S]*?label: "YPOTS"[\s\S]*?label: "TOP SCORER"/, "The UCL winners image must show POTS, YPOTS, and Top Scorer.");
assert.doesNotMatch(appSource, /THE 2026\/27 CHAMPIONS LEAGUE AWARDS|POTS · YPOTS · TOP SCORER/, "The UCL winners image must not include the removed awards banner.");
assert.doesNotMatch(appSource, /label: "CHAMPION POINTS"|label: "YOUR POINTS"/, "The UCL winners image must not misread POTS and YPOTS as points labels.");
assert.match(simulatorCss, /golden-boot-flag\.ucl-club-flag[\s\S]{0,650}object-fit:\s*contain/, "Live UCL Golden Boot rows must display square, contained club badges.");
assert.match(simulatorCss, /ucl-bracket-team \.ucl-team-mark-small[\s\S]{0,100}width:\s*20px[\s\S]{0,100}height:\s*20px/, "Bracket badges must use a restrained shared footprint.");
assert.match(simulatorCss, /ucl-opponent-card > \.ucl-team-mark-medium:is\([\s\S]{0,260}data-team-id="porto"[\s\S]{0,300}--ucl-badge-scale:\s*0\.8[\s\S]{0,100}translateY\(-3px\)/, "Tall opponent-list crests such as Porto must stay aligned above the row border.");
assert.match(simulatorCss, /\.ucl-draw-stage\.is-paused[\s\S]{0,500}animation-play-state:\s*paused/, "The draw visuals must show a paused state.");
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active[\s\S]{0,1800}#0b2c72/, "UCL penalty surfaces must use the deep-blue palette.");
engine.TEAM_DATA.forEach((team) => {
  assert.ok(team.badge, `${team.name} must have a badge asset.`);
  const localPath = path.join(root, team.badge.replace(/^\.\//, ""));
  assert.ok(fs.existsSync(localPath), `${team.name}'s badge file must exist at ${team.badge}.`);
});

const cityPlayers = squadData.UCL_FC27_SQUADS["manchester-city"].players;
assert.ok(!cityPlayers.some((player) => player.name === "Jack Grealish"), "Jack Grealish must not remain in Man City's UCL squad.");
assert.ok(!cityPlayers.some((player) => player.name === "Jeremy Monga"), "Jeremy Monga must not be selected in Man City's senior UCL squad.");
assert.ok(!cityPlayers.some((player) => player.name === "Josh Wilson-Esbrand"), "Josh Wilson-Esbrand must not be selected in Man City's senior UCL squad.");
assert.equal(cityPlayers.find((player) => player.name === "Rayan Aït-Nouri")?.startingXI, true, "Rayan Aït-Nouri must replace Wilson-Esbrand at left-back for Man City.");
assert.equal(cityPlayers.find((player) => player.name === "Jérémy Doku")?.startingXI, true, "Jérémy Doku must start at left wing for Man City.");
assert.equal(cityPlayers.find((player) => player.name === "Kalvin Phillips")?.startingXI, false, "Kalvin Phillips must not be selected ahead of City's senior midfield starters.");
assert.ok(cityPlayers.find((player) => player.name === "Kalvin Phillips")?.overall <= 76, "Fallback estimates must not turn Kalvin Phillips into an 85-rated starter.");
const madridPlayers = squadData.UCL_FC27_SQUADS["real-madrid"].players;
assert.equal(madridPlayers.find((player) => player.name === "Thiago Pitarch")?.startingXI, false, "Thiago Pitarch must not start for Real Madrid.");
assert.equal(madridPlayers.find((player) => player.name === "Thiago Pitarch")?.selectionEligible, false, "Thiago Pitarch must be excluded from senior UCL match selection.");
assert.match(appSource, /state\?\.uclSeason \|\| team\.uclClub/, "UCL match selection must retain the installed UCL squad instead of replacing it with the global roster.");
assert.match(appSource, /ucl-lineup-rotation[\s\S]*?rotationTarget[\s\S]*?replacementPool/, "UCL match lineups must rotate zero to two position-compatible players.");
assert.match(engineSource, /homeAttackEdge[\s\S]*?homeRatingWeight = knockout \? 0\.041 : 0\.052[\s\S]*?awayAttackEdge/, "UCL score simulation must preserve realistic squad separation in both league and knockout matches.");
assert.match(engineSource, /function knockoutStrength[\s\S]*?squadDepth[\s\S]*?experience[\s\S]*?function knockoutWinProbability[\s\S]*?penaltyEdge/, "UCL knockout deciders must account for squad strength, depth, experience, and penalty quality.");
assert.match(engineSource, /function temperExtremeScore[\s\S]*?keepChance[\s\S]*?softenedCeiling/, "UCL simulations must soften six-goal and seven-goal team scorelines without removing them entirely.");
assert.match(appSource, /if \(state\?\.uclSeason\)[\s\S]{0,900}ucl-high-score-keep[\s\S]{0,500}ucl-six-goal-ceiling/, "Managed UCL matches must use the same restrained high-score tail.");
assert.match(simulatorSource, /installEngineTeam\(Engine\.team\(teamId\)\)\);\s*window\.repairDefaultKnockoutRosterResults\?\.\(season\)/, "Opening a saved UCL match must repair stale player events against the latest squad.");

assert.match(
  simulatorSource,
  /matchMedia\?\.\("\(prefers-reduced-motion:\s*reduce\)"\)/,
  "The simulator runtime must respect reduced-motion preferences.",
);
assert.match(
  simulatorCss,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
  "The UCL stylesheet must provide a reduced-motion mode.",
);
assert.match(simulatorCss, /body\.pl-match-mode-active\.ucl-match-mode-active[\s\S]{0,1200}#snapshotButton/, "The live UCL skin must own the snapshot button palette.");
assert.doesNotMatch(simulatorCss, /body\.ucl-match-mode-active \.primary-button[\s\S]{0,240}#e3bd5b/, "The live UCL primary action must not use the domestic yellow treatment.");
assert.match(appSource, /const uclSnapshot = Boolean\(state\?\.uclSeason/, "Generated snapshots must detect UCL matches.");
assert.match(appSource, /Generated UCL 26\/27 match snapshot/, "UCL snapshots must use UCL-specific metadata.");

const musicInput = html.match(/<input\b[^>]*\bid="uclMusicFileInput"[^>]*>/)?.[0] || "";
assert.ok(musicInput, "The optional music addon must expose a file input.");
assert.match(musicInput, /\btype="file"/, "The music addon control must be a file input.");
assert.match(
  musicInput,
  /\baccept="(?=[^"]*\.mp3)(?=[^"]*audio\/mpeg)[^"]+"/,
  "The music addon must accept imported MP3 files.",
);
assert.match(html, /Music is optional\./, "The addon UI must clearly say that music is optional.");

Object.entries(squadData.UCL_FC27_SQUADS).forEach(([teamId, squad]) => {
  engine.applySimulationRatings(teamId, squad.simulationRatings);
});
const realismContenders = new Set([
  "real-madrid",
  "manchester-city",
  "bayern-munich",
  "paris-saint-germain",
  "liverpool",
  "barcelona",
  "inter-milan",
  "arsenal",
  "atletico-madrid",
]);
const realismRounds = ["playoffs", "round-of-16", "quarter-finals", "semi-finals", "final"];
let contenderChampions = 0;
let repeatedOutsiderChampions = 0;
let sixGoalTeamScores = 0;
let sevenGoalTeamScores = 0;
const realismMinnows = new Set(["agf-aarhus", "slovan-bratislava", "nk-celje"]);
let minnowLeagueEntries = 0;
let minnowTop24Finishes = 0;
let arsenalBottomFourFinishes = 0;
let arsenalLastPlaceFinishes = 0;
for (let sample = 1; sample <= 240; sample += 1) {
  const realismSeason = engine.createSeason(null, 930000 + sample);
  for (let matchday = 0; matchday < 8; matchday += 1) {
    engine.completeMatchday(realismSeason, matchday);
    realismSeason.league[matchday].forEach((match) => {
      sixGoalTeamScores += Number(Math.max(match.result.home, match.result.away) >= 6);
      sevenGoalTeamScores += Number(Math.max(match.result.home, match.result.away) >= 7);
    });
  }
  engine.leagueTable(realismSeason).forEach((row) => {
    if (realismMinnows.has(row.team.id)) {
      minnowLeagueEntries += 1;
      minnowTop24Finishes += Number(row.position <= 24);
    }
    if (row.team.id === "arsenal") {
      arsenalBottomFourFinishes += Number(row.position >= 33);
      arsenalLastPlaceFinishes += Number(row.position === 36);
    }
  });
  realismRounds.forEach((roundKey) => {
    engine.completeKnockoutRound(realismSeason, roundKey);
    realismSeason.knockout.rounds[roundKey].ties.forEach((tie) => tie.result.legs.forEach((leg) => {
      sixGoalTeamScores += Number(Math.max(leg.home, leg.away) >= 6);
      sevenGoalTeamScores += Number(Math.max(leg.home, leg.away) >= 7);
    }));
  });
  if (realismContenders.has(realismSeason.championId)) contenderChampions += 1;
  if (["rb-leipzig", "porto"].includes(realismSeason.championId)) repeatedOutsiderChampions += 1;
}
assert.ok(contenderChampions >= 192, "Established contenders must win at least 80% of the complete deterministic UCL sample.");
assert.ok(repeatedOutsiderChampions <= 12, "Leipzig and Porto must not collectively exceed 5% of the deterministic realism sample.");
assert.ok(minnowTop24Finishes / minnowLeagueEntries <= 0.27, "Aarhus, Slovan, and Celje must not routinely survive the neutral league phase.");
assert.ok(arsenalBottomFourFinishes <= 2, "Arsenal must remain exceptionally unlikely to finish in the bottom four.");
assert.equal(arsenalLastPlaceFinishes, 0, "Arsenal must not finish last in the deterministic UCL realism sample.");
assert.ok(sixGoalTeamScores <= 180, "A club scoring six or more must remain below 0.4% of the UCL realism sample.");
assert.ok(sevenGoalTeamScores <= 18, "Seven-goal club performances must remain exceptional in the UCL realism sample.");

console.log("UCL league draw, deterministic simulation, knockout progression, and static integration verified.");
