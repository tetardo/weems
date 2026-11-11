"use client";

import type { MyProfile } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useActionState } from "react";
import { Button } from "../ui/button.tsx";
import { CardBox } from "../ui/card-box.tsx";
import { InformationFields } from "./information-fields.tsx";
import { type SaveState, saveProfileAction } from "./profile-actions.ts";
import { PublicationFields } from "./publication-fields.tsx";

/** Message under the save button. */
function SaveMessage({ state }: { state: SaveState }) {
  const t = useTranslations("Settings.save");
  if (state.status === "idle") return null;
  const ok = state.status === "saved";
  const key = state.status === "invalid" ? `invalid.${state.field}` : state.status;
  return (
    <span
      role={ok ? "status" : "alert"}
      className={`text-sm ${ok ? "text-success" : "text-danger"}`}
    >
      {t(key)}
    </span>
  );
}

/**
 * Publication and information of the profile, saved together: the API takes the whole profile
 * at once (PUT /v1/me/profile). `photo`: the photo field, which saves on its own.
 */
export function ProfileForm({
  profile,
  countries,
  siteHost,
  photo,
}: {
  profile: MyProfile;
  countries: readonly { code: string; name: string }[];
  siteHost: string;
  photo: React.ReactNode;
}) {
  const t = useTranslations("Settings");
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProfileAction, {
    status: "idle",
  });
  // Called by hand rather than as <form action>: React resets a form after its action, which
  // would show the old values after a save and wipe what the pilot typed after a refusal.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <CardBox>
        <PublicationFields profile={profile} siteHost={siteHost} />
      </CardBox>
      <CardBox>
        <h2 className="mt-0 mb-2 text-[1.15em]">{t("information")}</h2>
        {photo}
        <InformationFields profile={profile} countries={countries} />
        <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
          <SaveMessage state={state} />
          <Button type="submit" disabled={pending}>
            {t("save.button")}
          </Button>
        </div>
      </CardBox>
    </form>
  );
}
