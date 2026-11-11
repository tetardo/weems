"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "./auth-form.tsx";
import { Field } from "./field.tsx";

export function LoginForm() {
  const t = useTranslations("Auth");
  return (
    <AuthForm path="/sign-in/email" submitLabel={t("submit")}>
      <Field label={t("email")} name="email" type="email" autoComplete="email" />
      <Field
        label={t("password")}
        name="password"
        type="password"
        autoComplete="current-password"
      />
    </AuthForm>
  );
}
