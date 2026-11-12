/**
 * Public address of the site: canonical links, site map, share images (spec J4 référencement).
 * Local until the site goes online.
 */
export function siteUrl(): URL {
  return new URL(process.env["WEEMS_SITE_URL"] ?? "http://localhost:3001");
}
