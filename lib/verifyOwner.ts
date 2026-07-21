import { NextRequest } from "next/server";

/**
 * Confirms the request carries a valid owner_session cookie matching
 * OWNER_ACCESS_CODE. Used by every /api/admin/* route as a second layer
 * of defense in addition to the middleware that already gates /dashboard/admin.
 */
export function isOwnerRequest(req: NextRequest): boolean {
  const session = req.cookies.get("owner_session")?.value;
  const correctCode = process.env.OWNER_ACCESS_CODE;
  return Boolean(session && correctCode && session === correctCode);
}
