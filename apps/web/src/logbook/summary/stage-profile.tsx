import type { TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { flightLevel } from "../../format/flight-format.ts";
import { phaseProfile } from "./phase-profile.ts";
import { STAGE_COLORS } from "./stage-colors.ts";

/** Drawing box; the SVG is stretched to the card width at a fixed height. */
const [W, H] = [1000, 100];

/**
 * Altitude profile of the last flight, one colour per stage (maquette v6, C), and below it each
 * stage with its duration, then the highest level (a list, readable on phones too).
 */
export function StageProfile({ points }: { points: TrackView["points"] }) {
  const t = useTranslations("Logbook.summary.stages");
  const profile = phaseProfile(points, { width: W, height: H });
  if (!profile) return null;
  return (
    <figure className="m-0 mt-4">
      <svg
        viewBox={`0 -4 ${W} ${H + 4}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t("label")}
        className="block h-24 w-full"
      >
        {profile.spans.map((span) => (
          <g key={`${span.stage}-${span.x}`}>
            <path d={span.area} fill={STAGE_COLORS[span.stage]} opacity={0.16} />
            <path
              d={span.line}
              fill="none"
              stroke={STAGE_COLORS[span.stage]}
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
        {profile.spans.map((span) => (
          <span key={`${span.stage}-${span.x}`} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: STAGE_COLORS[span.stage] }}
            />
            <b className="font-semibold text-ink">{t(span.stage)}</b>
            {t("minutes", { minutes: Math.round(span.durationS / 60) })}
          </span>
        ))}
        <span className="ml-auto">
          {t("top", {
            level: flightLevel(profile.top.altFt) ?? `${Math.round(profile.top.altFt)} ft`,
          })}
        </span>
      </figcaption>
    </figure>
  );
}
