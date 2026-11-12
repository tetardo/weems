import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { SiteShell } from "../../../site/site-shell.tsx";

/** The home page, open to everyone (spec J4 accueil): the public bar floats over the image. */
export default async function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell loggedIn={await hasSession()} overlay>
      {children}
    </SiteShell>
  );
}
