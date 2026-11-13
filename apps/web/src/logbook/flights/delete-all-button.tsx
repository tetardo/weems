"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@weems/ui";
import { DeleteIcon } from "../../ui/icons.ts";
import { deleteAllAction } from "./delete-all-action.ts";

/** Clears the test flights, after confirmation. Shown in development only (see flights-header.tsx). */
export function DeleteAllButton() {
  const t = useTranslations("Flights");
  const [pending, start] = useTransition();
  const onClick = () => {
    if (window.confirm(t("deleteAllConfirm"))) start(() => deleteAllAction());
  };
  return (
    <Button variant="danger" onClick={onClick} disabled={pending} title={t("deleteAllHint")}>
      <DeleteIcon size={18} aria-hidden="true" />
      {t("deleteAll")}
    </Button>
  );
}
