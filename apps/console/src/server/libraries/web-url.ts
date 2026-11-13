/**
 * `value` when it is a plain web address (http or https), without its #fragment; null otherwise.
 * Addresses read from npm become links of the page: a `javascript:` one would run in the console.
 */
export function webUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
