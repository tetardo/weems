import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { SiteShell } from "../../../site/site-shell.tsx";

/** Pages open to everyone, indexed (spec J4): the public profiles. */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  return <SiteShell loggedIn={await hasSession()}>{children}</SiteShell>;
}
