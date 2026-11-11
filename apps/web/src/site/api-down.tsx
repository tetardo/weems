import { useTranslations } from "next-intl";

/**
 * Shown instead of a page when the API on the Mac does not answer (down), or answers in a format
 * the site does not know (outdated: an older API, often the weems-api-1 Docker container).
 */
export function ApiDown({ url, outdated = false }: { url: string; outdated?: boolean }) {
  const t = useTranslations("Flights");
  return (
    <main className="p-4">
      <p className="rounded-md border-l-4 border-accent-2 bg-accent-2/14 px-3 py-2">
        {t(outdated ? "apiOutdated" : "apiDown", { url })}
      </p>
    </main>
  );
}
