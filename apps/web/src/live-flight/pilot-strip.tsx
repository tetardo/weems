import type { PublicPilot } from "@weems/contrats";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { countryName } from "../format/countries.ts";
import { Link } from "../i18n/navigation.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { CountryFlag } from "../ui/country-flag.tsx";
import { ForwardIcon } from "../ui/icons.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";
import { RankBadge } from "../ui/rank-badge.tsx";

/**
 * Under the figures (Greg, 13/11/2026): who flies, a few facts from the public profile and the
 * way to it.
 */
export function PilotStrip({ pilot }: { pilot: PublicPilot }) {
  const t = useTranslations("LiveFlight.pilot");
  const format = useFormatter();
  const locale = useLocale();
  const { stats } = pilot;
  const facts = [
    t("flights", { count: stats.flights }),
    t("hours", { hours: format.number(stats.airborneS / 3600, { maximumFractionDigits: 0 }) }),
    t("airports", { count: stats.airports }),
    stats.favoriteAircraft && t("favorite", { name: stats.favoriteAircraft }),
    t("since", {
      date: format.dateTime(new Date(pilot.memberSince), { month: "short", year: "numeric" }),
    }),
  ].filter((fact): fact is string => Boolean(fact));
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3 text-[12.5px] text-muted">
      <PilotAvatar pilot={pilot} src={pilotPhotoUrl(pilot.handle)} className="size-8 text-[13px]" />
      <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        {pilot.name}
        {pilot.country && (
          <CountryFlag code={pilot.country} name={countryName(pilot.country, locale)} />
        )}
      </span>
      <RankBadge rank={pilot.rank.rank} compact />
      <ul className="m-0 flex list-none flex-wrap gap-x-3 p-0">
        {facts.map((fact, i) => (
          <li
            key={fact}
            className={i > 0 ? "before:mr-3 before:text-line before:content-['·']" : ""}
          >
            {fact}
          </li>
        ))}
      </ul>
      <Link
        href={`/pilots/${pilot.handle}`}
        className="ml-auto inline-flex items-center gap-1.5 font-semibold text-link"
      >
        {t("page")}
        <ForwardIcon size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
