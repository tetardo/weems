import { ProfileUpdate } from "@weems/contrats";

/** Fields of the settings form that can be wrong, each with its message key (Settings.save.invalid). */
export type FieldError = "handle" | "consent" | "homeIcao" | "vatsimId" | "ivaoId" | "simbriefId";

const text = (form: FormData, name: string): string | null => {
  const value = form.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
};

/**
 * The settings form, read into the profile the API expects. Publishing needs the consent box
 * ticked (spec J4, RGPD); a wrong field is named so that the form can point at it.
 */
export function readProfileForm(
  form: FormData,
): { ok: true; update: ProfileUpdate } | { ok: false; field: FieldError } {
  const isPublic = form.get("isPublic") === "on";
  if (isPublic && form.get("consent") !== "on") return { ok: false, field: "consent" };
  const parsed = ProfileUpdate.safeParse({
    isPublic,
    handle: text(form, "handle")?.toLowerCase() ?? null,
    country: text(form, "country"),
    homeIcao: text(form, "homeIcao")?.toUpperCase() ?? null,
    level: text(form, "level"),
    vatsimId: text(form, "vatsimId"),
    ivaoId: text(form, "ivaoId"),
    simbriefId: text(form, "simbriefId"),
  });
  if (parsed.success) return { ok: true, update: parsed.data };
  const field = parsed.error.issues[0]?.path[0];
  return { ok: false, field: isFieldError(field) ? field : "handle" };
}

const FIELDS = new Set<unknown>(["handle", "homeIcao", "vatsimId", "ivaoId", "simbriefId"]);
const isFieldError = (field: unknown): field is FieldError => FIELDS.has(field);
