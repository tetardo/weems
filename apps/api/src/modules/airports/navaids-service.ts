import { distanceNm, type Navaid, type NavaidsQuery } from "@weems/contrats";

/** At most this many aids in one answer: a map around an airport never needs more. */
const MAX_NAVAIDS = 200;

/** Radio aids around a point (decision 023), from the list read at start-up. */
export class NavaidsService {
  private readonly navaids: readonly Navaid[];

  constructor(navaids: readonly Navaid[]) {
    this.navaids = navaids;
  }

  /** The aids within the radius, nearest first. A scan of ~11 000 aids: well under a millisecond. */
  near({ lat, lon, radiusNm }: NavaidsQuery): Navaid[] {
    return this.navaids
      .map((navaid) => ({ navaid, distance: distanceNm(lat, lon, navaid.lat, navaid.lon) }))
      .filter(({ distance }) => distance <= radiusNm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_NAVAIDS)
      .map(({ navaid }) => navaid);
  }
}
