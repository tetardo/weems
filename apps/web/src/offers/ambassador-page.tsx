import type { PublicAmbassador } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { publicProfileLinks } from "../profile/profile-links.ts";
import { ambassadorPhotoUrl, pilotPhotoUrl } from "../site/api-relay.ts";
import { ExternalIcon, GiftIcon } from "../ui/icons.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";
import { SectionMain } from "../ui/section-main.tsx";

/** Own photo first, then the photo of the linked pilot profile, then the initial. */
function Avatar({ ambassador }: { ambassador: PublicAmbassador }) {
  const { hasPhoto, pilotHandle, pilotHasPhoto, slug, name } = ambassador;
  const src = hasPhoto
    ? ambassadorPhotoUrl(slug)
    : pilotHandle && pilotHasPhoto
      ? pilotPhotoUrl(pilotHandle)
      : "";
  return (
    <PilotAvatar
      pilot={{ name, hasPhoto: src !== "" }}
      src={src}
      className="size-28 text-[44px] ring-4 ring-founder/45 max-sm:size-20 max-sm:text-[32px]"
    />
  );
}

/** Photo, name, tagline, presentation in the visitor's language, quote, links. */
function Presentation({ ambassador }: { ambassador: PublicAmbassador }) {
  const t = useTranslations("Offers.ambassador");
  const fr = useLocale() === "fr";
  const quote = fr ? ambassador.quoteFr : ambassador.quoteEn;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-5">
        <Avatar ambassador={ambassador} />
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold tracking-wider text-founder uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="m-0 mt-1 text-[2em]">{ambassador.name}</h1>
          <p className="m-0 text-muted">{ambassador.tagline}</p>
        </div>
      </div>
      <p className="mt-5 whitespace-pre-line">{fr ? ambassador.bioFr : ambassador.bioEn}</p>
      {quote && (
        <blockquote className="m-0 mt-4 border-l-2 border-founder pl-4 text-muted italic">
          « {quote} »
        </blockquote>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {ambassador.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener"
            className={buttonClass("outline")}
          >
            <ExternalIcon size={16} aria-hidden="true" />
            {t(`links.${link.kind}`)}
          </a>
        ))}
        {ambassador.pilotHandle && (
          <Link
            href={publicProfileLinks(ambassador.pilotHandle).page}
            className={buttonClass("outline")}
          >
            {t("profile")}
          </Link>
        )}
      </div>
    </div>
  );
}

/** The offer: months of Pilot Pro, the code, places left, the way to use it. */
function OfferCard({ ambassador, loggedIn }: { ambassador: PublicAmbassador; loggedIn: boolean }) {
  const t = useTranslations("Offers.ambassador");
  const format = useFormatter();
  const locale = useLocale();
  const { offer } = ambassador;
  const query = `?code=${encodeURIComponent(offer.code)}`;
  return (
    <aside className="grid content-start gap-4 rounded-panel border border-founder/45 bg-surface p-6">
      <p className="m-0 flex items-center gap-2 font-semibold text-founder">
        <GiftIcon size={18} aria-hidden="true" />
        {t("offer", { months: offer.months })}
      </p>
      <p className="m-0 rounded-control border border-dashed border-founder/60 py-3 text-center font-mono text-[1.6em] font-bold tracking-widest">
        {offer.code}
      </p>
      {offer.open ? (
        <>
          <p className="m-0 text-sm text-muted">
            {t("placesLeft", { count: offer.placesLeft })} ·{" "}
            {t("until", {
              date: format.dateTime(new Date(offer.expiresAt), { dateStyle: "long" }),
            })}
          </p>
          <Link
            href={`${loggedIn ? "/code" : "/signup"}${query}`}
            className={buttonClass("primary")}
          >
            {loggedIn ? t("use") : t("signup")}
          </Link>
          {!loggedIn && (
            <Link
              href={`/login?next=${encodeURIComponent(`/${locale}/code${query}`)}`}
              className="text-center text-sm font-semibold text-link"
            >
              {t("already")}
            </Link>
          )}
        </>
      ) : (
        <p className="m-0 text-sm text-muted">{t("closed")}</p>
      )}
      <p className="m-0 text-xs text-muted">{t("note")}</p>
    </aside>
  );
}

/** Page /ambassadors/{slug} (spec offre fondateurs): a streamer or club presents its offer code. */
export function AmbassadorPage({
  ambassador,
  loggedIn,
}: {
  ambassador: PublicAmbassador;
  loggedIn: boolean;
}) {
  return (
    <SectionMain>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_minmax(280px,360px)]">
        <Presentation ambassador={ambassador} />
        <OfferCard ambassador={ambassador} loggedIn={loggedIn} />
      </div>
    </SectionMain>
  );
}
