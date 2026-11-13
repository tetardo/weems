"use client";

import { useLocale, useTranslations } from "next-intl";
import { BARE_INPUT_CLASS, CONTROL_CLASS } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { InviteIcon } from "../ui/icons.ts";

const BOX = "rounded-panel border border-line bg-surface px-4 py-3.5";
const OUTLINE =
  "grid min-h-10 flex-none place-items-center rounded-control border border-accent px-3.5 text-sm font-semibold text-link";

/** Box under the sign-up form: a short line and a link to the login page. */
export function SwitchLink({ hint, label }: { hint: string; label: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${BOX}`}>
      <small className="text-[13px] text-muted">{hint}</small>
      <Link href="/login" className={OUTLINE}>
        {label}
      </Link>
    </div>
  );
}

/**
 * Box under the login form (closed alpha): a pilot who received an invitation code types it
 * here and lands on the sign-up page with the code already filled in (`/signup?code=…`).
 */
export function InviteEntry() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  return (
    <form action={`/${locale}/signup`} method="get" className={BOX}>
      <label htmlFor="invite-entry" className="mb-2 block text-[13px] text-muted">
        {t("toSignupHint")}
      </label>
      <div className="flex gap-2">
        <span className={`${CONTROL_CLASS} h-10 border-line`}>
          <InviteIcon size={16} aria-hidden="true" className="flex-none text-muted" />
          <input
            id="invite-entry"
            name="code"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder={t("invitePlaceholder")}
            className={BARE_INPUT_CLASS}
          />
        </span>
        <button type="submit" className={`${OUTLINE} whitespace-nowrap`}>
          {t("toSignup")}
        </button>
      </div>
    </form>
  );
}
