import assert from "node:assert/strict";
import { verifyGoogleIdToken } from "../challenge-service.mjs";

const encoder = new TextEncoder();
const originalFetch = globalThis.fetch;
const clientId = "test-google-client.apps.googleusercontent.com";
const nonce = "one-time-test-nonce";
const keyPair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
publicJwk.kid = "test-key";
publicJwk.alg = "RS256";
publicJwk.use = "sig";

function base64Url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

async function token(overrides = {}) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" }));
  const claims = base64Url(JSON.stringify({
    iss: "https://accounts.google.com",
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 300,
    sub: "google-subject-123",
    email: "Player@Example.COM",
    email_verified: true,
    nonce,
    ...overrides,
  }));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, encoder.encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64Url(new Uint8Array(signature))}`;
}

globalThis.fetch = async () => new Response(JSON.stringify({ keys: [publicJwk] }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

try {
  const claims = await verifyGoogleIdToken(await token(), { GOOGLE_CLIENT_ID: clientId }, nonce);
  assert.equal(claims.sub, "google-subject-123");
  assert.equal(claims.email, "player@example.com");
  await assert.rejects(async () => verifyGoogleIdToken(await token({ aud: "attacker-client" }), { GOOGLE_CLIENT_ID: clientId }, nonce));
  await assert.rejects(async () => verifyGoogleIdToken(await token(), { GOOGLE_CLIENT_ID: clientId }, "wrong-nonce"));
  await assert.rejects(async () => verifyGoogleIdToken(await token({ exp: 1 }), { GOOGLE_CLIENT_ID: clientId }, nonce));
  console.log("Palestine Challenge Google token verification tests passed.");
} finally {
  globalThis.fetch = originalFetch;
}
