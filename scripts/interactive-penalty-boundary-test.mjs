import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const boundarySource = appSource.match(
  /function reconcileInteractiveMatchBoundary\(match, playback\) \{[\s\S]*?\n\}/,
)?.[0];

assert.ok(boundarySource, "The interactive match-boundary reconciler must exist.");
const reconcileInteractiveMatchBoundary = Function(`return (${boundarySource});`)();

const englandPanama = {
  homeId: "england",
  awayId: "panama",
  allowDraw: false,
  result: {
    homeEvents: [
      { minute: 31, scorer: "Kane" },
      { minute: 108, scorer: "Bellingham" },
    ],
    awayEvents: [
      { minute: 12, scorer: "Diaz" },
      { minute: 67, scorer: "Barcenas" },
    ],
    homeGoals: 2,
    awayGoals: 2,
    extraTime: true,
    penalties: { home: 4, away: 3 },
    shootout: [{ side: "home", scored: true }],
    winnerId: "england",
  },
};
const englandPanamaPlayback = { maxMinute: 120 };

assert.equal(reconcileInteractiveMatchBoundary(englandPanama, englandPanamaPlayback), false);
assert.equal(englandPanama.result.extraTime, false);
assert.equal(englandPanamaPlayback.maxMinute, 90);
assert.equal(englandPanama.result.homeGoals, 1);
assert.equal(englandPanama.result.awayGoals, 2);
assert.equal(englandPanama.result.winnerId, "panama");
assert.equal(englandPanama.result.homeEvents.some((event) => event.minute > 90), false);
assert.equal(englandPanama.result.penalties, null);
assert.equal(englandPanama.result.shootout, null);

const levelAfterRegulation = {
  homeId: "home",
  awayId: "away",
  allowDraw: false,
  result: {
    homeEvents: [{ minute: 44 }, { minute: 111 }],
    awayEvents: [{ minute: 70 }],
    homeGoals: 2,
    awayGoals: 1,
    extraTime: true,
  },
};
const levelPlayback = { maxMinute: 90 };

assert.equal(reconcileInteractiveMatchBoundary(levelAfterRegulation, levelPlayback), true);
assert.equal(levelAfterRegulation.result.extraTime, true);
assert.equal(levelPlayback.maxMinute, 120);
assert.equal(levelAfterRegulation.result.homeEvents.some((event) => event.minute === 111), true);

assert.match(
  appSource,
  /function nextMatchHighlight\(\)[\s\S]*highlight\.minute <= \(livePlayback\?\.maxMinute \?\? 120\)/,
  "Playback must not consume extra-time highlights after a missed penalty ends the match in regulation.",
);
assert.match(
  appSource,
  /if \(event\.minute <= 90\) reconcileInteractiveMatchBoundary\(match, livePlayback\)/,
  "A missed regulation penalty must immediately recalculate whether extra time is valid.",
);

console.log("Interactive penalty boundary tests passed.");
