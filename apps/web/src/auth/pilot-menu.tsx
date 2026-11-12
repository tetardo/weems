import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getMyProfile } from "../api/profile-api.ts";
import { AccountMenu } from "../site/account-menu.tsx";
import { ownPhotoSrc } from "../site/api-relay.ts";
import { currentPilot } from "./server-session.ts";
import { SignOutButton } from "./sign-out-button.tsx";

/** Address of the pilot's photo for the bar; null without photo or when the profile cannot be read. */
async function barPhoto(): Promise<string | null> {
  try {
    return ownPhotoSrc((await getMyProfile())?.photoUpdatedAt ?? null);
  } catch {
    // The photo is a detail of the bar: the initial stands in rather than an error page.
    return null;
  }
}

/** Menu of the logged-in pilot in the floating bar: `before` entries, then sign out. */
export async function PilotMenu({ before }: { before: ReactNode }) {
  const pilot = await currentPilot();
  if (!pilot) return null;
  const [t, photo] = await Promise.all([getTranslations("Auth"), barPhoto()]);
  return (
    <AccountMenu name={pilot.name} photo={photo}>
      {before}
      <SignOutButton label={t("signOut")} />
    </AccountMenu>
  );
}
