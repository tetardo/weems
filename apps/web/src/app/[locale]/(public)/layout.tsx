import type { ReactNode } from "react";
import { hasSession } from "../../../auth/server-session.ts";
import { PublicShell } from "../../../site/public-shell.tsx";

/** Pages open to everyone, indexed (spec J4): the public profiles. */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell loggedIn={await hasSession()}>{children}</PublicShell>;
}
