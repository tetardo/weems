import sharp from "sharp";
import { unprocessable } from "../../plugins/problem.ts";

/** Formats accepted on upload, read from the file content, not from its name or header. */
const ACCEPTED = new Set(["jpeg", "png", "webp"]);
const SIZE_PX = 256;
/** About 40 megapixels: refuses "decompression bombs" before decoding them. */
const MAX_INPUT_PIXELS = 40_000_000;

/**
 * The stored profile photo: square, 256 px, WebP. Re-encoding drops every metadata block
 * (camera GPS position, author…), and EXIF orientation is applied first.
 */
export async function normalizePhoto(input: Buffer): Promise<Buffer> {
  const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
  let format: string | undefined;
  try {
    ({ format } = await image.metadata());
  } catch {
    throw unprocessable("The file is not a readable image.");
  }
  if (!format || !ACCEPTED.has(format)) throw unprocessable("Send a JPEG, PNG or WebP image.");
  try {
    return await image
      .rotate()
      .resize(SIZE_PX, SIZE_PX, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw unprocessable("The image could not be read.");
  }
}
