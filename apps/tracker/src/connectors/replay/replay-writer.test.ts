import { describe, expect, it } from "vitest";
import { generateFlight } from "../../../tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../../../tools/generate-flights/scenario.ts";
import { parseReplay } from "./replay-format.ts";
import { ReplayConnector } from "./replay-connector.ts";
import { ReplayWriter } from "./replay-writer.ts";

describe("replay writer", () => {
  it("writes a recording that replays the same flight", async () => {
    const flight = generateFlight(LFPG_LFBO);
    const shifted = {
      ...flight,
      records: flight.records.map((r) => ({ ...r, t: r.t + 50_000 })), // monotonic clock ≠ 0
    };
    for (const r of shifted.records) if (r.type !== "aircraft") r.data = { ...r.data, t: r.t };
    let text = "";
    const connector = new ReplayConnector(shifted);
    new ReplayWriter((line) => (text += line)).attach(connector);
    await connector.start();

    const recorded = parseReplay(text);
    expect(recorded.header.source).toBe("msfs");
    expect(recorded.records).toHaveLength(flight.records.length);
    const firstTimed = flight.records.find((r) => r.type !== "aircraft")?.t ?? 0;
    expect(recorded.records.map((r) => r.t)).toEqual(
      flight.records.map((r) => Math.max(0, r.t - firstTimed)),
    );
  });
});
