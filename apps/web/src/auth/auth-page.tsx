import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Link } from "../i18n/navigation.ts";
import { Brand } from "../site/brand.tsx";
import { CardBox } from "../ui/card-box.tsx";

interface Props {
  title: string;
  form: ReactNode;
  other: { href: "/login" | "/signup"; label: string };
}

/** Login and sign-up pages: the site's name, then a centred panel (GameLab entry page). */
export function AuthPage({ title, form, other }: Props) {
  const t = useTranslations("Site");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_srgb,var(--color-accent)_14%,transparent),transparent)] p-4">
      <Brand name={t("name")} />
      <CardBox className="flex w-full flex-col sm:w-[440px]">
        <h1 className="mt-0 mb-4 text-[1.5em]">{title}</h1>
        <Suspense>{form}</Suspense>
        <hr className="my-4 border-line" />
        <Link href={other.href} className="text-link underline-offset-2 hover:underline">
          {other.label}
        </Link>
      </CardBox>
    </main>
  );
}
