export const ADMIN_SESSION_COOKIE = "bm_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface AdminConfig {
  email: string;
  password: string;
  secret: string;
}

function getAdminConfig(): AdminConfig {
  return {
    email: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.SESSION_SECRET ?? "",
  };
}

export function isAdminConfigured() {
  const config = getAdminConfig();
  return Boolean(config.email && config.password && config.secret);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function encodePayload(value: unknown) {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodePayload<T>(value: string) {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(value))) as T;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return new Uint8Array(bytes);
}

async function safeEqual(left: string, right: string) {
  const [leftDigest, rightDigest] = await Promise.all([
    digest(left),
    digest(right),
  ]);
  if (leftDigest.length !== rightDigest.length) return false;
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }
  return difference === 0;
}

async function signatureFor(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toBase64Url(new Uint8Array(signature));
}

async function createSession(email: string) {
  const config = getAdminConfig();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = encodePayload({ email, expiresAt });
  return `${payload}.${await signatureFor(payload, config.secret)}`;
}

function parseCookies(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map(part => {
        const trimmed = part.trim();
        const separator = trimmed.indexOf("=");
        return separator === -1
          ? [trimmed, undefined]
          : [trimmed.slice(0, separator), trimmed.slice(separator + 1)];
      })
      .filter(([name, value]) => name && value !== undefined)
      .map(([name, value]) => [name, decodeURIComponent(value ?? "")])
  );
}

export async function getAuthenticatedAdmin(request: Request) {
  if (!isAdminConfigured()) return null;

  const token = parseCookies(request)[ADMIN_SESSION_COOKIE];
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const config = getAdminConfig();
  if (!(await safeEqual(signature, await signatureFor(payload, config.secret))))
    return null;

  let session: { email?: unknown; expiresAt?: unknown };
  try {
    session = decodePayload<{ email?: unknown; expiresAt?: unknown }>(payload);
  } catch {
    return null;
  }

  const email = typeof session.email === "string" ? session.email : "";
  const expiresAt =
    typeof session.expiresAt === "number" ? session.expiresAt : 0;
  if (!email || !Number.isFinite(expiresAt) || expiresAt <= Date.now())
    return null;
  if (!(await safeEqual(email, config.email))) return null;

  return { email };
}

export async function canLogin(email: string, password: string) {
  if (!isAdminConfigured()) return false;
  const config = getAdminConfig();
  const [emailMatches, passwordMatches] = await Promise.all([
    safeEqual(email.trim().toLowerCase(), config.email),
    safeEqual(password, config.password),
  ]);
  return emailMatches && passwordMatches;
}

export function sessionCookie(
  request: Request,
  value: string,
  maxAge = SESSION_MAX_AGE_SECONDS
) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function createSessionCookie(request: Request, email: string) {
  return sessionCookie(request, await createSession(email));
}

export function clearSessionCookie(request: Request) {
  return sessionCookie(request, "", 0);
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store, max-age=0");
  return new Response(JSON.stringify(data), { ...init, headers });
}
