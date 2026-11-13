/**
 * Light or dark theme of the web site and the console (decision 003): the visitor's choice
 * kept in the browser, else the system setting. Each application names its own storage key.
 */
export type Theme = "light" | "dark";

/**
 * Theme to show: the stored choice when valid, else the system setting. Self-contained (no
 * outer name) because its source is also inlined in the page head, before the first paint.
 */
export function resolveTheme(stored: string | null, systemPrefersLight: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersLight ? "light" : "dark";
}

/** Script of the page head: sets data-theme on <html> before the page is drawn (no flash). */
export function themeScript(storageKey: string): string {
  return `(() => {
  let stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(storageKey)}); } catch {}
  const light = window.matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.dataset.theme = (${resolveTheme.toString()})(stored, light);
})();`;
}

/** Theme of this browser now: stored choice, else the system setting. */
export function currentTheme(storageKey: string): Theme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(storageKey);
  } catch {
    // Storage refused (private browsing): the system setting decides.
  }
  return resolveTheme(stored, matchMedia("(prefers-color-scheme: light)").matches);
}

/** Switches <html> to the other theme and remembers the choice in this browser. */
export function toggleTheme(storageKey: string): Theme {
  const root = document.documentElement;
  const next: Theme = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    // Storage refused (private browsing): the choice lasts until the page is left.
  }
  return next;
}
