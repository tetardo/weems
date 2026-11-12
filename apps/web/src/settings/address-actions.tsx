"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CopyIcon, DoneIcon, ExternalIcon } from "../ui/icons.ts";

/** How long « Link copied » stays, ms. */
const COPIED_MS = 2000;

const ICON_CLASS =
  "relative grid size-11 flex-none place-items-center rounded-control border transition-colors";
const ACTIVE_CLASS = "border-line text-ink hover:bg-ink/9";

/** Both icons greyed: nothing online to share yet, `reason` says why. */
function OffIcons({ reason }: { reason: string }) {
  return (
    <>
      {[CopyIcon, ExternalIcon].map((Icon, index) => (
        <span
          key={index}
          title={reason}
          aria-disabled="true"
          className={`${ICON_CLASS} cursor-default border-line text-muted opacity-45`}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
      ))}
    </>
  );
}

/** Copies the full address, then shows « Link copied » for a moment. */
function CopyButton({ path }: { path: string }) {
  const t = useTranslations("Settings.handle");
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }
  const Icon = copied ? DoneIcon : CopyIcon;
  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={t("copy")}
      aria-label={t("copy")}
      className={`${ICON_CLASS} ${copied ? "border-success text-success" : ACTIVE_CLASS}`}
    >
      <Icon size={18} aria-hidden="true" />
      {copied && (
        <span
          role="status"
          className="absolute right-0 bottom-[calc(100%+8px)] whitespace-nowrap rounded-control bg-ink px-2.5 py-1.5 text-[12.5px] text-bg"
        >
          {t("copied")}
        </span>
      )}
    </button>
  );
}

/**
 * « Copy the link » and « Open in a new tab », next to the address of the page. They act on the
 * saved address only: `path` is null while there is nothing online to share, and `offReason`
 * says why.
 */
export function AddressActions({ path, offReason }: { path: string | null; offReason: string }) {
  const t = useTranslations("Settings.handle");
  if (path === null) return <OffIcons reason={offReason} />;
  return (
    <>
      <CopyButton path={path} />
      <a
        href={path}
        target="_blank"
        rel="noopener"
        title={t("open")}
        aria-label={t("open")}
        className={`${ICON_CLASS} ${ACTIVE_CLASS}`}
      >
        <ExternalIcon size={18} aria-hidden="true" />
      </a>
    </>
  );
}
