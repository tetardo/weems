"use client";

import type { HandleCheck } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getPathname } from "../i18n/navigation.ts";
import { HANDLE_CHECK_URL } from "../site/api-relay.ts";
import { Button } from "../ui/button.tsx";
import { Field } from "../ui/field.tsx";
import { SaveIcon, WarningIcon } from "../ui/icons.ts";
import { TextInput } from "../ui/text-input.tsx";
import { AddressActions } from "./address-actions.tsx";

type Status = HandleCheck["status"] | "checking" | null;

const STATUS_CLASS: Record<HandleCheck["status"], string> = {
  available: "text-success",
  taken: "text-danger",
  reserved: "text-danger",
  invalid: "text-danger",
};

/** Waits for the pilot to stop typing before asking the API. */
const CHECK_DELAY_MS = 400;

/** Availability of the typed address, asked once the pilot stops typing. */
function useHandleCheck(handle: string): Status {
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
  return status;
}

/** What the page is online at, as saved: the typed address counts only once saved. */
interface Saved {
  handle: string | null;
  isPublic: boolean;
}

/** The typed address after the site's prefix, with its availability on the right. */
function AddressInput({
  handle,
  onChange,
  siteHost,
  changing,
}: {
  handle: string;
  onChange: (handle: string) => void;
  siteHost: string;
  changing: boolean;
}) {
  const t = useTranslations("Settings.handle");
  const status = useHandleCheck(handle);
  return (
    <span className="min-w-0 flex-1 max-sm:basis-full">
      <TextInput
        id="handle"
        name="handle"
        prefix={`${siteHost}/pilots/`}
        warn={changing}
        value={handle}
        onChange={(event) => onChange(event.target.value.toLowerCase())}
        maxLength={30}
        autoComplete="off"
        spellCheck={false}
        end={
          status &&
          status !== "checking" && (
            <span
              role="status"
              className={`text-sm font-semibold whitespace-nowrap ${STATUS_CLASS[status]}`}
            >
              {t(status)}
            </span>
          )
        }
      />
    </span>
  );
}

/** Under the field: the rules of an address, or the warning while an online one is changed. */
function HandleHint({ changingFrom }: { changingFrom: string | null }) {
  const t = useTranslations("Settings.handle");
  if (changingFrom === null) return t("help");
  return (
    <span className="flex items-start gap-2 text-accent-2">
      <WarningIcon size={16} aria-hidden="true" className="mt-0.5 flex-none" />
      <span>{t.rich("changing", { handle: changingFrom, b: (chunks) => <b>{chunks}</b> })}</span>
    </span>
  );
}

/**
 * The address of the profile, checked as the pilot types it (available, taken, reserved), with
 * « copy » and « open » for the saved address, and a warning while an online address is changed.
 */
export function HandleField({
  initial,
  siteHost,
  saved,
  switchChanged,
}: {
  initial: string;
  siteHost: string;
  saved: Saved;
  /** The publication switch differs from what is saved. */
  switchChanged: boolean;
}) {
  const t = useTranslations("Settings.handle");
  const locale = useLocale();
  const [handle, setHandle] = useState(initial);
  const online = saved.isPublic ? saved.handle : null;
  const changing = online !== null && handle !== online;
  const path =
    online !== null && !changing ? getPathname({ href: `/pilots/${online}`, locale }) : null;
  return (
    <Field
      label={t("label")}
      htmlFor="handle"
      help={<HandleHint changingFrom={changing ? online : null} />}
    >
      <div className="flex flex-wrap items-stretch justify-end gap-2">
        <AddressInput
          handle={handle}
          onChange={setHandle}
          siteHost={siteHost}
          changing={changing}
        />
        {/* Saves the whole form, like « Save » at the bottom: right next to what was changed. */}
        <Button
          type="submit"
          title={t("validate")}
          aria-label={t("validate")}
          disabled={!switchChanged && handle === saved.handle}
          className="w-11 px-0"
        >
          <SaveIcon size={18} aria-hidden="true" />
        </Button>
        <AddressActions path={path} offReason={t(changing ? "saveFirst" : "offline")} />
      </div>
    </Field>
  );
}
