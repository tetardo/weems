import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { Brand } from "./brand.tsx";
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
 * Frame of the public pages (spec J4): no side menu, a top bar with the brand, the language and
 * the way into Weems.
 */
export function PublicShell({ loggedIn, children }: { loggedIn: boolean; children: ReactNode }) {
  const t = useTranslations("Site");
  return (
    <div className="flex min-h-screen flex-col bg-bg pt-13">
      <nav className="fixed inset-x-0 top-0 z-30 flex h-13 items-center gap-1 border-b border-line bg-surface px-4 text-sm">
        <Brand name={t("name")} />
        <div className="ml-auto flex items-center gap-1">
          <OtherLanguage />
          <Entry loggedIn={loggedIn} />
        </div>
      </nav>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
