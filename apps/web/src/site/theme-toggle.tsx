"use client";

import { useTranslations } from "next-intl";
import { buttonClass } from "../ui/button.tsx";
import { ThemeDarkIcon, ThemeLightIcon } from "../ui/icons.ts";
import { type Theme, THEME_STORAGE_KEY } from "./theme.ts";

/**
 * Switches between the dark and light themes and remembers the choice in this browser. Both
 * icons are rendered and CSS shows the one of the other theme: no mismatch with the server.
 * Open maps follow the change (src/map/base-map.ts).
 */
export function ThemeToggle() {
  const t = useTranslations("Site");
  function toggle() {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage refused (private browsing): the choice lasts until the page is left.
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className={`${buttonClass("ghost")} text-muted hover:text-ink`}
      aria-label={t("toggleTheme")}
      title={t("toggleTheme")}
    >
      <ThemeLightIcon size={20} aria-hidden="true" className="light:hidden" />
      <ThemeDarkIcon size={20} aria-hidden="true" className="hidden light:block" />
    </button>
  );
}
