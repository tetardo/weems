"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CopyIcon, DoneIcon } from "../ui/icons.ts";

/** How long « Copied » stays, ms. */
const COPIED_MS = 2000;

/** Copies an offer code, or the sign-up address that carries it (`path`, made absolute). */
export function CopyCodeButton({
  text,
  path = false,
  label,
}: {
  text: string;
  path?: boolean;
  label: string;
}) {
  const t = useTranslations("Offers.plan");
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(path ? new URL(text, window.location.origin).href : text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }
  const Icon = copied ? DoneIcon : CopyIcon;
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`inline-flex h-9 items-center gap-1.5 rounded-control border px-2.5 text-[13px] font-medium transition-colors ${copied ? "border-success text-success" : "border-line hover:bg-ink/9"}`}
    >
      <Icon size={15} aria-hidden="true" />
      <span role={copied ? "status" : undefined}>{copied ? t("copied") : label}</span>
    </button>
  );
}
