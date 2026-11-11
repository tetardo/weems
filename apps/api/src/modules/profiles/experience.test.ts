import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { experienceOf } from "./experience.ts";

describe("experience by aircraft category", () => {
  it("is empty without flights", () => {
    expect(experienceOf([])).toEqual({
      categories: [],
      singleEngine: { airborneS: 0, flights: 0 },
      multiEngine: { airborneS: 0, flights: 0 },
    });
  });

  it("gives one line per flown category, most airborne time first", () => {
    const { categories } = experienceOf([
      publicFlight({ category: "light", model: "C172", blockS: 1800, vs: -300 }),
      publicFlight({ category: "light", model: "DR40", blockS: 1800, vs: -100 }),
      publicFlight({ category: "light", model: "C172", blockS: 1800, vs: null }),
      publicFlight({ category: "narrowBody", model: "A20N", blockS: 7200, vs: -150 }),
      publicFlight({ category: null, model: "ZZZZ" }),
    ]);
    expect(categories).toEqual([
      {
        category: "narrowBody",
        airborneS: 6600,
        flights: 1,
        types: ["A20N"],
        averageTouchdownVs: -150,
        bestLanding: expect.objectContaining({ touchdownVs: -150 }) as unknown,
      },
      {
        category: "light",
        airborneS: 3600,
        flights: 3,
        types: ["C172", "DR40"],
        averageTouchdownVs: -200,
        bestLanding: expect.objectContaining({ touchdownVs: -100 }) as unknown,
      },
    ]);
  });

  it("keeps the three most flown types", () => {
    const models = ["C172", "C172", "PA28", "PA28", "DR40", "DR40", "SR22"];
    const { categories } = experienceOf(
      models.map((model) => publicFlight({ category: "light", model })),
    );
    expect(categories[0]?.types).toEqual(["C172", "PA28", "DR40"]);
  });

  it("splits single- and multi-engine time, engineless aircraft in neither", () => {
    const experience = experienceOf([
      publicFlight({ engines: 1, blockS: 1600 }),
      publicFlight({ engines: 2, blockS: 3600 }),
      publicFlight({ engines: 4, blockS: 3600 }),
      publicFlight({ engines: 0, blockS: 3600 }),
    ]);
    expect(experience.singleEngine).toEqual({ airborneS: 1000, flights: 1 });
    expect(experience.multiEngine).toEqual({ airborneS: 6000, flights: 2 });
  });
});
