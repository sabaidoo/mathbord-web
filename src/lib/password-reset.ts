import crypto from "crypto";

// ---------------------------------------------------------------------------
// Signed, stateless password-reset tokens
//
// Format:  <userId>.<expiresAt>.<sig>
//   userId    — the user's database ID
//   expiresAt — Unix timestamp (ms) when the token expires
//   sig       — HMAC-SHA256(userId + ":" + expiresAt, NEXTAUTH_SECRET)
//
// Expires 1 hour after generation.
// ---------------------------------------------------------------------------

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET environment variable is not set — cannot sign reset tokens"
    );
  }
  return secret;
}

function sign(userId: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${userId}:${expiresAt}`)
    .digest("hex");
}

/**
 * Generate a signed password-reset token for a given user.
 * The token is safe to embed in a URL query string.
 */
export function generateResetToken(userId: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const sig = sign(userId, expiresAt);
  // Encode in base64url so dots in userId don't cause ambiguity
  const payload = `${userId}.${expiresAt}.${sig}`;
  return Buffer.from(payload).toString("base64url");
}

/**
 * Verify a reset token.
 * Returns `{ userId }` if valid and unexpired, or `null` if invalid / expired.
 */
export function verifyResetToken(token: string): { userId: string } | null {
  try {
    const payload = Buffer.from(token, "base64url").toString("utf8");
    // Split on the LAST two dots so userId (which may contain dots) is preserved
    const lastDot = payload.lastIndexOf(".");
    if (lastDot === -1) return null;
    const providedSig = payload.slice(lastDot + 1);
    const rest = payload.slice(0, lastDot);

    const secondLastDot = rest.lastIndexOf(".");
    if (secondLastDot === -1) return null;
    const expiresAtStr = rest.slice(secondLastDot + 1);
    const userId = rest.slice(0, secondLastDot);

    if (!userId || !expiresAtStr || !providedSig) return null;

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) return null;

    // Check expiry first (avoids timing leak on expired tokens)
    if (Date.now() > expiresAt) return null;

    // Constant-time comparison
    const expectedSig = sign(userId, expiresAt);
    const sigBuffer = Buffer.from(providedSig, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}
