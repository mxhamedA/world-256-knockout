import assert from "node:assert/strict";

const baseUrl = process.env.ONLINE_ROOM_TEST_URL || "http://127.0.0.1:8791";
const rooms = [];
const PLAYERS_PER_ROOM = 8;
const ROOM_COUNT = 5;
const GLOBAL_MATCH_LIMIT = 64;

function token() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

async function api(path, { method = "GET", body, accessToken, actorIp } = {}) {
  const payload = method === "GET" ? undefined : {
    ...(body || {}),
    clientCommandId: body?.clientCommandId || crypto.randomUUID(),
  };
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(payload ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(actorIp ? { "CF-Connecting-IP": actorIp } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error || "request failed"}`);
  return data;
}

async function createLoadedRoom(roomIndex) {
  const hostToken = token();
  const actorIp = `198.51.100.${roomIndex}`;
  let created;
  for (let attempt = 0; attempt < 8 && !created; attempt += 1) {
    const roomCode = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10_000).padStart(4, "0");
    try {
      created = await api("/api/rooms", {
        method: "POST",
        actorIp,
        body: { name: `Load Host ${roomIndex}`, accessToken: hostToken, roomCode },
      });
    } catch (error) {
      if (!String(error.message).startsWith("409:") || attempt === 7) throw error;
    }
  }
  const room = {
    code: created.room.code,
    hostToken,
    actorIp,
    tokensByMember: new Map([[created.memberId, hostToken]]),
    snapshot: created,
  };
  rooms.push(room);

  for (let playerIndex = 1; playerIndex < PLAYERS_PER_ROOM; playerIndex += 1) {
    const guestToken = token();
    const joined = await api(`/api/rooms/${room.code}/join`, {
      method: "POST",
      actorIp,
      body: { name: `Load ${roomIndex}-${playerIndex}`, accessToken: guestToken },
    });
    room.tokensByMember.set(joined.memberId, guestToken);
  }

  let snapshot = await api(`/api/rooms/${room.code}/draft-start`, {
    method: "POST",
    actorIp,
    accessToken: hostToken,
  });
  while (snapshot.room.draft.status === "active") {
    snapshot = await api(`/api/rooms/${room.code}/draft-draw`, {
      method: "POST",
      actorIp,
      accessToken: hostToken,
      body: { expectedTurnIndex: snapshot.room.draft.turnIndex },
    });
  }

  const opening = snapshot.room.tournament.rounds[0];
  for (const match of opening.matches) {
    for (const memberId of match.requiredMemberIds || []) {
      snapshot = await api(`/api/rooms/${room.code}/match-ready`, {
        method: "POST",
        actorIp,
        accessToken: room.tokensByMember.get(memberId),
        body: { matchId: match.id },
      });
    }
  }
  room.snapshot = snapshot;
  return room;
}

try {
  for (let roomIndex = 0; roomIndex < ROOM_COUNT; roomIndex += 1) {
    await createLoadedRoom(roomIndex + 1);
  }

  let peakActive = 0;
  let queuedSeen = false;
  const deadline = Date.now() + 70_000;
  while (Date.now() < deadline && peakActive < GLOBAL_MATCH_LIMIT) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let activeAcrossRooms = 0;
    for (const room of rooms) {
      room.snapshot = await api(`/api/rooms/${room.code}`, {
        accessToken: room.hostToken,
        actorIp: room.actorIp,
      });
      const opening = room.snapshot.room.tournament.rounds[0];
      const active = opening.matches.filter((match) => match.lease && match.liveState?.status !== "finished");
      const cpuOnly = opening.matches.filter((match) => !(match.requiredMemberIds || []).length && !match.liveState);
      assert.ok(
        cpuOnly.every((match) => match.status === "complete" && !match.lease),
        "CPU-only matches must finish without consuming live capacity.",
      );
      activeAcrossRooms += active.length;
      queuedSeen ||= opening.matches.some((match) => Number.isInteger(match.queuePosition) && match.queuePosition >= 0);
    }
    peakActive = Math.max(peakActive, activeAcrossRooms);
    assert.ok(
      activeAcrossRooms <= GLOBAL_MATCH_LIMIT,
      `Global active match capacity exceeded: ${activeAcrossRooms}`,
    );
  }

  assert.equal(peakActive, GLOBAL_MATCH_LIMIT, "Two full rooms should fill, but never exceed, global capacity.");
  assert.equal(queuedSeen, true, "Overflow player matches should enter the stable priority queue.");

  const leasedRoom = rooms.find((room) => room.snapshot.room.tournament.rounds[0].matches.some((match) => match.lease));
  const leasedMatch = leasedRoom.snapshot.room.tournament.rounds[0].matches.find((match) => match.lease);
  const beforeRenew = leasedMatch.lease.expiresAt;
  await new Promise((resolve) => setTimeout(resolve, 11_000));
  leasedRoom.snapshot = await api(`/api/rooms/${leasedRoom.code}`, {
    accessToken: leasedRoom.hostToken,
    actorIp: leasedRoom.actorIp,
  });
  const renewedMatch = leasedRoom.snapshot.room.tournament.rounds[0].matches.find((match) => match.id === leasedMatch.id);
  assert.ok(renewedMatch.lease?.expiresAt > beforeRenew, "Active player-match leases should renew every ten seconds.");

  console.log(`Online multi-room load test passed (peak active: ${peakActive}/${GLOBAL_MATCH_LIMIT}).`);
} finally {
  for (const room of rooms) {
    await api(`/api/rooms/${room.code}`, {
      method: "DELETE",
      accessToken: room.hostToken,
      actorIp: room.actorIp,
    }).catch(() => {});
  }
}
