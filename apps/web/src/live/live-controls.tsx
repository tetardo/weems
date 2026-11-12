import { useTranslations } from "next-intl";
import { RoutesIcon } from "../ui/icons.ts";
import type { Connection } from "./use-live-flights.ts";

/** Top left of the live map: number of flights and connection, routes switch. */
export function LiveControls({
  count,
  connection,
  showRoutes,
  onShowRoutes,
}: {
  count: number;
  connection: Connection;
  showRoutes: boolean;
  onShowRoutes: (shown: boolean) => void;
}) {
  const t = useTranslations("Live");
  return (
    <div className="absolute top-21 left-3 flex flex-col items-start gap-2 sm:left-6">
      <div className="rounded-[10px] border border-line bg-surface px-3 py-1.5">
        {t("count", { count })} · {t(`connection.${connection}`)}
      </div>
      <button
        type="button"
        aria-pressed={showRoutes}
        onClick={() => onShowRoutes(!showRoutes)}
        className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 aria-pressed:border-accent aria-pressed:text-accent"
      >
        <RoutesIcon size={18} />
        {t("showRoutes")}
      </button>
    </div>
  );
}
