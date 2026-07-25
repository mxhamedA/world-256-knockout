const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const PBKDF2_ITERATIONS = 210_000;

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function normalizeChallengeUsername(value) {
  const username = typeof value === "string" ? value.trim().toLowerCase() : "";
  return USERNAME_PATTERN.test(username) ? username : null;
}

export function validChallengePassword(value) {
  return typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}

export function makeChallengeSessionToken() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashChallengeSessionToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashChallengePassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, material, 256);
  return {
    hash: bytesToBase64Url(new Uint8Array(bits)),
    salt: bytesToBase64Url(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function verifyChallengePassword(password, record) {
  if (!record?.password_salt || !record?.password_hash) return false;
  const candidate = await hashChallengePassword(password, base64UrlToBytes(record.password_salt));
  const left = new TextEncoder().encode(candidate.hash);
  const right = new TextEncoder().encode(record.password_hash);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function challengeSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `palestine_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearChallengeSessionCookie() {
  return "palestine_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

export function challengeSessionTokenFromRequest(request) {
  const cookie = request.headers.get("Cookie") || "";
  const session = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("palestine_session="));
  return session ? session.slice("palestine_session=".length) : null;
}
