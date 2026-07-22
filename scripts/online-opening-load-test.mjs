import assert from "node:assert/strict";

const baseUrl = process.env.ONLINE_ROOM_TEST_URL || "http://127.0.0.1:8791";
const session = {};

function token() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

async function api(path, { method = "GET", body, accessToken } = {}) {
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
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error || "request failed"}`);
  return data;
}

try {
  const hostToken = token();
  const roomCode = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10_000).padStart(4, "0");
  const created = await api("/api/rooms", {
    method: "POST",
    body: { name: "Load Host", accessToken: hostToken, roomCode },
  });
  Object.assign(session, { code: created.room.code, hostToken, hostId: created.memberId });
  const guestToken = token();
  const joined = await api(`/api/rooms/${session.code}/join`, {
    method: "POST",
    body: { name: "Load Guest", accessToken: guestToken },
  });
  session.guestToken = guestToken;
  session.guestId = joined.memberId;

  let snapshot = await api(`/api/rooms/${session.code}/draft-start`, { method: "POST", accessToken: hostToken });
  while (snapshot.room.draft.status === "active") {
    snapshot = await api(`/api/rooms/${session.code}/draft-draw`, {
      method: "POST",
      accessToken: hostToken,
      body: { expectedTurnIndex: snapshot.room.draft.turnIndex },
    });
  }

  const tokenByMember = new Map([[session.hostId, hostToken], [session.guestId, guestToken]]);
  const opening = snapshot.room.tournament.rounds[0];
  for (const match of opening.matches) {
    for (const memberId of match.requiredMemberIds || []) {
      snapshot = await api(`/api/rooms/${session.code}/match-ready`, {
        method: "POST",
        accessToken: tokenByMember.get(memberId),
        body: { matchId: match.id },
      });
    }
  }

  let peakActive = 0;
  let queuedSeen = false;
  const deadline = Date.now() + 70_000;
  while (Date.now() < deadline && peakActive < 64) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    snapshot = await api(`/api/rooms/${session.code}`, { accessToken: hostToken });
    const matches = snapshot.room.tournament.rounds[0].matches;
    const active = matches.filter((match) => match.lease && match.liveState?.status !== "finished").length;
    peakActive = Math.max(peakActive, active);
    queuedSeen ||= matches.some((match) => Number.isInteger(match.queuePosition) && match.queuePosition >= 0);
    assert.ok(active <= 64, `Active match capacity exceeded: ${active}`);
  }
  assert.equal(peakActive, 64, "The full opening round should fill, but never exceed, the 64-match capacity.");
  assert.equal(queuedSeen, true, "Overflow matches should enter the stable FIFO queue.");

  const beforeRenew = snapshot.room.tournament.rounds[0].matches.find((match) => match.lease)?.lease.expiresAt;
  await new Promise((resolve) => setTimeout(resolve, 11_000));
  snapshot = await api(`/api/rooms/${session.code}`, { accessToken: hostToken });
  const afterRenew = snapshot.room.tournament.rounds[0].matches.find((match) => match.lease)?.lease.expiresAt;
  assert.ok(afterRenew > beforeRenew, "Active match leases should renew every ten seconds.");

  console.log(`Online opening-round load test passed (peak active: ${peakActive}/64).`);
} finally {
  if (session.code && session.hostToken) {
    await api(`/api/rooms/${session.code}`, { method: "DELETE", accessToken: session.hostToken }).catch(() => {});
  }
}
