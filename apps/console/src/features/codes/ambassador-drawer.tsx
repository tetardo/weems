"use client";

import { AMBASSADOR_PHOTO_MAX_BYTES, type AdminAmbassador } from "@weems/contrats";
import { useState } from "react";
import { saveAmbassador } from "../../actions/offers.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { CloseIcon } from "../../ui/icons.ts";
import { type AmbassadorDraft, draftOf, emptyDraft, readDraft } from "./ambassador-draft.ts";
import { OfferFields, PresentationFields } from "./ambassador-fields.tsx";

/** Photo of the streamer or club (resized to 256 px WebP by the API), with written consent. */
function PhotoField(props: { has: boolean; onFile: (file: File | null) => void }) {
  return (
    <fieldset className="oc-group">
      <legend>Photo</legend>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => props.onFile(e.target.files?.[0] ?? null)}
      />
      <p className="muted">
        {props.has
          ? "Une photo est en ligne : en choisir une autre la remplace."
          : "Sans photo : celle du profil de pilote lié, sinon l'initiale."}{" "}
        JPEG, PNG ou WebP, 5 Mo au plus.
      </p>
    </fieldset>
  );
}

function Head({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="hd">
      <h2>{title}</h2>
      <button type="button" className="iconbtn" aria-label="Fermer" onClick={onClose}>
        <CloseIcon size={18} />
      </button>
    </div>
  );
}

function Foot({ disabled, onClose }: { disabled: boolean; onClose: () => void }) {
  return (
    <div className="ft">
      <button type="button" className="btn ghost" onClick={onClose}>
        Annuler
      </button>
      <button className="btn" type="submit" disabled={disabled}>
        Enregistrer
      </button>
    </div>
  );
}

/** Checks the form, then sends it (with the photo) through the server action. */
function useSave(onDone: () => Promise<void>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(draft: AmbassadorDraft, photo: File | null) {
    const read = readDraft(draft);
    if (!read.ok) return setError(read.error);
    if (photo && photo.size > AMBASSADOR_PHOTO_MAX_BYTES) return setError("Photo : 5 Mo au plus.");
    const form = new FormData();
    form.set("slug", read.slug);
    form.set("settings", JSON.stringify(read.settings));
    if (photo) form.set("photo", photo);
    setBusy(true);
    const result = await saveAmbassador(form);
    setBusy(false);
    if (result.ok) await onDone();
    else setError(result.error);
  }
  return { error, busy, save };
}

interface Props {
  ambassador: AdminAmbassador | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

/** « Nouvel ambassadeur » or the card of one: presentation, photo, shared code (spec offre fondateurs). */
export function AmbassadorDrawer({ ambassador, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<AmbassadorDraft>(() =>
    ambassador ? draftOf(ambassador) : emptyDraft(Date.now()),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [consent, setConsent] = useState(ambassador !== null);
  const { error, busy, save } = useSave(async () => {
    await onSaved();
    onClose();
  });
  const change = (patch: Partial<AmbassadorDraft>) => setDraft((old) => ({ ...old, ...patch }));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    void save(draft, photo);
  }
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <form className="drawer oc-drawer" onSubmit={submit} aria-label="Ambassadeur">
        <Head title={ambassador ? ambassador.name : "Nouvel ambassadeur"} onClose={onClose} />
        <div className="bd">
          <PresentationFields draft={draft} isNew={ambassador === null} onChange={change} />
          <PhotoField has={ambassador?.hasPhoto ?? false} onFile={setPhoto} />
          <OfferFields draft={draft} onChange={change} />
          <label className="oc-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            J&apos;ai l&apos;accord écrit de cette personne pour publier son nom, sa photo et sa
            présentation.
          </label>
          <ErrorBox message={error} />
        </div>
        <Foot disabled={busy || !consent} onClose={onClose} />
      </form>
    </>
  );
}
