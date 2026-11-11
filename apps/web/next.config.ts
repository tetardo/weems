import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const config: NextConfig = {
  // Shared formats are TypeScript sources, compiled by the site like its own code.
  transpilePackages: ["@weems/contrats"],
  reactStrictMode: true,
  // Agent context lives in CLAUDE.md, not in a generated AGENTS.md.
  agentRules: false,
};

/** Translations: messages/*.json, loaded by src/i18n/request.ts. */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(config);
