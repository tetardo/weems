import type { HomeTheme, SiteStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { BrandMark } from "../site/brand.tsx";
import { FlightsIcon, LiveIcon } from "../ui/icons.ts";
import { DeparturesBoard } from "./departures-board.tsx";
import type { HomeBackground } from "./home-image.ts";

/** The image of each theme; CSS shows the one of the current theme (no mismatch with the server). */
function Background({ backgrounds }: { backgrounds: Record<HomeTheme, HomeBackground> }) {
  const { light, dark } = backgrounds;
  const photo = "absolute inset-0 bg-cover";
  const style = ({ src, position }: HomeBackground) => ({
    backgroundImage: `url(${src})`,
    backgroundPosition: position,
  });
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="hero-sky absolute inset-0" />
      <div className={`${photo} light:hidden`} style={style(dark)} />
      <div className={`${photo} hidden light:block`} style={style(light)} />
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
  backgrounds: Record<HomeTheme, HomeBackground>;
}

/**
 * Home (spec J4 accueil): the image in a rounded card under the bar, the logo, slogan and calls to
 * action on the left, the board of the flights in the air on the right (below the text on a phone).
 */
export function HomeHero({ loggedIn, stats, apiUrl, backgrounds }: Props) {
  const t = useTranslations("Home");
  const site = useTranslations("Site");
  return (
    <section className="mx-3 mt-6 mb-10 sm:mx-6 xl:mx-auto xl:w-[1152px] max-md:mt-4 max-md:mb-6">
      <div className="relative overflow-hidden rounded-[28px] text-hero-ink shadow-floating max-md:rounded-[22px]">
        <Background backgrounds={backgrounds} />
        <div className="relative flex items-center gap-10 px-12 py-14 max-lg:flex-col max-lg:items-stretch max-md:gap-8 max-md:px-4 max-md:py-8">
          <div className="flex min-w-0 flex-1 flex-col gap-5 max-md:gap-3.5">
            <p className="flex items-center gap-3.5">
              <BrandMark size={44} />
              <span className="font-title text-3xl font-bold tracking-[.02em] max-md:text-xl">
                {site("name")}
              </span>
            </p>
            <h1 className="text-[56px] leading-[1.05] tracking-[-.02em] max-md:text-[34px]">
              {t("sloganTop")}
              <br />
              {t("sloganBottom")}
            </h1>
            <p className="max-w-[560px] text-[19px] text-hero-muted max-md:text-base">
              {t("lead")}
            </p>
            <Calls loggedIn={loggedIn} />
          </div>
          <div className="w-[420px] shrink-0 max-lg:w-full">
            <DeparturesBoard stats={stats} apiUrl={apiUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}
