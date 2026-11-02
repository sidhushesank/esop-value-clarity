import { cookies } from "next/headers";

import {
  grantCookieName,
  resolveGrantLink,
  verifyGrantCookie,
  type ResolvedGrantLink,
} from "@/lib/company/grant-links";

/**
 * For public employee routes: the link must be usable and, if it has a
 * passcode, already unlocked in this browser.
 */
export async function requireOpenGrantLink(token: string): Promise<ResolvedGrantLink | null> {
  const link = await resolveGrantLink(token);
  if (!link) return null;

  if (link.passcodeHash) {
    const store = await cookies();
    if (!verifyGrantCookie(store.get(grantCookieName(link.id))?.value, link.id)) return null;
  }

  return link;
}
