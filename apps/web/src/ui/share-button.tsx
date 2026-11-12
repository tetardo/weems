"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { buttonClass } from "@weems/ui";
import { ShareIcon } from "./icons.ts";

/**
 * « Share »: the phone's share sheet when there is one, else the address copied to the clipboard.
 * `path`: the page shared, without the language (the logbook shares the public page); this page
 * when absent.
 */
export function ShareButton({
  path,
  label,
  copied,
  title,
}: {
  path?: string;
  label: string;
  copied: string;
  title: string;
}) {
  const locale = useLocale();
  const [done, setDone] = useState(false);
  async function share() {
    const url = path
      ? new URL(`/${locale}${path}`, window.location.origin).href
      : window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }
  return (
    <button type="button" onClick={() => void share()} className={buttonClass("outline")}>
      <ShareIcon size={16} aria-hidden="true" />
      <span role="status">{done ? copied : label}</span>
    </button>
  );
}
