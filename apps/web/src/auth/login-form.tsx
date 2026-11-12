"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "./auth-form.tsx";
import { FormField } from "@weems/ui";

export function LoginForm() {
  const t = useTranslations("Auth");
  return (
    <AuthForm path="/sign-in/email" submitLabel={t("submit")}>
      <FormField label={t("email")} name="email" type="email" autoComplete="email" />
      <FormField
        label={t("password")}
        name="password"
        type="password"
        autoComplete="current-password"
      />
    </AuthForm>
  );
}
