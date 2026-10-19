import { z } from "zod";
import { createAccountSession, enforceAuthRateLimit, getPublicDatabaseError, hashPassword, newAccountId, normalizeEmail, privateJson, verifyRequestOrigin } from "@/lib/account-server";
import { getDatabase } from "@/lib/database";
import { readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registrationSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
}).strict();

export async function POST(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  const rateLimitError = enforceAuthRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const body = await readLimitedJson(request, 2_000);
  if (body.error) return privateJson({ error: "Send a valid email and password." }, 400);
  const parsed = registrationSchema.safeParse(body.value);
  if (!parsed.success) return privateJson({ error: "Use a valid email and a password with at least 10 characters." }, 400);

  const user = { id: newAccountId(), email: normalizeEmail(parsed.data.email) };
  try {
    const pool = await getDatabase();
    const passwordHash = await hashPassword(parsed.data.password);
    await pool.query(
      "INSERT INTO bb_users (id, email, password_hash) VALUES ($1, $2, $3)",
      [user.id, user.email, passwordHash],
    );
    await createAccountSession(user);
    return privateJson({ user, created: true }, 201);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return privateJson({ error: "An account with this email already exists. Sign in instead." }, 409);
    }
    return getPublicDatabaseError();
  }
}
