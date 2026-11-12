import type { SiteStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { BrandMark } from "../site/brand.tsx";
import { FlightsIcon, LiveIcon } from "../ui/icons.ts";
import { DeparturesBoard } from "./departures-board.tsx";
import { HOME_IMAGES } from "./home-image.ts";

/** The image of each theme; CSS shows the one of the current theme (no mismatch with the server). */
function Background() {
  const { light, dark } = HOME_IMAGES;
  const photo = "absolute inset-0 bg-cover bg-[70%_center] max-md:bg-[75%_center]";
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="hero-sky absolute inset-0" />
      {dark && (
        <div className={`${photo} light:hidden`} style={{ backgroundImage: `url(${dark})` }} />
      )}
      {light && (
        <div
          className={`${photo} hidden light:block`}
          style={{ backgroundImage: `url(${light})` }}
        />
      )}
      <div className="hero-veil absolute inset-0" />
    </div>
  );
}

function Calls({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("Home");
  const big = "min-h-[52px] rounded-[14px] px-5 text-base";
  return (
    <div className="flex flex-wrap gap-3">
      {loggedIn ? (
        <Link href="/flights" className={`${buttonClass("primary")} ${big}`}>
          <FlightsIcon size={20} aria-hidden="true" />
          {t("myFlights")}
        </Link>
      ) : (
        <Link href="/signup" className={`${buttonClass("primary")} ${big}`}>
          {t("signup")}
        </Link>
      )}
      <Link href="/live" className={`${buttonClass("ghost")} hero-glass ${big} text-hero-ink`}>
        <LiveIcon size={20} aria-hidden="true" />
        {t("seeLive")}
      </Link>
    </div>
  );
}

interface Props {
  loggedIn: boolean;
  stats: SiteStats | null;
  apiUrl: string;
}

/** Full-screen home (spec J4 accueil, piste F): logo, slogan, calls to action, departures board. */
export function HomeHero({ loggedIn, stats, apiUrl }: Props) {
  const t = useTranslations("Home");
  const site = useTranslations("Site");
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden text-hero-ink">
      <Background />
      <div className="relative mx-auto flex w-full max-w-[1152px] flex-1 flex-col px-6 pt-[18vh] pb-7 max-md:px-4 max-md:pt-24 max-md:pb-4">
        <div className="flex max-w-[620px] flex-col gap-5 max-md:gap-3.5">
          <p className="flex items-center gap-3.5">
            <BrandMark size={44} />
            <span className="font-title text-3xl font-bold tracking-[.02em] max-md:text-xl">
              {site("name")}
            </span>
          </p>
          <h1 className="text-[64px] leading-[1.05] tracking-[-.02em] max-md:text-[34px]">
            {t("sloganTop")}
            <br />
            {t("sloganBottom")}
          </h1>
          <p className="max-w-[560px] text-[19px] text-hero-muted max-md:text-base">{t("lead")}</p>
          <Calls loggedIn={loggedIn} />
        </div>
        <div className="mt-auto pt-10">
          <DeparturesBoard stats={stats} apiUrl={apiUrl} />
        </div>
      </div>
    </section>
  );
}
