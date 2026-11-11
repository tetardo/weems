import { mdiAccountCircle } from "@mdi/js";
import { getTranslations } from "next-intl/server";
import { Icon } from "../ui/icon.tsx";
import { currentPilot } from "./server-session.ts";
import { SignOutButton } from "./sign-out-button.tsx";

/** Name of the logged-in pilot and the sign-out button, in the top bar. */
export async function PilotMenu() {
  const pilot = await currentPilot();
  if (!pilot) return null;
  const t = await getTranslations("Auth");
  return (
    <>
      <span className="flex items-center gap-2 px-3" title={pilot.name}>
        <Icon path={mdiAccountCircle} size={22} />
        <span className="hidden sm:inline">{pilot.name}</span>
      </span>
      <SignOutButton label={t("signOut")} />
    </>
  );
}
