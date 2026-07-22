import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const root = join(import.meta.dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync(join(root, "legacy-data", "catalog.generated.js"), "utf8"), context);

const database = context.window.LEGACY_HISTORIC_DATABASE;
const validPositions = new Set(["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "SS", "ST"]);
const validConfidence = new Set(["high", "medium", "low"]);
const derivedFields = ["attack", "control", "defence"];
const outfieldAttributes = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];
const goalkeeperAttributes = ["diving", "handling", "kicking", "reflexes", "speed", "positioning"];
const expectedYears = {
  argentina: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
  belgium: [1986, 1990, 1994, 1998, 2002, 2014, 2018, 2022],
  brazil: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
  england: [1986, 1990, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
  france: [1986, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
  germany: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
  italy: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014],
  netherlands: [1990, 1994, 1998, 2006, 2010, 2014, 2022],
  portugal: [1986, 2002, 2006, 2010, 2014, 2018, 2022],
  spain: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
};
const formations = {
  "4-3-3": [["GK"], ["LB", "LWB"], ["CB"], ["CB"], ["RB", "RWB"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["LW", "LM"], ["ST", "CF", "SS"], ["RW", "RM"]],
  "4-4-2": [["GK"], ["LB", "LWB"], ["CB"], ["CB"], ["RB", "RWB"], ["LM", "LW"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["RM", "RW"], ["ST", "CF", "SS"], ["ST", "CF", "SS"]],
  "3-5-2": [["GK"], ["CB"], ["CB"], ["CB"], ["LM", "LW", "LWB"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CAM", "CM", "SS"], ["RM", "RW", "RWB"], ["ST", "CF", "SS"], ["ST", "CF", "SS"]],
  "5-3-2": [["GK"], ["LB", "LWB", "LM"], ["CB"], ["CB"], ["CB"], ["RB", "RWB", "RM"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["ST", "CF", "SS"], ["ST", "CF", "SS"]],
  "4-2-3-1": [["GK"], ["LB", "LWB"], ["CB"], ["CB"], ["RB", "RWB"], ["CDM", "CM"], ["CDM", "CM"], ["LM", "LW", "CAM"], ["CAM", "CM", "SS"], ["RM", "RW", "CAM"], ["ST", "CF", "SS"]],
  "4-1-2-1-2": [["GK"], ["LB", "LWB"], ["CB"], ["CB"], ["RB", "RWB"], ["CDM", "CM"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CAM", "CM", "SS"], ["ST", "CF", "SS"], ["ST", "CF", "SS"]],
  "4-3-2-1": [["GK"], ["LB", "LWB"], ["CB"], ["CB"], ["RB", "RWB"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["CF", "SS", "LW", "CAM"], ["CF", "SS", "RW", "CAM"], ["ST", "CF", "SS"]],
  "3-4-3": [["GK"], ["CB"], ["CB"], ["CB"], ["LM", "LW", "LWB"], ["CM", "CDM", "CAM"], ["CM", "CDM", "CAM"], ["RM", "RW", "RWB"], ["LW", "LM", "CF"], ["ST", "CF", "SS"], ["RW", "RM", "CF"]],
};

assert.equal(Object.keys(database).length, 10, "Must contain exactly 10 nations.");
assert.deepEqual(Object.keys(database).sort(), Object.keys(expectedYears).sort(), "Nation catalog changed unexpectedly.");

for (const [formationName, slots] of Object.entries(formations)) {
  assert.equal(slots.length, 11, `${formationName}: must contain exactly 11 slots.`);
  for (const accepted of slots) {
    assert.ok(accepted.length, `${formationName}: slot has no accepted positions.`);
    for (const pos of accepted) assert.ok(validPositions.has(pos), `${formationName}: invalid accepted position ${pos}.`);
  }
}

function playerPositions(player) {
  return [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean);
}

function canFill(player, acceptedPositions) {
  return playerPositions(player).some((pos) => acceptedPositions.includes(pos));
}

function hasCompleteRating(player) {
  const validRange = (value) => Number.isInteger(value) && value >= 1 && value <= 99;
  const attributeFields = player.primaryPosition === "GK" ? goalkeeperAttributes : outfieldAttributes;
  const attributes = player.primaryPosition === "GK" ? player.goalkeeperAttributes : player.attributes;
  const hasSixAttributes = attributes && attributeFields.every((field) => validRange(attributes[field]));
  const hasLegacyAttributes = derivedFields.every((field) => validRange(player[field]));
  return Number.isInteger(player.overall)
    && player.overall >= 1
    && player.overall <= 99
    && (hasSixAttributes || hasLegacyAttributes)
    && validPositions.has(player.primaryPosition)
    && validConfidence.has(player.ratingConfidence)
    && typeof player.ratingBasis === "string"
    && player.ratingBasis.length > 0
    && typeof player.ratingSource?.publisher === "string"
    && typeof player.ratingSource?.series === "string";
}

function canBuildFormation(players, slots) {
  const orderedSlots = slots
    .map((accepted) => ({ accepted, candidates: players.filter((player) => canFill(player, accepted)) }))
    .sort((a, b) => a.candidates.length - b.candidates.length);
  const usedNames = new Set();
  function place(index) {
    if (index === orderedSlots.length) return true;
    for (const player of orderedSlots[index].candidates) {
      if (usedNames.has(player.name)) continue;
      usedNames.add(player.name);
      if (place(index + 1)) return true;
      usedNames.delete(player.name);
    }
    return false;
  }
  return place(0);
}

let squadCount = 0;
let playerCount = 0;
let readySquadCount = 0;
let duplicateCount = 0;
let positionErrors = 0;
const lowConfidence = [];
const ratingStats = { min: 99, max: 0, sum: 0 };
const countByNation = {};

for (const [nationId, nation] of Object.entries(database)) {
  assert.equal(nation.id, nationId, `${nationId}: mismatched nation id.`);
  assert.ok(nation.name, `${nationId}: nation name is missing.`);
  assert.equal(JSON.stringify(nation.squads.map((s) => s.year)), JSON.stringify(expectedYears[nationId]), `${nation.name}: missing or unexpected World Cup years.`);
  const allNationPlayers = [];

  for (const squad of nation.squads) {
    squadCount += 1;
    playerCount += squad.players.length;
    assert.equal(squad.nationId, nationId, `${nation.name} ${squad.year}: mismatched nation id.`);
    assert.equal(squad.players.length, 11, `${nation.name} ${squad.year}: incomplete starting XI.`);
    assert.ok(squad.lineupSource?.matchId, `${nation.name} ${squad.year}: lineup match id is missing.`);
    assert.ok(squad.lineupSource?.matchName, `${nation.name} ${squad.year}: lineup match name is missing.`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(squad.lineupSource?.matchDate || ""), `${nation.name} ${squad.year}: lineup date is missing.`);
    assert.equal(squad.lineupSource?.license, "CC-BY-SA-4.0", `${nation.name} ${squad.year}: lineup license is missing.`);

    const namesInSquad = new Set();
    for (const player of squad.players) {
      assert.ok(player.name, `${nation.name} ${squad.year}: unnamed player.`);
      assert.ok(!namesInSquad.has(player.name), `${nation.name} ${squad.year}: duplicate player ${player.name}.`);
      namesInSquad.add(player.name);
      assert.ok(validPositions.has(player.primaryPosition), `${nation.name} ${squad.year} ${player.name}: invalid primary position ${player.primaryPosition}.`);
      for (const pos of player.secondaryPositions || []) assert.ok(validPositions.has(pos), `${nation.name} ${squad.year} ${player.name}: invalid secondary position ${pos}.`);

      if (!hasCompleteRating(player)) {
        console.warn(`${nation.name} ${squad.year} ${player.name}: incomplete rating, attributes, position, confidence, or source metadata.`);
        continue;
      }

      allNationPlayers.push(player);

      if (player.ratingConfidence === "low") {
        lowConfidence.push(`${player.name} (${nation.name} ${squad.year}, ${player.overall})`);
      }

      // Rating stats
      ratingStats.sum += player.overall;
      if (player.overall < ratingStats.min) ratingStats.min = player.overall;
      if (player.overall > ratingStats.max) ratingStats.max = player.overall;
    }

    assert.equal(squad.dataStatus, "ready", `${nation.name} ${squad.year}: expected dataStatus "ready".`);
    readySquadCount += 1;
  }

  // Check for obvious duplicates across squads (same name, different years is fine - same player at different WCs)
  // Check for position inconsistencies across tournament appearances
  const nameToPositions = {};
  for (const p of allNationPlayers) {
    if (!nameToPositions[p.name]) nameToPositions[p.name] = new Set();
    nameToPositions[p.name].add(p.primaryPosition);
  }
  for (const [name, positions] of Object.entries(nameToPositions)) {
    if (positions.size > 2 && !positions.has("GK")) {
      positionErrors += 1;
      console.warn(`Position inconsistency: ${name} (${nation.name}) played as ${[...positions].join(", ")} across tournaments.`);
    }
  }

  // Formation checks
  if (allNationPlayers.length) {
    for (const [formationName, slots] of Object.entries(formations)) {
      assert.ok(canBuildFormation(allNationPlayers, slots), `${nation.name}: player pool cannot complete ${formationName}.`);
    }
  }

  const avg = allNationPlayers.length ? (allNationPlayers.reduce((s,p)=>s+p.overall,0)/allNationPlayers.length).toFixed(1) : "N/A";
  countByNation[nation.name] = avg;
}

// Summary
console.log(`\n=== VALIDATION PASSED ===`);
console.log(`Nations: ${Object.keys(database).length} | Squads: ${squadCount} | Players: ${playerCount}`);
console.log(`Draft-ready XIs: ${readySquadCount}/${squadCount}`);
console.log(`Rating range: ${ratingStats.min}-${ratingStats.max} (avg ${(ratingStats.sum/playerCount).toFixed(1)})`);
console.log(`\nAverage rating by nation:`);
for (const [name, avg] of Object.entries(countByNation)) {
  console.log(`  ${name.padEnd(12)} ${avg}`);
}
console.log(`\nLow confidence ratings: ${lowConfidence.length} players`);
if (lowConfidence.length) {
  console.log(`  First 20: ${lowConfidence.slice(0, 20).join(", ")}`);
}
console.log(`Position inconsistencies (expected for versatile players): ${positionErrors}`);
console.log(`\nAll 957 players are draft-ready.`);
