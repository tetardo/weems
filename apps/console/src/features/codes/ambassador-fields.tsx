"use client";

import { Field, FormField, INPUT_CLASS } from "@weems/ui";
import { useId } from "react";
import { NumberField } from "../../ui/number-field.tsx";
import { type AmbassadorDraft, LINK_KINDS } from "./ambassador-draft.ts";

type Change = (patch: Partial<AmbassadorDraft>) => void;

interface FieldsProps {
  draft: AmbassadorDraft;
  isNew: boolean;
  onChange: Change;
}

const LINK_LABELS = { twitch: "Twitch", youtube: "YouTube", website: "Site" } as const;

function LongText(props: {
  label: string;
  value: string;
  max: number;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Field label={props.label} htmlFor={id} help={`${props.value.length} / ${props.max}`}>
      <textarea
        id={id}
        rows={3}
        maxLength={props.max}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={`${INPUT_CLASS} min-h-20`}
      />
    </Field>
  );
}

/** Address of the page, name and tagline. */
function IdentityFields({ draft, isNew, onChange }: FieldsProps) {
  return (
    <>
      <FormField
        label="Adresse de la page (/ambassadors/…)"
        value={draft.slug}
        disabled={!isNew}
        maxLength={30}
        onChange={(e) => onChange({ slug: e.target.value })}
      />
      <FormField
        label="Nom affiché"
        maxLength={40}
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <FormField
        label="Accroche"
        maxLength={140}
        value={draft.tagline}
        onChange={(e) => onChange({ tagline: e.target.value })}
      />
    </>
  );
}

/** Twitch, YouTube, website, and the pilot profile shown with the page. */
function LinkFields({ draft, onChange }: FieldsProps) {
  return (
    <>
      {LINK_KINDS.map((kind) => (
        <FormField
          key={kind}
          label={`${LINK_LABELS[kind]} (facultatif)`}
          type="url"
          required={false}
          placeholder="https://"
          value={draft.links[kind]}
          onChange={(e) => onChange({ links: { ...draft.links, [kind]: e.target.value } })}
        />
      ))}
      <FormField
        label="Profil de pilote lié (facultatif, profil public)"
        required={false}
        value={draft.pilotHandle}
        onChange={(e) => onChange({ pilotHandle: e.target.value })}
      />
    </>
  );
}

const TEXTS = [
  ["bioFr", "Présentation (français)", 800, true],
  ["bioEn", "Présentation (anglais)", 800, true],
  ["quoteFr", "Citation (français, facultative)", 200, false],
  ["quoteEn", "Citation (anglais, facultative)", 200, false],
] as const;

/** Who the ambassador is: page address, name, presentation in both languages, links. */
export function PresentationFields(props: FieldsProps) {
  const { draft, onChange } = props;
  return (
    <fieldset className="oc-group">
      <legend>Présentation</legend>
      <IdentityFields {...props} />
      {TEXTS.map(([key, label, max, required]) => (
        <LongText
          key={key}
          label={label}
          max={max}
          required={required}
          value={draft[key]}
          onChange={(value) => onChange({ [key]: value })}
        />
      ))}
      <LinkFields {...props} />
    </fieldset>
  );
}

/** The shared code: months offered, places, end date, page on or off. */
export function OfferFields({ draft, onChange }: { draft: AmbassadorDraft; onChange: Change }) {
  return (
    <fieldset className="oc-group">
      <legend>Offre (code partagé)</legend>
      <FormField
        label="Code (ex. CAPTAINSIM)"
        maxLength={20}
        value={draft.code}
        className={`${INPUT_CLASS} mono`}
        onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
      />
      <NumberField
        label="Pilot Pro offert"
        unit="mois"
        min={1}
        max={24}
        value={draft.months}
        onChange={(months) => onChange({ months })}
      />
      <NumberField
        label="Places"
        unit="pilotes"
        min={1}
        max={10000}
        value={draft.places}
        onChange={(places) => onChange({ places })}
      />
      <FormField
        label="Valable jusqu'au"
        type="date"
        value={draft.expiresOn}
        onChange={(e) => onChange({ expiresOn: e.target.value })}
      />
      <label className="oc-check">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => onChange({ active: e.target.checked })}
        />
        Page en ligne et code utilisable
      </label>
    </fieldset>
  );
}
