import { useTranslations } from "next-intl";
import { setFlightHiddenAction } from "../../settings/profile-actions.ts";

/**
 * « Visible sur ma page publique » at the top of the full page of a flight (Greg, 13/11): a switch
 * that hides or shows the flight on the public page; the flight stays in the logbook.
 */
export function VisibilitySwitch({ flightId, hidden }: { flightId: string; hidden: boolean }) {
  const t = useTranslations("Logbook.flight.visibility");
  return (
    <form
      action={setFlightHiddenAction.bind(null, flightId, !hidden)}
      className="flex items-center gap-3"
    >
      <div className="text-right">
        <div className="text-[13px] font-semibold">{t("label")}</div>
        <div className="text-[12px] text-muted">{hidden ? t("hidden") : t("shown")}</div>
      </div>
      <button
        type="submit"
        role="switch"
        aria-checked={!hidden}
        aria-label={t("label")}
        className={`relative h-6 w-11 flex-none cursor-pointer rounded-full transition-colors ${hidden ? "bg-line" : "bg-accent"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${hidden ? "left-0.5" : "left-[22px]"}`}
        />
      </button>
    </form>
  );
}
