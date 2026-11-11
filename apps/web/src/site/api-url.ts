/** API seen by the browser (live stream). */
export function publicApiUrl(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
}

/** API seen by the site's server (flight pages), and its development token until accounts (J3). */
export function serverApi(): { url: string; token: string } {
  return {
    url: process.env["WEEMS_API_URL"] ?? publicApiUrl(),
    token: process.env["WEEMS_API_TOKEN"] ?? "dev-token",
  };
}
