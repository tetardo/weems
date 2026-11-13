import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Brand } from "../site/brand.tsx";
import { LanguageChoice } from "../site/language-choice.tsx";
import { AuthWelcome } from "./auth-welcome.tsx";

interface Props {
  /** Big title of the left half (« Bienvenue à bord. »). */
  welcome: string;
  title: string;
  subtitle: string;
  form: ReactNode;
  /** Line between the form and the box under it (« Pas encore pilote Weems ? »). */
  question: string;
  /** Box under the form: invitation code on the login page, link to the login page on sign-up. */
  aside: ReactNode;
}

/**
 * Login and sign-up pages (maquette du 13/11, after Greg's reference): screen cut in two, the
 * welcome and its illustration on the left (from 1024 px), the form on the right. Always in the
 * dark theme, whatever the pilot chose (Greg, 13/11): `theme-dark` sets the dark tokens here.
 */
export function AuthPage({ welcome, title, subtitle, form, question, aside }: Props) {
  const t = useTranslations("Site");
  return (
    <main className="theme-dark grid min-h-screen bg-bg text-ink lg:grid-cols-[54fr_46fr]">
      <AuthWelcome title={welcome} />
      <section className="airport-plan flex flex-col bg-[radial-gradient(50rem_24rem_at_70%_-10%,color-mix(in_srgb,var(--wm-accent)_12%,transparent),transparent)] px-4 py-5 sm:px-14 sm:py-7 lg:[&::before]:hidden">
        <div className="flex items-center justify-between">
          <Brand name={t("name")} />
          <LanguageChoice />
        </div>
        <div className="grid flex-1 place-items-center py-8">
          <div className="w-full max-w-[340px] text-[14px]">
            <h1 className="mt-0 mb-1 font-title text-[26px] font-bold">{title}</h1>
            <p className="mt-0 mb-5 text-muted">{subtitle}</p>
            <Suspense>{form}</Suspense>
            <div className="mt-5 mb-3.5 flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              {question}
            </div>
            {aside}
          </div>
        </div>
      </section>
    </main>
  );
}
