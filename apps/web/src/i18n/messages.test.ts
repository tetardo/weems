import {
  CloseReason,
  FeatureGroup,
  FeatureKey,
  FLIGHT_PHASES,
  FlightAlert,
  FlightEventType,
  PlanId,
} from "@weems/contrats";
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

/** Every key path of a messages file, e.g. "Flight.header.date". */
function keys(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("translations (spec J2, criterion 5)", () => {
  it("has the same texts in French and English", () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });

  it.each([
    ["Phases", FLIGHT_PHASES],
    ["Events", FlightEventType.options],
    ["Alerts", FlightAlert.options],
    ["Status", [...CloseReason.options, "open"]],
    // Page Offres (decision 015): every feature of the shared list has its label.
    ["Plans.features", FeatureKey.options.map((key) => `${key}.label`)],
    ["Plans.names", PlanId.options],
    ["Plans.descriptions", PlanId.options],
    ["Plans.groups", FeatureGroup.options],
    // Page Fonctionnalités: every feature of the catalogue is explained, every group introduced.
    ["Features.items", FeatureKey.options.flatMap((key) => [`${key}.title`, `${key}.text`])],
    ["Features.groups", FeatureGroup.options],
  ] as const)("translates every value shown under %s", (namespace, values) => {
    for (const value of values) expect(keys(fr)).toContain(`${namespace}.${value}`);
  });
});
