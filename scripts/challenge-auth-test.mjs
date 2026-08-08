import assert from "node:assert/strict";
import fs from "node:fs";
import {
  challengeSessionCookie,
  challengeSessionCookies,
  challengeSessionCookiesForRequest,
  challengeSessionTokensFromRequest,
  clearChallengeSessionCookies,
  challengeSessionTokenFromRequest,
  hashChallengePassword,
  hashChallengeSessionToken,
  makeChallengeSessionToken,
  normalizeChallengeEmail,
  normalizeChallengeUsername,
  validChallengePassword,
  verifyChallengePassword,
} from "../challenge-auth.mjs";

assert.equal(normalizeChallengeUsername("  Player_01 "), "player_01");
assert.equal(normalizeChallengeUsername("ab"), null);
assert.equal(normalizeChallengeUsername("bad name"), null);
assert.equal(normalizeChallengeEmail("  Player@Example.COM "), "player@example.com");
assert.equal(normalizeChallengeEmail("not-an-email"), null);
assert.equal(normalizeChallengeEmail(`a${"b".repeat(64)}@example.com`), null);
assert.equal(validChallengePassword("long-enough"), true);
assert.equal(validChallengePassword("short"), false);

const password = await hashChallengePassword("correct horse battery staple");
assert.equal(password.iterations, 100_000);
assert.equal(await verifyChallengePassword("correct horse battery staple", {
  password_hash: password.hash,
  password_salt: password.salt,
  password_iterations: password.iterations,
}), true);
assert.equal(await verifyChallengePassword("wrong password", {
  password_hash: password.hash,
  password_salt: password.salt,
  password_iterations: password.iterations,
}), false);

const legacyPassword = await hashChallengePassword("legacy-password", undefined, 210_000);
assert.equal(legacyPassword.iterations, 210_000);
assert.equal(await verifyChallengePassword("legacy-password", {
  password_hash: legacyPassword.hash,
  password_salt: legacyPassword.salt,
  password_iterations: legacyPassword.iterations,
}), true);

const token = makeChallengeSessionToken();
assert.match(token, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(await hashChallengeSessionToken(token), token);
const cookie = challengeSessionCookie(token);
assert.match(cookie, /HttpOnly/);
assert.match(cookie, /Secure/);
assert.match(cookie, /SameSite=Lax/);
assert.doesNotMatch(cookie, /Partitioned/);
assert.match(cookie, /^__Host-world256_session=/);
assert.equal(challengeSessionTokenFromRequest(new Request("https://example.com", { headers: { Cookie: `x=1; ${cookie}` } })), token);
const migratedCookies = challengeSessionCookies(token);
assert.equal(migratedCookies.length, 3);
assert.match(migratedCookies[0], /^palestine_session=.*SameSite=Lax; Max-Age=0/);
assert.match(migratedCookies[1], /SameSite=None; Partitioned; Max-Age=0/);
assert.match(migratedCookies[2], /^__Host-world256_session=.*SameSite=Lax/);
assert.equal(
  migratedCookies.reduce((storedValue, setCookie) => {
    const value = setCookie.match(/^__Host-world256_session=([^;]*)/)?.[1] ?? storedValue;
    return value;
  }, null),
  token,
  "Legacy cleanup must not be capable of erasing the new host-only session.",
);
assert.equal(clearChallengeSessionCookies().length, 3);
assert.deepEqual(challengeSessionTokensFromRequest(new Request("https://example.com", {
  headers: {
    Cookie: `palestine_session=${"a".repeat(43)}; __Host-world256_session=${token}; palestine_session=${"b".repeat(43)}`,
  },
})), [token, "a".repeat(43), "b".repeat(43)]);
const localCookies = challengeSessionCookiesForRequest(
  new Request("http://127.0.0.1:8787/api/challenge/login"),
  token,
);
assert.match(localCookies.at(-1), /^world256_local_session=.*HttpOnly; SameSite=Lax/);
const localToken = localCookies.at(-1).match(/^world256_local_session=([^;]+)/)?.[1];
assert.deepEqual(challengeSessionTokensFromRequest(new Request("http://127.0.0.1:8787/api/challenge", {
  headers: { Cookie: `world256_local_session=${localToken}` },
})), [token]);
assert.deepEqual(challengeSessionTokensFromRequest(new Request("https://www.256teams.com/api/challenge", {
  headers: { Cookie: `world256_local_session=${localToken}` },
})), [], "The local development cookie must never authenticate production requests.");

const authUi = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const authClient = fs.readFileSync(new URL("../challenge.js", import.meta.url), "utf8");
assert.match(authUi, /id="challengeEmail"[^>]*type="email"[^>]*autocomplete="email"/);
assert.match(authUi, /id="challengeIdentifierLabel">Username or email/);
assert.match(authClient, /elements\.email\.required = isRegister/);
assert.match(authClient, /\? \{ identifier: elements\.username\.value, password: elements\.password\.value \}/);
assert.match(authClient, /: \{ email: elements\.email\.value, username: elements\.username\.value, password: elements\.password\.value \}/);
assert.match(authUi, /id="challengeForgotPassword"[^>]*>Forgot password\?/);
assert.match(authClient, /challengeApi\("\/forgot-password"/);
assert.match(authClient, /challengeApi\("\/reset-password"/);
assert.match(authClient, /new URLSearchParams\(window\.location\.search\)\.get\("token"\)/);
assert.match(authClient, /credentials: "include"/);
assert.match(authClient, /dashboard\?\.auth\?\.googleEnabled !== false/);
assert.match(authClient, /const authPayload = await challengeApi/);
assert.match(authClient, /loadHomeAccount\(account\)/);
assert.match(authClient, /function challengeApiForAccount/);
assert.match(authClient, /\[0, 150, 450\]/);
const renderProfileSource = authClient.slice(
  authClient.indexOf("function renderProfile()"),
  authClient.indexOf("async function loadProfile"),
);
assert.doesNotMatch(renderProfileSource, /openAuth\(/,
  "Rendering a missing profile payload must not itself trigger a login modal.");
assert.match(authClient, /const recoveredAccount = dashboard\?\.account \|\| expectedAccount \|\| null;/);
assert.match(authClient, /error\.status === 401 && !recoveredAccount\) openAuth\("login"\)/,
  "The profile route should request login only after both authenticated checks fail.");
assert.match(authUi, /id="usernameReviewModal"/);
assert.match(authClient, /account\?\.usernameNeedsReview/);
assert.match(authClient, /body: \{ username: elements\.usernameReviewInput\.value \}/);

console.log("Palestine Challenge authentication tests passed.");
