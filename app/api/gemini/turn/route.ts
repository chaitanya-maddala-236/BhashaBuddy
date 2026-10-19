import { z } from "zod";
import { getLanguage } from "@/lib/bhashabuddy-data";
import { GEMINI_API_ROOT, GEMINI_MODEL, rateLimitResponse, readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  role: z.enum(["tutor", "learner"]),
  text: z.string().trim().min(1).max(600),
});

const bodySchema = z.object({
  apiKey: z.string().trim().min(16).max(512),
  targetLanguage: z.enum(["te", "hi", "ta", "kn", "ml"]),
  scenarioTitle: z.string().trim().min(1).max(100),
  scenarioContext: z.string().trim().min(1).max(240),
  history: z.array(messageSchema).max(12),
  message: z.string().trim().min(1).max(600),
});

const responseSchema = z.object({
  reply: z.string().trim().min(1).max(500),
  meaning: z.string().trim().min(1).max(300),
  transliteration: z.string().trim().max(300),
  feedback: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "gemini-tutor-turn", 18);
  if (limited) return limited;

  const body = await readLimitedJson(request, 12_000);
  if (body.error) return Response.json({ error: body.error }, { status: 400 });
  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: "The conversation turn was incomplete. Please try again." }, { status: 400 });
  }

  const { apiKey, targetLanguage, scenarioTitle, scenarioContext, history, message } = parsed.data;
  const language = getLanguage(targetLanguage);
  const systemInstruction = [
    "You are BhashaBuddy, a kind, concise beginner language conversation partner.",
    `The learner is practising ${language.name} in a short role-play called “${scenarioTitle}”. Setting: ${scenarioContext}`,
    `Respond primarily in ${language.name}. Use a natural, respectful everyday phrase in its native script. Keep the role-play moving with one short reply or question.`,
    "If the learner uses English or an incorrect phrase, respond kindly and give one usable phrase. Never shame the learner or claim that regional wording is universally correct.",
    "Return a short Latin-script transliteration, an English meaning, and one actionable text-only language suggestion. Do not score pronunciation or claim to have heard audio.",
  ].join(" ");

  const contents = [
    ...history.map((item) => ({
      role: item.role === "tutor" ? "model" : "user",
      parts: [{ text: item.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(`${GEMINI_API_ROOT}/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 220,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" },
              meaning: { type: "STRING" },
              transliteration: { type: "STRING" },
              feedback: { type: "STRING" },
            },
            required: ["reply", "meaning", "transliteration", "feedback"],
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 400 : 502;
      const error = status === 429
        ? "Gemini is busy or this key reached its rate limit. You can retry or use the sample tutor."
        : status === 400
          ? "Gemini rejected this key. Check the key in Settings, then try again."
          : "Gemini could not reply right now. You can retry or continue with the sample tutor.";
      return Response.json({ error }, { status });
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!raw) return Response.json({ error: "Gemini returned an empty reply. Please try again." }, { status: 502 });

    let candidate: unknown;
    try {
      candidate = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Gemini returned a reply we could not read. Please try again." }, { status: 502 });
    }
    const answer = responseSchema.safeParse(candidate);
    if (!answer.success) return Response.json({ error: "Gemini returned an incomplete language note. Please try again." }, { status: 502 });

    return Response.json(answer.data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Gemini could not be reached. You can retry or continue with the sample tutor." }, { status: 502 });
  }
}
