/**
 * Copies the MapLibre worker into public/. MapLibre 6 looks for its worker next to its own
 * module file, which no longer holds once Next.js bundles it: the page points to this copy.
 * Runs before `dev` and `build`, so the copy always matches the installed version.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const worker = createRequire(import.meta.url).resolve("maplibre-gl/dist/maplibre-gl-worker.mjs");
mkdirSync("public", { recursive: true });
copyFileSync(worker, "public/maplibre-gl-worker.mjs");
