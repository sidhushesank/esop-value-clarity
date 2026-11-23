import { getAuthTokenPayload, passwordFingerprint } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * ============================================================================
 * SESSION CHECK (server only)
 * ============================================================================
 *
 * Every API route that reads the login cookie goes through here.
 *
 * Login cookies carry a short fingerprint of the password hash. When the
 * password is changed or reset, the fingerprint no longer matches, so every
 * other device is logged out on its next request. The device that changed
 * the password gets a fresh cookie.
 *
 * Cookies issued before this update have no fingerprint; they keep working
 * until they expire (7 days at most).
 * ============================================================================
 */
export async function getSessionUserId(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;

  const payload = getAuthTokenPayload(token);
  if (!payload) return null;

  if (!payload.pwf) return payload.userId;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { passwordHash: true },
  });

  if (!user || passwordFingerprint(user.passwordHash) !== payload.pwf) {
    return null;
  }

  return payload.userId;
}
