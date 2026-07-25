import assert from "node:assert/strict";
import {
  challengeSessionCookie,
  challengeSessionTokenFromRequest,
  hashChallengePassword,
  hashChallengeSessionToken,
  makeChallengeSessionToken,
  normalizeChallengeUsername,
  validChallengePassword,
  verifyChallengePassword,
} from "../challenge-auth.mjs";

assert.equal(normalizeChallengeUsername("  Player_01 "), "player_01");
assert.equal(normalizeChallengeUsername("ab"), null);
assert.equal(normalizeChallengeUsername("bad name"), null);
assert.equal(validChallengePassword("long-enough"), true);
assert.equal(validChallengePassword("short"), false);

const password = await hashChallengePassword("correct horse battery staple");
assert.equal(await verifyChallengePassword("correct horse battery staple", { password_hash: password.hash, password_salt: password.salt }), true);
assert.equal(await verifyChallengePassword("wrong password", { password_hash: password.hash, password_salt: password.salt }), false);

const token = makeChallengeSessionToken();
assert.match(token, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(await hashChallengeSessionToken(token), token);
const cookie = challengeSessionCookie(token);
assert.match(cookie, /HttpOnly/);
assert.match(cookie, /Secure/);
assert.match(cookie, /SameSite=Strict/);
assert.equal(challengeSessionTokenFromRequest(new Request("https://example.com", { headers: { Cookie: `x=1; ${cookie}` } })), token);

console.log("Palestine Challenge authentication tests passed.");
