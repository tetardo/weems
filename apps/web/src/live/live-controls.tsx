import { useTranslations } from "next-intl";
import type { IconComponent } from "../ui/icons.ts";
import { NightIcon, RoutesIcon } from "../ui/icons.ts";
import type { Connection } from "./use-live-flights.ts";

export interface Switch {
  on: boolean;
  set: (on: boolean) => void;
}

function SwitchButton({
  icon: Icon,
  label,
  value,
}: {
  icon: IconComponent;
  label: string;
  value: Switch;
}) {
  return (
    <button
      type="button"
      aria-pressed={value.on}
      onClick={() => value.set(!value.on)}
      className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 aria-pressed:border-accent aria-pressed:text-accent"
    >
      <Icon size={18} aria-hidden="true" />
      <span className="max-md:sr-only">{label}</span>
    </button>
  );
}

/** Number of flights and connection, then the routes and night switches. */
export function LiveControls({
  count,
  connection,
  routes,
  night,
}: {
  count: number;
  connection: Connection;
  routes: Switch;
  night: Switch;
}) {
  const t = useTranslations("Live");
  return (
    <div className="flex items-center gap-2 md:flex-wrap">
      <div className="flex min-h-11 items-center rounded-[10px] border border-line bg-surface px-3 max-md:hidden">
        {t("count", { count })} · {t(`connection.${connection}`)}
      </div>
      <SwitchButton icon={RoutesIcon} label={t("showRoutes")} value={routes} />
      <SwitchButton icon={NightIcon} label={t("showNight")} value={night} />
    </div>
  );
}
