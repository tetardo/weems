import type { PilotProgress } from "@weems/contrats";
import { PHASE_LABELS } from "../../format/phases.ts";
import { StatusBadge } from "../../ui/status-badge.tsx";

const SHOWN = 12;

/** One row per simulated pilot (pnpm simulate --progress). */
export function PilotsTable({ pilots }: { pilots: PilotProgress[] }) {
  return (
    <>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Indicatif</th>
              <th>Trajet</th>
              <th>Phase</th>
              <th>Avancement</th>
              <th>En attente</th>
            </tr>
          </thead>
          <tbody>
            {pilots.slice(0, SHOWN).map((pilot) => (
              <tr key={pilot.callsign}>
                <td className="c">{pilot.callsign}</td>
                <td>
                  {pilot.departure} → {pilot.arrival}
                </td>
                <td>
                  {pilot.phase ? (
                    <StatusBadge tone="live">{PHASE_LABELS[pilot.phase]}</StatusBadge>
                  ) : (
                    <StatusBadge tone="off">Attente départ</StatusBadge>
                  )}
                </td>
                <td>
                  <span className="bar2">
                    <i style={{ width: `${Math.round(pilot.progress * 100)}%` }} />
                  </span>
                  <span className="muted">{Math.round(pilot.progress * 100)} %</span>
                </td>
                <td
                  className="mono"
                  style={{ color: pilot.pending > 0 ? "var(--accent2)" : undefined }}
                >
                  {pilot.pending}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pilots.length > SHOWN && <p className="muted">+ {pilots.length - SHOWN} autres pilotes</p>}
    </>
  );
}
