import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { CardBox } from "../ui/card-box.tsx";
import { ForwardIcon, type IconComponent, ListIcon, PlansIcon } from "../ui/icons.ts";

/**
 * Where to go after the page: every feature in detail, and the plans. Until the page
 * Fonctionnalités exists, « every feature » opens the comparison table of the plans.
 */
const NEXT: readonly { key: "features" | "plans"; href: string; icon: IconComponent }[] = [
  { key: "features", href: "/plans/compare", icon: ListIcon },
  { key: "plans", href: "/plans", icon: PlansIcon },
];

export function DiscoverNext() {
  const t = useTranslations("Discover.next");
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      {NEXT.map(({ key, href, icon: Icon }) => (
        <CardBox key={key} className="flex flex-col gap-1.5">
          <p className="m-0 flex items-center gap-2 text-xs font-semibold tracking-[.08em] text-link uppercase">
            <Icon size={16} aria-hidden="true" />
            {t(`${key}.eyebrow`)}
          </p>
          <h2 className="m-0 text-lg">{t(`${key}.title`)}</h2>
          <p className="m-0 text-sm text-muted">{t(`${key}.text`)}</p>
          <Link
            href={href}
            className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-link"
          >
            {t(`${key}.link`)}
            <ForwardIcon size={16} aria-hidden="true" />
          </Link>
        </CardBox>
      ))}
    </div>
  );
}
