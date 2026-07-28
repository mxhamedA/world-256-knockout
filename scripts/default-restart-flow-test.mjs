import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

const restartHandler = app.match(
  /\$\("#confirmResetButton"\)\.addEventListener\("click", \(\) => \{([\s\S]*?)\n\}\);/,
)?.[1] || "";

assert.match(restartHandler, /const wasDefaultKnockout = Boolean\(/);
assert.match(restartHandler, /const returnToSetup = els\.resetModal\.dataset\.returnToSetup === "true"/);
assert.match(restartHandler, /const restartDefaultInPlace = wasDefaultKnockout && !returnToSetup/);
assert.match(restartHandler, /state\._activeSpectateId \|\| state\.spectateTeamId/);
assert.match(restartHandler, /state\.started = true/);
assert.match(restartHandler, /state\._activeSpectateId = previousSpectateTeamId/);
assert.match(restartHandler, /state\.neutralView = !previousSpectateTeamId/);
assert.match(restartHandler, /focusSpectatedTeam\(0\)/);
assert.match(
  restartHandler,
  /wasCustomTournament \? "custom" : restartDefaultInPlace \? "standard" : "home"/,
  "A default knockout restart must remain on the tournament screen.",
);
assert.match(restartHandler, /opening match is ready/);
assert.match(app, /homeRestartButton\?\.addEventListener\("click", \(\) => openDefaultResetModal\(true\)\)/);
assert.match(
  restartHandler,
  /returnToSetup && wasDefaultKnockout[\s\S]*?Change your team or settings/,
  "The main-menu restart must return to an unlocked setup.",
);

console.log("Default knockout restart flow checks passed.");
