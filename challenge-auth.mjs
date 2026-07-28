const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const PBKDF2_ITERATIONS = 100_000;

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

export function normalizeChallengeEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  const [localPart, domain] = email.split("@");
  if (!localPart || localPart.length > 64 || !domain || domain.length > 253 || domain.includes("..")) return null;
  return email;
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

export async function hashChallengePassword(
  password,
  salt = crypto.getRandomValues(new Uint8Array(16)),
  iterations = PBKDF2_ITERATIONS,
) {
  const safeIterations = Number.isInteger(Number(iterations)) && Number(iterations) > 0
    ? Number(iterations)
    : PBKDF2_ITERATIONS;
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: safeIterations }, material, 256);
  return {
    hash: bytesToBase64Url(new Uint8Array(bits)),
    salt: bytesToBase64Url(salt),
    iterations: safeIterations,
  };
}

export async function verifyChallengePassword(password, record) {
  if (!record?.password_salt || !record?.password_hash) return false;
  const candidate = await hashChallengePassword(
    password,
    base64UrlToBytes(record.password_salt),
    Number(record.password_iterations) || PBKDF2_ITERATIONS,
  );
  const left = new TextEncoder().encode(candidate.hash);
  const right = new TextEncoder().encode(record.password_hash);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function challengeSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `__Host-world256_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearChallengeSessionCookie() {
  return "__Host-world256_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function clearLegacyChallengeSessionCookie() {
  return "palestine_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function clearLegacyPartitionedChallengeSessionCookie() {
  return "palestine_session=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0";
}

export function challengeSessionCookies(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return [
    clearLegacyChallengeSessionCookie(),
    clearLegacyPartitionedChallengeSessionCookie(),
    challengeSessionCookie(token, maxAgeSeconds),
  ];
}

function isLoopbackRequest(request) {
  try {
    const hostname = new URL(request.url).hostname.toLowerCase();
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
  } catch {
    return false;
  }
}

export function localChallengeSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `world256_local_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function challengeSessionCookiesForRequest(
  request,
  token,
  maxAgeSeconds = 60 * 60 * 24 * 30,
  allowLocalSession = false,
) {
  const cookies = challengeSessionCookies(token, maxAgeSeconds);
  if (allowLocalSession || isLoopbackRequest(request)) {
    cookies.push(localChallengeSessionCookie(token, maxAgeSeconds));
  }
  return cookies;
}

export function clearChallengeSessionCookies() {
  return [
    clearChallengeSessionCookie(),
    clearLegacyChallengeSessionCookie(),
    clearLegacyPartitionedChallengeSessionCookie(),
  ];
}

export function clearChallengeSessionCookiesForRequest(request, allowLocalSession = false) {
  const cookies = clearChallengeSessionCookies();
  if (allowLocalSession || isLoopbackRequest(request)) cookies.push(localChallengeSessionCookie("", 0));
  return cookies;
}

export function challengeSessionTokensFromRequest(request, allowLocalSession = false) {
  const cookies = (request.headers.get("Cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .map((part) => {
      const separator = part.indexOf("=");
      return separator > 0
        ? { name: part.slice(0, separator), value: part.slice(separator + 1) }
        : null;
    })
    .filter((cookie) => cookie && /^[A-Za-z0-9_-]{43}$/.test(cookie.value));
  const current = cookies
    .filter((cookie) => cookie.name === "__Host-world256_session")
    .map((cookie) => cookie.value);
  const legacy = cookies
    .filter((cookie) => cookie.name === "palestine_session")
    .map((cookie) => cookie.value);
  const local = allowLocalSession || isLoopbackRequest(request)
    ? cookies
      .filter((cookie) => cookie.name === "world256_local_session")
      .map((cookie) => cookie.value)
    : [];
  return [...new Set([...current, ...legacy, ...local])];
}

export function challengeSessionTokenFromRequest(request) {
  return challengeSessionTokensFromRequest(request)[0] || null;
}
