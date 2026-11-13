import type { ReactNode } from "react";
import { FloatingBar } from "./floating-bar.tsx";
import { LanguageChoice } from "./language-choice.tsx";
import { LiveStatus } from "./live-status.tsx";
import { SiteAccount, VisitorOffer } from "./site-account.tsx";
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
 * Frame of every page (decision 003, bar A « Épurée » of 13/11): the pages after the logo; on the
 * right the Pilot Pro offer for a visitor, the live counter, the language, the theme, then the way
 * in or the pilot's menu. Phones: language and theme move into the menu. Footer P2 on public pages.
 */
export function SiteShell({ loggedIn, footer = true, children }: Props) {
  return (
    <div className="app-glow airport-plan flex min-h-screen flex-col">
      <FloatingBar
        nav={<SiteNav loggedIn={loggedIn} />}
        account={
          <>
            {!loggedIn && <VisitorOffer />}
            <LiveStatus />
            <LanguageChoice className="max-md:hidden" />
            <ThemeToggle className="max-md:hidden" />
            <SiteAccount loggedIn={loggedIn} />
            <SiteMenu
              loggedIn={loggedIn}
              footer={
                <div className="m-1 mt-2 flex items-center gap-1 border-t border-line pt-2">
                  <LanguageChoice />
                  <ThemeToggle />
                </div>
              }
            />
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      {footer && <SiteFooter />}
    </div>
  );
}
