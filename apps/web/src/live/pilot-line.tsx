import type { LivePilot } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { countryName } from "../format/countries.ts";
import { PrivateIcon, AccountIcon } from "../ui/icons.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";

/**
 * Who flies: name, address and country when the profile is public, else an anonymous pilot
 * (spec J4, carte en direct: nothing tells who a private pilot is).
 */
export function PilotLine({ pilot }: { pilot: LivePilot | null }) {
  const t = useTranslations("Live.pilot");
  const locale = useLocale();
  if (!pilot) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid size-9.5 flex-none place-items-center rounded-full bg-line text-muted">
          <AccountIcon size={18} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="font-semibold">{t("anonymous")}</div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted">
            <PrivateIcon size={13} aria-hidden="true" />
            {t("private")}
          </div>
        </div>
      </div>
    );
  }
  const country = pilot.country ? ` · ${countryName(pilot.country, locale)}` : "";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PilotAvatar
        pilot={pilot}
        src={pilotPhotoUrl(pilot.handle)}
        className="size-9.5 text-[15px]"
      />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold">{pilot.name}</div>
        <div className="truncate text-[13px] text-muted">
          @{pilot.handle}
          {country}
        </div>
      </div>
    </div>
  );
}
