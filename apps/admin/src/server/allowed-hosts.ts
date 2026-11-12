/**
 * The console starts processes and deletes flights: it answers only to its own address on the
 * Mac. A page elsewhere whose name points to 127.0.0.1 (DNS rebinding) is refused.
 */
const ALLOWED_HOSTS = new Set(["127.0.0.1:3002", "localhost:3002"]);

export const isAllowedHost = (host: string | null) => host !== null && ALLOWED_HOSTS.has(host);
