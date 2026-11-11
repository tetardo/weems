import type { ReactNode } from "react";
import { AppShell } from "../../../site/app-shell.tsx";
import { TopBar } from "../../../site/top-bar.tsx";

/** Pages of a logged-in pilot, under the floating bar. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell account={<TopBar />}>{children}</AppShell>;
}
