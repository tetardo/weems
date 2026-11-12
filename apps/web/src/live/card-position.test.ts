import { describe, expect, it } from "vitest";
import { CARD_WIDTH, cardPosition } from "./card-position.ts";

describe("hover card position", () => {
  it("sits right of the aircraft, slightly above it", () => {
    expect(cardPosition({ x: 400, y: 300 }, 1440)).toEqual({ left: 428, top: 240 });
  });

  it("goes left of the aircraft when it would leave the map on the right", () => {
    expect(cardPosition({ x: 1300, y: 300 }, 1440)).toEqual({
      left: 1300 - 28 - CARD_WIDTH,
      top: 240,
    });
  });

  it("stays below the floating bar", () => {
    expect(cardPosition({ x: 400, y: 50 }, 1440).top).toBe(84);
  });
});
