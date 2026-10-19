import { getAuthenticatedAccount, getPublicDatabaseError, privateJson, verifyRequestOrigin } from "@/lib/account-server";
import { getDatabase } from "@/lib/database";
import { learnerStateSchema } from "@/lib/account-schema";
import { readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (account.response) return account.response;

  try {
    const pool = await getDatabase();
    const { rows } = await pool.query<{ state: unknown; updated_at: Date }>(
      "SELECT state, updated_at FROM bb_learner_journals WHERE user_id = $1 LIMIT 1",
      [account.user.id],
    );
    const data = rows[0];
    if (!data) return privateJson({ state: null, updatedAt: null });
    const parsed = learnerStateSchema.safeParse(data.state);
    if (!parsed.success) return privateJson({ error: "The saved account journal has an unsupported format." }, 500);
    return privateJson({ state: parsed.data, updatedAt: data.updated_at });
  } catch {
    return getPublicDatabaseError();
  }
}

export async function PUT(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  const account = await getAuthenticatedAccount();
  if (account.response) return account.response;

  const body = await readLimitedJson(request, 100_000);
  if (body.error) return privateJson({ error: body.error === "Request is too large." ? "The journal is too large to sync." : "Send a valid journal to sync." }, body.error === "Request is too large." ? 413 : 400);
  const parsed = learnerStateSchema.safeParse((body.value as { state?: unknown } | null)?.state);
  if (!parsed.success) return privateJson({ error: "The journal could not be validated." }, 400);

  try {
    const pool = await getDatabase();
    const updatedAt = new Date();
    await pool.query(
      `INSERT INTO bb_learner_journals (user_id, state, updated_at)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at`,
      [account.user.id, JSON.stringify(parsed.data), updatedAt],
    );
    return privateJson({ ok: true, updatedAt });
  } catch {
    return getPublicDatabaseError();
  }
}

export async function DELETE(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  const account = await getAuthenticatedAccount();
  if (account.response) return account.response;

  try {
    const pool = await getDatabase();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM bb_learner_journals WHERE user_id = $1", [account.user.id]);
      await client.query("DELETE FROM bb_conversation_memories WHERE user_id = $1", [account.user.id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return privateJson({ ok: true });
  } catch {
    return getPublicDatabaseError();
  }
}
