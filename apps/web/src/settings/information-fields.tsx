"use client";

import { type MyProfile, PilotLevel } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { InputHTMLAttributes } from "react";
import { CountryFlag } from "../ui/country-flag.tsx";
import { Field, FieldBadge, FieldGrid, SearchSelect, Segmented, TextInput } from "@weems/ui";
import { AircraftIcon, type IconComponent, NetworkIcon, PrivateIcon } from "../ui/icons.ts";

type TextName = "homeIcao" | "vatsimId" | "ivaoId" | "instagram" | "facebook" | "simbriefId";

interface TextSpec {
  help: string;
  maxLength: number;
  icon?: IconComponent;
  prefix?: string;
  input?: InputHTMLAttributes<HTMLInputElement>;
}

/** Typed fields: limits of the contract (packages/contrats), help key in Settings.fields. */
const TEXT_FIELDS: Record<TextName, TextSpec> = {
  homeIcao: {
    help: "homeIcaoHelp",
    maxLength: 4,
    icon: AircraftIcon,
    input: { className: "font-mono uppercase tracking-wider", placeholder: "LFPG" },
  },
  vatsimId: {
    help: "vatsimHelp",
    maxLength: 8,
    icon: NetworkIcon,
    input: { inputMode: "numeric" },
  },
  ivaoId: { help: "ivaoHelp", maxLength: 7, icon: NetworkIcon, input: { inputMode: "numeric" } },
  // Room for a pasted profile link: the form keeps the account name only.
  instagram: { help: "instagramHelp", maxLength: 100, prefix: "instagram.com/" },
  facebook: { help: "facebookHelp", maxLength: 100, prefix: "facebook.com/" },
  simbriefId: { help: "simbriefHelp", maxLength: 32, icon: PrivateIcon },
};

function TextField({ name, profile }: { name: TextName; profile: MyProfile }) {
  const t = useTranslations("Settings.fields");
  const { help, maxLength, icon, prefix, input } = TEXT_FIELDS[name];
  const isPrivate = name === "simbriefId";
  return (
    <Field
      label={t(name)}
      htmlFor={name}
      help={t(help)}
      badge={isPrivate && <FieldBadge icon={PrivateIcon}>{t("private")}</FieldBadge>}
    >
      <TextInput
        id={name}
        name={name}
        defaultValue={profile[name] ?? ""}
        maxLength={maxLength}
        autoComplete="off"
        icon={icon}
        prefix={prefix}
        {...input}
      />
    </Field>
  );
}

/** Country, home airport and level, under the photo (spec J4, « Champs saisis par le pilote »). */
export function IdentityFields({
  profile,
  countries,
}: {
  profile: MyProfile;
  countries: readonly { code: string; name: string }[];
}) {
  const t = useTranslations("Settings.fields");
  const levels = useTranslations("Profile.levels");
  return (
    <FieldGrid>
      <Field label={t("country")} help={t("countryHelp")}>
        <SearchSelect
          name="country"
          label={t("country")}
          defaultValue={profile.country}
          none={t("none")}
          empty={t("noCountry")}
          options={countries.map(({ code, name }) => ({
            value: code,
            label: name,
            icon: <CountryFlag code={code} name={name} />,
          }))}
        />
      </Field>
      <TextField name="homeIcao" profile={profile} />
      <Field label={t("level")} help={t("levelHelp")} className="@xl:col-span-2">
        <Segmented
          name="level"
          label={t("level")}
          defaultValue={profile.level ?? ""}
          options={[
            { value: "", label: t("none") },
            ...PilotLevel.options.map((level) => ({ value: level, label: levels(level) })),
          ]}
        />
      </Field>
    </FieldGrid>
  );
}

/** Flight networks and social accounts, linked from the public page. */
export function NetworkFields({ profile }: { profile: MyProfile }) {
  return (
    <FieldGrid>
      <TextField name="vatsimId" profile={profile} />
      <TextField name="ivaoId" profile={profile} />
      <TextField name="instagram" profile={profile} />
      <TextField name="facebook" profile={profile} />
    </FieldGrid>
  );
}

/** What Weems keeps for itself and never shows. */
export function PrivateFields({ profile }: { profile: MyProfile }) {
  return (
    <FieldGrid>
      <TextField name="simbriefId" profile={profile} />
    </FieldGrid>
  );
}
