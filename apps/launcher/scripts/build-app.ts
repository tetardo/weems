import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type BuildOptions, build } from "esbuild";

/**
 * Builds the launcher into dist/app: one bundle per Electron process, the window files, and a
 * package.json without dependencies (everything is bundled). The repository it was built from is
 * written into the app: it is where the launcher finds scripts/mac/ (fiche 019).
 */
const root = join(import.meta.dirname, "..");
const repoRoot = join(root, "..", "..");
const out = join(root, "dist", "app");
const src = join(root, "src");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
};

const node: BuildOptions = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  external: ["electron"],
  logLevel: "warning",
};

await build({
  ...node,
  entryPoints: [join(src, "main.ts")],
  outfile: join(out, "main.cjs"),
  define: { WEEMS_REPO_ROOT: JSON.stringify(repoRoot) },
});
await build({ ...node, entryPoints: [join(src, "preload.ts")], outfile: join(out, "preload.cjs") });
await build({
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "chrome140",
  entryPoints: [join(src, "window", "view.ts")],
  outfile: join(out, "window", "view.js"),
  logLevel: "warning",
});
for (const file of ["index.html", "window.css"]) {
  copyFileSync(join(src, "window", file), join(out, "window", file));
}
mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "package.json"),
  JSON.stringify(
    { name: "weems-launcher", productName: "Weems", version, main: "main.cjs" },
    null,
    2,
  ),
);
process.stdout.write(`dist/app built (version ${version}, repository ${repoRoot})\n`);
