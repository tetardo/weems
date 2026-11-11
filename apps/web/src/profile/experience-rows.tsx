import { AircraftCategory, type CategoryExperience } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../aircraft/category-badge.tsx";
import { CategoryDot } from "../aircraft/category-dot.tsx";
import { CATEGORY_FILL } from "../aircraft/category-tone.ts";
import { formatDuration } from "../format/flight-format.ts";

const COLUMNS =
  "grid grid-cols-[1fr_auto_auto] gap-x-3.5 gap-y-1 md:grid-cols-[minmax(150px,1.1fr)_1fr_96px_92px]";

/** One flown category: name and types, bar against the most flown, average touchdown, hours. */
function Row({ line, max, total }: { line: CategoryExperience; max: number; total: number }) {
  const t = useTranslations("Profile.experience");
  const categories = useTranslations("Aircraft.categories");
  const format = useFormatter();
  const share = format.number(total === 0 ? 0 : line.airborneS / total, { style: "percent" });
  return (
    <li className={`${COLUMNS} items-center border-t border-line py-2.5 first:border-t-0`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5">
          <CategoryDot category={line.category} />
        </span>
        <div>
          <b className="block font-semibold">{categories(line.category)}</b>
          <small className="block text-xs text-muted">{line.types.join(", ")}</small>
        </div>
      </div>
      <div className="col-span-full row-start-2 h-2 overflow-hidden rounded-full bg-line md:col-span-1 md:row-start-auto">
        <i
          className={`block h-full rounded-full ${CATEGORY_FILL[line.category]}`}
          style={{ width: `${max === 0 ? 0 : (line.airborneS / max) * 100}%` }}
        />
      </div>
      <div className="text-right tabular-nums">
        <b className="block font-semibold">
          {line.averageTouchdownVs === null
            ? "—"
            : format.number(Math.round(line.averageTouchdownVs))}
        </b>
        <span className="text-[11.5px] text-muted">{t("fpm")}</span>
      </div>
      <div className="text-right tabular-nums">
        <b className="block font-title text-[17px]">{formatDuration(line.airborneS)}</b>
        <span className="text-xs whitespace-nowrap text-muted">
          {t("flightsShare", { flights: line.flights, share })}
        </span>
      </div>
    </li>
  );
}

/** Lines of the block, most flown first, then the categories not flown yet. */
export function ExperienceRows({ lines }: { lines: readonly CategoryExperience[] }) {
  const t = useTranslations("Profile.experience");
  const total = lines.reduce((sum, line) => sum + line.airborneS, 0);
  const max = Math.max(0, ...lines.map((line) => line.airborneS));
  const flown = new Set(lines.map((line) => line.category));
  const notYet = AircraftCategory.options.filter((category) => !flown.has(category));
  return (
    <>
      <div
        className={`${COLUMNS} mt-3 hidden text-[11.5px] tracking-wide text-muted uppercase md:grid`}
      >
        <i />
        <i />
        <span className="text-right">{t("average")}</span>
        <span className="text-right">{t("hours")}</span>
      </div>
      <ul className="m-0 list-none p-0">
        {lines.map((line) => (
          <Row key={line.category} line={line} max={max} total={total} />
        ))}
      </ul>
      {notYet.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-3 text-[12.5px] text-muted">
          <span>{t("notYet")}</span>
          {notYet.map((category) => (
            <span key={category} className="opacity-55">
              <CategoryBadge aircraftClass={{ category, estimated: false }} />
            </span>
          ))}
        </div>
      )}
    </>
  );
}
