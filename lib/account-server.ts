import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/database";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-bhashabuddy-session" : "bhashabuddy-session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_HASH_BYTES = 64;
const authWindows = new Map<string, { startedAt: number; attempts: number }>();

export type AccountUser = { id: string; email: string };

type AuthenticatedAccount = {
  user: AccountUser;
  response: null;
};

type UnauthenticatedAccount = {
  user: null;
  response: Response;
};

function derivePasswordKey(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, {
      N: 1 << 15,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    }, (error, derived) => error ? reject(error) : resolve(derived));
  });
}

function serviceUnavailable() {
  return privateJson({ error: "Account storage is unavailable. Check DATABASE_URL and the PostgreSQL connection." }, 503);
}

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}

export function verifyRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    // Reject malformed origins below.
  }
  return privateJson({ error: "This request could not be verified. Refresh the page and try again." }, 403);
}

export function enforceAuthRateLimit(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const address = forwardedFor || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const current = authWindows.get(address);
  if (!current || now - current.startedAt >= windowMs) {
    if (authWindows.size >= 2_048) {
      for (const [key, entry] of authWindows) {
        if (now - entry.startedAt >= windowMs) authWindows.delete(key);
      }
      while (authWindows.size >= 2_048) {
        const oldest = authWindows.keys().next().value;
        if (!oldest) break;
        authWindows.delete(oldest);
      }
    }
    authWindows.set(address, { startedAt: now, attempts: 1 });
    return null;
  }
  current.attempts += 1;
  if (current.attempts > 20) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - current.startedAt)) / 1000));
    return Response.json(
      { error: "Too many sign-in attempts. Wait a little and try again." },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter) } },
    );
  }
  return null;
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await derivePasswordKey(password, salt, PASSWORD_HASH_BYTES);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltText, hashText] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (salt.length !== 16 || expected.length !== PASSWORD_HASH_BYTES) return false;
    const actual = await derivePasswordKey(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function digestSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccountSession(user: AccountUser) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000);
  const pool = await getDatabase();
  await pool.query("DELETE FROM bb_sessions WHERE expires_at <= now()");
  const cookieStore = await cookies();
  const previousToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (previousToken) await pool.query("DELETE FROM bb_sessions WHERE token_hash = $1", [digestSession(previousToken)]);
  await pool.query(
    "INSERT INTO bb_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [digestSession(token), user.id, expiresAt],
  );

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAuthenticatedAccount(): Promise<AuthenticatedAccount | UnauthenticatedAccount> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { user: null, response: privateJson({ error: "Sign in to use account sync." }, 401) };

  try {
    const pool = await getDatabase();
    const result = await pool.query<AccountUser>(
      `SELECT users.id, users.email
       FROM bb_sessions AS sessions
       JOIN bb_users AS users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()
       LIMIT 1`,
      [digestSession(token)],
    );
    if (result.rows[0]) return { user: result.rows[0], response: null };

    cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return { user: null, response: privateJson({ error: "Your sign-in has expired. Sign in again to continue." }, 401) };
  } catch {
    return { user: null, response: serviceUnavailable() };
  }
}

export async function destroyAccountSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  try {
    if (token && process.env.DATABASE_URL?.trim()) {
      const pool = await getDatabase();
      await pool.query("DELETE FROM bb_sessions WHERE token_hash = $1", [digestSession(token)]);
    }
  } finally {
    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export function newAccountId() {
  return randomUUID();
}

export function getPublicDatabaseError() {
  return serviceUnavailable();
}
