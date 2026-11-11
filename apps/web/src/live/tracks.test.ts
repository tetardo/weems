import { describe, expect, it } from "vitest";
import { fromSnapshot } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";
import { Tracks } from "./tracks.ts";

const at = (lat: number, lon: number, heading = 90) =>
  liveFlight("a", { position: { ...liveFlight("a").position, lat, lon, heading } });

const coordinates = (tracks: Tracks, nowMs: number) =>
  tracks
    .features(nowMs, null)
    .features.map((feature) => (feature.geometry as { coordinates: number[] }).coordinates);

describe("tracks", () => {
  it("draws a new flight at its position straight away", () => {
    const tracks = new Tracks();
    tracks.update(fromSnapshot({ flights: [at(45, 5)] }), 0);
    expect(coordinates(tracks, 0)).toEqual([[5, 45]]);
  });

  it("glides to a new position over two seconds", () => {
    const tracks = new Tracks();
    tracks.update(fromSnapshot({ flights: [at(45, 5)] }), 0);
    tracks.update(fromSnapshot({ flights: [at(46, 7)] }), 1_000);
    expect(coordinates(tracks, 2_000)).toEqual([[6, 45.5]]);
    expect(coordinates(tracks, 3_000)).toEqual([[7, 46]]);
  });

  it("marks lost and selected flights, and forgets removed ones", () => {
    const tracks = new Tracks();
    tracks.update(
      fromSnapshot({ flights: [liveFlight("a", { signal: "lost" }), liveFlight("b")] }),
      0,
    );
    const [first] = tracks.features(0, "a").features;
    expect(first?.properties).toMatchObject({ flightId: "a", lost: true, selected: true });
    tracks.update(fromSnapshot({ flights: [liveFlight("b")] }), 10);
    expect(tracks.features(10, null).features).toHaveLength(1);
  });
});
