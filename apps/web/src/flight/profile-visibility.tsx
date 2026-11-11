import { useTranslations } from "next-intl";
import { setFlightHiddenAction } from "../settings/profile-actions.ts";
import { Button } from "../ui/button.tsx";
import { HideIcon, ShowIcon } from "../ui/icons.ts";

/** « Hide from my profile » on a closed flight (spec J4): the flight stays in the logbook. */
export function ProfileVisibility({ flightId, hidden }: { flightId: string; hidden: boolean }) {
  const t = useTranslations("Flight.publicProfile");
  const Icon = hidden ? ShowIcon : HideIcon;
  return (
    <form
      action={setFlightHiddenAction.bind(null, flightId, !hidden)}
      className="flex items-center gap-3"
    >
      {hidden && <span className="text-sm text-muted">{t("hidden")}</span>}
      <Button type="submit" variant="outline">
        <Icon size={18} aria-hidden="true" />
        {hidden ? t("show") : t("hide")}
      </Button>
    </form>
  );
}
