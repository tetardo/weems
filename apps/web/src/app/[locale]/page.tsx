import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "../../i18n/navigation.ts";

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("Home");
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <ul className="list-disc pl-6">
        <li>
          <Link href="/flights">{t("flights")}</Link>
        </li>
        <li>
          <Link href="/live">{t("live")}</Link>
        </li>
      </ul>
    </main>
  );
}
