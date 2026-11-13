import {
  AdminAmbassador,
  AdminAmbassadors,
  AdminCampaigns,
  AdminFounders,
  type AmbassadorSettings,
  type NewCodeBatch,
} from "@weems/contrats";
import { z } from "zod";
import { AdminApi } from "../accounts/admin-api.ts";

const Created = z.object({ id: z.uuid() });

/** A photo is resized by the API (sharp): longer than the other calls. */
const PHOTO_TIMEOUT_MS = 30_000;

/**
 * Founder offer, offer codes and ambassadors (spec offre fondateurs), as the administrator:
 * pages Fondateurs and Codes d'offre.
 */
export class OffersApi extends AdminApi {
  founders() {
    return this.call(AdminFounders, "/v1/admin/founders");
  }

  /** Confirms a founder before the end of the 48 h review, or takes the place back. */
  decide(number: number, decision: "confirm" | "refuse") {
    return this.call(null, `/v1/admin/founders/${number}/${decision}`, { method: "POST" });
  }

  campaigns() {
    return this.call(AdminCampaigns, "/v1/admin/codes");
  }

  createBatch(batch: NewCodeBatch) {
    const init = { method: "POST", body: JSON.stringify(batch) };
    return this.call(Created, "/v1/admin/codes/batches", init, 15_000);
  }

  /** The codes of a batch, one per line, to send to the partner. */
  csv(campaignId: string) {
    return this.text(`/v1/admin/codes/${encodeURIComponent(campaignId)}/csv`);
  }

  cancelCampaign(campaignId: string) {
    const path = `/v1/admin/codes/${encodeURIComponent(campaignId)}/cancel`;
    return this.call(null, path, { method: "POST" });
  }

  ambassadors() {
    return this.call(AdminAmbassadors, "/v1/admin/ambassadors");
  }

  saveAmbassador(slug: string, settings: AmbassadorSettings) {
    const init = { method: "PUT", body: JSON.stringify(settings) };
    return this.call(AdminAmbassador, `/v1/admin/ambassadors/${encodeURIComponent(slug)}`, init);
  }

  savePhoto(slug: string, photo: Blob) {
    const path = `/v1/admin/ambassadors/${encodeURIComponent(slug)}/photo`;
    const init = { method: "PUT", body: photo, headers: { "content-type": photo.type } };
    return this.call(null, path, init, PHOTO_TIMEOUT_MS);
  }
}
