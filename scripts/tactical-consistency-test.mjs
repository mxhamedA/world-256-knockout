import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

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

const context = {};
vm.createContext(context);
vm.runInContext(`
  function stableHash(value) {
    return [...String(value)].reduce(
      (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
      2166136261,
    );
  }
  ${functionSource("mulberry32")}
  ${functionSource("poisson")}
  ${functionSource("matchGoalRandom")}
  globalThis.score = (seed, matchId, side, lambda) => poisson(
    lambda,
    matchGoalRandom(seed, matchId, side),
  );
`, context);

for (let seed = 1; seed <= 500; seed += 1) {
  const lowAttack = context.score(seed, "tactical-test", "home", 1.1);
  const highAttack = context.score(seed, "tactical-test", "home", 2.1);
  assert.ok(
    highAttack >= lowAttack,
    "Improving one team's xG with the same match seed must not reduce its goals through random-stream drift.",
  );
  const awayBefore = context.score(seed, "tactical-test", "away", 1.4);
  context.score(seed, "tactical-test", "home", 3.2);
  const awayAfter = context.score(seed, "tactical-test", "away", 1.4);
  assert.equal(
    awayAfter,
    awayBefore,
    "Changing the controlled team's attack must not change the opponent's random goal draw.",
  );
}

assert.match(app, /const homeGoalRandom = matchGoalRandom\(randomSeed, match\.id, "home"\)/);
assert.match(app, /const awayGoalRandom = matchGoalRandom\(randomSeed, match\.id, "away"\)/);
assert.match(app, /standardTacticOpponent\.textContent = opponentTacticName[\s\S]*standardTacticFeedback\.textContent = tacticalFeedback\?\.label/);
assert.match(
  html,
  /id="standardTacticOpponent"[\s\S]*id="standardTacticButtons"[\s\S]*id="standardTacticFeedback"/,
  "The tactical matchup helper must occupy its own bottom row after the tactic buttons.",
);
assert.match(
  app,
  /liveMatch\.result\.engineVersion !== 2[\s\S]*liveMatch\.result = null/,
  "A stale hidden result must be invalidated when the pre-match strategy changes.",
);
assert.match(html, /app\.js\?v=[a-z0-9-]+/);

console.log("Tactical causality, feedback, and stale-result checks passed.");
