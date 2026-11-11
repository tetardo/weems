"use client";

import type { HandleCheck } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { HANDLE_CHECK_URL } from "../site/api-relay.ts";

type Status = HandleCheck["status"] | "checking" | null;

const STATUS_CLASS: Record<HandleCheck["status"], string> = {
  available: "text-success",
  taken: "text-danger",
  reserved: "text-danger",
  invalid: "text-danger",
};

/** Waits for the pilot to stop typing before asking the API. */
const CHECK_DELAY_MS = 400;

/** The address of the profile, checked as the pilot types it: available, taken, reserved. */
export function HandleField({ initial, siteHost }: { initial: string; siteHost: string }) {
  const t = useTranslations("Settings.handle");
  const [handle, setHandle] = useState(initial);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (handle === "") return setStatus(null);
    setStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ handle });
        const response = await fetch(`${HANDLE_CHECK_URL}?${query}`, { signal: controller.signal });
        setStatus(response.ok ? ((await response.json()) as HandleCheck).status : null);
      } catch {
        // Typing again aborts the previous check; a network error leaves the field unmarked.
      }
    }, CHECK_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [handle]);

  return (
    <label className="mt-3.5 flex flex-col gap-1.5">
      <span className="font-semibold">{t("label")}</span>
      <span className="flex min-h-11 items-center rounded-[10px] border border-line bg-bg pl-3">
        <span className="whitespace-nowrap text-muted">{siteHost}/pilots/</span>
        <input
          name="handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          maxLength={30}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 pl-0.5 text-ink outline-none"
        />
        {status && status !== "checking" && (
          <span role="status" className={`px-3 text-sm font-semibold ${STATUS_CLASS[status]}`}>
            {t(status)}
          </span>
        )}
      </span>
      <span className="text-[.9em] text-muted">{t("help")}</span>
    </label>
  );
}
