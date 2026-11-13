import type { MyFounder, PlanCatalog, PlanId, PublicFounders } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation.ts";
import { FoundersBanner } from "../offers/founders-banner.tsx";
import { BackIcon, ForwardIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { CompareTable } from "./compare-table.tsx";
import { PlanCards } from "./plan-cards.tsx";
import { PlansReassurance } from "./plans-reassurance.tsx";

function Intro({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mx-auto mb-6 max-w-2xl text-center">
      <h1 className="m-0 text-[2em]">{title}</h1>
      <p className="mt-2 text-base text-muted">{lead}</p>
    </div>
  );
}

function PageLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="mt-6 flex justify-center">
      <Link href={href} className="inline-flex items-center gap-2 font-semibold text-link">
        {children}
      </Link>
    </p>
  );
}

interface PlansPageProps {
  catalog: PlanCatalog;
  current: PlanId | null;
  /** Founder offer (spec offre fondateurs): null when the API does not tell it. */
  founders: PublicFounders | null;
  mine: MyFounder | null;
}

/**
 * Page /plans: the founder offer, the four cards (catalogue of GET /v1/plans), link to the
 * comparison table.
 */
export function PlansPage({ catalog, current, founders, mine }: PlansPageProps) {
  const t = useTranslations("Plans");
  return (
    <SectionMain>
      <Intro title={t("title")} lead={t("lead")} />
      {founders && <FoundersBanner founders={founders} mine={mine} />}
      <PlanCards catalog={catalog} current={current} />
      <PageLink href="/plans/compare">
        {t("compareLink")}
        <ForwardIcon size={18} aria-hidden="true" />
      </PageLink>
      <PlansReassurance fairUse={catalog.fairUseActivePilots} />
    </SectionMain>
  );
}

/** Page /plans/compare: every feature of every plan. */
export function ComparePage({ catalog }: { catalog: PlanCatalog }) {
  const t = useTranslations("Plans");
  return (
    <SectionMain>
      <Intro title={t("compare.title")} lead={t("compare.lead")} />
      <CompareTable catalog={catalog} />
      <PageLink href="/plans">
        <BackIcon size={18} aria-hidden="true" />
        {t("compare.back")}
      </PageLink>
      <p className="mt-3 text-center text-sm text-muted">
        {t("fairUse", { count: catalog.fairUseActivePilots })}
      </p>
    </SectionMain>
  );
}
