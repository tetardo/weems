"use client";

import type { MyProfile } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { HandleField } from "./handle-field.tsx";

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
      <label className="relative inline-flex cursor-pointer items-center">
        <span className="sr-only">{t("switch")}</span>
        <input
          type="checkbox"
          name="isPublic"
          role="switch"
          checked={isPublic}
          onChange={(event) => setPublic(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6.5 w-11.5 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-link" />
        <span className="absolute top-0.75 left-0.75 size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
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
    </>
  );
}
