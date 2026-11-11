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
  "simbriefId",
] as const;
export type FieldError = (typeof FIELD_ERRORS)[number];

const text = (form: FormData, name: string): string | null => {
  const value = form.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
};

/** The typed values, trimmed, empty as null, codes in their expected case. */
const valuesOf = (form: FormData, isPublic: boolean) => ({
  isPublic,
  handle: text(form, "handle")?.toLowerCase() ?? null,
  country: text(form, "country"),
  homeIcao: text(form, "homeIcao")?.toUpperCase() ?? null,
  level: text(form, "level"),
  vatsimId: text(form, "vatsimId"),
  ivaoId: text(form, "ivaoId"),
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
