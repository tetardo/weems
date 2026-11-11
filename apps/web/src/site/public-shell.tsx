import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { FloatingBar } from "./floating-bar.tsx";
import { OtherLanguage } from "./top-bar.tsx";

/** Way into Weems: the logbook when logged in, else login and sign-up (mock-up J4). */
function Entry({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("Site.public");
  if (loggedIn) {
    return (
      <Link href="/flights" className={buttonClass("primary")}>
        {t("logbook")}
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className={buttonClass("ghost")}>
        {t("login")}
      </Link>
      <Link href="/signup" className={`${buttonClass("primary")} max-sm:hidden`}>
        {t("signup")}
      </Link>
    </>
  );
}

/**
 * Frame of the public pages (spec J4): the same floating bar as the pilot's pages, without tabs
 * nor dock; language, then the way into Weems.
 */
export function PublicShell({ loggedIn, children }: { loggedIn: boolean; children: ReactNode }) {
  return (
    <div className="app-glow flex min-h-screen flex-col">
      <FloatingBar
        account={
          <>
            <OtherLanguage />
            <Entry loggedIn={loggedIn} />
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
