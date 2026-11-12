import { eq } from "drizzle-orm";
import { HomeFocus, type HomeImageSettings, HomeTheme } from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { siteHomeImages } from "../../db/schema.ts";
import type { NormalizedImage } from "./image.ts";

/** A home image as stored, without its bytes. */
export interface HomeImageRecord extends HomeImageSettings {
  theme: HomeTheme;
  width: number;
  height: number;
  updatedAt: Date;
}

const columns = {
  theme: siteHomeImages.theme,
  width: siteHomeImages.width,
  height: siteHomeImages.height,
  focus: siteHomeImages.focus,
  credit: siteHomeImages.credit,
  licence: siteHomeImages.licence,
  updatedAt: siteHomeImages.updatedAt,
};

type Row = { theme: string; focus: string } & Omit<HomeImageRecord, "theme" | "focus">;

const toRecord = (row: Row): HomeImageRecord => ({
  ...row,
  theme: HomeTheme.parse(row.theme),
  focus: HomeFocus.parse(row.focus),
});

/** The only place that reads and writes the home images. */
export class SiteRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(): Promise<HomeImageRecord[]> {
    const rows = await this.db.select(columns).from(siteHomeImages);
    return rows.map(toRecord);
  }

  async findImage(theme: HomeTheme): Promise<Buffer | null> {
    const [row] = await this.db
      .select({ webp: siteHomeImages.webp })
      .from(siteHomeImages)
      .where(eq(siteHomeImages.theme, theme));
    return row?.webp ?? null;
  }

  async save(
    theme: HomeTheme,
    image: NormalizedImage,
    settings: HomeImageSettings,
    by: string,
  ): Promise<void> {
    const values = { ...image, ...settings, updatedAt: new Date(), updatedBy: by };
    await this.db
      .insert(siteHomeImages)
      .values({ theme, ...values })
      .onConflictDoUpdate({ target: siteHomeImages.theme, set: values });
  }

  /** False when the theme has no uploaded image. */
  async updateSettings(
    theme: HomeTheme,
    settings: HomeImageSettings,
    by: string,
  ): Promise<boolean> {
    const rows = await this.db
      .update(siteHomeImages)
      .set({ ...settings, updatedAt: new Date(), updatedBy: by })
      .where(eq(siteHomeImages.theme, theme))
      .returning({ theme: siteHomeImages.theme });
    return rows.length > 0;
  }

  async delete(theme: HomeTheme): Promise<void> {
    await this.db.delete(siteHomeImages).where(eq(siteHomeImages.theme, theme));
  }
}
