"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { ChevronIcon } from "../ui/icons.ts";
import { useDismiss } from "../ui/use-dismiss.ts";

/**
 * Pilot's button at the right of the floating bar (initial, name on large screens) opening
 * a small menu: `children` are its entries (language, sign out).
 */
export function AccountMenu({ name, children }: { name: string; children: ReactNode }) {
  const t = useTranslations("Site");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("accountMenu", { name })}
        className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 transition-colors hover:bg-ink/9"
      >
        <span
          aria-hidden="true"
          className="grid size-8 flex-none place-items-center rounded-full bg-accent-2 text-[13px] font-bold text-on-accent"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-48 truncate text-sm font-medium max-lg:hidden">{name}</span>
        <ChevronIcon size={16} aria-hidden="true" className="text-muted max-lg:hidden" />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 flex w-60 flex-col rounded-2xl border border-line bg-surface p-1.5 shadow-floating [&>*]:w-full [&>*]:justify-start">
          <p className="truncate px-3 pt-2 pb-2.5 text-sm font-semibold" title={name}>
            {name}
          </p>
          {children}
        </div>
      )}
    </div>
  );
}
