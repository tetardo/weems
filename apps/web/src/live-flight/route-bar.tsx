import { useTranslations } from "next-intl";
import { AircraftIcon } from "../ui/icons.ts";
import { pitchOf } from "./attitude.ts";

/** Lucide's plane points up and right: 45° turns it to the right, nose level. */
const LEVEL_DEG = 45;

/** The bar flown so far and the aircraft on it, nose up or down by `pitch`. */
function Track({ percent, pitch, shown }: { percent: number; pitch: number; shown: boolean }) {
  const t = useTranslations("LiveFlight");
  const attitude = t(`attitude.${pitch > 0 ? "climb" : pitch < 0 ? "descent" : "level"}`);
  return (
    <div
      role="progressbar"
      aria-label={t("progress")}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative h-7"
    >
      <span className="absolute inset-x-0 top-[13px] border-t-2 border-dashed border-line" />
      <span
        className="absolute top-3 left-0 h-1 rounded-full bg-accent"
        style={{ width: `${percent}%` }}
      />
      {shown && (
        <span
          className="absolute top-0.5 -ml-3 text-accent drop-shadow-[0_0_6px_var(--color-accent)] transition-transform duration-700"
          style={{ left: `${percent}%`, transform: `rotate(${LEVEL_DEG - pitch}deg)` }}
          title={attitude}
        >
          <AircraftIcon size={24} fill="currentColor" aria-label={attitude} />
        </span>
      )}
    </div>
  );
}

/**
 * Departure, the bar flown so far and the aircraft on it, arrival. The aircraft raises or lowers
 * its nose with the vertical speed (Greg, 13/11/2026).
 */
export function RouteBar({
  from,
  to,
  fraction,
  vs,
}: {
  from: { icao: string; note: string };
  to: { icao: string; note: string };
  fraction: number | null;
  vs: number;
}) {
  const pitch = pitchOf(vs);
  const percent = Math.round((fraction ?? 0) * 100);
  return (
    <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
      <div className="font-title text-[15px] font-bold">
        {from.icao}
        <small className="block font-sans text-[11.5px] font-normal text-muted">{from.note}</small>
      </div>
      <Track percent={percent} pitch={pitch} shown={fraction !== null} />
      <div className="text-right font-title text-[15px] font-bold">
        {to.icao}
        <small className="block font-sans text-[11.5px] font-normal text-muted">{to.note}</small>
      </div>
    </div>
  );
}
