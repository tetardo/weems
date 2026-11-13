import { themeScript } from "@weems/ui";

/** Key of the pilot's theme choice in the browser's local storage (rules in @weems/ui). */
export const THEME_STORAGE_KEY = "weems-theme";

/** Script of the page head: sets data-theme on <html> before the page is drawn (no flash). */
export const THEME_SCRIPT = themeScript(THEME_STORAGE_KEY);
