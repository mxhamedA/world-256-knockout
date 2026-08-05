import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datasetPath = path.join(root, "data/retro/2022/squad-dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

const expectedGroups = {
  A: ["Qatar", "Ecuador", "Senegal", "Netherlands"],
  B: ["England", "Iran", "USA", "Wales"],
  C: ["Argentina", "Saudi Arabia", "Mexico", "Poland"],
  D: ["France", "Australia", "Denmark", "Tunisia"],
  E: ["Spain", "Costa Rica", "Germany", "Japan"],
  F: ["Belgium", "Canada", "Morocco", "Croatia"],
  G: ["Brazil", "Serbia", "Switzerland", "Cameroon"],
  H: ["Portugal", "Ghana", "Uruguay", "South Korea"],
};
const allowedPositions = new Set([
  "GK", "CB", "RB", "LB", "RWB", "LWB", "CDM", "CM", "CAM",
  "RM", "LM", "RW", "LW", "CF", "SS", "ST",
]);
const outfieldAttributes = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];
const goalkeepingAttributes = ["diving", "handling", "kicking", "positioning", "reflexes"];
const teamRatingFields = [
  "overall", "attack", "midfield", "defence", "goalkeeper",
  "squadDepth", "experience", "penalties", "discipline",
];
const forbiddenFinalSquadPlayers = new Set([
  "Sadio Mané", "Nicolás González", "Joaquín Correa", "Bartłomiej Drągowski",
  "Fahad Al-Muwallad", "Martin Boyle", "Presnel Kimpembe", "Christopher Nkunku",
  "Yūta Nakayama", "José Gayà", "Amine Harit",
]);

assert.equal(dataset.schemaVersion, 1);
assert.equal(dataset.tournament, "2022 FIFA World Cup");
assert.equal(dataset.ratingDate, "2022-12-18");
assert.equal(dataset.ratingWindow, "November-December 2022");
assert.equal(Object.keys(dataset.countries).length, 32, "dataset must contain exactly 32 countries");

const expectedCountryOrder = Object.values(expectedGroups).flat();
assert.deepEqual(Object.keys(dataset.countries), expectedCountryOrder, "countries must be grouped in official draw order");

let playerTotal = 0;
const globalNames = new Set();
const ratingPlayerIds = new Map();
const sourceCounts = {
  fifa23_pre_tournament_ratings: 0,
  fifa22_end_of_cycle_ratings: 0,
  manual_period_rating_review: 0,
};

for (const [group, expectedTeams] of Object.entries(expectedGroups)) {
  const actualTeams = Object.entries(dataset.countries)
    .filter(([, country]) => country.group === `Group ${group}`)
    .map(([team]) => team);
  assert.deepEqual(actualTeams, expectedTeams, `Group ${group} must match the official draw`);
}

for (const [team, country] of Object.entries(dataset.countries)) {
  const expectedSize = team === "Iran" ? 25 : 26;
  assert.equal(country.players.length, expectedSize, `${team} must preserve its official squad size`);
  playerTotal += country.players.length;

  assert.ok(country.coach, `${team} must have a coach`);
  assert.match(country.formation, /^\d(?:-\d){2,4}$/, `${team} must have a valid formation`);
  assert.equal(country.likelyStartingXI.length, 11, `${team} must have an 11-player likely XI`);
  assert.ok(country.penaltyTakers.length >= 1, `${team} must have a penalty-taker order`);

  for (const field of teamRatingFields) {
    assert.ok(Number.isInteger(country.teamRatings[field]), `${team} ${field} must be an integer`);
    assert.ok(country.teamRatings[field] >= 1 && country.teamRatings[field] <= 99, `${team} ${field} must be 1-99`);
  }

  const numbers = new Set();
  const names = new Set();
  let captainCount = 0;
  let goalkeeperCount = 0;

  for (const player of country.players) {
    assert.ok(player.name && !/[ÃÂ�]/u.test(player.name), `${team} has a missing or mojibake player name`);
    assert.ok(!forbiddenFinalSquadPlayers.has(player.name), `${player.name} was replaced and must not remain in the final squad`);
    assert.ok(!names.has(player.name), `${team} repeats ${player.name}`);
    assert.ok(!globalNames.has(player.name), `player identity ${player.name} appears for more than one country`);
    names.add(player.name);
    globalNames.add(player.name);

    assert.ok(Number.isInteger(player.shirtNumber) && player.shirtNumber >= 1 && player.shirtNumber <= 26);
    assert.ok(!numbers.has(player.shirtNumber), `${team} repeats shirt number ${player.shirtNumber}`);
    numbers.add(player.shirtNumber);

    assert.ok(allowedPositions.has(player.primaryPosition), `${team}: ${player.name} has an invalid primary position`);
    assert.equal(new Set(player.secondaryPositions).size, player.secondaryPositions.length, `${team}: ${player.name} repeats a secondary position`);
    assert.ok(!player.secondaryPositions.includes(player.primaryPosition), `${team}: ${player.name} repeats the primary position`);
    player.secondaryPositions.forEach((position) => assert.ok(allowedPositions.has(position), `${team}: ${player.name} has invalid secondary position ${position}`));
    assert.ok(["GK", "DF", "MF", "FW"].includes(player.sourcePosition));
    assert.ok(player.club && !/[ÃÂ�]/u.test(player.club), `${team}: ${player.name} must have a clean tournament-time club`);
    assert.match(player.dateOfBirth, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isInteger(player.caps) && player.caps >= 0);
    assert.ok(Number.isInteger(player.internationalGoals) && player.internationalGoals >= 0);
    assert.ok(Number.isInteger(player.worldCupGoals) && player.worldCupGoals >= 0);
    assert.ok(["left", "right"].includes(player.preferredFoot));
    assert.ok(player.preferredFootReliability);

    assert.ok(Number.isInteger(player.overall) && player.overall >= 58 && player.overall <= 94);
    for (const field of outfieldAttributes) {
      assert.ok(Number.isInteger(player[field]) && player[field] >= 1 && player[field] <= 99, `${team}: ${player.name} has invalid ${field}`);
    }
    assert.ok(player.startingXILikelihood >= 0.08 && player.startingXILikelihood <= 0.98);
    assert.ok(Number.isInteger(player.penaltyTakingAbility) && player.penaltyTakingAbility >= 1 && player.penaltyTakingAbility <= 99);
    assert.ok(player.shortRatingJustification.length >= 80);
    assert.ok(player.sources.includes("fifa_official_squad_2022"));
    assert.ok(player.sources.includes("worldcup_match_usage_2022"));

    if (player.primaryPosition === "GK") {
      goalkeeperCount += 1;
      assert.ok(player.goalkeeping, `${team}: ${player.name} must have goalkeeping attributes`);
      for (const field of goalkeepingAttributes) {
        assert.ok(Number.isInteger(player.goalkeeping[field]) && player.goalkeeping[field] >= 1 && player.goalkeeping[field] <= 99);
      }
    } else {
      assert.equal(player.goalkeeping, null, `${team}: ${player.name} must not have goalkeeping attributes`);
    }

    if (player.captain) {
      captainCount += 1;
      assert.equal(player.name, country.captain, `${team}'s captain marker must match the team captain`);
    }

    const referenceSource = player.ratingReference.source;
    assert.ok(referenceSource in sourceCounts, `${team}: ${player.name} has an unsupported rating source`);
    sourceCounts[referenceSource] += 1;
    if (player.ratingReference.playerId !== null) {
      assert.ok(!ratingPlayerIds.has(player.ratingReference.playerId), `FIFA player id ${player.ratingReference.playerId} is assigned twice`);
      ratingPlayerIds.set(player.ratingReference.playerId, `${team}: ${player.name}`);
      assert.ok(player.ratingReference.sourceName);
      assert.ok(player.ratingReference.matchScore >= 1);
    }
  }

  const expectedGoalkeepers = ["Iran", "Switzerland", "Tunisia"].includes(team) ? 4 : 3;
  assert.equal(goalkeeperCount, expectedGoalkeepers, `${team} must preserve its official goalkeeper count`);
  assert.equal(captainCount, 1, `${team} must have exactly one captain`);

  const playerByNumber = new Map(country.players.map((player) => [player.shirtNumber, player]));
  const lineupNumbers = country.likelyStartingXI.map((entry) => entry.shirtNumber);
  assert.equal(new Set(lineupNumbers).size, 11, `${team}'s likely XI must not repeat players`);
  country.likelyStartingXI.forEach((entry) => {
    const player = playerByNumber.get(entry.shirtNumber);
    assert.ok(player, `${team}'s likely XI references missing shirt ${entry.shirtNumber}`);
    assert.equal(entry.name, player.name, `${team}'s likely XI name must match its shirt number`);
    assert.ok(allowedPositions.has(entry.position));
  });
  assert.equal(country.likelyStartingXI.filter((entry) => entry.position === "GK").length, 1, `${team}'s likely XI must have one goalkeeper`);
  assert.ok(country.likelyStartingXI.filter((entry) => ["CB", "RB", "LB", "RWB", "LWB"].includes(entry.position)).length >= 3, `${team}'s likely XI needs defensive coverage`);

  country.penaltyTakers.forEach((taker) => {
    assert.ok(country.players.some((player) => player.name === taker), `${team} penalty taker ${taker} is not in the official squad`);
  });
}

assert.equal(playerTotal, 831, "official tournament total must be 831 players");
assert.equal(Object.values(dataset.countries).flatMap((country) => country.players).reduce((sum, player) => sum + player.worldCupGoals, 0), 170, "player goals must exclude the two own goals");
assert.deepEqual(sourceCounts, {
  fifa23_pre_tournament_ratings: 723,
  fifa22_end_of_cycle_ratings: 36,
  manual_period_rating_review: 72,
});

assert.equal(dataset.officialReplacements.length, 11);
const markedReplacements = Object.entries(dataset.countries)
  .flatMap(([team, country]) => country.players
    .filter((player) => player.officialReplacement)
    .map((player) => `${team}|${player.name}`));
assert.equal(markedReplacements.length, 11);
for (const replacement of dataset.officialReplacements) {
  assert.ok(markedReplacements.includes(`${replacement.team}|${replacement.in}`));
}

assert.ok(dataset.countries.France.players.some((player) => player.name === "Karim Benzema"), "Benzema remained on the unreplaced official list");
assert.equal(dataset.countries.Argentina.teamRatings.overall, 92);
assert.equal(dataset.countries.France.teamRatings.overall, 92);
assert.equal(dataset.countries.Brazil.teamRatings.overall, 91);
assert.equal(dataset.countries.Qatar.teamRatings.overall, 72);
assert.equal(dataset.countries["Saudi Arabia"].teamRatings.overall, 72);
assert.equal(dataset.countries.Argentina.players.find((player) => player.name === "Lionel Messi").overall, 93);
assert.equal(dataset.countries.France.players.find((player) => player.name === "Kylian Mbappé").overall, 93);

console.log("Qatar 2022 dataset validation passed.");
console.log(`Countries: 32 | Players: ${playerTotal} | FIFA 23: ${sourceCounts.fifa23_pre_tournament_ratings} | FIFA 22 fallback: ${sourceCounts.fifa22_end_of_cycle_ratings} | Manual review: ${sourceCounts.manual_period_rating_review}`);
