"use client";

import { useSyncExternalStore } from "react";
import { currentMapTheme, type MapTheme, mapTheme } from "./map-theme.ts";

/** Calls `changed` when the theme button changes data-theme on <html>. */
function subscribe(changed: () => void): () => void {
  const watch = new MutationObserver(changed);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => watch.disconnect();
}

/**
 * Colours of the map for what is drawn next to it in HTML (a legend), following the theme
 * button; dark on the server, as the map's first theme.
 */
export function useMapTheme(): MapTheme {
  return useSyncExternalStore(subscribe, currentMapTheme, () => mapTheme(true));
}
