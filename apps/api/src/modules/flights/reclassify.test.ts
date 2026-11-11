import { afterAll, describe, expect, it } from "vitest";
import { DEV_PILOT_ID } from "../../plugins/auth.ts";
import { connectTestDatabase } from "../../testing/database.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { reclassifyFlights } from "./reclassify.ts";
import { FlightsRepository } from "./repository.ts";

const database = connectTestDatabase();
const repository = new FlightsRepository(database.db);
afterAll(() => database.close());

describe("reclassifyFlights (pnpm reclassify)", () => {
  it("puts back the catalogue's category on flights recorded with an outdated one", async () => {
    const { open } = syntheticFlight();
    await repository.insertFlight(DEV_PILOT_ID, open, { category: "light", estimated: true });

    expect(await reclassifyFlights(repository)).toBeGreaterThanOrEqual(1);
    expect((await repository.findFlight(open.flightId))?.aircraftClass).toEqual({
      category: "narrowBody",
      estimated: false,
    });
    expect(await reclassifyFlights(repository)).toBe(0);
  });
});
