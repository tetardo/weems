import { fullFlightHref } from "../logbook/flight/full-flight-href.ts";
import { OWN_PHOTO_URL, pilotPhotoUrl } from "../site/api-relay.ts";

/**
 * Where a profile page points: the same page is the public profile (/pilots/{handle}) and the
 * pilot's preview of it in the logbook (/logbook/public), whose photo and flights are the pilot's private addresses.
 */
export interface ProfileLinks {
  photo: string;
  /** The page itself, for the flight list pages. */
  page: string;
  flight: (flightId: string) => string;
  /** Page shared by the « Share » button (without the language); null: no button. */
  share: string | null;
}

export function publicProfileLinks(handle: string): ProfileLinks {
  const page = `/pilots/${handle}`;
  return {
    photo: pilotPhotoUrl(handle),
    page,
    flight: (flightId) => `${page}/flights/${flightId}`,
    share: page,
  };
}

/** The logbook shares the public page, only once it is public. */
export function logbookLinks(publicHandle: string | null): ProfileLinks {
  return {
    photo: OWN_PHOTO_URL,
    page: "/logbook/public",
    flight: fullFlightHref,
    share: publicHandle ? `/pilots/${publicHandle}` : null,
  };
}
