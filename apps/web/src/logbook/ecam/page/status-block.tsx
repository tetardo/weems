import type { FlightBands as Bands, FlightView } from "@weems/contrats";
import { formatDuration } from "../../../format/flight-format.ts";
import type { LandingDetails } from "../../flight/landing-details.ts";
import { grouped } from "../ecam-values.ts";
import { flightStatus } from "./flight-status.ts";

type Item = [label: string, value: string | null, unit: string, amber?: boolean];

const signed = (n: number) => (n > 0 ? `+${grouped(n)}` : grouped(n));

/** The flight in figures at the top of the screen, cockpit style (maquette v3, validated 14/11). */
export function StatusBlock({
  flight,
  bands,
  landing,
}: {
  flight: FlightView;
  bands: Bands;
  landing: LandingDetails | null;
}) {
  const s = flightStatus(flight, bands, landing);
  const items: Item[] = [
    ["BLOC", formatDuration(s.blockS), "H"],
    ["DIST", grouped(s.distanceNm), "NM"],
    ["FUEL", s.fuelKg === null ? null : grouped(s.fuelKg), "KG"],
    ["TD V/S", s.touchdownVs === null ? null : signed(s.touchdownVs), "FT/MN"],
    ["TD G", s.touchdownG === null ? null : s.touchdownG.toFixed(2), "G"],
    ["BANK MAX", s.bankMax === null ? null : String(Math.round(s.bankMax)), "°"],
    ["IAS <FL100", s.iasLow === null ? null : String(Math.round(s.iasLow)), "KT", s.iasLowMarked],
  ];
  return (
    <dl className="m-0 mb-2.5 grid grid-cols-2 rounded-control border border-ecam-edge sm:grid-cols-4 lg:grid-cols-7">
      {items.map(([label, value, unit, amber]) => (
        <div key={label} className="border-ecam-edge px-2.5 py-1.5 lg:border-l lg:first:border-l-0">
          <dt className="text-[11px] tracking-[.06em] text-ecam-cyan">{label}</dt>
          <dd
            className={`m-0 text-[15px] ${value === null ? "text-ecam-dim" : amber ? "text-ecam-amber" : "text-ecam-green"}`}
          >
            {value ?? "---"}
            {value !== null && <small className="ml-1 text-[11px] text-ecam-cyan">{unit}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
