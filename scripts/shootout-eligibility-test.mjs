import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist.`);
  const open = app.indexOf("{", start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < app.length; index += 1) {
    const character = app[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return app.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}.`);
}

const profiles = Array.from({ length: 14 }, (_, index) => ({
  name: index < 11 ? `Starter ${index + 1}` : `Bench ${index - 10}`,
  position: index === 0 ? "GK" : index < 6 ? "CB" : "ST",
  finishing: 70 + index,
  overall: 75 + index,
  startingXI: index < 11,
  penaltyTaker: index === 10,
}));
const context = {
  playerProfilesForTeam: () => profiles,
  retroShootoutActiveNames: () => profiles.slice(0, 11).map((profile) => profile.name),
  shootoutPosition: (_team, profile) => profile.position,
  shootoutPositionPriority: (position) => position === "ST" ? 0 : position === "GK" ? 99 : 5,
};
vm.createContext(context);
vm.runInContext(`
  ${functionSource("shootoutTakerPool")}
  ${functionSource("shootoutUnavailablePlayers")}
  globalThis.pool = shootoutTakerPool;
  globalThis.unavailable = shootoutUnavailablePlayers;
`, context);

const unavailable = context.unavailable({
  suspendedPlayers: { home: ["Starter 2"], away: [] },
  injuries: [
    { side: "home", player: "Starter 3" },
    { side: "away", player: "Starter 4" },
  ],
}, "home");
const pool = context.pool(
  { id: "retro-home", name: "Home", rating: 80 },
  unavailable,
  ["Starter 4"],
);

assert.ok(!pool.includes("Starter 2"), "A suspended player cannot take a penalty.");
assert.ok(!pool.includes("Starter 3"), "An injured player cannot take a penalty.");
assert.ok(!pool.includes("Starter 4"), "A sent-off player cannot take a penalty.");
assert.ok(!pool.some((name) => name.startsWith("Bench")), "Unused substitutes cannot enter the shootout taker pool.");
assert.equal(pool.length, 8, "Only the eligible players left on the pitch should remain.");
assert.match(
  app,
  /retroFinalManagement\?\.\[team\.id\]/,
  "The final live XI must be used after substitutions.",
);
assert.match(
  app,
  /shootoutUnavailablePlayers\(result,\s*"home"\)/,
  "Interactive World Cup shootouts must include match injuries.",
);

console.log("World Cup shootout on-pitch eligibility checks passed.");
