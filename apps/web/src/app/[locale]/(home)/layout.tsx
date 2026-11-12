import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { PublicShell } from "../../../site/public-shell.tsx";

/** The home page, open to everyone (spec J4 accueil): the public bar floats over the image. */
export default async function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell loggedIn={await hasSession()} overlay>
      {children}
    </PublicShell>
  );
}
