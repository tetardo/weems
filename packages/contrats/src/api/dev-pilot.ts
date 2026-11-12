/**
 * Development pilot: created by the API outside production only (apps/api, dev-pilot.ts), owner of
 * every flight sent with the development token. Its login is public on purpose: it exists only on
 * a developer's machine. Used by the site's end-to-end tests and the local admin console.
 */
export const DEV_PILOT_LOGIN = {
  email: "pilote@weems.local",
  password: "weems-dev-password",
} as const;
