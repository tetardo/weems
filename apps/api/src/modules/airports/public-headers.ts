/** Public reference data (OurAirports), read from the browser: open to every origin, cacheable for a day. */
export const PUBLIC_HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=86400",
};
