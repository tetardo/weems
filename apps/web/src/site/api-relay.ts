/**
 * Addresses of the site relayed to the API, so that the browser stays on the site's address
 * (session cookie of the site, no other origin): login routes, profile photos, address checks.
 */
const RELAYS: readonly { site: RegExp; api: (match: RegExpMatchArray) => string }[] = [
  { site: /^\/api\/auth\/.+$/, api: ([path]) => path },
  {
    site: /^\/api\/pilots\/([a-z0-9-]{3,30})\/photo$/,
    api: ([, handle]) => `/v1/pilots/${handle}/photo`,
  },
  {
    site: /^\/api\/ambassadors\/([a-z0-9-]{3,30})\/photo$/,
    api: ([, slug]) => `/v1/ambassadors/${slug}/photo`,
  },
  { site: /^\/api\/me\/profile\/photo$/, api: () => "/v1/me/profile/photo" },
  { site: /^\/api\/me\/profile\/handle-check$/, api: () => "/v1/me/profile/handle-check" },
];

/** Path of the API route for a site address, or null when the address is not relayed. */
export function relayTarget(pathname: string): string | null {
  for (const relay of RELAYS) {
    const match = pathname.match(relay.site);
    if (match) return relay.api(match);
  }
  return null;
}

/** Site address of a pilot's public photo. */
export const pilotPhotoUrl = (handle: string) => `/api/pilots/${handle}/photo`;
/** Site address of an ambassador's photo. */
export const ambassadorPhotoUrl = (slug: string) => `/api/ambassadors/${slug}/photo`;
/** Site address of the logged-in pilot's own photo (upload, removal). */
export const OWN_PHOTO_URL = "/api/me/profile/photo";
/**
 * Address to show the pilot's own photo, null without photo: it changes with each new photo
 * (`photoUpdatedAt` of the profile), otherwise the browser keeps showing the previous one.
 */
export const ownPhotoSrc = (photoUpdatedAt: string | null) =>
  photoUpdatedAt === null ? null : `${OWN_PHOTO_URL}?v=${Date.parse(photoUpdatedAt)}`;
/** Site address of the check of a handle (query `handle`). */
export const HANDLE_CHECK_URL = "/api/me/profile/handle-check";
