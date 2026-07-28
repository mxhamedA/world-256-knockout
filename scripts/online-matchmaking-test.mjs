import assert from "node:assert/strict";

const baseUrl = process.env.ONLINE_ROOM_TEST_URL || "http://127.0.0.1:8791";

function makeAccessToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

async function request(path, { method = "GET", body, token, origin } = {}) {
  const requestBody = !["GET", "HEAD"].includes(method)
    ? { ...(body || {}), clientCommandId: body?.clientCommandId || crypto.randomUUID() }
    : undefined;
  const headers = { Accept: "application/json" };
  if (requestBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

const firstToken = makeAccessToken();
const secondToken = makeAccessToken();

const crossOrigin = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "Blocked", accessToken: makeAccessToken() },
  origin: "https://attacker.invalid",
});
assert.equal(crossOrigin.response.status, 403);

const invalidName = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "<script>", accessToken: makeAccessToken() },
});
assert.equal(invalidName.response.status, 400);

const first = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "Public One", accessToken: firstToken },
});
assert.equal(first.response.status, 201);
assert.equal(first.payload.status, "queued");
assert.match(first.payload.ticketId, /^[A-Za-z0-9_-]{16}$/);

const duplicate = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "Public One", accessToken: firstToken },
});
assert.equal(duplicate.payload.ticketId, first.payload.ticketId);

const second = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "Public Two", accessToken: secondToken },
});
assert.equal(second.response.status, 200);
assert.equal(second.payload.status, "matched");
assert.match(second.payload.room.code, /^\d{4}$/);

const firstMatched = await request(`/api/matchmaking/${first.payload.ticketId}`, {
  token: firstToken,
});
assert.equal(firstMatched.response.status, 200);
assert.equal(firstMatched.payload.status, "matched");
assert.equal(firstMatched.payload.room.code, second.payload.room.code);
assert.notEqual(firstMatched.payload.room.memberId, second.payload.room.memberId);
assert.equal(firstMatched.payload.room.isHost, true);
assert.equal(second.payload.room.isHost, false);

const firstRoom = await request(`/api/rooms/${firstMatched.payload.room.code}`, {
  token: firstToken,
});
assert.equal(firstRoom.response.status, 200);
assert.equal(firstRoom.payload.room.visibility, "public");
assert.equal(firstRoom.payload.room.memberCount, 2);
assert.equal(firstRoom.payload.room.status, "draft");

const secondRoom = await request(`/api/rooms/${second.payload.room.code}`, {
  token: secondToken,
});
assert.equal(secondRoom.response.status, 200);
assert.equal(secondRoom.payload.memberId, second.payload.room.memberId);

const cancelToken = makeAccessToken();
const cancellable = await request("/api/matchmaking", {
  method: "POST",
  body: { name: "Cancel Me", accessToken: cancelToken },
});
assert.equal(cancellable.response.status, 201);
assert.equal(cancellable.payload.status, "queued");

const cancelled = await request(`/api/matchmaking/${cancellable.payload.ticketId}/cancel`, {
  method: "POST",
  token: cancelToken,
});
assert.equal(cancelled.response.status, 200);
assert.equal(cancelled.payload.status, "cancelled");

const cancelledStatus = await request(`/api/matchmaking/${cancellable.payload.ticketId}`, {
  token: cancelToken,
});
assert.equal(cancelledStatus.response.status, 410);

console.log("Online matchmaking integration test passed.");
