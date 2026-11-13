"use client";

import type { MyProfile } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { HandleField } from "./handle-field.tsx";
import { SwitchInput } from "./switch-input.tsx";

/** The switch that turns the page on, with the date it went online. */
function PublicationSwitch({
  profile,
  isPublic,
  setPublic,
}: {
  profile: MyProfile;
  isPublic: boolean;
  setPublic: (isPublic: boolean) => void;
}) {
  const t = useTranslations("Settings.publication");
  const format = useFormatter();
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="m-0 font-semibold">{t("page")}</p>
        <p className="m-0 text-[.9em] text-muted">
          {profile.isPublic && profile.publishedAt
            ? t("since", {
                date: format.dateTime(new Date(profile.publishedAt), {
                  dateStyle: "short",
                  timeStyle: "short",
                }),
              })
            : t("off")}
        </p>
      </div>
      <SwitchInput
        name="isPublic"
        label={t("switch")}
        checked={isPublic}
        onChange={(event) => setPublic(event.target.checked)}
      />
    </div>
  );
}

/**
 * « Montrer mes vols en cours » (Greg, 13/11/2026): a flight in progress has its public page,
 * followed live (spec vol en cours); off, it is only on the live map until it is closed.
 */
function LiveFlightsSwitch({ profile }: { profile: MyProfile }) {
  const t = useTranslations("Settings.publication");
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="m-0 font-semibold">{t("liveFlights")}</p>
        <p className="m-0 text-[.9em] text-muted">{t("liveFlightsAbout")}</p>
      </div>
      <SwitchInput
        name="showLiveFlights"
        label={t("liveFlights")}
        defaultChecked={profile.showLiveFlights}
      />
    </div>
  );
}

/** Switch, address and consent: what makes the profile public (spec J4, RGPD). */
export function PublicationFields({ profile, siteHost }: { profile: MyProfile; siteHost: string }) {
  const t = useTranslations("Settings.publication");
  const [isPublic, setPublic] = useState(profile.isPublic);
  return (
    <>
      <PublicationSwitch profile={profile} isPublic={isPublic} setPublic={setPublic} />
      <HandleField
        initial={profile.handle ?? profile.suggestedHandle}
        siteHost={siteHost}
        saved={profile}
        switchChanged={isPublic !== profile.isPublic}
      />
      {isPublic && (
        <label className="flex items-start gap-2.5 rounded-box bg-accent/12 px-3.5 py-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            defaultChecked={profile.isPublic}
            className="mt-0.5 size-4.5 flex-none accent-accent"
          />
          <span>{t("consent")}</span>
        </label>
      )}
      {isPublic && <LiveFlightsSwitch profile={profile} />}
    </>
  );
}
