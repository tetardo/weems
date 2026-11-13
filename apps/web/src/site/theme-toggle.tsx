"use client";

import { useTranslations } from "next-intl";
import { buttonClass, toggleTheme } from "@weems/ui";
import { ThemeDarkIcon, ThemeLightIcon } from "../ui/icons.ts";
import { THEME_STORAGE_KEY } from "./theme.ts";

/**
 * Switches between the dark and light themes and remembers the choice in this browser. Both
 * icons are rendered and CSS shows the one of the other theme: no mismatch with the server.
 * Open maps follow the change (src/map/base-map.ts).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("Site");
  return (
    <button
      type="button"
      onClick={() => toggleTheme(THEME_STORAGE_KEY)}
      className={`${buttonClass("ghost")} text-muted hover:text-ink ${className}`}
      aria-label={t("toggleTheme")}
      title={t("toggleTheme")}
    >
      <ThemeLightIcon size={20} aria-hidden="true" className="light:hidden" />
      <ThemeDarkIcon size={20} aria-hidden="true" className="hidden light:block" />
    </button>
  );
}
