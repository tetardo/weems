import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { AppShell } from "../../../site/app-shell.tsx";
import { PublicShell } from "../../../site/public-shell.tsx";
import { TopBar } from "../../../site/top-bar.tsx";

/** Pages of a logged-in pilot: never indexed (spec J4 référencement). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Pages of a logged-in pilot, under the floating bar. The live map is also open to visitors (spec
 * J4 accueil): without session, the public bar instead (the proxy lets no other page through).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await hasSession())) {
    return (
      <PublicShell loggedIn={false} footer={false}>
        {children}
      </PublicShell>
    );
  }
  return <AppShell account={<TopBar />}>{children}</AppShell>;
}
