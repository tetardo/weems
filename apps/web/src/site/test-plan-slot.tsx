import { getTranslations } from "next-intl/server";
import { getMyPlanInfo } from "../api/plans-api.ts";
import { TestPlanChoice } from "./test-plan-choice.tsx";

/**
 * Place of the Free | Pro test switch, in the pilot's menu (bar A, 13/11): shown when the API offers
 * it (outside production), never an error for the page if the API does not answer.
 */
export async function TestPlanSlot({
  className,
  labelled,
}: {
  className: string;
  labelled?: boolean;
}) {
  const info = await getMyPlanInfo().catch(() => null);
  if (!info?.testSwitch) return null;
  const t = await getTranslations("Site");
  return (
    <div className={className}>
      {labelled && <span className="text-sm whitespace-nowrap text-muted">{t("testPlan")}</span>}
      <TestPlanChoice plan={info.plan} />
    </div>
  );
}
