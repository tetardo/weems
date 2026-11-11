import { ALPHA_TARGETS, type AlphaReport } from "./alpha-report.ts";

const mark = (ok: boolean) => (ok ? "OK  " : "NON ");
const percent = (share: number | null) =>
  share === null ? "aucun vol vérifié" : `${(share * 100).toFixed(1)} %`;

/** The alpha report as Greg reads it in the terminal (French, one criterion per line). */
export function formatAlphaReport(report: AlphaReport, since: Date): string {
  const { checks } = report;
  return [
    `Alpha J3 — vols ouverts depuis le ${since.toISOString().slice(0, 10)}`,
    "",
    `Vols : ${report.flights} dont ${report.closedFlights} terminés`,
    `Vols ouverts depuis plus de 24 h (clôture jamais reçue) : ${report.staleFlights}`,
    `Vols terminés sans trajectoire : ${report.closedWithoutTrack}`,
    `Phases vérifiées par les pilotes : ${report.reviewed} (${report.correct} justes)`,
    "",
    "Critère de sortie :",
    `${mark(checks.pilots)} pilotes ayant terminé un vol : ${report.pilots} / ${ALPHA_TARGETS.pilots}`,
    `${mark(checks.flights)} vols terminés : ${report.closedFlights} / ${ALPHA_TARGETS.flights}`,
    `${mark(checks.noLostFlight)} aucun vol perdu : ${report.staleFlights + report.closedWithoutTrack} suspect(s)`,
    `${mark(checks.phases)} phases justes : ${percent(report.correctShare)} (seuil ${ALPHA_TARGETS.correctShare * 100} %)`,
    "",
    report.passed ? "Critère atteint." : "Critère pas encore atteint.",
    "",
  ].join("\n");
}
