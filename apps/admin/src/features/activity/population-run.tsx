import type { PopulationProgress, PopulationResult } from "@weems/contrats";
import { elapsed } from "../../format/time.ts";
import { DoneIcon, FailureIcon, SuccessIcon } from "../../ui/icons.ts";

const STEPS: { step: PopulationProgress["step"]; label: string }[] = [
  { step: "cleaning", label: "Ancienne population supprimée" },
  { step: "accounts", label: "Comptes fictifs et profils créés" },
  { step: "flights", label: "Vols passés rejoués par le tracker (simulateur replay)" },
  { step: "check", label: "Vérification : profils, compteurs et graphiques remplis" },
];

function count({ done, total }: { done: number; total: number }) {
  return `${done} / ${total}`;
}

function detailOf(step: PopulationProgress["step"], progress: PopulationProgress) {
  if (step === "accounts") return count(progress.accounts);
  if (step !== "flights") return null;
  const { done, total } = progress.flights;
  const left = progress.flightsPerS > 0 ? (total - done) / progress.flightsPerS : null;
  return (
    <>
      <span className="bar3">
        <i style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
      </span>
      {count(progress.flights)}
      {left !== null && <span className="hide">· encore ≈ {elapsed(left * 1000)}</span>}
    </>
  );
}

/** Steps of `pnpm populate create`, the current one with its progress. */
export function PopulationSteps({ progress }: { progress: PopulationProgress | null }) {
  const current = STEPS.findIndex((s) => s.step === (progress?.step ?? "cleaning"));
  return (
    <div className="steps">
      {STEPS.map(({ step, label }, index) => {
        const state = index < current ? "done" : index === current ? "cur" : "wait";
        return (
          <div className={`stp ${state}`} key={step}>
            <span className="k">{state === "done" ? <DoneIcon size={14} /> : index + 1}</span>
            <span>{label}</span>
            <span className="x">{state === "cur" && progress && detailOf(step, progress)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Check(props: { ok: boolean; label: string; value: string }) {
  return (
    <div className="ci">
      <span className={props.ok ? "okc" : "koc"}>
        {props.ok ? <SuccessIcon size={16} /> : <FailureIcon size={16} />}
      </span>
      {props.label}
      <span className="v">{props.value}</span>
    </div>
  );
}

/** What the API holds at the end, checked. */
export function PopulationChecks({ result }: { result: PopulationResult }) {
  const { flights, filledProfiles } = result;
  return (
    <div className="crit">
      <Check
        ok
        label={`${result.accounts} comptes fictifs, ${result.publicProfiles} profils publics`}
        value={elapsed(result.durationS * 1000)}
      />
      <Check
        ok={flights.done === flights.total}
        label="Vols passés enregistrés par l'API"
        value={count(flights)}
      />
      <Check
        ok={filledProfiles.done === filledProfiles.total}
        label="Profils publics avec compteurs et graphiques remplis"
        value={count(filledProfiles)}
      />
    </div>
  );
}
