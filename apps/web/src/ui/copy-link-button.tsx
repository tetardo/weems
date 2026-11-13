"use client";

import { buttonClass } from "@weems/ui";
import { useState } from "react";
import { DoneIcon, LinkIcon } from "./icons.ts";

/** Icon button that copies the address of the page; its label says it in a tooltip and to readers. */
export function CopyLinkButton({ label, copied }: { label: string; copied: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }
  const Icon = done ? DoneIcon : LinkIcon;
  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={done ? copied : label}
      aria-label={done ? copied : label}
      className={`${buttonClass("outline")} w-11 px-0`}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
