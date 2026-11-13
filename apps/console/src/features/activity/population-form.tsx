"use client";

import { Field, Segmented } from "@weems/ui";
import { useState } from "react";
import { elapsed } from "../../format/time.ts";
import {
  type ActivityLaunch,
  estimatedSeconds,
  plannedFlights,
} from "../../server/activity/launch.ts";
import { CalendarIcon, PopulationIcon, SimulateIcon } from "../../ui/icons.ts";
import { NumberField } from "../../ui/number-field.tsx";
import { Foot, type FormProps, Header } from "./form-parts.tsx";

const MONTHS = [1, 6, 12] as const;
const MONTH_OPTIONS = MONTHS.map((m) => ({ value: String(m), label: `${m} mois` }));

type Population = Extract<ActivityLaunch, { kind: "population" }>;
type Change = <K extends keyof Population>(key: K, value: Population[K]) => void;

/** « Couvrir les 9 grades »: the first 9 accounts each fly the career of one pilot rank. */
function CareersCheck(props: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="act-check">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span>
        Couvrir les 9 grades
        <small className="muted">
          Les 9 premiers comptes, publics, ont chacun la carrière d&apos;un grade, d&apos;Élève à
          Légende (des milliers d&apos;heures de vol à rejouer)
        </small>
      </span>
    </label>
  );
}

function PopulationFields({ launch, set }: { launch: Population; set: Change }) {
  return (
    <div className="fields two">
      <NumberField
        label="Comptes fictifs"
        value={launch.accounts}
        min={1}
        max={500}
        unit="1 à 500"
        onChange={(n) => set("accounts", n)}
      />
      <div className="range">
        <NumberField
          label="Vols par compte"
          value={launch.minFlights}
          min={1}
          max={200}
          onChange={(n) => set("minFlights", n)}
        />
        <NumberField
          label="jusqu'à"
          value={launch.maxFlights}
          min={1}
          max={200}
          unit="vols"
          onChange={(n) => set("maxFlights", n)}
        />
      </div>
      <Field label="Historique sur">
        <Segmented
          name="months"
          label="Historique sur"
          options={MONTH_OPTIONS}
          value={String(launch.months)}
          onChange={(value) => set("months", Number(value) as Population["months"])}
        />
      </Field>
      <NumberField
        label="Profils publics"
        value={launch.publicPercent}
        min={0}
        max={100}
        unit="%"
        onChange={(n) => set("publicPercent", n)}
      />
      <CareersCheck checked={launch.careers} onChange={(on) => set("careers", on)} />
    </div>
  );
}

function PopulationSummary({ launch }: { launch: Population }) {
  const { flights, hours } = plannedFlights(launch);
  return (
    <div className="sum">
      <div className="r">
        <PopulationIcon size={16} />
        <span>
          <b>{launch.accounts} comptes</b> marqués fictifs, e-mails en{" "}
          <span className="mono">@fictif.weems.local</span>, {launch.publicPercent} % de profils
          publics
        </span>
      </div>
      <div className="r">
        <SimulateIcon size={16} />
        <span>
          <b>≈ {flights} vols</b> ({hours} h) de 21 types d&apos;avions, notés, avec trajectoire,
          comptés pour les grades
        </span>
        <span className="m">≈ {elapsed(estimatedSeconds(hours) * 1000)}</span>
      </div>
      <div className="r">
        <CalendarIcon size={16} />
        <span>Sur {launch.months} mois, surtout le soir, le matin et le week-end</span>
      </div>
    </div>
  );
}

/** Block 1, « reste en base »: the accounts and their past flights (pnpm populate create). */
export function PopulationForm(props: FormProps & { existing: number }) {
  const [launch, setLaunch] = useState<Population>({
    kind: "population",
    accounts: 50,
    minFlights: 5,
    maxFlights: 40,
    months: 6,
    publicPercent: 75,
    careers: true,
  });
  const set: Change = (key, value) => setLaunch((before) => ({ ...before, [key]: value }));
  const note =
    props.existing > 0 && !props.disabled
      ? `Remplace la population existante (${props.existing} comptes).`
      : props.note;
  return (
    <section className="panel mode">
      <Header
        icon={<PopulationIcon size={20} />}
        step="1 · RESTE EN BASE"
        title="Population fictive"
      />
      <p className="lead">
        Des comptes et leurs vols passés. Ils restent jusqu&apos;à ce que tu les supprimes.
      </p>
      <PopulationFields launch={launch} set={set} />
      <PopulationSummary launch={launch} />
      <Foot
        note={note}
        disabled={props.disabled || launch.minFlights > launch.maxFlights}
        label="Créer la population"
        onClick={() => props.onLaunch(launch)}
      />
    </section>
  );
}
