import type { ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import type { PositionReport } from "@weems/contrats";
import type { LiveFlightInfo } from "../flights/live-feed.ts";
import { LiveBoard } from "./live-board.ts";
import { LiveStream, MAX_BUFFERED_BYTES } from "./stream.ts";

/** A spectator connection without a network: records what it is sent. */
function fakeClient(writableLength = 0) {
  const client = {
    writableLength,
    sent: [] as string[],
    destroyed: false,
    writeHead: () => client,
    write: (chunk: string) => client.sent.push(chunk) > 0,
    on: () => client,
    end: () => undefined,
    destroy: () => {
      client.destroyed = true;
    },
  };
  return client;
}

const info: LiveFlightInfo = {
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS101",
  aircraftTitle: "Airbus A320neo",
  aircraftModel: "A20N",
  aircraftClass: { category: "narrowBody", estimated: false },
  departureIcao: "LFLL",
  plannedArrivalIcao: "LFMN",
};
const report = (seq: number): PositionReport => ({
  seq,
  at: "2026-11-11T08:00:00.000Z",
  lat: 45,
  lon: 6,
  altMsl: 24000,
  gs: 400,
  heading: 140,
  vs: 0,
  phase: "CRUISE",
  onGround: false,
});

function boardWithOnePosition(): LiveBoard {
  const board = new LiveBoard();
  board.position(info, report(1));
  return board;
}

describe("LiveStream with many spectators (spec J4)", () => {
  it("serialises an update once, whatever the number of spectators (H1)", () => {
    const board = boardWithOnePosition();
    const stream = new LiveStream(board);
    const clients = [fakeClient(), fakeClient(), fakeClient()];
    clients.forEach((c) => stream.connect(c as unknown as ServerResponse));
    const stringify = vi.spyOn(JSON, "stringify");
    stream.broadcastUpdate();
    expect(stringify).toHaveBeenCalledTimes(1);
    stringify.mockRestore();
    expect(new Set(clients.map((c) => c.sent.at(-1))).size).toBe(1);
  });

  it("cuts off a spectator too far behind, and keeps sending to the others (H2)", () => {
    const board = boardWithOnePosition();
    const stream = new LiveStream(board);
    const slow = fakeClient(MAX_BUFFERED_BYTES + 1);
    const fine = fakeClient();
    [slow, fine].forEach((c) => stream.connect(c as unknown as ServerResponse));
    stream.broadcastUpdate();
    expect(slow.destroyed).toBe(true);
    expect(slow.sent).toHaveLength(1); // the snapshot only
    expect(fine.sent).toHaveLength(2);
    expect(stream.clientCount).toBe(1);
  });
});
