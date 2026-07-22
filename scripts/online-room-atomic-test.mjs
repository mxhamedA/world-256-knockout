import assert from "node:assert/strict";
import { commitAtomicRoomBatch } from "../online-room-atomic.mjs";

class TransactionalMemory {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(structuredClone(entries)));
    this.alarm = null;
  }

  async transaction(callback) {
    const entries = new Map([...this.entries].map(([key, value]) => [key, structuredClone(value)]));
    let alarm = this.alarm;
    const transaction = {
      get: async (key) => structuredClone(entries.get(key)),
      put: async (key, value) => { entries.set(key, structuredClone(value)); },
      setAlarm: async (value) => { alarm = value; },
    };
    await callback(transaction);
    this.entries = entries;
    this.alarm = alarm;
  }

  get(key) {
    return structuredClone(this.entries.get(key));
  }
}

const initialRoom = {
  code: "1234",
  expiresAt: 50_000,
  tournament: { stateVersion: 4, lastEventId: 9 },
};

{
  const storage = new TransactionalMemory({ room: initialRoom, "events:0": [{ id: 9 }] });
  const candidate = structuredClone(initialRoom);
  candidate.tournament.scoreMarker = "advanced";
  const events = [{ type: "goal", minute: 12 }];
  await assert.rejects(commitAtomicRoomBatch(storage, {
    room: candidate,
    events,
    nextAlarmAt: 10_000,
    faultAfterEventWrites: true,
  }), /Forced atomic batch failure/);
  assert.deepEqual(storage.get("room"), initialRoom, "A failed transaction cannot expose a partial score or cursor.");
  assert.deepEqual(storage.get("events:0"), [{ id: 9 }], "A failed transaction cannot expose partial event history.");
  assert.equal(candidate.tournament.stateVersion, 4, "The caller view advances only after commit.");
  assert.equal(events[0].id, undefined);
}

{
  const storage = new TransactionalMemory({ room: initialRoom, "events:0": [{ id: 9 }] });
  const candidate = structuredClone(initialRoom);
  candidate.tournament.scoreMarker = "advanced";
  const events = [{ type: "goal", minute: 12 }];
  await commitAtomicRoomBatch(storage, { room: candidate, events, nextAlarmAt: 10_000 });
  assert.equal(storage.get("room").tournament.stateVersion, 5);
  assert.equal(storage.get("room").tournament.lastEventId, 10);
  assert.equal(storage.get("events:0").at(-1).id, 10);
  assert.equal(events[0].stateVersion, 5);
  assert.equal(storage.alarm, 10_000);
}

console.log("Online atomic room batch tests passed.");
