import { destroyAccountSession, getPublicDatabaseError, privateJson, verifyRequestOrigin } from "@/lib/account-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = verifyRequestOrigin(request);
  if (originError) return originError;
  try {
    await destroyAccountSession();
    return privateJson({ ok: true });
  } catch {
    return getPublicDatabaseError();
  }
}
