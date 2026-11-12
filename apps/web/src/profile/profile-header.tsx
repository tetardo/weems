import type { PublicPilot } from "@weems/contrats";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { countryName } from "../format/countries.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { CountryFlag } from "../ui/country-flag.tsx";
import { FictitiousBadge } from "../ui/fictitious-badge.tsx";
import { InfoTip } from "../ui/info-tip.tsx";
import { ShareButton } from "./share-button.tsx";

/** Circumference of the Earth at the equator, nautical miles. */
const EARTH_NM = 21_600;

/**
 * Network pages and social accounts built from ids and account names, never typed by the pilot:
 * no free link on a public page. `shown`: what the chip says after the network's name.
 */
const ACCOUNTS = {
  VATSIM: {
    link: (id: string) => `https://stats.vatsim.net/stats/${id}`,
    shown: (id: string) => id,
  },
  IVAO: {
    link: (id: string) => `https://www.ivao.aero/Member.aspx?Id=${id}`,
    shown: (id: string) => id,
  },
  Instagram: {
    link: (name: string) => `https://www.instagram.com/${name}/`,
    shown: (name: string) => `@${name}`,
  },
  // A numeric profile id says nothing to a visitor: the chip then shows « Facebook » alone.
  Facebook: {
    link: (name: string) => `https://www.facebook.com/${name}`,
    shown: (name: string) => (/^\d+$/.test(name) ? "" : name),
  },
};
type Account = keyof typeof ACCOUNTS;

function Photo({ pilot }: { pilot: PublicPilot }) {
  return (
    <span className="grid size-26 flex-none place-items-center overflow-hidden rounded-full border-3 border-line bg-accent font-title text-[38px] text-on-accent max-md:size-20">
      {pilot.hasPhoto ? (
        // Plain img: served by the API through the site, already 256 px.
        <img src={pilotPhotoUrl(pilot.handle)} alt="" className="size-full object-cover" />
      ) : (
        pilot.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function Networks({ pilot }: { pilot: PublicPilot }) {
  const ids: Record<Account, string | null> = {
    VATSIM: pilot.vatsimId,
    IVAO: pilot.ivaoId,
    Instagram: pilot.instagram,
    Facebook: pilot.facebook,
  };
  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      {(Object.keys(ids) as Account[]).map((account) => {
        const id = ids[account];
        return id ? (
          <a
            key={account}
            href={ACCOUNTS[account].link(id)}
            rel="nofollow noopener noreferrer"
            target="_blank"
            className="rounded-full border border-line px-3 py-1 text-[13px] text-ink"
          >
            <b className="font-semibold text-muted">{account}</b> {ACCOUNTS[account].shown(id)}
          </a>
        ) : null;
      })}
    </div>
  );
}

/** Name, flag, level, then the facts line and the network links. */
function Identity({ pilot, country }: { pilot: PublicPilot; country: string | null }) {
  const t = useTranslations("Profile.header");
  const help = useTranslations("Profile.help");
  const levels = useTranslations("Profile.levels");
  const format = useFormatter();
  const memberSince = format.dateTime(new Date(pilot.memberSince), {
    month: "long",
    year: "numeric",
  });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-[2em]">{pilot.name}</h1>
        {pilot.country && country && <CountryFlag code={pilot.country} name={country} />}
        {pilot.fictitious && <FictitiousBadge />}
        {pilot.level && (
          <span className="rounded-full bg-accent/12 px-3 py-1 text-[13px] font-semibold text-link">
            {t("level", { level: levels(pilot.level) })}
            <InfoTip inline text={help("level")} label={help("label")} />
          </span>
        )}
      </div>
      <p className="m-0 mt-1.5 flex flex-wrap gap-x-4.5 gap-y-1.5 text-muted">
        {country && <span>{country}</span>}
        <span>{t("since", { date: memberSince })}</span>
        {pilot.stats.favoriteAircraft && (
          <span>{t("favorite", { name: pilot.stats.favoriteAircraft })}</span>
        )}
        {pilot.homeIcao && <span>{t("base", { icao: pilot.homeIcao })}</span>}
      </p>
      <Networks pilot={pilot} />
    </div>
  );
}

/** Distance flown, with its Earth-lap equivalent, and the share button. */
function DistanceAndShare({ pilot }: { pilot: PublicPilot }) {
  const t = useTranslations("Profile.header");
  const help = useTranslations("Profile.help");
  const format = useFormatter();
  const { distanceNm } = pilot.stats;
  return (
    <div className="flex flex-col items-end gap-2 max-md:flex-row max-md:items-center max-md:justify-between">
      <div className="relative pr-7 text-right max-md:text-left">
        <b className="block font-title text-[30px]">
          {t("distance", { nm: format.number(Math.round(distanceNm)) })}
        </b>
        <span className="text-[13px] text-muted">
          {t("laps", { laps: format.number(distanceNm / EARTH_NM, { maximumFractionDigits: 1 }) })}
        </span>
        <InfoTip text={help("distance")} label={help("label")} />
      </div>
      <ShareButton
        label={t("share")}
        copied={t("copied")}
        title={t("shareTitle", { name: pilot.name })}
      />
    </div>
  );
}

/** Head of a public profile (spec J4): photo, name, country, level, facts, networks, distance. */
export function ProfileHeader({ pilot }: { pilot: PublicPilot }) {
  const locale = useLocale();
  const country = pilot.country ? countryName(pilot.country, locale) : null;
  return (
    <section className="grid items-center gap-6 rounded-2xl border border-line bg-surface px-6 py-5 md:grid-cols-[auto_1fr_auto]">
      <Photo pilot={pilot} />
      <Identity pilot={pilot} country={country} />
      <DistanceAndShare pilot={pilot} />
    </section>
  );
}
