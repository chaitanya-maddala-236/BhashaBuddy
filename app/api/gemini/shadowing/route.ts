import { z } from "zod";
import { getLanguage, type LanguageCode } from "@/lib/bhashabuddy-data";
import { getShadowingItem, type ShadowingMode } from "@/lib/shadowing-data";
import { GEMINI_API_ROOT, GEMINI_MODEL, rateLimitResponse, readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  apiKey: z.string().trim().min(16).max(512),
  targetLanguage: z.enum(["te", "hi", "ta", "kn", "ml"]),
  mode: z.enum(["sentence", "dialogue"]),
  itemId: z.string().trim().min(1).max(80),
  audioMimeType: z.enum(["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"]),
  audioData: z.string().min(100).max(3_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

const resultSchema = z.object({
  heardText: z.string().max(600),
  match: z.enum(["close", "nearly", "practice", "unclear"]),
  feedback: z.string().trim().min(1).max(450),
  tip: z.string().trim().min(1).max(240),
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "gemini-shadowing-check", 8);
  if (limited) return limited;

  const body = await readLimitedJson(request, 3_200_000);
  if (body.error) return Response.json({ error: body.error }, { status: body.error === "Request is too large." ? 413 : 400 });
  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) return Response.json({ error: "Choose a practice line and record a short audio sample." }, { status: 400 });

  const { apiKey, targetLanguage, mode, itemId, audioMimeType, audioData } = parsed.data;
  const item = getShadowingItem(targetLanguage as LanguageCode, mode as ShadowingMode, itemId);
  if (!item) return Response.json({ error: "That sentence or dialogue is no longer available. Choose another practice line." }, { status: 400 });
  const estimatedAudioBytes = Math.floor(audioData.length * 3 / 4);
  if (estimatedAudioBytes > 2_250_000) return Response.json({ error: "That recording is too large. Try a shorter sample." }, { status: 413 });

  const language = getLanguage(targetLanguage);
  const reference = item.lines.map((line, index) => `${index + 1}. ${line.nativeText} (${line.transliteration}; ${line.meaning})`).join("\n");
  const instruction = [
    `You are a kind shadowing coach for a beginner practising ${language.name}.`,
    `The reference ${mode === "dialogue" ? "dialogue" : "sentence"} is “${item.title}”. Compare the learner's audio with these exact reference lines in order:\n${reference}`,
    "Listen for whether the learner said the intended words and whether the phrase is understandable. Give gentle, approximate coaching only. Do not judge accent, identity, or regional variety. Do not claim precise phoneme measurement or invent a detailed correction when the audio is unclear.",
    "Return a transcript in the target language's native script when you can identify it. If the recording is silent, clipped, or unclear, set match to unclear, leave heardText empty, and invite one retry. Otherwise choose close, nearly, or practice. Feedback should mention one specific thing that went well or one important difference; tip should offer one simple way to practise the reference. Regional wording can vary.",
    "Return only JSON matching the response schema.",
  ].join(" ");

  try {
    const response = await fetch(`${GEMINI_API_ROOT}/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: "user", parts: [
          { text: `Listen to this short ${language.name} shadowing attempt and compare it with the reference.` },
          { inlineData: { mimeType: audioMimeType, data: audioData } },
        ] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              heardText: { type: "STRING" },
              match: { type: "STRING", enum: ["close", "nearly", "practice", "unclear"] },
              feedback: { type: "STRING" },
              tip: { type: "STRING" },
            },
            required: ["heardText", "match", "feedback", "tip"],
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(35_000),
    });

    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 400 : 502;
      const error = status === 429
        ? "Gemini is busy or this key reached its rate limit. Wait a moment, then try again."
        : status === 400
          ? "Gemini rejected this key or audio format. Check your key in Settings and record again."
          : "Gemini could not listen to this recording right now. Please try again.";
      return Response.json({ error }, { status });
    }

    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!raw) return Response.json({ error: "Gemini returned an empty listening note. Please try again." }, { status: 502 });
    let candidate: unknown;
    try {
      candidate = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Gemini returned a listening note we could not read. Please try again." }, { status: 502 });
    }
    const result = resultSchema.safeParse(candidate);
    if (!result.success) return Response.json({ error: "Gemini returned an incomplete listening note. Please try again." }, { status: 502 });
    return Response.json(result.data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Gemini could not be reached. Check your connection and try again." }, { status: 502 });
  }
}
