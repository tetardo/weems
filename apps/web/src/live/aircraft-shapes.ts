import { AircraftCategory } from "@weems/contrats";

/** Silhouette families of the live map: one per kind of aircraft, nose up, on a 32 × 32 grid. */
type Family = "light" | "turboprop" | "businessJet" | "airliner" | "helicopter" | "glider";

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;

/** SVG paths, drawn with Path2D on the map's canvas. */
export const SHAPES: Readonly<Record<Family, string>> = {
  light: `M14.5 4Q16 1.5 17.5 4Z${rect(14.5, 4, 3, 23)}${rect(2, 10, 28, 5)}${rect(10, 23, 12, 3.5)}`,
  turboprop: `M14.5 4Q16 .5 17.5 4Z${rect(14.5, 4, 3, 24)}${rect(1, 12, 30, 4.5)}${rect(6.5, 8, 4, 11)}${rect(21.5, 8, 4, 11)}${rect(10, 24, 12, 3.5)}`,
  businessJet:
    "M16 2L17.3 4L17.6 13L26 18L26 19.5L17.5 17.5L17.3 22L19.5 23L21 22.5L21 25L17 26L16 28L15 26L11 25L11 22.5L12.5 23L14.7 22L14.5 17.5L6 19.5L6 18L14.4 13L14.7 4Z",
  airliner:
    "M16 2L18 12L30 18L30 20L18 17L17.5 26L21 29L21 30L16 28.5L11 30L11 29L14.5 26L14 17L2 20L2 18L14 12Z",
  helicopter: `M16 5.5C20.5 5.5 21 11 21 13.5C21 17.5 18.5 19.5 16 19.5C13.5 19.5 11 17.5 11 13.5C11 11 11.5 5.5 16 5.5Z${rect(15, 18, 2, 11)}${rect(11.5, 27, 9, 2)}`,
  glider: `M15 5Q16 2.5 17 5Z${rect(15, 5, 2, 22)}${rect(0.5, 12, 31, 2.6)}${rect(11.5, 23.5, 9, 2.5)}`,
};

/** Rotor disc drawn around the helicopter silhouette. */
export const ROTOR = { x: 16, y: 12.5, radius: 13 } as const;

const FAMILY: Readonly<Record<AircraftCategory, Family>> = {
  light: "light",
  turboprop: "turboprop",
  businessJet: "businessJet",
  regionalJet: "airliner",
  narrowBody: "airliner",
  wideBody: "airliner",
  helicopter: "helicopter",
  other: "glider",
};

/** Airliners grow from regional to wide-body; unknown aircraft keep the size of a narrow-body. */
const SCALE: Readonly<Record<AircraftCategory, number>> = {
  light: 0.85,
  turboprop: 0.95,
  businessJet: 0.85,
  regionalJet: 0.9,
  narrowBody: 1,
  wideBody: 1.25,
  helicopter: 0.95,
  other: 0.9,
};

export const familyOf = (category: AircraftCategory | null): Family =>
  category ? FAMILY[category] : "airliner";

export const scaleOf = (category: AircraftCategory | null): number =>
  category ? SCALE[category] : 1;

/** Image name on the map: colour of the category, grey when the signal is lost. */
export function iconNameOf(category: AircraftCategory | null, lost: boolean): string {
  return lost ? `aircraft-lost-${familyOf(category)}` : `aircraft-${category ?? "unknown"}`;
}

/** Every image the map needs: one per category and per lost family, plus unknown aircraft. */
export function iconNames(): { name: string; category: AircraftCategory | null; lost: boolean }[] {
  const categories = [...AircraftCategory.options, null];
  const coloured = categories.map((category) => ({ category, lost: false }));
  const families = new Map(categories.map((category) => [familyOf(category), category]));
  const lost = [...families.values()].map((category) => ({ category, lost: true }));
  return [...coloured, ...lost].map((icon) => ({
    ...icon,
    name: iconNameOf(icon.category, icon.lost),
  }));
}
