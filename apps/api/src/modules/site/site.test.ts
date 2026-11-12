import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot, uniqueEmail } from "../../testing/pilots.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;

const settings = { focus: "left", credit: "Image maison Weems", licence: "Tous droits réservés" };
const query = new URLSearchParams(settings).toString();
const url = "/v1/admin/site/home-images/dark";

/** A plain JPEG of the given size, with an EXIF block the API must drop. */
const jpeg = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#203050" } })
    .withExif({ IFD0: { Artist: "Somebody" } })
    .jpeg()
    .toBuffer();

const upload = (body: Buffer, cookie = admin, path = `${url}?${query}`) =>
  app.inject({
    method: "PUT",
    url: path,
    headers: { cookie, "content-type": "image/jpeg" },
    payload: body,
  });

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, uniqueEmail(), "admin");
  await app.inject({ method: "DELETE", url, headers: { cookie: admin } });
});
afterAll(() => stop());

describe("home images", () => {
  it("are public and empty until one is uploaded", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/site/home-images" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=60");
    expect(response.json().dark).toBeNull();
  });

  it("keeps an upload resized to 2 560 px, in WebP, without metadata", async () => {
    const response = await upload(await jpeg(3000, 2000));
    expect(response.statusCode).toBe(200);
    const dark = response.json().dark;
    expect(dark).toMatchObject({ ...settings, width: 2560, height: 1707 });
    const image = await app.inject({ method: "GET", url: dark.path });
    expect(image.headers["content-type"]).toBe("image/webp");
    expect(image.headers["cache-control"]).toContain("immutable");
    const metadata = await sharp(image.rawPayload).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
  });

  it("changes the settings, then goes back to the default image", async () => {
    const changed = { ...settings, focus: "right" };
    const patch = await app.inject({
      method: "PATCH",
      url,
      headers: { cookie: admin },
      payload: changed,
    });
    expect(patch.json().dark.focus).toBe("right");
    expect(
      (await app.inject({ method: "DELETE", url, headers: { cookie: admin } })).statusCode,
    ).toBe(204);
    const images = await app.inject({ method: "GET", url: "/v1/site/home-images" });
    expect(images.json().dark).toBeNull();
    const again = await app.inject({
      method: "PATCH",
      url,
      headers: { cookie: admin },
      payload: changed,
    });
    expect(again.statusCode).toBe(404);
  });

  it("refuses a small image, a missing credit and a file that is not an image", async () => {
    expect((await upload(await jpeg(800, 600))).statusCode).toBe(422);
    const noCredit = new URLSearchParams({ ...settings, credit: " " }).toString();
    expect((await upload(await jpeg(1200, 800), admin, `${url}?${noCredit}`)).statusCode).toBe(400);
    expect((await upload(Buffer.from("not an image"))).statusCode).toBe(422);
  });

  it("is for administrators only", async () => {
    const body = await jpeg(1200, 800);
    expect((await upload(body, "")).statusCode).toBe(401);
    expect((await upload(body, await newPilot(app))).statusCode).toBe(403);
  });
});
