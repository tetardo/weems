import type { HomeImage, HomeImageSettings, HomeImages, HomeTheme } from "@weems/contrats";

/** What Greg set for one theme on the page, before saving. */
export interface ThemeDraft extends HomeImageSettings {
  /** A new image chosen on the page (its name), or null. */
  file: string | null;
  /** « Image par défaut »: back to the image shipped with the site. */
  reset: boolean;
}

/** What saving does for one theme. copy: the other theme's image, with its settings. */
export type Operation = "none" | "upload" | "update" | "reset" | "copy";

export const THEMES: readonly HomeTheme[] = ["light", "dark"];

/** The form as shown first: the saved settings, or empty fields for the default image. */
export function draftOf(image: HomeImage | null): ThemeDraft {
  return {
    file: null,
    reset: false,
    focus: image?.focus ?? "left",
    credit: image?.credit ?? "",
    licence: image?.licence ?? "",
  };
}

const sameSettings = (draft: ThemeDraft, image: HomeImage) =>
  draft.focus === image.focus &&
  draft.credit.trim() === image.credit &&
  draft.licence.trim() === image.licence;

function operationOf(draft: ThemeDraft, image: HomeImage | null): Operation {
  if (draft.reset) return image ? "reset" : "none";
  if (draft.file) return "upload";
  if (image && !sameSettings(draft, image)) return "update";
  return "none";
}

/**
 * What saving does for each theme (spec J4 personnalisation). With « même image pour les deux
 * thèmes », the dark theme follows the light one: the same new file, or a copy of its image.
 */
export function planOf(
  drafts: Record<HomeTheme, ThemeDraft>,
  current: HomeImages,
  same: boolean,
): Record<HomeTheme, Operation> {
  const light = operationOf(drafts.light, current.light);
  if (!same) return { light, dark: operationOf(drafts.dark, current.dark) };
  if (light === "upload" || light === "reset") return { light, dark: light };
  if (light === "none" && !current.light) return { light, dark: current.dark ? "reset" : "none" };
  return { light, dark: "copy" };
}

/** Number of themes that saving changes, for the save bar. */
export function changesOf(plan: Record<HomeTheme, Operation>): number {
  return THEMES.filter((theme) => plan[theme] !== "none").length;
}

/** Credit and licence are mandatory as soon as the theme has an image (spec, criterion 5). */
export function missingLabels(draft: ThemeDraft, image: HomeImage | null): boolean {
  const shown = !draft.reset && (draft.file !== null || image !== null);
  return shown && (draft.credit.trim() === "" || draft.licence.trim() === "");
}
