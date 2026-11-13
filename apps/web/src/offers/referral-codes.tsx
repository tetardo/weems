import type { ReferralCode } from "@weems/contrats";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CopyCodeButton } from "./copy-code-button.tsx";

/** One code: used (by whom), expired, or ready to copy as a code or as a sign-up link. */
function CodeLine({ code, now }: { code: ReferralCode; now: number }) {
  const t = useTranslations("Offers.plan");
  const format = useFormatter();
  const locale = useLocale();
  const expired = code.usedAt === null && Date.parse(code.expiresAt) <= now;
  const state = code.usedAt
    ? t("usedBy", { name: code.usedBy ?? t("someone") })
    : expired
      ? t("expired")
      : t("validUntil", {
          date: format.dateTime(new Date(code.expiresAt), { dateStyle: "medium" }),
        });
  const open = code.usedAt === null && !expired;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-3 first:border-t-0">
      <span
        className={`font-mono font-semibold tracking-wider ${open ? "" : "text-muted line-through"}`}
      >
        {code.code}
      </span>
      <span className="text-sm text-muted">{state}</span>
      {open && (
        <span className="ml-auto flex gap-2">
          <CopyCodeButton text={code.code} label={t("copyCode")} />
          <CopyCodeButton text={`/${locale}/signup?code=${code.code}`} path label={t("copyLink")} />
        </span>
      )}
    </li>
  );
}

/** Founder's referral codes: each gives some months of Pilot Pro to a new pilot. */
export function ReferralCodes({ codes, now }: { codes: readonly ReferralCode[]; now: number }) {
  const t = useTranslations("Offers.plan");
  if (codes.length === 0) return null;
  const months = codes[0]?.months ?? 0;
  return (
    <section className="rounded-panel border border-line bg-surface p-5">
      <h2 className="m-0 text-[1.15em]">{t("referralTitle")}</h2>
      <p className="mt-1 mb-3 text-sm text-muted">{t("referralLead", { months })}</p>
      <ul className="m-0 list-none p-0">
        {codes.map((code) => (
          <CodeLine key={code.code} code={code} now={now} />
        ))}
      </ul>
    </section>
  );
}
