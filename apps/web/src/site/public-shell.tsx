import type { ReactNode } from "react";
import { FloatingBar } from "./floating-bar.tsx";
import { LanguageChoice } from "./language-choice.tsx";
import { PublicAccount } from "./public-account.tsx";
import { PublicMenu } from "./public-menu.tsx";
import { PublicNav } from "./public-nav.tsx";
import { SiteFooter } from "./site-footer.tsx";
import { ThemeToggle } from "./theme-toggle.tsx";

interface Props {
  loggedIn: boolean;
  /** Home page: the bar floats over the full-screen image. */
  overlay?: boolean;
  /** The live map fills the screen: no footer under it. */
  footer?: boolean;
  children: ReactNode;
}

/**
 * Frame of the public pages (spec J4 accueil, bar v2): links after the logo; on the right the way
 * in, the theme and FR | EN; footer P2 at the bottom.
 */
export function PublicShell({ loggedIn, overlay = false, footer = true, children }: Props) {
  return (
    <div className="app-glow flex min-h-screen flex-col">
      <FloatingBar
        overlay={overlay}
        nav={<PublicNav />}
        account={
          <>
            <PublicAccount loggedIn={loggedIn} />
            <span aria-hidden="true" className="mx-1 h-7 w-px bg-line max-md:hidden" />
            <ThemeToggle />
            <LanguageChoice />
            <PublicMenu loggedIn={loggedIn} />
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      {footer && <SiteFooter />}
    </div>
  );
}
