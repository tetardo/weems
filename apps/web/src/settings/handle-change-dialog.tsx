"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@weems/ui";

/**
 * Asked before a page that is online moves to another address: the old one stops working at once
 * (the API keeps no history), shared links break and another pilot can take it.
 */
export function HandleChangeDialog({
  from,
  to,
  onConfirm,
  onCancel,
}: {
  from: string;
  to: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Settings.handleChange");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => dialog.current?.showModal(), []);
  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby="handle-change-title"
      onCancel={onCancel}
      className="m-auto w-[min(440px,calc(100%-32px))] rounded-panel border border-line bg-surface px-6 py-5.5 text-ink shadow-2xl backdrop:bg-black/55"
    >
      <h2 id="handle-change-title" className="m-0 text-[1.15em]">
        {t("title")}
      </h2>
      <p className="m-0 mt-2.5 text-sm text-muted">
        {t.rich("move", {
          from: `/pilots/${from}`,
          to: `/pilots/${to}`,
          code: (chunks) => <code className="font-mono font-semibold text-ink">{chunks}</code>,
        })}
      </p>
      <ul className="m-0 mt-3 flex list-disc flex-col gap-1.5 pl-4.5 text-sm">
        <li>{t("links")}</li>
        <li>{t("free")}</li>
      </ul>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} autoFocus>
          {t("cancel")}
        </Button>
        <Button variant="caution" onClick={onConfirm}>
          {t("confirm")}
        </Button>
      </div>
    </dialog>
  );
}
