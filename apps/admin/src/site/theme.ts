import { themeScript } from "@weems/ui";

/** Key of the console's theme choice in the browser (rules in @weems/ui, as on the site). */
export const THEME_STORAGE_KEY = "weems-admin-theme";

/** Script of the page head: sets data-theme on <html> before the page is drawn (no flash). */
export const THEME_SCRIPT = themeScript(THEME_STORAGE_KEY);
