"use server";

import {
  type AdminAmbassador,
  type AdminCampaign,
  type AdminFounders,
  AmbassadorSettings,
  AmbassadorSlug,
  NewCodeBatch,
} from "@weems/contrats";
import { withAdminSession } from "../server/accounts/admin-session.ts";
import { config } from "../server/console.ts";
import { OffersApi } from "../server/offers/offers-api.ts";
import { type ActionResult, attempt } from "./result.ts";

const asOffers = <T>(call: (api: OffersApi) => Promise<T>, keep = true) =>
  withAdminSession((session) => call(new OffersApi(config(), session)), keep);

/** Page Fondateurs: the 500 places, waiting, confirmed or refused. */
export async function readFounders(): Promise<ActionResult<AdminFounders>> {
  return attempt(() => asOffers((api) => api.founders(), false));
}

export async function decideFounder(
  number: number,
  decision: "confirm" | "refuse",
): Promise<ActionResult> {
  return attempt(async () => {
    await asOffers((api) => api.decide(number, decision));
    return null;
  });
}

export interface CodesPage {
  campaigns: AdminCampaign[];
  ambassadors: AdminAmbassador[];
  /** The site, for the links of the ambassador pages. */
  siteUrl: string;
}

/** Page Codes d'offre: batches, referral codes, ambassadors and their shared code. */
export async function readCodes(): Promise<ActionResult<CodesPage>> {
  return attempt(() =>
    asOffers(async (api) => {
      const [{ campaigns }, { ambassadors }] = await Promise.all([
        api.campaigns(),
        api.ambassadors(),
      ]);
      return { campaigns, ambassadors, siteUrl: config().siteUrl };
    }, false),
  );
}

export async function createBatch(batch: NewCodeBatch): Promise<ActionResult<string>> {
  return attempt(async () => {
    const { id } = await asOffers((api) => api.createBatch(NewCodeBatch.parse(batch)));
    return id;
  });
}

/** The codes of a batch as CSV, saved by the browser. */
export async function campaignCsv(campaignId: string): Promise<ActionResult<string>> {
  return attempt(() => asOffers((api) => api.csv(campaignId)));
}

export async function cancelCampaign(campaignId: string): Promise<ActionResult> {
  return attempt(async () => {
    await asOffers((api) => api.cancelCampaign(campaignId));
    return null;
  });
}

/**
 * Saves an ambassador: `slug`, `settings` (JSON of AmbassadorSettings) and, when chosen, `photo`.
 * The photo goes through this action, hence the 16 MB limit of next.config.ts.
 */
export async function saveAmbassador(form: FormData): Promise<ActionResult<AdminAmbassador>> {
  return attempt(async () => {
    const slug = AmbassadorSlug.parse(form.get("slug"));
    const settings = AmbassadorSettings.parse(JSON.parse(String(form.get("settings"))));
    const photo = form.get("photo");
    return asOffers(async (api) => {
      const saved = await api.saveAmbassador(slug, settings);
      if (photo instanceof File && photo.size > 0) await api.savePhoto(slug, photo);
      return { ...saved, hasPhoto: saved.hasPhoto || (photo instanceof File && photo.size > 0) };
    });
  });
}
