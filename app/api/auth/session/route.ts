import { getAuthenticatedAccount, getPublicDatabaseError, privateJson } from "@/lib/account-server";
import { isDatabaseConfigured } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) return privateJson({ configured: false, user: null });
  try {
    const account = await getAuthenticatedAccount();
    if (account.response) {
      if (account.response.status === 401) return privateJson({ configured: true, user: null });
      return account.response;
    }
    return privateJson({ configured: true, user: account.user });
  } catch {
    return getPublicDatabaseError();
  }
}
