import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "../../../site/app-shell.tsx";
import { TopBar } from "../../../site/top-bar.tsx";

/** Pages of a logged-in pilot: never indexed (spec J4 référencement). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Pages of a logged-in pilot, under the top bar. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell topBar={<TopBar />}>{children}</AppShell>;
}
