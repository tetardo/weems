"use client";

import { FormField } from "@weems/ui";
import { useState } from "react";
import { createBatch } from "../../actions/offers.ts";
import type { ActionResult } from "../../actions/result.ts";
import { NumberField } from "../../ui/number-field.tsx";

const DAY_MS = 86_400_000;

type Run = (action: () => Promise<ActionResult<string>>) => Promise<boolean>;

/** Fields of a new batch: 20 codes of 3 months, valid 90 days by default. */
function useBatch(run: Run) {
  const [label, setLabel] = useState("");
  const [months, setMonths] = useState(3);
  const [count, setCount] = useState(20);
  const [expiresOn, setExpiresOn] = useState(() =>
    new Date(Date.now() + 90 * DAY_MS).toISOString().slice(0, 10),
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const expiresAt = new Date(`${expiresOn}T23:59:59.000Z`).toISOString();
    if (await run(() => createBatch({ label: label.trim(), months, count, expiresAt })))
      setLabel("");
  }
  return {
    fields: { label, months, count, expiresOn },
    set: { setLabel, setMonths, setCount, setExpiresOn },
    submit,
  };
}

/**
 * « Nouveau lot »: single-use WEEMS-XXXX-XXXX codes for a partner (club, event), outside the 500
 * founder places. The CSV is downloaded from the table once made.
 */
export function BatchForm({ busy, run }: { busy: boolean; run: Run }) {
  const { fields, set, submit } = useBatch(run);
  return (
    <form className="panel oc-batch" onSubmit={(event) => void submit(event)}>
      <h3>Nouveau lot de codes</h3>
      <div className="oc-fields">
        <FormField
          label="Pour qui"
          placeholder="Aéroclub virtuel LFML"
          minLength={2}
          maxLength={80}
          value={fields.label}
          onChange={(e) => set.setLabel(e.target.value)}
        />
        <NumberField
          label="Pilot Pro offert"
          unit="mois"
          min={1}
          max={24}
          value={fields.months}
          onChange={set.setMonths}
        />
        <NumberField
          label="Nombre de codes"
          unit="codes"
          min={1}
          max={500}
          value={fields.count}
          onChange={set.setCount}
        />
        <FormField
          label="Valables jusqu'au"
          type="date"
          value={fields.expiresOn}
          onChange={(e) => set.setExpiresOn(e.target.value)}
        />
      </div>
      <div className="oc-submit">
        <span className="muted">Usage unique, hors quota des 500 fondateurs, sans badge.</span>
        <button className="btn" type="submit" disabled={busy}>
          Créer le lot
        </button>
      </div>
    </form>
  );
}
