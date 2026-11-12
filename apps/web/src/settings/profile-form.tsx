"use client";

import type { MyProfile } from "@weems/contrats";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormSection, SaveBar, useFormChanges } from "@weems/ui";
import { PrivateIcon } from "../ui/icons.ts";
import { HandleChangeDialog } from "./handle-change-dialog.tsx";
import { IdentityFields, NetworkFields, PrivateFields } from "./information-fields.tsx";
import { type SaveState, saveProfileAction } from "./profile-actions.ts";
import { changesPublishedHandle } from "./profile-form-data.ts";
import { PublicationFields } from "./publication-fields.tsx";

/** Result of the last save, next to the save button. */
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
 * Save of the whole form, through a confirmation when it moves a page that is online to another
 * address. Called by hand rather than as <form action>: React resets a form after its action,
 * which would show the old values after a save and wipe what the pilot typed after a refusal.
 */
function useProfileSave(profile: MyProfile) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProfileAction, {
    status: "idle",
  });
  const [confirming, setConfirming] = useState<FormData | null>(null);
  const send = (data: FormData) => startTransition(() => action(data));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (changesPublishedHandle(profile, data)) setConfirming(data);
    else send(data);
  }
  const confirmation = confirming && {
    to: String(confirming.get("handle")).trim().toLowerCase(),
    cancel: () => setConfirming(null),
    confirm: () => {
      setConfirming(null);
      send(confirming);
    },
  };
  return { state, pending, submit, confirmation };
}

/** Changes not saved yet; the saved values become the reference after each successful save. */
function useUnsaved(form: React.RefObject<HTMLFormElement | null>, state: SaveState) {
  const t = useTranslations("Settings.save");
  const { changes, markSaved } = useFormChanges(form);
  useEffect(() => {
    if (state.status === "saved") markSaved();
  }, [state, markSaved]);
  return changes > 0 ? t("unsaved", { count: changes }) : null;
}

/** The four cards of the form: identity, networks, what stays private, then publication. */
function ProfileSections({
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
  const t = useTranslations("Settings.sections");
  return (
    <>
      <FormSection title={t("identity.title")} about={t("identity.about")}>
        {photo}
        <IdentityFields profile={profile} countries={countries} />
      </FormSection>
      <FormSection title={t("networks.title")} about={t("networks.about")}>
        <NetworkFields profile={profile} />
      </FormSection>
      <FormSection title={t("private.title")} about={t("private.about")} icon={PrivateIcon} dashed>
        <PrivateFields profile={profile} />
      </FormSection>
      <FormSection title={t("publication.title")} about={t("publication.about")}>
        <PublicationFields profile={profile} siteHost={siteHost} />
      </FormSection>
    </>
  );
}

/**
 * Publication and information of the profile, saved together: the API takes the whole profile
 * at once (PUT /v1/me/profile). One card per subject, one save bar (model C, fiche 008).
 * `photo`: the photo field, which saves on its own.
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
  const form = useRef<HTMLFormElement>(null);
  const { state, pending, submit, confirmation } = useProfileSave(profile);
  const unsaved = useUnsaved(form, state);
  return (
    <form ref={form} onSubmit={submit} className="flex flex-col gap-4">
      <ProfileSections profile={profile} countries={countries} siteHost={siteHost} photo={photo} />
      <SaveBar
        unsaved={unsaved}
        message={<SaveMessage state={state} />}
        label={t("save.button")}
        pending={pending}
      />
      {confirmation && (
        <HandleChangeDialog
          from={profile.handle ?? ""}
          to={confirmation.to}
          onCancel={confirmation.cancel}
          onConfirm={confirmation.confirm}
        />
      )}
    </form>
  );
}
