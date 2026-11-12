"use client";

import type { ReactNode } from "react";
import { WarningIcon } from "./icons.ts";

/** Confirmation of an action that cannot be undone from the console (stop the base, delete…). */
export function ConfirmDialog(props: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="scrim" onClick={props.onCancel} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}>
        <div className="mi">
          <WarningIcon size={22} />
        </div>
        <h2>{props.title}</h2>
        {props.children}
        <div className="ma">
          <button className="btn ghost" onClick={props.onCancel} disabled={props.busy}>
            Annuler
          </button>
          <button className="btn dangerfill" onClick={props.onConfirm} disabled={props.busy}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
