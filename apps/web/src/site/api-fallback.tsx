import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ApiOutdated, ApiRefused, ApiUnavailable } from "../api/api-request.ts";
import { ApiDown } from "./api-down.tsx";

function TooManyRequests() {
  const t = useTranslations("Site");
  return (
    <main className="p-4">
      <p className="rounded-md border-l-4 border-accent-2 bg-accent-2/14 px-3 py-2">{t("busy")}</p>
    </main>
  );
}

/**
 * What a page shows when its call to the API fails: API down, API of an older version, or too many
 * requests (public pages, 429). Any other error goes on to the error page.
 */
export function apiFallback(error: unknown): ReactNode {
  if (error instanceof ApiUnavailable) return <ApiDown url={error.url} />;
  if (error instanceof ApiOutdated) return <ApiDown url={error.url} outdated />;
  if (error instanceof ApiRefused && error.status === 429) return <TooManyRequests />;
  throw error;
}
