import type { FlightReviewView, FlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "@weems/ui";
import { BackIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { FlightDetails } from "./flight-details.tsx";
import { ProfileVisibility } from "./profile-visibility.tsx";
import { ReviewPanel } from "./review-panel.tsx";

/**
 * The pilot's own flight page (spec site minimal): the flight, and on a closed flight the
 * pilot's check of the phases (spec J3) and « hide from my profile » (spec J4).
 */
export function FlightPage({
  flight,
  track,
  review,
  hiddenOnProfile,
}: {
  flight: FlightView;
  track: TrackView | null;
  review: FlightReviewView | null;
  hiddenOnProfile: boolean | null;
}) {
  const t = useTranslations("Flight");
  return (
    <SectionMain>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/flights" className={`${buttonClass("ghost")} -ml-3 text-link`}>
          <BackIcon size={20} aria-hidden="true" />
          {t("back")}
        </Link>
        {flight.closedAt && hiddenOnProfile !== null && (
          <ProfileVisibility flightId={flight.flightId} hidden={hiddenOnProfile} />
        )}
      </div>
      <FlightDetails
        flight={flight}
        track={track}
        beforeLog={flight.closedAt && <ReviewPanel flightId={flight.flightId} review={review} />}
      />
    </SectionMain>
  );
}
