export async function commitAtomicRoomBatch(storage, {
  room,
  events = [],
  nextAlarmAt,
  receipt = null,
  eventBucketSize = 128,
  maxCommandReceipts = 512,
  faultAfterEventWrites = false,
}) {
  const stagedRoom = structuredClone(room);
  const stagedEvents = structuredClone(events);
  const tournament = stagedRoom.tournament;
  if (tournament) {
    tournament.stateVersion = (tournament.stateVersion || 0) + 1;
    for (const event of stagedEvents) {
      tournament.lastEventId = (tournament.lastEventId || 0) + 1;
      event.id = tournament.lastEventId;
      event.stateVersion = tournament.stateVersion;
    }
  }

  await storage.transaction(async (transaction) => {
    const buckets = new Map();
    for (const event of stagedEvents) {
      const bucketId = Math.floor((event.id - 1) / eventBucketSize);
      if (!buckets.has(bucketId)) buckets.set(bucketId, await transaction.get(`events:${bucketId}`) || []);
      buckets.get(bucketId).push(event);
    }
    for (const [bucketId, bucketEvents] of buckets) await transaction.put(`events:${bucketId}`, bucketEvents);
    if (faultAfterEventWrites) throw new Error("Forced atomic batch failure");
    if (receipt) {
      const receipts = await transaction.get("commandReceipts") || [];
      receipts.push(receipt);
      await transaction.put("commandReceipts", receipts.slice(-maxCommandReceipts));
    }
    await transaction.put("room", stagedRoom);
    await transaction.setAlarm(Math.min(nextAlarmAt || stagedRoom.expiresAt, stagedRoom.expiresAt));
  });

  // The authoritative in-memory view advances only after the transaction commits.
  for (const key of Object.keys(room)) delete room[key];
  Object.assign(room, stagedRoom);
  events.splice(0, events.length, ...stagedEvents);
  return { room, events };
}
