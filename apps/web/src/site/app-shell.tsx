import type { ReactNode } from "react";
import { FloatingBar } from "./floating-bar.tsx";
import { MainNav } from "./main-nav.tsx";
import { MobileDock } from "./mobile-dock.tsx";

/**
 * Frame of the pages of a logged-in pilot (decision 003): floating translucent bar on top,
 * dock at the bottom on phones, content in between. `account`: right side of the bar, rendered
 * by the server.
 */
export function AppShell({ account, children }: { account: ReactNode; children: ReactNode }) {
  return (
    <div className="app-glow flex min-h-screen flex-col">
      <FloatingBar nav={<MainNav />} account={account} />
      <div className="flex flex-1 flex-col pb-24 md:pb-0">{children}</div>
      <MobileDock />
    </div>
  );
}
