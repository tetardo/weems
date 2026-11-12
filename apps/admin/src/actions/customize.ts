"use server";

import { HomeFocus, type HomeImages, type HomeTheme } from "@weems/contrats";
import { type Operation, THEMES, type ThemeDraft, planOf } from "../features/customize/plan.ts";
import { AdminApi } from "../server/accounts/admin-api.ts";
import { withAdminSession } from "../server/accounts/admin-session.ts";
import { config } from "../server/console.ts";
import { SiteApi } from "../server/site/site-api.ts";
import { type ActionResult, attempt } from "./result.ts";

export interface CustomizePage {
  images: HomeImages;
  /** The site, for the default image and the link to the home page. */
  siteUrl: string;
  apiUrl: string;
  /** False when the console has no administrator session (see page Comptes): saving is refused. */
  loggedIn: boolean;
}

/** The page Personnalisation: the images in use (public route, no login needed to read). */
export async function readCustomization(): Promise<ActionResult<CustomizePage>> {
  return attempt(async () => {
    const images = await new SiteApi(config(), "").homeImages();
    const loggedIn = await withAdminSession(
      (session) => new AdminApi(config(), session).me(),
      false,
    )
      .then(() => true)
      .catch(() => false);
    const { siteUrl, apiUrl } = config();
    return { images, siteUrl, apiUrl, loggedIn };
  });
}

const text = (form: FormData, name: string) => String(form.get(name) ?? "");

function draftIn(form: FormData, theme: HomeTheme): ThemeDraft & { image: File | null } {
  const file = form.get(`${theme}.file`);
  const image = file instanceof File && file.size > 0 ? file : null;
  return {
    image,
    file: image?.name ?? null,
    reset: form.get(`${theme}.reset`) === "1",
    focus: HomeFocus.catch("left").parse(text(form, `${theme}.focus`)),
    credit: text(form, `${theme}.credit`).trim(),
    licence: text(form, `${theme}.licence`).trim(),
  };
}

interface Saving {
  api: SiteApi;
  drafts: Record<HomeTheme, ReturnType<typeof draftIn>>;
  current: HomeImages;
}

async function apply({ api, drafts, current }: Saving, theme: HomeTheme, operation: Operation) {
  const own = drafts[theme];
  const settings = { focus: own.focus, credit: own.credit, licence: own.licence };
  if (operation === "reset") await api.reset(theme);
  if (operation === "update") await api.update(theme, settings);
  if (operation === "upload") {
    const image = own.image ?? drafts.light.image;
    if (image) await api.upload(theme, image, theme === "light" ? settings : lightSettings(drafts));
  }
  if (operation === "copy" && current.light) {
    await api.upload(theme, await api.imageOf(current.light.path), lightSettings(drafts));
  }
}

const lightSettings = (drafts: Record<HomeTheme, ThemeDraft>) => ({
  focus: drafts.light.focus,
  credit: drafts.light.credit,
  licence: drafts.light.licence,
});

/** Saves the page (one Enregistrer, fiche 008): uploads, settings and resets, theme by theme. */
export async function saveCustomization(form: FormData): Promise<ActionResult<HomeImages>> {
  return attempt(async () => {
    const drafts = { light: draftIn(form, "light"), dark: draftIn(form, "dark") };
    return withAdminSession(async (session) => {
      const api = new SiteApi(config(), session);
      const current = await api.homeImages();
      const plan = planOf(drafts, current, form.get("same") === "on");
      for (const theme of THEMES) await apply({ api, drafts, current }, theme, plan[theme]);
      return api.homeImages();
    });
  });
}
