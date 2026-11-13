import { FOUNDER_OFFER, type MyFounder, type PublicFounders } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { publicProfileLinks } from "../profile/profile-links.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { GiftIcon } from "../ui/icons.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";
import { showPlacesLeft } from "./founder-display.ts";
import { FounderEmblem } from "./founder-emblem.tsx";
import { FounderProgress } from "./founder-progress.tsx";

/** Latest confirmed founders: number and name, linked when the profile is public. */
function Latest({ latest }: { latest: PublicFounders["latest"] }) {
  const t = useTranslations("Founders.banner");
  if (latest.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">{t("latest")}</span>
      {latest.map(({ number, pilot }) => (
        <span
          key={number}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5"
        >
          <span className="font-semibold text-founder">{t("number", { number })}</span>
          {pilot ? (
            <Link
              href={publicProfileLinks(pilot.handle).page}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <PilotAvatar
                pilot={pilot}
                src={pilotPhotoUrl(pilot.handle)}
                className="size-5 text-[10px]"
              />
              {pilot.name}
            </Link>
          ) : (
            <span className="text-muted italic">{t("hiddenPilot")}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Right side: the pilot's progress, or the way in for a visitor. */
function Side({ mine, open }: { mine: MyFounder | null; open: boolean }) {
  const t = useTranslations("Founders.banner");
  if (mine) {
    return (
      <div className="grid content-start gap-3">
        <p className="m-0 text-xs font-semibold tracking-wider text-muted uppercase">
          {t("yours")}
        </p>
        <FounderProgress mine={mine} />
        <Link
          href="/code"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-link"
        >
          <GiftIcon size={16} aria-hidden="true" />
          {t("haveCode")}
        </Link>
      </div>
    );
  }
  return (
    <div className="grid content-start gap-2">
      {open && (
        <Link href="/signup" className={buttonClass("primary")}>
          {t("signup")}
        </Link>
      )}
      <Link href="/login" className={buttonClass("outline")}>
        {t("login")}
      </Link>
    </div>
  );
}

/**
 * Page Offres, above the cards: the offer of the first 500 pilots (one year of Pilot Pro, the
 * numbered badge for life), the places left once few remain, the pilot's progress.
 */
export function FoundersBanner({
  founders,
  mine,
}: {
  founders: PublicFounders;
  mine: MyFounder | null;
}) {
  const t = useTranslations("Founders.banner");
  const open = founders.placesLeft > 0;
  return (
    <section className="mb-8 grid gap-6 rounded-panel border border-founder/45 bg-surface p-5 sm:p-6 md:grid-cols-[auto_1fr_minmax(240px,320px)]">
      <FounderEmblem
        label={open ? String(founders.places) : "✓"}
        className="size-24 max-md:size-18"
      />
      <div className="min-w-0">
        <p className="m-0 text-xs font-semibold tracking-wider text-founder uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="m-0 mt-1 text-[1.45em]">
          {open ? t("title", { places: founders.places }) : t("closed")}
        </h2>
        <p className="m-0 mt-2 text-sm text-muted">
          {t("text", {
            months: FOUNDER_OFFER.months,
            flights: FOUNDER_OFFER.requiredFlights,
            days: FOUNDER_OFFER.requiredDays,
            discount: FOUNDER_OFFER.discountPercent,
          })}
        </p>
        {showPlacesLeft(founders.placesLeft) && (
          <p className="m-0 mt-2 font-semibold text-founder">
            {t("placesLeft", { count: founders.placesLeft })}
          </p>
        )}
        <Latest latest={founders.latest} />
      </div>
      <Side mine={mine} open={open} />
    </section>
  );
}
