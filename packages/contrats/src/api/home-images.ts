import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/** Theme of the site, each with its own home image (spec J4 personnalisation). */
export const HomeTheme = z.enum(["light", "dark"]);
export type HomeTheme = z.infer<typeof HomeTheme>;

/** What the crop keeps of the image, above all on a phone. */
export const HomeFocus = z.enum(["left", "center", "right"]);
export type HomeFocus = z.infer<typeof HomeFocus>;

/** Smallest width accepted on upload, and the width the API keeps at most. */
export const HOME_IMAGE_MIN_WIDTH = 1024;
export const HOME_IMAGE_MAX_WIDTH = 2560;
/** Largest file accepted on upload. */
export const HOME_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const Label = z.string().trim().min(1).max(120);

/** PATCH /v1/admin/site/home-images/{theme}, and the query of its PUT: mandatory credit and licence. */
export const HomeImageSettings = z.object({
  focus: HomeFocus,
  credit: Label,
  licence: Label,
});
export type HomeImageSettings = z.infer<typeof HomeImageSettings>;

/** One uploaded home image. */
export const HomeImage = HomeImageSettings.extend({
  /** Path on the API (/v1/site/home-images/{theme}/image?v=…), changed by each upload. */
  path: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  updatedAt: UtcTimestamp,
});
export type HomeImage = z.infer<typeof HomeImage>;

/** GET /v1/site/home-images: public; null means the image shipped with the site. */
export const HomeImages = z.object({ light: HomeImage.nullable(), dark: HomeImage.nullable() });
export type HomeImages = z.infer<typeof HomeImages>;
