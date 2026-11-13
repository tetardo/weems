import type { BoardingFlight, LivePilot } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { flightHref } from "./board-links.ts";

const ID = "0197a000-0000-7000-8000-000000000001";
const PILOT: LivePilot = { handle: "lara", name: "Lara Frei", country: "CH", hasPhoto: false };
const flight = (extra: Partial<BoardingFlight>) =>
  ({ flightId: ID, pilot: PILOT, closed: false, ...extra }) as BoardingFlight;

describe("Boarding links", () => {
  it("opens an open flight on its page with a public pilot, on the live map otherwise", () => {
    expect(flightHref(flight({}))).toBe(`/pilots/lara/flights/${ID}`);
    expect(flightHref(flight({ pilot: null }))).toBe(`/live?flight=${ID}`);
  });

  it("opens a closed flight on its public page, only with a public pilot", () => {
    expect(flightHref(flight({ closed: true }))).toBe(`/pilots/lara/flights/${ID}`);
    expect(flightHref(flight({ closed: true, pilot: null }))).toBeNull();
  });
});
