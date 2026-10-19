import { z } from "zod";
import { GEMINI_API_ROOT, GEMINI_MODEL, rateLimitResponse, readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ apiKey: z.string().trim().min(16).max(512) });

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "gemini-key-check", 6);
  if (limited) return limited;

  const body = await readLimitedJson(request, 1_024);
  if (body.error) return Response.json({ error: body.error }, { status: 400 });
  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: "Enter a Gemini API key, then check it." }, { status: 400 });
  }

  try {
    const response = await fetch(`${GEMINI_API_ROOT}/models/${GEMINI_MODEL}`, {
      method: "GET",
      headers: { "x-goog-api-key": parsed.data.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return Response.json({ error: "Gemini is rate-limiting key checks. Wait a moment and try again." }, { status: 429 });
      }
      if (response.status === 401 || response.status === 403 || response.status === 400) {
        return Response.json({ error: "Gemini could not authorize this key for the selected model. Check that it is active and Gemini API access is enabled." }, { status: 400 });
      }
      return Response.json({ error: "Gemini could not check this key right now. Try again shortly." }, { status: 502 });
    }

    const model = await response.json() as { supportedGenerationMethods?: unknown };
    const methods = Array.isArray(model.supportedGenerationMethods) ? model.supportedGenerationMethods : [];
    if (!methods.includes("generateContent")) {
      return Response.json({ error: "This Gemini account does not expose the text conversation model needed by BhashaBuddy." }, { status: 400 });
    }

    return Response.json({ ok: true, model: GEMINI_MODEL }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Gemini could not be reached. Check your connection and try again." }, { status: 502 });
  }
}
