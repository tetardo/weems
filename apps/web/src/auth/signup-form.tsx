"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AuthField, PasswordField } from "./auth-field.tsx";
import { AuthForm } from "./auth-form.tsx";
import { AccountIcon, EmailIcon, InviteIcon } from "../ui/icons.ts";

/** Closed alpha: the invitation code comes in the address sent to the pilot (?code=…). */
export function SignupForm() {
  const t = useTranslations("Auth");
  const code = useSearchParams().get("code") ?? "";
  return (
    <AuthForm path="/sign-up/email" submitLabel={t("signupSubmit")}>
      <AuthField
        label={t("inviteCode")}
        icon={InviteIcon}
        name="inviteCode"
        defaultValue={code}
        autoComplete="off"
      />
      <AuthField
        label={t("name")}
        icon={AccountIcon}
        name="name"
        autoComplete="nickname"
        maxLength={40}
      />
      <AuthField
        label={t("email")}
        icon={EmailIcon}
        name="email"
        type="email"
        autoComplete="email"
      />
      <PasswordField
        label={`${t("password")} (${t("passwordRule")})`}
        name="password"
        minLength={10}
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
