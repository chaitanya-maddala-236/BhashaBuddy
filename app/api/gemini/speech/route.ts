import { z } from "zod";
import { getLanguage } from "@/lib/bhashabuddy-data";
import { GEMINI_API_ROOT, rateLimitResponse, readLimitedJson } from "@/lib/gemini-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  apiKey: z.string().trim().min(16).max(512),
  targetLanguage: z.enum(["te", "hi", "ta", "kn", "ml"]),
  text: z.string().trim().min(1).max(600),
});

type AudioPart = { type?: string; data?: string };
type InteractionResponse = {
  output_audio?: { data?: string };
  steps?: Array<{ type?: string; content?: AudioPart[] }>;
};

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "gemini-tutor-speech", 24);
  if (limited) return limited;

  const body = await readLimitedJson(request, 2_048);
  if (body.error) return Response.json({ error: body.error }, { status: 400 });
  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: "Choose a language and provide a short line to speak." }, { status: 400 });
  }

  const { apiKey, targetLanguage, text } = parsed.data;
  const language = getLanguage(targetLanguage);

  try {
    const response = await fetch(`${GEMINI_API_ROOT}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash-lite-tts",
        input: [{
          type: "user_input",
          content: [{
            type: "text",
            text,
            annotations: [{
              type: "speech_metadata",
              style: `A warm, patient ${language.name} language tutor. Speak clearly, naturally, and at a gentle pace.`,
            }],
          }],
        }],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: "Kore" }] },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 400 : 502;
      const error = status === 429
        ? "Gemini voice is busy or this key reached its rate limit. Try the browser voice instead."
        : status === 400
          ? "This Gemini key could not access speech generation. Check its API access or use the browser voice."
          : "Gemini voice audio could not be generated right now.";
      return Response.json({ error }, { status });
    }

    const payload = await response.json() as InteractionResponse;
    const audioPart = payload.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .filter((part) => part.type === "audio")
      .at(-1);
    const audioData = payload.output_audio?.data ?? audioPart?.data;
    if (!audioData || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioData)) {
      return Response.json({ error: "Gemini did not return playable speech audio." }, { status: 502 });
    }

    const audio = Uint8Array.from(Buffer.from(audioData, "base64"));
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Gemini voice could not be reached. Try the browser voice instead." }, { status: 502 });
  }
}
