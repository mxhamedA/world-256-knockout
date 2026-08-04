import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const cssSource = fs.readFileSync(path.join(root, "clean.css"), "utf8");

function functionSource(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist in app.js.`);
  const bodyStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name} from app.js.`);
}

const context = vm.createContext({});
vm.runInContext(`
  const STANDARD_PENALTY_TARGETS = Object.freeze(["top-left", "top-right", "middle", "bottom-left", "bottom-right"]);
  const simulationClamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  ${functionSource("onlinePenaltyDirection")}
  ${functionSource("penaltyDirectionTarget")}
  ${functionSource("distinctKeeperDiveForGoal")}
  ${functionSource("normalizePenaltyAttemptVisual")}
  ${functionSource("setPenaltySceneElement")}
  ${functionSource("keeperPenaltyGoalChance")}
  ${functionSource("resolveKeeperPenaltyAttempt")}
  globalThis.normalize = normalizePenaltyAttemptVisual;
  globalThis.render = setPenaltySceneElement;
  globalThis.resolveKeeper = resolveKeeperPenaltyAttempt;
`, context);

const skipContext = vm.createContext({});
vm.runInContext(`
  let state = {
    started: true,
    rounds: [Array.from({ length: 128 }, () => ({}))],
  };
  let livePlayback = {
    phase: "shootout",
    interactiveShootout: true,
    ending: false,
  };
  ${functionSource("isDefault256KnockoutState")}
  ${functionSource("canSkipPenaltyShootout")}
  globalThis.canSkip = () => canSkipPenaltyShootout();
  globalThis.setCustom = () => { state.customTournament = { active: true }; };
`, skipContext);
assert.equal(skipContext.canSkip(), true,
  "The default 256-team knockout must allow an interactive shootout to be skipped.");
skipContext.setCustom();
assert.equal(skipContext.canSkip(), true,
  "A managed-team shootout must remain skippable in every tournament mode.");

function scene() {
  return {
    dataset: {},
    offsetWidth: 1,
    classList: { add() {}, remove() {} },
  };
}

const staleTargetScene = scene();
context.render(staleTargetScene, {
  target: "middle",
  direction: "left",
  keeperDive: "left",
  scored: false,
  missType: "save",
  foot: "right",
}, "result");
assert.equal(staleTargetScene.dataset.target, "bottom-left");
assert.equal(staleTargetScene.dataset.direction, "left");
assert.equal(staleTargetScene.dataset.dive, "left");
assert.equal(staleTargetScene.dataset.result, "save");

const middleSaveScene = scene();
context.render(middleSaveScene, {
  target: "middle",
  direction: "centre",
  keeperDive: "right",
  scored: false,
  missType: "save",
  foot: "right",
}, "result");
assert.equal(middleSaveScene.dataset.target, "middle");
assert.equal(middleSaveScene.dataset.dive, "centre");

const middleGoal = context.normalize({
  target: "middle",
  direction: "centre",
  keeperDive: "left",
  scored: true,
  missType: null,
});
assert.equal(middleGoal.scored, true);
assert.equal(middleGoal.target, "middle");
assert.equal(middleGoal.keeperDive, "left");

for (const direction of ["wide-left", "wide-right"]) {
  const wideScene = scene();
  const wideAttempt = {
    target: "middle",
    direction,
    keeperDive: direction === "wide-left" ? "right" : "left",
    scored: false,
    missType: "wide",
    foot: "right",
  };
  context.render(wideScene, wideAttempt, "flight");
  assert.equal(wideScene.dataset.target, direction,
    "A wide miss must not use the middle target during its flight frame.");
  assert.equal(wideScene.dataset.direction, direction);
  assert.equal(wideScene.dataset.dive, wideAttempt.keeperDive);
  context.render(wideScene, wideAttempt, "result");
  assert.equal(wideScene.dataset.target, direction);
  assert.equal(wideScene.dataset.result, "wide");
}

const pendingAttempt = {
  target: null,
  direction: "centre",
  keeperDive: "right",
  scored: null,
  missType: null,
};
context.normalize(pendingAttempt);
assert.equal(pendingAttempt.target, null, "An unresolved manual kick must remain selectable.");

const targets = ["top-left", "top-right", "middle", "bottom-left", "bottom-right"];
for (const shotTarget of targets) {
  const exactRead = context.resolveKeeper({
    shotTarget,
    target: null,
    scored: null,
    missType: null,
  }, shotTarget);
  assert.equal(exactRead.scored, false, `${shotTarget}: an exact five-way read must save.`);
  assert.equal(exactRead.missType, "save");
  assert.equal(exactRead.goalkeeperTarget, shotTarget);

  const wrongTarget = targets.find((target) => target !== shotTarget);
  const wrongRead = context.resolveKeeper({
    shotTarget,
    target: null,
    scored: null,
    missType: null,
  }, wrongTarget);
  assert.equal(wrongRead.scored, true, `${shotTarget}: a wrong five-way read must score.`);
  assert.equal(wrongRead.missType, null);
  assert.equal(wrongRead.goalkeeperTarget, wrongTarget);
}

const wrongReadMiss = context.resolveKeeper({
  shotTarget: "top-left",
  conversionChance: 0.62,
  outcomeRoll: 0.99,
  target: null,
  scored: null,
  missType: null,
}, "middle");
assert.equal(wrongReadMiss.scored, false,
  "An opposition taker must retain an independent miss chance after beating the goalkeeper.");
assert.equal(wrongReadMiss.missType, "wide");
assert.match(wrongReadMiss.direction, /^wide-(left|right)$/);

const heightMismatchScene = scene();
context.render(heightMismatchScene, context.resolveKeeper({
  shotTarget: "top-left",
  target: null,
  scored: null,
  missType: null,
}, "bottom-left"), "result");
assert.equal(heightMismatchScene.dataset.result, "goal");
assert.equal(heightMismatchScene.dataset.target, "top-left");
assert.equal(heightMismatchScene.dataset.keeperTarget, "bottom-left");
assert.equal(heightMismatchScene.dataset.dive, "left",
  "A keeper choosing the right side but wrong height must keep that visible dive.");

assert.match(appSource, /const ONLINE_PARTY_MODE_ENABLED = true;/,
  "Online Party Mode must remain available from the mode picker.");
assert.match(appSource, /interactionRole: "keeper"/,
  "Opposition shootout attempts must pause for a keeper choice.");
assert.match(appSource, /controlledMatchPenaltyRole\(event\)[\s\S]*"taker" : "keeper"/,
  "Regulation penalties must distinguish shooting and goalkeeping control.");
assert.doesNotMatch(
  functionSource("matchPenaltyAttempt"),
  /scored:\s*true/,
  "Automatic regulation penalties must not be hardcoded as goals.",
);
assert.match(
  functionSource("matchPenaltyAttempt"),
  /random\(\)\s*<\s*conversionChance/,
  "Automatic regulation penalties must use team-based conversion odds.",
);
assert.match(
  functionSource("matchPenaltyAttempt"),
  /interactivePenaltyDecisions\?\.\[event\.id\]/,
  "A submitted regulation-penalty decision must be restored after a refresh.",
);
assert.match(
  functionSource("chooseMatchPenaltyTarget"),
  /saveInteractivePenaltyDecision\(event, attempt\)[\s\S]*saveState\(\);[\s\S]*saveLiveMatchCheckpoint\(\);/,
  "A regulation-penalty choice and its live checkpoint must be saved before play resumes.",
);
assert.match(
  functionSource("startMatchPenaltyAnimation"),
  /const decisionLocked = interactive && Boolean\(attempt\.target\);[\s\S]*if \(!awaitingChoice\)/,
  "A restored regulation penalty must replay its locked result without accepting another choice.",
);
assert.match(
  functionSource("removeSavedPenaltyGoal"),
  /match\.result\.winnerId = match\.result\.homeGoals === match\.result\.awayGoals[\s\S]*\? null/,
  "Saving a penalty must immediately clear a stale winner when the corrected score is level.",
);
assert.match(
  cssSource,
  /body\.retro-mode-active\.retro-2002-active #mainContent \.penalty-stage \{[\s\S]*?border-radius: 0;/,
  "The Korea/Japan 2002 shootout panel must remain rectangular.",
);
assert.match(
  cssSource,
  /body\.retro-mode-active\.retro-2002-active #mainContent :is\([\s\S]*?\.standard-penalty-scene[\s\S]*?\) \{[\s\S]*?border-radius: 0;/,
  "The Korea/Japan 2002 penalty scene must remain rectangular.",
);
assert.match(
  cssSource,
  /body\.retro-mode-active\.retro-2002-active #mainContent :is\([\s\S]*?\.standard-penalty-targets[\s\S]*?\) button \{[\s\S]*?border-radius: 50%;/,
  "The Korea/Japan 2002 penalty targets must remain circular.",
);
assert.match(
  cssSource,
  /body\.retro-mode-active\.retro-2002-active #mainContent \.penalty-mark \{[\s\S]*?border-radius: 50%;/,
  "The Korea/Japan 2002 kick markers must remain circular.",
);

console.log("Penalty scoring and animation invariants passed.");
