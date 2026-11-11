import type { NextConfig } from "next";

const config: NextConfig = {
  // Shared formats are TypeScript sources, compiled by the site like its own code.
  transpilePackages: ["@weems/contrats"],
  reactStrictMode: true,
  // Agent context lives in CLAUDE.md, not in a generated AGENTS.md.
  agentRules: false,
};

export default config;
