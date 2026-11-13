import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthPage } from "../../../../auth/auth-page.tsx";
import { InviteEntry } from "../../../../auth/auth-switch.tsx";
import { LoginForm } from "../../../../auth/login-form.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("title") };
}

/** Login of the site, and of the tracker (OAuth: the API sends the browser here, spec J3). */
export default async function LoginPage({ params }: Props) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("Auth");
  return (
    <AuthPage
      welcome={t("welcome.title")}
      title={t("title")}
      subtitle={t("subtitle")}
      form={<LoginForm />}
      question={t("toSignupQuestion")}
      aside={<InviteEntry />}
    />
  );
}
