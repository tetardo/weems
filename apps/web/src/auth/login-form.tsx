"use client";

import { useTranslations } from "next-intl";
import { AuthField, PasswordField } from "./auth-field.tsx";
import { AuthForm } from "./auth-form.tsx";
import { EmailIcon } from "../ui/icons.ts";

/**
 * Login: e-mail, password, « Rester connecté » (unchecked = session ends with the browser).
 * No « Mot de passe oublié » link until the API can send e-mails.
 */
export function LoginForm() {
  const t = useTranslations("Auth");
  return (
    <AuthForm path="/sign-in/email" submitLabel={t("submit")}>
      <AuthField
        label={t("email")}
        icon={EmailIcon}
        name="email"
        type="email"
        autoComplete="email"
      />
      <PasswordField label={t("password")} name="password" autoComplete="current-password" />
      <label className="mb-4 flex min-h-11 w-fit cursor-pointer items-center gap-2.5 text-[13.5px]">
        <input type="checkbox" name="rememberMe" defaultChecked className="size-4 accent-accent" />
        {t("rememberMe")}
      </label>
    </AuthForm>
  );
}
