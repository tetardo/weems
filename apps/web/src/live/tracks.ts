import type { LiveFlight } from "@weems/contrats";
import type { FeatureCollection } from "geojson";
import { iconNameOf, scaleOf } from "./aircraft-shapes.ts";
import { type DrawnPosition, interpolate } from "./interpolate.ts";
import type { LiveFlights } from "./flights-store.ts";

/** Time to glide to a new position: the API sends batches every 2 s. */
const GLIDE_MS = 2_000;

interface Track {
  from: DrawnPosition;
  to: DrawnPosition;
  startMs: number;
  flight: LiveFlight;
}

const target = (flight: LiveFlight): DrawnPosition => ({
  lat: flight.position.lat,
  lon: flight.position.lon,
  heading: flight.position.heading,
});

/** Where each aircraft is drawn, gliding from its last drawn point to its newest position. */
export class Tracks {
  private readonly tracks = new Map<string, Track>();

  update(flights: LiveFlights, nowMs: number): void {
    for (const id of this.tracks.keys()) if (!flights.has(id)) this.tracks.delete(id);
    for (const [id, flight] of flights) {
      const track = this.tracks.get(id);
      if (track?.flight === flight) continue;
      const from = track ? this.drawnAt(track, nowMs) : target(flight);
      this.tracks.set(id, { from, to: target(flight), startMs: nowMs, flight });
    }
  }

  /** GeoJSON for the map source at time `nowMs`. */
  features(nowMs: number, selectedId: string | null): FeatureCollection {
    return {
      type: "FeatureCollection",
      features: [...this.tracks.values()].map((track) => {
        const at = this.drawnAt(track, nowMs);
        const lost = track.flight.signal === "lost";
        const category = track.flight.aircraftClass?.category ?? null;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [at.lon, at.lat] },
          properties: {
            flightId: track.flight.flightId,
            callsign: track.flight.callsign,
            heading: at.heading,
            icon: iconNameOf(category, lost),
            scale: scaleOf(category),
            selected: track.flight.flightId === selectedId,
          },
        };
      }),
    };
  }

  /** Where the aircraft of `flightId` is drawn at `nowMs`; undefined when it is not on the map. */
  positionOf(flightId: string, nowMs: number): DrawnPosition | undefined {
    const track = this.tracks.get(flightId);
    return track && this.drawnAt(track, nowMs);
  }

  private drawnAt(track: Track, nowMs: number): DrawnPosition {
    return interpolate(track.from, track.to, (nowMs - track.startMs) / GLIDE_MS);
  }
}
