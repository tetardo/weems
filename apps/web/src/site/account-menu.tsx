"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { useDismiss } from "../ui/use-dismiss.ts";

/**
 * Pilot's photo (or initial without photo) at the right of the floating bar, opening a small menu
 * (name first, photo in a gradient ring): `children` are its entries (profile, test plan, sign out).
 */
export function AccountMenu({
  name,
  photo,
  children,
}: {
  name: string;
  /** Address of the photo, versioned (ownPhotoSrc); null shows the initial. */
  photo: string | null;
  children: ReactNode;
}) {
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
        className="grid size-11 place-items-center rounded-full transition-colors hover:bg-ink/9"
      >
        <span aria-hidden="true" className="avatar-ring rounded-full p-0.5">
          <span className="avatar grid size-8 place-items-center overflow-hidden rounded-full border-2 border-surface font-title text-sm font-bold">
            {/* Plain img: served by the API, already 256 px. */}
            {photo ? (
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              name.slice(0, 1).toUpperCase()
            )}
          </span>
        </span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 flex w-64 flex-col max-md:fixed max-md:inset-x-3 max-md:top-[76px] max-md:w-auto rounded-panel border border-line bg-surface p-1.5 shadow-floating [&>*]:w-full [&>*]:justify-start">
          <p className="truncate px-3 pt-2 pb-2.5 text-sm font-semibold" title={name}>
            {name}
          </p>
          {children}
        </div>
      )}
    </div>
  );
}
