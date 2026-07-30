import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(
  app,
  /function managedDefaultFinalSkipsThirdPlace\([\s\S]*?!state\.customTournament[\s\S]*?state\.spectateTeamId[\s\S]*?!state\.neutralView/,
  "Only a managed default knockout should skip the forced third-place viewing flow.",
);
assert.match(
  app,
  /const defaultManagedFinalIndex = state\.activeRound === tournamentFinalRoundIndex\(\)[\s\S]*?!isThirdPlacePlayoff\(match\)[\s\S]*?match\.homeId === team\.id/,
  "A managed semi-final winner, including retro modes, must select their final instead of the third-place fixture.",
);
assert.match(
  app,
  /if \(managedDefaultFinalSkipsThirdPlace\(match\)\)[\s\S]*?thirdPlaceMatch\.result = simulateMatch[\s\S]*?thirdPlaceMatch\.result\.revealed = true/,
  "Starting the final must simulate and reveal the unplayed third-place fixture in the background.",
);
assert.match(
  app,
  /state\.activeRound === tournamentFinalRoundIndex\(\)[\s\S]*?isThirdPlacePlayoff\(match\)[\s\S]*?showToast\("The final is ready\."\)/,
  "Watching the third-place match manually must continue to the final without simulating it.",
);

console.log("Managed third-place flow checks passed.");
