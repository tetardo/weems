import { HOME_IMAGE_MAX_WIDTH, HOME_IMAGE_MIN_WIDTH } from "@weems/contrats";
import sharp from "sharp";
import { unprocessable } from "../../plugins/problem.ts";

/** Formats accepted on upload, read from the file content, not from its name or header. */
const ACCEPTED = new Set(["jpeg", "png", "webp"]);
/** About 40 megapixels: refuses "decompression bombs" before decoding them. */
const MAX_INPUT_PIXELS = 40_000_000;

/** The stored home image and its size. */
export interface NormalizedImage {
  webp: Buffer;
  width: number;
  height: number;
}

async function formatOf(image: sharp.Sharp): Promise<{ format?: string; width?: number }> {
  try {
    return await image.metadata();
  } catch {
    throw unprocessable("The file is not a readable image.");
  }
}

/**
 * The stored home image (spec J4 personnalisation): orientation applied, 2 560 px wide at most,
 * WebP. Re-encoding drops every metadata block (GPS position, author, generator signature).
 */
export async function normalizeHomeImage(input: Buffer): Promise<NormalizedImage> {
  const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
  const { format } = await formatOf(image);
  if (!format || !ACCEPTED.has(format)) throw unprocessable("Send a JPEG, PNG or WebP image.");
  try {
    const { data, info } = await image
      .rotate()
      .resize({ width: HOME_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    if (info.width < HOME_IMAGE_MIN_WIDTH) {
      throw unprocessable(`The image must be at least ${HOME_IMAGE_MIN_WIDTH} px wide.`);
    }
    return { webp: data, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof Error && "status" in error) throw error;
    throw unprocessable("The image could not be read.");
  }
}
