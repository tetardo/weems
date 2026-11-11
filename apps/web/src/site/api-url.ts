/** API seen by the browser (live stream). */
export function publicApiUrl(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
}

/** API seen by the site's server: flight pages and the login routes it relays (/api/auth). */
export function serverApiUrl(): string {
  return process.env["WEEMS_API_URL"] ?? publicApiUrl();
}
