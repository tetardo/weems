import type { ReactNode } from "react";
import { FloatingBar } from "./floating-bar.tsx";
import { LanguageChoice } from "./language-choice.tsx";
import { SiteAccount } from "./site-account.tsx";
import { SiteFooter } from "./site-footer.tsx";
import { SiteMenu } from "./site-menu.tsx";
import { SiteNav } from "./site-nav.tsx";
import { ThemeToggle } from "./theme-toggle.tsx";

interface Props {
  loggedIn: boolean;
  /** Pilot pages and the live map: no footer. */
  footer?: boolean;
  children: ReactNode;
}

/**
 * Frame of every page (decision 003, bar v2 of spec J4 accueil): the pages after the logo; on the
 * right the way in or the pilot's menu, the theme and FR | EN; footer P2 on public pages.
 */
export function SiteShell({ loggedIn, footer = true, children }: Props) {
  return (
    <div className="app-glow flex min-h-screen flex-col">
      <FloatingBar
        nav={<SiteNav loggedIn={loggedIn} />}
        account={
          <>
            <SiteAccount loggedIn={loggedIn} />
            <span aria-hidden="true" className="mx-1 h-7 w-px bg-line max-md:hidden" />
            <ThemeToggle />
            <LanguageChoice />
            <SiteMenu loggedIn={loggedIn} />
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      {footer && <SiteFooter />}
    </div>
  );
}
