"use client";

import { useLayoutEffect } from "react";
import { currentTheme } from "@weems/ui";
import { THEME_SCRIPT, THEME_STORAGE_KEY } from "./theme.ts";

/** Puts data-theme back on <html> when React has rebuilt the element without it. */
function restoreTheme() {
  const root = document.documentElement;
  if (!root.dataset.theme) root.dataset.theme = currentTheme(THEME_STORAGE_KEY);
}

/**
 * THEME_SCRIPT in the page head. The browser runs it from the server's HTML only. When React
 * builds the document in the browser instead (recovery after a server error), a script element
 * would never run and React warns about it ("Encountered a script tag…"): there it is rendered as
 * text/plain, an inert data block, hence the hydration difference, expected and silenced.
 *
 * Changing language swaps the root layout (/fr → /en): React rebuilds <html> and drops every
 * attribute it did not set, data-theme included, and the page fell back to the dark theme. The
 * layout effect sets it again before the new page is painted.
 */
export function ThemeScript() {
  useLayoutEffect(restoreTheme);
  const type = typeof window === "undefined" ? "text/javascript" : "text/plain";
  return (
    <script
      type={type}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
