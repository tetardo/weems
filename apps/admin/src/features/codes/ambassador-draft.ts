import {
  type AdminAmbassador,
  type AmbassadorLinkKind,
  AmbassadorSettings,
  AmbassadorSlug,
} from "@weems/contrats";

/** What the ambassador form holds: text everywhere, read into AmbassadorSettings on save. */
export interface AmbassadorDraft {
  slug: string;
  name: string;
  tagline: string;
  bioFr: string;
  bioEn: string;
  quoteFr: string;
  quoteEn: string;
  links: Record<AmbassadorLinkKind, string>;
  code: string;
  months: number;
  places: number;
  /** yyyy-mm-dd (date field). */
  expiresOn: string;
  pilotHandle: string;
  active: boolean;
}

export const LINK_KINDS: readonly AmbassadorLinkKind[] = ["twitch", "youtube", "website"];

const DAY_MS = 86_400_000;
const dayOf = (iso: string) => iso.slice(0, 10);

/** A new ambassador: 3 months for 50 pilots, valid 90 days. */
export function emptyDraft(now: number): AmbassadorDraft {
  return {
    slug: "",
    name: "",
    tagline: "",
    bioFr: "",
    bioEn: "",
    quoteFr: "",
    quoteEn: "",
    links: { twitch: "", youtube: "", website: "" },
    code: "",
    months: 3,
    places: 50,
    expiresOn: dayOf(new Date(now + 90 * DAY_MS).toISOString()),
    pilotHandle: "",
    active: true,
  };
}

export function draftOf(ambassador: AdminAmbassador): AmbassadorDraft {
  const links = { twitch: "", youtube: "", website: "" };
  for (const link of ambassador.links) links[link.kind] = link.url;
  return {
    slug: ambassador.slug,
    name: ambassador.name,
    tagline: ambassador.tagline,
    bioFr: ambassador.bioFr,
    bioEn: ambassador.bioEn,
    quoteFr: ambassador.quoteFr ?? "",
    quoteEn: ambassador.quoteEn ?? "",
    links,
    code: ambassador.offer.code,
    months: ambassador.offer.months,
    places: ambassador.offer.places,
    expiresOn: dayOf(ambassador.offer.expiresAt),
    pilotHandle: ambassador.pilotHandle ?? "",
    active: ambassador.active,
  };
}

const orNull = (text: string) => (text.trim() === "" ? null : text.trim());

/** French names of the fields, for the error message. */
const FIELD_NAMES: Record<string, string> = {
  slug: "Adresse de la page",
  name: "Nom",
  tagline: "Accroche",
  bioFr: "Présentation (français)",
  bioEn: "Présentation (anglais)",
  quoteFr: "Citation (français)",
  quoteEn: "Citation (anglais)",
  links: "Liens (https seulement)",
  offer: "Offre",
  pilotHandle: "Profil de pilote lié",
};

export type DraftReading =
  { ok: true; slug: string; settings: AmbassadorSettings } | { ok: false; error: string };

/** The form read into the API's format, or the first field to correct. */
export function readDraft(draft: AmbassadorDraft): DraftReading {
  const slug = AmbassadorSlug.safeParse(draft.slug.trim().toLowerCase());
  if (!slug.success)
    return { ok: false, error: "Adresse de la page : lettres, chiffres et tirets." };
  const settings = AmbassadorSettings.safeParse({
    name: draft.name,
    tagline: draft.tagline,
    bioFr: draft.bioFr,
    bioEn: draft.bioEn,
    quoteFr: orNull(draft.quoteFr),
    quoteEn: orNull(draft.quoteEn),
    links: LINK_KINDS.filter((kind) => draft.links[kind].trim() !== "").map((kind) => ({
      kind,
      url: draft.links[kind].trim(),
    })),
    offer: {
      code: draft.code.trim().toUpperCase(),
      months: draft.months,
      places: draft.places,
      expiresAt: new Date(`${draft.expiresOn}T23:59:59.000Z`).toISOString(),
    },
    pilotHandle: orNull(draft.pilotHandle),
    active: draft.active,
  });
  if (settings.success) return { ok: true, slug: slug.data, settings: settings.data };
  const field = String(settings.error.issues[0]?.path[0] ?? "");
  return { ok: false, error: `${FIELD_NAMES[field] ?? field} : valeur à corriger.` };
}
