"use client";

import { Button } from "@weems/ui";
import { useTranslations } from "next-intl";

/**
 * Shown inside the site's frame when a page fails on the server (an error that no page turned into
 * a message, such as an answer of the API that does not match its contract). Without it, Next.js
 * replaces the whole document, theme script included, by its own English error page.
 */
export function PageError({ retry }: { retry: () => void }) {
  const t = useTranslations("Site.error");
  return (
    <main className="grid gap-3 p-4">
      <p className="rounded-md border-l-4 border-danger bg-danger/12 px-3 py-2">{t("text")}</p>
      <div>
        <Button variant="outline" onClick={retry}>
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
