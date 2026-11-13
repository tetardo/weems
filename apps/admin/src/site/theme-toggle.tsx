"use client";

import { toggleTheme } from "@weems/ui";
import { DarkThemeIcon, LightThemeIcon } from "../ui/icons.ts";
import { THEME_STORAGE_KEY } from "./theme.ts";

/**
 * Switches the console between its dark and light themes and remembers the choice in this
 * browser. Both icons are rendered and CSS shows the one of the other theme: no mismatch with
 * the server.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      className="themebtn"
      onClick={() => toggleTheme(THEME_STORAGE_KEY)}
      aria-label="Changer de thème"
      title="Changer de thème"
    >
      <LightThemeIcon size={16} aria-hidden="true" className="to-light" />
      <DarkThemeIcon size={16} aria-hidden="true" className="to-dark" />
    </button>
  );
}
