"use client";

import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { SoundOffIcon, SoundOnIcon } from "../ui/icons.ts";
import { useSound, writeSound } from "./sound-setting.ts";

/** Turns the sound of the site on or off (bar, next to the theme); off by default. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("Site");
  const on = useSound();
  const Icon = on ? SoundOnIcon : SoundOffIcon;
  const label = t(on ? "soundOff" : "soundOn");
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => writeSound(!on)}
      className={`${buttonClass("ghost")} ${on ? "text-accent" : "text-muted"} hover:text-ink ${className}`}
      aria-label={label}
      title={label}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
