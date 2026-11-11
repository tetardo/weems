import { getTranslations } from "next-intl/server";
import { currentPilot } from "./server-session.ts";
import { SignOutButton } from "./sign-out-button.tsx";

/** Name of the logged-in pilot and the sign-out button, in the top bar. */
export async function PilotMenu() {
  const pilot = await currentPilot();
  if (!pilot) return null;
  const t = await getTranslations("Auth");
  return (
    <>
      <span className="flex max-w-56 items-center gap-2 px-2" title={pilot.name}>
        <span
          aria-hidden="true"
          className="grid size-7 flex-none place-items-center rounded-full bg-accent-2 text-xs font-bold text-on-accent"
        >
          {pilot.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate max-sm:hidden">{pilot.name}</span>
      </span>
      <SignOutButton label={t("signOut")} />
    </>
  );
}
