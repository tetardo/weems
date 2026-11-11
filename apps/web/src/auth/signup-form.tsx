"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "./auth-form.tsx";
import { Field } from "./field.tsx";

/** Closed alpha: the invitation code comes in the address sent to the pilot (?code=…). */
export function SignupForm() {
  const t = useTranslations("Auth");
  const code = useSearchParams().get("code") ?? "";
  return (
    <AuthForm path="/sign-up/email" submitLabel={t("signupSubmit")}>
      <Field label={t("inviteCode")} name="inviteCode" defaultValue={code} autoComplete="off" />
      <Field label={t("name")} name="name" autoComplete="nickname" maxLength={40} />
      <Field label={t("email")} name="email" type="email" autoComplete="email" />
      <Field
        label={`${t("password")} (${t("passwordRule")})`}
        name="password"
        type="password"
        minLength={10}
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
