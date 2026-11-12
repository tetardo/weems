"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { type AuthError, authRequest } from "./auth-request.ts";
import { Button } from "@weems/ui";
import { LANDING_PAGE, safeNext } from "./session-cookie.ts";

interface Props {
  path: "/sign-in/email" | "/sign-up/email";
  submitLabel: string;
  children: ReactNode;
}

/**
 * Login or sign-up form: sends the fields to the API, then goes back to the tracker
 * (OAuth), to the page asked before login (`next`), or to the pilot's logbook.
 * Full page loads, so that every page is rendered again with the new session.
 */
export function AuthForm({ path, submitLabel, children }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const search = useSearchParams();
  const [error, setError] = useState<AuthError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = await authRequest(path, fields, search.toString());
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign(
      result.redirectTo ?? safeNext(search.get("next"), `/${locale}${LANDING_PAGE}`),
    );
  }

  return (
    <form onSubmit={submit}>
      {search.has("sig") && (
        <p className="mb-4 rounded-tag border-l-4 border-accent bg-accent/14 px-3 py-2">
          {t("tracker")}
        </p>
      )}
      {children}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-tag border-l-4 border-danger bg-danger/14 px-3 py-2 font-semibold text-danger"
        >
          {t(`errors.${error}`)}
        </p>
      )}
      <Button type="submit" disabled={busy} className="mt-1 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
