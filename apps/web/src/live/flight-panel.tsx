import type { LiveFlight } from "@weems/contrats";

const PHASES_FR: Record<LiveFlight["position"]["phase"], string> = {
  BOARDING: "Embarquement",
  PUSHBACK: "Repoussage",
  TAXI_OUT: "Roulage départ",
  TAKEOFF: "Décollage",
  CLIMB: "Montée",
  CRUISE: "Croisière",
  DESCENT: "Descente",
  APPROACH: "Approche",
  FINAL: "Finale",
  LANDING: "Atterrissage",
  TAXI_IN: "Roulage arrivée",
  ARRIVED: "Arrivé",
};

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** Details of the selected flight (spec J1, part 4). */
export function FlightPanel({ flight, onClose }: { flight: LiveFlight; onClose: () => void }) {
  const { position } = flight;
  const rows: [string, string][] = [
    ["Avion", flight.aircraftTitle],
    ["Départ", flight.departureIcao ?? "—"],
    ["Arrivée", flight.plannedArrivalIcao ?? "—"],
    ["Phase", PHASES_FR[position.phase]],
    ["Altitude", `${number.format(position.altMsl)} ft`],
    ["Vitesse sol", `${number.format(position.gs)} kt`],
  ];
  return (
    <aside
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 240,
        padding: 12,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: 18 }}>{flight.callsign}</strong>
        <button type="button" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>
      {flight.signal === "lost" && (
        <p style={{ color: "#8a5a00", margin: "4px 0" }}>Signal perdu</p>
      )}
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "4px 12px",
          margin: "8px 0 0",
        }}
      >
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "contents" }}>
            <dt style={{ color: "#5b6b7b" }}>{label}</dt>
            <dd style={{ margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
