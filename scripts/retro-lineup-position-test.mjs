import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Math, Object, Set, Map });
const squadFiles = [
  "retro-2010-squads.js",
  "retro-2014-squads.js",
  "retro-euro-2016-squads.js",
  "retro-2018-squads.js",
  "retro-2022-squads.js",
];
squadFiles.forEach((file) => vm.runInContext(readFileSync(join(root, file), "utf8"), context));

const app = readFileSync(join(root, "app.js"), "utf8");
const helperStart = app.indexOf("const RETRO_MANAGER_SLOT_POSITIONS");
const helperEnd = app.indexOf("function retroSelectAvailableStarterNumbers");
assert.ok(helperStart >= 0 && helperEnd > helperStart);
vm.runInContext(`${app.slice(helperStart, helperEnd)}
globalThis.__lineup = {
  slots: RETRO_MANAGER_SLOT_POSITIONS,
  select: retroSelectBestStarterNumbers,
  score: retroPlayerSlotAssignmentScore,
};
globalThis.__squadsByYear = {
  2010: RETRO_2010_SQUADS,
  2014: RETRO_2014_SQUADS,
  2016: RETRO_EURO_2016_SQUADS,
  2018: RETRO_2018_SQUADS,
  2022: RETRO_2022_SQUADS,
};`, context);

let teamCount = 0;
Object.entries(context.__squadsByYear).forEach(([year, squads]) => {
  Object.entries(squads).forEach(([team, squad]) => {
    const slots = context.__lineup.slots[squad.formation];
    assert.ok(slots, `${year} ${team} needs a supported ${squad.formation} formation`);
    const numbers = context.__lineup.select(squad.players, squad.startingXI, squad.formation);
    assert.equal(numbers.length, 11, `${year} ${team} should have 11 selected starters`);
    assert.equal(new Set(numbers).size, 11, `${year} ${team} should not repeat a starter`);
    numbers.forEach((number, slotIndex) => {
      const player = squad.players.find((candidate) => candidate.number === number);
      assert.ok(player, `${year} ${team} starter ${number} must belong to the squad`);
      assert.ok(
        context.__lineup.score(player, slots[slotIndex]) >= 100,
        `${year} ${team}: ${player.name} must be credible at ${slots[slotIndex]}`,
      );
    });
    teamCount += 1;
  });
});

const england = context.__squadsByYear[2016].England;
const englandNumbers = context.__lineup.select(england.players, england.startingXI, "4-3-3");
const englandSlots = context.__lineup.slots["4-3-3"];
const englandPlayerAt = (slot) => england.players.find(
  (player) => player.number === englandNumbers[englandSlots.indexOf(slot)],
);
assert.equal(englandPlayerAt("LW")?.name, "Raheem Sterling", "Sterling should start on the left wing.");
assert.equal(englandPlayerAt("ST")?.name, "Harry Kane", "Kane should start through the middle.");
assert.ok(
  [englandPlayerAt("RW")?.position, ...(englandPlayerAt("RW")?.positions || [])].includes("RW"),
  "England's right winger should have RW among his listed positions.",
);

const wingerPrioritySquad = [
  { number: 1, name: "Keeper", position: "GK", positions: ["GK"], squadGroup: "GK", overall: 80 },
  { number: 2, name: "Left back", position: "LB", positions: ["LB"], squadGroup: "DF", overall: 80 },
  { number: 3, name: "Centre back one", position: "CB", positions: ["CB"], squadGroup: "DF", overall: 80 },
  { number: 4, name: "Centre back two", position: "CB", positions: ["CB"], squadGroup: "DF", overall: 80 },
  { number: 5, name: "Right back", position: "RB", positions: ["RB"], squadGroup: "DF", overall: 80 },
  { number: 6, name: "Midfielder one", position: "CM", positions: ["CM"], squadGroup: "MF", overall: 80 },
  { number: 7, name: "Midfielder two", position: "CM", positions: ["CM"], squadGroup: "MF", overall: 80 },
  { number: 8, name: "Midfielder three", position: "CM", positions: ["CM"], squadGroup: "MF", overall: 80 },
  { number: 9, name: "Natural left midfielder", position: "LM", positions: ["LM"], squadGroup: "MF", overall: 78 },
  { number: 10, name: "Natural right midfielder", position: "RM", positions: ["RM"], squadGroup: "MF", overall: 78 },
  { number: 11, name: "Centre forward", position: "ST", positions: ["ST"], squadGroup: "FW", overall: 84 },
  { number: 12, name: "Extra striker one", position: "ST", positions: ["ST"], squadGroup: "FW", overall: 86 },
  { number: 13, name: "Extra striker two", position: "ST", positions: ["ST"], squadGroup: "FW", overall: 85 },
];
const wingerPriorityNumbers = context.__lineup.select(
  wingerPrioritySquad,
  wingerPrioritySquad.slice(0, 11).map((player) => player.number),
  "4-3-3",
);
const wingerPrioritySlots = context.__lineup.slots["4-3-3"];
assert.equal(
  wingerPrioritySquad.find((player) => player.number === wingerPriorityNumbers[wingerPrioritySlots.indexOf("LW")])?.position,
  "LM",
  "A natural LM should be preferred at LW over an extra striker.",
);
assert.equal(
  wingerPrioritySquad.find((player) => player.number === wingerPriorityNumbers[wingerPrioritySlots.indexOf("RW")])?.position,
  "RM",
  "A natural RM should be preferred at RW over an extra striker.",
);

const midfieldPrioritySquad = [
  { number: 1, name: "Keeper", position: "GK", positions: ["GK"], squadGroup: "GK", overall: 80 },
  { number: 2, name: "Left back", position: "LB", positions: ["LB"], squadGroup: "DF", overall: 80 },
  { number: 3, name: "Centre back one", position: "CB", positions: ["CB"], squadGroup: "DF", overall: 80 },
  { number: 4, name: "Centre back two", position: "CB", positions: ["CB"], squadGroup: "DF", overall: 80 },
  { number: 5, name: "Right back", position: "RB", positions: ["RB"], squadGroup: "DF", overall: 80 },
  { number: 6, name: "Holding midfielder", position: "CDM", positions: ["CDM"], squadGroup: "MF", overall: 80 },
  { number: 7, name: "Left creator", position: "CAM", positions: ["CAM"], squadGroup: "MF", overall: 82 },
  { number: 8, name: "Right creator", position: "CAM", positions: ["CAM"], squadGroup: "MF", overall: 81 },
  { number: 9, name: "Left winger", position: "LW", positions: ["LW"], squadGroup: "FW", overall: 80 },
  { number: 10, name: "Striker", position: "ST", positions: ["ST"], squadGroup: "FW", overall: 80 },
  { number: 11, name: "Right winger", position: "RW", positions: ["RW"], squadGroup: "FW", overall: 80 },
];
const midfieldPriorityNumbers = context.__lineup.select(
  midfieldPrioritySquad,
  midfieldPrioritySquad.map((player) => player.number),
  "4-3-3",
);
const midfieldPlayerAt = (slot) => midfieldPrioritySquad.find(
  (player) => player.number === midfieldPriorityNumbers[context.__lineup.slots["4-3-3"].indexOf(slot)],
);
assert.equal(midfieldPlayerAt("CM")?.position, "CDM", "The holding midfielder should occupy the central midfield slot.");
assert.equal(midfieldPlayerAt("LCM")?.position, "CAM", "A CAM used in midfield should favour a side slot.");
assert.equal(midfieldPlayerAt("RCM")?.position, "CAM", "A second CAM should favour the other side slot.");

console.log(`Retro lineup positions passed for ${teamCount} teams across every managed edition.`);
