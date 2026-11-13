import type {
  AdminAmbassador,
  AdminAmbassadors,
  AmbassadorSettings,
  LivePilot,
  PublicAmbassador,
} from "@weems/contrats";
import { notFound, unprocessable } from "../../plugins/problem.ts";
import { normalizePhoto } from "../profiles/photo.ts";
import type { AmbassadorRecord, AmbassadorsRepository } from "./repository-ambassadors.ts";
import type { CampaignRecord } from "./repository.ts";
import type { OffersService } from "./service.ts";

export interface AmbassadorsDependencies {
  repository: AmbassadorsRepository;
  offers: OffersService;
  /** Public identity of pilots whose profile is public (profiles module). */
  publicPilots: (pilotIds: string[]) => Promise<ReadonlyMap<string, LivePilot>>;
  /** Account behind a public profile handle (profiles module). */
  pilotIdOf: (handle: string) => Promise<string | null>;
  now?: () => Date;
}

const noPage = () => notFound("No ambassador at this address.");

/**
 * Ambassadors (spec offre fondateurs): a public page per streamer or club, and their shared code
 * with a number of places. Written from the console only.
 */
export class AmbassadorsService {
  private readonly deps: AmbassadorsDependencies;
  private readonly now: () => Date;

  constructor(deps: AmbassadorsDependencies) {
    this.deps = deps;
    this.now = deps.now ?? (() => new Date());
    deps.offers.nameAmbassadors(async (campaignId) => {
      return (await deps.repository.byCampaign(campaignId))?.content.name ?? null;
    });
  }

  /** The public page; 404 when unknown or turned off. */
  async page(slug: string): Promise<PublicAmbassador> {
    const record = await this.deps.repository.find(slug);
    if (!record?.active) throw noPage();
    const { campaign, used } = await this.campaignOf(record);
    const pilot = await this.pilotOf(record);
    const placesLeft = Math.max(0, (campaign.places ?? 0) - used);
    return {
      ...record.content,
      slug,
      hasPhoto: record.hasPhoto,
      pilotHandle: pilot?.handle ?? null,
      pilotHasPhoto: pilot?.hasPhoto ?? false,
      offer: {
        ...this.offerOf(campaign),
        placesLeft,
        open: placesLeft > 0 && this.running(campaign),
      },
    };
  }

  async photo(slug: string): Promise<Buffer> {
    const record = await this.deps.repository.find(slug);
    const photo = record?.active ? await this.deps.repository.photo(slug) : null;
    if (!photo) throw noPage();
    return photo;
  }

  async list(): Promise<AdminAmbassadors> {
    const records = await this.deps.repository.list();
    return { ambassadors: await Promise.all(records.map((record) => this.adminView(record))) };
  }

  /** Creates or changes an ambassador and their code. */
  async save(slug: string, settings: AmbassadorSettings): Promise<AdminAmbassador> {
    const { offer, pilotHandle, active, ...content } = settings;
    const pilotId = pilotHandle ? await this.deps.pilotIdOf(pilotHandle) : null;
    if (pilotHandle && !pilotId) throw unprocessable(`No public profile ${pilotHandle}.`);
    const existing = await this.deps.repository.find(slug);
    const campaignId = await this.deps.offers.saveShared(
      existing?.campaignId ?? null,
      { ...offer, label: `Ambassadeur · ${content.name}`, expiresAt: new Date(offer.expiresAt) },
      active,
    );
    await this.deps.repository.save({
      slug,
      campaignId,
      content,
      pilotId,
      active,
      updatedAt: this.now(),
    });
    const saved = await this.deps.repository.find(slug);
    if (!saved) throw noPage();
    return this.adminView(saved);
  }

  async savePhoto(slug: string, upload: Buffer): Promise<void> {
    const webp = await normalizePhoto(upload);
    if (!(await this.deps.repository.savePhoto(slug, webp, this.now()))) throw noPage();
  }

  private async adminView(record: AmbassadorRecord): Promise<AdminAmbassador> {
    const { campaign, used } = await this.campaignOf(record);
    const handle = (await this.pilotOf(record))?.handle ?? null;
    return {
      ...record.content,
      slug: record.slug,
      offer: this.offerOf(campaign),
      pilotHandle: handle,
      active: record.active,
      hasPhoto: record.hasPhoto,
      campaignId: record.campaignId,
      used,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private running(campaign: CampaignRecord): boolean {
    const expired = campaign.expiresAt !== null && campaign.expiresAt <= this.now();
    return !expired && campaign.cancelledAt === null;
  }

  /** The ambassador's Weems profile, while it is public. */
  private async pilotOf(record: AmbassadorRecord): Promise<LivePilot | undefined> {
    if (!record.pilotId) return undefined;
    return (await this.deps.publicPilots([record.pilotId])).get(record.pilotId);
  }

  private offerOf(campaign: CampaignRecord) {
    return {
      code: campaign.code ?? "",
      months: campaign.months,
      places: campaign.places ?? 0,
      expiresAt: (campaign.expiresAt ?? this.now()).toISOString(),
    };
  }

  private async campaignOf(record: AmbassadorRecord) {
    const campaign = await this.deps.offers.campaign(record.campaignId);
    if (!campaign) throw noPage();
    return { campaign, used: await this.deps.offers.used(record.campaignId) };
  }
}
