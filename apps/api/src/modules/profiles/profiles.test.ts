import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newTrackerPilot } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { syntheticTrack } from "../../testing/synthetic-track.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

type Pilot = Awaited<ReturnType<typeof newTrackerPilot>>;
const EMPTY = {
  country: null,
  homeIcao: null,
  level: null,
  vatsimId: null,
  ivaoId: null,
  instagram: null,
  facebook: null,
  simbriefId: null,
};
let counter = 0;
const uniqueHandle = () => `pilot-${Date.now().toString(36)}-${++counter}`;

/** A flight sent by the pilot's tracker; closed with a trajectory unless told otherwise. */
async function fly(pilot: Pilot, { closed = true, touchdownVs = -120 } = {}): Promise<string> {
  const flight = syntheticFlight();
  const { flightId } = flight.open;
  const send = (url: string, payload: unknown, method: "POST" | "PUT" = "POST") =>
    app.inject({ method, url, headers: pilot.tracker, payload: payload as object });
  await send("/v1/flights", flight.open);
  const events = flight.events.map((e) =>
    e.type === "touchdown" ? { ...e, context: { vs: touchdownVs } } : e,
  );
  await send(`/v1/flights/${flightId}/events`, { events });
  if (closed) {
    await send(`/v1/flights/${flightId}/close`, flight.close);
    await send(`/v1/flights/${flightId}/track`, { points: syntheticTrack(600) });
  }
  return flightId;
}

const saveProfile = (pilot: Pilot, body: Record<string, unknown>) =>
  app.inject({
    method: "PUT",
    url: "/v1/me/profile",
    headers: { cookie: pilot.cookie },
    payload: { ...EMPTY, isPublic: false, handle: null, ...body },
  });

async function publicPilot(fields: Record<string, unknown> = {}) {
  const pilot = await newTrackerPilot(app);
  const handle = uniqueHandle();
  const saved = await saveProfile(pilot, { isPublic: true, handle, ...fields });
  expect(saved.statusCode).toBe(200);
  return { pilot, handle };
}

const visit = (url: string) => app.inject({ method: "GET", url });

describe("own profile settings (spec J4)", () => {
  it("is off by default, with a handle proposed from the pilot's name", async () => {
    const pilot = await newTrackerPilot(app);
    const profile = await app.inject({
      method: "GET",
      url: "/v1/me/profile",
      headers: { cookie: pilot.cookie },
    });
    expect(profile.statusCode).toBe(200);
    expect(profile.json()).toMatchObject({ isPublic: false, handle: null, photoUpdatedAt: null });
    expect(profile.json().suggestedHandle).toMatch(/^test-pilot/);
  });

  it("refuses to publish without handle, a reserved handle, a taken one, and bad fields", async () => {
    const { handle } = await publicPilot();
    const other = await newTrackerPilot(app);
    expect((await saveProfile(other, { isPublic: true })).statusCode).toBe(422);
    expect((await saveProfile(other, { handle: "weems" })).statusCode).toBe(422);
    expect((await saveProfile(other, { handle })).statusCode).toBe(409);
    expect((await saveProfile(other, { handle: "-bad-" })).statusCode).toBe(400);
    expect(
      (await saveProfile(other, { handle: uniqueHandle(), vatsimId: "12ab" })).statusCode,
    ).toBe(400);
    expect(
      (await saveProfile(other, { handle: uniqueHandle(), country: "France" })).statusCode,
    ).toBe(400);
    expect(
      (await saveProfile(other, { handle: uniqueHandle(), instagram: "https://evil.example" }))
        .statusCode,
    ).toBe(400);
  });

  it("shows the Instagram and Facebook account names on the public profile", async () => {
    const { handle } = await publicPilot({ instagram: "greg.flies_", facebook: "100012345678" });
    expect((await visit(`/v1/pilots/${handle}`)).json()).toMatchObject({
      instagram: "greg.flies_",
      facebook: "100012345678",
    });
  });

  it("answers the same to an identical re-send, and keeps the first publication date", async () => {
    const { pilot, handle } = await publicPilot();
    const first = await saveProfile(pilot, { isPublic: true, handle });
    const again = await saveProfile(pilot, { isPublic: true, handle });
    expect(again.statusCode).toBe(200);
    expect(again.json()).toEqual(first.json());
    const flightId = await fly(pilot);
    const hide = () =>
      app.inject({
        method: "PUT",
        url: `/v1/flights/${flightId}/visibility`,
        headers: { cookie: pilot.cookie },
        payload: { hiddenOnProfile: true },
      });
    expect((await hide()).statusCode).toBe(200);
    expect((await hide()).json()).toEqual({ hiddenOnProfile: true });
  });

  it("keeps the consent dates: published, then taken down", async () => {
    const { pilot, handle } = await publicPilot();
    const down = await saveProfile(pilot, { handle, isPublic: false });
    expect(down.json().publishedAt).toEqual(expect.any(String));
    expect((await visit(`/v1/pilots/${handle}`)).statusCode).toBe(404);
  });
});

describe("settings helpers (spec J4)", () => {
  const ask = (pilot: Pilot, url: string) =>
    app.inject({ method: "GET", url, headers: { cookie: pilot.cookie } });

  it("lists the pilot's own hidden flights, newest first", async () => {
    const pilot = await newTrackerPilot(app);
    const [first, second, shown] = [await fly(pilot), await fly(pilot), await fly(pilot)];
    for (const id of [first, second]) {
      await app.inject({
        method: "PUT",
        url: `/v1/flights/${id}/visibility`,
        headers: { cookie: pilot.cookie },
        payload: { hiddenOnProfile: true },
      });
    }
    const { flights } = (await ask(pilot, "/v1/me/profile/hidden-flights")).json();
    expect(flights.map((f: { flightId: string }) => f.flightId)).toEqual([second, first]);
    expect(flights.map((f: { flightId: string }) => f.flightId)).not.toContain(shown);
    const other = await newTrackerPilot(app);
    expect((await ask(other, "/v1/me/profile/hidden-flights")).json()).toEqual({ flights: [] });
  });

  it("checks an address as the pilot types it", async () => {
    const { pilot, handle } = await publicPilot();
    const other = await newTrackerPilot(app);
    const check = async (who: Pilot, value: string) =>
      (await ask(who, `/v1/me/profile/handle-check?handle=${encodeURIComponent(value)}`)).json()
        .status;
    expect(await check(pilot, handle)).toBe("available");
    expect(await check(other, handle)).toBe("taken");
    expect(await check(other, "weems")).toBe("reserved");
    expect(await check(other, "-Bad")).toBe("invalid");
    expect(await check(other, uniqueHandle())).toBe("available");
    expect(
      (await app.inject({ method: "GET", url: "/v1/me/profile/handle-check?handle=x" })).statusCode,
    ).toBe(401);
  });

  it("limits the checks per pilot, not per address (all come through the site)", async () => {
    const [busy, other] = [await newTrackerPilot(app), await newTrackerPilot(app)];
    const url = `/v1/me/profile/handle-check?handle=${uniqueHandle()}`;
    for (let i = 0; i < 60; i++) await ask(busy, url);
    expect((await ask(busy, url)).statusCode).toBe(429);
    expect((await ask(other, url)).statusCode).toBe(200);
  });
});

describe("public profile (spec J4)", () => {
  it("answers the same 404 for a profile turned off and an unknown handle", async () => {
    const pilot = await newTrackerPilot(app);
    const handle = uniqueHandle();
    await saveProfile(pilot, { handle, isPublic: false });
    const off = await visit(`/v1/pilots/${handle}`);
    const unknown = await visit(`/v1/pilots/${uniqueHandle()}`);
    expect(off.statusCode).toBe(404);
    expect(unknown.statusCode).toBe(404);
    expect(off.json().detail).toBe(unknown.json().detail);
  });

  it("shows closed flights only, never hidden ones, with their statistics", async () => {
    const { pilot, handle } = await publicPilot({
      country: "FR",
      level: "advanced",
      homeIcao: "LFBO",
    });
    const shown = await fly(pilot, { touchdownVs: -100 });
    const hidden = await fly(pilot, { touchdownVs: -500 });
    const open = await fly(pilot, { closed: false });
    const hide = await app.inject({
      method: "PUT",
      url: `/v1/flights/${hidden}/visibility`,
      headers: { cookie: pilot.cookie },
      payload: { hiddenOnProfile: true },
    });
    expect(hide.json()).toEqual({ hiddenOnProfile: true });

    const profile = (await visit(`/v1/pilots/${handle}`)).json();
    expect(profile).toMatchObject({ handle, country: "FR", homeIcao: "LFBO", level: "advanced" });
    expect(profile.stats).toMatchObject({ flights: 1, averageTouchdownVs: -100, nightS: 0 });
    expect(profile.stats.dayS).toBeGreaterThan(0);
    expect(profile.stats.distanceNm).toBeGreaterThan(0);
    expect(profile.stats.cleanLandings).toEqual({ clean: 1, landings: 1 });
    expect(profile.stats.experience).toMatchObject({
      categories: [{ category: "narrowBody", flights: 1, averageTouchdownVs: -100 }],
      multiEngine: { flights: 1 },
      singleEngine: { flights: 0 },
    });
    expect(profile.charts.recentLandings).toEqual([expect.objectContaining({ touchdownVs: -100 })]);

    const list = (await visit(`/v1/pilots/${handle}/flights`)).json();
    expect(list.flights.map((f: { flightId: string }) => f.flightId)).toEqual([shown]);
    expect(list.flights[0].touchdownVs).toBe(-100);
    expect((await visit(`/v1/pilots/${handle}/flights/${shown}`)).statusCode).toBe(200);
    expect((await visit(`/v1/pilots/${handle}/flights/${shown}/track`)).statusCode).toBe(200);
    for (const id of [hidden, open]) {
      expect((await visit(`/v1/pilots/${handle}/flights/${id}`)).statusCode).toBe(404);
      expect((await visit(`/v1/pilots/${handle}/flights/${id}/track`)).statusCode).toBe(404);
    }
  });

  it("never shows another pilot's flight under a profile", async () => {
    const { handle } = await publicPilot();
    const other = await newTrackerPilot(app);
    const theirs = await fly(other);
    expect((await visit(`/v1/pilots/${handle}/flights/${theirs}`)).statusCode).toBe(404);
    const hide = await app.inject({
      method: "PUT",
      url: `/v1/flights/${theirs}/visibility`,
      headers: (await publicPilot()).pilot.tracker,
      payload: { hiddenOnProfile: true },
    });
    expect(hide.statusCode).toBe(404);
  });

  it("leaks no private data: e-mail, account id, tracker version, SimBrief id", async () => {
    const { pilot, handle } = await publicPilot({ simbriefId: "secret_simbrief" });
    const flightId = await fly(pilot);
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { cookie: pilot.cookie },
    });
    const { id, email } = me.json().user;
    const bodies = [
      (await visit(`/v1/pilots/${handle}`)).body,
      (await visit(`/v1/pilots/${handle}/flights`)).body,
      (await visit(`/v1/pilots/${handle}/flights/${flightId}`)).body,
      (await visit(`/v1/pilots/${handle}/routes`)).body,
      (await visit("/v1/pilots")).body,
    ].join("\n");
    for (const secret of [id, email, "secret_simbrief", "trackerVersion", "pilotId"]) {
      expect(bodies).not.toContain(secret);
    }
  });

  it("groups the flights by route for the map, placed by their trajectory", async () => {
    const { pilot, handle } = await publicPilot();
    await fly(pilot);
    await fly(pilot);
    await fly(pilot, { closed: false });
    const { routes } = (await visit(`/v1/pilots/${handle}/routes`)).json();
    expect(routes).toEqual([
      {
        from: { icao: "LFPG", lat: 49, lon: 2.5 },
        to: { icao: "LFBO", lat: 44, lon: 1.5 },
        flights: 2,
        category: "narrowBody",
      },
    ]);
  });

  it("lists public profiles only, for the site map", async () => {
    const { handle } = await publicPilot();
    const off = await newTrackerPilot(app);
    const offHandle = uniqueHandle();
    await saveProfile(off, { handle: offHandle });
    const handles = (await visit("/v1/pilots"))
      .json()
      .pilots.map((p: { handle: string }) => p.handle);
    expect(handles).toContain(handle);
    expect(handles).not.toContain(offHandle);
  });
});

describe("profile photo (spec J4)", () => {
  const upload = (pilot: Pilot, body: Buffer, type = "image/png") =>
    app.inject({
      method: "PUT",
      url: "/v1/me/profile/photo",
      headers: { cookie: pilot.cookie, "content-type": type },
      payload: body,
    });
  const photoUpdatedAt = async (pilot: Pilot): Promise<string | null> =>
    (
      await app.inject({ method: "GET", url: "/v1/me/profile", headers: { cookie: pilot.cookie } })
    ).json().photoUpdatedAt;

  it("dates each photo change, so that the site changes the photo's address", async () => {
    const pilot = await newTrackerPilot(app);
    const png = (background: string) =>
      sharp({ create: { width: 4, height: 4, channels: 3, background } })
        .png()
        .toBuffer();
    await upload(pilot, await png("red"));
    const first = await photoUpdatedAt(pilot);
    expect(first).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await upload(pilot, await png("blue"));
    const second = await photoUpdatedAt(pilot);
    expect(Date.parse(second ?? "")).toBeGreaterThan(Date.parse(first ?? ""));
    await app.inject({
      method: "DELETE",
      url: "/v1/me/profile/photo",
      headers: { cookie: pilot.cookie },
    });
    expect(await photoUpdatedAt(pilot)).toBeNull();
  });

  it("stores a square 256 px WebP without metadata, public only with the profile", async () => {
    const { pilot, handle } = await publicPilot();
    const png = await sharp({
      create: { width: 800, height: 400, channels: 3, background: "#4fd1e8" },
    })
      .png()
      .withMetadata({ exif: { IFD0: { Copyright: "secret-author" } } })
      .toBuffer();
    expect((await upload(pilot, png)).statusCode).toBe(204);

    const photo = await visit(`/v1/pilots/${handle}/photo`);
    expect(photo.headers["content-type"]).toBe("image/webp");
    const meta = await sharp(photo.rawPayload).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 256, height: 256 });
    expect(meta.exif).toBeUndefined();
    expect(photo.rawPayload.includes("secret-author")).toBe(false);

    await saveProfile(pilot, { handle, isPublic: false });
    expect((await visit(`/v1/pilots/${handle}/photo`)).statusCode).toBe(404);
    const own = await app.inject({
      method: "GET",
      url: "/v1/me/profile/photo",
      headers: { cookie: pilot.cookie },
    });
    expect(own.statusCode).toBe(200);
  });

  it("refuses a file that is not an image, and lets the pilot remove the photo", async () => {
    const { pilot, handle } = await publicPilot();
    expect((await upload(pilot, Buffer.from("not an image"))).statusCode).toBe(422);
    expect((await upload(pilot, Buffer.from("x"), "text/plain")).statusCode).toBe(415);
    const gif = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } })
      .gif()
      .toBuffer();
    expect((await upload(pilot, gif, "image/png")).statusCode).toBe(422);

    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } })
      .png()
      .toBuffer();
    await upload(pilot, png);
    await app.inject({
      method: "DELETE",
      url: "/v1/me/profile/photo",
      headers: { cookie: pilot.cookie },
    });
    expect((await visit(`/v1/pilots/${handle}/photo`)).statusCode).toBe(404);
  });
});
