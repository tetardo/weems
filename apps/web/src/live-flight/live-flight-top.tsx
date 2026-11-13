import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { BackIcon, MapIcon } from "../ui/icons.ts";
import { CopyLinkButton } from "../ui/copy-link-button.tsx";
import { ShareButton } from "../ui/share-button.tsx";

/** Above the page: back to the pilot's profile; the flight on the live map, copy the link, share. */
export function LiveFlightTop({
  handle,
  name,
  flightId,
  callsign,
}: {
  handle: string;
  name: string;
  flightId: string;
  callsign: string;
}) {
  const t = useTranslations("LiveFlight");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Link
        href={`/pilots/${handle}`}
        className={`${buttonClass("ghost")} -ml-3 mr-auto text-link`}
      >
        <BackIcon size={20} aria-hidden="true" />
        {t("back", { name })}
      </Link>
      <Link href={`/live?flight=${flightId}`} className={buttonClass("outline")}>
        <MapIcon size={16} aria-hidden="true" />
        {t("liveMap")}
      </Link>
      <CopyLinkButton label={t("copyLink")} copied={t("copied")} />
      <ShareButton
        label={t("share")}
        copied={t("shareCopied")}
        title={t("shareTitle", { callsign })}
      />
    </div>
  );
}
