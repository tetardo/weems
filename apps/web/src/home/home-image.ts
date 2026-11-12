import type { HomeFocus, HomeImages, HomeTheme } from "@weems/contrats";

/** A background of the home page: the image and what its crop keeps. */
export interface HomeBackground {
  src: string;
  /** CSS background-position. */
  position: string;
}

/**
 * Image shipped with the site (spec J4 accueil, decision 1): home-made image of the Weems fleet,
 * given by Greg on 12/11/2026 with the right to publish it. Its Weems aircraft is on the left.
 */
const DEFAULT_IMAGE = { src: "/home/default.jpg", focus: "left" } as const;

/** Horizontal position of the crop for each focus (spec J4 personnalisation). */
const POSITION: Record<HomeFocus, string> = {
  left: "28% center",
  center: "center",
  right: "72% center",
};

/**
 * The background of each theme: the image set from the admin console, read from the API, or the
 * one shipped with the site.
 */
export function homeBackgrounds(
  images: HomeImages | null,
  apiUrl: string,
): Record<HomeTheme, HomeBackground> {
  const of = (theme: HomeTheme): HomeBackground => {
    const image = images?.[theme];
    return image
      ? { src: new URL(image.path, apiUrl).toString(), position: POSITION[image.focus] }
      : { src: DEFAULT_IMAGE.src, position: POSITION[DEFAULT_IMAGE.focus] };
  };
  return { light: of("light"), dark: of("dark") };
}
