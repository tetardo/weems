import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthPage } from "../../../../auth/auth-page.tsx";
import { SignupForm } from "../../../../auth/signup-form.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("signupTitle") };
}

/** Sign-up with the invitation code of the closed alpha (`pnpm invite`, spec J3). */
export default async function SignupPage({ params }: Props) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("Auth");
  return (
    <AuthPage
      welcome={t("welcome.signupTitle")}
      title={t("signupTitle")}
      subtitle={t("signupSubtitle")}
      form={<SignupForm />}
      other={{
        href: "/login",
        question: t("toLoginQuestion"),
        label: t("toLogin"),
        hint: t("toLoginHint"),
      }}
    />
  );
}
