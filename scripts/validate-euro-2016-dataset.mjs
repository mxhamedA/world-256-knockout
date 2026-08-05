import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const datasetPath = join(root, "data/retro/euro-2016/squad-dataset.json");
const source = readFileSync(datasetPath, "utf8");
const dataset = JSON.parse(source);

const expectedGroups = new Map([
  ["France", "Group A"],
  ["Romania", "Group A"],
  ["Albania", "Group A"],
  ["Switzerland", "Group A"],
  ["England", "Group B"],
  ["Russia", "Group B"],
  ["Wales", "Group B"],
  ["Slovakia", "Group B"],
  ["Germany", "Group C"],
  ["Ukraine", "Group C"],
  ["Poland", "Group C"],
  ["Northern Ireland", "Group C"],
  ["Spain", "Group D"],
  ["Czech Republic", "Group D"],
  ["Turkey", "Group D"],
  ["Croatia", "Group D"],
  ["Belgium", "Group E"],
  ["Italy", "Group E"],
  ["Republic of Ireland", "Group E"],
  ["Sweden", "Group E"],
  ["Portugal", "Group F"],
  ["Iceland", "Group F"],
  ["Austria", "Group F"],
  ["Hungary", "Group F"],
]);

const countries = Object.entries(dataset.countries || {});
assert.equal(dataset.tournament, "UEFA Euro 2016");
assert.equal(dataset.ratingDate, "2016-07-10");
assert.equal(countries.length, 24, "Exactly 24 countries are required.");
assert.deepEqual(
  countries.map(([name]) => name),
  [...expectedGroups.keys()],
  "Countries must remain in official group draw order.",
);

const globalNames = new Set();
const replacementLinks = [];
const sourcePositionCounts = {};
let totalPlayers = 0;

for (const [countryName, country] of countries) {
  assert.equal(country.group, expectedGroups.get(countryName), `${countryName}: incorrect group`);
  assert.match(country.formation, /^\d-\d(?:-\d){0,3}$/, `${countryName}: malformed formation`);
  assert.equal(country.players.length, 23, `${countryName}: expected 23 players`);
  totalPlayers += country.players.length;

  const names = new Set();
  const numbers = new Set();
  const captains = [];
  const byNumber = new Map();
  const counts = { GK: 0, DF: 0, MF: 0, FW: 0 };

  for (const player of country.players) {
    assert.ok(player.name && typeof player.name === "string", `${countryName}: missing player name`);
    assert.ok(!names.has(player.name), `${countryName}: duplicated player ${player.name}`);
    assert.ok(!globalNames.has(player.name), `Duplicated cross-country player ${player.name}`);
    names.add(player.name);
    globalNames.add(player.name);

    assert.ok(
      Number.isInteger(player.shirtNumber) && player.shirtNumber >= 1 && player.shirtNumber <= 23,
      `${countryName}/${player.name}: invalid shirt number`,
    );
    assert.ok(!numbers.has(player.shirtNumber), `${countryName}: duplicate shirt ${player.shirtNumber}`);
    numbers.add(player.shirtNumber);
    byNumber.set(player.shirtNumber, player);

    assert.ok(player.primaryPosition, `${countryName}/${player.name}: missing primary position`);
    assert.ok(Array.isArray(player.secondaryPositions), `${countryName}/${player.name}: secondary positions`);
    assert.ok(player.club, `${countryName}/${player.name}: missing 2016 club`);
    assert.ok(["left", "right"].includes(player.preferredFoot), `${countryName}/${player.name}: foot`);
    assert.ok(player.preferredFootReliability, `${countryName}/${player.name}: foot reliability`);

    for (const field of [
      "overall", "pace", "shooting", "passing", "dribbling",
      "defending", "physical", "penaltyTakingAbility",
    ]) {
      assert.ok(
        Number.isInteger(player[field]) && player[field] >= 1 && player[field] <= 99,
        `${countryName}/${player.name}: ${field} must be 1-99`,
      );
    }
    assert.ok(
      typeof player.startingXILikelihood === "number"
        && player.startingXILikelihood >= 0
        && player.startingXILikelihood <= 1,
      `${countryName}/${player.name}: starting likelihood must be 0-1`,
    );
    assert.ok(player.shortRatingJustification.length >= 60, `${countryName}/${player.name}: weak justification`);
    assert.ok(Array.isArray(player.sources) && player.sources.length >= 5, `${countryName}/${player.name}: sources`);
    assert.ok(player.ratingReference && "fifa16" in player.ratingReference, `${countryName}/${player.name}: rating ref`);
    assert.equal(player.tournamentUsage.teamMatches >= 3, true, `${countryName}/${player.name}: usage`);
    assert.equal(player.tournamentUsage.starts <= player.tournamentUsage.teamMatches, true);
    assert.equal(player.tournamentUsage.appearances <= player.tournamentUsage.teamMatches, true);

    if (player.primaryPosition === "GK") {
      assert.ok(player.goalkeeping, `${countryName}/${player.name}: goalkeeper attributes missing`);
      for (const value of Object.values(player.goalkeeping)) {
        assert.ok(Number.isInteger(value) && value >= 1 && value <= 99);
      }
    } else {
      assert.equal(player.goalkeeping, null, `${countryName}/${player.name}: outfielder GK attributes`);
    }

    assert.ok(Object.hasOwn(counts, player.sourcePosition), `${countryName}/${player.name}: source position`);
    counts[player.sourcePosition] += 1;
    if (player.captain) captains.push(player.name);
    if (player.officialReplacement) replacementLinks.push(player.officialReplacement);
  }

  assert.deepEqual([...numbers].sort((a, b) => a - b), Array.from({ length: 23 }, (_, i) => i + 1));
  assert.equal(counts.GK, 3, `${countryName}: official squad must contain three goalkeepers`);
  assert.ok(counts.DF >= 5, `${countryName}: insufficient defender coverage`);
  assert.ok(counts.MF >= 4, `${countryName}: insufficient midfield coverage`);
  assert.ok(counts.FW >= 2, `${countryName}: insufficient forward coverage`);
  sourcePositionCounts[countryName] = counts;

  assert.equal(captains.length, 1, `${countryName}: exactly one captain expected`);
  assert.equal(country.captain, captains[0], `${countryName}: captain field mismatch`);

  assert.equal(country.likelyStartingXI.length, 11, `${countryName}: likely XI must have 11 players`);
  const xiNumbers = new Set();
  for (const starter of country.likelyStartingXI) {
    const player = byNumber.get(starter.shirtNumber);
    assert.ok(player, `${countryName}: XI shirt ${starter.shirtNumber} not in squad`);
    assert.equal(player.name, starter.name, `${countryName}: XI player-number mismatch`);
    assert.ok(!xiNumbers.has(starter.shirtNumber), `${countryName}: duplicated XI player`);
    xiNumbers.add(starter.shirtNumber);
  }
  assert.equal(
    country.likelyStartingXI.filter((starter) => starter.position === "GK").length,
    1,
    `${countryName}: likely XI must have one goalkeeper`,
  );

  assert.equal(country.penaltyTakers.length, 5, `${countryName}: five preferred penalty takers required`);
  assert.equal(new Set(country.penaltyTakers).size, 5, `${countryName}: duplicate penalty taker`);
  for (const taker of country.penaltyTakers) {
    assert.ok(names.has(taker), `${countryName}: penalty taker ${taker} is not in final squad`);
  }

  for (const [key, value] of Object.entries(country.teamRatings)) {
    assert.ok(Number.isInteger(value) && value >= 1 && value <= 99, `${countryName}: team rating ${key}`);
  }
  assert.deepEqual(
    Object.keys(country.teamRatings),
    ["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"],
  );
}

assert.equal(totalPlayers, 552, "Exactly 552 final-squad players are required.");
assert.equal(dataset.officialReplacements.length, 7, "Expected seven approved incoming replacements.");
assert.equal(replacementLinks.length, 7, "Every incoming replacement must be linked to its player.");
assert.deepEqual(
  replacementLinks.map((entry) => `${entry.team}:${entry.in}`).sort(),
  dataset.officialReplacements.map((entry) => `${entry.team}:${entry.in}`).sort(),
);

for (const replacement of dataset.officialReplacements) {
  const roster = dataset.countries[replacement.team].players;
  assert.ok(roster.some((player) => player.name === replacement.in), `${replacement.in} missing`);
  assert.ok(!roster.some((player) => player.name === replacement.out), `${replacement.out} must be excluded`);
}

const expectedTopEight = new Set([
  "France", "Germany", "Spain", "Belgium", "Portugal", "Italy", "England", "Croatia",
]);
const actualTopEight = new Set(
  countries
    .toSorted(([, a], [, b]) => b.teamRatings.overall - a.teamRatings.overall)
    .slice(0, 8)
    .map(([name]) => name),
);
assert.deepEqual(actualTopEight, expectedTopEight, "Requested strongest-team band is not preserved.");

assert.ok(
  dataset.sourceCoverage.fifa16 >= 450,
  "FIFA 16 must remain the numerical starting point for the large majority of players.",
);
assert.ok(
  dataset.sourceCoverage.manual <= 40,
  "Too many players rely on manual period estimates.",
);
assert.doesNotMatch(
  source,
  /\b(2019\/20|2020\/21|2021\/22|2022\/23|2023\/24|2024\/25|2025\/26)\b/,
  "Modern-season leakage detected.",
);

const sha256 = createHash("sha256").update(source).digest("hex").toUpperCase();
console.log(JSON.stringify({
  status: "PASS",
  countries: countries.length,
  players: totalPlayers,
  groups: 6,
  officialReplacements: replacementLinks.length,
  fifa16Matches: dataset.sourceCoverage.fifa16,
  fifa17Crosschecks: dataset.sourceCoverage.fifa17,
  manualPeriodEstimates: dataset.sourceCoverage.manual,
  sha256,
  sourcePositionCounts,
}, null, 2));
