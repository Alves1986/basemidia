import { createHmac, timingSafeEqual } from "node:crypto";

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

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signatureFor(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSession(email: string) {
  const config = getAdminConfig();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ email, expiresAt }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${signatureFor(payload, config.secret)}`;
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

export function getAuthenticatedAdmin(request: Request) {
  if (!isAdminConfigured()) return null;

  const token = parseCookies(request)[ADMIN_SESSION_COOKIE];
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const config = getAdminConfig();
  if (!safeEqual(signature, signatureFor(payload, config.secret))) return null;

  let session: { email?: unknown; expiresAt?: unknown };
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const email = typeof session.email === "string" ? session.email : "";
  const expiresAt =
    typeof session.expiresAt === "number" ? session.expiresAt : 0;
  if (!email || !Number.isFinite(expiresAt) || expiresAt <= Date.now())
    return null;
  if (!safeEqual(email, config.email)) return null;

  return { email };
}

export function canLogin(email: string, password: string) {
  if (!isAdminConfigured()) return false;
  const config = getAdminConfig();
  return (
    safeEqual(email.trim().toLowerCase(), config.email) &&
    safeEqual(password, config.password)
  );
}

export function sessionCookie(
  request: Request,
  value: string,
  maxAge = SESSION_MAX_AGE_SECONDS
) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function createSessionCookie(request: Request, email: string) {
  return sessionCookie(request, createSession(email));
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
