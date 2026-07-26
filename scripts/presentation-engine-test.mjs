import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "presentation-engine.js"), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);
const engine = context.MatchPresentation;

function goalEvent({
  id = "goal-1",
  minute = 20,
  side = "home",
  before = [0, 0],
  after = [1, 0],
  phase = "first-half",
  metadata = {},
} = {}) {
  return engine.createEvent({
    id,
    sequence: 1,
    minute,
    addedTime: 0,
    type: "goal",
    importance: "goal",
    side,
    teamId: side,
    playerIds: ["player-1"],
    scoreBefore: { home: before[0], away: before[1] },
    scoreAfter: { home: after[0], away: after[1] },
    phase,
    metadata: { scorer: "Alex Morgan", ...metadata },
  });
}

assert.match(engine.goalCommentary(goalEvent(), "United"), /OPENS THE SCORING/);
assert.match(engine.goalCommentary(goalEvent({ side: "away", before: [1, 0], after: [1, 1] }), "City"), /EQUALISES/);
assert.match(engine.goalCommentary(goalEvent({ before: [1, 0], after: [2, 0] }), "United"), /DOUBLES UNITED'S LEAD/);
assert.doesNotMatch(engine.goalCommentary(goalEvent({ before: [2, 0], after: [3, 0] }), "United"), /DOUBLES/);
assert.match(engine.goalCommentary(goalEvent({ before: [1, 1], after: [2, 1] }), "United"), /PUTS UNITED AHEAD/);
assert.match(engine.goalCommentary(goalEvent({ minute: 88, before: [1, 1], after: [2, 1] }), "United"), /MAY HAVE WON IT LATE/);
assert.match(engine.goalCommentary(goalEvent({ metadata: { ownGoal: true, ownGoalBy: "Sam Lee" } }), "United"), /SAM LEE PUTS THROUGH AN OWN GOAL/);
assert.match(engine.goalCommentary(goalEvent({ metadata: { goalType: "penalty" } }), "United"), /FROM THE SPOT/);
assert.match(engine.goalCommentary(goalEvent({ minute: 108, phase: "extra-time", before: [1, 1], after: [2, 1] }), "United"), /IN EXTRA TIME/);

const shootoutGoal = engine.createEvent({
  ...goalEvent(),
  id: "shootout-1",
  type: "shootout-kick",
  phase: "shootout",
  metadata: { scorer: "Alex Morgan", scored: true },
});
assert.match(engine.goalCommentary(shootoutGoal, "United"), /IN THE SHOOTOUT/);
assert.doesNotMatch(engine.goalCommentary(shootoutGoal, "United"), /LEAD|EQUALIS/);

let now = 0;
const shown = [];
const accepted = [];
const dropped = [];
const scheduler = engine.createScheduler({
  now: () => now,
  onAccept: (event) => accepted.push(event.id),
  onShow: (event) => shown.push(event.id),
  onDrop: (event, reason) => dropped.push(`${event.id}:${reason}`),
});
const normal = engine.createEvent({ ...goalEvent(), id: "normal", type: "pass", importance: "normal" });
const major = engine.createEvent({ ...goalEvent(), id: "major", type: "red", importance: "major" });
scheduler.enqueue(normal, { now, speed: 1 });
scheduler.enqueue(normal, { now, speed: 1 });
assert.equal(accepted.filter((id) => id === "normal").length, 1, "Duplicate events must not be accepted twice.");
assert.ok(dropped.includes("normal:duplicate"));
scheduler.enqueue(major, { now, speed: 1 });
assert.equal(shown.at(-1), "major", "A major event must pre-empt normal commentary.");

const staleNotable = engine.createEvent({ ...goalEvent(), id: "stale", type: "shot", importance: "notable" });
const priorityGoal = goalEvent({ id: "priority-goal" });
scheduler.enqueue(priorityGoal, { now, speed: 1 });
scheduler.enqueue(staleNotable, { now, speed: 1 });
now = 3000;
scheduler.tick({ now, speed: 1 });
assert.ok(dropped.includes("stale:expired"), "Expired notable commentary must be dropped.");

scheduler.enqueue(engine.createEvent({ ...normal, id: "pending-normal" }), { now: 4000, speed: 1 });
scheduler.clear("skip-to-full-time");
assert.equal(scheduler.snapshot().queueLength, 0, "Skip/reset must clear the presentation queue.");
assert.equal(scheduler.snapshot().activeId, null, "Skip/reset must clear the active presentation.");

let pacedNow = 0;
const pacedShown = [];
const pacedScheduler = engine.createScheduler({
  now: () => pacedNow,
  onShow: (event) => pacedShown.push(event.id),
});
const firstMajor = engine.createEvent({ ...major, id: "first-major", sequence: 10 });
const secondMajor = engine.createEvent({ ...major, id: "second-major", sequence: 11 });
pacedScheduler.enqueue(firstMajor, { now: pacedNow, speed: 1 });
pacedScheduler.enqueue(secondMajor, { now: pacedNow, speed: 1 });
assert.deepEqual(pacedShown, ["first-major"], "Equal-priority events must not replace commentary already on screen.");
pacedNow = engine.displayDuration("major", 1);
pacedScheduler.tick({ now: pacedNow, speed: 1 });
assert.deepEqual(pacedShown, ["first-major", "second-major"], "Queued commentary must remain in match order.");

let rapidNow = 0;
const rapidAccepted = [];
const rapidShown = [];
const rapidScheduler = engine.createScheduler({
  now: () => rapidNow,
  onAccept: (event) => rapidAccepted.push(event.id),
  onShow: (event) => rapidShown.push(event.id),
});
const rapidGoal33 = goalEvent({
  id: "rapid-goal-33",
  minute: 33,
  before: [0, 0],
  after: [1, 0],
});
const rapidGoal34 = goalEvent({
  id: "rapid-goal-34",
  minute: 34,
  side: "away",
  before: [1, 0],
  after: [1, 1],
});
rapidScheduler.enqueue(rapidGoal33, { now: rapidNow, speed: 5 });
rapidNow = 100;
rapidScheduler.enqueue(rapidGoal34, { now: rapidNow, speed: 5 });
assert.deepEqual(
  rapidAccepted,
  ["rapid-goal-33", "rapid-goal-34"],
  "Consecutive goals must both update the score at 5x even while the first celebration is active.",
);
assert.deepEqual(rapidShown, ["rapid-goal-33"], "The second rapid goal should wait behind the active celebration.");
rapidNow = engine.displayDuration("goal", 5);
rapidScheduler.tick({ now: rapidNow, speed: 5 });
assert.deepEqual(
  rapidShown,
  ["rapid-goal-33", "rapid-goal-34"],
  "Consecutive goals must both be presented at 5x.",
);

const clock = engine.createClock({ initialMinute: 0, maxMinute: 90, speed: 1, now: 0 });
clock.sync(30, 0);
const clockSamples = [clock.read(100), clock.read(200), clock.read(300), clock.read(400)];
assert.ok(clockSamples.every((value, index) => index === 0 || value >= clockSamples[index - 1]), "Clock must never regress.");
assert.ok(clockSamples[0] <= 1, "Clock catch-up must be smooth instead of jumping several minutes per frame.");
clock.setSpeed(5, 400);
const fastValue = clock.read(500);
assert.ok(fastValue >= clockSamples.at(-1), "Changing speed must not move the clock backwards.");
clock.pause(500);
assert.equal(clock.read(1500), fastValue, "Paused clock must remain stable.");
clock.resume(1500);
clock.sync(60, 1500);
assert.ok(clock.read(1600) >= fastValue, "Resuming must continue monotonically.");
assert.equal(clock.finish(1700), 90, "Finishing must land exactly on full time.");

const lateClock = engine.createClock({ initialMinute: 60, maxMinute: 90, speed: 5, now: 0 });
lateClock.sync(90, 0);
assert.equal(lateClock.read(0), 60, "Queuing full time must not instantly skip the visible clock from 60 to 90.");
const lateClockProgress = lateClock.read(1000);
assert.ok(lateClockProgress > 60 && lateClockProgress < 90, "The remaining match minutes must visibly play out before full time.");
assert.equal(lateClock.finish(3000), 90, "The played-out clock must still finish exactly at 90.");

const nextMatchScheduler = engine.createScheduler();
assert.equal(nextMatchScheduler.snapshot().seenCount, 0, "A new match must start with clean deduplication state.");

console.log("Presentation engine tests passed.");
