import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { SiteShell } from "../../../site/site-shell.tsx";

/** Pages of a logged-in pilot: never indexed (spec J4 référencement). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Pages of a logged-in pilot, under the same bar as the whole site, without footer. The live map
 * is also open to visitors (spec J4 accueil); the proxy lets no other page through without session.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell loggedIn={await hasSession()} footer={false}>
      {children}
    </SiteShell>
  );
}
