"use client";

import type { PortHolder } from "../../server/services/service-view.ts";
import { InfoIcon, StartIcon } from "../../ui/icons.ts";

/**
 * A program holds the port of a service that does not answer (choice of Greg, 11/11/2026): a
 * Weems launch can be stopped from here, after a confirmation; any other program is only named.
 */
export function PortHolderNote(props: { holder: PortHolder; busy: boolean; onFree: () => void }) {
  if (!props.holder.freeable) return <div className="errbox">{props.holder.message}</div>;
  return (
    <>
      <div className="note">
        <InfoIcon size={14} /> {props.holder.message}
      </div>
      <div className="row">
        <button className="btn sm ghost" disabled={props.busy} onClick={props.onFree}>
          <StartIcon size={15} /> Libérer le port et démarrer
        </button>
      </div>
    </>
  );
}
