import type { HomeImage, HomeImageSettings, HomeImages, HomeTheme } from "@weems/contrats";
import { notFound } from "../../plugins/problem.ts";
import { normalizeHomeImage } from "./image.ts";
import type { HomeImageRecord, SiteRepository } from "./repository.ts";

/** Path of the image on the API; v changes with each upload, so the image can be cached long. */
const imagePath = (theme: HomeTheme, updatedAt: Date) =>
  `/v1/site/home-images/${theme}/image?v=${updatedAt.getTime()}`;

const toHomeImage = ({ theme, updatedAt, ...rest }: HomeImageRecord): HomeImage => ({
  ...rest,
  path: imagePath(theme, updatedAt),
  updatedAt: updatedAt.toISOString(),
});

/** Home page images, one per theme (spec J4 personnalisation). */
export class SiteService {
  private readonly repository: SiteRepository;

  constructor(repository: SiteRepository) {
    this.repository = repository;
  }

  async homeImages(): Promise<HomeImages> {
    const images: HomeImages = { light: null, dark: null };
    for (const record of await this.repository.list()) {
      images[record.theme] = toHomeImage(record);
    }
    return images;
  }

  async image(theme: HomeTheme): Promise<Buffer> {
    const webp = await this.repository.findImage(theme);
    if (!webp) throw notFound("No image for this theme: the site shows its default one.");
    return webp;
  }

  async upload(
    theme: HomeTheme,
    file: Buffer,
    settings: HomeImageSettings,
    by: string,
  ): Promise<HomeImages> {
    const image = await normalizeHomeImage(file);
    await this.repository.save(theme, image, settings, by);
    return this.homeImages();
  }

  async updateSettings(
    theme: HomeTheme,
    settings: HomeImageSettings,
    by: string,
  ): Promise<HomeImages> {
    if (!(await this.repository.updateSettings(theme, settings, by))) {
      throw notFound("No image for this theme: upload one first.");
    }
    return this.homeImages();
  }

  async reset(theme: HomeTheme): Promise<void> {
    await this.repository.delete(theme);
  }
}
