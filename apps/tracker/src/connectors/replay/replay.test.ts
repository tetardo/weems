import { describe, expect, it } from "vitest";
import { sample } from "../../core/testing/sample.ts";
import { ReplayConnector } from "./replay-connector.ts";
import { parseReplay, type Replay, serializeReplay } from "./replay-format.ts";

const replay: Replay = {
  header: { format: "weems-replay", version: 1, source: "synthetic", seed: 1 },
  records: [
    {
      type: "aircraft",
      t: 0,
      data: {
        simulator: "replay",
        title: "A320",
        model: null,
        registration: null,
        engineCount: 2,
        emptyWeightKg: null,
      },
    },
    { type: "sample", t: 0, data: sample({ t: 0 }) },
    { type: "event", t: 20, data: { t: 20, type: "paused" } },
    { type: "sample", t: 40, data: sample({ t: 40 }) },
  ],
};

describe("replay format", () => {
  it("reads back what it writes", () => {
    expect(parseReplay(serializeReplay(replay))).toEqual(replay);
  });

  it("names the faulty line", () => {
    const text = serializeReplay(replay).replace('"type":"paused"', '"type":"unknown"');
    expect(() => parseReplay(text)).toThrow(/line 4/);
  });

  it("refuses a file without the weems-replay header", () => {
    expect(() => parseReplay('{"format":"other"}\n')).toThrow();
  });
});

describe("replay connector", () => {
  const played = async (connector: ReplayConnector) => {
    const seen: string[] = [];
    connector.onStatus((s) => seen.push(s));
    connector.onAircraft(() => seen.push("aircraft"));
    connector.onSample((s) => seen.push(`sample@${s.t}`));
    connector.onEvent((e) => seen.push(e.type));
    await connector.start();
    return seen;
  };
  const expected = ["connected", "aircraft", "sample@0", "paused", "sample@40", "disconnected"];

  it("plays every record in order, instantly", async () => {
    expect(await played(new ReplayConnector(replay))).toEqual(expected);
  });

  it("plays in the same order with real delays", async () => {
    expect(await played(new ReplayConnector(replay, 10))).toEqual(expected);
  });

  it("ends start() at once when stopped during a wait, without playing the rest", async () => {
    const connector = new ReplayConnector(replay, 0.01); // 2 s between records
    const playing = played(connector);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await connector.stop();
    expect(await playing).toEqual(["connected", "aircraft", "sample@0", "disconnected"]);
  });
});
