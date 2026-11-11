"use client";

import { mdiLogout } from "@mdi/js";
import { useLocale } from "next-intl";
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
    <button
      type="button"
      onClick={signOut}
      className="flex items-center gap-2 px-3 hover:text-blue-500"
    >
      <Icon path={mdiLogout} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
