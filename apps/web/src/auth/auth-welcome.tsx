import { useTranslations } from "next-intl";
import { RouteDial } from "./route-dial.tsx";

const DESTINATIONS = ["community", "logbook", "airline"] as const;

/**
 * Left half of the login and sign-up pages (maquette du 13/11): always dark, airport plan
 * behind, welcome title, the heading dial, then the three places one account opens.
 */
export function AuthWelcome({ title }: { title: string }) {
  const t = useTranslations("Auth.welcome");
  return (
    <section className="airport-plan-panel hidden flex-col border-r border-auth-line bg-auth-panel px-16 pt-18 pb-11 text-auth-ink lg:flex">
      <span className="font-mono text-xs tracking-[.16em] text-auth-faint uppercase">
        {t("eyebrow")}
      </span>
      <h2 className="mt-4.5 mb-0 font-title text-[44px] leading-[1.05] font-semibold tracking-[-.02em]">
        {title}
      </h2>
      <p className="mt-3.5 mb-0 max-w-[460px] text-base text-auth-muted">{t("lead")}</p>
      <div className="my-2.5 flex flex-1 items-center">
        <RouteDial label={t("dial")} />
      </div>
      <ol className="m-0 grid list-none grid-cols-3 border-t border-auth-line p-0">
        {DESTINATIONS.map((key, index) => (
          <li
            key={key}
            className="flex gap-3 pt-4.5 pr-4.5 [&+li]:border-l [&+li]:border-auth-line [&+li]:pl-4.5"
          >
            <span className="font-mono text-xs leading-[1.6] text-flight-1">{`0${index + 1}`}</span>
            <div>
              <b className="block text-[14.5px] font-semibold whitespace-nowrap">
                {t(`${key}.title`)}
                {key === "airline" && (
                  <em className="ml-1.5 rounded-tag border border-auth-line px-1.5 align-[2px] font-mono text-[10.5px] font-medium tracking-[.08em] text-auth-muted uppercase not-italic">
                    {t("soon")}
                  </em>
                )}
              </b>
              <small className="mt-0.5 block text-[13px] leading-[1.45] text-auth-faint">
                {t(`${key}.text`)}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
