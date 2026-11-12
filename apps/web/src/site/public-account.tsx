import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { AccountIcon } from "../ui/icons.ts";

const iconButton = `${buttonClass("ghost")} border border-line px-0`;

/**
 * Way into Weems in the public bar (spec J4 accueil): a visitor gets « Créer un compte » and the
 * silhouette to log in; a logged-in pilot, the silhouette « Mon compte » (My flights for now).
 */
export function PublicAccount({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("Site.public");
  if (loggedIn) {
    return (
      <Link
        href="/flights"
        className={`${buttonClass("ghost")} border border-line`}
        title={t("account")}
      >
        <AccountIcon size={20} aria-hidden="true" className="text-accent" />
        <span className="max-md:sr-only">{t("account")}</span>
      </Link>
    );
  }
  return (
    <>
      <Link href="/signup" className={`${buttonClass("primary")} max-md:hidden`}>
        {t("signup")}
      </Link>
      <Link href="/login" className={iconButton} aria-label={t("login")} title={t("login")}>
        <AccountIcon size={20} aria-hidden="true" />
      </Link>
    </>
  );
}
