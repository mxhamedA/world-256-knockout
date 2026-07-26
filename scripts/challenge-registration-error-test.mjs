import assert from "node:assert/strict";
import { handleChallengeRequest } from "../challenge-service.mjs";

const requestUrl = new URL("https://example.com/api/challenge/register");

function registrationRequest(username) {
  return new Request(requestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${username}@example.com`, username, password: "a-secure-test-password" }),
  });
}

function statement(run) {
  return {
    bind() {
      return { run };
    },
  };
}

const accountFailure = new Error("D1 write unavailable");
const accountFailureResponse = await handleChallengeRequest(registrationRequest("db_failure"), {
  CHALLENGE_DB: {
    prepare() {
      return statement(async () => {
        throw accountFailure;
      });
    },
  },
}, requestUrl);
const accountFailurePayload = await accountFailureResponse.json();
assert.equal(accountFailureResponse.status, 500);
assert.equal(accountFailurePayload.code, "account_create_failed");
assert.match(accountFailurePayload.error, /account database rejected/i);
assert.doesNotMatch(accountFailurePayload.error, /Palestine Challenge/i);
assert.doesNotMatch(accountFailurePayload.error, /D1 write unavailable/i);

const sessionFailureResponse = await handleChallengeRequest(registrationRequest("session_failure"), {
  CHALLENGE_DB: {
    prepare() {
      return statement(async () => ({ meta: { changes: 1 } }));
    },
    async batch() {
      throw new Error("Session write unavailable");
    },
  },
}, requestUrl);
const sessionFailurePayload = await sessionFailureResponse.json();
assert.equal(sessionFailureResponse.status, 500);
assert.equal(sessionFailurePayload.code, "session_create_failed");
assert.equal(sessionFailurePayload.accountCreated, true);
assert.match(sessionFailurePayload.error, /account was created/i);
assert.doesNotMatch(sessionFailurePayload.error, /Palestine Challenge/i);
assert.doesNotMatch(sessionFailurePayload.error, /Session write unavailable/i);

console.log("Challenge registration error tests passed.");
