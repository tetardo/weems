import { getMyPlanInfo } from "../api/plans-api.ts";
import { TestPlanChoice } from "./test-plan-choice.tsx";

/**
 * Place of the Free | Pro test switch (in the bar, and in the phone menu where the bar has no
 * room): shown when the API offers it (outside production), never an error for the page if the
 * API does not answer.
 */
export async function TestPlanSlot({ className }: { className: string }) {
  const info = await getMyPlanInfo().catch(() => null);
  if (!info?.testSwitch) return null;
  return (
    <div className={className}>
      <TestPlanChoice plan={info.plan} />
    </div>
  );
}
