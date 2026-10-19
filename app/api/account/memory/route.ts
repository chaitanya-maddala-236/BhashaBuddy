import { conversationMemorySchema, memoryLanguageSchema, memoryScenarioSchema } from "@/lib/account-schema";
import { getAuthenticatedAccount, getPublicDatabaseError, privateJson, verifyRequestOrigin } from "@/lib/account-server";
import { getDatabase } from "@/lib/database";
import { readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readKey(request: Request) {
  const url = new URL(request.url);
  const language = memoryLanguageSchema.safeParse(url.searchParams.get("language"));
  const scenario = memoryScenarioSchema.safeParse(url.searchParams.get("scenario"));
  if (!language.success || !scenario.success) return null;
  return { language: language.data, scenario: scenario.data };
}

export async function GET(request: Request) {
  const key = readKey(request);
  if (!key) return privateJson({ error: "Choose a supported language and conversation." }, 400);
  const account = await getAuthenticatedAccount();
  if (account.response) return account.response;

  try {
    const pool = await getDatabase();
    const { rows } = await pool.query<{ messages: unknown; updated_at: Date }>(
      `SELECT messages, updated_at FROM bb_conversation_memories
       WHERE user_id = $1 AND language_code = $2 AND scenario_slug = $3 LIMIT 1`,
      [account.user.id, key.language, key.scenario],
    );
    const data = rows[0];
    if (!data) return privateJson({ messages: null, updatedAt: null });
    const parsed = conversationMemorySchema.safeParse(data.messages);
    if (!parsed.success) return privateJson({ error: "The saved tutor memory has an unsupported format." }, 500);
    return privateJson({ messages: parsed.data, updatedAt: data.updated_at });
  } catch {
    return getPublicDatabaseError();
  }
}

export async function PUT(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  const body = await readLimitedJson(request, 20_000);
  if (body.error) return privateJson({ error: body.error === "Request is too large." ? "This conversation is too large to sync." : "Send a valid conversation to sync." }, body.error === "Request is too large." ? 413 : 400);

  const source = body.value as { language?: unknown; scenario?: unknown; messages?: unknown } | null;
  const language = memoryLanguageSchema.safeParse(source?.language);
  const scenario = memoryScenarioSchema.safeParse(source?.scenario);
  const messages = conversationMemorySchema.safeParse(source?.messages);
  if (!language.success || !scenario.success || !messages.success) {
    return privateJson({ error: "The conversation could not be validated." }, 400);
  }

  const account = await getAuthenticatedAccount();
  if (account.response) return account.response;
  try {
    const pool = await getDatabase();
    const updatedAt = new Date();
    await pool.query(
      `INSERT INTO bb_conversation_memories (user_id, language_code, scenario_slug, messages, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (user_id, language_code, scenario_slug)
       DO UPDATE SET messages = EXCLUDED.messages, updated_at = EXCLUDED.updated_at`,
      [account.user.id, language.data, scenario.data, JSON.stringify(messages.data), updatedAt],
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

  const url = new URL(request.url);
  try {
    const pool = await getDatabase();
    if (url.searchParams.get("all") === "true") {
      await pool.query("DELETE FROM bb_conversation_memories WHERE user_id = $1", [account.user.id]);
      return privateJson({ ok: true });
    }

    const key = readKey(request);
    if (!key) return privateJson({ error: "Choose a supported language and conversation." }, 400);
    await pool.query(
      "DELETE FROM bb_conversation_memories WHERE user_id = $1 AND language_code = $2 AND scenario_slug = $3",
      [account.user.id, key.language, key.scenario],
    );
    return privateJson({ ok: true });
  } catch {
    return getPublicDatabaseError();
  }
}
