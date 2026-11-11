/**
 * New UUID v7 (RFC 9562): 48-bit Unix time in milliseconds, then random bits.
 * Sorted by creation time. The tracker uses it to create flight ids.
 * Uses Web Crypto, so it also runs in the browser.
 */
export function uuidV7(nowMs: number = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 6; i++) {
    bytes[i] = Math.floor(nowMs / 2 ** (8 * (5 - i))) & 0xff;
  }
  bytes[6] = 0x70 | ((bytes[6] ?? 0) & 0x0f); // version 7
  bytes[8] = 0x80 | ((bytes[8] ?? 0) & 0x3f); // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
