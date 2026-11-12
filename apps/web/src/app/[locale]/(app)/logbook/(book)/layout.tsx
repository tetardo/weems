import type { ReactNode } from "react";
import { LogbookShell } from "../../../../../logbook/logbook-shell.tsx";
import { getMyFeatures } from "../../../../../plans/my-features.ts";

/** Every page of the private logbook, in its frame (menu, tabs on phones). */
export default async function LogbookLayout({ children }: { children: ReactNode }) {
  const { plan } = await getMyFeatures();
  return <LogbookShell plan={plan}>{children}</LogbookShell>;
}
