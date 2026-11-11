import type { ReactNode } from "react";
import { AppShell } from "../../../site/app-shell.tsx";
import { TopBar } from "../../../site/top-bar.tsx";

/** Pages of a logged-in pilot: side menu and top bar (Admin One layout). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell topBar={<TopBar />}>{children}</AppShell>;
}
