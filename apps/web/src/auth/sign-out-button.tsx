"use client";

import { mdiLogout } from "@mdi/js";
import { useLocale } from "next-intl";
import { buttonClass } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

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
      <Icon path={mdiLogout} size={20} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
