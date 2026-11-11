"use client";

import { useLocale } from "next-intl";

/** Ends the session on the API, then back to the login page. */
export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();
  async function signOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
    window.location.assign(`/${locale}/login`);
  }
  return (
    <button type="button" onClick={signOut} className="text-muted underline">
      {label}
    </button>
  );
}
