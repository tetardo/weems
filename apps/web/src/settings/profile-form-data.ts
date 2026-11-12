import { ProfileUpdate } from "@weems/contrats";

/** Fields of the settings form that can be wrong, each with its message key (Settings.save.invalid). */
const FIELD_ERRORS = [
  "handle",
  "consent",
  "country",
  "homeIcao",
  "level",
  "vatsimId",
  "ivaoId",
  "instagram",
  "facebook",
  "simbriefId",
] as const;
export type FieldError = (typeof FIELD_ERRORS)[number];

const text = (form: FormData, name: string): string | null => {
  const value = form.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
};

/**
 * An account typed as @name or pasted as a link (instagram.com/name/, facebook.com/name,
 * facebook.com/profile.php?id=123): the name alone, which the contract checks.
 */
export function accountName(value: string | null): string | null {
  if (value === null) return null;
  const numericId = /[?&]id=(\d+)/.exec(value)?.[1];
  if (numericId) return numericId;
  const path = value.replace(/^@/, "").replace(/^(https?:\/\/)?([a-z]+\.)?[a-z]+\.com\//i, "");
  return path.replace(/[/?#].*$/, "");
}

/** The typed values, trimmed, empty as null, codes in their expected case. */
const valuesOf = (form: FormData, isPublic: boolean) => ({
  isPublic,
  handle: text(form, "handle")?.toLowerCase() ?? null,
  country: text(form, "country"),
  homeIcao: text(form, "homeIcao")?.toUpperCase() ?? null,
  level: text(form, "level"),
  vatsimId: text(form, "vatsimId"),
  ivaoId: text(form, "ivaoId"),
  instagram: accountName(text(form, "instagram")),
  facebook: accountName(text(form, "facebook")),
  simbriefId: text(form, "simbriefId"),
});

const isFieldError = (field: unknown): field is FieldError =>
  (FIELD_ERRORS as readonly unknown[]).includes(field);

/**
 * The settings form, read into the profile the API expects. Publishing needs the consent box
 * ticked (spec J4, RGPD) and an address; a wrong field is named so that the form can point at it.
 */
export function readProfileForm(
  form: FormData,
): { ok: true; update: ProfileUpdate } | { ok: false; field: FieldError } {
  const isPublic = form.get("isPublic") === "on";
  if (isPublic && form.get("consent") !== "on") return { ok: false, field: "consent" };
  const parsed = ProfileUpdate.safeParse(valuesOf(form, isPublic));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { ok: false, field: isFieldError(field) ? field : "handle" };
  }
  // The API refuses a public page without address (422): said here, on the right field.
  if (isPublic && parsed.data.handle === null) return { ok: false, field: "handle" };
  return { ok: true, update: parsed.data };
}

/**
 * True when saving this form moves a page that is online to another address: the old address
 * stops working at once, so the pilot confirms first. A page that is or goes offline has no
 * link to break.
 */
export function changesPublishedHandle(
  saved: { isPublic: boolean; handle: string | null },
  form: FormData,
): boolean {
  const handle = text(form, "handle")?.toLowerCase() ?? null;
  const staysPublic = saved.isPublic && form.get("isPublic") === "on";
  return staysPublic && saved.handle !== null && handle !== saved.handle;
}
