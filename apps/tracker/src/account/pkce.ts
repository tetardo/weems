import { createHash, randomBytes } from "node:crypto";

/** PKCE pair (RFC 7636, S256): the verifier stays in the tracker, the challenge goes to the browser. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Random `state`, checked when the browser comes back (protects against a forged answer). */
export const randomState = (): string => randomBytes(16).toString("base64url");
