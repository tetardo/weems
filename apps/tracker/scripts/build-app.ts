import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

/**
 * Builds the desktop tracker into dist/app (J3): one bundle per Electron process, the window files,
 * and a package.json without dependencies (everything is bundled; SQLite is the one built into
 * Electron). WEEMS_TRACKER_API_URL: the API written into the app.
 */
const root = join(import.meta.dirname, "..");
const out = join(root, "dist", "app");
const app = join(root, "src", "app");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
};
const apiUrl = process.env["WEEMS_TRACKER_API_URL"] ?? "http://localhost:3000";

const node = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  external: ["electron"],
  logLevel: "warning",
} as const;

await build({
  ...node,
  entryPoints: [join(app, "main.ts")],
  outfile: join(out, "main.cjs"),
  define: { WEEMS_DEFAULT_API_URL: JSON.stringify(apiUrl) },
});
await build({ ...node, entryPoints: [join(app, "preload.ts")], outfile: join(out, "preload.cjs") });
await build({
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "chrome140",
  entryPoints: [join(app, "window", "view.ts")],
  outfile: join(out, "window", "view.js"),
  logLevel: "warning",
});
for (const file of ["index.html", "window.css"]) {
  copyFileSync(join(app, "window", file), join(out, "window", file));
}
mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "package.json"),
  JSON.stringify(
    { name: "weems-tracker", productName: "Weems Tracker", version, main: "main.cjs" },
    null,
    2,
  ),
);
process.stdout.write(`dist/app built (version ${version}, API ${apiUrl})\n`);
