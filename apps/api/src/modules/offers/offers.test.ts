import type {
  AdminAmbassador,
  AdminCampaigns,
  AmbassadorSettings,
  MyPlan,
  PublicAmbassador,
  RedeemResult,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot, PASSWORD, signUp, uniqueEmail } from "../../testing/pilots.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, undefined, "admin");
});
afterAll(() => stop());

const NEXT_YEAR = new Date(Date.now() + 365 * 86_400_000).toISOString();
const unique = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const call = (method: "GET" | "POST" | "PUT", url: string, cookie: string, payload?: object) =>
  app.inject({ method, url, headers: { cookie }, ...(payload ? { payload } : {}) });

const nth = (codes: string[], i: number) => codes[i] ?? "";

const redeem = (cookie: string, code: string) =>
  call("POST", "/v1/me/codes/redeem", cookie, { code });

async function batch(
  count: number,
  label = "Partenaire",
): Promise<{ id: string; codes: string[] }> {
  const created = await call("POST", "/v1/admin/codes/batches", admin, {
    label,
    months: 3,
    count,
    expiresAt: NEXT_YEAR,
  });
  expect(created.statusCode, created.body).toBe(201);
  const { id } = created.json<{ id: string }>();
  const csv = await call("GET", `/v1/admin/codes/${id}/csv`, admin);
  expect(csv.headers["content-type"]).toContain("text/csv");
  const codes = csv.body
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => (line.split(",")[0] ?? "").replaceAll('"', ""));
  return { id, codes };
}

function ambassador(code: string, places: number): AmbassadorSettings {
  return {
    name: "CaptainSim",
    tagline: "Streamer MSFS",
    bioFr: "Chaque mardi soir, une rotation complète en direct.",
    bioEn: "Every Tuesday night, a full rotation live.",
    quoteFr: null,
    quoteEn: null,
    links: [{ kind: "twitch", url: "https://www.twitch.tv/captainsim" }],
    offer: { code, months: 6, places, expiresAt: NEXT_YEAR },
    pilotHandle: null,
    active: true,
  };
}

describe("single codes of a batch", () => {
  it("give Pilot Pro once, then add up with the gifts already running", async () => {
    const { codes } = await batch(2);
    const pilot = await newPilot(app);
    const first = await redeem(pilot, nth(codes, 0).toLowerCase().replaceAll("-", ""));
    expect(first.statusCode, first.body).toBe(200);
    const until = Date.parse(first.json<RedeemResult>().proUntil);
    expect((await call("GET", "/v1/me/plan", pilot)).json<MyPlan>()).toMatchObject({
      plan: "pilot_pro",
      offered: { source: "code" },
    });
    // Same batch twice: once per account.
    expect((await redeem(pilot, nth(codes, 1))).statusCode).toBe(409);
    const other = await batch(1);
    const second = (await redeem(pilot, nth(other.codes, 0))).json<RedeemResult>();
    expect(Date.parse(second.proUntil)).toBeGreaterThan(until + 80 * 86_400_000);
  });

  it("are refused when used, unknown, or their batch cancelled", async () => {
    const { id, codes } = await batch(2);
    expect((await redeem(await newPilot(app), nth(codes, 0))).statusCode).toBe(200);
    expect((await redeem(await newPilot(app), nth(codes, 0))).statusCode).toBe(410);
    expect((await redeem(await newPilot(app), "WEEMS-AAAA-AAAA")).statusCode).toBe(404);
    expect((await call("POST", `/v1/admin/codes/${id}/cancel`, admin)).statusCode).toBe(204);
    expect((await redeem(await newPilot(app), nth(codes, 1))).statusCode).toBe(410);
    const { campaigns } = (await call("GET", "/v1/admin/codes", admin)).json<AdminCampaigns>();
    expect(campaigns.find((c) => c.id === id)).toMatchObject({ size: 2, used: 1, kind: "batch" });
  });

  it("cannot be guessed: 5 attempts per hour", async () => {
    const pilot = await newPilot(app);
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await redeem(pilot, `WEEMS-ZZZZ-ZZZ${i + 2}`)).statusCode);
    expect(statuses).toEqual([404, 404, 404, 404, 404, 429]);
  });
});

describe("ambassadors", () => {
  it("have a public page with their shared code, limited in places", async () => {
    const code = `CAPT${unique()}`;
    const slug = `captain-${unique().toLowerCase()}`;
    const saved = await call("PUT", `/v1/admin/ambassadors/${slug}`, admin, ambassador(code, 1));
    expect(saved.statusCode, saved.body).toBe(200);
    expect(saved.json<AdminAmbassador>()).toMatchObject({ used: 0, offer: { code, places: 1 } });

    const page = await app.inject({ method: "GET", url: `/v1/ambassadors/${slug}` });
    expect(page.json<PublicAmbassador>()).toMatchObject({
      name: "CaptainSim",
      hasPhoto: false,
      offer: { code, months: 6, placesLeft: 1, open: true },
    });

    const used = await redeem(await newPilot(app), code.toLowerCase());
    expect(used.json<RedeemResult>()).toMatchObject({ months: 6, ambassador: "CaptainSim" });
    expect((await redeem(await newPilot(app), code)).statusCode).toBe(410);
    const full = await app.inject({ method: "GET", url: `/v1/ambassadors/${slug}` });
    expect(full.json<PublicAmbassador>().offer).toMatchObject({ placesLeft: 0, open: false });
  });

  it("open the closed alpha: sign-up with their code, without invitation", async () => {
    const code = `OPEN${unique()}`;
    await call(
      "PUT",
      `/v1/admin/ambassadors/open-${unique().toLowerCase()}`,
      admin,
      ambassador(code, 5),
    );
    const email = uniqueEmail();
    const response = await signUp(app, {
      email,
      password: PASSWORD,
      name: "Hugo31",
      inviteCode: code,
    });
    expect(response.statusCode, response.body).toBe(200);
    const cookie = response.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    expect((await call("GET", "/v1/me/plan", cookie)).json<MyPlan>().offered?.source).toBe("code");
    const refused = await signUp(app, {
      email: uniqueEmail(),
      password: PASSWORD,
      name: "Nobody",
      inviteCode: "NOSUCHCODE",
    });
    expect(refused.statusCode).toBe(403);
  });

  it("keep their code to themselves, and close when turned off", async () => {
    const code = `SOLO${unique()}`;
    const slug = `solo-${unique().toLowerCase()}`;
    await call("PUT", `/v1/admin/ambassadors/${slug}`, admin, ambassador(code, 5));
    const other = await call("PUT", `/v1/admin/ambassadors/x-${slug}`, admin, ambassador(code, 5));
    expect(other.statusCode).toBe(409);
    await call("PUT", `/v1/admin/ambassadors/${slug}`, admin, {
      ...ambassador(code, 5),
      active: false,
    });
    expect((await app.inject({ method: "GET", url: `/v1/ambassadors/${slug}` })).statusCode).toBe(
      404,
    );
    expect((await redeem(await newPilot(app), code)).statusCode).toBe(410);
  });

  it("show a photo reduced by the API", async () => {
    const slug = `photo-${unique().toLowerCase()}`;
    await call("PUT", `/v1/admin/ambassadors/${slug}`, admin, ambassador(`PHOTO${unique()}`, 5));
    const png = await sharp({
      create: { width: 600, height: 400, channels: 3, background: "#203050" },
    })
      .png()
      .toBuffer();
    const upload = await app.inject({
      method: "PUT",
      url: `/v1/admin/ambassadors/${slug}/photo`,
      headers: { cookie: admin, "content-type": "image/png" },
      payload: png,
    });
    expect(upload.statusCode, upload.body).toBe(204);
    const photo = await app.inject({ method: "GET", url: `/v1/ambassadors/${slug}/photo` });
    expect(photo.headers["content-type"]).toBe("image/webp");
    expect((await sharp(photo.rawPayload).metadata()).width).toBe(256);
  });
});

describe("admin routes of the codes", () => {
  it("are for administrators only", async () => {
    const pilot = await newPilot(app);
    expect((await call("GET", "/v1/admin/codes", pilot)).statusCode).toBe(403);
    expect((await call("GET", "/v1/admin/ambassadors", pilot)).statusCode).toBe(403);
  });
});
