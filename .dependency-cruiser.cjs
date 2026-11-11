/**
 * Module boundary rules. They make the architecture in docs/ enforceable:
 * a violation fails `pnpm check` and the CI.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make modules impossible to understand or test alone.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment: "A file nobody imports is dead code (entry points and tests excepted).",
      from: {
        orphan: true,
        pathNot: [
          "\\.test\\.ts$",
          "\\.config\\.(js|ts|cjs|mjs)$",
          "\\.d\\.ts$",
          "(^|/)src/(index|main|server)\\.ts$",
          "(^|/)tools/",
          "(^|/)scripts/",
          "(^|/)apps/(web|admin)/src/app/", // Next.js routes: loaded by the framework
          "(^|/)apps/(web|admin)/src/proxy\\.ts$", // Next.js proxy: loaded by the framework
        ],
      },
      to: {},
    },
    {
      name: "tracker-core-is-independent",
      severity: "error",
      comment:
        "The tracker core depends on nothing else of the tracker (connectors, storage, sender, " +
        "account, runtime, app, tools), nor on Electron or Node I/O " +
        "(docs/cahiers-des-charges/tracker/architecture-interne.md).",
      from: { path: "^apps/tracker/src/core/" },
      to: {
        path: [
          "^apps/tracker/(?!src/core/)", // anything of the tracker outside core/ (tools/ included)
          "^(node:)?(fs|net|http|https|child_process)$",
          "electron",
          "node:sqlite",
          "node-simconnect",
        ],
      },
    },
    {
      name: "only-msfs-connector-uses-simconnect",
      severity: "error",
      comment: "Only the MSFS connector may depend on SimConnect (Windows only).",
      from: { pathNot: "^apps/tracker/src/connectors/msfs/" },
      to: { path: "node-simconnect" },
    },
    {
      name: "api-repository-is-private-to-its-module",
      severity: "error",
      comment:
        "A module never reads another module's repository: it goes through that module's service.",
      from: { path: "^apps/api/src/modules/([^/]+)/" },
      to: {
        path: "^apps/api/src/modules/([^/]+)/repository",
        pathNot: "^apps/api/src/modules/$1/",
      },
    },
    {
      name: "apps-do-not-import-each-other",
      severity: "error",
      comment: "Shared code goes to packages/, never imported from another app.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/", pathNot: "^apps/$1/" },
    },
    {
      name: "packages-do-not-import-apps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(node_modules|dist|coverage|\\.next|apps/web/public)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
