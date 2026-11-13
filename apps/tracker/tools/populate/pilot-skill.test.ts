import { describe, expect, it } from "vitest";
import { drawTouchdownVs } from "../generate-flights/navigation/vertical-profile.ts";
import { seededRandom } from "../generate-flights/random.ts";
import { careerSkills, drawFailure, hobbySkills } from "./pilot-skill.ts";

const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1] ?? 0;

describe("skill of a fictitious pilot", () => {
  it("lands a beginner firmer than an expert", () => {
    const random = seededRandom(1);
    const sink = (skill: number) =>
      median(Array.from({ length: 2000 }, () => -drawTouchdownVs(random, skill)));
    expect(sink(0.1)).toBeGreaterThan(sink(0.9) * 1.5);
  });

  it("spoils about 5 % of an average pilot's flights, more for a beginner", () => {
    const random = seededRandom(2);
    const rate = (skill: number) =>
      Array.from({ length: 5000 }, () => drawFailure(skill, random)).filter(Boolean).length / 5000;
    expect(rate(0.5)).toBeGreaterThan(0.035);
    expect(rate(0.5)).toBeLessThan(0.065);
    expect(rate(0.1)).toBeGreaterThan(rate(0.9) * 2);
  });

  it("improves over the flights, a Légende ending far above an Élève", () => {
    const hobby = hobbySkills(30, seededRandom(3));
    expect(hobby.at(-1)).toBeGreaterThan(hobby[0] ?? 1);
    expect(careerSkills(700, "legend").at(-1)).toBeGreaterThan(0.9);
    expect(careerSkills(2, "student").at(-1)).toBeLessThan(0.3);
  });
});
