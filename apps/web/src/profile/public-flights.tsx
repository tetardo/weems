import type { PublicFlightList } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { FlightTable, PUBLIC_COLUMNS } from "../flights/flight-table.tsx";
import { Link } from "../i18n/navigation.ts";
import { CardBox } from "../ui/card-box.tsx";
import type { ProfileLinks } from "./profile-links.ts";

/** Flights of a public profile, newest first, 20 per page (spec J4): same table as « My flights ». */
export function PublicFlights({
  links,
  list,
  cursor,
}: {
  links: ProfileLinks;
  list: PublicFlightList;
  cursor: string | undefined;
}) {
  const t = useTranslations("Profile.flights");
  const base = links.page;
  if (list.flights.length === 0) {
    return (
      <CardBox>
        <p className="m-0 text-muted">{t("empty")}</p>
      </CardBox>
    );
  }
  return (
    <>
      <CardBox flush>
        <FlightTable flights={list.flights} columns={PUBLIC_COLUMNS} hrefOf={links.flight} />
      </CardBox>
      <nav className="mt-4 flex gap-4 text-sm">
        {cursor && (
          <Link href={base} className="text-link hover:underline">
            {t("first")}
          </Link>
        )}
        {list.nextCursor && (
          <Link
            href={{ pathname: base, query: { cursor: list.nextCursor } }}
            className="text-link hover:underline"
          >
            {t("next")}
          </Link>
        )}
      </nav>
    </>
  );
}
