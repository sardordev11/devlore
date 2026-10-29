import { createHash, randomBytes } from "node:crypto";

// VerificationToken is shared: email verification rows use the bare email as the
// identifier, password reset rows use this prefix so neither wipes the other
export const PASSWORD_RESET_PREFIX = "password-reset:";

export function createToken() {
  return randomBytes(32).toString("base64url");
}

// Only the hash is stored, so a leaked database can't be used to redeem tokens
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
