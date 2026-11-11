import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FlightEvent, OpenFlightRequest } from "@weems/contrats";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Recorder } from "../storage/recorder.ts";
import type { ApiClient } from "./api-client.ts";
import { OutboxSender } from "./outbox-sender.ts";

const flight = (n: number): OpenFlightRequest => ({
  flightId: `0197a000-0000-7000-8000-00000000000${n}`,
  callsign: "WMS1",
  aircraft: {
    simulator: "replay",
    title: "A320",
    model: null,
    registration: null,
    engineCount: 2,
    emptyWeightKg: null,
  },
  departureIcao: null,
  plannedArrivalIcao: null,
  openedAt: "2026-11-11T08:00:00.000Z",
  trackerVersion: "0.1.0",
});
const event = (seq: number): FlightEvent => ({
  seq,
  at: "2026-11-11T08:00:00.000Z",
  type: "paused",
  context: {},
});

/** Fake API answering from a script; records what it received. */
function fakeApi(answer: (path: string) => number | "down") {
  const calls: { path: string; body: unknown }[] = [];
  const api: ApiClient = {
    post: async (path, body) => {
      calls.push({ path, body });
      const status = answer(path);
      if (status === "down") throw new Error("network down");
      return { status };
    },
  };
  return { api, calls };
}

let dir: string;
let recorder: Recorder;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "weems-sender-"));
  recorder = new Recorder(join(dir, "tracker.db"));
});
afterEach(() => {
  recorder.close();
  rmSync(dir, { recursive: true, force: true });
});

const status = () =>
  recorder.db.prepare("SELECT kind, status, attempts FROM outbox ORDER BY id").all();

describe("outbox sender", () => {
  it("sends in order, merging consecutive events, and empties the outbox", async () => {
    const f = flight(1);
    recorder.open(f);
    [1, 2, 3].forEach((seq) => recorder.event(f.flightId, event(seq)));
    recorder.closeFlight(f.flightId, { closedAt: "2026-11-11T09:00:00.000Z", reason: "normal" });
    const { api, calls } = fakeApi(() => 201);
    const sender = new OutboxSender(recorder.db, api, () => 0);

    expect(await sender.drain(0)).toBe(3);
    expect(calls.map((c) => c.path)).toEqual([
      "/v1/flights",
      `/v1/flights/${f.flightId}/events`,
      `/v1/flights/${f.flightId}/close`,
    ]);
    expect(calls[1]?.body).toEqual({ events: [event(1), event(2), event(3)] });
    expect(sender.pendingCount()).toBe(0);
  });

  it("keeps a flight's messages waiting behind a failed one, retries later with a delay", async () => {
    const f = flight(1);
    recorder.open(f);
    recorder.event(f.flightId, event(1));
    let down = true;
    const { api, calls } = fakeApi(() => (down ? "down" : 201));
    const sender = new OutboxSender(recorder.db, api, () => 0);

    await sender.drain(0);
    expect(calls).toHaveLength(1);
    expect(status()).toEqual([
      { kind: "open", status: "pending", attempts: 1 },
      { kind: "events", status: "pending", attempts: 0 },
    ]);
    down = false;
    expect(await sender.drain(1_000)).toBe(0);
    expect(await sender.drain(2_000)).toBe(2);
  });

  it("does not let one flight's failure block another flight", async () => {
    const [a, b] = [flight(1), flight(2)];
    recorder.open(a);
    recorder.open(b);
    const { api } = fakeApi((path) => (path === "/v1/flights" ? 500 : 201));
    const sender = new OutboxSender(recorder.db, api, () => 0);
    await sender.drain(0);
    expect(sender.pendingCount()).toBe(2);
  });

  it("sets a 409 aside and never re-sends it", async () => {
    recorder.open(flight(1));
    const { api, calls } = fakeApi(() => 409);
    const sender = new OutboxSender(recorder.db, api, () => 0);
    await sender.drain(0);
    await sender.drain(600_000);
    expect(calls).toHaveLength(1);
    expect(status()).toEqual([{ kind: "open", status: "parked", attempts: 0 }]);
  });

  it("stops everything when the tracker is too old (426)", async () => {
    recorder.open(flight(1));
    recorder.open(flight(2));
    const { api, calls } = fakeApi(() => 426);
    const sender = new OutboxSender(recorder.db, api, () => 0);
    await sender.drain(0);
    expect(calls).toHaveLength(1);
    expect(sender.block).toBe("upgradeRequired");
    expect(await sender.drain(600_000)).toBe(0);
  });

  it("drops a live position older than 30 s", async () => {
    const { api, calls } = fakeApi(() => 200);
    const sender = new OutboxSender(recorder.db, api);
    const at = "2026-11-11T08:00:00.000Z";
    const report = {
      seq: 1,
      at,
      lat: 46,
      lon: 2,
      altMsl: 0,
      gs: 0,
      heading: 0,
      vs: 0,
      phase: "CRUISE" as const,
      onGround: false,
    };
    expect(await sender.sendPosition("f", report, Date.parse(at) + 31_000)).toBe(false);
    expect(await sender.sendPosition("f", report, Date.parse(at) + 5_000)).toBe(true);
    expect(calls).toHaveLength(1);
  });
});
