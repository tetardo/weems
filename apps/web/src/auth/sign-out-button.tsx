"use client";

import { useLocale } from "next-intl";
import { buttonClass } from "../ui/button.tsx";
import { SignOutIcon } from "../ui/icons.ts";

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
    <button type="button" onClick={signOut} className={buttonClass("ghost")} title={label}>
      <SignOutIcon size={20} aria-hidden="true" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
