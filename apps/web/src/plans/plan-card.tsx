import type { PlanCatalog, PlanId, PlanOffer } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { AccountIcon, AddedIcon, CompanyIcon, DoneIcon } from "../ui/icons.ts";
import { FeatureText } from "./feature-text.tsx";
import { PlanAction } from "./plan-action.tsx";
import { PlanBanner } from "./plan-banner.tsx";
import { cardLines } from "./plan-display.ts";
import { type Billing, PlanPrice } from "./plan-price.tsx";

/** Shared rows of the four cards (CSS subgrid): prices, buttons and lists line up. */
const ROWS = "row-span-6 grid grid-rows-subgrid gap-0";

function Ribbon({ plan, current }: { plan: PlanOffer; current: PlanId | null }) {
  const t = useTranslations("Plans");
  if (plan.recommended && plan.id !== current) {
    return (
      <span className="absolute -top-2.5 left-5 rounded-tag bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
        {t("recommended")}
      </span>
    );
  }
  if (plan.id !== current) return null;
  return (
    <span className="absolute -top-2.5 left-5 rounded-tag border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
      {t("current")}
    </span>
  );
}

function Heading({ plan }: { plan: PlanOffer }) {
  const t = useTranslations("Plans");
  const pilot = plan.audience === "pilot";
  const Icon = pilot ? AccountIcon : CompanyIcon;
  return (
    <div className="px-5 pt-4">
      <p
        className={`m-0 flex items-center gap-1.5 text-xs tracking-wider uppercase ${pilot ? "text-muted" : "text-accent-2"}`}
      >
        <Icon size={15} aria-hidden="true" />
        {t(`audience.${plan.audience}`)}
      </p>
      <h2 className="m-0 mt-1 text-[1.3em]">{t(`names.${plan.id}`)}</h2>
    </div>
  );
}

function Includes({ plan }: { plan: PlanOffer }) {
  const t = useTranslations("Plans");
  if (!plan.includes) return null;
  const kind = plan.id === "company" ? "company" : plan.id === "holding" ? "holding" : "pilot";
  return (
    <li className="flex gap-2 font-semibold">
      <AddedIcon size={16} className="mt-0.5 flex-none text-link" aria-hidden="true" />
      {t(`includes.${kind}`, { plan: t(`names.${plan.includes}`) })}
    </li>
  );
}

interface CardProps {
  catalog: PlanCatalog;
  plan: PlanOffer;
  current: PlanId | null;
  billing: Billing;
}

/** One plan of the page Offres: banner, audience and name, price, text, button, what it adds. */
export function PlanCard({ catalog, plan, current, billing }: CardProps) {
  const t = useTranslations("Plans");
  const outline = plan.recommended
    ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]"
    : "border-line";
  return (
    <article className={`relative ${ROWS} rounded-panel border bg-surface ${outline}`}>
      <div className="overflow-hidden rounded-t-[calc(var(--radius-panel)-1px)]">
        <PlanBanner plan={plan.id} />
      </div>
      <Ribbon plan={plan} current={current} />
      <Heading plan={plan} />
      <PlanPrice plan={plan} billing={billing} />
      <p className="m-0 px-5 pt-2 pb-4 text-sm text-muted">{t(`descriptions.${plan.id}`)}</p>
      <div className="px-5">
        <PlanAction plan={plan} current={current} />
      </div>
      <ul className="m-5 mt-4 grid list-none content-start gap-2.5 border-t border-line p-0 pt-4 text-sm">
        <Includes plan={plan} />
        {cardLines(catalog, plan).map((line) => (
          <li key={line.key} className="flex gap-2">
            <DoneIcon size={16} className="mt-0.5 flex-none text-success" aria-hidden="true" />
            <span>
              <FeatureText feature={line.key} value={line.value} />
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
