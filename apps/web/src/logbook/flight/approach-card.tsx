import type { TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { ArrivalIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
import {
  type ApproachGeometry,
  approachGeometry,
  SINK_FLOOR,
  STABLE_SINK,
} from "./approach-geometry.ts";

/** Drawing units: the SVG is stretched to fill its box (Greg, 13/11: every chart fills it). */
const SIZE = { width: 1000, heightBand: [6, 110], sinkBand: [130, 250] } as const;
const HEIGHT_COLOR = "var(--color-accent)";
const SINK_COLOR = "var(--color-accent-2)";

/** The two curves, the stable sink rates behind; stretched to its box. */
function ApproachDrawing({ shape, label }: { shape: ApproachGeometry; label: string }) {
  const line = { fill: "none", strokeWidth: 2, vectorEffect: "non-scaling-stroke" } as const;
  return (
    <svg
      viewBox={`0 0 ${SIZE.width} ${SIZE.sinkBand[1]}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="block min-h-48 w-full flex-1 rounded-control border border-line bg-bg"
    >
      <rect
        x={0}
        width={SIZE.width}
        y={shape.stable.y}
        height={shape.stable.height}
        className="fill-success/15"
      />
      <line
        x1={0}
        x2={SIZE.width}
        y1={SIZE.sinkBand[0]}
        y2={SIZE.sinkBand[0]}
        className="stroke-line"
        vectorEffect="non-scaling-stroke"
      />
      <path d={shape.heightArea} style={{ fill: HEIGHT_COLOR }} opacity={0.16} />
      <path d={shape.heightLine} style={{ stroke: HEIGHT_COLOR }} {...line} />
      <path d={shape.sinkLine} style={{ stroke: SINK_COLOR }} {...line} />
    </svg>
  );
}

/** What each colour is. */
function ApproachLegend({ topAgl }: { topAgl: number }) {
  const t = useTranslations("Logbook.flight.approach");
  return (
    <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] text-muted">
      <span style={{ color: HEIGHT_COLOR }}>{t("height", { top: Math.round(topAgl) })}</span>
      <span style={{ color: SINK_COLOR }}>{t("sink", { floor: SINK_FLOOR })}</span>
      <span className="text-success">
        {t("stable", { from: -STABLE_SINK.from, to: -STABLE_SINK.to })}
      </span>
    </div>
  );
}

/**
 * « Dernière approche »: height above the ground and vertical speed over the three minutes before
 * the touchdown, the stable sink rates in green behind (provisional criteria).
 */
export function ApproachCard({
  points,
  touchdownAt,
}: {
  points: TrackView["points"];
  touchdownAt: string | null;
}) {
  const t = useTranslations("Logbook.flight.approach");
  const shape =
    touchdownAt === null
      ? null
      : approachGeometry(points, touchdownAt, {
          width: SIZE.width,
          heightBand: [...SIZE.heightBand],
          sinkBand: [...SIZE.sinkBand],
        });
  return (
    <LogbookCard
      icon={ArrivalIcon}
      title={t("title")}
      aside={t("aside")}
      className="flex h-full flex-col"
    >
      {shape ? (
        <>
          <ApproachDrawing shape={shape} label={t("title")} />
          <ApproachLegend topAgl={shape.topAgl} />
        </>
      ) : (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      )}
    </LogbookCard>
  );
}
