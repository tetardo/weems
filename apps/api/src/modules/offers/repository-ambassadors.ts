import { AmbassadorContent } from "@weems/contrats";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { ambassadors } from "../../db/schema.ts";

export interface AmbassadorRecord {
  slug: string;
  campaignId: string;
  content: AmbassadorContent;
  pilotId: string | null;
  active: boolean;
  hasPhoto: boolean;
  updatedAt: Date;
}

const columns = {
  slug: ambassadors.slug,
  campaignId: ambassadors.campaignId,
  content: ambassadors.content,
  pilotId: ambassadors.pilotId,
  active: ambassadors.active,
  hasPhoto: sql<boolean>`${ambassadors.photo} is not null`,
  updatedAt: ambassadors.updatedAt,
};

const parsed = (
  row: Omit<AmbassadorRecord, "content"> & { content: unknown },
): AmbassadorRecord => ({
  ...row,
  content: AmbassadorContent.parse(row.content),
});

/** Ambassadors' pages (table ambassadors). */
export class AmbassadorsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async find(slug: string): Promise<AmbassadorRecord | null> {
    const [row] = await this.db.select(columns).from(ambassadors).where(eq(ambassadors.slug, slug));
    return row ? parsed(row) : null;
  }

  async byCampaign(campaignId: string): Promise<AmbassadorRecord | null> {
    const [row] = await this.db
      .select(columns)
      .from(ambassadors)
      .where(eq(ambassadors.campaignId, campaignId));
    return row ? parsed(row) : null;
  }

  async list(): Promise<AmbassadorRecord[]> {
    const rows = await this.db.select(columns).from(ambassadors).orderBy(ambassadors.slug);
    return rows.map(parsed);
  }

  async save(record: Omit<AmbassadorRecord, "hasPhoto">): Promise<void> {
    const { slug: _slug, ...fields } = record;
    await this.db
      .insert(ambassadors)
      .values(record)
      .onConflictDoUpdate({ target: ambassadors.slug, set: fields });
  }

  async photo(slug: string): Promise<Buffer | null> {
    const [row] = await this.db
      .select({ photo: ambassadors.photo })
      .from(ambassadors)
      .where(eq(ambassadors.slug, slug));
    return row?.photo ?? null;
  }

  /** False when the ambassador does not exist. */
  async savePhoto(slug: string, webp: Buffer, at: Date): Promise<boolean> {
    const updated = await this.db
      .update(ambassadors)
      .set({ photo: webp, updatedAt: at })
      .where(eq(ambassadors.slug, slug))
      .returning({ slug: ambassadors.slug });
    return updated.length > 0;
  }
}
