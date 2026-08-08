import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(app, /function isDefaultKnockoutState\(candidate\)/);
assert.match(app, /let defaultKnockoutState = isDefaultKnockoutState\(state\) \? state : null/);
assert.match(app, /let customTournamentState = isValidCustomTournamentState\(state\) \? state : null/);
assert.match(
  app,
  /function saveState\(\)[\s\S]*?isDefaultKnockoutState\(state\)\) defaultKnockoutState = state[\s\S]*?isValidCustomTournamentState\(state\)\) customTournamentState = state/,
  "Saving either mode must update only its own in-session tournament slot.",
);
assert.match(
  app,
  /startTournamentButton\.addEventListener\("click"[\s\S]*?if \(isValidCustomTournamentState\(state\)\)[\s\S]*?state = isDefaultKnockoutState\(defaultKnockoutState\)[\s\S]*?: createInitialState\(\)/,
  "Opening 256 knockout from an active custom tournament must restore a default state.",
);
assert.match(
  app,
  /openCustomTournamentButton\?\.addEventListener\("click"[\s\S]*?state = customTournamentState/,
  "Returning to Custom must preserve its active tournament.",
);
assert.match(app, /if \(premierLeagueScreen && mode !== "premierLeague" && !premierLeagueSharedMatchActive\) premierLeagueScreen\.hidden = true/);
assert.match(app, /if \(uclScreen && mode !== "ucl" && !uclSharedMatchActive\) uclScreen\.hidden = true/,
  "An inactive UCL screen must never leak below another mode.");

console.log("Default/custom mode isolation checks passed.");
