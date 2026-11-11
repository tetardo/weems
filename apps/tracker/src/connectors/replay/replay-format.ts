import { z } from "zod";
import { AircraftInfo, MonotonicMs, Sample, SimEvent } from "@weems/contrats";

/**
 * Replay file, JSON Lines (architecture interne, part 5). Provisional format:
 * point 3 of spec T0 will finalise it with a pilot.
 * Line 1 is the header, then records in time order; `t` = ms since recording start.
 */
const ReplayHeader = z.object({
  format: z.literal("weems-replay"),
  version: z.literal(1),
  source: z.enum(["synthetic", "msfs", "a32nx-fdr", "sky-dolly"]),
  seed: z.number().int().optional(),
  scenario: z.string().optional(),
});

export const ReplayRecord = z.discriminatedUnion("type", [
  z.object({ type: z.literal("aircraft"), t: MonotonicMs, data: AircraftInfo }),
  z.object({ type: z.literal("sample"), t: MonotonicMs, data: Sample }),
  z.object({ type: z.literal("event"), t: MonotonicMs, data: SimEvent }),
]);
export type ReplayRecord = z.infer<typeof ReplayRecord>;

export interface Replay {
  header: z.infer<typeof ReplayHeader>;
  records: ReplayRecord[];
}

export function serializeReplay(replay: Replay): string {
  return [replay.header, ...replay.records].map((line) => JSON.stringify(line)).join("\n") + "\n";
}

/**
 * The first `durationMs` of a replay. A load run that stops after 10 minutes
 * keeps 10 minutes of each flight in memory, not the whole flight (spec J4).
 */
export function replayUntil(replay: Replay, durationMs: number): Replay {
  const start = replay.records[0]?.t ?? 0;
  return { ...replay, records: replay.records.filter((r) => r.t - start <= durationMs) };
}

/** Parses and validates a replay file; the error names the faulty line. */
export function parseReplay(text: string): Replay {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const [first, ...rest] = lines;
  if (first === undefined) throw new Error("Empty replay file.");
  const header = ReplayHeader.parse(JSON.parse(first));
  const records = rest.map((line, index) => {
    const parsed = ReplayRecord.safeParse(JSON.parse(line));
    if (!parsed.success) throw new Error(`Replay line ${index + 2}: ${parsed.error.message}`);
    return parsed.data;
  });
  return { header, records };
}
