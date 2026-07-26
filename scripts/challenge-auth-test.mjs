import assert from "node:assert/strict";
import fs from "node:fs";
import {
  challengeSessionCookie,
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
assert.match(cookie, /SameSite=Strict/);
assert.equal(challengeSessionTokenFromRequest(new Request("https://example.com", { headers: { Cookie: `x=1; ${cookie}` } })), token);

const authUi = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const authClient = fs.readFileSync(new URL("../challenge.js", import.meta.url), "utf8");
assert.match(authUi, /id="challengeEmail"[^>]*type="email"[^>]*autocomplete="email"/);
assert.match(authUi, /id="challengeIdentifierLabel">Username or email/);
assert.match(authClient, /elements\.email\.required = !isLogin/);
assert.match(authClient, /\? \{ identifier: elements\.username\.value, password: elements\.password\.value \}/);
assert.match(authClient, /: \{ email: elements\.email\.value, username: elements\.username\.value, password: elements\.password\.value \}/);
assert.match(authUi, /id="usernameReviewModal"/);
assert.match(authClient, /account\?\.usernameNeedsReview/);
assert.match(authClient, /body: \{ username: elements\.usernameReviewInput\.value \}/);

console.log("Palestine Challenge authentication tests passed.");
