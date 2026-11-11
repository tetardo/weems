import { useTranslations } from "next-intl";

/** Shown instead of a page when the API on the Mac does not answer. */
export function ApiDown({ url }: { url: string }) {
  const t = useTranslations("Flights");
  return (
    <main className="p-4">
      <p className="rounded bg-amber-50 p-3 text-amber-900">{t("apiDown", { url })}</p>
    </main>
  );
}
