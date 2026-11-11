/** Theme of the site (decision 003): the pilot's choice, else the system setting. */
export type Theme = "light" | "dark";

/** Key of the pilot's choice in the browser's local storage. */
export const THEME_STORAGE_KEY = "weems-theme";

/**
 * Theme to show: the stored choice when valid, else the system setting. Self-contained (no
 * outer name) because its source is also inlined in the page head, before the first paint.
 */
export function resolveTheme(stored: string | null, systemPrefersLight: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersLight ? "light" : "dark";
}

/** Script of the page head: sets data-theme on <html> before the page is drawn (no flash). */
export const THEME_SCRIPT = `(() => {
  let stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch {}
  const light = window.matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.dataset.theme = (${resolveTheme.toString()})(stored, light);
})();`;
