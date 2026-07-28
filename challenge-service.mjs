import { DRAFT_TEAMS } from "./draft-team-catalog.generated.mjs";
import {
  CHALLENGE_COUNTED_RUN_LIMIT,
  CHALLENGE_MIN_MATCH_INTERVAL_MS,
  CHALLENGE_ROUNDS,
  createChallengeRunState,
  countedRunIds,
  furthestRoundLabel,
  playChallengeRound,
} from "./challenge-engine.mjs";
import {
  challengeSessionCookiesForRequest,
  challengeSessionTokensFromRequest,
  clearChallengeSessionCookiesForRequest,
  hashChallengePassword,
  hashChallengeSessionToken,
  makeChallengeSessionToken,
  normalizeChallengeEmail,
  normalizeChallengeUsername,
  validChallengePassword,
  verifyChallengePassword,
} from "./challenge-auth.mjs";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_LIFETIME_MS = 10 * 60 * 1000;
const COMMAND_ID_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;
const PL_ASSET_PACK_ID = "pl-26-27";
const RETRO_2010_TEAMS = Object.freeze([
  "South Africa", "Mexico", "Uruguay", "France",
  "Argentina", "Nigeria", "South Korea", "Greece",
  "England", "USA", "Algeria", "Slovenia",
  "Germany", "Australia", "Serbia", "Ghana",
  "Netherlands", "Denmark", "Japan", "Cameroon",
  "Italy", "Paraguay", "New Zealand", "Slovakia",
  "Brazil", "North Korea", "Ivory Coast", "Portugal",
  "Spain", "Switzerland", "Honduras", "Chile",
]);
const RETRO_2014_TEAMS = Object.freeze([
  "Brazil", "Croatia", "Mexico", "Cameroon",
  "Spain", "Netherlands", "Chile", "Australia",
  "Colombia", "Greece", "Ivory Coast", "Japan",
  "Uruguay", "Costa Rica", "England", "Italy",
  "Switzerland", "Ecuador", "France", "Honduras",
  "Argentina", "Bosnia and Herzegovina", "Iran", "Nigeria",
  "Germany", "Portugal", "Ghana", "USA",
  "Belgium", "Algeria", "Russia", "South Korea",
]);
const RETRO_2016_TEAMS = Object.freeze([
  "France", "Romania", "Albania", "Switzerland",
  "England", "Russia", "Wales", "Slovakia",
  "Germany", "Ukraine", "Poland", "Northern Ireland",
  "Spain", "Czech Republic", "Turkey", "Croatia",
  "Belgium", "Italy", "Republic of Ireland", "Sweden",
  "Portugal", "Iceland", "Austria", "Hungary",
]);
const RETRO_2018_TEAMS = Object.freeze([
  "Russia", "Saudi Arabia", "Egypt", "Uruguay",
  "Portugal", "Spain", "Morocco", "Iran",
  "France", "Australia", "Peru", "Denmark",
  "Argentina", "Iceland", "Croatia", "Nigeria",
  "Brazil", "Switzerland", "Costa Rica", "Serbia",
  "Germany", "Mexico", "Sweden", "South Korea",
  "Belgium", "Panama", "Tunisia", "England",
  "Poland", "Senegal", "Colombia", "Japan",
]);
const RETRO_2022_TEAMS = Object.freeze([
  "Qatar", "Ecuador", "Senegal", "Netherlands",
  "England", "Iran", "USA", "Wales",
  "Argentina", "Saudi Arabia", "Mexico", "Poland",
  "France", "Australia", "Denmark", "Tunisia",
  "Spain", "Costa Rica", "Germany", "Japan",
  "Belgium", "Canada", "Morocco", "Croatia",
  "Brazil", "Serbia", "Switzerland", "Cameroon",
  "Portugal", "Ghana", "Uruguay", "South Korea",
]);
const RETRO_TEAM_RATINGS = Object.freeze({
  2010: Object.freeze([
    71, 78, 83, 82, 87, 76, 75, 77,
    83, 77, 72, 73, 87, 74, 78, 80,
    87, 77, 75, 77, 82, 78, 68, 74,
    88, 65, 80, 84, 90, 76, 69, 80,
  ]),
  2014: Object.freeze([
    88, 81, 80, 74, 91, 87, 83, 72,
    85, 77, 78, 76, 86, 78, 83, 84,
    80, 77, 85, 69, 90, 78, 71, 76,
    92, 84, 78, 77, 84, 74, 79, 72,
  ]),
  2016: Object.freeze([
    88, 75, 72, 81, 85, 79, 82, 79,
    89, 78, 83, 75, 88, 78, 80, 86,
    87, 86, 77, 80, 87, 78, 81, 77,
  ]),
  2018: Object.freeze([
    81, 71, 74, 86, 86, 89, 75, 73,
    92, 75, 78, 81, 87, 77, 87, 77,
    91, 82, 76, 79, 90, 82, 81, 76,
    90, 69, 74, 86, 82, 79, 84, 78,
  ]),
  2022: Object.freeze([
    72, 78, 82, 87, 89, 77, 80, 77,
    92, 72, 80, 81, 92, 76, 82, 75,
    87, 76, 87, 80, 86, 77, 83, 86,
    91, 80, 82, 77, 88, 76, 84, 79,
  ]),
});
const RETRO_ACHIEVEMENT_YEARS = Object.freeze([2010, 2014, 2016, 2018, 2022]);
const KNOCKOUT_256_KEY = 256;
const API_HEADERS = Object.freeze({
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
});

class ChallengeRequestError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function responseJson(value, status = 200, headers = {}) {
  const responseHeaders = new Headers(API_HEADERS);
  Object.entries(headers).forEach(([name, headerValue]) => {
    (Array.isArray(headerValue) ? headerValue : [headerValue]).forEach((item) => responseHeaders.append(name, item));
  });
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}

function redirectResponse(location, headers = {}) {
  const responseHeaders = new Headers({ Location: location, "Cache-Control": "no-store" });
  Object.entries(headers).forEach(([name, value]) => {
    (Array.isArray(value) ? value : [value]).forEach((item) => responseHeaders.append(name, item));
  });
  return new Response(null, { status: 302, headers: responseHeaders });
}

function googleAuthEnabled(env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function oauthReturnPath(value) {
  return value === "/palestine-challenge" || value === "/profile" ? value : "/";
}

function googleRedirectUri(env, url) {
  return env.GOOGLE_REDIRECT_URI || `${url.origin}/api/challenge/google/callback`;
}

function requestCookie(request, name) {
  const prefix = `${name}=`;
  const part = (request.headers.get("Cookie") || "").split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix));
  return part ? part.slice(prefix.length) : null;
}

function oauthStateCookie(stateHash) {
  return `google_oauth_state=${stateHash}; Path=/api/challenge/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

function clearOauthStateCookie() {
  return "google_oauth_state=; Path=/api/challenge/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJwtPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

export async function verifyGoogleIdToken(idToken, env, expectedNonce) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new ChallengeRequestError("Google returned an invalid identity token.", 401);
  const header = decodeJwtPart(parts[0]);
  const claims = decodeJwtPart(parts[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new ChallengeRequestError("Google returned an unsupported identity token.", 401);
  const keysResponse = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!keysResponse.ok) throw new ChallengeRequestError("Google sign-in could not be verified.", 502);
  const jwk = (await keysResponse.json()).keys?.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new ChallengeRequestError("Google sign-in key was not found.", 401);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const validIssuer = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  const validAudience = audiences.includes(env.GOOGLE_CLIENT_ID) && (audiences.length === 1 || claims.azp === env.GOOGLE_CLIENT_ID);
  if (!verified || !validIssuer || !validAudience || Number(claims.exp || 0) * 1000 <= Date.now() || claims.nonce !== expectedNonce) {
    throw new ChallengeRequestError("Google sign-in could not be verified.", 401);
  }
  const verifiedEmail = normalizeChallengeEmail(claims.email);
  if (!claims.sub || !verifiedEmail || claims.email_verified !== true) {
    throw new ChallengeRequestError("A verified Google email is required.", 401);
  }
  return { ...claims, email: verifiedEmail };
}

export async function generatedGoogleUsername(email, subject, attempt = 0) {
  const source = String(email).split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  const base = (source.length >= 3 ? source : "player").slice(0, 13);
  const suffix = (await hashChallengeSessionToken(subject)).slice(0, 6).toLowerCase();
  const tail = attempt ? `${suffix}${attempt}` : suffix;
  return `${base.slice(0, 19 - tail.length)}_${tail}`;
}

export async function generatedGoogleUsernameNeedsReview(account) {
  if (!account?.google_subject) return false;
  const candidates = await Promise.all(Array.from(
    { length: 20 },
    (_, attempt) => generatedGoogleUsername(account.email, account.google_subject, attempt),
  ));
  return candidates.includes(account.username);
}

async function uniqueGoogleUsername(db, claims) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = await generatedGoogleUsername(claims.email, claims.sub, attempt);
    const exists = await db.prepare("SELECT 1 FROM accounts WHERE username = ? COLLATE NOCASE").bind(candidate).first();
    if (!exists) return candidate;
  }
  throw new ChallengeRequestError("A username could not be created for this Google account.", 409);
}

export async function accountForGoogleClaims(db, claims) {
  let identity = await db.prepare(`
    SELECT accounts.* FROM auth_identities JOIN accounts ON accounts.id = auth_identities.account_id
    WHERE auth_identities.provider = 'google' AND auth_identities.provider_subject = ?
  `).bind(claims.sub).first();
  const now = Date.now();
  if (identity) {
    await db.prepare("UPDATE auth_identities SET last_login_at = ?, email = ? WHERE provider = 'google' AND provider_subject = ?")
      .bind(now, claims.email, claims.sub).run();
    return identity;
  }
  const matchingEmail = await db.prepare("SELECT * FROM accounts WHERE email = ? COLLATE NOCASE LIMIT 1")
    .bind(claims.email).first();
  const accountId = matchingEmail?.id || crypto.randomUUID();
  const statements = [];
  if (!matchingEmail) {
    const username = await uniqueGoogleUsername(db, claims);
    const impossiblePassword = {
      hash: await hashChallengeSessionToken(`${crypto.randomUUID()}:${makeChallengeSessionToken()}`),
      salt: makeChallengeSessionToken(),
      iterations: 0,
    };
    statements.push(db.prepare(`
      INSERT INTO accounts (id, username, password_hash, password_salt, password_iterations, email, email_verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(accountId, username, impossiblePassword.hash, impossiblePassword.salt, impossiblePassword.iterations, claims.email, now, now));
  } else {
    statements.push(db.prepare(`
      UPDATE accounts SET email = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?
    `).bind(claims.email, now, accountId));
  }
  statements.push(db.prepare(`
    INSERT INTO auth_identities (provider, provider_subject, account_id, email, created_at, last_login_at)
    VALUES ('google', ?, ?, ?, ?, ?)
  `).bind(claims.sub, accountId, claims.email, now, now));
  try {
    await db.batch(statements);
  } catch (error) {
    identity = await db.prepare(`
      SELECT accounts.* FROM auth_identities JOIN accounts ON accounts.id = auth_identities.account_id
      WHERE auth_identities.provider = 'google' AND auth_identities.provider_subject = ?
    `).bind(claims.sub).first();
    if (identity) return identity;
    throw error;
  }
  return matchingEmail || db.prepare("SELECT * FROM accounts WHERE id = ?").bind(accountId).first();
}

async function startGoogleLogin(request, env, url) {
  if (!googleAuthEnabled(env)) throw new ChallengeRequestError("Google sign-in is not configured yet.", 503);
  const state = makeChallengeSessionToken();
  const verifier = makeChallengeSessionToken();
  const nonce = makeChallengeSessionToken();
  const now = Date.now();
  const returnPath = oauthReturnPath(url.searchParams.get("returnTo"));
  await env.CHALLENGE_DB.batch([
    env.CHALLENGE_DB.prepare("DELETE FROM oauth_states WHERE expires_at <= ? OR used_at IS NOT NULL").bind(now),
    env.CHALLENGE_DB.prepare(`
      INSERT INTO oauth_states (state_hash, provider, code_verifier, nonce, return_path, expires_at)
      VALUES (?, 'google', ?, ?, ?, ?)
    `).bind(await hashChallengeSessionToken(state), verifier, nonce, returnPath, now + OAUTH_STATE_LIFETIME_MS),
  ]);
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(env, url),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: await hashChallengeSessionToken(verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return redirectResponse(authorization.toString(), { "Set-Cookie": oauthStateCookie(await hashChallengeSessionToken(state)) });
}

async function completeGoogleLogin(request, env, url) {
  const fallback = new URL("/", url.origin);
  fallback.searchParams.set("authError", "google");
  try {
    if (!googleAuthEnabled(env)) throw new ChallengeRequestError("Google sign-in is not configured yet.", 503);
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    if (!code || !/^[A-Za-z0-9_-]{40,80}$/.test(state)) {
      throw new ChallengeRequestError("Invalid Google sign-in response.", 400, { code: "invalid_callback" });
    }
    const stateHash = await hashChallengeSessionToken(state);
    if (requestCookie(request, "google_oauth_state") !== stateHash) {
      throw new ChallengeRequestError("Google sign-in did not start in this browser.", 400, { code: "state_cookie_missing" });
    }
    const stored = await env.CHALLENGE_DB.prepare("SELECT * FROM oauth_states WHERE state_hash = ? AND provider = 'google'").bind(stateHash).first();
    if (!stored || stored.used_at || stored.expires_at <= Date.now()) {
      throw new ChallengeRequestError("Google sign-in expired. Please try again.", 400, { code: "state_expired" });
    }
    const consumed = await env.CHALLENGE_DB.prepare("UPDATE oauth_states SET used_at = ? WHERE state_hash = ? AND used_at IS NULL AND expires_at > ?")
      .bind(Date.now(), stateHash, Date.now()).run();
    if (!consumed.meta.changes) throw new ChallengeRequestError("Google sign-in was already used.", 409, { code: "state_reused" });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: googleRedirectUri(env, url),
        grant_type: "authorization_code",
        code_verifier: stored.code_verifier,
      }),
    });
    const tokens = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokens.id_token) {
      console.error("Google token exchange failed", JSON.stringify({
        status: tokenResponse.status,
        error: tokens.error,
        error_description: tokens.error_description,
      }));
      throw new ChallengeRequestError("Google sign-in could not be completed.", 502, { code: "token_exchange_failed" });
    }
    let claims;
    try {
      claims = await verifyGoogleIdToken(tokens.id_token, env, stored.nonce);
    } catch (error) {
      console.error("Google ID token verification failed", error instanceof Error ? error.message : String(error));
      throw new ChallengeRequestError("Google sign-in could not be verified.", 401, { code: "id_token_verify_failed" });
    }
    let account;
    try {
      account = await accountForGoogleClaims(env.CHALLENGE_DB, claims);
    } catch (error) {
      console.error("Google account link failed", error instanceof Error ? error.message : String(error));
      throw new ChallengeRequestError("Google account could not be linked.", 500, { code: "account_link_failed" });
    }
    let session;
    try {
      session = await createSession(env.CHALLENGE_DB, account.id, request);
    } catch (error) {
      console.error("Google session create failed", error instanceof Error ? error.message : String(error));
      throw new ChallengeRequestError("Google session could not be created.", 500, { code: "session_create_failed" });
    }
    const destination = new URL(stored.return_path, url.origin);
    destination.searchParams.set("auth", "success");
    return redirectResponse(destination.toString(), {
      "Set-Cookie": [
        ...challengeSessionCookiesForRequest(
          request,
          session,
          undefined,
          env.LOCAL_DEV_AUTH === "true",
        ),
        clearOauthStateCookie(),
      ],
    });
  } catch (error) {
    const failureCode = error instanceof ChallengeRequestError && error.details?.code
      ? error.details.code
      : "unknown_callback_error";
    fallback.searchParams.set("authCode", failureCode);
    console.error("Google sign-in failure", JSON.stringify({
      code: failureCode || "unknown",
      message: error instanceof Error ? error.message : String(error),
    }));
    return redirectResponse(fallback.toString(), { "Set-Cookie": clearOauthStateCookie() });
  }
}

async function readJson(request, maxBytes = 2048) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    throw new ChallengeRequestError("Requests must use JSON.", 415);
  }
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > maxBytes) throw new ChallengeRequestError("Request is too large.", 413);
  const text = await request.text();
  if (text.length > maxBytes) throw new ChallengeRequestError("Request is too large.", 413);
  try {
    const value = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Object required");
    return value;
  } catch {
    throw new ChallengeRequestError("Invalid JSON request.");
  }
}

async function userAgentHash(request) {
  const value = request.headers.get("User-Agent") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function challengeStatus(challenge, now = Date.now()) {
  if (now < challenge.starts_at) return "upcoming";
  if (now >= challenge.ends_at) return "archived";
  return "active";
}

function publicChallenge(challenge, now = Date.now()) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    startTime: challenge.starts_at,
    endTime: challenge.ends_at,
    serverTime: now,
    status: challengeStatus(challenge, now),
    prizes: JSON.parse(challenge.prize_json || "[]"),
    locked: { teamId: challenge.locked_team_id, team: "Palestine", simulation: "Standard", goalLevel: "Normal" },
  };
}

function publicAccount(account) {
  if (!account) return null;
  const country = DRAFT_TEAMS.find((team) => team.id === account.profile_country_id) || null;
  return {
    id: account.id,
    username: account.username,
    profileCountryId: country?.id || null,
    profileCountryName: country?.name || null,
    usernameNeedsReview: account.usernameNeedsReview === true,
    assetPacks: Number(account.pl_26_27_assets_installed) === 1 ? [PL_ASSET_PACK_ID] : [],
  };
}

function validProfileCountryId(value) {
  const countryId = typeof value === "string" ? value.trim() : "";
  return DRAFT_TEAMS.some((team) => team.id === countryId) ? countryId : undefined;
}

async function currentChallenge(db, now = Date.now()) {
  const challenge = await db.prepare(`
    SELECT * FROM challenges
    WHERE starts_at <= ?
    ORDER BY starts_at DESC
    LIMIT 1
  `).bind(now).first() || await db.prepare("SELECT * FROM challenges ORDER BY starts_at ASC LIMIT 1").first();
  if (!challenge) throw new ChallengeRequestError("No Palestine Challenge is configured.", 503);
  return challenge;
}

async function authenticatedAccount(request, db, required = true, allowLocalSession = false) {
  const tokens = challengeSessionTokensFromRequest(request, allowLocalSession);
  if (!tokens.length) {
    if (required) throw new ChallengeRequestError("Log in to continue.", 401);
    return null;
  }
  let account = null;
  let tokenHash = null;
  for (const token of tokens) {
    tokenHash = await hashChallengeSessionToken(token);
    account = await db.prepare(`
      SELECT accounts.id, accounts.username, accounts.email, accounts.profile_country_id, accounts.created_at,
        EXISTS(
          SELECT 1 FROM account_asset_packs
          WHERE account_id = accounts.id AND pack_id = '${PL_ASSET_PACK_ID}'
        ) AS pl_26_27_assets_installed,
        (
          SELECT provider_subject FROM auth_identities
          WHERE account_id = accounts.id AND provider = 'google'
          LIMIT 1
        ) AS google_subject
      FROM sessions
      JOIN accounts ON accounts.id = sessions.account_id
      WHERE sessions.token_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > ?
    `).bind(tokenHash, Date.now()).first();
    if (account) break;
  }
  if (!account && required) throw new ChallengeRequestError("Your session has expired. Please log in again.", 401);
  if (!account) return null;
  const usernameNeedsReview = await generatedGoogleUsernameNeedsReview(account);
  return { ...account, tokenHash, usernameNeedsReview };
}

async function createSession(db, accountId, request) {
  const token = makeChallengeSessionToken();
  const tokenHash = await hashChallengeSessionToken(token);
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE account_id = ? AND (expires_at <= ? OR revoked_at IS NOT NULL)").bind(accountId, now),
    db.prepare(`
      INSERT INTO sessions (token_hash, account_id, created_at, expires_at, user_agent_hash)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tokenHash, accountId, now, now + SESSION_LIFETIME_MS, await userAgentHash(request)),
  ]);
  return token;
}

async function register(request, env) {
  const body = await readJson(request);
  const email = normalizeChallengeEmail(body.email);
  const username = normalizeChallengeUsername(body.username);
  if (!email) throw new ChallengeRequestError("Enter a valid email address.");
  if (!username) throw new ChallengeRequestError("Use 3-20 lowercase letters, numbers or underscores for your username.");
  if (!validChallengePassword(body.password)) throw new ChallengeRequestError("Password must be 10-128 characters.");
  const accountId = crypto.randomUUID();
  let password;
  try {
    password = await hashChallengePassword(body.password);
  } catch (error) {
    console.error("Account password hashing failed", error instanceof Error ? error.message : String(error));
    throw new ChallengeRequestError(
      "Account signup is temporarily unavailable because secure password processing failed. Please try again shortly.",
      503,
      { code: "password_hash_failed" },
    );
  }
  const now = Date.now();
  try {
    await env.CHALLENGE_DB.prepare(`
      INSERT INTO accounts (id, username, password_hash, password_salt, password_iterations, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(accountId, username, password.hash, password.salt, password.iterations, email, now).run();
  } catch (error) {
    const message = String(error).toLowerCase();
    if (message.includes("unique") && message.includes("email")) {
      throw new ChallengeRequestError("An account already uses that email address. Log in instead.", 409);
    }
    if (message.includes("unique")) throw new ChallengeRequestError("That username is already taken.", 409);
    console.error("Account creation failed", error instanceof Error ? error.message : String(error));
    throw new ChallengeRequestError("Your account could not be created because the account database rejected the request. Please try again.", 500, { code: "account_create_failed" });
  }
  let token;
  try {
    token = await createSession(env.CHALLENGE_DB, accountId, request);
  } catch (error) {
    console.error("Account session creation failed", error instanceof Error ? error.message : String(error));
    throw new ChallengeRequestError(
      "Your account was created, but automatic sign-in failed. Log in with your new username and password.",
      500,
      { code: "session_create_failed", accountCreated: true },
    );
  }
  return responseJson({
    account: { id: accountId, username, profileCountryId: null, profileCountryName: null, assetPacks: [] },
  }, 201, {
    "Set-Cookie": challengeSessionCookiesForRequest(
      request,
      token,
      undefined,
      env.LOCAL_DEV_AUTH === "true",
    ),
  });
}

async function login(request, env) {
  const body = await readJson(request);
  const rawIdentifier = typeof body.identifier === "string" ? body.identifier : body.username;
  const email = normalizeChallengeEmail(rawIdentifier);
  const username = normalizeChallengeUsername(rawIdentifier);
  if ((!email && !username) || !validChallengePassword(body.password)) {
    throw new ChallengeRequestError("Invalid username/email or password.", 401);
  }
  const accountLookup = email
    ? "accounts.email = ? COLLATE NOCASE"
    : "accounts.username = ? COLLATE NOCASE";
  const account = await env.CHALLENGE_DB.prepare(`
    SELECT accounts.*,
      EXISTS(
        SELECT 1 FROM account_asset_packs
        WHERE account_id = accounts.id AND pack_id = '${PL_ASSET_PACK_ID}'
      ) AS pl_26_27_assets_installed
    FROM accounts
    WHERE ${accountLookup}
  `).bind(email || username).first();
  let passwordMatches = false;
  if (account) passwordMatches = await verifyChallengePassword(body.password, account);
  else await hashChallengePassword(body.password, new Uint8Array(16));
  if (!account || !passwordMatches) {
    throw new ChallengeRequestError("Invalid username/email or password.", 401);
  }
  const token = await createSession(env.CHALLENGE_DB, account.id, request);
  return responseJson({ account: publicAccount(account) }, 200, {
    "Set-Cookie": challengeSessionCookiesForRequest(
      request,
      token,
      undefined,
      env.LOCAL_DEV_AUTH === "true",
    ),
  });
}

async function logout(request, env) {
  const account = await authenticatedAccount(request, env.CHALLENGE_DB, false, env.LOCAL_DEV_AUTH === "true");
  if (account) await env.CHALLENGE_DB.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?").bind(Date.now(), account.tokenHash).run();
  return responseJson({ ok: true }, 200, {
    "Set-Cookie": clearChallengeSessionCookiesForRequest(request, env.LOCAL_DEV_AUTH === "true"),
  });
}

async function profile(request, env, account) {
  if (request.method === "GET") {
    const deletionRequest = await env.CHALLENGE_DB.prepare(`
      SELECT reason, details, status, requested_at, completed_at
      FROM account_deletion_requests WHERE account_id = ?
    `).bind(account.id).first();
    return responseJson({
      account: publicAccount(account),
      countries: DRAFT_TEAMS.map(({ id, name }) => ({ id, name })),
      deletionRequest: deletionRequest || null,
    });
  }
  if (request.method !== "PATCH") return responseJson({ error: "Method not allowed." }, 405);
  const body = await readJson(request);
  const username = normalizeChallengeUsername(body.username);
  if (!username) throw new ChallengeRequestError("Use 3-20 lowercase letters, numbers or underscores for your username.");
  const countryId = Object.prototype.hasOwnProperty.call(body, "profileCountryId")
    ? validProfileCountryId(body.profileCountryId)
    : account.profile_country_id || null;
  if (countryId === undefined) throw new ChallengeRequestError("Choose a valid country for your profile picture.");
  const now = Date.now();
  try {
    await env.CHALLENGE_DB.prepare(`
      UPDATE accounts SET username = ?, profile_country_id = ? WHERE id = ?
    `).bind(username, countryId, account.id).run();
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ChallengeRequestError("That username is already taken.", 409);
    throw error;
  }
  const updated = await env.CHALLENGE_DB.prepare(`
    SELECT accounts.id, accounts.username, accounts.profile_country_id, accounts.created_at,
      EXISTS(
        SELECT 1 FROM account_asset_packs
        WHERE account_id = accounts.id AND pack_id = '${PL_ASSET_PACK_ID}'
      ) AS pl_26_27_assets_installed
    FROM accounts WHERE accounts.id = ?
  `)
    .bind(account.id).first();
  return responseJson({ account: publicAccount(updated), updatedAt: now });
}

async function installAssetPack(request, env, account, packId) {
  if (request.method !== "POST") return responseJson({ error: "Method not allowed." }, 405);
  if (packId !== PL_ASSET_PACK_ID) return responseJson({ error: "Asset pack not found." }, 404);
  const installedAt = Date.now();
  await env.CHALLENGE_DB.prepare(`
    INSERT INTO account_asset_packs (account_id, pack_id, installed_at)
    VALUES (?, ?, ?)
    ON CONFLICT(account_id, pack_id) DO NOTHING
  `).bind(account.id, packId, installedAt).run();
  const installed = await env.CHALLENGE_DB.prepare(`
    SELECT installed_at FROM account_asset_packs
    WHERE account_id = ? AND pack_id = ?
  `).bind(account.id, packId).first();
  return responseJson({
    assetPack: {
      id: packId,
      installed: true,
      installedAt: installed?.installed_at || installedAt,
    },
    account: publicAccount({ ...account, pl_26_27_assets_installed: 1 }),
  });
}

async function requestAccountDeletion(request, env, account) {
  if (request.method !== "POST") return responseJson({ error: "Method not allowed." }, 405);
  const body = await readJson(request);
  const reasons = new Set(["not_using", "privacy", "technical", "other"]);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (!reasons.has(reason)) throw new ChallengeRequestError("Choose a reason for deleting your account.");
  if (details.length > 500) throw new ChallengeRequestError("Keep the additional details under 500 characters.");
  const now = Date.now();
  await env.CHALLENGE_DB.prepare(`
    INSERT INTO account_deletion_requests (account_id, reason, details, status, requested_at, completed_at)
    VALUES (?, ?, ?, 'pending', ?, NULL)
    ON CONFLICT(account_id) DO UPDATE SET
      reason = excluded.reason,
      details = excluded.details,
      status = 'pending',
      requested_at = excluded.requested_at,
      completed_at = NULL
  `).bind(account.id, reason, details, now).run();
  return responseJson({
    deletionRequest: { reason, details, status: "pending", requested_at: now, completed_at: null },
  }, 201);
}

function publicRun(row) {
  if (!row) return null;
  const state = JSON.parse(row.state_json);
  const latest = state.rounds.at(-1) || null;
  const scoreBreakdown = state.rounds.reduce((totals, round) => ({
    progress: totals.progress + (round.breakdown?.progressPoints || 0),
    goals: totals.goals + (round.breakdown?.goalPoints || 0),
    champion: totals.champion + (round.breakdown?.championPoints || 0),
  }), { progress: 0, goals: 0, champion: 0 });
  return {
    id: row.id,
    status: row.status,
    score: row.score,
    goals: row.goals,
    counted: Boolean(row.counted),
    furthestRound: row.furthest_round,
    tournamentWon: Boolean(row.tournament_won),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    nextActionAt: row.next_action_at,
    roundIndex: state.roundIndex,
    round: CHALLENGE_ROUNDS[state.roundIndex]?.label || "Complete",
    latestMatch: latest ? { ...latest.palestineMatch, opponent: latest.opponent, breakdown: latest.breakdown } : null,
    scoreBreakdown,
    results: state.rounds.map((round) => ({
      round: CHALLENGE_ROUNDS[round.roundIndex]?.label || "Round",
      ...round.palestineMatch,
      opponent: round.opponent,
      points: round.breakdown?.total || 0,
    })),
  };
}

async function commandReceipt(db, accountId, commandId, action) {
  if (!COMMAND_ID_PATTERN.test(commandId || "")) throw new ChallengeRequestError("Invalid command identifier.");
  const existing = await db.prepare("SELECT action, response_json FROM challenge_commands WHERE account_id = ? AND command_id = ?")
    .bind(accountId, commandId).first();
  if (!existing) return null;
  if (existing.action !== action) throw new ChallengeRequestError("That command identifier was already used.", 409);
  return JSON.parse(existing.response_json);
}

async function startRun(request, env, account) {
  const body = await readJson(request);
  const receipt = await commandReceipt(env.CHALLENGE_DB, account.id, body.clientCommandId, "run-start");
  if (receipt) return responseJson(receipt);
  const challenge = await currentChallenge(env.CHALLENGE_DB);
  if (challengeStatus(challenge) !== "active") throw new ChallengeRequestError("This challenge is not accepting new runs.", 409);
  const forbidden = [
    body.teamId && body.teamId !== challenge.locked_team_id,
    body.simulation && body.simulation !== challenge.upset_mode,
    body.goalLevel && body.goalLevel !== challenge.goal_level,
  ].some(Boolean);
  if (forbidden) throw new ChallengeRequestError("Palestine Challenge settings are locked by the server.", 403);
  const existing = await env.CHALLENGE_DB.prepare(`
    SELECT * FROM challenge_runs WHERE account_id = ? AND challenge_id = ? AND status = 'active'
  `).bind(account.id, challenge.id).first();
  if (existing) {
    const payload = { run: publicRun(existing), resumed: true };
    await env.CHALLENGE_DB.prepare(`INSERT INTO challenge_commands (account_id, command_id, action, response_json, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(account.id, body.clientCommandId, "run-start", JSON.stringify(payload), Date.now()).run();
    return responseJson(payload);
  }
  const now = Date.now();
  const runId = crypto.randomUUID();
  const state = createChallengeRunState(DRAFT_TEAMS, `${runId}:${crypto.randomUUID()}`);
  const payload = { run: { id: runId, status: "active", score: 0, goals: 0, counted: false, furthestRound: "Round of 256", tournamentWon: false, startedAt: now, completedAt: null, nextActionAt: now, roundIndex: 0, round: CHALLENGE_ROUNDS[0].label, latestMatch: null }, resumed: false };
  try {
    await env.CHALLENGE_DB.batch([
      env.CHALLENGE_DB.prepare(`
        INSERT INTO challenge_runs (id, challenge_id, account_id, status, state_json, started_at, next_action_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?)
      `).bind(runId, challenge.id, account.id, JSON.stringify(state), now, now),
      env.CHALLENGE_DB.prepare(`INSERT INTO challenge_commands (account_id, command_id, action, response_json, created_at) VALUES (?, ?, ?, ?, ?)`)
        .bind(account.id, body.clientCommandId, "run-start", JSON.stringify(payload), now),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ChallengeRequestError("You already have an active run.", 409);
    throw error;
  }
  return responseJson(payload, 201);
}

async function recalculateLeaderboard(db, challengeId, accountId, now) {
  const rows = (await db.prepare(`
    SELECT id, score, goals, tournament_won, semi_final, strongest_opponent, strongest_opponent_rank, completed_at
    FROM challenge_runs WHERE challenge_id = ? AND account_id = ? AND status = 'completed'
    ORDER BY completed_at DESC
  `).bind(challengeId, accountId).all()).results;
  const counted = countedRunIds(rows.map((row) => ({ id: row.id, score: row.score, completedAt: row.completed_at })));
  const countedRows = rows.filter((row) => counted.has(row.id));
  const strongest = rows.filter((row) => row.strongest_opponent_rank).sort((a, b) => a.strongest_opponent_rank - b.strongest_opponent_rank)[0] || null;
  const totalScore = countedRows.reduce((sum, row) => sum + row.score, 0);
  const statements = [db.prepare("UPDATE challenge_runs SET counted = 0 WHERE challenge_id = ? AND account_id = ?").bind(challengeId, accountId)];
  counted.forEach((runId) => statements.push(db.prepare("UPDATE challenge_runs SET counted = 1 WHERE id = ?").bind(runId)));
  statements.push(db.prepare(`
    INSERT INTO challenge_leaderboard (
      challenge_id, account_id, total_score, best_run, attempts, tournament_wins,
      semi_finals, goals, strongest_opponent, strongest_opponent_rank, latest_completion, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(challenge_id, account_id) DO UPDATE SET
      total_score = excluded.total_score, best_run = excluded.best_run, attempts = excluded.attempts,
      tournament_wins = excluded.tournament_wins, semi_finals = excluded.semi_finals,
      goals = excluded.goals, strongest_opponent = excluded.strongest_opponent,
      strongest_opponent_rank = excluded.strongest_opponent_rank,
      latest_completion = excluded.latest_completion, updated_at = excluded.updated_at
  `).bind(
    challengeId,
    accountId,
    totalScore,
    Math.max(0, ...rows.map((row) => row.score)),
    rows.length,
    rows.reduce((sum, row) => sum + row.tournament_won, 0),
    rows.reduce((sum, row) => sum + row.semi_final, 0),
    rows.reduce((sum, row) => sum + row.goals, 0),
    strongest?.strongest_opponent || null,
    strongest?.strongest_opponent_rank || null,
    Math.max(0, ...rows.map((row) => row.completed_at || 0)),
    now,
  ));
  await db.batch(statements);
}

async function playRun(request, env, account, runId) {
  const body = await readJson(request);
  const action = `run-play:${runId}`;
  const receipt = await commandReceipt(env.CHALLENGE_DB, account.id, body.clientCommandId, action);
  if (receipt) return responseJson(receipt);
  const challenge = await currentChallenge(env.CHALLENGE_DB);
  if (challengeStatus(challenge) !== "active") throw new ChallengeRequestError("The challenge has ended and the leaderboard is frozen.", 409);
  const row = await env.CHALLENGE_DB.prepare("SELECT * FROM challenge_runs WHERE id = ? AND account_id = ?").bind(runId, account.id).first();
  if (!row) throw new ChallengeRequestError("Run not found.", 404);
  if (row.status !== "active") throw new ChallengeRequestError("This run is already complete.", 409);
  const now = Date.now();
  if (now < row.next_action_at) throw new ChallengeRequestError("The next tie is not ready yet.", 429, { retryAfterMs: row.next_action_at - now });
  const played = playChallengeRound(JSON.parse(row.state_json), DRAFT_TEAMS);
  const completed = played.state.status === "completed";
  const nextActionAt = completed ? now : now + CHALLENGE_MIN_MATCH_INTERVAL_MS;
  const furthestRound = furthestRoundLabel(played.state);
  const payload = {
    run: {
      id: row.id,
      status: played.state.status,
      score: played.state.score,
      goals: played.state.goals,
      counted: false,
      furthestRound,
      tournamentWon: played.champion,
      startedAt: row.started_at,
      completedAt: completed ? now : null,
      nextActionAt,
      roundIndex: played.state.roundIndex,
      round: CHALLENGE_ROUNDS[played.state.roundIndex]?.label || "Complete",
      latestMatch: { ...played.match, opponent: { id: played.opponent.id, name: played.opponent.name, rank: played.opponent.officialFifaRank || null }, breakdown: played.breakdown },
    },
  };
  const updated = await env.CHALLENGE_DB.prepare(`
    UPDATE challenge_runs SET status = ?, state_json = ?, score = ?, goals = ?, furthest_round = ?,
      tournament_won = ?, semi_final = ?, strongest_opponent = ?, strongest_opponent_rank = ?,
      next_action_at = ?, completed_at = ?, version = version + 1
    WHERE id = ? AND account_id = ? AND version = ? AND status = 'active'
  `).bind(
    played.state.status,
    JSON.stringify(played.state),
    played.state.score,
    played.state.goals,
    furthestRound,
    played.champion ? 1 : 0,
    played.state.roundIndex >= 7 ? 1 : 0,
    played.state.strongestOpponent?.name || null,
    played.state.strongestOpponent?.rank || null,
    nextActionAt,
    completed ? now : null,
    row.id,
    account.id,
    row.version,
  ).run();
  if (!updated.meta.changes) throw new ChallengeRequestError("Run changed in another request. Refresh and try again.", 409);
  await env.CHALLENGE_DB.batch([
    env.CHALLENGE_DB.prepare(`
      INSERT INTO challenge_run_matches (run_id, round_index, result_json, score_awarded, played_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(row.id, played.state.roundIndex - 1, JSON.stringify(payload.run.latestMatch), played.breakdown.total, now),
    env.CHALLENGE_DB.prepare(`INSERT INTO challenge_commands (account_id, command_id, action, response_json, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(account.id, body.clientCommandId, action, JSON.stringify(payload), now),
  ]);
  if (completed) {
    await recalculateLeaderboard(env.CHALLENGE_DB, challenge.id, account.id, now);
    const refreshed = await env.CHALLENGE_DB.prepare("SELECT counted FROM challenge_runs WHERE id = ?").bind(row.id).first();
    payload.run.counted = Boolean(refreshed?.counted);
    await env.CHALLENGE_DB.prepare(`
      UPDATE challenge_commands SET response_json = ? WHERE account_id = ? AND command_id = ? AND action = ?
    `).bind(JSON.stringify(payload), account.id, body.clientCommandId, action).run();
  }
  return responseJson(payload);
}

async function leaderboard(db, challenge, account) {
  const rows = (await db.prepare(`
    SELECT ROW_NUMBER() OVER (ORDER BY l.total_score DESC, l.best_run DESC, l.latest_completion ASC) AS position,
      a.username, l.account_id, l.total_score, l.best_run, l.attempts, l.tournament_wins,
      l.semi_finals, l.goals, l.strongest_opponent, l.latest_completion
    FROM challenge_leaderboard l JOIN accounts a ON a.id = l.account_id
    WHERE l.challenge_id = ?
    ORDER BY position LIMIT 100
  `).bind(challenge.id).all()).results;
  let own = account ? rows.find((row) => row.account_id === account.id) : null;
  if (account && !own) {
    own = await db.prepare(`
      SELECT * FROM (
        SELECT ROW_NUMBER() OVER (ORDER BY l.total_score DESC, l.best_run DESC, l.latest_completion ASC) AS position,
          a.username, l.account_id, l.total_score, l.best_run, l.attempts, l.tournament_wins,
          l.semi_finals, l.goals, l.strongest_opponent, l.latest_completion
        FROM challenge_leaderboard l JOIN accounts a ON a.id = l.account_id WHERE l.challenge_id = ?
      ) WHERE account_id = ?
    `).bind(challenge.id, account.id).first();
  }
  return { entries: rows.map(({ account_id, ...entry }) => entry), own: own ? Object.fromEntries(Object.entries(own).filter(([key]) => key !== "account_id")) : null };
}

async function dashboard(request, env) {
  const now = Date.now();
  const challenge = await currentChallenge(env.CHALLENGE_DB, now);
  const account = await authenticatedAccount(request, env.CHALLENGE_DB, false, env.LOCAL_DEV_AUTH === "true");
  const board = await leaderboard(env.CHALLENGE_DB, challenge, account);
  let activeRun = null;
  let history = [];
  if (account) {
    activeRun = await env.CHALLENGE_DB.prepare(`SELECT * FROM challenge_runs WHERE account_id = ? AND challenge_id = ? AND status = 'active'`)
      .bind(account.id, challenge.id).first();
    history = (await env.CHALLENGE_DB.prepare(`
      SELECT * FROM challenge_runs WHERE account_id = ? AND challenge_id = ? AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 100
    `).bind(account.id, challenge.id).all()).results.map(publicRun);
  }
  return responseJson({
    challenge: publicChallenge(challenge, now),
    account: publicAccount(account),
    activeRun: publicRun(activeRun),
    history,
    leaderboard: board,
    auth: { googleEnabled: googleAuthEnabled(env) },
  });
}

function retroAchievementConfig(year) {
  if (Number(year) === 2010) {
    return {
      year: 2010,
      table: "retro_2010_attempts",
      teams: RETRO_2010_TEAMS,
      id: "retro-2010-world-tour",
      title: "South Africa 2010 World Tour",
    };
  }
  if (Number(year) === 2018) {
    return {
      year: 2018,
      table: "retro_2018_attempts",
      teams: RETRO_2018_TEAMS,
      id: "retro-2018-world-tour",
      title: "Russia 2018 World Tour",
    };
  }
  if (Number(year) === 2016) {
    return {
      year: 2016,
      table: "retro_2016_attempts",
      teams: RETRO_2016_TEAMS,
      id: "retro-2016-european-tour",
      title: "UEFA Euro 2016 Tour",
    };
  }
  if (Number(year) === 2022) {
    return {
      year: 2022,
      table: "retro_2022_attempts",
      teams: RETRO_2022_TEAMS,
      id: "retro-2022-world-tour",
      title: "Qatar 2022 World Tour",
    };
  }
  return {
    year: 2014,
    table: "retro_2014_attempts",
    teams: RETRO_2014_TEAMS,
    id: "retro-2014-world-tour",
    title: "Brazil 2014 World Tour",
  };
}

export function retroAchievementPoints(year, teamName) {
  const config = retroAchievementConfig(year);
  const ratings = RETRO_TEAM_RATINGS[config.year];
  const teamIndex = config.teams.indexOf(teamName);
  if (teamIndex < 0 || !ratings || ratings.length !== config.teams.length) return 0;
  const rating = ratings[teamIndex];
  if (rating >= 90) return 1;
  if (rating >= 87) return 2;
  if (rating >= 84) return 3;
  if (rating >= 81) return 4;
  if (rating >= 78) return 5;
  if (rating >= 75) return 6;
  if (rating >= 72) return 8;
  return 10;
}

export function knockout256AchievementDefinition(teamId) {
  const team = DRAFT_TEAMS.find((entry) => entry.id === teamId);
  if (!team) return null;
  if (team.id === "team-25") {
    return {
      teamId,
      teamName: team.name,
      objective: "lose-round-256",
      objectiveLabel: "Lose in the Round of 256",
      targetRoundIndex: 0,
      points: 4,
    };
  }
  const rating = Number(team.simulationRatings?.overall) || 0;
  if (rating >= 50) {
    return {
      teamId,
      teamName: team.name,
      objective: "champion",
      objectiveLabel: "Win the tournament",
      targetRoundIndex: 7,
      points: rating >= 90 ? 1 : rating >= 80 ? 1 : rating >= 70 ? 2 : rating >= 60 ? 2 : 3,
    };
  }
  if (rating >= 45) {
    return { teamId, teamName: team.name, objective: "reach", objectiveLabel: "Reach the final", targetRoundIndex: 7, points: 3 };
  }
  if (rating >= 40) {
    return { teamId, teamName: team.name, objective: "reach", objectiveLabel: "Reach the semi-finals", targetRoundIndex: 6, points: 4 };
  }
  if (rating >= 35) {
    return { teamId, teamName: team.name, objective: "reach", objectiveLabel: "Reach the quarter-finals", targetRoundIndex: 5, points: 4 };
  }
  return { teamId, teamName: team.name, objective: "reach", objectiveLabel: "Reach the Round of 16", targetRoundIndex: 4, points: 5 };
}

export function knockout256ObjectiveAchieved(definition, {
  bestRoundIndex,
  championTeamId = null,
  phase = "progress",
} = {}) {
  if (!definition) return 0;
  if (definition.objective === "champion") {
    return Number(
      phase === "complete"
      && bestRoundIndex === 7
      && championTeamId === definition.teamId
    );
  }
  if (definition.objective === "lose-round-256") {
    return Number(
      phase === "complete"
      && bestRoundIndex === 0
      && championTeamId !== definition.teamId
    );
  }
  return Number(bestRoundIndex >= definition.targetRoundIndex);
}

async function knockout256AchievementProgress(db, account) {
  const rows = account ? (await db.prepare(`
    WITH account_attempts AS (
      SELECT team_id, champion, achieved, best_round_index, started_at, completed_at
      FROM knockout_256_attempts
      WHERE account_id = ?
    ),
    first_achievements AS (
      SELECT team_id,
        MIN(CASE
          WHEN team_id = 'team-25'
            AND best_round_index = 0
            AND completed_at IS NOT NULL
            AND champion = 0
            THEN COALESCE(completed_at, started_at)
          WHEN team_id <> 'team-25' AND achieved = 1
            THEN COALESCE(completed_at, started_at)
        END) AS first_unlock_at,
        MIN(CASE WHEN champion = 1 THEN COALESCE(completed_at, started_at) END) AS first_champion_at
      FROM account_attempts
      GROUP BY team_id
    )
    SELECT attempts.team_id,
      COUNT(*) AS attempts,
      MAX(attempts.champion) AS champion,
      MAX(attempts.achieved) AS achieved,
      MAX(CASE
        WHEN attempts.team_id = 'team-25'
          AND attempts.best_round_index = 0
          AND attempts.completed_at IS NOT NULL
          AND attempts.champion = 0
          THEN 1
        ELSE 0
      END) AS lost_round_256,
      MAX(attempts.best_round_index) AS best_round_index,
      SUM(CASE
        WHEN first_achievements.first_unlock_at IS NOT NULL
          AND attempts.started_at <= first_achievements.first_unlock_at THEN 1
        ELSE 0
      END) AS achieved_on_attempt,
      SUM(CASE
        WHEN first_achievements.first_champion_at IS NOT NULL
          AND attempts.started_at <= first_achievements.first_champion_at THEN 1
        ELSE 0
      END) AS champion_on_attempt,
      MAX(first_achievements.first_unlock_at) AS unlocked_at,
      MAX(first_achievements.first_champion_at) AS champion_at
    FROM account_attempts attempts
    LEFT JOIN first_achievements ON first_achievements.team_id = attempts.team_id
    GROUP BY attempts.team_id
  `).bind(account.id).all()).results : [];
  const byTeam = new Map(rows.map((row) => [row.team_id, row]));
  const teams = DRAFT_TEAMS.map((team) => {
    const definition = knockout256AchievementDefinition(team.id);
    const row = byTeam.get(team.id);
    const championObjective = definition.objective === "champion";
    const loseFirstRoundObjective = definition.objective === "lose-round-256";
    const complete = championObjective
      ? Number(row?.champion || 0) === 1
      : loseFirstRoundObjective
        ? Number(row?.lost_round_256 || 0) === 1
        : Number(row?.achieved || 0) === 1;
    const achievedOnAttempt = Number(
      championObjective ? row?.champion_on_attempt : row?.achieved_on_attempt,
    ) || null;
    const unlockedAt = Number(championObjective ? row?.champion_at : row?.unlocked_at) || null;
    return {
      ...definition,
      attempts: Number(row?.attempts || 0),
      bestRoundIndex: Number(row?.best_round_index || 0),
      complete,
      won: complete,
      achievedOnAttempt,
      wonOnAttempt: achievedOnAttempt,
      unlockedAt,
    };
  });
  const completed = teams.filter((team) => team.complete).length;
  return {
    id: "knockout-256-world-tour",
    title: "256 Knockout World Tour",
    year: KNOCKOUT_256_KEY,
    mode: "knockout-256",
    completed,
    completedPoints: teams.reduce((sum, team) => sum + (team.complete ? team.points : 0), 0),
    totalPoints: teams.reduce((sum, team) => sum + team.points, 0),
    total: teams.length,
    unlocked: completed === teams.length,
    teams,
  };
}

async function retroAchievementProgress(db, account, year) {
  const config = retroAchievementConfig(year);
  const rows = account ? (await db.prepare(`
    WITH account_attempts AS (
      SELECT team_name, won, started_at, completed_at
      FROM ${config.table}
      WHERE account_id = ?
    ),
    first_wins AS (
      SELECT team_name, MIN(COALESCE(completed_at, started_at)) AS first_win_at
      FROM account_attempts
      WHERE won = 1
      GROUP BY team_name
    )
    SELECT attempts.team_name,
      COUNT(*) AS attempts,
      MAX(attempts.won) AS won,
      SUM(CASE
        WHEN first_wins.first_win_at IS NOT NULL AND attempts.started_at <= first_wins.first_win_at THEN 1
        ELSE 0
      END) AS won_on_attempt,
      MAX(first_wins.first_win_at) AS unlocked_at
    FROM account_attempts attempts
    LEFT JOIN first_wins ON first_wins.team_name = attempts.team_name
    GROUP BY attempts.team_name
  `).bind(account.id).all()).results : [];
  const byTeam = new Map(rows.map((row) => [row.team_name, row]));
  const teams = config.teams.map((teamName) => {
    const row = byTeam.get(teamName);
    return {
      teamName,
      points: retroAchievementPoints(config.year, teamName),
      attempts: Number(row?.attempts || 0),
      won: Number(row?.won || 0) === 1,
      wonOnAttempt: Number(row?.won_on_attempt || 0) || null,
      unlockedAt: Number(row?.unlocked_at || 0) || null,
    };
  });
  const completed = teams.filter((team) => team.won).length;
  const completedPoints = teams.reduce((sum, team) => sum + (team.won ? team.points : 0), 0);
  return {
    id: config.id,
    title: config.title,
    year: config.year,
    completed,
    completedPoints,
    totalPoints: teams.reduce((sum, team) => sum + team.points, 0),
    total: config.teams.length,
    unlocked: completed === config.teams.length,
    teams,
  };
}

async function achievementLeaderboard(request, env) {
  const account = await authenticatedAccount(request, env.CHALLENGE_DB, false, env.LOCAL_DEV_AUTH === "true");
  const [accountRows, retroRows, knockoutRows] = await Promise.all([
    env.CHALLENGE_DB.prepare(`
      SELECT id AS account_id, username, profile_country_id
      FROM accounts
    `).all(),
    env.CHALLENGE_DB.prepare(`
      SELECT account_id, 2010 AS year, team_name, 1 AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM retro_2010_attempts WHERE won = 1 GROUP BY account_id, team_name
      UNION ALL
      SELECT account_id, 2014 AS year, team_name, 1 AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM retro_2014_attempts WHERE won = 1 GROUP BY account_id, team_name
      UNION ALL
      SELECT account_id, 2016 AS year, team_name, 1 AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM retro_2016_attempts WHERE won = 1 GROUP BY account_id, team_name
      UNION ALL
      SELECT account_id, 2018 AS year, team_name, 1 AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM retro_2018_attempts WHERE won = 1 GROUP BY account_id, team_name
      UNION ALL
      SELECT account_id, 2022 AS year, team_name, 1 AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM retro_2022_attempts WHERE won = 1 GROUP BY account_id, team_name
    `).all(),
    env.CHALLENGE_DB.prepare(`
      SELECT account_id, 256 AS year, team_id AS team_name, MAX(champion) AS champion,
        MIN(COALESCE(completed_at, started_at)) AS unlocked_at
      FROM knockout_256_attempts
      WHERE (
        team_id = 'team-25'
        AND best_round_index = 0
        AND completed_at IS NOT NULL
        AND champion = 0
      ) OR (
        team_id <> 'team-25'
        AND achieved = 1
      )
      GROUP BY account_id, team_id
    `).all(),
  ]);
  const byAccount = new Map((accountRows.results || []).map((row) => [
    row.account_id,
    {
      accountId: row.account_id,
      username: row.username,
      profileCountryId: row.profile_country_id || null,
      points: 0,
      achievements: 0,
      latestUnlock: 0,
    },
  ]));
  [...(retroRows.results || []), ...(knockoutRows.results || [])].forEach((row) => {
    const entry = byAccount.get(row.account_id);
    if (!entry) return;
    if (row.year && row.team_name) {
      const knockoutDefinition = Number(row.year) === KNOCKOUT_256_KEY
        ? knockout256AchievementDefinition(row.team_name)
        : null;
      const validUnlock = !knockoutDefinition
        || knockoutDefinition.objective !== "champion"
        || Number(row.champion) === 1;
      if (!validUnlock) {
        return;
      }
      entry.points += Number(row.year) === KNOCKOUT_256_KEY
        ? knockoutDefinition?.points || 0
        : retroAchievementPoints(Number(row.year), row.team_name);
      entry.achievements += 1;
      entry.latestUnlock = Math.max(entry.latestUnlock, Number(row.unlocked_at || 0));
    }
  });
  const ranked = [...byAccount.values()]
    .sort((left, right) => right.points - left.points
      || right.achievements - left.achievements
      || left.latestUnlock - right.latestUnlock
      || left.username.localeCompare(right.username))
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      profileCountryId: entry.profileCountryId,
      points: entry.points,
      achievements: entry.achievements,
      isCurrentUser: entry.accountId === account?.id,
    }));
  const currentUser = account ? ranked.find((entry) => entry.isCurrentUser) || {
    rank: null,
    username: account.username,
    profileCountryId: account.profile_country_id || null,
    points: 0,
    achievements: 0,
    isCurrentUser: true,
  } : null;
  return responseJson({
    leaderboard: ranked.slice(0, 100),
    currentUser,
    totalAchievements: RETRO_ACHIEVEMENT_YEARS.reduce(
      (sum, year) => sum + retroAchievementConfig(year).teams.length,
      DRAFT_TEAMS.length,
    ),
  });
}

async function knockout256Achievement(request, env, account) {
  if (request.method === "GET") {
    return responseJson({ achievement: await knockout256AchievementProgress(env.CHALLENGE_DB, account) });
  }
  if (request.method !== "POST") return responseJson({ error: "Method not allowed." }, 405);

  const body = await request.json().catch(() => ({}));
  const definition = knockout256AchievementDefinition(typeof body.teamId === "string" ? body.teamId : "");
  const seed = Number(body.seed);
  const bestRoundIndex = Number(body.bestRoundIndex);
  const phase = body.phase === "complete" ? "complete" : "progress";
  if (
    !definition
    || !Number.isSafeInteger(seed)
    || seed < 0
    || !Number.isInteger(bestRoundIndex)
    || bestRoundIndex < 0
    || bestRoundIndex > 7
  ) {
    throw new ChallengeRequestError("Invalid 256 knockout tournament.", 400);
  }

  const before = await knockout256AchievementProgress(env.CHALLENGE_DB, account);
  const previousTeam = before.teams.find((team) => team.teamId === definition.teamId);
  const now = Date.now();
  await env.CHALLENGE_DB.prepare(`
    INSERT OR IGNORE INTO knockout_256_attempts
      (account_id, tournament_seed, team_id, best_round_index, champion, achieved, started_at)
    VALUES (?, ?, ?, ?, 0, 0, ?)
  `).bind(account.id, seed, definition.teamId, bestRoundIndex, now).run();

  const champion = knockout256ObjectiveAchieved(
    { ...definition, objective: "champion" },
    { phase, bestRoundIndex, championTeamId: body.championTeamId },
  );
  const achieved = knockout256ObjectiveAchieved(
    definition,
    { phase, bestRoundIndex, championTeamId: body.championTeamId },
  );
  await env.CHALLENGE_DB.prepare(`
    UPDATE knockout_256_attempts
    SET best_round_index = MAX(best_round_index, ?),
      champion = MAX(champion, ?),
      achieved = MAX(achieved, ?),
      completed_at = CASE
        WHEN completed_at IS NULL AND (? = 1 OR ? = 'complete') THEN ?
        ELSE completed_at
      END
    WHERE account_id = ? AND tournament_seed = ? AND team_id = ?
  `).bind(
    bestRoundIndex,
    champion,
    achieved,
    achieved,
    phase,
    now,
    account.id,
    seed,
    definition.teamId,
  ).run();

  const achievement = await knockout256AchievementProgress(env.CHALLENGE_DB, account);
  const currentTeam = achievement.teams.find((team) => team.teamId === definition.teamId);
  return responseJson({
    achievement,
    countryUnlocked: !previousTeam?.complete && currentTeam?.complete === true,
    challengeUnlocked: !before.unlocked && achievement.unlocked,
    unlockedTeam: currentTeam,
  });
}

async function retroAchievement(request, env, account, year) {
  const config = retroAchievementConfig(year);
  if (request.method === "GET") {
    return responseJson({ achievement: await retroAchievementProgress(env.CHALLENGE_DB, account, config.year) });
  }
  if (request.method !== "POST") return responseJson({ error: "Method not allowed." }, 405);

  const body = await request.json().catch(() => ({}));
  const teamName = typeof body.teamName === "string" ? body.teamName.trim() : "";
  const seed = Number(body.seed);
  const phase = body.phase === "complete" ? "complete" : "start";
  if (!config.teams.includes(teamName) || !Number.isSafeInteger(seed) || seed < 0) {
    throw new ChallengeRequestError(`Invalid ${config.year} World Cup tournament.`, 400);
  }

  const before = await retroAchievementProgress(env.CHALLENGE_DB, account, config.year);
  const previousTeam = before.teams.find((team) => team.teamName === teamName);
  const now = Date.now();
  await env.CHALLENGE_DB.prepare(`
    INSERT OR IGNORE INTO ${config.table}
      (account_id, tournament_seed, team_name, won, started_at)
    VALUES (?, ?, ?, 0, ?)
  `).bind(account.id, seed, teamName, now).run();

  if (phase === "complete") {
    const won = body.champion === teamName ? 1 : 0;
    await env.CHALLENGE_DB.prepare(`
      UPDATE ${config.table}
      SET won = MAX(won, ?), completed_at = COALESCE(completed_at, ?)
      WHERE account_id = ? AND tournament_seed = ? AND team_name = ?
    `).bind(won, now, account.id, seed, teamName).run();
  }

  const achievement = await retroAchievementProgress(env.CHALLENGE_DB, account, config.year);
  const currentTeam = achievement.teams.find((team) => team.teamName === teamName);
  return responseJson({
    achievement,
    countryUnlocked: !previousTeam?.won && currentTeam?.won === true,
    challengeUnlocked: !before.unlocked && achievement.unlocked,
    unlockedTeam: currentTeam,
  });
}

export async function handleChallengeRequest(request, env, url) {
  if (!env.CHALLENGE_DB) return responseJson({ error: "The account service is not configured." }, 503);
  try {
    if (url.pathname === "/api/challenge" && request.method === "GET") return await dashboard(request, env);
    if (url.pathname === "/api/challenge/register" && request.method === "POST") return await register(request, env);
    if (url.pathname === "/api/challenge/login" && request.method === "POST") return await login(request, env);
    if (url.pathname === "/api/challenge/logout" && request.method === "POST") return await logout(request, env);
    if (url.pathname === "/api/challenge/google/start" && request.method === "GET") return await startGoogleLogin(request, env, url);
    if (url.pathname === "/api/challenge/google/callback" && request.method === "GET") return await completeGoogleLogin(request, env, url);
    if (url.pathname === "/api/challenge/achievements/leaderboard" && request.method === "GET") {
      return await achievementLeaderboard(request, env);
    }
    if (url.pathname === "/api/challenge/achievements/knockout-256") {
      const achievementAccount = await authenticatedAccount(
        request,
        env.CHALLENGE_DB,
        request.method !== "GET",
        env.LOCAL_DEV_AUTH === "true",
      );
      return await knockout256Achievement(request, env, achievementAccount);
    }
    const retroAchievementMatch = url.pathname.match(/^\/api\/challenge\/achievements\/retro-(2010|2014|2016|2018|2022)$/);
    if (retroAchievementMatch) {
      const achievementAccount = await authenticatedAccount(
        request,
        env.CHALLENGE_DB,
        request.method !== "GET",
        env.LOCAL_DEV_AUTH === "true",
      );
      return await retroAchievement(request, env, achievementAccount, Number(retroAchievementMatch[1]));
    }
    const account = await authenticatedAccount(request, env.CHALLENGE_DB, true, env.LOCAL_DEV_AUTH === "true");
    if (url.pathname === "/api/challenge/profile") return await profile(request, env, account);
    if (url.pathname === "/api/challenge/profile/deletion-request") return await requestAccountDeletion(request, env, account);
    const assetPackMatch = url.pathname.match(/^\/api\/challenge\/assets\/([a-z0-9-]+)$/);
    if (assetPackMatch) return await installAssetPack(request, env, account, assetPackMatch[1]);
    if (url.pathname === "/api/challenge/runs" && request.method === "POST") return await startRun(request, env, account);
    const runMatch = url.pathname.match(/^\/api\/challenge\/runs\/([0-9a-f-]{36})\/play$/i);
    if (runMatch && request.method === "POST") return await playRun(request, env, account, runMatch[1]);
    return responseJson({ error: "Not found." }, 404);
  } catch (error) {
    if (error instanceof ChallengeRequestError) {
      return responseJson({ error: error.message, ...(error.details || {}) }, error.status);
    }
    console.error("Palestine Challenge API failure", error instanceof Error ? error.stack || error.message : String(error));
    const accountRequest = ["/api/challenge/register", "/api/challenge/login", "/api/challenge/profile"].includes(url.pathname);
    return responseJson({
      error: accountRequest
        ? "The account request failed unexpectedly. Please try again."
        : "The request failed unexpectedly. Please try again.",
      code: "unexpected_request_failure",
    }, 500);
  }
}
