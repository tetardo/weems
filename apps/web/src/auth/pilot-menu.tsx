import { getTranslations } from "next-intl/server";
import { currentPilot } from "./server-session.ts";
import { SignOutButton } from "./sign-out-button.tsx";

/** Name of the logged-in pilot and the sign-out button; nothing on the login pages. */
export async function PilotMenu() {
  const pilot = await currentPilot();
  if (!pilot) return null;
  const t = await getTranslations("Auth");
  return (
    <div className="flex items-center gap-3">
      <span>{pilot.name}</span>
      <SignOutButton label={t("signOut")} />
    </div>
  );
}
