import type { ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import type { Boarding } from "@weems/contrats";
import { BoardingStream } from "./boarding-stream.ts";

/** A spectator connection without a network: records what it is sent. */
function fakeClient() {
  const client = {
    writableLength: 0,
    sent: [] as string[],
    writeHead: () => client,
    write: (chunk: string) => client.sent.push(chunk) > 0,
    on: () => client,
    end: () => undefined,
    destroy: () => undefined,
  };
  return client;
}

const empty = (generatedAt: string): Boarding => ({ generatedAt, departures: [], arrivals: [] });

describe("BoardingStream (spec web Boarding)", () => {
  it("sends the boards on connection, then only when they change", () => {
    let board = empty("2026-11-13T08:00:00.000Z");
    const stream = new BoardingStream(() => board);
    const client = fakeClient();
    stream.connect(client as unknown as ServerResponse);
    expect(client.sent).toHaveLength(1);
    expect(client.sent[0]).toMatch(/^event: board\n/);

    stream.tick();
    board = empty("2026-11-13T08:00:02.000Z");
    stream.tick();
    expect(client.sent).toHaveLength(2);

    board = { ...board, departures: [{ flightId: "x" } as Boarding["departures"][number]] };
    stream.tick();
    expect(client.sent).toHaveLength(3);
  });

  it("builds nothing while nobody watches", () => {
    let reads = 0;
    const stream = new BoardingStream(() => {
      reads += 1;
      return empty("2026-11-13T08:00:00.000Z");
    });
    stream.tick();
    expect(reads).toBe(0);
  });
});
