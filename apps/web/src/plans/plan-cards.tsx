"use client";

import type { PlanCatalog, PlanId } from "@weems/contrats";
import { Segmented } from "@weems/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PlanCard } from "./plan-card.tsx";
import type { Billing } from "./plan-price.tsx";

/** The four cards and the monthly / yearly choice that sets which price is shown big. */
export function PlanCards({ catalog, current }: { catalog: PlanCatalog; current: PlanId | null }) {
  const t = useTranslations("Plans.billing");
  const [billing, setBilling] = useState<Billing>("monthly");
  return (
    <>
      <div className="mx-auto mb-6 w-fit">
        <Segmented
          name="billing"
          label={t("label")}
          value={billing}
          onChange={(value) => setBilling(value === "yearly" ? "yearly" : "monthly")}
          options={[
            { value: "monthly", label: t("monthly") },
            { value: "yearly", label: `${t("yearly")} · ${t("yearlyBonus")}` },
          ]}
        />
      </div>
      <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
        {catalog.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            catalog={catalog}
            plan={plan}
            current={current}
            billing={billing}
          />
        ))}
      </div>
    </>
  );
}
