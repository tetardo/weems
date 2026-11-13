import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { config } from "../server/console.ts";
import { Sidebar } from "../site/sidebar.tsx";
import { THEME_SCRIPT } from "../site/theme.ts";
import { MobileTabs, TopBar } from "../site/top-bar.tsx";
import "./global.css";

/** Fonts of the mock-ups (GameLab look), self-hosted by Next.js. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: "700", variable: "--font-grotesk" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = { title: "Weems Admin", robots: { index: false } };

/**
 * Navigation G (spec admin): one full-width top band (logo, breadcrumb, actions), fixed while
 * scrolling, the labelled sidebar under it; bottom tabs on a phone.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  const { apiUrl, siteUrl } = config();
  return (
    // data-theme is set by THEME_SCRIPT before React runs: the attribute differs from the server.
    <html
      lang="fr"
      className={`${inter.variable} ${grotesk.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <TopBar siteUrl={siteUrl} />
        <Sidebar apiUrl={apiUrl} siteUrl={siteUrl} />
        <div className="main">
          <main className="content">{children}</main>
        </div>
        <MobileTabs />
      </body>
    </html>
  );
}
