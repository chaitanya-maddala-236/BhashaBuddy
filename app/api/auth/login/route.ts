import { z } from "zod";
import { createAccountSession, enforceAuthRateLimit, getPublicDatabaseError, hashPassword, normalizeEmail, privateJson, verifyPassword, verifyRequestOrigin } from "@/lib/account-server";
import { getDatabase } from "@/lib/database";
import { readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  const rateLimitError = enforceAuthRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const body = await readLimitedJson(request, 2_000);
  if (body.error) return privateJson({ error: "Enter a valid email and password." }, 400);
  const parsed = loginSchema.safeParse(body.value);
  if (!parsed.success) return privateJson({ error: "Enter a valid email and password." }, 400);

  try {
    const pool = await getDatabase();
    const email = normalizeEmail(parsed.data.email);
    const result = await pool.query<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM bb_users WHERE email = $1 LIMIT 1",
      [email],
    );
    const row = result.rows[0];
    const passwordMatches = row
      ? await verifyPassword(parsed.data.password, row.password_hash)
      : (await hashPassword(parsed.data.password), false);
    if (!row || !passwordMatches) return privateJson({ error: "Email or password is incorrect." }, 401);

    const user = { id: row.id, email: row.email };
    await createAccountSession(user);
    return privateJson({ user, created: false });
  } catch {
    return getPublicDatabaseError();
  }
}
