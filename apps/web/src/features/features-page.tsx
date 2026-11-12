import type { FeatureGroup, PlanCatalog, PlanFeature } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { featureGroups } from "../plans/plan-display.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { GROUP_ICONS } from "./group-icons.ts";
import { FeatureRow } from "./feature-row.tsx";
import { FeaturesToc } from "./features-toc.tsx";

function GroupSection({
  catalog,
  group,
  features,
}: {
  catalog: PlanCatalog;
  group: FeatureGroup;
  features: PlanFeature[];
}) {
  const t = useTranslations();
  const Icon = GROUP_ICONS[group];
  return (
    <section id={group} aria-labelledby={`${group}-title`} className="mb-9 scroll-mt-24">
      <div className="mb-1.5 flex items-center gap-3">
        <span className="grid size-[38px] place-items-center rounded-box bg-link/12 text-link">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 id={`${group}-title`} className="m-0 text-[1.3em]">
          {t(`Plans.groups.${group}`)}
        </h2>
      </div>
      <p className="mt-0 mb-3.5 text-[14.5px] text-muted md:ml-[50px]">
        {t(`Features.groups.${group}`)}
      </p>
      <ul className="m-0 list-none rounded-panel border border-line bg-surface p-0">
        {features.map((feature) => (
          <FeatureRow key={feature.key} catalog={catalog} feature={feature} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Page /features: every function of the catalogue (GET /v1/plans), group by group, with what it
 * brings and the plan it starts in. Nothing is listed by hand: a function added to the catalogue
 * shows up here with its texts (Features.items.<key>), « Bientôt » until it is available.
 */
export function FeaturesPage({ catalog }: { catalog: PlanCatalog }) {
  const t = useTranslations("Features");
  const groups = featureGroups(catalog);
  return (
    <SectionMain>
      <div className="mx-auto mt-4 mb-7 max-w-3xl text-center">
        <h1 className="m-0 text-[2em]">{t("title")}</h1>
        <p className="mt-2 text-base text-muted">{t("lead")}</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[220px_1fr] md:gap-8">
        <FeaturesToc groups={groups.map(([group, features]) => [group, features.length])} />
        <div>
          {groups.map(([group, features]) => (
            <GroupSection key={group} catalog={catalog} group={group} features={features} />
          ))}
        </div>
      </div>
    </SectionMain>
  );
}
