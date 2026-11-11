/** Words that would read as an official Weems page, or clash with a page of the site. */
const RESERVED = new Set([
  "about",
  "admin",
  "administrator",
  "api",
  "contact",
  "flights",
  "help",
  "live",
  "login",
  "logout",
  "me",
  "moderator",
  "pilot",
  "pilots",
  "privacy",
  "robots",
  "root",
  "settings",
  "signup",
  "sitemap",
  "staff",
  "support",
  "terms",
  "weems",
]);

export const isReservedHandle = (handle: string): boolean => RESERVED.has(handle);

/** Last 4 characters of the account id: makes a suggestion unique without asking the pilot. */
export const handleSuffix = (pilotId: string): string => pilotId.replaceAll("-", "").slice(-4);

/** A handle proposed from the pilot's name: "Grég FR" → "greg-fr". */
export function suggestHandle(name: string, pilotId: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 24)
    .replace(/^-+|-+$/g, "");
  if (base.length < 3) return `pilot-${handleSuffix(pilotId)}`;
  return isReservedHandle(base) ? `${base}-${handleSuffix(pilotId)}` : base;
}
