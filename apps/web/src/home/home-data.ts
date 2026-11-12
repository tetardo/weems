import type { HomeImages, SiteStats } from "@weems/contrats";
import { getHomeImages, getSiteStats } from "../api/public-api.ts";

/** The home must show even when the API is down or busy: then null, and the page falls back. */
async function orNull<T>(read: () => Promise<T | null>): Promise<T | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

/** Counters of the home page; null: the board shows dashes instead of numbers. */
export const homeStats = (): Promise<SiteStats | null> => orNull(getSiteStats);

/** Images set from the console; null: the image shipped with the site. */
export const homeImages = (): Promise<HomeImages | null> => orNull(getHomeImages);
