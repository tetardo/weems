import { useTranslations } from "next-intl";

/** Shown instead of a page when the API on the Mac does not answer. */
export function ApiDown({ url }: { url: string }) {
  const t = useTranslations("Flights");
  return (
    <main className="p-4">
      <p className="rounded-md border-l-4 border-accent-2 bg-accent-2/14 px-3 py-2">
        {t("apiDown", { url })}
      </p>
    </main>
  );
}
