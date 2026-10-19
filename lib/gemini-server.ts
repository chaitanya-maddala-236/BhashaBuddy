type RateWindow = { count: number; resetAt: number };

const requestWindows = new Map<string, RateWindow>();

export function rateLimitResponse(request: Request, scope: string, limit: number) {
  const now = Date.now();
  const address = request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "local";
  const key = `${scope}:${address}`;
  const window = requestWindows.get(key);

  if (!window || window.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  if (window.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
    return Response.json(
      { error: "Too many requests. Wait a moment, then try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  window.count += 1;
  if (requestWindows.size > 2_000) {
    for (const [entry, value] of requestWindows) {
      if (value.resetAt <= now) requestWindows.delete(entry);
    }
  }
  return null;
}

export async function readLimitedJson(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) return { error: "Request is too large.", value: null } as const;

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) return { error: "Request is too large.", value: null } as const;
  try {
    return { error: null, value: JSON.parse(raw) as unknown } as const;
  } catch {
    return { error: "Request body must be valid JSON.", value: null } as const;
  }
}

export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta";
