import { type MyProfile, PilotLevel } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { INPUT_CLASS } from "../ui/input-class.ts";

/** A labelled field of the settings, with its help line. */
function Field({
  label,
  help,
  warn = false,
  children,
}: {
  label: string;
  help?: string;
  warn?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="mt-3.5 flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      {children}
      {help && (
        <span className={`text-[.9em] ${warn ? "text-accent-2" : "text-muted"}`}>{help}</span>
      )}
    </label>
  );
}

/** A list with « not specified » first. */
function Choice({
  name,
  value,
  options,
  none,
}: {
  name: string;
  value: string | null;
  options: readonly { value: string; label: string }[];
  none: string;
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className={INPUT_CLASS}>
      <option value="">{none}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type TextName = "homeIcao" | "vatsimId" | "ivaoId" | "simbriefId";

/** Typed fields: limits of the contract (packages/contrats), help key in Settings.fields. */
const TEXT_FIELDS: Record<
  TextName,
  { help: string; maxLength: number; extra?: object; warn?: true }
> = {
  homeIcao: {
    help: "homeIcaoHelp",
    maxLength: 4,
    extra: { className: `${INPUT_CLASS} uppercase` },
  },
  vatsimId: { help: "vatsimHelp", maxLength: 8, extra: { inputMode: "numeric" } },
  ivaoId: { help: "ivaoHelp", maxLength: 7, extra: { inputMode: "numeric" } },
  simbriefId: { help: "simbriefHelp", maxLength: 32, warn: true },
};

function TextField({ name, profile }: { name: TextName; profile: MyProfile }) {
  const t = useTranslations("Settings.fields");
  const { help, maxLength, extra, warn = false } = TEXT_FIELDS[name];
  return (
    <Field label={t(name)} help={t(help)} warn={warn}>
      <input
        name={name}
        defaultValue={profile[name] ?? ""}
        maxLength={maxLength}
        className={INPUT_CLASS}
        {...extra}
      />
    </Field>
  );
}

/** Country, home airport, level and network ids (spec J4, « Champs saisis par le pilote »). */
export function InformationFields({
  profile,
  countries,
}: {
  profile: MyProfile;
  countries: readonly { code: string; name: string }[];
}) {
  const t = useTranslations("Settings.fields");
  const levels = useTranslations("Profile.levels");
  return (
    <div className="grid gap-x-4 sm:grid-cols-2">
      <Field label={t("country")}>
        <Choice
          name="country"
          value={profile.country}
          none={t("none")}
          options={countries.map(({ code, name }) => ({ value: code, label: name }))}
        />
      </Field>
      <TextField name="homeIcao" profile={profile} />
      <Field label={t("level")} help={t("levelHelp")}>
        <Choice
          name="level"
          value={profile.level}
          none={t("none")}
          options={PilotLevel.options.map((level) => ({ value: level, label: levels(level) }))}
        />
      </Field>
      <div />
      <TextField name="vatsimId" profile={profile} />
      <TextField name="ivaoId" profile={profile} />
      <TextField name="simbriefId" profile={profile} />
    </div>
  );
}
