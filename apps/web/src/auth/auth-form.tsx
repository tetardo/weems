"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { type AuthError, authRequest } from "./auth-request.ts";
import { Button } from "../ui/button.tsx";
import { safeNext } from "./session-cookie.ts";

interface Props {
  path: "/sign-in/email" | "/sign-up/email";
  submitLabel: string;
  children: ReactNode;
}

/**
 * Login or sign-up form: sends the fields to the API, then goes back to the tracker
 * (OAuth), to the page asked before login (`next`), or to the pilot's flights.
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
    window.location.assign(result.redirectTo ?? safeNext(search.get("next"), `/${locale}/flights`));
  }

  return (
    <form onSubmit={submit}>
      {search.has("sig") && (
        <p className="mb-6 rounded-lg border border-blue-500 bg-blue-500 px-3 py-3 text-white">
          {t("tracker")}
        </p>
      )}
      {children}
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-500 bg-red-500 px-3 py-3 text-white"
        >
          {t(`errors.${error}`)}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
