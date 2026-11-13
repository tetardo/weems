"use client";

import { Button, TextInput } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "../i18n/navigation.ts";
import { GiftIcon } from "../ui/icons.ts";
import { redeemAction } from "./redeem-action.ts";
import type { RedeemState } from "./redeem-outcome.ts";

/** Message under the field once the API answered. */
function Outcome({ state }: { state: RedeemState }) {
  const t = useTranslations("Offers.redeem");
  const format = useFormatter();
  if (state.status === "idle") return null;
  if (state.status === "done") {
    const { months, proUntil, ambassador } = state.result;
    const until = format.dateTime(new Date(proUntil), { dateStyle: "long" });
    return (
      <div
        role="status"
        className="rounded-control border border-success/50 bg-success/10 p-3 text-sm"
      >
        <p className="m-0 font-semibold">{t("done", { months, until })}</p>
        {ambassador && <p className="m-0 mt-1 text-muted">{t("thanks", { name: ambassador })}</p>}
        <Link href="/settings/plan" className="mt-2 inline-block font-semibold text-link">
          {t("seePlan")}
        </Link>
      </div>
    );
  }
  return (
    <p role="alert" className="m-0 text-sm text-danger">
      {t(`errors.${state.status}`)}
    </p>
  );
}

/** Field of the page /code, filled from ?code= (ambassador page, referral link). */
export function RedeemForm({ code }: { code: string }) {
  const t = useTranslations("Offers.redeem");
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemAction, {
    status: "idle",
  });
  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm text-muted">{t("label")}</span>
        <TextInput
          icon={GiftIcon}
          name="code"
          defaultValue={code}
          placeholder="WEEMS-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          maxLength={24}
          required
          className="font-mono tracking-wider uppercase"
        />
      </label>
      <Button type="submit" disabled={pending || state.status === "done"}>
        {t("submit")}
      </Button>
      <Outcome state={state} />
    </form>
  );
}
