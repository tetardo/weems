"use client";

import { type PilotRank, RANK_THRESHOLDS } from "@weems/contrats";
import { Button } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { RankInsignia } from "../../ui/rank-insignia.tsx";
import { RANK_SEEN_STORAGE_KEY, shouldAnnounce } from "./rank-announce.ts";

function readSeen(): string | null {
  try {
    return localStorage.getItem(RANK_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(rank: PilotRank): void {
  try {
    localStorage.setItem(RANK_SEEN_STORAGE_KEY, rank);
  } catch {
    // Private mode: the window may open again on the next visit.
  }
}

/**
 * Window « Nouveau grade » of the page Résumé (spec grades des pilotes), once per new rank and
 * per browser.
 */
export function RankPromotion({ rank, reachedAt }: { rank: PilotRank; reachedAt: string | null }) {
  const t = useTranslations("Ranks");
  const format = useFormatter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldAnnounce(readSeen(), rank, reachedAt, Date.now())) setOpen(true);
    else remember(rank);
  }, [rank, reachedAt]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  if (!open || reachedAt === null) return null;
  const close = () => {
    remember(rank);
    dialog.current?.close();
    setOpen(false);
  };
  const name = t(`names.${rank}`);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="rank-promotion-title"
      onCancel={close}
      className="m-auto w-[min(460px,calc(100%-32px))] rounded-hero border border-founder/35 bg-surface px-6 py-6 text-center text-ink shadow-2xl backdrop:bg-black/55"
    >
      <p className="m-0 text-[11px] font-semibold tracking-widest text-muted uppercase">
        {t("promotion.eyebrow")}
      </p>
      <div className="mt-3 flex justify-center">
        <RankInsignia rank={rank} size={120} />
      </div>
      <h2 id="rank-promotion-title" className="m-0 mt-1 text-[28px]">
        {name}
      </h2>
      <p className="m-0 mx-auto mt-2 max-w-[380px] text-muted">
        {t("promotion.text", {
          date: format.dateTime(new Date(reachedAt), { dateStyle: "long" }),
          ...RANK_THRESHOLDS[rank],
        })}
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={close} autoFocus>
          {t("promotion.close")}
        </Button>
      </div>
    </dialog>
  );
}
