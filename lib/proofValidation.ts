/**
 * Instant client-side check of the proof-link format per platform — mirrors the
 * validate_proof_url() logic in schema.sql. Gives the commenter immediate feedback
 * before attempting submission.
 *
 * Note:
 * - Twitter/X: a reply is itself an independent tweet with its own status link → we validate it
 * - Instagram & TikTok: neither platform offers a standalone link to a single comment →
 *   we only validate that the post link itself is well-formed; the real proof is the screenshot
 */

export function validateProofUrl(
  platform: "twitter" | "instagram" | "tiktok",
  proofUrl: string,
  targetUrl: string
): { valid: boolean; message?: string } {
  if (platform === "twitter") {
    const twitterPattern = /(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+/;
    if (!twitterPattern.test(proofUrl)) {
      return { valid: false, message: "Must be a valid reply (status) link on Twitter/X" };
    }
    const proofId = proofUrl.match(/status\/([0-9]+)/)?.[1];
    const targetId = targetUrl.match(/status\/([0-9]+)/)?.[1];
    if (proofId && proofId === targetId) {
      return { valid: false, message: "This is the original post link, not your independent reply" };
    }
    return { valid: true };
  }

  if (platform === "instagram") {
    const igPattern = /instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+/;
    if (!igPattern.test(proofUrl)) {
      return { valid: false, message: "Invalid link — paste a valid Instagram post link" };
    }
    return { valid: true };
  }

  if (platform === "tiktok") {
    const tiktokPattern = /tiktok\.com\/@[A-Za-z0-9_.]+\/video\/[0-9]+/;
    const shortPattern = /vm\.tiktok\.com\//;
    if (!tiktokPattern.test(proofUrl) && !shortPattern.test(proofUrl)) {
      return { valid: false, message: "Invalid link — paste a valid TikTok video link" };
    }
    return { valid: true };
  }

  return { valid: false, message: "Unsupported platform" };
}
