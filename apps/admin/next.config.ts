import type { NextConfig } from "next";

const config: NextConfig = {
  // Shared formats and components are TypeScript sources, compiled by the console like its own code.
  transpilePackages: ["@weems/contrats", "@weems/ui"],
  reactStrictMode: true,
  // The Next.js badge would hide the bottom of the sidebar (État local).
  devIndicators: false,
  // Agent context lives in CLAUDE.md, not in a generated AGENTS.md.
  agentRules: false,
  // Home page images (page Personnalisation) go through a server action: 15 MB at most, plus the form.
  experimental: {
    serverActions: { bodySizeLimit: "16mb" },
    proxyClientMaxBodySize: "16mb",
  },
};

export default config;
