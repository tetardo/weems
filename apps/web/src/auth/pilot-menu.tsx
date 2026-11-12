import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AccountMenu } from "../site/account-menu.tsx";
import { currentPilot } from "./server-session.ts";
import { SignOutButton } from "./sign-out-button.tsx";

/** Menu of the logged-in pilot in the floating bar: `before` entries, then sign out. */
export async function PilotMenu({ before }: { before: ReactNode }) {
  const pilot = await currentPilot();
  if (!pilot) return null;
  const t = await getTranslations("Auth");
  return (
    <AccountMenu name={pilot.name}>
      {before}
      <SignOutButton label={t("signOut")} />
    </AccountMenu>
  );
}
