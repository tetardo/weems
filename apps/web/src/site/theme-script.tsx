"use client";

import { THEME_SCRIPT } from "./theme.ts";

/**
 * THEME_SCRIPT in the page head. The browser runs it from the server's HTML only. When React
 * builds the document in the browser instead (recovery after a server error), a script element
 * would never run and React warns about it ("Encountered a script tag…"): there it is rendered as
 * text/plain, an inert data block, hence the hydration difference, expected and silenced.
 */
export function ThemeScript() {
  const type = typeof window === "undefined" ? "text/javascript" : "text/plain";
  return (
    <script
      type={type}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
