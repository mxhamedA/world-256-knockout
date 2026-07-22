export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_ALPHABET = "0123456789";
export const NEW_ROOM_CODE_PATTERN = /^\d{4}$/;
export const ROOM_CODE_PATTERN = /^(?:\d{4}|[A-HJ-NP-Z2-9]{6})$/;
export const MAX_DISPLAY_NAME_LENGTH = 24;
export const ROOM_LIFETIME_MS = 6 * 60 * 60 * 1000;
export const MAX_ROOM_MEMBERS = 16;

export function normalizeRoomCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function normalizeDisplayName(value) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized || normalized.length > MAX_DISPLAY_NAME_LENGTH) return null;
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(normalized)) return null;
  return normalized;
}

export function randomString(length, alphabet, cryptoSource = globalThis.crypto) {
  if (!cryptoSource?.getRandomValues) throw new Error("Secure randomness is unavailable.");
  const output = [];
  const values = new Uint8Array(Math.max(16, length * 2));
  const usableRange = 256 - (256 % alphabet.length);
  while (output.length < length) {
    cryptoSource.getRandomValues(values);
    for (const value of values) {
      if (value >= usableRange) continue;
      output.push(alphabet[value % alphabet.length]);
      if (output.length === length) break;
    }
  }
  return output.join("");
}

export function makeRoomCode(cryptoSource = globalThis.crypto) {
  return randomString(ROOM_CODE_LENGTH, ROOM_CODE_ALPHABET, cryptoSource);
}

export function makeAccessToken(cryptoSource = globalThis.crypto) {
  const bytes = new Uint8Array(32);
  cryptoSource.getRandomValues(bytes);
  return base64Url(bytes);
}

export function makeMemberId(cryptoSource = globalThis.crypto) {
  const bytes = new Uint8Array(12);
  cryptoSource.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function hashAccessToken(token, cryptoSource = globalThis.crypto) {
  const bytes = new TextEncoder().encode(String(token || ""));
  const digest = await cryptoSource.subtle.digest("SHA-256", bytes);
  return base64Url(new Uint8Array(digest));
}

export function safeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
