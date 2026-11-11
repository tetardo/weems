import type { PositionReport } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import type { ApiClient } from "./api-client.ts";
import { PositionQueue } from "./position-queue.ts";

const report = (seq: number, at = "2026-11-11T08:00:00.000Z"): PositionReport => ({
  seq,
  at,
  lat: 46,
  lon: 2,
  altMsl: 35000,
  gs: 450,
  heading: 190,
  vs: 0,
  phase: "CRUISE",
  onGround: false,
});
const NOW = Date.parse("2026-11-11T08:00:05.000Z");

function api(answer: () => number | "down") {
  const sent: number[] = [];
  const client: ApiClient = {
    post: async (_path, body) => {
      const status = answer();
      if (status === "down") throw new Error("down");
      sent.push((body as PositionReport).seq);
      return { status };
    },
  };
  return { client, sent };
}

describe("position queue", () => {
  it("waits until the flight is opened, then sends every position in order", async () => {
    const { client, sent } = api(() => 200);
    const queue = new PositionQueue(client);
    [1, 2, 3].forEach((seq) => queue.push("f", report(seq)));
    await queue.flush(NOW, () => false);
    expect(sent).toEqual([]);
    await queue.flush(NOW, () => true);
    expect(sent).toEqual([1, 2, 3]);
  });

  it("keeps positions while the API is down and sends them when it is back", async () => {
    let down = true;
    const { client, sent } = api(() => (down ? "down" : 200));
    const queue = new PositionQueue(client);
    queue.push("f", report(1));
    await queue.flush(NOW, () => true);
    down = false;
    await queue.flush(NOW, () => true);
    expect(sent).toEqual([1]);
  });

  it("drops positions older than 30 s, but always keeps the newest", async () => {
    const { client, sent } = api(() => 200);
    const queue = new PositionQueue(client);
    queue.push("f", report(1, "2026-11-11T07:00:00.000Z"));
    queue.push("f", report(2, "2026-11-11T07:00:10.000Z"));
    await queue.flush(NOW, () => true);
    expect(sent).toEqual([2]);
  });
});
